# 📦 E-Commerce Backend — NestJS + Zoho + MongoDB

> Scalable backend for a farmer/customer/salesperson e-commerce platform, powered by Zoho Inventory & CRM with NestJS and MongoDB.

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Zoho OAuth Setup](#5-zoho-oauth-setup)
6. [Zoho Inventory Integration](#6-zoho-inventory-integration)
7. [Product API](#7-product-api)
8. [Authentication System](#8-authentication-system)
9. [Zoho CRM Integration](#9-zoho-crm-integration)
10. [Commission & Referral System](#10-commission--referral-system)
11. [Database Design](#11-database-design)
12. [Performance Optimisations](#12-performance-optimisations)
13. [Environment Variables](#13-environment-variables)
14. [Infrastructure & Cost](#14-infrastructure--cost)
15. [Project Status](#15-project-status)
16. [Known Issues & Fixes](#16-known-issues--fixes)
17. [Deployment Guide](#17-deployment-guide)
18. [Future Roadmap](#18-future-roadmap)

---

## 1. Project Overview

A production-ready **NestJS** backend for an e-commerce platform focused on three user roles:

- 👨‍🌾 **Farmers** — product providers
- 🛍 **Customers** — buyers
- 🧑‍💼 **Salespersons** — earn commission via referral links

**Zoho** is the single source of truth for products and customer data. **MongoDB** acts as a high-performance read-optimised query layer.

| Metric | Target |
|---|---|
| Total Users | 30,000 – 50,000 |
| Daily Active Users | 800 – 1,000 |
| Orders/Day | 200 – 500 |
| Infrastructure Cost | ~$1/month |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS (Node.js) |
| Database | MongoDB + Mongoose |
| Authentication | OTP + JWT |
| Product Source of Truth | Zoho Inventory API |
| Customer Management | Zoho CRM API |
| Image Storage | Amazon S3 |
| Caching *(planned)* | Redis |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| Mobile App | React Native (Android) |

---

## 3. System Architecture

### High-Level Flow

```
React Native App / Next.js Web
          ↓
  Nginx (Reverse Proxy + SSL)
          ↓
    NestJS Backend (Monolith)
          ↓
  Redis (Caching & Queue) ──── MongoDB Atlas (Primary DB)
          ↓                              ↓
  Amazon S3 (Images)        Zoho (Inventory + CRM)
```

### Zoho Sync Architecture

```
Zoho Inventory → Cron Sync (every 30 min) → MongoDB → REST API → Client

Key Principle:
  Zoho     = Source of truth  (product data managed here only)
  MongoDB  = Fast query layer (read-optimised, filterable)
```

---

## 4. Project Structure

```
src/
│
├── main.ts
├── app.module.ts
│
├── config/                     # Global configuration
│   ├── configuration.ts
│   └── env.validation.ts
│
├── common/                     # Shared utilities (GLOBAL)
│   ├── decorators/
│   ├── redis/
│   ├── interceptors/
│   └── utils/
│
├── database/                   # DB setup
│   └── mongo/
│       ├── mongo.module.ts
│       └── mongo.providers.ts
│
├── modules/                    # 💥 DOMAIN-DRIVEN MODULES
│   ├── auth/
│   │    ├── controllers/
│   │    │    └── auth.controller.ts
│   │    ├── services/
│   │    │    ├── auth.service.ts
│   │    │    ├── otp.service.ts
│   │    │    └── jwt.service.ts
│   │    ├── strategies/
│   │    │    └── jwt.strategy.ts
│   │    ├── guards/
│   │    ├── dto/
│   │    ├── interfaces/
│   │    └── auth.module.ts
│   │
│   ├── users/
│   │    ├── controllers/
│   │    ├── services/
│   │    │    └── users.service.ts
│   │    ├── schemas/
│   │    ├── dto/
│   │    └── users.module.ts
│   │
│   ├── products/
│   │    ├── controllers/
│   │    │    └── products.controller.ts
│   │    ├── services/
│   │    │    ├── products.service.ts
│   │    │    └── product-query.service.ts   # filtering logic
│   │    ├── schemas/
│   │    ├── dto/
│   │    ├── interfaces/
│   │    └── products.module.ts
│   │
│   ├── orders/                 # IMPORTANT: separate domain
│   │    ├── controllers/
│   │    ├── services/
│   │    │    ├── orders.service.ts
│   │    │    ├── order-processing.service.ts
│   │    ├── schemas/
│   │    ├── dto/
│   │    └── orders.module.ts
│   │
│   ├── commissions/
│   │    ├── services/
│   │    ├── schemas/
│   │    └── commissions.module.ts
│   │
│   ├── referrals/
│   │    ├── services/
│   │    └── referrals.module.ts
│
├── integrations/              # 🔌 EXTERNAL SERVICES (VERY IMPORTANT)
│
│   ├── zoho/
│   │    ├── core/
│   │    │    ├── zoho-auth.service.ts
│   │    │    ├── zoho-http.service.ts
│   │    │
│   │    ├── crm/
│   │    │    └── zoho-crm.service.ts
│   │    │
│   │    ├── inventory/
│   │    │    └── zoho-inventory.service.ts
│   │    │
│   │    ├── schemas/
│   │    ├── dto/
│   │    └── zoho.module.ts
│   │
│   ├── aws/
│   │    ├── s3.service.ts
│   │    └── aws.module.ts
│   │
│   └── payments/
│        ├── zoho-payment-gateway.service.ts
│        └── payments.module.ts
│
├── jobs/                      # 🧠 BACKGROUND WORKERS (CRON / QUEUES)
│   ├── cron/
│   │    ├── product-sync.job.ts      # Zoho sync
│   │    └── commission.job.ts
│   │
│   ├── queues/                # (future BullMQ)
│   └── jobs.module.ts
│
├── cache/                     # Redis layer
│   ├── redis.module.ts
│   └── cache.service.ts
│
├── events/                    # Event-driven architecture (advanced)
│   ├── events.module.ts
│   └── handlers/
│
└── shared/                    # reusable domain logic (optional)
```

---

## 5. Zoho OAuth Setup

### OAuth Flow

```
1. Open the Authorization URL in browser
         ↓
2. User logs in → Zoho redirects to /callback?code=xxx&state=crm
         ↓
3. exchangeCodeForToken(code) → stores access_token + refresh_token in MongoDB
         ↓
4. All subsequent API calls use getValidAccessToken()
         ↓
5. Access token auto-refreshed when expired (~1 hour lifetime)
```

### Authorization URL

```
https://accounts.zoho.in/oauth/v2/auth
  ?scope=ZohoCRM.modules.ALL,ZohoInventory.fullaccess.all
  &client_id=YOUR_CLIENT_ID
  &response_type=code
  &access_type=offline
  &redirect_uri=http://localhost:3000/callback
```

### Callback Endpoint

```ts
@Get('callback')
async handleZohoCallback(@Query('code') code: string, @Query('state') state: string) {
  const result = await this.zohoService.exchangeCodeForToken(code);
  return { message: 'Token stored successfully', result };
}
```

### Token Storage Schema

```json
{
  "service":       "crm | inventory",
  "access_token":  "...",
  "refresh_token": "...",
  "expires_at":    1234567890
}
```

### Core Token Methods

| Method | Purpose |
|---|---|
| `exchangeCodeForToken(code)` | First-time setup via OAuth callback |
| `refreshAccessToken(refreshToken)` | Silently refresh an expired access token |
| `getValidAccessToken()` | Returns a valid token, auto-refreshing if needed |
| `initializeToken()` | Bootstrap from `.env` on first run |

> ⚠️ **Token Rule:** `.env` `ZOHO_REFRESH_TOKEN` is for the initial setup only. After the first run, **MongoDB is the source of truth** for all tokens. The `/callback` endpoint is only needed once.

---

## 6. Zoho Inventory Integration

### Cron Job

```ts
@Cron('0 */30 * * * *')
async syncZohoProducts() {
  // 1. Fetch items from Zoho Inventory API
  // 2. Loop through all items
  // 3. Upsert into MongoDB (keyed on zoho_item_id)
}
```

### Upsert Strategy

```ts
await this.productModel.updateOne(
  { zoho_item_id: item.item_id },
  {
    zoho_item_id:  item.item_id,
    name:          item.name,
    description:   item.description,
    price:         item.rate,
    sku:           item.sku,
    stock:         item.stock_on_hand,
    is_active:     true,
  },
  { upsert: true },
);
```

### Product Schema

```ts
@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, unique: true }) zoho_item_id: string;
  @Prop({ required: true })              name: string;
  @Prop()                                description: string;
  @Prop({ required: true })              price: number;
  @Prop()                                sku: string;
  @Prop()                                category_id: string;
  @Prop()                                category_name: string;
  @Prop()                                stock: number;
  @Prop()                                track_inventory: boolean;
  @Prop()                                image_url: string;
  @Prop()                                zoho_image_document_id: string;
  @Prop({ default: true })               is_active: boolean;
  @Prop({ default: true })               show_in_storefront: boolean;
  @Prop()                                weight: number;
  @Prop()                                length: number;
  @Prop()                                width: number;
  @Prop()                                height: number;
}
```

### Indexes (Performance Critical)

```ts
ProductSchema.index({ category_id: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ is_active: 1, show_in_storefront: 1 });
ProductSchema.index({ price: 1 });
```

---

## 7. Product API

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products |
| GET | `/products?page=1&limit=20` | Paginated list (max 50/page) |
| GET | `/products?category=<id>` | Filter by category |
| GET | `/products?minPrice=100&maxPrice=500` | Filter by price range |
| GET | `/products?search=milk` | Regex search (name + description) |
| GET | `/products?sortBy=price&order=asc` | Sort results |
| GET | `/products/id/:id` | Get single product by MongoDB ID |

### Combined Query Example

```
GET /products?category=Tools&search=kit&minPrice=200&page=1&limit=20
```

### Sample Response

```json
{
  "data": [ ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

### Applied Filters (all queries)

- `is_active = true`
- `show_in_storefront = true`
- `category_id` / `category_name` *(optional)*
- `price` range *(optional)*
- Regex search on `name` + `description` *(optional)*

---

## 8. Authentication System

### OTP Login Flow

```
User enters mobile number
         ↓
POST /auth/send-otp  →  OTP generated, hashed (bcrypt), stored with expiry
         ↓
User submits OTP
         ↓
POST /auth/verify-otp  →  OTP validated, attempts tracked
         ↓
JWT issued  →  User authenticated
```

### User Schema

```json
{
  "_id":            "ObjectId",
  "mobile_number":  "+91XXXXXXXXXX",
  "role":           "customer | farmer | salesperson",
  "referralCode":   "string",
  "zoho_contact_id":"set after first order only",
  "otp": {
    "code":       "bcrypt hashed",
    "expires_at": "Date",
    "attempts":   0
  },
  "addresses": [],
  "createdAt":  "Date"
}
```

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to mobile number |
| POST | `/auth/verify-otp` | Verify OTP and receive JWT |
| GET | `/callback?code=xxx&state=crm` | Zoho OAuth callback *(one-time setup)* |

---

## 9. Zoho CRM Integration

> ❌ **Do NOT** create a CRM contact on login or registration.
> ✅ **Create a CRM contact only when the user places their FIRST order.**
>
> This keeps Zoho CRM clean — only real buyers should appear there.

### CRM Sync Flow

```
User places their first order
         ↓
Check: does user have zoho_contact_id?
         ↓
No  →  ZohoCRMService.upsertContact()  →  Zoho CRM API
                                          →  Save zoho_contact_id to User in DB
Yes →  Reuse existing contact (skip creation)
```

### Zoho CRM APIs Used

| Endpoint | Purpose |
|---|---|
| `POST /crm/v2/Contacts` | Create a new contact |
| `GET /crm/v2/Contacts/search` | Search by phone (deduplication) |

### CRM Service Methods

```ts
// Create a new contact
await zohoCRMService.createContact({
  First_Name: 'John',
  Last_Name:  'Doe',
  Email:      'john@example.com',
  Phone:      '9876543210',
});

// Search first, create if not found
await zohoCRMService.upsertContact(data);
```

---

## 10. Commission & Referral System

Salespersons earn commission when customers they referred complete an order. Calculation runs asynchronously to keep checkout fast.

### Commission Schema

```json
{
  "_id":           "ObjectId",
  "orderId":       "ObjectId",
  "salespersonId": "ObjectId",
  "amount":        100.00,
  "status":        "pending | paid"
}
```

### Flow

```
Customer (referred by salesperson) places order
         ↓
Order status → delivered
         ↓
Background Job: calculate commission
         ↓
Commission record created (status: pending)
         ↓
Admin marks commission as paid
```

---

## 11. Database Design

### Collections

| Collection | Purpose |
|---|---|
| `users` | Customers, farmers, salespersons — OTP, addresses, referral |
| `products` | Synced from Zoho; indexed for fast queries |
| `orders` | Order lifecycle, items, payment status |
| `commissions` | Per-order commission tracking for salespersons |
| `zoho_tokens` | OAuth access + refresh tokens per Zoho service |

### Orders Schema

```json
{
  "_id":           "ObjectId",
  "userId":        "ObjectId",
  "salespersonId": "ObjectId",
  "items":         [],
  "totalAmount":   1500.00,
  "status":        "pending | delivered",
  "createdAt":     "Date"
}
```

### Critical Indexes

```
users:        phone, role
products:     zoho_item_id (unique), category_id, price,
              is_active + show_in_storefront (compound),
              name + description (text)
orders:       userId, salespersonId, createdAt
commissions:  salespersonId, status
```

---

## 12. Performance Optimisations

| Optimisation | Detail |
|---|---|
| Indexed queries | All hot-path fields indexed in MongoDB |
| `.lean()` queries | Returns plain JS objects (faster than Mongoose docs) |
| `.select()` fields | Fetches only required fields |
| Pagination enforced | Page size capped at 50 per request |
| Async commission calc | Runs in background — does not block checkout |
| Redis caching *(planned)* | Cache product lists, sessions, OTPs |
| Image compression *(planned)* | Sharp for S3 — thumbnail / medium / large sizes |
| Cursor-based pagination *(planned)* | Upgrade from skip/limit |

---

## 13. Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_URI=mongodb+srv://...

# Zoho OAuth
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REDIRECT_URI=http://localhost:3000/callback
ZOHO_ORG_ID=                   # Zoho Inventory organization ID
ZOHO_REFRESH_TOKEN=             # Initial setup only — DB takes over after first run

# JWT
JWT_SECRET=

# AWS S3 (planned)
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

---

## 14. Infrastructure & Cost

| Component | Monthly Cost |
|---|---|
| EC2 t2.micro (free tier) | $0 |
| MongoDB Atlas M0 (free tier) | $0 |
| Amazon S3 (image storage) | ~$0.10 |
| Domain | ~$1 |
| **Total** | **~$1/month (~₹80)** |

### Scaling Roadmap

| Phase | Changes |
|---|---|
| Phase 1 *(current)* | Single EC2 + MongoDB free tier + monolith |
| Phase 2 | Upgrade to t3.small (2 GB RAM), paid MongoDB tier |
| Phase 3 | Load balancer + CloudFront CDN + BullMQ job queue |
| Phase 4 | Microservices split as traffic demands |

---

## 15. Project Status

| Feature | Status |
|---|---|
| Zoho OAuth (token exchange + auto-refresh) | ✅ Complete |
| Zoho CRM — Contact upsert | ✅ Complete |
| Zoho Inventory — Product fetch | ✅ Complete |
| Product cron sync (every 30 min) | ✅ Complete |
| MongoDB product schema + indexes | ✅ Complete |
| Product API (filter, search, paginate, sort) | ✅ Complete |
| OTP Authentication | ✅ Complete |
| JWT Auth | ✅ Complete |
| User schema (roles, referral, addresses) | ✅ Complete |
| Category system | 🔄 In Progress |
| Inventory sync improvements | 🔄 In Progress |
| Orders module | ⏳ Upcoming |
| Zoho CRM Deals (Order → Deal) | ⏳ Upcoming |
| Payment integration (Razorpay) | ⏳ Upcoming |
| AWS S3 image handling | ⏳ Upcoming |
| Redis caching | ⏳ Upcoming |
| BullMQ background jobs | ⏳ Upcoming |
| Invoices via Zoho Books | ⏳ Upcoming |

---

## 16. Known Issues & Fixes

| Issue | Fix Applied |
|---|---|
| `OAUTH_SCOPE_MISMATCH` | Added both CRM + Inventory scopes to auth URL |
| `invalid_code` error | Auth code is one-time use; fixed OAuth redirect handling |
| Token overwrite bug | `.env` token is initial only; DB is source of truth after first run |
| `ZOHO_ORGANIZATION_ID` env mismatch | Renamed to `ZOHO_ORG_ID` consistently |
| Invalid org ID (was `"60"`) | Correct numeric org ID used from Zoho dashboard |
| Duplicate index warning | Removed redundant `zoho_item_id` index (already `unique` in schema) |
| Route conflict on `GET :id` | Changed to `GET id/:id` to avoid catching other routes |
| String → Number filter bug | `minPrice`/`maxPrice` parsed with `Number()` before querying |
| Category filter mismatch | Filter now checks both `category_id` and `category_name` |

---

## 17. Deployment Guide

### Local Development

```bash
npm install
npm run start:dev
```

Then open the Zoho OAuth URL once in a browser to store the initial token:

```
https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoInventory.fullaccess.all&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:3000/callback
```

### Production (AWS EC2 — Ubuntu)

```bash
# 1. Launch EC2 (Ubuntu 22.04), open ports 80 and 443

# 2. Install dependencies
sudo apt update
sudo apt install -y nodejs npm nginx redis-server
npm install -g pm2

# 3. Clone and install
git clone <your-repo>
cd <project>
npm install
npm run build

# 4. Set environment variables
cp .env.example .env
# Fill in all values in .env

# 5. Start with PM2
pm2 start dist/main.js --name ecommerce-backend
pm2 save && pm2 startup

# 6. Configure Nginx reverse proxy
# Proxy localhost:3000 → port 80/443

# 7. Enable HTTPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 18. Future Roadmap

```
Users → Orders → Zoho CRM Deals → Analytics → Marketing Automation
                       ↓
                Zoho Books (Invoices)
                       ↓
            Payment Gateway (Razorpay)
```

- Zoho Sales Orders created automatically on order placement
- CRM Deals pipeline for sales tracking
- Zoho Books for invoice generation
- SalesIQ for live chat support
- Webhook-based real-time sync from Zoho → backend
- Product variants, ratings & reviews
- Multi-organization support
- Admin analytics dashboard

---

## 👨‍💻 Author

**TCBT JAIVIK KISHAN PVT. LTD.**

---

## 📜 License

MIT License
