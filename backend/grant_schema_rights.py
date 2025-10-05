"""Grant schema rights to a user in PostgreSQL.

Usage (PowerShell):
$env:PG_SUPERPASS = 'postgres_password'
.\.venv\Scripts\python.exe .\grant_schema_rights.py --db Riddik_db --user khs_u

The script connects as superuser (PG_SUPERUSER, default 'postgres') and grants ALL on schema public to the target user,
and attempts to ALTER SCHEMA public OWNER TO the target user.
"""
import os
import argparse
import sys

try:
    import psycopg2
    from psycopg2 import sql
except Exception:
    print('psycopg2 not installed. Run: .\\.venv\\Scripts\\python.exe -m pip install psycopg2-binary')
    sys.exit(1)


def try_connect(host, port, user, password, dbname):
    return psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', required=True, help='Database name')
    parser.add_argument('--user', required=True, help='Target user to grant rights to')
    parser.add_argument('--host', default=os.getenv('PG_HOST', 'localhost'))
    parser.add_argument('--port', default=os.getenv('PG_PORT', '5432'))
    parser.add_argument('--superuser', default=os.getenv('PG_SUPERUSER', 'postgres'))
    args = parser.parse_args()

    superpass = os.getenv('PG_SUPERPASS')
    if not superpass:
        print('Please set PG_SUPERPASS environment variable to the postgres superuser password.')
        sys.exit(1)

    conn = None
    try:
        try:
            conn = try_connect(args.host, args.port, args.superuser, superpass, args.db)
        except Exception:
            print(f"Could not connect to database '{args.db}' as superuser, trying 'postgres' database instead...")
            conn = try_connect(args.host, args.port, args.superuser, superpass, 'postgres')

        conn.autocommit = True
        cur = conn.cursor()
        print(f"Granting ALL on schema public to {args.user} in database {args.db} (executed on connected DB)...")
        cur.execute(sql.SQL("GRANT ALL ON SCHEMA public TO {};" ).format(sql.Identifier(args.user)))
        print(f"Altering schema owner to {args.user}...")
        cur.execute(sql.SQL("ALTER SCHEMA public OWNER TO {};" ).format(sql.Identifier(args.user)))
        cur.close()
        print('Done.')
    except Exception as e:
        print('Error:', e)
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
