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

@router.post("/extract")
async def extract_timetable(request: TimetableExtractRequest):
    """Extract structured data from a timetable PDF using pdfplumber and Groq."""
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

    # Extract text using pdfplumber
    if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Images and scanned PDFs are not supported. Please upload a digital, text-selectable PDF.")

    raw_pdf_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    raw_pdf_text += text + "\n"
    except Exception as e:
        logger.error(f"Failed to extract PDF text: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse PDF document.")

    if not raw_pdf_text.strip() or len(raw_pdf_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="The uploaded PDF does not contain extractable text (likely a scanned image). Please upload a digital, text-selectable PDF.")

    import re
    # Text Normalization
    # Replace multiple tabs with a single space
    normalized_text = re.sub(r'\t+', ' ', raw_pdf_text)
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
        "You must extract ALL subjects, ALL faculty members, and EVERY slot present in the text.\n"
        "Do NOT skip any information. Be thorough and comprehensive.\n"
        "IMPORTANT RULES (CRITICAL):\n"
        "1. Extracted text is the SOURCE OF TRUTH. Preserve all faculty names, subject codes, and subject names exactly as received.\n"
        "2. Do NOT guess, hallucinate, autocorrect, or invent any faculty names.\n"
        "3. Do NOT guess, hallucinate, autocorrect, or invent any subject names or codes.\n"
        "4. Do NOT invent coordinator names.\n"
        "5. If a value is unclear or missing, return 'null' instead of guessing.\n"
        "6. Make sure the 'subjects' array contains EVERY unique subject and its mapped faculty mentioned in the text.\n"
        "7. Make sure the 'slots' array contains EVERY distinct cell in the timetable grid.\n"
        "8. If a subject has a code, split it into subjectCode and subjectName (e.g. 'CS601 - Operating System' -> code: 'CS601', name: 'Operating System').\n"
        "9. If a subject specifies a type (like Theory, Practical, Lab, Tutorial), extract it into subjectType. Otherwise null.\n"
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
        "  ],\n"
        "  \"slots\": [\n"
        "      {\"day\": \"string\", \"time\": \"string\", \"room\": \"string\", \"subjectCode\": \"string\", \"subjectName\": \"string\", \"faculty\": \"string\"}\n"
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
        
        debug_path = r"C:\Users\rajku\.gemini\antigravity-ide\brain\cd35c90c-27c8-4d8f-8ba6-6cd07cc7a103\scratch\python_debug.txt"
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write("\n\n====================================================\n")
            f.write("NORMALIZED PDF TEXT\n")
            f.write("====================================================\n")
            f.write(normalized_text + "\n")
            f.write("\n====================================================\n")
            f.write("RAW GROQ RESPONSE\n")
            f.write("====================================================\n")
            f.write(content + "\n")
            f.write("\n====================================================\n\n")

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
            for sub in parsed["subjects"]:
                fac = sub.get("faculty")
                if fac and fac != "null" and fac.lower() not in normalized_text_lower:
                    logger.warning(f"Validation failed for faculty '{fac}'. Not found in PDF text.")
                    sub["faculty"] = None
                
                s_name = sub.get("subjectName")
                if s_name and s_name != "null" and s_name.lower() not in normalized_text_lower:
                    logger.warning(f"Validation failed for subjectName '{s_name}'. Not found in PDF text.")
                    # Keep subject code if valid
                
                s_code = sub.get("subjectCode")
                if s_code and s_code != "null" and s_code.lower() not in normalized_text_lower:
                    logger.warning(f"Validation failed for subjectCode '{s_code}'. Not found in PDF text.")
                    sub["subjectCode"] = None
                    
        # Validate slots
        if "slots" in parsed and isinstance(parsed["slots"], list):
            for slot in parsed["slots"]:
                fac = slot.get("faculty")
                if fac and fac != "null" and fac.lower() not in normalized_text_lower:
                    slot["faculty"] = None

        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parsing failed: {e}. Raw content:\n{content}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
