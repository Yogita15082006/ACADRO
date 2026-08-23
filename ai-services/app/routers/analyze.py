import logging
import json
import json_repair
from typing import Optional, List, Dict, Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.ai import AiGenericRequest
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analyze"])

class AnalyticsRequest(BaseModel):
    insightType: str
    data: Dict[str, Any]

class AnalyticsResponse(BaseModel):
    confidence: float
    reasoning: str
    recommendations: List[str] = []
    rawInsights: str = ""

@router.post("/analyze", response_model=AnalyticsResponse)
async def analyze_data(request: AnalyticsRequest):
    """AI-powered data analytics endpoint."""
    logger.info("Received analyze request (type=%s)", request.insightType)
    
    system_prompt = (
        "You are an AI Analytics engine for ACADRO. "
        "Analyze the provided data and return actionable insights. "
        "Return a valid JSON object matching this schema exactly:\n"
        "{\n"
        "  \"confidence\": <float between 0.0 and 1.0>,\n"
        "  \"reasoning\": \"<string explaining the reasoning>\",\n"
        "  \"recommendations\": [\"<string>\", \"<string>\"],\n"
        "  \"rawInsights\": \"<string formatted generic insight output>\"\n"
        "}\n"
        "Return ONLY the raw JSON string. Do not use Markdown formatting or backticks."
    )
    
    # ─── Assignment AI ───────────────────────────────────────────────
    if request.insightType == "ASSIGNMENT_QUALITY":
        user_prompt = f"Analyze this assignment for clarity, difficulty, and completeness: {json.dumps(request.data)}"
    elif request.insightType == "ASSIGNMENT_PLAGIARISM":
        user_prompt = f"Analyze these submissions for potential plagiarism or suspiciously high similarity: {json.dumps(request.data)}"
    elif request.insightType == "ASSIGNMENT_FEEDBACK":
        user_prompt = f"Provide constructive feedback suggestions for this assignment submission: {json.dumps(request.data)}"
    elif request.insightType == "LATE_SUBMISSION_RISK":
        user_prompt = f"Analyze the following student data and predict the risk of late submission for upcoming assignments: {json.dumps(request.data)}"

    # ─── Quiz AI ─────────────────────────────────────────────────────
    elif request.insightType == "QUIZ_DIFFICULTY":
        user_prompt = f"Analyze this quiz and estimate its overall difficulty level based on the questions, marks distribution, and duration: {json.dumps(request.data)}"
    elif request.insightType == "QUIZ_QUESTION_QUALITY":
        user_prompt = f"Evaluate the quality of this quiz question for clarity, ambiguity, difficulty calibration, and distractor effectiveness: {json.dumps(request.data)}"
    elif request.insightType == "QUIZ_QUESTION_GENERATION":
        user_prompt = (
            f"Generate {request.data.get('count', 5)} completely fresh, original, and rigorous quiz questions for subject '{request.data.get('subjectName', '')}'. "
            f"Topic/Unit Syllabus Context: '{request.data.get('topicOrSyllabus', request.data.get('topic', ''))}'. "
            f"Difficulty Level: '{request.data.get('difficulty', 'Medium')}'. "
            f"Question Type: '{request.data.get('questionType', 'MCQ')}' (if 'Mixed Questions' is requested, vary the generated questionType across 'MCQ', 'True/False', 'Short Answer', and 'Fill in the Blanks'). "
            f"Marks Per Question: {request.data.get('marksPerQuestion', 1)}. "
            f"Generation Nonce/Timestamp: {request.data.get('timestamp', 'initial')} (Ensure this response generates a completely distinct, novel set of questions without repeating typical static patterns). "
            f"Each object in the 'rawInsights' array MUST strictly contain: 'questionText' (string containing the full question statement), 'questionType' (string such as 'MCQ', 'True/False', 'Short Answer', or 'Fill in the Blanks'), 'marks' (number, default {request.data.get('marksPerQuestion', 1)}), 'correctAnswer' (string solution or correct option ID like 'A' or 'B'), and 'options' (array of option objects). "
            f"For MCQ and True/False, include 4 options (or 2 for True/False) formatted with 'id' (A, B, C, D), 'text', and 'isCorrect' boolean. "
            f"For Short Answer and Fill in the Blanks, include a clear 'correctAnswer' solution string and empty options list. "
            f"IMPORTANT: Return a valid JSON object with 'confidence' (number), 'reasoning' (string), 'recommendations' (array of strings), and 'rawInsights' (a direct JSON array [...] of the generated question objects, NOT a stringified array). Context: {json.dumps(request.data)}"
        )
    elif request.insightType == "QUIZ_ANSWER_KEY_GENERATION":
        user_prompt = (
            f"Using deep academic analysis, generate an accurate and verified answer key for the following quiz questions or source document: {json.dumps(request.data)}. "
            f"For each question identified, determine the mathematically and conceptually accurate solution or correct option ID. Do not use random or mock placeholders. "
            f"IMPORTANT: Return a valid JSON object with 'confidence', 'reasoning', 'recommendations', and 'rawInsights' (a direct JSON array [...] of objects with 'questionId', 'questionText', 'correctAnswer', and 'correctOptionId', NOT a stringified array)."
        )
    elif request.insightType == "QUIZ_URL_QUESTION_EXTRACTION":
        user_prompt = (
            f"You are a high-precision academic data extractor. Your ONLY task is to extract the EXACT, REAL assessment questions from the source webpage content below extracted from '{request.data.get('sourceUrl', 'a public URL')}'.\n\n"
            f"--- START WEBPAGE / FORM CONTENT ---\n{request.data.get('webpageContent', '')}\n--- END WEBPAGE / FORM CONTENT ---\n\n"
            f"CRITICAL PRODUCTION RULES - YOU MUST STRICTLY OBEY EVERY RULE:\n"
            f"1. NO DUMMY OR SAMPLE DATA: Under NO circumstances should you generate random questions, sample questions, placeholder questions, or fallback questions. You must NEVER invent questions or make up content.\n"
            f"2. EXACT VERBATIM MATCHING: Extract every question exactly as it appears in the text or embedded form scripts (such as Google Forms arrays, Microsoft Forms JSON, public quiz webpages, or generic question bank HTML). Preserve exact wording, exact options, exact question numbering, and original order.\n"
            f"3. ZERO QUESTION DETECTION: If the provided webpage content contains zero real quiz questions or assessment items, return an empty JSON array [] for 'rawInsights'. Do not attempt to fabricate questions from general articles or titles.\n"
            f"4. UNIVERSAL DYNAMIC FORMS & QUESTION BANK PARSING: Regardless of the web platform or link type, dynamically locate every multiple-choice, true/false, short-answer, or fill-in-the-blank item inside the extracted webpage text, JSON state, or JavaScript data arrays and extract their exact question prompt and options verbatim.\n"
            f"5. OUTPUT SCHEMA: Return a valid JSON object with 'confidence' (number), 'reasoning' (string), 'recommendations' (array of strings), and 'rawInsights' (a direct JSON array [...] of extracted question objects, NOT stringified).\n"
            f"   Each object in 'rawInsights' must strictly contain:\n"
            f"     - 'questionText': string (verbatim question text)\n"
            f"     - 'questionType': string ('MCQ', 'True/False', 'Short Answer', or 'Fill in the Blanks')\n"
            f"     - 'marks': number (default 2)\n"
            f"     - 'correctAnswer': string (if correct answer is known/indicated, otherwise default to option ID 'A' or first option)\n"
            f"     - 'options': array of option objects formatted as {{ 'id': 'A', 'text': '...', 'isCorrect': true/false }} for MCQ/True-False. Provide empty array [] for Short Answer/Fill in the Blanks.\n"
            f"IMPORTANT: Return a valid JSON object with 'confidence' (number), 'reasoning' (string), 'recommendations' (array of strings), and 'rawInsights' (a direct JSON array [...] of extracted question objects, NOT a stringified array)."
        )
    elif request.insightType == "QUIZ_RECOMMENDATIONS":
        user_prompt = f"Based on the available quizzes, recommend a prioritized study plan and quiz attempt order for this student: {json.dumps(request.data)}"
    elif request.insightType == "QUIZ_PERFORMANCE":
        user_prompt = f"Analyze these quiz results and identify areas where students struggled the most: {json.dumps(request.data)}"

    # ─── Attendance AI ───────────────────────────────────────────────
    elif request.insightType == "ATTENDANCE_PREDICTION":
        user_prompt = f"Based on this class attendance data, predict which students are at risk of falling below the minimum attendance threshold and estimate weeks until shortage: {json.dumps(request.data)}"
    elif request.insightType == "ATTENDANCE_ANOMALY":
        user_prompt = f"Analyze these faculty attendance sessions and identify anomalies such as unusual marking patterns, unusually high/low attendance rates, or suspicious timing: {json.dumps(request.data)}"
    elif request.insightType == "ATTENDANCE_PARENT_NOTIFICATION":
        user_prompt = f"Based on this student's attendance data, generate a professional parent notification message including attendance percentage, eligibility status, and recommended actions: {json.dumps(request.data)}"
    elif request.insightType == "ATTENDANCE_AUTOMATIC_WARNINGS":
        user_prompt = f"Analyze this department attendance data and generate automatic warning messages for classes with critically low attendance, identifying trends and recommending interventions: {json.dumps(request.data)}"
    elif request.insightType == "ATTENDANCE_VERIFICATION":
        user_prompt = f"Verify this attendance marking for suspicious patterns such as impossible location, missing biometric data, or rapid successive markings: {json.dumps(request.data)}"
    elif request.insightType == "ATTENDANCE_TRENDS":
        user_prompt = f"Analyze this attendance report and identify trends, chronic absenteeism, and potential risks: {json.dumps(request.data)}"

    # ─── Notice AI ───────────────────────────────────────────────────
    elif request.insightType == "NOTICE_SUMMARY":
        user_prompt = f"Generate a concise 2-3 sentence summary of this notice, highlighting the key action items and urgency level: {json.dumps(request.data)}"
    elif request.insightType == "NOTICE_HIGHLIGHTS":
        user_prompt = f"From these notices, identify the most important and time-sensitive ones for the student. Rank by urgency and explain why each is important: {json.dumps(request.data)}"
    elif request.insightType == "NOTICE_RECOMMENDATIONS":
        user_prompt = f"Based on these available notices and their categories, recommend which ones are most relevant for this student and suggest related actions: {json.dumps(request.data)}"

    # ─── Lecture Material AI ─────────────────────────────────────────
    elif request.insightType == "LECTURE_MATERIAL_STUDY_GUIDE":
        user_prompt = f"Generate a structured study guide from this lecture material including key concepts, learning objectives, important definitions, and suggested review questions: {json.dumps(request.data)}"
    elif request.insightType == "LECTURE_MATERIAL_SUMMARY":
        user_prompt = f"Generate a concise summary and key takeaways for this lecture material, organized by topic: {json.dumps(request.data)}"

    # ─── Timetable AI ────────────────────────────────────────────────
    elif request.insightType == "TIMETABLE_CONFLICT_DETECTION":
        user_prompt = (
            f"Parse the following timetable text extracted from a PDF and detect scheduling conflicts "
            f"such as overlapping time slots, double-booked rooms, faculty teaching two classes simultaneously, "
            f"or back-to-back classes with no breaks. List each conflict with details: {json.dumps(request.data)}"
        )
    elif request.insightType == "TIMETABLE_OPTIMIZATION":
        user_prompt = f"Analyze this timetable and suggest optimizations or highlight potential fatigue issues for students/faculty: {json.dumps(request.data)}"

    # ─── Result Management AI ────────────────────────────────────────
    elif request.insightType == "EXAM_FEEDBACK":
        user_prompt = (
            f"You are an expert academic counselor and mentor. Analyze this student's exam marks: {json.dumps(request.data)}. "
            f"CRITICAL RULE: DO NOT simply restate the marks or list the scores. The student already knows their marks! "
            f"Your goal is to provide deeply constructive, actionable, and encouraging feedback to help the student improve. "
            f"In the 'reasoning' field, write a 2-3 sentence holistic summary of their performance trends (e.g., 'You show a strong aptitude for analytical subjects, but theoretical concepts require more attention.'). "
            f"In the 'recommendations' array, provide 3 to 4 HIGHLY SPECIFIC, actionable steps for improvement. "
            f"Instead of saying 'Work hard on Deep Learning', say 'For Deep Learning, focus on understanding backpropagation mathematically and practice implementing neural networks from scratch'. "
            f"Acknowledge their strengths and give concrete study strategies for their weaknesses. "
            f"Always use an encouraging and supportive tone, speaking directly to the student."
        )
    elif request.insightType == "BULK_EXAM_FEEDBACK":
        user_prompt = (
            f"You are an expert academic counselor. Analyze the subject exam marks for these {len(request.data.get('results', []))} results: {json.dumps(request.data)}. "
            f"Provide deeply constructive feedback for EACH subject result separately. "
            f"CRITICAL RULE: DO NOT simply restate the marks. Give encouraging and actionable advice specific to the subject. "
            f"IMPORTANT: Return a valid JSON object with 'confidence' (number), 'reasoning' (string), 'recommendations' (array of strings), and 'rawInsights' (a JSON array of objects). "
            f"'rawInsights' MUST be a direct JSON array `[...]` of objects (NOT stringified), where each object has exactly three fields: "
            f"1. 'resultId' (matching the input exactly), "
            f"2. 'reasoning' (2-3 sentence holistic summary of their performance trends in this subject), "
            f"3. 'recommendations' (an array of 3 to 4 HIGHLY SPECIFIC, actionable steps for improvement in this subject)."
        )

    else:
        logger.warning("Unknown insightType '%s' — using generic fallback", request.insightType)
        user_prompt = f"Analyze the following data and provide insights: {json.dumps(request.data)}"
        
    ai_req = AiGenericRequest(
        systemPrompt=system_prompt,
        userPrompt=user_prompt,
        maxTokens=6000 if request.insightType == "BULK_EXAM_FEEDBACK" else (2800 if request.insightType == "QUIZ_URL_QUESTION_EXTRACTION" else 2500),
        temperature=0.8 if request.insightType in ["QUIZ_QUESTION_GENERATION", "QUIZ_ANSWER_KEY_GENERATION"] else (0.1 if request.insightType in ["QUIZ_URL_QUESTION_EXTRACTION", "BULK_EXAM_FEEDBACK"] else 0.3)
    )
    
    content = ""
    try:
        ai_res = await ai_service.generate_content(ai_req)
        content = ai_res.content.strip()
        
        # Robust JSON extraction
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        # Try native fast JSON parsing first
        try:
            parsed = json.loads(content)
        except Exception as json_err:
            logger.warning(f"Native json.loads failed, falling back to json_repair: {str(json_err)}")
            # Use json_repair in a separate thread to prevent blocking the event loop on huge malformed strings
            import asyncio
            try:
                parsed = await asyncio.to_thread(json_repair.loads, content)
            except Exception as repair_err:
                logger.error(f"json_repair failed: {str(repair_err)}")
                # Try to extract array or object if it still failed
                first_idx = min([idx for idx in [content.find('['), content.find('{')] if idx >= 0] + [len(content)])
                last_idx = max([idx for idx in [content.rfind(']'), content.rfind('}')] if idx >= 0] + [-1])
                if first_idx < len(content) and last_idx >= 0 and last_idx >= first_idx:
                    content = content[first_idx:last_idx+1]
                    try:
                        parsed = await asyncio.to_thread(json_repair.loads, content)
                    except:
                        raise
                else:
                    raise
                
        if isinstance(parsed, list):
            raw_insights = json.dumps(parsed)
            confidence = 0.9
            reasoning = "Analysis complete."
            recommendations = []
        else:
            confidence = parsed.get("confidence", 0.8)
            reasoning = parsed.get("reasoning", "Analysis complete.")
            recommendations = parsed.get("recommendations", [])
            raw_insights = parsed.get("rawInsights")
            if not raw_insights:
                for k in ["questions", "quiz", "quizQuestions", "data", "extractedQuestions", "items"]:
                    if k in parsed and parsed[k]:
                        raw_insights = parsed[k]
                        break
            if raw_insights is None:
                raw_insights = ""
            if isinstance(raw_insights, (dict, list)):
                raw_insights = json.dumps(raw_insights)

        return AnalyticsResponse(
            confidence=confidence,
            reasoning=reasoning,
            recommendations=recommendations,
            rawInsights=raw_insights
        )
    except Exception as e:
        logger.error(f"AI Service Error: {str(e)}")
        logger.error(f"Raw content was: {content}")
        return AnalyticsResponse(
            confidence=0.0,
            reasoning=f"AI response parsing failed: {str(e)}",
            recommendations=[],
            rawInsights="[]" if request.insightType == "QUIZ_URL_QUESTION_EXTRACTION" else "{}"
        )
