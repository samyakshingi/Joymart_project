import sqlite3
conn = sqlite3.connect('backend/joymart.db')
conn.execute("UPDATE app_versions SET minimum_required_version='1.0.0' WHERE platform='web'")
conn.commit()
conn.close()
print("Version gate reverted")
