# Geocoded Contact List & Traffic Insights

Combined application: **Geocoded Contact List** (Express + Pug + MongoDB) and **GeoTraffic Insights** (React + Vite + Supabase) run from one server.

## What’s included

- **Contact list** – Login, CRUD contacts, geocoding (Mapbox/Nominatim), map view.  
  Routes: `/`, `/login`, `/contacts`, `/mailer`, etc.
- **Traffic Insights** – OSM traffic ETL: pick a location, run analysis, view dashboard.  
  Route: **`/traffic/`**

## Quick start

1. **Install and run the main app**
   ```bash
   npm install
   npm start
   ```
   Server runs at **http://127.0.0.1:3000**.  
   Login: `sherpa_14` / `geocode`. MongoDB must be running on `localhost:27017`.

2. **Enable Traffic Insights (optional)**  
   Build the traffic app so it’s served at `/traffic/`:
   ```bash
   npm run build:traffic
   ```
   Then open **http://127.0.0.1:3000/traffic/**.

3. **Develop the traffic app (optional)**  
   For live reload of the React app, run in another terminal:
   ```bash
   npm run dev:traffic
   ```
   That starts Vite on port 8080. Use **http://127.0.0.1:8080** for development (or keep using `/traffic/` after a build).

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Express server (contact list + optional traffic app) |
| `npm run build:traffic` | Install deps and build traffic app into `traffic-app/dist` |
| `npm run dev:traffic` | Run Vite dev server for traffic app (port 8080) |

## Traffic Insights setup

The traffic app uses **Supabase** for the OSM traffic analysis function. In `traffic-app/`:

1. Copy `traffic-app/.env.example` to `traffic-app/.env` (create `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` if needed).
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy the `osm-traffic-analysis` Supabase Edge Function (see `traffic-app/supabase/`).

Without Supabase, the Traffic Insights page will load but analysis requests will fail until the function is deployed and env vars are set.

## Navigation

- From **Contacts** / **Mailer**: use **Traffic Insights** in the header or toolbar to go to `/traffic/`.
- From **Traffic Insights**: use **Contacts** in the header to go back to `/contacts`.
