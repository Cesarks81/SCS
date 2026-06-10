<div align="center">

# SCS — Supply Control System

**Full-stack inventory and warehouse management platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor%203.4+-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

[Live Demo](https://scs-cesarks81-4647s-projects.vercel.app/) · [Report a Bug](https://github.com/Cesarks81/SCS/issues) · [Request a Feature](https://github.com/Cesarks81/SCS/issues)

</div>

---

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

---

## Description

SCS is a full-stack web application for comprehensive inventory and warehouse management. It allows you to register products, track stock levels, log inbound and outbound movements, manage multiple warehouses, and generate exportable reports in Excel and PDF — all in real time with a modern, responsive interface.

---

## Features

### Inventory
- Create, edit, and remove products with custom attributes
- Two product types: **individual** (serialized) and **countable** (bulk)
- Image and emoji assignment per product
- Product statuses: `Optimal`, `Under repair`, `Assigned`, `Decommissioned`
- Minimum, maximum, and safety stock control

### Stock Movements
- Log inbound and outbound movements with a reason
- Real-time validation (prevents withdrawing more than available stock)
- Full movement history per product

### Warehouses
- Create and manage multiple warehouses with location
- Safe deletion (blocked if products are assigned)

### Statistics & Reports
- Dashboard with real-time inventory KPIs
- Stock level and movement visualization
- **Excel export (.xlsx)** with formatted columns
- **PDF export** with tables and headers

### Security
- JWT authentication (access tokens)
- bcrypt password hashing
- Protected routes on the frontend
- Logout confirmation prompt

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.x |
| Build tool | Vite | 8.x |
| Styling | Tailwind CSS | 4.x |
| Frontend routing | React Router DOM | 7.x |
| PDF export | jsPDF + jsPDF-autotable | 4.x / 5.x |
| Excel export | XLSX (SheetJS) | 0.18.x |
| Backend framework | FastAPI | 0.115.x |
| ASGI server | Uvicorn | 0.30.x |
| Database | MongoDB (async) | — |
| MongoDB driver | Motor | 3.4.x |
| Data validation | Pydantic v2 | 2.7.x |
| Authentication | python-jose + passlib | — |
| Deployment | Vercel | — |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                   │
│              React 19 + Vite + Tailwind CSS             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / REST API
┌───────────────────────▼─────────────────────────────────┐
│                 Backend (FastAPI + Uvicorn)              │
│   Modules: auth | products | warehouses | movements     │
│   Pattern: Router → Service → Repository                │
└───────────────────────┬─────────────────────────────────┘
                        │ Motor (async)
┌───────────────────────▼─────────────────────────────────┐
│                   MongoDB (Atlas / local)                │
│    Collections: users | products | warehouses | movements│
└─────────────────────────────────────────────────────────┘
```

The backend follows a **domain-based module pattern** (Router → Service → Repository), decoupling business logic from data access. All database operations are **asynchronous** via Motor.

---

## Prerequisites

- **Node.js** ≥ 18.x and **npm** ≥ 9.x
- **Python** ≥ 3.10
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free cloud tier)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Cesarks81/SCS.git
cd SCS
```

### 2. Set up the backend

```bash
cd scs-backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment variables file (see next section)
cp .env.example .env   # or create .env manually

# Start development server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.  
Interactive API docs (Swagger UI) at `http://localhost:8000/docs`.

### 3. Set up the frontend

```bash
cd ../scs-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

Create the file `scs-backend/.env` with the following variables:

```env
# MongoDB connection
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/
DB_NAME=scs_db

# JWT
SECRET_KEY=replace_this_with_a_long_secure_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> **Security note:** Never commit the `.env` file to the repository. It is already included in `.gitignore`.

---

## Usage

### Registration & Login

1. Open the app and create an account with your name, email, and password.
2. Log in — you'll receive a JWT token stored on the client.

### Warehouse Management

Before creating products, set up at least one warehouse from the main panel (warehouse icon in the sidebar). Each warehouse has a name and location.

### Product Management

- Click **"+"** to add a product.
- Fill in the form: model, category, type, assigned warehouse, stock levels, and custom attributes.
- You can upload an image or assign an emoji to the product.

### Stock Movements

- Open a product's detail view and use the **Inbound** / **Outbound** buttons.
- Enter the quantity and reason. The system will validate that stock is sufficient.

### Statistics & Export

- Go to the **Statistics** tab to view KPIs and charts.
- Use the **Export Excel** or **Export PDF** buttons to download the current report.

---

## API Reference

The full API is automatically documented by FastAPI at `/docs` (Swagger UI) and `/redoc`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in, returns JWT |

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products (filters: `category`, `warehouse_id`) |
| `GET` | `/api/products/{id}` | Get product by ID |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/{id}` | Update product |
| `DELETE` | `/api/products/{id}` | Delete product |

### Warehouses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/warehouses` | List warehouses |
| `GET` | `/api/warehouses/{id}` | Get warehouse by ID |
| `POST` | `/api/warehouses` | Create warehouse |
| `DELETE` | `/api/warehouses/{id}` | Delete warehouse (safe deletion) |

### Movements

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/movements` | Log a movement (inbound/outbound) |
| `GET` | `/api/movements/{product_id}` | Movement history for a product |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | MongoDB connection status |
| `GET` | `/` | General API info |

> Protected endpoints require the `Authorization: Bearer <token>` header.

---

## Project Structure

```
SCS/
├── scs-backend/                 # Python / FastAPI API
│   ├── core/
│   │   ├── config.py            # Configuration and environment variables
│   │   └── security.py          # JWT and password hashing
│   ├── db/
│   │   └── mongodb.py           # Async MongoDB client
│   ├── modules/
│   │   ├── auth/                # Authentication module
│   │   ├── products/            # Products module
│   │   ├── warehouses/          # Warehouses module
│   │   └── movements/           # Movements module
│   ├── main.py                  # FastAPI application entry point
│   └── requirements.txt
│
├── scs-frontend/                # React / Vite SPA
│   └── src/
│       ├── components/          # Reusable components (modals, images)
│       ├── pages/               # Pages (Login, Statistics)
│       ├── services/
│       │   └── api.js           # Centralized HTTP client
│       ├── utils/
│       │   └── exportReport.js  # Excel and PDF export
│       └── App.jsx              # Main inventory view
│
└── vercel.json                  # Vercel deployment configuration
```

---

## Deployment

The project is configured to deploy on **Vercel** using a single `vercel.json` that handles both the frontend (static build) and the backend (serverless Python).

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the project root
vercel --prod
```

Make sure to configure the [environment variables](#environment-variables) in the Vercel dashboard before the first deployment.

---

<div align="center">

Developed by [César Ramos Morón](https://github.com/Cesarks81)

</div>
