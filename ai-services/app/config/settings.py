import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Explicitly load the .env file into the environment
load_dotenv(ENV_PATH)

class Settings(BaseSettings):
    groq_api_key: str
    groq_base_url: str = "https://api.groq.com/openai/v1/chat/completions"
    groq_model: str = "llama-3.1-8b-instant"
    timeout_ms: int = 30000
    max_retries: int = 3

    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8", extra="ignore")

settings = Settings()
