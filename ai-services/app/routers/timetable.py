import logging
import json
import os
import urllib.parse
from urllib.request import url2pathname
import pdfplumber
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.ai import AiGenericRequest
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Timetable"])

class TimetableExtractRequest(BaseModel):
    fileUrl: str

# Lazy load dependencies to save startup time and prevent crash on missing modules
ocr_instance = None
def get_ocr():
    global ocr_instance
    if ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            logger.info("Initializing PaddleOCR...")
            ocr_instance = PaddleOCR(use_angle_cls=True, lang='en')
        except Exception as e:
            logger.error(f"PaddleOCR is not installed or failed to initialize: {e}")
            raise Exception("PaddleOCR is not available.")
    return ocr_instance

def preprocess_image_for_ocr(img_array):
    import cv2
    import numpy as np
    
    # 1. Grayscale
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    
    # 2. Deskew (Auto Rotate)
    thresh = cv2.bitwise_not(cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1])
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if 0.5 < abs(angle) < 15:
            (h, w) = gray.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            
    # 3. High Resolution Rendering (2x upscale without destructive sharpening/CLAHE)
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    
    # Convert back to BGR as PaddleOCR expects 3 channels
    img_processed = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    return img_processed

def reconstruct_table_rows_by_center(items, threshold_ratio=0.4, separator=" | "):
    """
    Groups bounding boxes or words into horizontal table lines using their average Y-center.
    This guarantees zero line-snowballing and perfectly aligns PDF/OCR columns from left to right.
    items: list of dicts requiring 'text', 'y_center', 'h', and 'left'.
    """
    if not items:
        return ""
        
    items.sort(key=lambda x: x['y_center'])
    rows_list = []
    current_row = []
    current_y_center = 0.0
    
    for item in items:
        if not current_row:
            current_row.append(item)
            current_y_center = item['y_center']
            continue
            
        avg_height = sum([i['h'] for i in current_row]) / len(current_row)
        threshold = avg_height * threshold_ratio
        
        if abs(item['y_center'] - current_y_center) <= threshold:
            current_row.append(item)
            current_y_center = sum([i['y_center'] for i in current_row]) / len(current_row)
        else:
            rows_list.append(current_row)
            current_row = [item]
            current_y_center = item['y_center']
            
    if current_row:
        rows_list.append(current_row)
        
    table_text = ""
    for row in rows_list:
        row.sort(key=lambda i: i['left'])
        line_text = separator.join([item['text'] for item in row])
        table_text += line_text + "\n"
        
    return table_text

def clean_ocr_text(text: str) -> str:
    """
    Cleans and normalizes raw OCR text before passing to the Shared Timetable Parser.
    Preserves word spaces (e.g., MayankBhatt -> Mayank Bhatt), corrects common OCR typos,
    and maintains table row/column structure.
    """
    import re
    lines = text.split("\n")
    cleaned_lines = []
    
    for line in lines:
        if not line.strip():
            continue
            
        # Fix common OCR typos in academic titles, degrees, and header labels
        line = re.sub(r'\b(Praf|Prol|Prok|Pros|Proi|Prat|Prot)\.?\s*\(\s*(De|Dr|Or)\.?\s*\)', 'Prof. (Dr.) ', line, flags=re.IGNORECASE)
        line = re.sub(r'\b(Praf|Prol|Prok|Pros|Proi|Prat|Prot)\.?\b', 'Prof.', line, flags=re.IGNORECASE)
        line = re.sub(r'\b(Prof|Dr|Mr|Ms|Mrs)\.?\s*', r'\1. ', line, flags=re.IGNORECASE)
        line = re.sub(r'\(\s*(De|Or)\.?\s*\)', '(Dr.) ', line, flags=re.IGNORECASE)
        line = re.sub(r'\b(Co-?ordinator)\s*[:]?\s*(Prof|Dr|Mr|Ms)', r'Co-ordinator: \2', line, flags=re.IGNORECASE)
        line = re.sub(r'\b(Class|Branch|Section|Sem|Room No)\s*[:]\s*', r'\1: ', line, flags=re.IGNORECASE)
        
        # Insert space between lowercase/punctuation and uppercase letter (e.g. MayankBhatt -> Mayank Bhatt)
        line = re.sub(r'([a-z\.\)\]])([A-Z])', r'\1 \2', line)
        line = re.sub(r'([a-z])([A-Z])', r'\1 \2', line)
        
        # Fix common OCR typos in subject codes, course names, and roman numerals
        line = re.sub(r'\b([A-Z]{2,3})(\d)O(\d)\b', r'\g<1>\g<2>0\g<3>', line, flags=re.IGNORECASE)
        line = re.sub(r'\b([A-Z]{2,3})O(\d{1,2})\b', r'\g<1>0\g<2>', line, flags=re.IGNORECASE)
        line = re.sub(r'Internship[- ]*I?1+I*\b', 'Internship-III', line, flags=re.IGNORECASE)
        line = re.sub(r'Project[- ]*I?l+\b', 'Project-II', line, flags=re.IGNORECASE)
        line = re.sub(r'Project[- ]*1+I*\b', 'Project-II', line, flags=re.IGNORECASE)
        line = re.sub(r'\bNetwerk\b', 'Network', line, flags=re.IGNORECASE)
        line = re.sub(r'\bLub\b', 'Lab', line, flags=re.IGNORECASE)
        line = re.sub(r'\bCompuler\b', 'Computer', line, flags=re.IGNORECASE)
        line = re.sub(r'\bSyas\b', 'Vyas', line, flags=re.IGNORECASE)
        line = re.sub(r'\bDecpak\b', 'Deepak', line, flags=re.IGNORECASE)
        line = re.sub(r'\bAnkuca\b', 'Ankita', line, flags=re.IGNORECASE)
        line = re.sub(r'\bCupia\b', 'Gupta', line, flags=re.IGNORECASE)
        
        # Clean double spaces
        line = re.sub(r'\s+', ' ', line).strip()
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines)

def extract_text_from_image_array(img_array):
    ocr = get_ocr()
    processed_img = preprocess_image_for_ocr(img_array)
    result = ocr.ocr(processed_img, cls=True)
    if not result or not result[0]:
        return ""
    
    items = []
    for box in result[0]:
        coords = box[0]
        text = box[1][0].strip()
        if not text:
            continue
            
        y_top = min([p[1] for p in coords])
        y_bot = max([p[1] for p in coords])
        x_left = min([p[0] for p in coords])
        x_right = max([p[0] for p in coords])
        
        items.append({
            'text': text,
            'top': y_top, 'bot': y_bot,
            'left': x_left, 'right': x_right,
            'y_center': (y_top + y_bot) / 2.0,
            'h': y_bot - y_top,
            'w': x_right - x_left
        })
        
    if not items:
        return ""
        
    raw_table_text = reconstruct_table_rows_by_center(items, threshold_ratio=0.4, separator=" | ")
    return clean_ocr_text(raw_table_text)

@router.post("/extract")
async def extract_timetable(request: TimetableExtractRequest):
    """Extract structured data from a timetable using fitz and PaddleOCR."""
    file_url = request.fileUrl
    logger.info(f"Extracting timetable from {file_url}")

    # Convert file URI to local path
    try:
        if file_url.startswith("file://"):
            file_url = file_url[7:]
            if os.name == 'nt' and file_url.startswith("/"):
                file_url = file_url[1:]
        file_path = urllib.parse.unquote(file_url)
        file_path = os.path.normpath(file_path)
    except Exception as e:
        logger.error(f"Failed to parse file URL: {e}")
        raise HTTPException(status_code=400, detail="Invalid file URL format")

    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    raw_text = ""
    try:
        import fitz
        import numpy as np
        import cv2

        if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            logger.info("Processing as direct image via OCR.")
            img = cv2.imread(file_path)
            if img is None:
                raise Exception("Failed to read image.")
            raw_text = extract_text_from_image_array(img)
        else:
            logger.info("Processing as PDF via PyMuPDF.")
            with fitz.open(file_path) as doc:
                # 1. Try digital text extraction first using word-coordinate line reconstruction
                for page in doc:
                    words = page.get_text("words")  # (x0, y0, x1, y1, "word", block_no, line_no, word_no)
                    items = []
                    for w in words:
                        items.append({
                            'text': w[4],
                            'y_center': (w[1] + w[3]) / 2.0,
                            'h': w[3] - w[1],
                            'left': w[0]
                        })
                    text = reconstruct_table_rows_by_center(items, threshold_ratio=0.4, separator=" ")
                    if text:
                        raw_text += text + "\n"
                
                # 2. If no selectable text, fallback to OCR
                if len(raw_text.strip()) < 50:
                    logger.info("Insufficient digital text found. Falling back to OCR for scanned PDF.")
                    raw_text = ""
                    for page in doc:
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Zoom for better OCR
                        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                        if pix.n == 4:
                            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
                        elif pix.n == 1:
                            img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
                        elif pix.n == 3:
                            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                        
                        raw_text += extract_text_from_image_array(img_array) + "\n"
                        
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        raise HTTPException(status_code=500, detail="OCR components are currently installing. Please try again in a few minutes.")
    except Exception as e:
        logger.error(f"Failed to extract text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the uploaded document.")

    import re
    # Text Normalization
    # Replace multiple tabs with a single space
    normalized_text = re.sub(r'\t+', ' ', raw_text)
    # Remove extra consecutive spaces (more than 2 -> single space)
    normalized_text = re.sub(r' {3,}', ' ', normalized_text)
    # Remove empty lines
    normalized_text = "\n".join([line for line in normalized_text.splitlines() if line.strip()])

    # Truncate text to avoid token limits for text-based PDFs
    if len(normalized_text) > 16000:
        normalized_text = normalized_text[:16000]

    system_prompt = "You are an expert data extractor. Output ONLY valid JSON matching the requested schema exactly. Do not output markdown code blocks (e.g., ```json) or any other text."
    user_prompt = (
        "Extract structured information from the following timetable text.\n"
        "Your top priority is accurate subject extraction and preserving exact mappings from the uploaded file.\n"
        "\n"
        "MANDATORY TOP PRIORITY FIELDS FOR EVERY SUBJECT:\n"
        "1. Subject Code\n"
        "2. Subject Name\n"
        "3. Assigned Faculty\n"
        "4. Assigned Coordinator\n"
        "\n"
        "CRITICAL EXTRACTION RULES (STRICT COMPLIANCE REQUIRED):\n"
        "1. ONLY EXTRACT ACTUAL SUBJECTS: A valid subject row is one that contains a valid Subject Code (examples: IT601, IT602, IT603, DS401, CS501, ME301). ONLY rows containing a valid Subject Code should become subject entries. You MUST ignore headings, notes, timetable timings, grid schedule slots, and non-subject rows entirely.\n"
        "2. DO NOT MISS ANY VALID SUBJECT: Every single valid subject row present in the timetable text MUST be extracted. Do not skip any subject. Do not create duplicate subjects. Do not generate random subjects.\n"
        "3. DO NOT MIX SUBJECT CODE AND SUBJECT NAME:\n"
        "   - Subject Code is short and alphanumeric (e.g., IT607, CS101, B-204, DS401). It MUST go into 'subjectCode'. NEVER place a Subject Code into 'subjectName'.\n"
        "   - Subject Name is the descriptive title (e.g., Machine Learning, Operating Systems, Cloud Computing, Data Structures). It MUST go into 'subjectName'. NEVER place a descriptive title into 'subjectCode'.\n"
        "   - Correct example: IT607 -> Subject Code, Machine Learning -> Subject Name.\n"
        "   - Wrong example: IT607 -> Subject Name, Machine Learning -> Subject Code.\n"
        "   - If code and name appear combined (e.g., 'IT607 - Machine Learning'), accurately split them into subjectCode='IT607' and subjectName='Machine Learning'.\n"
        "4. PRESERVE EXACT MAPPINGS: For every subject, preserve the exact mapping from the timetable: Subject Code -> Subject Name -> Assigned Faculty -> Coordinator. These mappings MUST remain identical to the uploaded timetable. Never guess values. Never assign the wrong faculty or coordinator. Do not hallucinate or autocorrect names.\n"
        "5. MISSING VALUES: If an Assigned Faculty, Coordinator, or Subject Type genuinely cannot be identified from the text, return 'Needs Manual Review' ONLY for that specific field instead of null or guessing.\n"
        "6. VALIDATION & COUNTING STEP: Before returning the JSON, count all unique Subject Codes present in the timetable text. Your final extracted 'subjects' array count MUST exactly match the number of subjects in the timetable without missing any valid row.\n"
        "7. Extract the overall department, batch, degree, academicYear, semester, class/section, and general coordinator from the document header if available.\n"
        "Return JSON ONLY, matching exactly this schema:\n"
        "{\n"
        "  \"academicYear\": \"string\",\n"
        "  \"department\": \"string\",\n"
        "  \"degree\": \"string\",\n"
        "  \"batch\": \"string\",\n"
        "  \"semester\": number,\n"
        "  \"class\": \"string\",\n"
        "  \"section\": \"string\",\n"
        "  \"coordinator\": \"string\",\n"
        "  \"subjects\": [\n"
        "      {\n"
        "         \"subjectCode\": \"string\",\n"
        "         \"subjectName\": \"string\",\n"
        "         \"subjectType\": \"string\",\n"
        "         \"faculty\": \"string\"\n"
        "      }\n"
        "  ]\n"
        "}\n"
        f"Text to parse:\n{normalized_text}"
    )

    ai_req = AiGenericRequest(
        systemPrompt=system_prompt,
        userPrompt=user_prompt,
        maxTokens=4096,
        temperature=0.0, # Zero temperature to strictly prevent hallucinations
        responseFormat="json_object"
    )

    try:
        ai_res = await ai_service.generate_content(ai_req)
        content = ai_res.content.strip()
    except Exception as e:
        logger.error(f"AI Service failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze timetable. Please check API Key configuration.")

    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        parsed = json.loads(content.strip())
        
        # Validation against original text
        normalized_text_lower = normalized_text.lower()
        
        # Validate subjects
        if "subjects" in parsed and isinstance(parsed["subjects"], list):
            valid_subjects = []
            seen_subjects = set()
            for sub in parsed["subjects"]:
                s_name = sub.get("subjectName")
                s_code = sub.get("subjectCode")
                
                # Filter out completely invalid rows
                is_invalid_name = not s_name or str(s_name).lower() in ["null", "needs manual review", ""]
                is_invalid_code = not s_code or str(s_code).lower() in ["null", "needs manual review", ""]
                
                if is_invalid_name and is_invalid_code:
                    logger.warning(f"Skipping invalid subject row: {sub}")
                    continue
                    
                # Deduplication only on exact identical subject + faculty mapping to avoid removing valid sections or labs
                s_faculty = sub.get("faculty")
                s_type = sub.get("subjectType")
                unique_key = f"{str(s_code).strip().lower()}_{str(s_name).strip().lower()}_{str(s_faculty).strip().lower()}_{str(s_type).strip().lower()}"
                if unique_key in seen_subjects:
                    logger.warning(f"Skipping identical duplicate subject row: {sub}")
                    continue
                seen_subjects.add(unique_key)
                
                valid_subjects.append(sub)
                
            parsed["subjects"] = valid_subjects

        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parsing failed: {e}. Raw content:\n{content}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
