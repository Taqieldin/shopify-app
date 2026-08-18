# Gorgerine — Digital Product Passport & Authentication System

## المفهوم العام

براند فاخر لشنط خشب. كل شنطة لها هوية فريدة (Serial Number + NFC Tag). العميل يعمل Tap بالموبايل على الشنطة → تفتح صفحة على الموقع → تعرض بيانات القطعة وتقول هل الـ Tag والقطعة Authentic / Registered.

**مفيش QR ظاهر على الشنطة.** NFC فقط، بشكل مخفي داخل الخشب.

---

## المنتجPhysical Bag
       │
       ├── Serial Number (مطبوع على الشنطة)
       │   مثال: GR-2026-000184
       │
       └── Authentication Tag (NFC مخفي داخل الخشب)
                │
                └── Unique Tag ID
                    مثال: TAG_7A91X82

---

## الفصل المهم: السيريال مش هو الـ NFC identifier

| الحقل | القيمة | الوصف |
|-------|--------|-------|
| Serial Number | GR-2026-000184 | المطبوع على الشنطة |
| Internal Product ID | piece_8f72... | ID الداتابيز |
| NFC Tag ID | TAG_7A91... | UID الشريحة |
| Passport URL | yourdomain.com/p/GR-2026-000184 | الرابط العام |

---

## NFC Flow

```
NFC Tap
  ↓
Passport URL
  ↓
GR-2026-000184 (Serial)
  ↓
Database
  ↓
Find physical piece
  ↓
Authentication
  ↓
Display product record
```

**مهم:** ما تحطش كل بيانات الشنطة جوه الـ NFC tag. خليه يحمل فقط هوية / رابط آمن. لأنك لو غيرت تاريخ الضمان أو حالة الصيانة أو المالك، مش هتحتاج تعيد برمجة الـ NFC.

---

## شريحة NFC المستخدمة

**NTAG 424 DNA** — وليست NTAG 213 العادية.

| الحل | التكلفة | الأمان | مناسب؟ |
|------|---------|--------|--------|
| NTAG 213 | منخفض جدًا | ضعيف ضد cloning | ❌ |
| NTAG 213 + backend | منخفض | متوسط | ⚠️ |
| **NTAG 424 DNA** | **أعلى** | **عالي** | **✅** |
| NTAG 424 DNA TagTamper | أعلى | عالي جدًا + tamper | ⭐ لاحقًا |

**NTAG 424 DNA يستخدم AES-128 و SUN (Secure Unique NFC) authentication** — رسالة authentication فريدة عند كل قراءة.

### NFC Authentication Flow

```
PHONE
  │ Tap
  ▼
NFC TAG (NTAG 424 DNA)
  │ UID + Counter + Cryptographic Authentication
  ▼
YOUR SERVER
  ├── Is this a valid tag?
  ├── Is the authentication valid?
  ├── Is this tag registered?
  ├── Is the serial active?
  └── Is there suspicious activity?
  ▼
PASSPORT PAGE
```

---

## البيانات في قاعدة البيانات

### Physical Piece Record

| الحقل | النوع | مثال |
|-------|-------|------|
| Serial Number | String (unique) | GR-2026-000184 |
| Model | String | Model 01 |
| Color | String | Black |
| Material | String | Italian Leather |
| Size | String | Medium |
| Hardware | String | Brass |
| Weight | String | 850g |
| Manufacturing Year | Int | 2026 |
| Purchase Date | DateTime? | 2026-11-04 |
| Warranty Until | DateTime? | 2028-11-04 |
| Service Status | Enum | NOT_IN_SERVICE / IN_SERVICE |
| Has Service History | Boolean | YES / NO |
| Service Count | Int | 1 |
| Last Service Date | DateTime? | 2027-08-12 |
| Authentication Status | Enum | AUTHENTIC / UNVERIFIED / FLAGGED |
| NFC Tag ID | String? | ربط بشريحة NFC |

### Service Record

| الحقل | النوع |
|-------|-------|
| Piece ID | FK → Physical Piece |
| Service Date | DateTime |
| Service Type | String (Professional Care, Repair, etc.) |
| Notes | String? |

### NFC Tag

| الحقل | النوع |
|-------|-------|
| Tag UID | String (unique) — من الشريحة نفسها |
| Tag ID | String (unique) — YOUR label |
| Status | UNREGISTERED / ACTIVE / REVOKED |
| Piece ID | FK? → Physical Piece |

---

## ما يعرضه العميل عند Tap / Scan

```
GORGERINE

AUTHENTICITY VERIFIED ✓ AUTHENTIC

Model 01
Serial: GR-2026-000184
Color: Black
Material: Italian Leather
Size: Medium
Hardware: Brass
Weight: 850g

Manufactured: 2026
Purchased: 04 November 2026
Warranty: Valid until 04 November 2028

CARE & SERVICE
Current Status: Not currently in service
Service History: 1 service
```

**ما تعرضش بيانات حساسة زي بيانات المشتري أو أي معلومات داخلية.**

---

## Admin Panel — بسيط جدًا

### صفحة 1: Create Product

| الحقل | المثال |
|-------|--------|
| Serial Number | GR-2026-000184 |
| Model | Model 01 |
| Color | Black |
| Material | Italian Leather |
| Size | Medium |
| Hardware | Brass |
| Weight | 850 g |
| Manufacturing Year | 2026 |
| Purchase Date | 2026-11-04 |
| Warranty Until | 2028-11-04 |
| Service Status | NOT IN SERVICE |
| Has Service History | YES |
| Service Count | 1 |
| Last Service Date | 2027-08-12 |
| Authentication Status | AUTHENTIC |

### صفحة 2: Generate Tag

| الحقل | المثال |
|-------|--------|
| NFC Tag | NTAG 424 DNA |
| Tag ID | TAG_7A91X82 |
| Passport URL | yourdomain.com/p/GR-2026-000184 |
| [Program / Assign Tag] | |

### صفحة 3: Service Records

إضافة سجل صيانة لكل قطعة.

---

## NFC داخل الخشب

```
          BAG
    ┌──────────────────┐
    │                  │
    │      WOOD        │
    │                  │
    │    ┌────────┐    │
    │    │ NFC    │    │
    │    │ TAG    │    │
    │    └────────┘    │
    │                  │
    └──────────────────┘
```

**من الخارج: لا شيء.** العميل يعرف من الـ documentation / packaging إن:
> "Tap your phone gently to the emblem."

### اختبار NFC بعد التركيب

ما نشتريش 1000 قطعة من البداية. نعمل:
- Prototype: 5–10 Tags
- نجرب: Tag outside wood, behind 1mm, 2mm, 3mm, inside actual bag structure
- نختبر على: iPhone, Samsung, Pixel
- مسافة القراءة، اتجاه الموبايل، سرعة فتح الرابط

---

## AppModule Structure

```
Admin
  │
  ├── Products (Create / List / Edit physical pieces)
  │
  ├── NFC Tags (Register / Assign / Manage tags)
  │
  └── Service Records (Log service history)

Customer
  │
  └── Scan / Tap
          │
          ↓
      Product Passport
          │
          ├── Authenticity Status
          ├── Product Details
          ├── Purchase Info
          ├── Warranty
          └── Service History
```

---

## بعد ما المشروع يكبر

1. Secure NFC tags — الـ tag نفسه يشارك في عملية التحقق cryptographically
2. NTAG 424 DNA TagTamper — نعرف هل الـ tag اتفتح / اتلاعب به
3. Shopify Theme App Extension — يظهر على Product Page
4. App Proxy — الروابط تبقى على دومين المتجر

---

## Apple Vision

- تجربة Tap بسيطة وفاخرة
- لا QR ظاهر
- لا App مطلوب
- لا Bluetooth
- لا Blockchain
- لا Next.js storefront معقد
- فقط: NFC → URL → Server → Database → Passport
