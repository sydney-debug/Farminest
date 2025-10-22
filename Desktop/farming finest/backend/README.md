# Farming Finest - Backend

Express-based API that uses Supabase (Postgres + Storage) for data and authentication.

Environment variables (create a .env file):

- SUPABASE_URL - your Supabase project URL
- SUPABASE_ANON_KEY - anon key (used for some client operations)
- SUPABASE_SERVICE_ROLE_KEY - service role key (required for seeds)
- JWT_SECRET - secret for signing JWTs
- PORT - optional port (default 3001)

Quick start:

1. npm install
2. Create .env with values above
3. Run schema in Supabase SQL editor (db/schema.sql)
4. npm run seed (will use SUPABASE_SERVICE_ROLE_KEY)
5. npm run dev

Deployment:

- Render: create a new Web Service, point to this repo/folder, set build command: `npm install` and start command: `npm start`. Add env vars in dashboard.
- Supabase Edge Functions: you can port routes to Edge Functions; keep secrets secure.

API Endpoints (basic): see API_DOCS.md
