import logging
import asyncio
import random
import re
from typing import Optional, Tuple

import httpx

from app.config.settings import settings
from app.exceptions.ai_exceptions import (
    GroqConnectionError,
    GroqTimeoutError,
    GroqResponseError,
    GroqRateLimitError,
)

logger = logging.getLogger(__name__)


class GroqClient:
    """HTTP client for communicating with the Groq API.

    Handles retries, exponential backoff, timeouts, and error classification.
    """

    def __init__(self):
        self._timeout = httpx.Timeout(
            timeout=settings.timeout_ms / 1000.0,
            connect=10.0,
        )

    async def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str | list,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        response_format: Optional[dict] = None,
        model_override: Optional[str] = None
    ) -> dict:
        """Send a chat completion request to Groq with retry logic."""
        data, _ = await self.chat_completion_with_metrics(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format=response_format,
            model_override=model_override,
        )
        return data

    async def chat_completion_with_metrics(
        self,
        system_prompt: str,
        user_prompt: str | list,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        response_format: Optional[dict] = None,
        model_override: Optional[str] = None
    ) -> Tuple[dict, dict]:
        """Send a chat completion request to Groq with intelligent exponential backoff and telemetry tracking.

        Returns (raw_response_dict, telemetry_dict).
        """
        payload = {
            "model": model_override if model_override else settings.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if response_format:
            payload["response_format"] = response_format
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.groq_api_key}",
        }

        last_exception: Optional[Exception] = None
        ai_requests_count = 0
        retries = 0
        rate_limit_429s = 0

        # For 429 rate limit errors, allow up to 6 intelligent retry attempts for per-minute limits to reset
        max_attempts = max(settings.max_retries, 6)

        for attempt in range(1, max_attempts + 1):
            try:
                ai_requests_count += 1
                logger.debug("Calling Groq API (attempt %d/%d)", attempt, max_attempts)
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    response = await client.post(
                        settings.groq_base_url,
                        json=payload,
                        headers=headers,
                    )

                if response.status_code == 429:
                    rate_limit_429s += 1
                    logger.warning("Groq rate limit hit (429) on attempt %d", attempt)
                    if attempt < max_attempts:
                        retries += 1
                        # Parse explicit wait duration from headers or error message text if provided
                        wait_time = 0.0
                        retry_after = response.headers.get("Retry-After")
                        if retry_after:
                            try:
                                wait_time = float(retry_after)
                            except ValueError:
                                pass
                        if not wait_time and response.text:
                            match = re.search(r"try again in (\d+(?:\.\d+)?)s", response.text, re.IGNORECASE)
                            if match:
                                wait_time = float(match.group(1))

                        if wait_time > 0:
                            sleep_duration = min(wait_time + 1.5, 60.0)
                        else:
                            # Exponential backoff with random jitter to prevent thundering herd
                            sleep_duration = min(60.0, (2 ** (attempt - 1)) * 3.0 + random.uniform(0.5, 2.5))

                        logger.info("Intelligent retry: waiting %.2fs before retrying after 429 rate limit...", sleep_duration)
                        await asyncio.sleep(sleep_duration)
                        continue
                    raise GroqRateLimitError(f"Groq rate limit exceeded after {retries} retries.")

                if response.status_code >= 500:
                    logger.warning("Groq server error %d on attempt %d", response.status_code, attempt)
                    if attempt < settings.max_retries:
                        retries += 1
                        await asyncio.sleep(1.0 * attempt)
                        continue
                    raise GroqResponseError(f"Groq API returned status {response.status_code}")

                if response.status_code >= 400:
                    error_body = response.text
                    logger.error("Groq client error %d: %s", response.status_code, error_body)
                    raise GroqResponseError(f"Groq API error {response.status_code}: {error_body}")

                data = response.json()
                telemetry = {
                    "ai_requests": ai_requests_count,
                    "retries": retries,
                    "rate_limit_429s": rate_limit_429s,
                }
                return data, telemetry

            except httpx.TimeoutException as e:
                logger.error("Groq API timeout on attempt %d: %s", attempt, str(e))
                last_exception = e
                if attempt < settings.max_retries:
                    retries += 1
                    await asyncio.sleep(1.0 * attempt)
                    continue

            except httpx.ConnectError as e:
                logger.error("Groq API connection error on attempt %d: %s", attempt, str(e))
                last_exception = e
                if attempt < settings.max_retries:
                    retries += 1
                    await asyncio.sleep(1.0 * attempt)
                    continue

            except (GroqRateLimitError, GroqResponseError):
                raise

            except Exception as e:
                logger.error("Unexpected error calling Groq API on attempt %d: %s", attempt, str(e))
                last_exception = e
                if attempt < settings.max_retries:
                    retries += 1
                    await asyncio.sleep(1.0 * attempt)
                    continue

        if isinstance(last_exception, httpx.TimeoutException):
            raise GroqTimeoutError()
        if isinstance(last_exception, httpx.ConnectError):
            raise GroqConnectionError()
        raise GroqConnectionError(f"Failed after {settings.max_retries} attempts: {str(last_exception)}")

    async def health_check(self) -> bool:
        """Quick health check — sends a minimal prompt to verify Groq is alive."""
        try:
            data = await self.chat_completion(
                system_prompt="You are a helpful assistant.",
                user_prompt="Say 'OK' if you are online.",
                max_tokens=10,
                temperature=0.0,
            )
            choices = data.get("choices", [])
            if choices and choices[0].get("message", {}).get("content"):
                return True
            return False
        except GroqResponseError as e:
            logger.error("Groq health check failed with GroqResponseError: %s", str(e))
            return False
        except Exception as e:
            logger.error("Groq health check failed with unexpected exception: %s", repr(e))
            return False


# Singleton instance
groq_client = GroqClient()
