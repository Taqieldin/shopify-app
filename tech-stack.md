==============================================================
TECH STACK + SYSTEM ARCHITECTURE SPECIFICATION
==============================================================

IMPORTANT:

This is a MULTI-TENANT PUBLIC SHOPIFY APP.

It is NOT built for one specific brand.

Do not hardcode:

- brand names
- merchant names
- domains
- Shopify store URLs
- product IDs
- customer IDs
- shop IDs
- currencies
- countries
- languages
- business rules
- membership names
- benefit names
- visual identity

Every installed Shopify merchant is a completely independent tenant.

The application must be designed as a reusable SaaS Shopify App that
can be installed by many independent Shopify merchants.

Each merchant must have isolated:

- products
- physical product identities
- passports
- customers
- ownership records
- authentication events
- services
- warranties
- memberships
- credits
- benefits
- settings
- audit logs

Tenant A must NEVER be able to access Tenant B's data.

==============================================================
1. PRIMARY ARCHITECTURAL PRINCIPLE
==============================================================

Shopify remains the commerce platform.

The application EXTENDS Shopify.

Do NOT replace Shopify.

Do NOT build a separate e-commerce platform.

Do NOT build a headless storefront.

Do NOT rebuild:

- Shopify checkout
- Shopify cart
- Shopify product catalog
- Shopify orders
- Shopify inventory
- Shopify customer authentication

The application provides a domain layer around Shopify.

Architecture:

SHOPIFY
    |
    | Shopify APIs / Webhooks / Extensions
    |
    v
PUBLIC SHOPIFY APP
    |
    +---------------------------+
    |                           |
    v                           v
SHOPIFY EXTENSIONS          APP BACKEND
    |                           |
    |                           +----------------------+
    |                           |                      |
    v                           v                      v
THEME APP BLOCK          DOMAIN SERVICES        DATABASE
    |
    v
MERCHANT STOREFRONT

Customer Account UI Extension
    |
    v
Shopify Customer Account
    |
    v
APP BACKEND
    |
    v
DATABASE

Public Passport
    |
    v
APP BACKEND
    |
    v
DATABASE

Embedded Admin
    |
    v
APP BACKEND
    |
    +---- Shopify Admin API
    |
    +---- Database

==============================================================
2. MULTI-TENANCY
==============================================================

The app must be MULTI-TENANT from day one.

Every request must resolve the current Shopify shop/tenant.

Primary tenant identifier:

shop_id

Recommended database strategy:

Every merchant-owned table must contain:

shop_id

Example:

physical_pieces
----------------
id
shop_id
serial
shopify_product_id
shopify_variant_id
...

ownerships
----------
id
shop_id
physical_piece_id
customer_id
...

benefits
--------
id
shop_id
title
...

Never rely only on database filtering in application code.

Implement tenant-aware repositories/services.

Every query must be scoped to the authenticated shop.

Example conceptual rule:

WHERE shop_id = CURRENT_SHOP_ID

Never allow:

SELECT * FROM passports

without tenant filtering.

==============================================================
3. TECHNOLOGY STACK
==============================================================

Use a modern Shopify-compatible TypeScript stack.

PRIMARY LANGUAGE:

TypeScript

RUNTIME:

Node.js

SHOPIFY:

Shopify CLI

Shopify App framework

Shopify Admin GraphQL API

Shopify Customer Account APIs

Shopify Theme App Extensions

Shopify Webhooks

Shopify App Bridge where appropriate

FRONTEND:

React

TypeScript

Shopify Polaris for embedded Shopify Admin UI

Use Shopify-supported extension UI components for
Customer Account UI Extensions.

BACKEND:

Node.js

TypeScript

Shopify App framework

Use a modular service architecture.

API:

REST for simple internal/public endpoints where appropriate.

GraphQL may be used where it provides a meaningful advantage.

Shopify Admin API:

GraphQL ONLY.

Do not build around deprecated REST Admin APIs.

DATABASE:

PostgreSQL

Use a lightweight production ORM/query layer such as:

Prisma

or another mature TypeScript relational ORM.

Choose ONE.

Do not use multiple ORMs.

CACHE:

No Redis initially.

Use:

database indexes
HTTP caching
application-level caching
Shopify caching where appropriate

Only introduce Redis if real production traffic demonstrates
the requirement.

QUEUE:

Do NOT introduce Kafka.

Do NOT introduce RabbitMQ.

Do NOT introduce a distributed event bus.

For MVP:

database-backed jobs OR platform-native scheduled jobs.

STORAGE:

Object storage only when needed for:

- product images
- service photos
- documents
- certificates

Prefer low-cost S3-compatible object storage.

Do not store large binary files directly inside PostgreSQL.

EMAIL:

Use a low-cost transactional email provider.

The email provider must be abstracted behind:

NotificationService

so it can be replaced later.

DEPLOYMENT:

Use a low-cost serverless/cloud platform.

The architecture must support inexpensive MVP deployment.

Do not require:

- Kubernetes
- dedicated servers
- multiple servers
- service mesh
- Redis cluster
- Kafka
- complex infrastructure

==============================================================
4. RECOMMENDED MVP INFRASTRUCTURE
==============================================================

The target is:

VERY LOW OPERATING COST.

The app must be economically sustainable for merchants.

The architecture should aim for:

Application hosting:
low-cost/serverless

Database:
small PostgreSQL instance

Object storage:
pay-as-you-go

Email:
pay-as-you-go/free tier where possible

Monitoring:
free/low-cost tier

No always-running infrastructure unless required.

The system should scale vertically first.

Do NOT prematurely optimize for millions of merchants.

Optimize for:

10 merchants
→
100 merchants
→
1,000 merchants

without requiring a major architectural rewrite.

==============================================================
5. COST ISOLATION PRINCIPLE
==============================================================

This is a commercial SaaS Shopify App.

The merchant should effectively fund their own usage.

Design the system so infrastructure cost increases
primarily with merchant usage.

Avoid expensive per-merchant infrastructure.

BAD:

One server per merchant.

One database per merchant.

One Redis instance per merchant.

One Kubernetes namespace per merchant.

GOOD:

Shared application infrastructure.

Shared PostgreSQL database.

Tenant isolation using shop_id.

Shared object storage.

Shared queues/jobs.

Usage-aware architecture.

==============================================================
6. SHOPIFY APP TYPE
==============================================================

Build:

PUBLIC SHOPIFY APP

The app must be installable by multiple merchants.

It should eventually be publishable through:

Shopify App Store

The architecture must support:

OAuth installation
uninstallation
billing
webhooks
merchant configuration
tenant isolation

==============================================================
7. SHOPIFY APP SURFACES
==============================================================

The application consists of:

A. Embedded Admin App

B. Theme App Extension

C. Customer Account UI Extension

D. Public Passport Web Experience

E. Backend APIs

F. Webhook Handlers

G. Background Jobs

==============================================================
8. EMBEDDED ADMIN APP
==============================================================

The Admin App lives inside Shopify Admin.

Use:

Shopify App Bridge

Shopify Polaris

React

TypeScript

The Admin App should NOT own commerce data.

Shopify remains the source of truth for:

products
variants
orders
customers
inventory

The Admin App manages application-specific domain data.

Admin navigation:

Dashboard
Products
Physical Pieces
Passports
Authentication
Owners
Transfers
Services
Warranty
Membership
Credits
Benefits
Early Access
Customers
Notifications
Analytics
Settings
Audit Logs

==============================================================
9. THEME APP EXTENSION
==============================================================

Build a Shopify Theme App Extension.

Primary block:

Digital Product Identity

It must work on compatible Shopify Online Store themes.

Do NOT assume:

Dawn
Wokiee
Prestige
Impulse
Horizon
or any specific theme.

Do NOT:

modify theme source code
scrape DOM
target CSS selectors
target theme-specific classes
inject global JavaScript unnecessarily

Use:

App Blocks
Theme Editor configuration
Shopify product context
Shopify extension APIs

The extension must be:

lightweight
responsive
accessible
mobile-first
theme-agnostic

==============================================================
10. CUSTOMER ACCOUNT UI EXTENSION
==============================================================

Use Shopify's current Customer Account UI Extension architecture.

Do not build a separate customer dashboard website.

Do not modify Shopify's customer account DOM.

Do not inject arbitrary CSS.

Use Shopify-supported extension components.

Primary surface:

customer-account.page.render

The extension displays:

Private Club
My Pieces
Passports
Care
Service
Benefits
Membership
Credits
Account

The visual identity must remain compatible with Shopify's
extension sandbox.

==============================================================
11. PUBLIC PASSPORT
==============================================================

The Passport is a public web experience.

Example conceptual route:

/passport/[serial]

IMPORTANT:

Do not hardcode the application's domain.

Use environment configuration.

Example:

PUBLIC_APP_URL

The Passport application can be hosted under:

merchant custom domain
app domain
Shopify-compatible routing
or another supported architecture.

The route must resolve:

shop
+
serial

or another secure unique identifier.

Never assume serial numbers are globally unique across merchants.

Use:

shop_id + serial

as the tenant-scoped identity.

==============================================================
12. PASSPORT RESOLUTION
==============================================================

NFC:

NFC
↓
URL
↓
Passport Resolver
↓
Tenant Resolution
↓
Physical Piece
↓
Authentication
↓
Passport

QR:

QR
↓
URL
↓
Passport Resolver
↓
Tenant Resolution
↓
Physical Piece
↓
Authentication
↓
Passport

The resolver must be extremely lightweight.

Do not load the entire application.

==============================================================
13. DOMAIN ARCHITECTURE
==============================================================

Use domain-oriented modules.

Recommended domains:

SHOPIFY
IDENTITY
PASSPORT
AUTHENTICATION
OWNERSHIP
TRANSFER
CARE
SERVICE
WARRANTY
MEMBERSHIP
CREDITS
BENEFITS
EARLY_ACCESS
NOTIFICATIONS
CUSTOMERS
ANALYTICS
AUDIT
SETTINGS
BILLING

Each domain should contain its own:

controllers
services
repositories
schemas
types
validation
business rules

Avoid a giant monolithic service file.

==============================================================
14. LAYERED ARCHITECTURE
==============================================================

Use:

Presentation Layer
        ↓
Application Layer
        ↓
Domain Layer
        ↓
Infrastructure Layer

Presentation:

Admin UI
Theme Extension
Customer Extension
Passport
API routes
Webhook routes

Application:

Use cases
commands
queries
authorization

Domain:

Business rules
entities
value objects
domain services

Infrastructure:

PostgreSQL
Shopify API
Email
Object Storage
Jobs
Logging

Do not place business logic directly inside React components.

Do not place business logic directly inside route handlers.

==============================================================
15. REQUEST FLOW
==============================================================

Typical Admin request:

Shopify Admin
↓
App Bridge
↓
Backend
↓
Shop Session Validation
↓
Tenant Resolution
↓
Authorization
↓
Application Service
↓
Domain Service
↓
Repository
↓
PostgreSQL

Typical Passport request:

Browser
↓
Passport Route
↓
Tenant Resolution
↓
Passport Service
↓
Physical Piece
↓
Authentication Service
↓
Privacy Policy
↓
Response

Typical Customer request:

Shopify Customer Account
↓
Customer Account Extension
↓
Backend
↓
Customer Identity Validation
↓
Tenant Resolution
↓
Authorization
↓
Customer Service
↓
Database

==============================================================
16. AUTHENTICATION ARCHITECTURE
==============================================================

There are multiple identities.

1. Shopify Merchant Identity

Used by:

Shopify Admin App

2. Shopify Customer Identity

Used by:

Customer Account Extension

3. Public Visitor

Used by:

Public Passport

Public visitors must receive only public passport information.

Never treat:

serial number

as authentication.

Never treat:

NFC UID

as authentication.

==============================================================
17. AUTHORIZATION
==============================================================

Implement explicit authorization.

Roles:

MERCHANT_OWNER
MERCHANT_ADMIN
MERCHANT_STAFF
CUSTOMER
PUBLIC

Potential future roles:

SERVICE_CENTER
TECHNICIAN
CONCIERGE

Every sensitive operation must verify:

tenant
+
identity
+
role
+
resource ownership
+
permission

Never trust:

frontend role
frontend customer ID
frontend shop ID

==============================================================
18. DATABASE ARCHITECTURE
==============================================================

Use PostgreSQL.

Primary key strategy:

UUID or UUID-compatible IDs.

Do not expose sequential database IDs publicly.

Use public identifiers where appropriate.

Important:

All timestamps should be stored in UTC.

Display localized times to users.

Use:

created_at
updated_at

where appropriate.

Historical records should be immutable.

==============================================================
19. DATABASE TENANT MODEL
==============================================================

Core tenant:

shops

Example:

shops
-----
id
shopify_shop_id
shop_domain
status
plan
created_at
updated_at

shopify_shop_id must be UNIQUE.

shop_domain must be normalized.

==============================================================
20. CORE DATABASE ENTITIES
==============================================================

Minimum:

shops
shop_settings
shop_features

customers
products
physical_pieces
passports

ownerships
ownership_transfers
gift_registrations

authentication_events
authentication_risk_events

services
service_items

warranties

membership_tiers
customer_memberships

credits_ledger

benefits
benefit_redemptions

early_access

lost_stolen_reports

notifications
communication_preferences

audit_logs

billing_subscriptions

==============================================================
21. PHYSICAL PRODUCT MODEL
==============================================================

Separate:

Shopify Product

from:

Physical Piece

Example:

Shopify Product:

Luxury Bag Model A

Physical Pieces:

PIECE-000001
PIECE-000002
PIECE-000003

Each physical piece can have:

serial
edition
NFC
QR
passport
ownership
authentication
service history

==============================================================
22. OWNERSHIP MODEL
==============================================================

Ownership is historical.

Do NOT simply overwrite:

owner_id

and lose history.

Use:

ownerships

with:

id
shop_id
physical_piece_id
customer_id
started_at
ended_at
source
transfer_id
status
created_at

Current owner can be determined from active ownership.

Historical ownership remains immutable.

==============================================================
23. CREDIT MODEL
==============================================================

Never use:

customer.points

Use immutable:

credits_ledger

Example:

id
shop_id
customer_id
amount
type
reference_type
reference_id
description
created_at

Balance:

SUM(credits_ledger.amount)

For performance at scale, a materialized balance/cache can be
introduced later.

The ledger remains the source of truth.

==============================================================
24. AUTHENTICATION EVENT MODEL
==============================================================

Authentication events must be append-only.

Example:

authentication_events

id
shop_id
physical_piece_id
method
result
timestamp
ip_hash
device_hash
country
region
metadata
created_at

Do not store unnecessary personal data.

Do not expose raw security telemetry to customers.

==============================================================
25. AUDIT LOG
==============================================================

Audit logs are append-only.

Example:

audit_logs

id
shop_id
actor_type
actor_id
action
resource_type
resource_id
metadata
created_at

Examples:

PASSPORT_CREATED
PASSPORT_REVOKED
OWNERSHIP_TRANSFER_STARTED
OWNERSHIP_TRANSFER_COMPLETED
SERVICE_CREATED
CREDITS_GRANTED
CREDITS_REVOKED
PRODUCT_MARKED_STOLEN
AUTHENTICATION_OVERRIDDEN

==============================================================
26. API ARCHITECTURE
==============================================================

Organize APIs by domain.

Example:

/api/admin/*
/api/customer/*
/api/passport/*
/api/ownership/*
/api/services/*
/api/authentication/*
/api/webhooks/*
/api/public/*

Do not expose database tables directly through APIs.

Use DTOs.

Validate every request.

Use schema validation.

Reject unknown or invalid fields where appropriate.

==============================================================
27. PUBLIC API
==============================================================

Public APIs should expose minimal data.

Example:

GET /api/public/passport/:identifier

Response should include only:

public passport information
authentication state
public product information

Never return:

customer email
customer address
staff notes
private service notes
internal risk score
security secrets

==============================================================
28. CUSTOMER API
==============================================================

Customer endpoints:

GET /api/customer/me
GET /api/customer/me/pieces
GET /api/customer/me/membership
GET /api/customer/me/credits
GET /api/customer/me/benefits
GET /api/customer/me/services
GET /api/customer/me/transfers

Every endpoint must verify customer identity server-side.

Never accept:

customer_id

from the browser as the source of truth.

Resolve the customer from authenticated Shopify identity.

==============================================================
29. ADMIN API
==============================================================

Admin endpoints require:

Shopify merchant session
+
tenant resolution
+
role authorization.

Examples:

POST /api/admin/passports
PATCH /api/admin/passports/:id
POST /api/admin/physical-pieces
POST /api/admin/services
POST /api/admin/memberships
POST /api/admin/benefits

==============================================================
30. WEBHOOK ARCHITECTURE
==============================================================

Webhook flow:

Shopify
↓
Webhook Endpoint
↓
Signature Verification
↓
Tenant Resolution
↓
Idempotency Check
↓
Application Handler
↓
Database Transaction
↓
Audit
↓
Response

Webhook handlers must be idempotent.

Do not assume exactly-once delivery.

Potential webhooks:

APP_UNINSTALLED
ORDERS_CREATE
ORDERS_UPDATED
CUSTOMERS_UPDATE
PRODUCTS_UPDATE
PRODUCTS_DELETE
APP_SUBSCRIPTIONS_UPDATE

Only subscribe to events that are actually required.

==============================================================
31. SHOPIFY DATA SYNCHRONIZATION
==============================================================

Do not mirror all Shopify data.

Store only:

Shopify IDs
required snapshots
domain relationships

Example:

products

id
shop_id
shopify_product_id
shopify_variant_id
metadata if required

When more information is required:

fetch from Shopify API.

Use caching where appropriate.

==============================================================
32. BILLING ARCHITECTURE
==============================================================

The application should support Shopify App Billing.

The app must be able to offer plans such as:

FREE
STARTER
GROWTH
PRO

Exact pricing should NOT be hardcoded into domain logic.

Use configuration.

Billing state belongs to:

billing_subscriptions

The application should support:

trial
active
paused
cancelled
expired

Feature access must be controlled by plan.

==============================================================
33. SAAS COST CONTROL
==============================================================

The architecture must minimize infrastructure cost.

Do NOT create infrastructure per merchant.

Use shared:

application
database
storage
jobs

Use:

database indexes
pagination
lazy loading
caching
rate limiting

Avoid:

long-running workers
large memory processes
unnecessary polling

Prefer:

webhooks over polling.

==============================================================
34. BACKGROUND JOB ARCHITECTURE
==============================================================

Jobs may be required for:

email
care reminders
warranty reminders
CSV processing
analytics aggregation

MVP:

Use a database-backed job table or low-cost platform-native jobs.

Example:

jobs

id
shop_id
type
payload
status
attempts
available_at
processed_at
created_at

Implement retry logic.

Use exponential backoff.

Make jobs idempotent.

==============================================================
35. FILE STORAGE
==============================================================

Store files outside PostgreSQL.

Possible files:

service photos
product photos
documents
certificates

Architecture:

Application
↓
Signed upload URL
↓
Object Storage
↓
Database stores object reference

Do not expose private storage buckets publicly.

Use signed URLs where appropriate.

==============================================================
36. SECURITY ARCHITECTURE
==============================================================

Security requirements:

HTTPS everywhere.

Secrets stored in environment variables / secret manager.

Never commit secrets.

Validate:

Shopify signatures
webhooks
sessions
customer identity
admin identity

Use:

rate limiting
input validation
output encoding
secure cookies where applicable
CSRF protection where applicable
authorization middleware
audit logging

Encrypt highly sensitive data where appropriate.

==============================================================
37. PRIVACY ARCHITECTURE
==============================================================

Follow applicable privacy requirements.

Design for:

GDPR
Shopify privacy requirements
customer data deletion

Support:

data minimization
data access
data deletion
consent preferences

Do not collect:

precise location
device fingerprints
personal data

unless there is a demonstrated business/security requirement.

==============================================================
38. ERROR HANDLING
==============================================================

Use centralized error handling.

Never expose:

stack traces
database errors
SQL
internal IDs
security logic

Use structured error codes.

Example:

PASSPORT_NOT_FOUND

TRANSFER_EXPIRED

UNAUTHORIZED

AUTHENTICATION_UNAVAILABLE

SERVICE_UNAVAILABLE

==============================================================
39. OBSERVABILITY
==============================================================

MVP observability:

structured logs
error tracking
basic metrics

Monitor:

API latency
error rates
webhook failures
database errors
authentication failures
job failures

Do not log:

passwords
tokens
private customer information
cryptographic secrets

==============================================================
40. TESTING ARCHITECTURE
==============================================================

Unit tests:

domain services
business rules
authorization
ledger calculations
ownership transitions
transfer state machine

Integration tests:

database
Shopify API adapters
webhooks
authentication

Extension tests:

Theme App Block
Customer Account Extension

End-to-end tests:

installation
registration
passport
ownership transfer
customer account
admin

==============================================================
41. STATE MACHINES
==============================================================

Important domains should use explicit state transitions.

Ownership Transfer:

DRAFT
↓
PENDING
↓
ACCEPTED
↓
COMPLETED

Alternative:

CANCELLED
EXPIRED
REJECTED
REVOKED

Passport:

DRAFT
↓
ACTIVE
↓
REVOKED

Physical Piece:

MANUFACTURED
↓
ACTIVE
↓
REGISTERED
↓
SERVICED
↓
TRANSFERRED
↓
RETIRED

Security:

NORMAL
↓
LOW_RISK
↓
REVIEW
↓
HIGH_RISK

Never allow arbitrary state changes.

==============================================================
42. EVENT-DRIVEN DOMAIN DESIGN
==============================================================

Do not implement a distributed event bus.

Use internal domain events conceptually.

Examples:

PassportRegistered
OwnershipTransferred
ServiceCompleted
BenefitGranted
AuthenticationFlagged

These can trigger:

notifications
audit logs
analytics
jobs

MVP implementation can use direct application services.

Introduce an event infrastructure only if required later.

==============================================================
43. CACHING STRATEGY
==============================================================

Cache only safe data.

Good candidates:

public passport metadata
public product information
static configuration

Do NOT cache sensitive customer data without a clear invalidation
strategy.

Every cache key must include tenant context.

Example:

passport:{shop_id}:{passport_id}

Never:

passport:{passport_id}

if IDs could collide or be reused.

==============================================================
44. DATABASE INDEXING
==============================================================

Important indexes:

shops.shopify_shop_id

physical_pieces:
shop_id + serial
shop_id + shopify_product_id
shop_id + shopify_variant_id

passports:
shop_id + physical_piece_id

ownerships:
shop_id + physical_piece_id
shop_id + customer_id

authentication_events:
shop_id + physical_piece_id
shop_id + created_at

credits_ledger:
shop_id + customer_id
shop_id + created_at

services:
shop_id + physical_piece_id

audit_logs:
shop_id + created_at

Indexes must be based on real query patterns.

Do not index every column.

==============================================================
45. FULL PROJECT TREE
==============================================================

Use a structure similar to the following.

Adjust the exact files to the current Shopify CLI template and
official Shopify architecture at implementation time.

==============================================================

shopify-private-club/
│
├── README.md
├── LICENSE
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
├── vitest.config.ts
├── playwright.config.ts
├── .gitignore
├── .env.example
│
├── shopify.app.toml
├── shopify.web.toml
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── security.md
│   ├── api.md
│   ├── webhooks.md
│   ├── extensions.md
│   ├── deployment.md
│   ├── billing.md
│   └── privacy.md
│
├── app/
│   │
│   ├── root.tsx
│   ├── routes.ts
│   │
│   ├── routes/
│   │   │
│   │   ├── _index.tsx
│   │   │
│   │   ├── app/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── products.tsx
│   │   │   ├── physical-pieces.tsx
│   │   │   ├── passports.tsx
│   │   │   ├── authentication.tsx
│   │   │   ├── owners.tsx
│   │   │   ├── transfers.tsx
│   │   │   ├── services.tsx
│   │   │   ├── warranty.tsx
│   │   │   ├── membership.tsx
│   │   │   ├── credits.tsx
│   │   │   ├── benefits.tsx
│   │   │   ├── early-access.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── analytics.tsx
│   │   │   ├── notifications.tsx
│   │   │   ├── settings.tsx
│   │   │   └── audit-logs.tsx
│   │   │
│   │   ├── passport/
│   │   │   └── $identifier.tsx
│   │   │
│   │   └── api/
│   │       │
│   │       ├── public/
│   │       │   └── passport.$identifier.ts
│   │       │
│   │       ├── customer/
│   │       │   ├── me.ts
│   │       │   ├── pieces.ts
│   │       │   ├── membership.ts
│   │       │   ├── credits.ts
│   │       │   ├── benefits.ts
│   │       │   ├── services.ts
│   │       │   └── transfers.ts
│   │       │
│   │       ├── admin/
│   │       │   ├── passports.ts
│   │       │   ├── physical-pieces.ts
│   │       │   ├── services.ts
│   │       │   ├── membership.ts
│   │       │   ├── credits.ts
│   │       │   ├── benefits.ts
│   │       │   └── settings.ts
│   │       │
│   │       ├── ownership/
│   │       │   ├── transfers.ts
│   │       │   ├── transfer.$token.ts
│   │       │   └── transfer.$token.accept.ts
│   │       │
│   │       ├── authentication/
│   │       │   └── authenticate.ts
│   │       │
│   │       └── webhooks/
│   │           ├── app-uninstalled.ts
│   │           ├── orders-create.ts
│   │           ├── orders-update.ts
│   │           ├── customers-update.ts
│   │           ├── products-update.ts
│   │           └── app-subscriptions-update.ts
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── passport/
│   │   ├── ownership/
│   │   ├── authentication/
│   │   ├── services/
│   │   ├── membership/
│   │   ├── credits/
│   │   └── common/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── types/
│
├── server/
│   │
│   ├── auth/
│   │   ├── shopify-auth.ts
│   │   ├── customer-auth.ts
│   │   └── authorization.ts
│   │
│   ├── middleware/
│   │   ├── tenant.ts
│   │   ├── auth.ts
│   │   ├── authorization.ts
│   │   ├── rate-limit.ts
│   │   ├── validation.ts
│   │   └── error-handler.ts
│   │
│   ├── domains/
│   │   │
│   │   ├── shop/
│   │   │   ├── shop.service.ts
│   │   │   ├── shop.repository.ts
│   │   │   ├── shop.types.ts
│   │   │   └── shop.schema.ts
│   │   │
│   │   ├── passport/
│   │   │   ├── passport.service.ts
│   │   │   ├── passport.repository.ts
│   │   │   ├── passport.types.ts
│   │   │   ├── passport.schema.ts
│   │   │   ├── passport.policy.ts
│   │   │   └── passport.events.ts
│   │   │
│   │   ├── physical-piece/
│   │   │   ├── physical-piece.service.ts
│   │   │   ├── physical-piece.repository.ts
│   │   │   ├── physical-piece.types.ts
│   │   │   └── physical-piece.schema.ts
│   │   │
│   │   ├── authentication/
│   │   │   ├── authentication.service.ts
│   │   │   ├── authentication.repository.ts
│   │   │   ├── authentication.types.ts
│   │   │   ├── authentication.policy.ts
│   │   │   ├── risk-engine.ts
│   │   │   └── authentication.events.ts
│   │   │
│   │   ├── ownership/
│   │   │   ├── ownership.service.ts
│   │   │   ├── ownership.repository.ts
│   │   │   ├── ownership.types.ts
│   │   │   ├── ownership.policy.ts
│   │   │   └── ownership.events.ts
│   │   │
│   │   ├── transfer/
│   │   │   ├── transfer.service.ts
│   │   │   ├── transfer.repository.ts
│   │   │   ├── transfer.types.ts
│   │   │   ├── transfer.schema.ts
│   │   │   └── transfer.state-machine.ts
│   │   │
│   │   ├── gift/
│   │   │   ├── gift.service.ts
│   │   │   ├── gift.repository.ts
│   │   │   └── gift.types.ts
│   │   │
│   │   ├── service/
│   │   │   ├── service.service.ts
│   │   │   ├── service.repository.ts
│   │   │   ├── service.types.ts
│   │   │   └── service.schema.ts
│   │   │
│   │   ├── warranty/
│   │   │   ├── warranty.service.ts
│   │   │   ├── warranty.repository.ts
│   │   │   └── warranty.types.ts
│   │   │
│   │   ├── membership/
│   │   │   ├── membership.service.ts
│   │   │   ├── membership.repository.ts
│   │   │   ├── membership.types.ts
│   │   │   └── membership.rules.ts
│   │   │
│   │   ├── credits/
│   │   │   ├── credits.service.ts
│   │   │   ├── credits.repository.ts
│   │   │   ├── credits.types.ts
│   │   │   └── credits.ledger.ts
│   │   │
│   │   ├── benefits/
│   │   │   ├── benefits.service.ts
│   │   │   ├── benefits.repository.ts
│   │   │   ├── benefits.types.ts
│   │   │   └── benefits.rules.ts
│   │   │
│   │   ├── early-access/
│   │   │   ├── early-access.service.ts
│   │   │   ├── early-access.repository.ts
│   │   │   └── early-access.rules.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.repository.ts
│   │   │   ├── notification.types.ts
│   │   │   └── providers/
│   │   │       └── email.provider.ts
│   │   │
│   │   ├── lost-stolen/
│   │   │   ├── lost-stolen.service.ts
│   │   │   ├── lost-stolen.repository.ts
│   │   │   └── lost-stolen.types.ts
│   │   │
│   │   ├── customer/
│   │   │   ├── customer.service.ts
│   │   │   ├── customer.repository.ts
│   │   │   └── customer.types.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.repository.ts
│   │   │   └── analytics.types.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── audit.service.ts
│   │   │   ├── audit.repository.ts
│   │   │   └── audit.types.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.repository.ts
│   │   │   └── settings.types.ts
│   │   │
│   │   └── billing/
│   │       ├── billing.service.ts
│   │       ├── billing.repository.ts
│   │       └── billing.types.ts
│   │
│   ├── infrastructure/
│   │   │
│   │   ├── database/
│   │   │   ├── client.ts
│   │   │   ├── transaction.ts
│   │   │   └── repositories/
│   │   │
│   │   ├── shopify/
│   │   │   ├── admin-client.ts
│   │   │   ├── customer-client.ts
│   │   │   ├── graphql/
│   │   │   ├── webhooks/
│   │   │   └── mappers/
│   │   │
│   │   ├── storage/
│   │   │   ├── object-storage.ts
│   │   │   └── signed-urls.ts
│   │   │
│   │   ├── email/
│   │   │   └── email-provider.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── job-runner.ts
│   │   │   ├── job-repository.ts
│   │   │   └── handlers/
│   │   │
│   │   ├── cache/
│   │   │   └── cache.ts
│   │   │
│   │   ├── logging/
│   │   │   └── logger.ts
│   │   │
│   │   └── monitoring/
│   │       └── monitoring.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── validation/
│   │   ├── security/
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── config/
│       ├── env.ts
│       ├── features.ts
│       └── billing.ts
│
├── extensions/
│   │
│   ├── digital-product-identity/
│   │   ├── shopify.extension.toml
│   │   ├── blocks/
│   │   │   └── digital-identity.liquid
│   │   ├── assets/
│   │   ├── snippets/
│   │   ├── locales/
│   │   └── README.md
│   │
│   └── customer-account/
│       ├── shopify.extension.toml
│       ├── src/
│       │   ├── index.tsx
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       ├── locales/
│       └── README.md
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── scripts/
│   ├── seed.ts
│   ├── import-csv.ts
│   ├── export-csv.ts
│   └── verify-environment.ts
│
├── tests/
│   │
│   ├── unit/
│   │   ├── passport/
│   │   ├── ownership/
│   │   ├── transfer/
│   │   ├── authentication/
│   │   ├── credits/
│   │   ├── membership/
│   │   └── benefits/
│   │
│   ├── integration/
│   │   ├── database/
│   │   ├── shopify/
│   │   ├── webhooks/
│   │   └── api/
│   │
│   └── e2e/
│       ├── installation/
│       ├── passport/
│       ├── registration/
│       ├── ownership/
│       ├── transfer/
│       ├── customer-account/
│       └── admin/
│
└── public/
    ├── favicon.ico
    └── static-assets/

==============================================================
46. IMPORTANT TREE RULE
==============================================================

The tree above is an ARCHITECTURAL TARGET.

Do not blindly force the project into this exact tree if the
current Shopify CLI generates a different official structure.

The implementation must prioritize:

CURRENT SHOPIFY OFFICIAL ARCHITECTURE

over:

this exact filename structure.

However, preserve the architectural separation:

extensions
domain logic
application logic
infrastructure
database
tests
configuration

==============================================================
47. ENVIRONMENT VARIABLES
==============================================================

Create:

.env.example

It should contain placeholders for:

SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=
SHOPIFY_SCOPES=

DATABASE_URL=

SESSION_SECRET=

ENCRYPTION_KEY=

WEBHOOK_SECRET=

PUBLIC_APP_URL=

OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=

EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=

SENTRY_DSN=

Do not commit real values.

Do not hardcode secrets.

==============================================================
48. SHOPIFY SCOPES
==============================================================

Request the MINIMUM scopes necessary.

Do not request broad permissions just because they may be useful
in the future.

Determine the exact scopes based on the implemented MVP.

Potential areas may include:

products
customers
orders

but the final implementation must verify the current Shopify
scope names and requirements before adding them.

Ask:

"What data does the app actually need?"

before requesting a scope.

==============================================================
49. SHOPIFY API VERSION
==============================================================

Do NOT hardcode an old Shopify API version.

Before implementation:

Check the CURRENT stable Shopify Admin GraphQL API version.

Check:

Customer Account API requirements.

Check:

Theme App Extension requirements.

Check:

Shopify CLI requirements.

Check:

current authentication requirements.

Use the currently supported stable versions.

==============================================================
50. PERFORMANCE BOUNDARIES
==============================================================

Storefront extension:

MUST remain tiny.

Do not bundle:

React
React Router
large UI libraries
Admin dependencies

into the storefront block unless absolutely required.

The Theme App Extension should preferably render using:

Liquid
HTML
CSS
minimal JavaScript

Only load JavaScript when interaction actually requires it.

Customer Account Extension may use the technologies officially
supported by Shopify for that extension surface.

Admin can use React and Polaris.

==============================================================
51. PUBLIC PASSPORT PERFORMANCE
==============================================================

Passport pages should be optimized for:

mobile
NFC tap
QR scan
slow connections

Prioritize:

fast first render
minimal JS
optimized images
server-side rendering where supported
HTTP caching
small payloads

Do not require login to display public passport information.

==============================================================
52. DATABASE PERFORMANCE
==============================================================

Use:

pagination
cursor pagination where appropriate
indexes
selective queries
transactions
connection pooling

Never load:

all customers
all passports
all authentication events

into memory.

CSV operations must be streamed or processed in batches.

==============================================================
53. CSV IMPORT ARCHITECTURE
==============================================================

CSV import must support:

large files

without loading the entire file into memory.

Flow:

Upload CSV
↓
Validate
↓
Parse in stream/batches
↓
Validate rows
↓
Preview errors
↓
Commit transaction/batches
↓
Generate import report

Never partially corrupt a passport.

==============================================================
54. TRANSACTIONAL INTEGRITY
==============================================================

Critical operations must use database transactions.

Examples:

Ownership transfer completion:

BEGIN
↓
Validate transfer
↓
Validate recipient
↓
Lock physical piece
↓
Close old ownership
↓
Create new ownership
↓
Create transfer completion record
↓
Audit
↓
COMMIT

If anything fails:

ROLLBACK

Same principle applies to:

credits
passport revocation
service completion
gift registration

==============================================================
55. CONCURRENCY
==============================================================

The system must prevent:

two owners registering the same piece
two transfers completing simultaneously
duplicate credits
duplicate webhook processing

Use:

database constraints
transactions
unique indexes
row locking where appropriate
idempotency keys

Do not rely solely on frontend checks.

==============================================================
56. UNIQUE CONSTRAINTS
==============================================================

Examples:

shops.shopify_shop_id UNIQUE

(shop_id, serial) UNIQUE

(shop_id, physical_piece_id, active ownership)
UNIQUE through appropriate database modeling

transfer_token UNIQUE

webhook_event_id UNIQUE

idempotency_key UNIQUE where applicable

==============================================================
57. NO PREMATURE MICROSERVICES
==============================================================

This application must begin as a:

MODULAR MONOLITH.

Not:

microservices.

The architecture must have clean boundaries so domains can be
extracted later if scale requires it.

But V1 should remain:

ONE APPLICATION
+
ONE DATABASE
+
LOW-COST STORAGE
+
LOW-COST EMAIL
+
OPTIONAL JOB RUNNER

==============================================================
58. DEPLOYMENT ARCHITECTURE
==============================================================

Recommended conceptual deployment:

                    INTERNET
                       |
                       v
                Shopify Storefront
                       |
              +--------+--------+
              |                 |
              v                 v
        Theme App Block    Passport
                                |
                                v
                         Application Server
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
        PostgreSQL       Object Storage       Email Provider
             |
             v
        Shopify APIs

Admin:

Shopify Admin
      |
      v
Embedded App
      |
      v
Application Server
      |
      +---- PostgreSQL
      |
      +---- Shopify GraphQL

Customer:

Shopify Customer Account
      |
      v
Customer Account Extension
      |
      v
Application Server
      |
      v
PostgreSQL

==============================================================
59. SCALING STRATEGY
==============================================================

Phase 1:

1–50 merchants

Focus:

lowest possible cost
simplicity
correctness

Phase 2:

50–500 merchants

Add:

better caching
background jobs
query optimization
analytics aggregation

Phase 3:

500–5,000 merchants

Consider:

dedicated worker processes
queue infrastructure
read replicas if justified
advanced observability

Phase 4:

5,000+ merchants

Only then consider:

service extraction
distributed infrastructure
advanced event architecture

Never implement Phase 4 infrastructure during MVP.

==============================================================
60. ARCHITECTURAL NON-NEGOTIABLES
==============================================================

The final implementation MUST:

1. Be a public multi-tenant Shopify App.

2. Support multiple independent Shopify merchants.

3. Never hardcode a brand.

4. Never hardcode a merchant.

5. Never hardcode Shopify IDs.

6. Never depend on a specific theme.

7. Use official Shopify extensions.

8. Use Shopify Admin GraphQL API.

9. Use Shopify webhooks.

10. Maintain strict tenant isolation.

11. Keep Shopify as the commerce source of truth.

12. Keep domain-specific data in the application database.

13. Start as a modular monolith.

14. Use PostgreSQL.

15. Avoid unnecessary infrastructure.

16. Minimize storefront JavaScript.

17. Keep operating costs extremely low.

18. Make merchant usage economically sustainable.

19. Use immutable records for critical history.

20. Enforce authorization server-side.

21. Never expose sensitive security data.

22. Never implement fake cryptography.

23. Never assume NFC alone proves authenticity.

24. Never rebuild Shopify functionality unnecessarily.

25. Never create a separate e-commerce storefront.

==============================================================
61. IMPLEMENTATION ORDER
==============================================================

Build in this order:

PHASE 1
Shopify App foundation
+
OAuth
+
tenant model
+
database
+
basic embedded admin

PHASE 2
Physical Piece
+
Passport
+
Serial management

PHASE 3
Theme App Extension
+
Public Passport

PHASE 4
Product Registration
+
Customer identity

PHASE 5
Ownership
+
Ownership history

PHASE 6
Ownership Transfer
+
Gift flow

PHASE 7
Authentication
+
Authentication events

PHASE 8
Customer Account UI Extension
+
Private Club

PHASE 9
Membership
+
Maison Credits
+
Benefits

PHASE 10
Care
+
Services
+
Warranty

PHASE 11
Lost/Stolen
+
Risk detection

PHASE 12
CSV
+
Analytics
+
Audit

PHASE 13
Shopify Billing
+
Plans
+
Usage controls

PHASE 14
Performance
+
Security hardening
+
Testing
+
Deployment

==============================================================
62. FINAL ARCHITECTURAL OBJECTIVE
==============================================================

The final system should be:

A LOW-COST,
MULTI-TENANT,
PRODUCTION-READY,
THEME-AGNOSTIC,
PUBLIC SHOPIFY APP.

It should allow ANY eligible Shopify merchant to install the app
and create a digital product identity and private customer
relationship layer around their physical products.

The application should not become another e-commerce platform.

It should become an infrastructure layer ON TOP OF SHOPIFY.

Core relationship:

SHOPIFY COMMERCE
        +
PHYSICAL PRODUCT IDENTITY
        +
DIGITAL PASSPORT
        +
AUTHENTICATION
        +
OWNERSHIP
        +
LIFECYCLE
        +
CUSTOMER RELATIONSHIP

The architecture must remain simple and inexpensive during MVP,
while providing clean boundaries for future scale.

Do not over-engineer.

Do not under-engineer the security, tenant isolation,
ownership integrity, or financial/credit ledger.

Build the smallest architecture that can safely become a serious
Shopify App Store SaaS product.