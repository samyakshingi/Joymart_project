import os
from sqlalchemy import create_engine, text
from database import engine

def fix_schema():
    print("Fixing database schema...")
    with engine.connect() as conn:
        # 1. Update products table
        print("Checking products table...")
        columns_products = [
            ("discounted_price", "NUMERIC(10, 2)"),
            ("stock_count", "INTEGER DEFAULT 0"),
            ("category", "VARCHAR"),
            ("image_url", "VARCHAR")
        ]
        for col_name, col_type in columns_products:
            try:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  Added column {col_name} to products.")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower():
                    pass # Column exists, skip
                else:
                    print(f"  Error adding {col_name} to products: {e}")

        # 2. Update orders table
        print("Checking orders table...")
        columns_orders = [
            ("tip_amount", "NUMERIC(10, 2) DEFAULT 0"),
            ("applied_coupon", "VARCHAR"),
            ("payment_method", "VARCHAR DEFAULT 'Cash'")
        ]
        for col_name, col_type in columns_orders:
            try:
                conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  Added column {col_name} to orders.")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower():
                    pass
                else:
                    print(f"  Error adding {col_name} to orders: {e}")

        # 3. Update users table
        print("Checking users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN firebase_token VARCHAR"))
            conn.commit()
            print("  Added column firebase_token to users.")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower():
                pass
            else:
                print(f"  Error adding firebase_token to users: {e}")

        # 4. Create new tables if missing
        print("Ensuring all tables exist...")
        from models import Base
        Base.metadata.create_all(bind=engine)
        print("Schema fix complete.")

if __name__ == "__main__":
    fix_schema()
