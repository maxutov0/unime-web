NovaIoT — Smart Home E‑commerce
==================================

A vanilla JS e‑commerce Single Page App focused on IoT devices (smart home), built with HTML5, CSS3, and ES modules, plus a lightweight Node.js + Express REST API for product, review, and order management.

Quick Start
-----------

- With Docker Compose (recommended):
  - `docker compose up --build`
  - App and API: http://localhost:4000
  - MySQL: localhost:3306 (see compose env)

- Without Docker:
  - Provide MySQL via env: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
  - Run `npm run db:migrate` then `npm run db:seed`.
  - Start app: `npm run dev` → http://localhost:4000

Features
--------

- SPA with hash routes: `#/`, `#/catalog`, `#/product/:id`, `#/cart`, `#/checkout`, `#/profile`, `#/admin`, `#/about`.
- IoT catalog with server-side search, category/rating filters, sort, and pagination.
- Product details: gallery, rating, wishlist, quick add, category/tag badges.
- Orders: secure checkout, user-associated orders, admin order listing.
- Admin: product CRUD, import/export, custom categories.
- Auth: register/login (JWT), admin-only endpoints and UI.
- Theming: light/dark with toggle and persistence.
- Nginx reverse proxy with static caching.

IoT Focus
---------

- Categories: lighting, sensors, security, power/energy, hubs, climate, cleaning, garden, air.
- Protocols: mixed catalog featuring Matter, Wi‑Fi, Zigbee, Thread/Z‑Wave (as metadata/tags).
- Use-cases: automation, energy monitoring, safety (smoke/leak), access (locks), cameras/doorbells.

Promo Codes
-----------

- `SAVE10`: 10% off subtotal
- `FREESHIP`: free shipping
- `WELCOME5`: €5 off orders ≥ €30

Admin Import/Export
-------------------

- In `#/admin` under Products tab, use Export JSON to download current merged catalog; Import JSON to overlay products from a file shaped as `{ "products": [...] }`.

Project Structure
-----------------

- `index.html`: App shell, mounts header/main/footer and JS entry `js/app.js`.
- `assets/`: Icons and placeholder images.
- `styles/`: Base, layout, components, and themes CSS.
- `js/`: ES modules for router, store, API, utils, components, and pages.
- `server/api.mjs`: Express server exposing REST endpoints.

Backend API
-----------

- Base URL: `http://localhost:4000`
- Endpoints:
  - `GET /api/health`
  - `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
  - `GET /api/products-export`, `POST /api/products-import` (admin import/export)
  - `GET /api/products/:id/reviews`, `POST /api/products/:id/reviews`
  - `GET /api/orders` (admin), `GET /api/my-orders` (user), `POST /api/orders`
- Storage: MySQL for users, products, reviews, orders, and custom categories. Seeded via scripts.
- Auth: JWT tokens for sessions; admin routes require admin token.

Auth
----

- `POST /api/auth/register` body `{ name, email, password, adminKey? }` → `{ token, user }`.
- `POST /api/auth/login` body `{ email, password }` → `{ token, user }`.
- `GET /api/auth/me` with header `Authorization: Bearer <token>` → `{ user }`.
- Admin-only routes require the token of a user with `isAdmin: true`.

Migration
---------

- Database migrations live in `server/migrations/` and are executed by `npm run db:migrate`. The API also auto-runs migrations on start.

Environment
-----------

- `PORT`: API port (default 4000)
- `JWT_SECRET`: secret for signing tokens (default `devsecret-change-me`).
- `ADMIN_KEY`: admin registration key to grant admin role (default `NOVA-ADMIN`).
- `DB_HOST` (default `mysql` in Docker), `DB_PORT` (3306)
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Seeder variables (optional):
- `ADMIN_EMAIL` (default `admin@example.com`)
- `ADMIN_PASSWORD` (default `admin123`)
- `ADMIN_NAME` (default `Admin`)

Notes
-----

- Images are placeholders located in `assets/images/`.
- Create additional admin: `npm run admin:create -- EMAIL PASSWORD NAME` (or set env `EMAIL`, `PASSWORD`, `NAME`).
- Seed demo orders: `npm run seed:demo-orders`.
