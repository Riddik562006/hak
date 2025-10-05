import sqlite3, os, sys
p = 'db.sqlite'
if not os.path.exists(p):
    print('NO DB', p)
    sys.exit(0)
conn = sqlite3.connect(p)
cur = conn.cursor()
print('TABLES:')
for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    print(' -', row[0])
print('\nTRY user table queries:')
queries = ["SELECT id, username, hashed_password, is_admin FROM 'user'", "SELECT id, username, hashed_password, is_admin FROM user"]
for q in queries:
    try:
        cur.execute(q)
        rows = cur.fetchall()
        print('QUERY OK ->', q)
        for r in rows:
            print(r)
        break
    except Exception as e:
        print('QUERY FAILED ->', q, 'ERR:', e)
conn.close()