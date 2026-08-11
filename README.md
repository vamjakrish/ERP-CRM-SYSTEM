# Mini ERP + CRM Operations Portal

A complete, production-quality full-stack operations portal built for a wholesale/distribution business to manage customers (CRM), products (Inventory Catalog), stock movements (Audit Ledger), and sales challans (Dispatch Transactions).

## 🚀 Live Demo

**Live Application:** https://erp-crm-harshintech.vercel.app

## 📸 Screenshots

![Dashboard](screenshot/s1.png)

![CRM](screenshot/s2.png)

![Inventory](screenshot/s3.png)

![Sales Challans](screenshot/s4.png)

![Sales Challans2](screenshot/s5.png)

## 🚀 Key Features

* **Role-Based Access Control (RBAC)**: Supports 4 internal organizational roles:
  * **ADMIN**: Full database and configuration access.
  * **SALES**: Manages CRM Customer profiles, notes, and registers Sales Challans.
  * **WAREHOUSE**: Manages inventory catalog, direct stock adjustments, and views stock movements.
  * **ACCOUNTS**: Audit view of CRM logs, sales challans, and stock ledgers.
* **Customer CRM**: Complete pipeline tracker supporting contact info, company attributes, GSTIN records, and a running follow-up interaction notes ledger.
* **Inventory Catalog**: Product catalog featuring safety-level alert quantities (highlighting low stock) and warehouse location mapping.
* **Stock Ledger Logs**: Automatic IN/OUT ledger recording every single inventory adjustment, linking the quantity delta and reason to the authorized employee.
* **Sales Challan Business Transactions**:
  * Auto-generation of unique Challan Numbers.
  * Save and update Challan details as a **Draft**.
  * **Confirm Challan Dispatch**: Executes a safe PostgreSQL database transaction that:
    1. Validates real-time stock availability.
    2. Prevents stock from becoming negative (reverting and returning structured details on failure).
    3. Prevents duplicate confirmations.
    4. Preserves item snapshots (capturing the product name, SKU, and unit price at sale to maintain history).
    5. Deducts catalog stock and records corresponding OUT stock movements.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15 (React, App Router, TypeScript, Tailwind CSS, Lucide icons)
* **Backend**: Node.js + Express.js + TypeScript
* **Database**: PostgreSQL (using Prisma ORM for schema definitions and seeding)

---

## 📐 Architecture Overview

```
Browser (React Frontend)
       │
       ▼ [REST APIs + JWT Bearer Auth]
Express.js API Server (Node + TypeScript)
       │
       ▼ [Prisma ORM Client]
PostgreSQL Database Server
```

The codebase is organized into two separate directories:
1. `backend/`: Express app, Prisma schema, controllers, and middlewares.
2. `frontend/`: Next.js application pages, layouts, context, and components.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:Postgres%402006@localhost:5432/mini_erp_crm?schema=public"
JWT_SECRET="super_secret_jwt_key_change_me_in_production"
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🔑 Test Login Credentials

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@company.com` | `admin123` | Full Access across all tabs |
| **SALES** | `sales@company.com` | `sales123` | CRM Customers, Challan Drafting, Challan Confirmation |
| **WAREHOUSE** | `warehouse@company.com` | `warehouse123` | Product Catalog, Stock adjustments, Movement logs |
| **ACCOUNTS** | `accounts@company.com` | `accounts123` | View Customer records, view Movements, view Challans |

---

## 📦 Local Setup and Installation

### Prerequisites
* Node.js (v18+)
* PostgreSQL Database Server (Running on localhost:5432)

### 1. Database & Schema Initialization
1. Ensure your PostgreSQL service is running.
2. Configure your `DATABASE_URL` in `backend/.env`. Note that if your password contains special characters like `@`, you must URL-encode them (e.g. `Postgres@2006` becomes `Postgres%402006`).
3. Move into the `backend` folder and run:
   ```bash
   cd backend
   npm install
   npx prisma db push
   ```
4. Seed the database with the test roles and sample inventory:
   ```bash
   npm run prisma:seed
   ```

### 2. Run the Express Backend
From the `backend` directory:
```bash
npm run dev
```
The backend API server will start on [http://localhost:5000](http://localhost:5000).

### 3. Run the Next.js Frontend
Open a new terminal session, navigate to the `frontend` directory, and run:
```bash
cd frontend
npm install
npm run dev
```
The Next.js dev server will boot up on [http://localhost:3000](http://localhost:3000).

---

## 💡 Key Design Decisions & Assumptions

1. **Transactional Integrity**: The Sales Challan confirmation runs inside a single Prisma `$transaction`. If any product in the challan request has insufficient stock, the transaction is immediately rolled back, returning a detailed error payload indicating exactly what product failed and its available vs requested quantities.
2. **Product Snapshots**: To guarantee audit trails remain accurate even if catalog item details change (e.g., unit price updates or name revisions), the system captures and stores product snapshots inside the `SalesChallanItem` table upon challan creation.
3. **Automatic Stock Movement Triggers**: Changing stock levels manually (e.g., via the WAREHOUSE user's Adjust Stock modal) or confirming challans automatically generates corresponding IN/OUT logs. This makes it impossible to modify current stock quantities without leaving an audit trail.
