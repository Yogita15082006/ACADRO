import logging
from typing import Optional

from app.clients.groq_client import groq_client
from app.schemas.ai import AiGenericRequest, AiGenericResponse
from app.exceptions.ai_exceptions import GroqResponseError

logger = logging.getLogger(__name__)


class AiService:
    """Core AI service that orchestrates Groq API interactions.

    All AI logic lives here. The Spring Boot backend calls this service
    via the FastAPI REST endpoints — it never talks to Groq directly.
    """

    async def generate_content(self, request: AiGenericRequest) -> AiGenericResponse:
        """Generate content via the Groq LLM."""
        system_prompt = request.systemPrompt or "You are a helpful assistant."
        user_prompt = request.userPrompt
        max_tokens = request.maxTokens if request.maxTokens is not None else 1000
        temperature = request.temperature if request.temperature is not None else 0.7
        response_format = {"type": request.responseFormat} if request.responseFormat else None

        data = await groq_client.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format=response_format,
            model_override=request.modelOverride,
        )

        content = self._extract_content(data)
        tokens_used = self._extract_tokens(data)

        return AiGenericResponse(content=content, totalTokensUsed=tokens_used)

    async def check_health(self) -> bool:
        """Delegate health check to the Groq client."""
        return await groq_client.health_check()

    def _extract_content(self, data: dict) -> str:
        choices = data.get("choices", [])
        if not choices:
            raise GroqResponseError("Groq response contained no choices")
        message = choices[0].get("message", {})
        content = message.get("content", "")
        if not content:
            raise GroqResponseError("Groq response contained empty content")
        return content

    def _extract_tokens(self, data: dict) -> int:
        usage = data.get("usage", {})
        return usage.get("total_tokens", 0)


# Singleton instance
ai_service = AiService()
