import logging
import json
from typing import Optional, List, Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.ai import AiGenericRequest
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Validate"])


class ValidationRequest(BaseModel):
    """Request for AI validation endpoints."""
    data: dict
    validationType: Optional[str] = "generic"


class ValidationIssue(BaseModel):
    rowNumber: Optional[int] = None
    field: Optional[str] = None
    originalValue: Optional[str] = None
    suggestedValue: Optional[str] = None
    issueDescription: Optional[str] = None


class ValidationResponse(BaseModel):
    """Response for AI validation endpoints."""
    valid: bool
    message: str
    issues: List[ValidationIssue] = []
    totalAnalyzed: Optional[int] = 0
    issuesFound: Optional[int] = 0
    aiSummary: Optional[str] = ""


@router.post("/validate", response_model=ValidationResponse)
async def validate_data(request: ValidationRequest):
    """AI-powered data validation endpoint."""
    logger.info("Received validation request (type=%s)", request.validationType)
    
    if request.validationType == "FACULTY":
        rows = request.data.get("rows", [])
        valid_departments = request.data.get("validDepartments", [])
        
        valid_depts_str = ", ".join(valid_departments)
        
        valid_subjects_str = ", ".join(request.data.get("validSubjects", []))
        valid_sems_str = ", ".join(request.data.get("validSemesters", []))
        valid_years_str = ", ".join(request.data.get("validAcademicYears", []))
        valid_classes_str = ", ".join(request.data.get("validClasses", []))
        
        system_prompt = (
            "You are an AI assistant designed to validate and map faculty bulk upload data for AcroNexus ERP. "
            "You will be provided with a JSON array of faculty records parsed from an uploaded file (using raw column headers). "
            "Your task is to analyze each record for errors, missing fields, and potential mapping issues. "
            "Identify if headers are misspelled (e.g., 'Emp Code' instead of 'Employee ID', 'Branch' instead of 'Department') and map them conceptually. "
            "The ERP expects these fields: Faculty Name, Employee ID, College Email, Gender, Role, Department, Mobile Number, Joining Date, Qualification, Experience. "
            "Valid Genders: 'MALE', 'FEMALE', 'OTHER'. "
            "Valid Roles: 'HOD', 'COORDINATOR', 'FACULTY'. "
            f"Valid Departments in ERP: {valid_depts_str}. If the provided Department/Branch is not in this list, flag it as an error. "
            "Verify duplicate Employee IDs and Emails ONLY inside the uploaded file across rows. "
            "DO NOT attempt to verify if the record already exists in the database. Database duplicate validation is handled securely by the backend. "
            "If Subjects, Semester, Academic Year, Assigned Class, or Section are provided in the file, you MUST validate them using relational mapping against these valid values: "
            f"Valid Subjects: {valid_subjects_str}. Valid Semesters: {valid_sems_str}. Valid Academic Years: {valid_years_str}. Valid Classes: {valid_classes_str}. If any of these provided values are not in the valid lists, flag them as an error. "
            "Identify issues, suggest corrections for invalid values, and map incorrect headers. "
            "Return a valid JSON object matching this schema exactly:\n"
            "{\n"
            "  \"totalAnalyzed\": <integer>,\n"
            "  \"issuesFound\": <integer>,\n"
            "  \"aiSummary\": \"<string summarizing overall quality>\",\n"
            "  \"issues\": [\n"
            "    { \"rowNumber\": <integer>, \"field\": \"<string field name or mapped name>\", \"originalValue\": \"<string>\", \"suggestedValue\": \"<string>\", \"issueDescription\": \"<string>\" }\n"
            "  ]\n"
            "}\n"
            "Return ONLY the raw JSON string. Do not use Markdown formatting or backticks. If you receive more than 50 rows, only validate the first 50."
        )
        
        sample_rows = rows[:50] if len(rows) > 50 else rows
        user_prompt = f"Please validate the following faculty records:\n{json.dumps(sample_rows)}"
        
        ai_req = AiGenericRequest(
            systemPrompt=system_prompt,
            userPrompt=user_prompt,
            maxTokens=4000,
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
                
            result_dict = json.loads(content.strip())
            
            # Map issues
            issues = []
            for issue_dict in result_dict.get("issues", []):
                issues.append(ValidationIssue(**issue_dict))
                
            return ValidationResponse(
                valid=result_dict.get("issuesFound", 0) == 0,
                message="Faculty validation complete.",
                issues=issues,
                totalAnalyzed=result_dict.get("totalAnalyzed", len(rows)),
                issuesFound=result_dict.get("issuesFound", 0),
                aiSummary=result_dict.get("aiSummary", "")
            )
        except Exception as e:
            logger.error("Failed to process FACULTY validation: %s", e)
            return ValidationResponse(
                valid=False,
                message="Failed to parse AI response or generate content.",
                issues=[],
                totalAnalyzed=len(rows),
                issuesFound=0,
                aiSummary="Failed to process AI validation."
            )
            
    elif request.validationType == "STUDENT":
        rows = request.data.get("rows", [])
        
        valid_sems_str = ", ".join(request.data.get("validSemesters", []))
        valid_years_str = ", ".join(request.data.get("validAcademicYears", []))
        valid_classes_str = ", ".join(request.data.get("validClasses", []))
        
        system_prompt = (
            "You are an AI assistant designed to validate and map student bulk upload data for AcroNexus ERP. "
            "You will be provided with a JSON array of student records parsed from an uploaded file. "
            "Your task is to analyze each record for errors, missing fields, and potential mapping issues (e.g., misspelled class names, missing departments, invalid emails, gender formats). "
            "The expected fields in the ERP are: Student Name, Enrollment Number, College Email, Gender, Batch, Academic Year, Semester, Class, Section, Mobile Number. "
            "Only 'MALE', 'FEMALE', and 'OTHER' are valid genders. "
            "Identify if headers are misspelled (e.g. 'Email' instead of 'College Email', 'Enrollment' instead of 'Enrollment Number', 'Name' instead of 'Student Name') and conceptually map them. "
            "Enrollment Number, Student Name, College Email, Class, and Section are strictly required. "
            "If any strictly required field is truly missing, flag it as an error. If it is just named differently, DO NOT flag it as an error but suggest the correct mapping. "
            "If Academic Year, Semester, Class, or Section are provided in the file, you MUST validate them using relational mapping against these valid values: "
            f"Valid Semesters: {valid_sems_str}. Valid Academic Years: {valid_years_str}. "
            f"Valid Classes (Format: ClassName-Section): {valid_classes_str}. "
            "If a Class and Section combination provided does not match any valid class, flag it as an error and suggest the closest match. "
            "Return a valid JSON object matching this schema exactly:\n"
            "{\n"
            "  \"totalAnalyzed\": <integer>,\n"
            "  \"issuesFound\": <integer>,\n"
            "  \"aiSummary\": \"<string summarizing overall quality>\",\n"
            "  \"issues\": [\n"
            "    { \"rowNumber\": <integer>, \"field\": \"<string field name>\", \"originalValue\": \"<string>\", \"suggestedValue\": \"<string>\", \"issueDescription\": \"<string>\" }\n"
            "  ]\n"
            "}\n"
            "Return ONLY the raw JSON string. Do not use Markdown formatting or backticks. If you receive more than 50 rows, only validate the first 50."
        )
        
        sample_rows = rows[:50] if len(rows) > 50 else rows
        user_prompt = f"Please validate the following student records:\n{json.dumps(sample_rows)}"
        
        ai_req = AiGenericRequest(
            systemPrompt=system_prompt,
            userPrompt=user_prompt,
            maxTokens=4000,
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
                
            result_dict = json.loads(content.strip())
            
            issues = []
            for issue_dict in result_dict.get("issues", []):
                issues.append(ValidationIssue(**issue_dict))
                
            return ValidationResponse(
                valid=result_dict.get("issuesFound", 0) == 0,
                message="Student validation complete.",
                issues=issues,
                totalAnalyzed=result_dict.get("totalAnalyzed", len(rows)),
                issuesFound=result_dict.get("issuesFound", 0),
                aiSummary=result_dict.get("aiSummary", "")
            )
        except Exception as e:
            logger.error("Failed to process STUDENT validation: %s", e)
            return ValidationResponse(
                valid=False,
                message="Failed to parse AI response or generate content.",
                issues=[],
                totalAnalyzed=len(rows),
                issuesFound=0,
                aiSummary="Failed to process AI validation."
            )
            
    # Default generic response
    return ValidationResponse(
        valid=True,
        message="Validation endpoint ready. Business-specific validation will be implemented in future phases.",
        issues=[],
    )
