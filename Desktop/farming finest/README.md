# Farming Finest

Full-stack farm management app (prototype).

Structure:
- backend/ - Node.js + Express API that talks to Supabase
- frontend/ - static HTML/CSS/JS site deployable to Vercel

Core features implemented in this scaffold:
- Farmer dashboard, animals CRUD, health records (backend + simple UI)
- Vets directory with map view (Leaflet)
- Supabase schema and seed script

Not yet implemented in UI: crop tracker forms, feed low-stock alerts UI, agrovet product listings, sales P&L UI, CSV export (backend CSV writer is available as a dependency and can be wired in).

Deployment

1) Supabase
  - Create a Supabase project
  - Run the SQL in `backend/db/schema.sql` in the Supabase SQL editor
  - Create a Service Role key (Settings > API) and copy it for seeding

2) Backend (Render)
  - Create a new Web Service, set build command: `npm install` and start command: `npm start`.
  - Set env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET

3) Frontend (Vercel)
  - Deploy the `frontend/` folder as a static site. Set `FRONTEND_API_URL` environment variable to your backend URL (e.g., https://your-backend.onrender.com/api)

Seeding locally

1. In `backend/` create a `.env` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and run `npm run seed`.

Run locally

1. Backend: cd backend; npm install; npm run dev
2. Frontend: Serve static files (e.g., using Vercel dev or a simple static server). The frontend's `app.js` defaults to `http://localhost:3001/api`.
