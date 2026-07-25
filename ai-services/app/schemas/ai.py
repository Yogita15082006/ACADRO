from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class AiGenericRequest(BaseModel):
    systemPrompt: Optional[str] = "You are a helpful assistant."
    userPrompt: Any
    maxTokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    responseFormat: Optional[str] = None
    modelOverride: Optional[str] = None

class AiGenericResponse(BaseModel):
    content: str
    totalTokensUsed: Optional[int] = 0

class HealthResponse(BaseModel):
    status: str
    message: str
    groq_online: bool
