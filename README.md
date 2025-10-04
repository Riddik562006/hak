# AdminTh Secret Manager (refactor)

This workspace contains a refactor of the single-file React app into a small client + server project. Firebase was replaced with a simple PostgreSQL-backed API.

Structure:
- server/ - Express API using PostgreSQL
- client/ - (not created automatically) place your React app here; components are provided as suggestions in this refactor.

Quick start (server):

1. Create a Postgres database and set DATABASE_URL in `.env` (see `.env.example`).
2. Run the migration `psql < server/migrations/init.sql` or run it with a DB tool.
3. Install deps: `npm install` in the repo root.
4. Start the server: `npm run dev:server` (requires nodemon) or `npm start:server`.

API endpoints:
- GET /api/requests/:userId - returns access requests for a user
- POST /api/requests - create a new request (body: userId, secretType, justification?, durationDays?)
- POST /api/requests/:id/decision - admin endpoint to set decision (body: status = GRANTED|DENIED, secretValue?)

Notes:
- The React UI in `EmployeeSecretsClient.jsx` was split into components under `client/src/components` in this refactor. You can move the existing JSX into a create-react-app or Vite project.
