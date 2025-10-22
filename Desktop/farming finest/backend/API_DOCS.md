# API Documentation - Farming Finest

Base URL: /api

Auth
- POST /api/auth/register
  - body: { email, password, name }
  - returns: { token, profile }

- POST /api/auth/login
  - body: { email }
  - returns: { token, profile }

Animals
- GET /api/animals
  - requires Authorization: Bearer <token>
  - returns: animals with nested health_records

- POST /api/animals
  - body: animal fields
  - returns: created animal

- PUT /api/animals/:id
  - body: fields to update

- DELETE /api/animals/:id

- POST /api/animals/:id/health
  - body: { weight, condition, treatments, notes }

Other routes (crops, feeds, vets, agrovets, sales, export) should be added similarly.

Vets
- GET /api/vets
  - returns: { vets: [ { name, phone, email, latitude, longitude, address } ] }

Feeds
- GET /api/feeds (auth)
- POST /api/feeds (auth)
- GET /api/feeds/alerts (auth) - returns low-stock items

Crops
- GET/POST/PUT/DELETE /api/crops (auth)

Agrovets
- GET /api/agrovets
- GET /api/agrovets/:id/products

Sales
- POST /api/sales (auth)
- GET /api/sales/pl (auth) - simple P&L summary
- GET /api/sales/export (auth) - CSV export

Upload
- POST /api/upload - multipart form-data file -> uploads to Supabase Storage (service role key required)
