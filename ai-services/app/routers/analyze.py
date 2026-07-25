import logging
import json
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
        "You are an AI Analytics engine for AcroNexus ERP. "
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
            f"Generate {request.data.get('count', 5)} quiz questions for the subject '{request.data.get('subjectName', '')}' "
            f"on the topic '{request.data.get('topic', '')}'. "
            f"Include the question text, 4 options, and the correct answer for each. "
            f"Format the output as a JSON array inside the rawInsights field. Context: {json.dumps(request.data)}"
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

    else:
        logger.warning("Unknown insightType '%s' — using generic fallback", request.insightType)
        user_prompt = f"Analyze the following data and provide insights: {json.dumps(request.data)}"
        
    ai_req = AiGenericRequest(
        systemPrompt=system_prompt,
        userPrompt=user_prompt,
        maxTokens=1500,
        temperature=0.3
    )
    
    try:
        ai_res = await ai_service.generate_content(ai_req)
        content = ai_res.content.strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        result_dict = json.loads(content.strip())
        
        return AnalyticsResponse(
            confidence=result_dict.get("confidence", 0.8),
            reasoning=result_dict.get("reasoning", "Analysis complete."),
            recommendations=result_dict.get("recommendations", []),
            rawInsights=result_dict.get("rawInsights", "")
        )
    except Exception as e:
        logger.error("Failed to process ANALYTICS request: %s", e)
        return AnalyticsResponse(
            confidence=0.0,
            reasoning="Failed to process AI analytics.",
            recommendations=[],
            rawInsights="{}"
        )
