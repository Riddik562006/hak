import os
import argparse
import sys

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def run(args):
    host = os.getenv('PG_HOST', 'localhost')
    port = int(os.getenv('PG_PORT', '5432'))
    superuser = os.getenv('PG_SUPERUSER', 'postgres')
    superpass = os.getenv('PG_SUPERPASS')

    if superpass is None:
        print('Please set PG_SUPERPASS environment variable to the postgres superuser password.')
        sys.exit(1)

    dbname = args.db
    dbuser = args.user
    dbpass = args.password

    conn = psycopg2.connect(host=host, port=port, user=superuser, password=superpass, dbname='postgres')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Create database if not exists (Postgres lacks IF NOT EXISTS for CREATE DATABASE, so check)
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
    exists = cur.fetchone()
    if not exists:
        print(f"Creating database {dbname}...")
        cur.execute(f"CREATE DATABASE \"{dbname}\" OWNER {superuser}")
    else:
        print(f"Database {dbname} already exists")

    # Create user or alter password
    cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (dbuser,))
    user_exists = cur.fetchone()
    if not user_exists:
        print(f"Creating user {dbuser}...")
        cur.execute(f"CREATE USER {dbuser} WITH PASSWORD %s", (dbpass,))
    else:
        print(f"User {dbuser} exists, altering password...")
        cur.execute(f"ALTER USER {dbuser} WITH PASSWORD %s", (dbpass,))

    # Grant privileges on database
    print(f"Granting all privileges on database {dbname} to user {dbuser}...")
    cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE \"{dbname}\" TO {dbuser}")

    cur.close()
    conn.close()
    print('Done.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', required=True, help='Имя базы данных (создаваемой)')
    parser.add_argument('--user', required=True, help='Имя пользователя')
    parser.add_argument('--pass', dest='password', required=True, help='Пароль для нового пользователя')
    args = parser.parse_args()
    run(args)
