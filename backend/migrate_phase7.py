import sqlite3
import os

DB_PATH = "joymart.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Task 1: Add is_blocked to users
        print("Adding is_blocked to users...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT 0;")
    except sqlite3.OperationalError as e:
        print(f"Column is_blocked might already exist: {e}")

    try:
        # Task 2: Add delivery_otp and delivery_photo_url to orders
        print("Adding delivery_otp and delivery_photo_url to orders...")
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR;")
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_photo_url VARCHAR;")
    except sqlite3.OperationalError as e:
        print(f"Columns delivery_otp/delivery_photo_url might already exist: {e}")

    try:
        # Task 3: Create app_versions table
        print("Creating app_versions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform VARCHAR,
                latest_version VARCHAR,
                minimum_required_version VARCHAR
            );
        """)
        
        # Seed app versions
        cursor.execute("SELECT COUNT(*) FROM app_versions")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO app_versions (platform, latest_version, minimum_required_version) VALUES ('web', '1.0.0', '1.0.0')")
            cursor.execute("INSERT INTO app_versions (platform, latest_version, minimum_required_version) VALUES ('ios', '1.0.0', '1.0.0')")
            cursor.execute("INSERT INTO app_versions (platform, latest_version, minimum_required_version) VALUES ('android', '1.0.0', '1.0.0')")
            print("Seeded app_versions data.")
            
    except sqlite3.OperationalError as e:
        print(f"Error creating app_versions: {e}")

    conn.commit()
    conn.close()
    print("Phase 7 Step 1 Migration completed successfully.")

if __name__ == "__main__":
    migrate()
