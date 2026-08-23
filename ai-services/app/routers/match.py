import logging
import json
from typing import Optional, List, Dict, Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.ai import AiGenericRequest
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Match"])


class MatchRequest(BaseModel):
    """Request for AI matching endpoints."""
    students: Optional[List[Dict[str, Any]]] = None
    faculty: Optional[List[Dict[str, Any]]] = None
    classes: Optional[List[Dict[str, Any]]] = None
    subjects: Optional[List[Dict[str, Any]]] = None
    timetables: Optional[List[Dict[str, Any]]] = None
    coordinators: Optional[List[Dict[str, Any]]] = None
    matchType: Optional[str] = "generic"


class MatchResponse(BaseModel):
    """Response for AI matching endpoints."""
    studentsMatched: int = 0
    facultyMatched: int = 0
    subjectsMatched: int = 0
    schemeMatched: int = 0
    syllabusMatched: int = 0
    coordinatorAssigned: int = 0
    timetableMatched: int = 0
    warnings: List[str] = []
    errors: List[str] = []
    suggestions: List[str] = []
    confidence: float = 0.0
    studentMappings: List[Dict[str, Any]] = []
    facultyMappings: List[Dict[str, Any]] = []
    coordinatorMappings: List[Dict[str, Any]] = []


@router.post("/match", response_model=MatchResponse)
async def match_data(request: MatchRequest):
    """AI-powered data matching endpoint using Groq LLM."""
    logger.info("Received match request (type=%s)", request.matchType)

    students = request.students or []
    faculty = request.faculty or []
    classes = request.classes or []
    subjects = request.subjects or []
    coordinators = request.coordinators or []
    timetables = request.timetables or []

    system_prompt = (
        "You are an intelligent data-matching engine for ACADRO. "
        "Your role is to match uploaded entity data (students, faculty, subjects, classes) "
        "to each other based on department, specialization, year, semester, subject expertise, "
        "workload balance, and naming similarity. "
        "Return a valid JSON object matching this schema exactly:\n"
        "{\n"
        "  \"confidence\": <float between 0.0 and 1.0>,\n"
        "  \"studentMappings\": [{\"studentId\": \"<id>\", \"action\": \"MAP_CLASS\", \"classId\": \"<id>\", \"className\": \"<name>\", \"reason\": \"<why>\"}],\n"
        "  \"facultyMappings\": [{\"facultyId\": \"<id>\", \"action\": \"MAP_SUBJECT\", \"classId\": \"<id>\", \"className\": \"<name>\", \"subjectId\": \"<id>\", \"subjectName\": \"<name>\", \"reason\": \"<why>\"}],\n"
        "  \"coordinatorMappings\": [{\"facultyId\": \"<id>\", \"action\": \"ASSIGN_COORDINATOR\", \"classId\": \"<id>\", \"className\": \"<name>\", \"reason\": \"<why>\"}],\n"
        "  \"warnings\": [\"<any conflicts or issues detected>\"],\n"
        "  \"suggestions\": [\"<optimization suggestions>\"]\n"
        "}\n"
        "Only include mappings for entities that have data provided. "
        "Return ONLY the raw JSON string. Do not use Markdown formatting or backticks."
    )

    user_prompt = (
        f"Match the following uploaded data for matchType='{request.matchType}'.\n\n"
        f"Students ({len(students)}): {json.dumps(students[:50])}\n\n"
        f"Faculty ({len(faculty)}): {json.dumps(faculty[:50])}\n\n"
        f"Classes ({len(classes)}): {json.dumps(classes[:50])}\n\n"
        f"Subjects ({len(subjects)}): {json.dumps(subjects[:50])}\n\n"
        f"Coordinators ({len(coordinators)}): {json.dumps(coordinators[:50])}\n\n"
        f"Timetables ({len(timetables)}): {json.dumps(timetables[:20])}\n\n"
        "Analyze the data and produce optimal mappings based on department alignment, "
        "subject specialization, year/semester, and workload distribution. "
        "Flag any conflicts or ambiguous matches as warnings."
    )

    ai_req = AiGenericRequest(
        systemPrompt=system_prompt,
        userPrompt=user_prompt,
        maxTokens=2000,
        temperature=0.2
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

        result = json.loads(content.strip())

        student_mappings = result.get("studentMappings", [])
        faculty_mappings = result.get("facultyMappings", [])
        coordinator_mappings = result.get("coordinatorMappings", [])

        return MatchResponse(
            studentsMatched=len(student_mappings),
            facultyMatched=len(faculty_mappings),
            subjectsMatched=len(subjects),
            schemeMatched=0,
            syllabusMatched=0,
            coordinatorAssigned=len(coordinator_mappings),
            timetableMatched=len(timetables),
            warnings=result.get("warnings", []),
            errors=[],
            suggestions=result.get("suggestions", []),
            confidence=result.get("confidence", 0.0),
            studentMappings=student_mappings,
            facultyMappings=faculty_mappings,
            coordinatorMappings=coordinator_mappings
        )
    except Exception as e:
        logger.error("AI match processing failed: %s", e)
        return MatchResponse(
            studentsMatched=0,
            facultyMatched=0,
            subjectsMatched=0,
            warnings=[],
            errors=[f"AI matching failed: {str(e)}. Please review data and retry."],
            suggestions=["Ensure uploaded data contains valid department and subject fields."],
            confidence=0.0,
            studentMappings=[],
            facultyMappings=[],
            coordinatorMappings=[]
        )
