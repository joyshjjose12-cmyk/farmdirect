# FarmDirect

A farmer-to-buyer marketplace with bidding and delivery tracking.

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind (`src/`) |
| Backend | **Node.js + Express REST API** (`server/`), written by us |
| Database | **PostgreSQL**, accessed with the `pg` driver using raw, parameterised SQL |
| Auth | Our own: bcrypt password hashes in `user_credentials` + JWT tokens |

The database lives on Supabase, used only as a managed PostgreSQL host. The server connects with the
standard Postgres connection string; `supabase-js`, Supabase Auth and Supabase Realtime are not used.

```
React app  --fetch /api/*-->  Express (server/src)  --pg / raw SQL-->  PostgreSQL
                                   |                                    (tables, views, triggers,
                                   +-- /uploads (listing photos)         procedures, indexes)
```

## Run it

1. **Database (once):** in the SQL editor / psql run `supabase_delivery.sql` (delivery columns, if not already run),
   then `server/sql/001_custom_auth.sql` (own login table; copies existing password hashes).
2. **Server**
   ```
   cd server
   cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
   npm install
   npm run dev               # http://localhost:4000  (check /api/health)
   ```
3. **Frontend** (new terminal, project root)
   ```
   cp .env.example .env      # only VITE_CARTO_KEY is needed now
   npm install
   npm run dev               # http://localhost:5173 ; /api and /uploads are proxied to the server
   ```

## API (all JSON; protected routes need `Authorization: Bearer <token>`)

| Method & path | Who | What |
|---|---|---|
| POST `/api/auth/signup`, `/api/auth/login` | public | create account / sign in, returns token |
| GET `/api/auth/me` | any | current user + profile |
| GET `/api/listings`, `/api/listings/:id` | public | read listings |
| GET `/api/listings/:id/bids` | public | bids on a listing |
| GET `/api/listings/mine` | farmer | dashboard rows |
| POST / PUT `/api/listings`, `/api/listings/:id` | farmer | create / update a listing |
| PATCH `/api/listings/:id/sold` | farmer | mark sold |
| DELETE `/api/listings/:id` | farmer | delete (only if it has no orders) |
| POST `/api/bids` | buyer | place a bid (validated by the `bids_validate` trigger) |
| GET `/api/bids/mine` | buyer | my bids and orders |
| DELETE `/api/bids/:id` | buyer | withdraw a pending bid |
| POST `/api/bids/:id/accept`, `/decline` | farmer | accept (one DB transaction: bid + order + stock) / decline |
| GET `/api/orders?scope=buyer\|farmer\|delivery` | matching role | orders |
| PUT `/api/orders/:id/address` | buyer | delivery address |
| POST `/api/orders/:id/claim`, `/release`, `/advance` | delivery | job board actions |
| POST / GET `/api/orders/:id/location` | delivery / order parties | courier GPS log |
| POST `/api/uploads` | farmer | listing photo (multipart field `photo`) |

Business rules live in two places: SQL triggers (`bids_validate`, `bids_on_accept`) and the Express routes
(role checks, ownership checks, state transitions). Database error messages from triggers are returned to the browser unchanged.
