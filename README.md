# Enterprise Multi-Tenant Quotation SaaS & CRM Platform (QuotePro Enterprise CPQ)

A production-grade, multi-tenant B2B SaaS platform for rapid quotation generation, product catalog management, barcode/SKU autofill, discount governance approval workflows, and high-resolution PDF generation with embedded imagery.

---

## 🎨 QuotePro Enterprise CPQ Visual Design System

The application has been unified around the **QuotePro Enterprise CPQ** design system, matching enterprise B2B standards:

* **Primary Forest Green Palette**: Core branding and interactive elements use deep forest green (`#05603a`, hover `#044e30`).
* **Luxury Dark KPI Cards**: 4 curated luxury dark card palettes for high-impact metric visualization:
  - Midnight Slate (`#1c2237`)
  - Dark Navy (`#152e4d`)
  - Tobacco Umber (`#3b2d11`)
  - Forest Green (`#054026`)
* **White Surface Elevation**: Pure white rounded-2xl containers (`bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]`) with subtle hairline dividers and refined padding.
* **Copilot & Advisory Mint Tint**: Soft mint containers (`bg-[#ebfaf3] border-[#bbf7d0] text-[#05603a]`) for AI copilots, margin optimizers, and isolation telemetry widgets.
* **Unified Component Library**: Standardized `Button`, `Badge`, `Card`, `Input`, and `Modal` primitives across all 4 role workspaces and all operational pages.

---

## 👑 4-Tier Hierarchical Architecture & RBAC

The platform is engineered around a 4-tier hierarchy that provides strict multi-tenant isolation, role-based access control, and sales governance:

```
┌────────────────────────────────────────────────────────┐
│             1. PLATFORM SUPER ADMIN (SaaS Owner)        │
│    Global Platform Telemetry, Onboard Tenants, Billing │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ 2. COMPANY OWNER (Tenant A)│     │ 2. COMPANY OWNER (Tenant B)│
│ Team, Branding, Margins │       │ Team, Branding, Margins │
└────────────┬────────────┘       └────────────┬────────────┘
             │                                 │
     ┌───────┴───────┐                 ┌───────┴───────┐
     ▼               ▼                 ▼               ▼
┌──────────┐   ┌───────────┐     ┌──────────┐   ┌───────────┐
│3. MANAGER│   │4. SALESMAN│     │3. MANAGER│   │4. SALESMAN│
│ Catalog  │   │  Quotes   │     │ Catalog  │   │  Quotes   │
│ Approvals│   │  Clients  │     │ Approvals│   │  Clients  │
└──────────┘   └───────────┘     └──────────┘   └───────────┘
```

| Hierarchy Tier | Target Persona & Endpoint | Scope & Visibility | Core Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Tier 1: Platform Super Admin** | **CRM SaaS Owner**<br>`/platform` (`superadmin@platform.com`) | Global platform across all companies | • Global telemetry (total companies, users, catalog items, GMV pipeline)<br>• Onboard new tenant companies & provision initial owner credentials<br>• Suspend or activate tenant company spaces |
| **Tier 2: Company Owner** | **Business / Dealer Owner**<br>`/owner` (`admin@test.com`) | Strictly scoped to tenant company | • Full organizational access (`*`)<br>• Executive revenue KPIs & full company quotation pipeline<br>• Manage team members & assign roles (Manager, Salesperson) in `/team`<br>• Configure company branding, GSTIN, bank details, & dual approval limits (Price ceiling & Discount threshold) in `/settings`<br>• Review and approve proposals in "Needs Approval" pipeline |
| **Tier 3: Catalog Manager** | **Operations / Catalog Lead**<br>`/manager` (`manager@test.com`) | Tenant company scope | • Add, edit, bulk import, & delete products in `/products`<br>• **Urgent Approval Queue**: Review, itemize-inspect, authorize, or reject quotations exceeding sales price or discount limits<br>• **CPQ Builder Access**: Full authorization to create & edit quotations in `/quotations/new` (with self-approval privilege)<br>• Catalog health & commercial account oversight |
| **Tier 4: Sales Representative** | **Salesperson**<br>`/sales` (`sales@test.com`) | Tenant company scope | • Personal sales workspace with "My Quotations" pipeline<br>• Browse product catalog (read-only; catalog modification is forbidden)<br>• Manage client accounts in `/customers`<br>• Generate quotations in `/quotations/new`. Quotations within limits (total ≤ price ceiling and discount ≤ margin ceiling) are **auto-approved and directly sent**; proposals breaching either ceiling are automatically routed to Manager's Urgent Approval Queue |

---

## 🚀 Dedicated Role Endpoints & Route Protection

The UI now strictly guards endpoints using `RoleRoute`:
- If an unauthenticated user visits any protected route, they are sent to `/login`.
- If a user attempts to access an endpoint outside their privilege level (e.g., a Salesperson manually typing `/manager`, `/owner`, `/team`, `/settings`, or `/platform`), they are immediately blocked and redirected to their authorized workspace.
- The root path `/` automatically detects the logged-in role and routes the user to their respective dashboard:
  - Super Admin ➔ `/platform`
  - Company Owner ➔ `/owner`
  - Catalog Manager ➔ `/manager`
  - Sales Representative ➔ `/sales`

### 1. Platform Super Admin Console (`/platform`)
* **Real-time Platform Telemetry**: Live metrics for Total Tenant Companies, Total Users, Total Products across the ecosystem, and Platform GMV Pipeline.
* **Tenant Directory**: Complete list of subscribed companies, contact details, user counts, catalog sizes, and quotation volumes.
* **Tenant Onboarding Wizard**: Modal to provision new company workspaces with custom URLs, initial admin accounts, and default margin rules.
* **Subscription Governance**: 1-click active/suspended status toggling to control tenant access.

### 2. Company Owner Executive Command Center (`/owner`)
* **Executive Revenue KPIs**: Live company pipeline valuation, quotation counts, team headcount, and discount threshold rules.
* **All-Company Quotation Governance**: Review all company proposals, approve/reject high-discount quotes, and download verified PDFs.
* **Executive Shortcuts**: Direct access to Team Management (`/team`), Company Settings (`/settings`), Products (`/products`), and Customers (`/customers`).

### 3. Catalog & Operations Manager Panel (`/manager`)
* **Urgent Approval Queue**: Real-time triage table for all proposals exceeding commercial boundaries.
  - **Itemized Inspection Modal**: Click the inspect icon to review item-by-item breakdown (SKUs, quantities, line totals, discounts applied, taxes, subtotal, and customer snapshot).
  - **1-Click Quick Approval**: Instantly approve quotations (`status: 'approved'`), recording manager ID and unblocking PDF export and client delivery.
  - **Rejection with Audit Remarks**: Prompt for rejection rationale (e.g., *"Discount exceeds margin"* or *"Price too high"*) to reject proposals (`status: 'rejected'`) and return them to the sales rep for revision.
* **Full CPQ Builder Access**: Managers can create proposals directly via `/quotations/new`, the sidebar CPQ Builder link, or `Ctrl+K`. Because managers possess approval authority, their quotations are self-approved upon creation.
* **Catalog Inventory Control**: Direct shortcuts to add new products, bulk import via CSV/Excel, and manage catalog pricing.
* **Restricted Scope**: Financial settings, bank accounts, and platform administration are strictly inaccessible.

### 4. Sales Representative Workspace (`/sales`)
* **Personal Sales Pipeline**: Metrics for personal quotation volume, approved deals, quoted pipeline total, and pending manager reviews.
* **Private Sharing Model & Data Isolation**: Following enterprise CPQ standards (Salesforce, HubSpot), each sales representative strictly sees only their own quotations, customer proposals, and personal performance metrics.
* **Database-Level RBAC Enforcement**: Hard-enforced in backend controllers (`query.createdBy = req.user._id`), preventing sales representatives from viewing or exporting other representatives' proposals or custom negotiated pricing.
* **Quick Launchers**: 1-click access to the Quotation Builder (`/quotations/new`), Client Directory (`/customers`), and Catalog.

### 5. Smart Quotation Builder (`/quotations/new`)
* **Barcode / SKU Auto-fill**: Typing an SKU (e.g. `20114IN-0`, `1224847`, `13661IN-CP`) automatically fills product name, thumbnail, price, tax, and unit.
* **Proposal Revision Workflow**: 1-click revision mode (`/quotations/new?reviseFrom=:id`) pre-populates all items, client details, notes, and pricing. Generates linked revisions (e.g., `QTN-1002-R1`, `QTN-1002-R2`) with an in-builder Revision Advisory Banner and preserves audit history.
* **Staged Catalog Items**: Seamlessly loads draft items queued from the product catalog.
* **Client Pre-Selection**: Auto-selects the customer when launched from the customer directory (`?customerId=...`).
* **Dual Commercial Limit Governance**:
  - Automatically evaluates total proposal value against `approvalPriceThreshold` (e.g. ₹1,00,000) and discount percentage against `maxDiscountThreshold` (e.g. 10%).
  - If either threshold is breached by a sales rep, the proposal is marked `pending` with a clear explanation and sent to the Manager's Urgent Approval Queue.
  - If within limits, the quotation is **immediately approved and ready for client delivery**.

### 6. Interactive Product Catalog (`/products`)
* **Strict Tenant Isolation**: Companies only see their own catalog (e.g., Demo Corp sees 49 Kohler products; Apex Bathware sees 3 exclusive items).
* **Colorful Pastel Metric Cards**: 4 QuotePro signature metric cards (Catalog Asset Value in Mint, GST Compliance in Sky Blue, Staged Proposals in Warm Amber, and Specifier Target Margin in Lavender Purple) featuring solid accent icon badges, trend pills, and decorative background SVG wave curves.
* **Product Registration & Pre-Filled Edit Modal**: 
  - Click `Add New Product` to register a new verified item.
  - Click the amber-tinted **Edit (`Pencil`)** action button next to Delete in any table row to open the modal **pre-filled** with the product's existing SKU code, product title, category, MRP price, GST tax rate, unit of measure, specifications, and current AWS S3 image thumbnail.
  - Updates are saved instantly via the backend `PATCH /api/v1/products/:id` endpoint with optimistic table updating and micro-toast confirmation.
* **Direct AWS S3 Cloud Storage Pipeline**: Upload new product photos or replace existing images directly in the modal. Images are automatically optimized and streamed to your secure AWS S3 bucket.
* **Pagination (50 Items Per Page)**: Standardized limit of 50 items per page with clear range tracking (`Showing 1 to 50 of X products • 50 per page`), numbered page chips, and Previous/Next buttons. Automatically resets to Page 1 when searching or switching categories.
* **Automatic Pinned-to-Top Staging Queue**: As soon as any product is added or staged, it is automatically sorted to the **very top of the table on Page 1** with an emerald border and a `STAGED` overlay badge.
* **In-Row Stepper Controls**: Staged items feature an interactive inline stepper directly on the row (`[-] [Qty] [+]`) and a `+ Stage Item` button, allowing instant quantity adjustments without leaving the catalog. Staging is available for all tenant users (Owner, Manager, Sales) to facilitate quick quotation drafting.
* **High-Contrast Micro-Interactions**: Upgraded Copy SKU button to a tactile button pill (`text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/80`), Edit button to an amber pill (`text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/90`), and Delete button to a high-visibility rose pill (`text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/90`).
* **Instant Search & Category Filtering**: Filter by SKU, title, category, or description with real-time category pill selectors and distinct pastel category badges in the table.
* **Image Lightbox Modal & S3 Deletion**: Click any product thumbnail to inspect the full-resolution image, view its AWS S3 cloud storage URI, and permanently delete unwanted images from both S3 and the catalog with manager authorization.
* **Role Enforcement**: Catalog creation, editing, deleting, and CSV/Excel/PDF bulk-import tools are visible to managers/owners and protected against unauthorized modifications.

### 7. Client CRM Directory (`/customers`)
* **Client Directory**: Manage customer names, corporate projects, email, phone, GSTIN, and delivery addresses.
* **1-Click Quote Action**: Click `Quote` on any client to launch the Quotation Builder with that client pre-filled.
* **Client CRUD Modals**: Add, edit, or delete customer profiles with instant validation.

### 8. Team & RBAC Management (`/team`)
* **Team Directory**: View team members, assigned roles (`Company Admin`, `Manager`, `Salesperson`), and status.
* **Invite Team Member**: Modal to invite new users and assign their initial hierarchical role.
* **Status Toggles**: Instantly activate or suspend team members.

### 9. Company Settings, Approval Governance & Branding (`/settings`)
* **Manager Approval Rules & Commercial Ceilings**:
  - **Max Allowed Sales Discount (%) without Manager Sign-Off**: e.g., 10%.
  - **Max Proposal Total (₹) without Manager Sign-Off**: e.g., ₹1,00,000.
  - Proposals exceeding either limit are automatically intercepted and routed to the Manager's Urgent Approval Queue.
* **Brand Logo & Visual Identity**: Upload company logo (PNG, SVG, JPG, WebP) with live preview and removal controls. Automatically syncs to the workspace sidebar and is embedded into PDF quotation headers.
* **Branding & Profile**: Company trade name, contact email, phone, and registered address.
* **Tax & Finance**: Corporate GSTIN, currency, and bank account details (Bank name, Account #, IFSC, Branch).
* **Default PDF Terms**: Customizable terms and conditions embedded in quotation PDFs.

### 10. High-Resolution PDF Generation Engine
* **EJS + Puppeteer Architecture**: Generates clean, professional PDF proposals using custom EJS templates ([quotation.ejs](server/src/services/templates/quotation.ejs)).
* **Embedded Image Base64 Data URIs**: Static assets, product images, and company logos are converted to inline Base64 data URIs before rendering, eliminating broken images in exported PDFs.
* **Revision Tagging**: Dynamically embeds `REVISION 1`, `REVISION 2` badges in the exported document header.
* **Flexible Authentication**: Supports JWT via `Authorization: Bearer <token>`, `token` query parameters, and HTTP-only cookies.

---

## ⚖️ Dual-Threshold Approval System & Commercial Governance

To balance sales velocity with profit margin protection and high-value risk management, QuotePro Enterprise CPQ implements a 2-tier approval barrier:

```
                  ┌──────────────────────────────────────────────┐
                  │    Sales Rep creates / revises quotation     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │  Does Proposal Breach Any Commercial Ceiling?  │
                 │  1. Total Value > approvalPriceThreshold (₹)?  │
                 │  2. Total Discount > maxDiscountThreshold (%)? │
                 └───────────────┬────────────────┬───────────────┘
                                 │                │
                        NO (Within Limits)     YES (Breached)
                                 │                │
                                 ▼                ▼
                 ┌─────────────────────────┐  ┌─────────────────────────────┐
                 │  status: 'approved'     │  │  status: 'pending'          │
                 │  Auto-Approved & Sent   │  │  Routes to Manager Dashboard│
                 │  Direct PDF client link │  │  "Urgent Approval Queue"    │
                 └─────────────────────────┘  └──────────────┬──────────────┘
                                                             │
                                             ┌───────────────┴───────────────┐
                                             ▼                               ▼
                                  ┌────────────────────┐          ┌────────────────────┐
                                  │  Manager Approves  │          │  Manager Rejects   │
                                  │  status: 'approved'│          │  status: 'rejected'│
                                  │  PDF client link   │          │  Sales rep revises │
                                  └────────────────────┘          └────────────────────┘
```

### Threshold Rules & Outcomes

| Evaluated Parameter | Company Default Setting | Outcome when Breached by Sales Rep | Outcome when Within Allowable Limits |
| :--- | :--- | :--- | :--- |
| **Quotation Total Price** | `approvalPriceThreshold: ₹1,00,000` | Flagged as `status: 'pending'` and routed to the Manager's Urgent Approval Queue. | **Auto-Approved** (`status: 'approved'`) and immediately available for PDF export. |
| **Quotation Discount %** | `maxDiscountThreshold: 10%` | Flagged as `status: 'pending'` and routed to the Manager's Urgent Approval Queue. | **Auto-Approved** (`status: 'approved'`) and immediately available for PDF export. |
| **Owner / Manager Creation** | N/A (Approval Authority) | **Self-Approved** immediately upon creation (`approvedBy: req.user._id`). | Bypasses approval workflow completely. |

### Where to Find & Action Approval Requests
1. **Manager Dashboard (`/manager`):**
   - **Urgent Approval Queue**: Triage table displaying pending quotes, customer accounts, salesperson names, total proposal amount, and discount percentages.
   - **Inspect (Eye Icon)**: Itemized audit modal with line-by-line prices, taxes, applied discounts, customer delivery address, and notes.
   - **Quick Approve (Green Check)**: Instantly transitions quotation to `approved` and unlocks client PDF download.
   - **Quick Reject (Red Cross)**: Requires a rejection note to guide the sales representative on revising line items.
2. **Owner Executive Dashboard (`/owner`):**
   - Under the Quotations pipeline, click the **"Needs Approval"** tab to view, inspect, and approve pending proposals company-wide.
3. **Settings (`/settings`):**
   - Company owners can configure both commercial limits anytime under **"Manager Approval Rules & Commercial Ceilings"**.

---

## 📁 Repository Structure

```
saas/
├── assets/                          # Central asset storage
│   ├── by-sku/                     # Extracted product images named by SKU (e.g. 20114IN-0.png)
│   ├── excel_extracted/            # Raw images extracted from Excel workbooks
│   └── pdf_extracted/              # Product brochure images extracted from PDFs
├── client/                          # Frontend (React 18, Vite, Tailwind CSS, Redux Toolkit)
│   ├── public/assets/              # Synced static images & logos for browser preview
│   └── src/
│       ├── layouts/DashboardLayout.jsx # Dynamic RBAC sidebar & 1-click test role switcher
│       ├── pages/
│       │   ├── PlatformAdmin.jsx    # Super Admin multi-tenant console
│       │   ├── Dashboard.jsx        # Quotation pipeline, inspection modal & approval triggers
│       │   ├── Products.jsx         # Searchable catalog with +Add staging buttons
│       │   ├── QuotationBuilder.jsx # Barcode/SKU autofill builder & PDF generator
│       │   ├── Customers.jsx        # Client CRM directory with 1-click quote action
│       │   ├── Team.jsx             # Team member management & role assignment
│       │   ├── Settings.jsx         # Company branding, GSTIN, bank info & discount rules
│       │   └── Login.jsx            # Pixel-perfect login with 1-click test credentials
│       └── features/auth/authSlice.js
├── server/                          # Backend (Node.js, Express, MongoDB Atlas, Puppeteer)
│   ├── src/
│   │   ├── controllers/            # platform, auth, team, company, quotation, product, customer
│   │   ├── middlewares/            # superAdmin, auth, tenant isolation, and RBAC middlewares
│   │   ├── models/                 # Company, User, Product, Customer, Quotation, Role
│   │   ├── routes/                 # Express API routes (/platform, /team, /company, etc.)
│   │   ├── services/
│   │   │   ├── pdfService.js       # Base64 image converter & Puppeteer PDF generator
│   │   │   └── templates/quotation.ejs # Branded quotation PDF template
│   │   ├── app.js                  # Express middleware & route mounting
│   │   └── server.js               # Server entrypoint
│   └── seed.js                     # Multi-tenant hierarchical seed data script
├── extract_assets.py                # Asset extraction script for Excel workbooks
├── extract_all_catalog_images.py    # Multi-source image extraction & MongoDB sync script
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Redux Toolkit, React Router v6, Lucide Icons, Axios |
| **Backend** | Node.js, Express, Puppeteer, EJS, Mongoose |
| **Database** | MongoDB Atlas (Multi-tenant schema design with indexed scoping) |
| **Email Service** | Resend API (`resend` SDK) for transactional quotes, PDF attachments & manager alerts |
| **Extraction Tools** | Python 3, `openpyxl`, `PyPDF2`, `pdf2image`, `Pillow` |
| **Security** | JWT (JSON Web Tokens), BCrypt, Helmet, Express Rate Limiter, HttpOnly Cookies |

---

## ✉️ Direct Email Proposal Delivery (Resend Integration)

The platform provides an end-to-end transactional email delivery pipeline powered by **Resend**:

* **Instant Emailing from Quotation Builder (`/quotations/new`)**:
  - Right after creating an official proposal, an **"Email to Client"** action button appears directly in the outcome banner alongside "Download Official PDF".
  - Clicking it launches an enterprise modal pre-filled with the client's registered email address, proposal total, and a 1-click send trigger.
* **Emailing from Sales Dashboard (`/sales`)**:
  - Sales reps can click any approved quotation from their pipeline table and select **"Email to Client"** from the quotation detail modal.
* **Automated PDF Compilation & Attachment**:
  - When the email endpoint (`POST /api/v1/quotations/:id/email`) is triggered, the backend automatically generates a verified Puppeteer PDF with embedded high-resolution imagery, company branding, and commercial terms, attaching it directly to the outbound email (`QTN-xxx.pdf`).
* **Governance Alert Notifications**:
  - If a quote is generated with discounts breaching standard ceilings, an automated alert email is sent to company managers/owners flagging the request for authorization.
* **Sandbox / Live Testing**:
  - Out of the box in Resend sandbox mode, emails can be dispatched to your verified Resend account email or <code className="font-mono">delivered@resend.dev</code>.


---

## 🚦 Getting Started

### Prerequisites
* Node.js (v18+)
* Python 3 (for asset extraction scripts)
* MongoDB connection string (local or MongoDB Atlas)

---

### 1. Server Setup
```bash
cd server
npm install
```

Configure your environment variables in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
```

Seed the multi-tenant database:
```bash
node seed.js
```

Start the backend server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

---

### 2. Client Setup
```bash
cd client
npm install
```

Start the frontend development server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

To build for production:
```bash
npm run build
```

---

### 3. Automated Multi-Tenant Testing
Run the automated in-memory multi-tenant isolation and security test suite:
```bash
cd server
npm test
# Verifies product catalog isolation, cross-tenant update rejection, and unauthorized token rejection

# Run the 30-point comprehensive security and RBAC audit suite:
node tests/fullAuditSuite.js
# Validates public endpoints, SuperAdmin security, multi-tenant isolation, RBAC permissions, PATCH product updates, and CPQ revision workflows (30/30 passing)
```

---

### 4. Quick Demo Test Accounts

The platform includes a **1-click Role Switcher** in the top navigation header and on the login page:

| Role | Email | Password | Scope & Key Capabilities |
| :--- | :--- | :--- | :--- |
| ⚡ **Super Admin** | `superadmin@platform.com` | `password123` | Global platform console, view all companies, onboard tenants |
| 👑 **Company Owner** | `admin@test.com` | `password123` | Demo Corp owner, full team management, branding & settings |
| 👔 **Catalog Manager**| `manager@test.com` | `password123` | Demo Corp catalog admin, approve/reject high-discount quotes |
| 💼 **Sales Representative** | `sales@test.com` | `password123` | Demo Corp sales, client management, create quotes |
| 🏢 **Apex Corp Owner** | `apex@test.com` | `password123` | Apex Luxury Bathware owner (tests strict tenant data isolation) |

---

## 📡 Core API Endpoints

### Platform Super Admin (`/api/v1/platform`)
* `GET /api/v1/platform/stats` - Cross-tenant platform metrics
* `GET /api/v1/platform/companies` - List all tenant companies & metrics
* `POST /api/v1/platform/companies` - Onboard new company & owner user
* `PATCH /api/v1/platform/companies/:id/status` - Suspend or activate tenant

### Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/login` - Authenticate user & receive 7-day access token and 30-day refresh token
* `POST /api/v1/auth/logout` - Clear session cookies & invalidate refresh token
* `POST /api/v1/auth/refresh` - Issue new access token using refresh token (supported via HTTP-only cookie or JSON body) with automated client 401 interceptor retry

### Team Management (`/api/v1/team`)
* `GET /api/v1/team` - List tenant team members & available roles
* `POST /api/v1/team` - Add new team member
* `PATCH /api/v1/team/:id/role` - Update member role
* `PATCH /api/v1/team/:id/status` - Activate or suspend team member

### Company Settings (`/api/v1/company`)
* `GET /api/v1/company` - Fetch company profile, GSTIN, bank details & discount threshold
* `PATCH /api/v1/company` - Update company profile & settings

### Quotations (`/api/v1/quotations`)
* `GET /api/v1/quotations` - List tenant quotations (supports `status`, `myQuotes=true`, pagination)
* `GET /api/v1/quotations/:id` - Fetch single quotation details
* `POST /api/v1/quotations` - Create quotation (evaluates discount threshold)
* `POST /api/v1/quotations/:id/revise` - Create linked revision (e.g. `QTN-1002-R1`) with preserved items/customer
* `POST /api/v1/quotations/:id/approve` - Approve quotation (Manager/Admin only)
* `POST /api/v1/quotations/:id/reject` - Reject quotation with reason (Manager/Admin only)
* `GET /api/v1/quotations/:id/pdf` - Generate and download high-resolution PDF
* `POST /api/v1/quotations/:id/email` - Email quotation directly to client with branded HTML proposal summary and attached PDF (via Resend)

### Products (`/api/v1/products`)
* `GET /api/v1/products` - List tenant products (supports `search`, category filtering, pagination)
* `POST /api/v1/products` - Create product with direct AWS S3 photo upload (Manager/Admin only)
* `PATCH /api/v1/products/:id` - Update product specifications, pricing, tax, and AWS S3 photo (Manager/Admin only)
* `DELETE /api/v1/products/:id` - Delete product and associated AWS S3 image (Manager/Admin only)
* `DELETE /api/v1/products/:id/image` - Delete only the product image from AWS S3
* `POST /api/v1/products/bulk-import` - Bulk import products via Excel spreadsheet (.xlsx, .csv) or PDF brochure (.pdf) with automated PyMuPDF coordinate image extraction and AWS S3 upload

### Customers (`/api/v1/customers`)
* `GET /api/v1/customers` - List tenant commercial accounts
* `POST /api/v1/customers` - Create customer account
* `PATCH /api/v1/customers/:id` - Update customer account
* `DELETE /api/v1/customers/:id` - Delete customer account

---

## 📈 Development Phases Summary

* [x] **Phase 1: Project Setup & Multi-Tenant Core** - Express, MongoDB, Tenant Isolation, JWT Auth.
* [x] **Phase 2: RBAC & Permissions** - Role models, default system roles, permission checks.
* [x] **Phase 3: Catalog & Products** - Product CRUD, bulk import, category filtering.
* [x] **Phase 4: Quotation Builder** - Dynamic item entry, instant SKU autofill, live calculation.
* [x] **Phase 5: PDF Engine** - Puppeteer with EJS templates and base64 embedded imagery.
* [x] **Phase 6: Frontend Integration** - Redux state, modern Tailwind UI, responsive layouts.
* [x] **Phase 7: Asset & Extraction Pipeline** - Automated image extraction from Excel & Kohler brochures.
* [x] **Phase 8: Executive Dashboard** - KPI metric cards, pipeline tracking, direct PDF download triggers.
* [x] **Phase 9: 4-Tier Hierarchical RBAC** - Super Admin, Company Owner, Catalog Manager, Sales Representative.
* [x] **Phase 10: Discount Governance & Approvals** - Automatic threshold evaluation, pending quotes, manager review/rejection workflows.
* [x] **Phase 11: Platform Super Admin Console** - Multi-tenant management, cross-company metrics, tenant onboarding wizard.
* [x] **Phase 12: In-App Quotation Inspector** - Full line-item and margin review modal, status filters, "My Quotes" pipeline toggle.
* [x] **Phase 13: Team & Settings Management** - Member invites, role reassignments, status toggles, GSTIN & bank account configuration, discount threshold rules.
* [x] **Phase 14: Premium B2B SaaS Design System & UI Overhaul** - Reusable UI primitives (`Button`, `Input`, `Alert`, `Badge`, `Modal`, `Skeleton`, `Tabs`, `Card`), Linear-grade App Shell with `Cmd+K` Command Palette & responsive mobile drawer, upgraded Product Catalog with image lightbox, enterprise Quotation Builder with discount threshold advisory and sticky action bar, Client CRM directory with GSTIN copy micro-interactions, and 100% automated tenant isolation test suite (`npm test`).
* [x] **Phase 15: Catalog Pagination & Pinned Staging Queue** - 50 items/page pagination controls with bounded navigation, automatic pinned-to-top reordering for staged quote items, in-row stepper controls (`[-] [Qty] [+]`), and auto-reset pagination on filter/search changes.
* [x] **Phase 16: Proposal Revision Lifecycle & Brand Identity** - Quotation clone/revision engine (automated sequence `QTN-xxxx-R1`, parent linkage, preserved customer/items, and revision banner in builder), table and inspector revision triggers, corporate logo file uploader with live preview, dynamic PDF header branding, and automated test expansion (7/7 tests passing).
* [x] **Phase 17: Dual-Threshold Commercial Governance & Manager CPQ Unification** - 2-tier approval barrier (price ceiling `approvalPriceThreshold` & margin ceiling `maxDiscountThreshold`), auto-approved direct dispatch for compliant proposals, Urgent Approval Queue with itemized inspection & audit remarks on Manager Dashboard, and unified CPQ Builder (`/quotations/new`) access across Owner, Manager, and Sales roles.
* [x] **Phase 18: Full Endpoints, RBAC & URL Security Audit Suite** - Automated 28-point in-memory test suite (`tests/fullAuditSuite.js`) and 19-point live server test suite (`tests/liveServerAudit.js`) validating 100% tenant isolation, route protection (`RoleRoute`), backdoor role-switcher removal, zero unauthorized data access (401/403/404), and seamless client build (`npm run build`).
* [x] **Phase 19: Smart Column Matching & Enterprise AWS S3 Cloud Storage** - Intelligent header normalizer & fuzzy alias dictionary (`Product Code`, `Item No`, `MRP`, `Rate` auto-detection), currency & percentage sanitization, official `@aws-sdk/client-s3` integration with tenant namespaces (`tenants/{companyId}/products/{sku}.png`), live automated S3 verification (`scripts/testS3Connection.js`), and full database image migration (`scripts/migrateCatalogToS3.js`).
* [x] **Phase 20: Direct In-App PDF Brochure Ingestion with AWS S3 Auto-Upload** - Seamless `.pdf` brochure drag-and-drop in `/products`, PyMuPDF automated layout parsing (extracts SKUs, titles, MRP prices, and descriptions), row-boundary coordinate image cropping, direct streaming of cropped photos to AWS S3, duplicate SKU resolution toggle, and automated test suite (`tests/testPdfBrochureUpload.js`).
* [x] **Phase 21: High-Contrast Micro-Interactions, Colorful Dashboard Visuals & S3 Product Deletion** - Unified emerald green (`#05603a`, `variant="forest"`) action buttons, removed duplicate plus prefixes (`+ +`), added smooth hover lift (`hover:-translate-y-0.5`, `hover:shadow-md`) and active click feedback. Upgraded Copy SKU and Delete action buttons to high-contrast button pills. Converted Product Catalog top KPI cards into QuotePro colorful pastel cards (Mint, Sky Blue, Warm Amber, Lavender Purple) with wave graphics, added dynamic category badge styling, and enabled direct deletion of unwanted product images from AWS S3 buckets.
* [x] **Phase 22: Individual Product Registration Modal with Direct AWS S3 Upload** - Replaced placeholder alerts with a fully validated "Register New Product" modal supporting SKU, Title, Category, Price, GST Tax Rate, Unit, and Specifications. Integrated client-side image file selection with live thumbnail preview, automated backend S3 streaming, and instant optimistic catalog table updates.
* [x] **Phase 23: Sales Rep Isolation & Private Sharing Model (Industry Standard CPQ)** - Enforced owner-based private quotation scoping aligning with Salesforce CPQ and HubSpot standards. Each sales representative strictly sees only their own quotations, customer proposals, and personal pipeline metrics on `/sales`. Hard-enforced RBAC at the controller level (`query.createdBy = req.user._id` for `getQuotations`, `getQuotation`, and `generatePDF`), preventing cross-rep data leakage.
* [x] **Phase 24: Resilient Session Persistence & 401 Silent Auto-Refresh** - Resolved page reload authentication drops by increasing JWT access token validity from 15 minutes to **7 days** (and refresh tokens to 30 days). Configured synchronous `axios.defaults.headers.common['Authorization']` pre-population from `localStorage` on boot, and implemented an automatic Axios 401 response interceptor that silently calls `/api/v1/auth/refresh` and replays requests seamlessly.
* [x] **Phase 25: Full Product Catalog Editing & Pre-filled PATCH Integration** - Added an amber-tinted Edit (`Pencil`) action button directly next to Delete (`Trash2`) in the Product Catalog table. Clicking Edit opens a pre-filled modal containing the product's SKU, title, category, MRP price, GST tax rate, unit of measure, description, specifications, and current S3 image thumbnail. Seamlessly submits updates via `PATCH /api/v1/products/:id` with tenant isolation (`req.tenantId`), supports direct AWS S3 replacement photo upload and image clearing, provides optimistic UI updates with micro-toast alerts, ensures catalog item staging (`+ / -` steppers) is accessible across all tenant roles, and expanded the automated audit test suite to 30 tests (`tests/fullAuditSuite.js`).
* [x] **Phase 26: Resend Enterprise Transactional Email Integration & Automated Alerts** - Verified official Resend API integration (`re_3ati...dMJX`) with live test verification script (`scripts/testResendConnection.js`). Built `emailService.js` supporting direct customer proposal dispatch with high-resolution Puppeteer PDF attachments, automated background manager approval alerts when proposals breach commercial ceilings, and sales decision notifications upon approval/rejection. Added 1-click "Email to Client" action in `SalesDashboard.jsx` with loading feedback and confirmation micro-toasts.




