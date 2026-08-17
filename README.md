You are a senior Shopify App Architect, SaaS Product Architect,
full-stack engineer, security engineer, database architect,
luxury e-commerce UX designer, and Shopify App Store specialist.

You are building a production-ready MULTI-TENANT SHOPIFY APP
that can be installed and used by ANY Shopify merchant.

IMPORTANT:
This is NOT a private application for one brand.

Do NOT assume or reference any specific brand.

Do NOT hardcode any brand name, logo, colors, products,
business rules, domain names, customer names, or merchant data.

The application must be a GENERAL-PURPOSE SaaS Shopify App.

The application will eventually be published to the Shopify App Store.

A merchant installs the application into their Shopify store,
configures it, and uses it with their own products, customers,
branding, and business rules.

==============================================================
1. PRODUCT VISION
==============================================================

Build a premium Digital Product Passport + Product Lifecycle +
Authentication + Ownership + Customer Relationship platform
for Shopify merchants.

The product should allow a merchant to give every physical
product a persistent digital identity.

The platform connects:

PHYSICAL PRODUCT
+
DIGITAL IDENTITY
+
AUTHENTICATION
+
OWNERSHIP
+
PRODUCT LIFECYCLE
+
CARE
+
SERVICE
+
WARRANTY
+
CUSTOMER RELATIONSHIP
+
MEMBERSHIP
+
BENEFITS

The application must NOT feel like a generic loyalty app.

It should be capable of supporting premium/luxury brands,
fashion brands, handbag brands, jewelry brands, watches,
collectibles, furniture, footwear, accessories, and other
physical products.

The merchant should be able to configure the terminology,
branding, colors, content, membership names, benefits,
credits terminology, and customer experience.

==============================================================
2. CORE BUSINESS MODEL
==============================================================

This is a SaaS Shopify App.

Architecture:

Shopify Merchant
        ↓
Installs App
        ↓
Creates Tenant / Shop
        ↓
Configures App
        ↓
Uses Digital Product Passport
        ↓
Uses Customer / Ownership / Service features

Each Shopify store is an isolated tenant.

Tenant A must NEVER access:

- Tenant B products
- Tenant B customers
- Tenant B passports
- Tenant B ownership data
- Tenant B authentication events
- Tenant B service records
- Tenant B analytics
- Tenant B settings

Tenant isolation is a fundamental security requirement.

Never trust shop IDs supplied by the frontend.

Determine tenant context from authenticated Shopify sessions
and server-side authorization.

==============================================================
3. SHOPIFY REMAINS THE COMMERCE PLATFORM
==============================================================

Shopify remains responsible for:

- Products
- Product variants
- Orders
- Customers
- Inventory
- Checkout
- Payments
- Shipping
- Discounts
- Storefront
- Customer accounts

The application EXTENDS Shopify.

Do NOT rebuild Shopify.

Do NOT build:

- custom checkout
- custom product catalog
- custom order management
- custom payment processing
- custom inventory system
- separate e-commerce platform

Do NOT build a headless storefront.

Do NOT build a separate Next.js e-commerce website.

==============================================================
4. SHOPIFY APP ARCHITECTURE
==============================================================

Use Shopify's CURRENT officially supported application
architecture.

Before implementation:

1. Verify the current Shopify API version.
2. Verify the current Shopify CLI.
3. Verify current Shopify authentication/session architecture.
4. Verify current Admin GraphQL API.
5. Verify current Customer Account UI Extension APIs.
6. Verify current Theme App Extension APIs.
7. Verify current webhook architecture.
8. Verify current Shopify App Store requirements.
9. Do not use deprecated APIs.

Preferred technology:

- TypeScript
- Node.js
- Shopify CLI
- Shopify App framework
- Shopify Admin GraphQL API
- Shopify Webhooks
- Shopify Theme App Extensions
- Shopify Customer Account UI Extensions
- Shopify App Bridge where appropriate
- Relational database

Do not introduce unnecessary infrastructure.

DO NOT use:

- Kubernetes
- microservices
- Kafka
- Redis
- RabbitMQ
- complex event buses
- Elasticsearch

unless a real demonstrated requirement exists.

==============================================================
5. COST IS A CORE REQUIREMENT
==============================================================

The application must be designed for EXTREMELY LOW operating cost.

This is one of the most important requirements.

The application will initially have:

- very few merchants
- very few products
- very few customers
- very few authentication events
- low traffic

The infrastructure must scale gradually.

Do NOT design infrastructure for millions of merchants on day one.

The architecture should allow the application to start with
approximately the lowest practical monthly infrastructure cost.

Target:

Development:
as close to $0 as reasonably possible.

Early production:
ideally approximately $0–$10/month excluding Shopify fees,
transaction fees, domain costs, email/SMS costs, and external
services.

The exact cost must be calculated during architecture planning.

Prioritize:

- serverless
- managed databases
- low-cost hosting
- object storage only when required
- CDN caching
- database-efficient queries
- minimal background workers
- minimal external services
- no always-on servers unless necessary

Avoid fixed monthly infrastructure costs wherever possible.

IMPORTANT BUSINESS MODEL REQUIREMENT:

The architecture should support a SaaS pricing model where
MERCHANTS PAY FOR THE APPLICATION.

The system should be designed so infrastructure usage scales
with merchant usage.

The goal is:

Merchant subscription revenue
        ↓
covers merchant's infrastructure consumption
        ↓
platform remains economically sustainable

Do not create an architecture where adding hundreds of merchants
creates large fixed infrastructure costs without corresponding
revenue.

The application should support future subscription plans such as:

FREE
STARTER
PRO
ENTERPRISE

but subscription billing does NOT need to be fully implemented
in V1 unless required for the Shopify App Store launch.

==============================================================
6. MULTI-TENANCY
==============================================================

The database must be multi-tenant.

Every tenant-owned record must have a tenant/shop relationship.

Example:

shops
products
physical_pieces
passports
ownerships
services
memberships
credits
benefits
authentication_events

All tenant-owned data must be scoped to the Shopify shop.

Implement defense in depth:

Application-level authorization
+
Database constraints
+
Tenant-aware queries
+
Server-side session validation

Never rely on frontend tenant IDs.

==============================================================
7. APPLICATION MODULES
==============================================================

Build ONE Shopify App containing modular systems:

1. Digital Product Passport
2. Physical Product Identity
3. Product Authentication
4. QR Passport
5. NFC Passport
6. Ownership Registry
7. Ownership Transfer
8. Gift Registration
9. Product Lifecycle
10. Lost / Stolen Products
11. Customer Private Club
12. Membership Tiers
13. Credits / Points Ledger
14. Benefits
15. Early Access
16. Collector's Cabinet
17. Product Care
18. Service & Restoration
19. Warranty
20. Notifications
21. Customer Preferences
22. Authentication Events
23. Risk / Fraud Signals
24. Audit Logs
25. Analytics
26. Embedded Admin Dashboard
27. Theme App Extension
28. Customer Account UI Extension

Every major module must be independently configurable.

==============================================================
8. FEATURE FLAGS
==============================================================

Support feature flags such as:

digital_passport_enabled
authentication_enabled
nfc_enabled
qr_enabled
ownership_enabled
transfer_enabled
gift_registration_enabled
membership_enabled
credits_enabled
benefits_enabled
early_access_enabled
care_enabled
service_enabled
warranty_enabled
lost_stolen_enabled
notifications_enabled
analytics_enabled

A merchant should be able to disable features they do not need.

==============================================================
9. THEME-AGNOSTIC REQUIREMENT
==============================================================

THIS IS CRITICAL.

The app must work across Shopify themes.

Do NOT depend on:

- Wokiee
- Dawn
- Prestige
- Impulse
- Horizon
- any specific third-party theme

Do NOT use:

- theme-specific CSS
- theme-specific Liquid
- theme-specific DOM selectors
- theme-specific JavaScript
- theme-specific section IDs
- DOM scraping
- arbitrary theme modification

Do NOT require the merchant to manually edit theme code.

Use official Shopify Theme App Extension architecture.

Use:

- App Blocks
- App Embed Blocks only when technically necessary
- Shopify Theme Editor settings
- Shopify dynamic sources
- Shopify product context

The application must be installable on different Shopify
stores using different themes.

==============================================================
10. THEME APP EXTENSION
==============================================================

Create a Shopify Theme App Extension.

The primary storefront component is:

DIGITAL PRODUCT IDENTITY

Example concept:

--------------------------------

DIGITAL PRODUCT IDENTITY

Every piece carries a unique digital identity.

✓ Digital Passport
✓ Product Registration
✓ Authentication

[ Discover Passport ]

--------------------------------

The merchant must add the block using Shopify Theme Editor.

Merchant configuration should include:

- title
- description
- CTA text
- alignment
- spacing
- border
- icon
- authentication display
- visibility

The block must inherit the host theme's visual language where
possible.

Do NOT impose a foreign design system.

Do NOT inject large JavaScript bundles.

==============================================================
11. APP EMBED
==============================================================

Do NOT use an App Embed for the primary product identity UI.

Use an App Block.

An App Embed may only be used for genuinely global
functionality if technically necessary.

Do not load global scripts unnecessarily.

==============================================================
12. PERFORMANCE
==============================================================

Storefront performance is extremely important.

The application must NOT significantly slow down the merchant's
storefront.

Rules:

- minimal JavaScript
- lightweight app block
- no blocking scripts
- no unnecessary global scripts
- lazy loading
- CDN caching
- optimized assets
- minimal API requests
- no large frontend framework inside the product block
- graceful failure

If the application backend is temporarily unavailable,
the merchant's product page must remain usable.

Target excellent Lighthouse performance.

==============================================================
13. DIGITAL PRODUCT PASSPORT
==============================================================

Every physical product may have a unique digital identity.

Example:

Product:
Premium Model

Serial:
PRD-2026-000184

Collection:
Collection Name

Edition:
18 / 100

Manufacturing Date:
October 2026

Manufacturing Location:
Country

Materials:
Leather
Metal

Passport supports:

- unique product identity
- serial number
- Shopify product ID
- Shopify variant ID
- physical piece ID
- model
- collection
- edition
- manufacturing date
- manufacturing location
- materials
- color
- dimensions
- craft information
- product images
- NFC identifier
- QR identifier
- warranty
- authentication status
- ownership
- service history
- restoration history
- purchase information
- passport creation date
- lifecycle status

==============================================================
14. PHYSICAL PIECE VS SHOPIFY PRODUCT
==============================================================

This distinction is fundamental.

A Shopify Product is a product MODEL.

A physical piece is an individual physical object.

Example:

Shopify Product:

Premium Model

Physical pieces:

PRD-2026-000001
PRD-2026-000002
PRD-2026-000003

Each physical piece has:

- unique serial
- passport
- ownership history
- authentication history
- service history
- lifecycle

Do NOT treat a Shopify product as a physical item.

==============================================================
15. PRODUCT LIFECYCLE
==============================================================

Each physical piece has a lifecycle.

Example:

MANUFACTURED
↓
AUTHENTICATED
↓
SOLD
↓
REGISTERED
↓
OWNED
↓
SERVICED
↓
RESTORED
↓
TRANSFERRED
↓
NEW OWNER
↓
RETIRED

Lifecycle belongs to the physical piece.

It does NOT belong to the Shopify order.

==============================================================
16. SHOPIFY ORDER RELATIONSHIP
==============================================================

Architecture:

Shopify Order
↓
Line Item
↓
Shopify Product / Variant
↓
Physical Piece
↓
Passport
↓
Owner

A Shopify order is NOT the physical product.

One Shopify product may represent thousands of physical pieces.

==============================================================
17. PRODUCT REGISTRATION
==============================================================

Registration flow:

Customer purchases product
↓
Receives physical product
↓
Scans NFC or QR
↓
Passport identified
↓
Customer authenticates with Shopify account
↓
System validates eligibility
↓
Customer confirms registration
↓
Physical piece becomes REGISTERED

States:

UNREGISTERED
PENDING
REGISTERED
TRANSFERRED
REVOKED
LOST
STOLEN
UNDER_REVIEW

==============================================================
18. NFC
==============================================================

Support NFC-based product identification.

Basic flow:

NFC
↓
Passport URL
↓
Product identification
↓
Authentication
↓
Passport

The architecture must support future secure NFC technology such as:

NXP NTAG 424 DNA / SUN

Support architecture for:

- NFC UID
- dynamic authentication payload
- read counter
- cryptographic verification
- authentication events
- suspicious reads
- timestamps
- approximate location where legally appropriate
- device/browser information where legally appropriate

NEVER expose cryptographic keys to frontend code.

Do NOT implement fake cryptography.

Do NOT claim NFC alone proves authenticity.

==============================================================
19. QR
==============================================================

Every Passport must support QR fallback.

NFC:

NFC
↓
Passport

QR:

QR
↓
Same Passport

Both must resolve to the same physical-piece identity.

==============================================================
20. AUTHENTICATION
==============================================================

Authentication must be layered.

V1:

Serial
+
Database identity

Future:

Secure NFC cryptographic authentication

Architecture:

Layer 1:
Serial

Layer 2:
Database identity

Layer 3:
NFC identity

Layer 4:
Cryptographic NFC authentication

Layer 5:
Behavioral anomaly detection

Layer 6:
Manual merchant verification

Customer-facing states:

AUTHENTICATED
UNREGISTERED
PENDING_VERIFICATION
SUSPICIOUS
REVOKED

Customer-facing language must be configurable.

Examples:

"Authenticity confirmed."

"This piece has not yet been registered."

"We were unable to verify this piece."

"This digital identity is no longer active."

Never expose internal fraud logic.

==============================================================
21. AUTHENTICATION EVENTS
==============================================================

Record authentication events.

Example:

Physical Piece:
PRD-2026-000184

08:42 — Cairo
08:48 — Cairo
09:02 — London
09:04 — New York

The system may generate an internal anomaly signal.

Risk states:

NORMAL
LOW_RISK
REVIEW
HIGH_RISK

Risk information is INTERNAL ONLY.

Never expose risk scores to customers.

==============================================================
22. LOST / STOLEN PRODUCTS
==============================================================

Support:

ACTIVE
LOST
STOLEN
REVOKED
UNDER_REVIEW

Customers can report:

Lost
Stolen

Admin can investigate.

If a lost/stolen item is scanned:

Display a safe verification message.

Do NOT expose:

- owner identity
- owner contact information
- previous owner
- private data

Ownership transfer should be blocked for:

- stolen
- under review
- revoked

unless authorized admin override is performed.

==============================================================
23. OWNERSHIP
==============================================================

Ownership belongs to the physical piece.

Support:

- current owner
- ownership history
- original purchaser
- purchase date
- transfer date
- ownership verification
- gift recipient

Never expose previous owner's personal information.

A new owner may see:

"Previously owned"

but not the previous owner's identity.

==============================================================
24. OWNERSHIP TRANSFER
==============================================================

Ownership Transfer is a core feature.

Flow:

CURRENT OWNER
↓
Initiate Transfer
↓
Re-authentication
↓
Recipient information
↓
Secure single-use transfer token
↓
Recipient invitation
↓
Recipient authentication
↓
Recipient reviews product
↓
Recipient accepts
↓
Ownership changes
↓
Transfer certificate

States:

DRAFT
PENDING
ACCEPTED
COMPLETED
EXPIRED
CANCELLED
REJECTED
REVOKED

Only one active owner can exist.

Only the current owner may initiate normal transfer.

Support:

- cancellation
- expiration
- rejection
- acceptance
- admin-assisted transfer
- fraud review

==============================================================
25. TRANSFER CERTIFICATE
==============================================================

After a successful transfer, generate a digital:

OWNERSHIP TRANSFER CERTIFICATE

Include:

- product
- serial
- edition
- transfer date
- new ownership status
- verification reference

Never expose previous owner information.

==============================================================
26. GIFTING
==============================================================

Support:

PURCHASE AS A GIFT

Buyer can designate a physical piece as a gift.

Recipient can register it as their own.

Do not expose buyer's private information unnecessarily.

The original purchase remains associated internally.

==============================================================
27. CUSTOMER PRIVATE CLUB
==============================================================

The application should support a configurable private customer
relationship experience.

Default concept:

PRIVATE CLUB

But merchants must be able to customize the name.

It should NOT feel like a conventional loyalty program.

Possible membership levels:

MAISON
ATELIER
PRIVÉ

These are DEFAULT examples only.

Merchants can rename them.

Membership eligibility can depend on:

- purchases
- ownership duration
- number of pieces
- engagement
- service history
- invitations
- manual assignment
- credits

Do not use childish gamification.

==============================================================
28. CREDITS / POINTS
==============================================================

The merchant can choose terminology.

Examples:

Maison Credits
Collector Credits
Rewards
Points

The default should support premium terminology.

Use an immutable ledger.

Example:

+500 purchase
+100 registration
+300 referral
+100 service
-200 redemption

NEVER store only:

customer.points = 500

Instead:

credits_ledger

with immutable transactions.

Calculate balance from the ledger.

Ledger must support:

- source
- reason
- amount
- expiration
- reference
- created_at
- created_by
- reversal

==============================================================
29. BENEFITS
==============================================================

Benefits can include:

- early access
- private editions
- complimentary care
- private events
- priority service
- collector releases
- invitations
- consultations
- discounts

Discounts must NOT be the only value proposition.

Each benefit supports:

- title
- description
- eligibility
- tier
- expiration
- activation
- redemption
- admin notes
- status

==============================================================
30. EARLY ACCESS
==============================================================

Products may have:

PUBLIC
PRIVATE
MEMBERS_ONLY
EARLY_ACCESS

Eligibility can depend on:

- membership tier
- customer
- invitation
- ownership
- credits
- campaign

Integrate with Shopify's product/catalog systems.

Do NOT rebuild Shopify's catalog.

==============================================================
31. COLLECTOR'S CABINET
==============================================================

Customers can view their owned physical pieces.

Example:

MY COLLECTION

Product Name
Collection Name

Authenticated
Owned since 2026

View Passport →

For multiple pieces:

- total pieces
- collections
- editions
- acquisition timeline
- service history
- ownership history

The UI should feel like:

private archive
collector cabinet
digital vault

Not:

shopping cart
gamified dashboard

==============================================================
32. CARE & AFTERCARE
==============================================================

Every registered physical piece can have:

CARE & RESTORATION

Possible services:

- inspection
- cleaning
- polishing
- restoration
- color refresh
- hardware service
- repair
- authentication inspection

Care information:

Recommended care
Recommended interval
Next recommended service

Example:

2026
Purchased

2027
Annual Care

2029
Restoration

2032
Hardware Service

==============================================================
33. SERVICE MANAGEMENT
==============================================================

Admin can create service cases.

Fields:

case ID
customer
physical piece
serial
service type
received date
completed date
status
technician
internal notes
customer-facing notes
photos
cost
warranty covered

Internal notes MUST NEVER be visible to customers.

Future architecture may support:

REQUEST SERVICE

Customer:
Select piece
↓
Select service
↓
Select location
↓
Request
↓
Merchant confirms

Full appointment booking is NOT required for V1.

==============================================================
34. WARRANTY
==============================================================

Support configurable:

- warranty status
- start date
- end date
- coverage
- service eligibility

All terms must be configurable by the merchant.

Do not automatically create legal claims.

==============================================================
35. CUSTOMER ACCOUNT UI EXTENSION
==============================================================

Build a Shopify Customer Account UI Extension using the
CURRENT officially supported Shopify architecture.

Do NOT build a separate customer web application.

Do NOT modify Shopify Customer Account DOM.

Do NOT inject arbitrary CSS.

Use Shopify-supported extension APIs and components.

The Private Club experience should contain:

PRIVATE CLUB

Welcome back.

Membership:
ATELIER

Credits:
420

My Pieces:
2

Benefits:
4

Sections:

MY PIECES
PASSPORTS
CARE & SERVICE
BENEFITS
PRIVATE ACCESS
ACCOUNT

The exact terminology must be configurable.

==============================================================
36. CUSTOMER PRIVACY
==============================================================

Customer can access only their own information.

Never expose:

- staff notes
- internal fraud signals
- previous owner's identity
- admin comments
- cryptographic secrets
- other tenant data

==============================================================
37. PUBLIC PASSPORT
==============================================================

Create a public Passport experience.

Preferred route:

/passport/[serial]

The merchant should be able to configure their domain/routing
where Shopify architecture allows.

NFC and QR must resolve to the same Passport identity.

Passport should feel like:

digital certificate
+
product archive
+
product story

NOT:

verification form.

Example:

DIGITAL PASSPORT

[PRODUCT IMAGE]

PRODUCT NAME

SERIAL

AUTHENTICATED

Manufactured:
2026

Materials:
...

EDITION:
18 / 100

Sections:

THE PIECE
CRAFT
MATERIALS
CARE
SERVICE HISTORY
OWNERSHIP

==============================================================
38. PUBLIC VS PRIVATE PASSPORT DATA
==============================================================

Public information may include:

- product identity
- model
- collection
- edition
- manufacturing information
- materials
- authentication status
- selected lifecycle data

Private owner-only information may include:

- ownership details
- private service information
- warranty details
- private benefits
- personal information

Merchant must control which fields are public.

==============================================================
39. CLIENT PROFILE
==============================================================

Admin may view:

- name
- preferred language
- country
- joined date
- membership
- credits
- pieces owned
- services
- benefits

Staff notes are private.

==============================================================
40. NOTIFICATIONS
==============================================================

Support:

- passport registered
- ownership transferred
- service completed
- care reminder
- warranty reminder
- private access
- early access
- benefit unlocked
- security notification

Email initially.

Architecture should allow future:

- SMS
- push notifications

Do not require expensive notification infrastructure in V1.

==============================================================
41. COMMUNICATION PREFERENCES
==============================================================

Customers can control:

- email
- service reminders
- care reminders
- private access
- early access
- invitations
- marketing

Respect applicable privacy and consent requirements.

==============================================================
42. ADMIN DASHBOARD
==============================================================

Build an Embedded Shopify Admin App.

Navigation:

Dashboard
Products
Physical Pieces
Digital Passports
Owners
Authentication
Transfers
Services
Warranty
Membership
Credits
Benefits
Early Access
Customers
Analytics
Settings
Audit Logs

Dashboard metrics:

- registered pieces
- authenticated pieces
- unregistered pieces
- suspicious events
- active members
- membership distribution
- credits issued
- credits redeemed
- services completed
- ownership transfers
- lost/stolen pieces

==============================================================
43. PRODUCT PASSPORT MANAGEMENT
==============================================================

Admin can create a Passport for an existing Shopify product.

Fields:

Shopify Product
Shopify Variant
Serial
Edition
Manufacturing Date
Manufacturing Location
Materials
Color
Dimensions
Craft Information
NFC Identifier
QR Identifier
Warranty
Passport Status
Public Visibility
Authentication Status

Support:

CSV import
CSV export

Do not hardcode Shopify IDs.

==============================================================
44. SHOPIFY DATA OWNERSHIP
==============================================================

Shopify is the source of truth for:

- products
- variants
- customers
- orders
- inventory

Application database owns only domain-specific data:

- physical pieces
- passports
- ownership
- authentication
- services
- warranties
- memberships
- credits
- benefits
- early access
- audit logs
- lifecycle events

Do NOT duplicate Shopify's entire database.

Use Shopify IDs as references.

==============================================================
45. WEBHOOKS
==============================================================

Use Shopify webhooks where appropriate.

Potential events:

- app uninstall
- order creation
- order updates
- customer updates
- product updates
- variant updates

Use current Shopify mechanisms.

Webhook handlers must:

- verify authenticity
- be idempotent
- handle retries
- handle duplicate events
- log failures safely

Do not assume exactly-once delivery.

==============================================================
46. API
==============================================================

Create secure APIs for application-specific functionality.

Examples:

GET /api/passport/:serial

GET /api/passport/:serial/public

GET /api/passport/:serial/private

POST /api/passport/:serial/register

POST /api/passport/:serial/authenticate

POST /api/ownership/transfers

GET /api/ownership/transfers/:token

POST /api/ownership/transfers/:token/accept

POST /api/ownership/transfers/:token/cancel

POST /api/services

GET /api/services/:passportId

GET /api/customer/me/pieces

GET /api/customer/me/membership

GET /api/customer/me/credits

GET /api/customer/me/benefits

All authorization must be server-side.

Never trust frontend authorization.

==============================================================
47. INTERNATIONALIZATION
==============================================================

The application must support global merchants.

Architecture should support:

- English
- Arabic
- German
- French
- Russian

Do not hardcode country-specific business logic.

Support:

- merchant locale
- customer locale
- country
- multiple currencies where applicable
- international ownership transfers
- international service locations

==============================================================
48. SECURITY
==============================================================

Implement:

- Shopify OAuth
- secure Shopify sessions
- webhook verification
- server-side authorization
- tenant isolation
- role-based permissions
- rate limiting
- input validation
- CSRF protection where applicable
- secure secrets
- encryption for sensitive data
- audit logging
- privacy-conscious storage

Never expose:

- NFC cryptographic keys
- private authentication secrets
- staff notes
- previous owner personal data
- internal fraud logic

==============================================================
49. AUDIT LOG
==============================================================

Audit sensitive administrative actions.

Examples:

Passport created
Passport modified
Passport revoked
Ownership changed
Transfer initiated
Transfer completed
Service created
Warranty changed
Membership changed
Credits granted
Credits reversed
Product marked stolen
Product restored
Authentication manually overridden

Audit logs must be append-only.

==============================================================
50. ANALYTICS
==============================================================

Admin analytics:

- passport registrations
- authentication events
- suspicious events
- ownership transfers
- service cases
- memberships
- credits
- benefits
- product lifecycle

Do not collect unnecessary personal information.

==============================================================
51. DATABASE
==============================================================

Use a relational database.

Minimum entities:

shops
shop_settings
staff_users
customers
shopify_products
physical_pieces
passports
passport_public_fields
ownerships
ownership_transfers
authentication_events
authentication_risk_events
lifecycle_events
services
service_items
warranties
membership_tiers
customer_memberships
credits_ledger
benefits
benefit_redemptions
early_access
gift_registrations
lost_stolen_reports
notifications
communication_preferences
audit_logs

All tenant-owned entities must contain a secure tenant
relationship.

Use database constraints wherever practical.

Historical records must not be destructively overwritten.

==============================================================
52. OWNERSHIP DATA MODEL
==============================================================

Ownership history must be immutable.

Do NOT simply overwrite:

current_owner_id

and lose historical information.

Instead maintain ownership records/events.

The system should be able to answer:

Who owns this piece now?

Who previously owned it?

When did ownership change?

How was it transferred?

Was the transfer completed?

But customers must only see information they are authorized
to see.

==============================================================
53. CREDIT LEDGER
==============================================================

Credits must be immutable.

Do not mutate historical transactions.

Support:

credit
debit
expiration
reversal
adjustment

Every transaction must contain:

id
shop_id
customer_id
amount
type
reason
reference_type
reference_id
created_at
created_by

Balance is calculated from valid ledger entries.

==============================================================
54. COST-EFFICIENT INFRASTRUCTURE
==============================================================

Design the infrastructure for low traffic first.

Preferred architecture:

Shopify
+
Serverless application
+
Managed relational database
+
Object storage only when needed
+
CDN

Avoid:

always-on compute
multiple servers
microservices
Kubernetes
Redis
Kafka
RabbitMQ

The system should scale vertically/horizontally only when
real usage requires it.

Use:

- connection pooling
- indexed queries
- pagination
- caching
- CDN
- lazy loading
- efficient GraphQL queries
- webhook processing only where necessary

Do not pay for infrastructure that is not being used.

==============================================================
55. RESOURCE ISOLATION
==============================================================

A merchant with:

10 products

should not consume resources equivalent to a merchant with:

1,000,000 products.

Use:

- pagination
- quotas
- rate limits
- usage limits
- efficient queries
- asynchronous processing only when needed

Prepare the architecture for future usage-based plans.

==============================================================
56. SAAS BILLING
==============================================================

Architecture must support future Shopify billing.

Possible plans:

FREE
STARTER
PRO
ENTERPRISE

Features can depend on plan.

Examples:

FREE:
limited passports

STARTER:
more passports

PRO:
advanced authentication
ownership transfer
service management
analytics

ENTERPRISE:
advanced integrations
higher limits
priority support

Do NOT implement fake billing.

Use Shopify's official billing mechanisms when billing is
implemented.

The application must remain usable in development stores
without real billing.

==============================================================
57. APP STORE READINESS
==============================================================

Design the application with Shopify App Store requirements
in mind.

Include:

- proper OAuth
- privacy policy integration
- data handling documentation
- uninstall handling
- webhook cleanup
- GDPR-related requirements
- secure authentication
- merchant-facing settings
- onboarding
- error handling
- billing architecture
- app scopes minimized to required permissions

Request the MINIMUM Shopify scopes necessary.

Do not request broad permissions without justification.

==============================================================
58. ONBOARDING
==============================================================

When a merchant installs the application:

Step 1:
Welcome

Step 2:
Configure branding

Step 3:
Choose terminology

Step 4:
Enable modules

Step 5:
Connect product catalog

Step 6:
Create first Passport

Step 7:
Configure Theme App Block

Step 8:
Configure Customer Account Extension

Step 9:
Test Passport

Step 10:
Go live

Onboarding must be simple.

A merchant should be able to create their first Passport
without technical knowledge.

==============================================================
59. BRAND CUSTOMIZATION
==============================================================

Because this is a general-purpose SaaS application,
the merchant must be able to configure:

- brand name
- logo
- primary color
- secondary color
- typography where supported
- Passport terminology
- membership terminology
- credits terminology
- CTA labels
- Passport sections
- public/private fields
- customer messaging
- authentication messaging

Never hardcode the application developer's own branding.

==============================================================
60. PREMIUM UX
==============================================================

The application should have a premium default visual language.

Default design principles:

- editorial
- minimal
- sophisticated
- restrained
- clean
- generous whitespace
- excellent typography
- subtle motion
- accessible
- mobile-first

Avoid:

- childish gamification
- excessive badges
- rainbow colors
- coupon-heavy UI
- excessive gradients
- excessive shadows
- huge dashboards full of cards
- unnecessary animations

However, the system must allow merchants to customize
their visual identity.

==============================================================
61. ACCESSIBILITY
==============================================================

Implement:

- semantic HTML where applicable
- keyboard navigation
- visible focus
- screen-reader support
- accessible labels
- sufficient contrast
- reduced motion
- accessible error messages

Never communicate important information by color alone.

==============================================================
62. ERROR HANDLING
==============================================================

Never expose:

- stack traces
- database errors
- internal IDs
- SQL errors
- authentication secrets
- fraud rules

Use elegant customer-facing messages.

Examples:

Passport unavailable:

"We're unable to retrieve this product's digital identity
right now."

Authentication issue:

"We were unable to verify this product."

Transfer expired:

"This ownership invitation has expired."

Stolen product:

"This product requires verification."

Backend unavailable:

"Some services are temporarily unavailable."

==============================================================
63. MVP
==============================================================

V1 MUST remain focused.

Implement:

1. Shopify App
2. Multi-tenant architecture
3. Embedded Admin
4. Digital Passport
5. Physical Product / Serial Management
6. Product Registration
7. Ownership
8. Basic Ownership Transfer
9. NFC / QR routing
10. Basic Authentication
11. Customer Private Club
12. Membership Tier
13. Immutable Credits Ledger
14. Basic Benefits
15. Care Reminders
16. Admin Passport Management
17. Theme App Block
18. Customer Account UI Extension
19. CSV Import/Export
20. Lost/Stolen status
21. Audit Log
22. Basic Analytics
23. Merchant onboarding
24. Feature flags
25. Basic merchant branding

DO NOT implement in V1:

- blockchain
- NFT
- marketplace
- advanced resale
- advanced NFC cryptography
- appointment booking
- concierge
- microservices
- Kubernetes
- unnecessary AI
- unnecessary infrastructure

Architect for these features without building them.

==============================================================
64. FUTURE FEATURES
==============================================================

The architecture should allow:

- resale marketplace
- ownership marketplace
- advanced NFC cryptography
- NXP NTAG 424 DNA / SUN
- advanced fraud detection
- international service centers
- concierge
- private appointments
- limited editions
- private drops
- advanced lifecycle tracking
- sustainability data
- manufacturing stories
- digital certificates
- API integrations
- POS integrations
- ERP integrations
- CRM integrations
- AI-assisted authentication analysis

Do NOT implement these until there is a real business requirement.

==============================================================
65. TESTING
==============================================================

Test:

Multi-tenant isolation
Shop installation
OAuth
Uninstallation
Webhooks
Webhook retries
Duplicate webhooks
Product synchronization
Passport creation
Passport lookup
QR
NFC routing
Registration
Ownership
Ownership transfer
Expired transfers
Cancelled transfers
Rejected transfers
Gift registration
Lost products
Stolen products
Revoked products
Authentication failures
Customer privacy
Admin permissions
Theme App Block
Multiple Shopify themes
Customer Account Extension
Mobile
Desktop
API failures
Database failures
Rate limits
Audit logs

Theme tests MUST NOT depend on a specific theme's DOM.

==============================================================
66. DEVELOPMENT PROCESS
==============================================================

DO NOT immediately generate thousands of lines of code.

First analyze the requirements.

Then provide:

1. System architecture
2. Multi-tenant architecture
3. Shopify integration architecture
4. Extension architecture
5. Database schema
6. API architecture
7. Authentication architecture
8. Ownership model
9. Passport architecture
10. NFC architecture
11. Customer Account architecture
12. Theme compatibility strategy
13. Security model
14. Cost model
15. Required Shopify scopes
16. Environment variables
17. Deployment strategy
18. Testing strategy

Then implement incrementally.

For every phase:

- explain what is being built
- create real files
- explain files
- explain configuration
- explain Shopify setup
- explain local development
- explain testing
- explain deployment

Do not create fake production implementations.

Do not hardcode IDs.

Do not use fake Shopify APIs.

Do not use mock data in production.

Mocks are allowed only for:

- automated tests
- seed scripts
- development demos

==============================================================
67. REQUIRED FINAL ARCHITECTURE PRINCIPLES
==============================================================

The final system must satisfy:

SHOPIFY-FIRST
+
MULTI-TENANT
+
THEME-AGNOSTIC
+
LOW COST
+
SECURE
+
SCALABLE
+
MODULAR
+
APP STORE READY
+
PERFORMANCE FIRST

The application must be useful to a merchant with only a few
physical products.

It must also have a credible path to thousands of merchants.

The architecture must avoid premature complexity.

==============================================================
68. MOST IMPORTANT BUSINESS PRINCIPLE
==============================================================

Do NOT build another generic loyalty app.

Build a:

DIGITAL PRODUCT IDENTITY
+
PRODUCT LIFECYCLE
+
AUTHENTICATION
+
OWNERSHIP
+
CUSTOMER RELATIONSHIP

platform for Shopify merchants.

The physical product should continue to have a digital
relationship with its owner after purchase.

The product should have:

Identity
↓
Authentication
↓
Ownership
↓
Care
↓
Service
↓
Lifecycle
↓
Transfer
↓
New Owner

The customer should have:

Account
↓
Collection
↓
Membership
↓
Benefits
↓
Private Access
↓
Relationship with the Merchant

The merchant should have:

Products
↓
Physical Pieces
↓
Passports
↓
Owners
↓
Authentication
↓
Lifecycle
↓
Service
↓
Customer Relationship

Build the platform around these principles.

==============================================================
69. FINAL INSTRUCTION TO THE AI AGENT
==============================================================

Before writing implementation code:

STOP.

Review the entire specification.

Identify:

- architectural conflicts
- Shopify API limitations
- extension limitations
- security risks
- cost risks
- scalability risks
- App Store compliance risks
- features that Shopify itself should handle
- features that belong in the application database
- features that should be postponed to V2

Do not blindly implement every sentence.

If Shopify provides a native capability, prefer the native
Shopify capability.

If a feature would violate Shopify's extension architecture,
do not hack around it.

If a feature creates unnecessary infrastructure cost,
propose a cheaper architecture.

If a requirement is technically impossible or deprecated,
explain the issue and propose the closest production-ready
alternative.

The objective is not to maximize the amount of code.

The objective is to build the smallest production-quality
architecture that can become a serious Shopify SaaS product.

Build intelligently.
Build securely.
Build cheaply.
Build for Shopify.
Build for multiple merchants.
Build for long-term scalability.