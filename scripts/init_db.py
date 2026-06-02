"""Apply database/schema.sql to the configured database (replaces scripts/initDb.js).

Usage:  python scripts/init_db.py
"""
import sys
from pathlib import Path

from sqlalchemy import create_engine

# Make the project root importable so we can reuse app.config.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import DATABASE_URL  # noqa: E402


def main() -> None:
    schema_path = Path(__file__).resolve().parent.parent / "database" / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")

    engine = create_engine(DATABASE_URL)
    try:
        with engine.begin() as conn:
            conn.exec_driver_sql(sql)  # psycopg2 runs the multi-statement script
        print(f"OK  Database schema applied from {schema_path}")
    except Exception as err:  # noqa: BLE001
        print(f"ERR Failed to apply schema: {err}")
        if "does not exist" in str(err):
            print('    The "routecare" database does not exist yet. Create it first:')
            print("    psql -U postgres -f database/create-database.sql")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
