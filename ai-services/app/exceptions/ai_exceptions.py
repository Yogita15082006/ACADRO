from fastapi import HTTPException


class AiServiceException(HTTPException):
    """Base exception for AI service errors."""

    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)


class GroqConnectionError(AiServiceException):
    """Raised when the Groq API is unreachable."""

    def __init__(self, detail: str = "Failed to connect to Groq API"):
        super().__init__(detail=detail, status_code=502)


class GroqTimeoutError(AiServiceException):
    """Raised when the Groq API request times out."""

    def __init__(self, detail: str = "Groq API request timed out"):
        super().__init__(detail=detail, status_code=504)


class GroqResponseError(AiServiceException):
    """Raised when the Groq API returns an invalid response."""

    def __init__(self, detail: str = "Invalid response from Groq API"):
        super().__init__(detail=detail, status_code=502)


class GroqRateLimitError(AiServiceException):
    """Raised when the Groq API rate limit is exceeded."""

    def __init__(self, detail: str = "Groq API rate limit exceeded"):
        super().__init__(detail=detail, status_code=429)
