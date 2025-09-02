from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os, pathlib, yaml


# Load from settings.yaml if available
root_dir = pathlib.Path(__file__).resolve().parents[1]
settings_file = root_dir / "settings.yaml"
db_url_from_yaml = None
if settings_file.exists():
    with open(settings_file, "r", encoding="utf-8") as f:
        try:
            data = yaml.safe_load(f) or {}
            if "database_url" in data:
                db_url_from_yaml = data["database_url"]
            elif "database" in data:
                db_cfg = data["database"] or {}
                srv = db_cfg.get("server", ".\\SQLEXPRESS")
                dbname = db_cfg.get("mm_name", "MoneySaver")
                user = db_cfg.get("user") or ""
                pwd = db_cfg.get("password") or ""
                driver = db_cfg.get("driver", "ODBC Driver 17 for SQL Server").replace(" ", "+")
                if user:
                    db_url_from_yaml = f"mssql+pyodbc://{user}:{pwd}@{srv}/{dbname}?driver={driver}"
                else:
                    db_url_from_yaml = f"mssql+pyodbc://@{srv}/{dbname}?driver={driver}&trusted_connection=yes"
        except Exception:
            pass

DATABASE_URL = db_url_from_yaml or os.getenv("DATABASE_URL", "sqlite:///./money_saver.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


