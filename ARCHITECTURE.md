# Architecture & Tech Stack

## System Architecture

```
                    ┌──────────────────┐
                    │   SHOPIFY        │
                    │   STOREFRONT     │
                    └────────┬─────────┘
                             │
                             │ App Proxy
                    ┌────────▼─────────┐
                    │   YOUR DOMAIN    │
                    │   /apps/passport │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  PASSPORT SERVER │
                    │  (Express 5)     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Physical       NFC Tags       Service
          Pieces                         History
              │
              ▼
        ┌──────────┐
        │ DATABASE │
        │ (MySQL)  │
        └──────────┘
```

## NFC Flow

```
                    BAG (Wood)
                     │
                     ▼
              ┌────────────┐
              │ NTAG 424   │  ← Hidden inside wood
              │    DNA     │
              └─────┬──────┘
                    │
                  TAP
                    │
                    ▼
                 PHONE
                    │
                    ▼
             HTTPS / URL
                    │
                    ▼
             YOUR SHOPIFY DOMAIN
                    │
                    ▼
             AUTHENTICATION
             (SUN + Server Verify)
                    │
                    ▼
               PASSPORT PAGE
```

## Data Model (Prisma + MySQL)

```
┌─────────────────────┐
│   PhysicalPiece     │
├─────────────────────┤
│ id                  │ PK
│ serial              │ UNIQUE
│ model_name          │
│ color               │
│ material            │
│ size                │
│ hardware            │
│ weight              │
│ manufacturing_year  │
│ purchase_date       │ nullable
│ warranty_until      │ nullable
│ service_status      │ NOT_IN_SERVICE | IN_SERVICE
│ has_service_history │ boolean
│ service_count       │ int
│ last_service_date   │ nullable
│ authentication_status│ AUTHENTIC | UNVERIFIED | FLAGGED
│ nfc_tag_id          │ FK? → NfcTag
│ created_at          │
│ updated_at          │
└─────────┬───────────┘
          │ 1:1
┌─────────▼───────────┐     ┌─────────────────────┐
│      NfcTag         │     │   ServiceRecord     │
├─────────────────────┤     ├─────────────────────┤
│ id                  │ PK  │ id                  │ PK
│ tag_uid             │ UNQ │ piece_id            │ FK → PhysicalPiece
│ tag_id              │ UNQ │ service_date        │
│ status              │     │ service_type        │
│   UNREGISTERED      │     │ notes               │ nullable
│   ACTIVE            │     │ created_at          │
│   REVOKED           │     └─────────────────────┘
│ piece_id            │ FK? → PhysicalPiece
│ registered_at       │     1 PhysicalPiece → N ServiceRecords
└─────────────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.3 |
| **UI Kit** | Polaris | 13.9 |
| **App Bridge** | @shopify/app-bridge-react | 4.1 |
| **Build** | Vite | 8.2 |
| **CSS** | Tailwind CSS | 4.1 |
| **Backend** | Express | 5.1 |
| **ORM** | Prisma | 5.22 |
| **Database** | MySQL | Shared hosting |
| **Language** | TypeScript | 5.7 |
| **NFC** | NTAG 424 DNA | AES-128 + SUN |
| **Hosting** | Chemicloud Shared | cPanel + Passenger |
| **Node** | Node.js | 22.x (via nodevenv) |

## File Structure

```
shopify-app/
├── app/                          # Frontend (React + Vite)
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Hash routing
│   ├── api.ts                    # API helpers (auth headers)
│   ├── styles/
│   │   └── index.css             # Tailwind + custom styles
│   ├── admin/
│   │   └── components/
│   │       ├── AdminLayout.tsx   # Sidebar (3 items)
│   │       ├── ProductsView.tsx  # CRUD products
│   │       ├── TagsView.tsx      # NFC tag management
│   │       └── ServicesView.tsx  # Service records
│   └── public/
│       └── ProductPassport.tsx   # NFC destination page
│
├── server/                       # Backend (Express)
│   ├── index.ts                  # Express entry
│   ├── db.ts                     # Prisma client
│   ├── middleware/
│   │   └── auth.ts               # Auth middleware
│   └── routes/
│       ├── products.routes.ts    # /api/admin/products
│       ├── tags.routes.ts        # /api/admin/tags
│       ├── services.routes.ts    # /api/admin/services
│       └── passport.routes.ts    # /api/passport/:serial
│
├── prisma/
│   └── schema.prisma             # 3 tables
│
├── dist/                         # Built frontend
├── dist-server/                  # Compiled server JS
├── start.js                      # Production entry
├── vite.config.ts                # Vite config
├── tsconfig.json                 # Frontend TS
├── tsconfig.server.json          # Server TS
├── package.json
└── .env                          # Secrets (not in git)
```

## Server Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/products | ✅ | List all products |
| GET | /api/admin/products/:id | ✅ | Get product detail |
| POST | /api/admin/products | ✅ | Create product |
| PATCH | /api/admin/products/:id | ✅ | Update product |
| DELETE | /api/admin/products/:id | ✅ | Delete product |
| GET | /api/admin/tags | ✅ | List all tags |
| POST | /api/admin/tags | ✅ | Register new tag |
| POST | /api/admin/tags/assign | ✅ | Assign tag to product |
| DELETE | /api/admin/tags/:id | ✅ | Remove tag |
| GET | /api/admin/services | ✅ | List service records |
| POST | /api/admin/services | ✅ | Add service record |
| DELETE | /api/admin/services/:id | ✅ | Delete record |
| GET | /api/passport/by-serial/:serial | ❌ | Public passport data |
| GET | /api/passport/by-tag/:tagUid | ❌ | Public passport by tag |

## Auth Headers

```
x-shopify-shop-domain: gorgerine-0siwxdiv.myshopify.com
x-user-role: MERCHANT_OWNER
```

## Deployment

```bash
# On server
cd ~/public_html/shopify-app
git pull origin main
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npx tsc -p tsconfig.server.json
pkill -f "node start.js"
nohup ~/nodevenv/public_html/shopify-app/22/bin/node start.js > /tmp/shopify-app.log 2>&1 &
```

## Production Auth

- Middleware checks `x-shopify-shop-domain` and `x-user-role`
- In development: headers are optional
- Passport endpoints (`/api/passport/*`): no auth required (public)
