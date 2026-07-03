from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.models import Base

DATABASE_URL = "sqlite:///./mentorconnect.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def _ensure_sqlite_columns():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    table_columns = {table: {column["name"] for column in inspector.get_columns(table)} for table in inspector.get_table_names()}
    alter_statements = []
    if "is_banned" not in table_columns.get("users", set()):
        alter_statements.append("ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT 0")
    if "is_deleted" not in table_columns.get("forum_posts", set()):
        alter_statements.append("ALTER TABLE forum_posts ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0")
    if "parent_id" not in table_columns.get("forum_replies", set()):
        alter_statements.append("ALTER TABLE forum_replies ADD COLUMN parent_id INTEGER")
    if "is_deleted" not in table_columns.get("forum_replies", set()):
        alter_statements.append("ALTER TABLE forum_replies ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0")

    if alter_statements:
        with engine.begin() as conn:
            for statement in alter_statements:
                conn.execute(text(statement))

def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
