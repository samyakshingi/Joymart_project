import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = os.getenv("APP_NAME", "JoyMart")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./joymart.db")
    
    class Config:
        env_file = ".env"

settings = Settings()
