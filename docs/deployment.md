# Production Deployment Guide

## 1. Environment Configuration Checklist
Create a `.env` file in the production environment with the following keys:

```ini
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://passport.atelier.luxury
DATABASE_URL="postgresql://user:password@host:5432/production_db?schema=public&connection_limit=20"

# Shopify App Credentials (from Shopify Partners Dashboard)
SHOPIFY_API_KEY="your_shopify_client_id"
SHOPIFY_API_SECRET="your_shopify_client_secret"
SCOPES="read_products,write_products,read_orders,read_customers,read_customer_events"

# Cryptographic Keys
SESSION_SECRET="generate_a_secure_64_character_random_hex_string"
```

---

## 2. Database Migration (PostgreSQL)
Run the automated schema push and client generator during container startup or CI/CD deployment:

```bash
npx prisma db push
npx prisma generate
```

---

## 3. Production Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "server"]
```

---

## 4. Background Worker Process
The application contains a built-in lightweight database-backed queue runner (`JobRunner`). To run workers concurrently with zero external dependencies:
- In single-container deployments, the worker is automatically spawned by `server/index.ts`.
- For horizontal scaling, set `WORKER_MODE=worker` on worker containers and `WORKER_MODE=web` on API containers.

---

## 5. Shopify App Store Submission Verification
- [x] Multi-tenant isolation verified with automated test suite.
- [x] Webhook HMAC signatures validated using `crypto.timingSafeEqual`.
- [x] Session tokens and App Bridge integration.
- [x] Recurring application billing and plan tiers configured.
- [x] GDPR/Mandatory webhooks configured (`customers/data_request`, `customers/redact`, `shop/redact`).
