import os
from sqlalchemy import text
from database import engine

def fix_schema():
    print("Fixing database schema for Phase 6...")
    with engine.connect() as conn:
        # 1. Update users table
        print("Checking users table...")
        columns_users = [
            ("role", "VARCHAR DEFAULT 'Customer'"),
            ("wallet_balance", "NUMERIC(10, 2) DEFAULT 0")
        ]
        for col_name, col_type in columns_users:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  Added column {col_name} to users.")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    pass # Column exists, skip
                else:
                    print(f"  Error adding {col_name} to users: {e}")

        # 2. Update orders table
        print("Checking orders table...")
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN delivery_slot VARCHAR DEFAULT 'Immediate'"))
            conn.commit()
            print("  Added column delivery_slot to orders.")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                pass
            else:
                print(f"  Error adding delivery_slot to orders: {e}")

        # 3. Create new tables if missing
        print("Ensuring all tables exist...")
        from models import Base
        Base.metadata.create_all(bind=engine)
        print("Phase 6 schema migration complete.")

if __name__ == "__main__":
    fix_schema()
