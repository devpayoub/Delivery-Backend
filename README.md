# Delivery Management System - Backend & API Documentation

---

## Overview

This document describes the backend API built with Node.js, Express, and Supabase for the delivery management system frontend.

---

## Table of Contents

1. [Backend Structure](#backend-structure)
2. [Database Schema](#database-schema)
3. [API Routes](#api-routes)
4. [Frontend API](#frontend-api)
5. [Setup Instructions](#setup-instructions)

---

## Backend Structure

```
Backend/
├── package.json
├── .env.example
├── schema.sql
└── src/
    ├── index.js              # Express server entry
    ├── config/
    │   └── supabase.js    # Supabase client
    ├── middleware/
    │   └── auth.js       # JWT authentication
    └── routes/
        ├── auth.js           # Register & Login
        ├── employers.js      # Employer CRUD
        ├── drivers.js        # Driver CRUD
        ├── cities.js        # City CRUD
        ├── productTypes.js   # Product Type CRUD
        ├── deliveries.js   # Delivery CRUD
        └── logs.js        # Logs GET
```

---

## Database Schema

### Tables Created (run `schema.sql` in Supabase SQL Editor):

| Table | Columns |
|-------|---------|
| `owners` | id, name, email, password, created_at |
| `employers` | id, name, phone, id_number, id_pic, password, created_at |
| `drivers` | id, name, phone, id_number, id_pic, license_number, license_pic, password, created_at |
| `cities` | id, name, created_at |
| `product_types` | id, name, created_at |
| `deliveries` | id, client_name, phone, address, product_type_id, city_id, employer_id, assigned_driver_id, status, reason, created_at |
| `logs` | id, role, action, details, timestamp |

### Sample Data Inserted:
- Cities: Tunis, Sousse, Sfax, Kairouan, Bizerte
- Product Types: Electronics, Clothing, Food, Documents, Furniture

---

## API Routes

### Base URL: `/api`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|------------|
| **Auth** |||||
| POST | /auth/register | No | - | Register owner (email + password) |
| POST | /auth/login | No | - | Login (role-based) |
| **Employers** |||||
| GET | /employers | Yes | owner | Get all employers |
| GET | /employers/:id | Yes | owner | Get employer by ID |
| POST | /employers | Yes | owner | Create employer |
| PUT | /employers/:id | Yes | owner | Update employer |
| DELETE | /employers/:id | Yes | owner | Delete employer |
| **Drivers** |||||
| GET | /drivers | Yes | owner | Get all drivers |
| GET | /drivers/:id | Yes | owner/employer | Get driver by ID |
| POST | /drivers | Yes | owner | Create driver |
| PUT | /drivers/:id | Yes | owner | Update driver |
| DELETE | /drivers/:id | Yes | owner | Delete driver |
| **Cities** |||||
| GET | /cities | Yes | all | Get all cities |
| GET | /cities/:id | Yes | all | Get city by ID |
| POST | /cities | Yes | owner | Create city |
| PUT | /cities/:id | Yes | owner | Update city |
| DELETE | /cities/:id | Yes | owner | Delete city |
| **Product Types** |||||
| GET | /product-types | Yes | all | Get all product types |
| GET | /product-types/:id | Yes | all | Get product type by ID |
| POST | /product-types | Yes | owner | Create product type |
| PUT | /product-types/:id | Yes | owner | Update product type |
| DELETE | /product-types/:id | Yes | owner | Delete product type |
| **Deliveries** |||||
| GET | /deliveries | Yes | all | Get deliveries (filtered by role) |
| GET | /deliveries/:id | Yes | all | Get delivery by ID |
| POST | /deliveries | Yes | employer/owner | Create delivery |
| PUT | /deliveries/:id | Yes | all | Update delivery |
| DELETE | /deliveries/:id | Yes | employer/owner | Delete delivery |
| **Logs** |||||
| GET | /logs | Yes | owner | Get all logs |

### Login Credentials:

| Role | Field | Required |
|------|-------|---------|
| owner | email + password | Yes |
| employer | phone + password | Yes |
| driver | phone + password | Yes |

---

## Frontend API

### Location: `/Frontend/src/api`

```
api/
├── index.js          # Exports all
├── config.js        # API client & Supabase config
├── auth.js         # Auth API
├── employers.js    # Employer API
├── drivers.js      # Driver API
├── cities.js      # City API
├── productTypes.js # Product Type API
├── deliveries.js  # Delivery API
└── logs.js       # Logs API
```

### Usage Example:

```javascript
import { authApi, employerApi, deliveryApi } from 'api';

// Login
const { user, token } = await authApi.login('employer', {
  phone: '123456789',
  password: 'password123'
});

// Get all employers
const employers = await employerApi.getAll();

// Create delivery
const delivery = await deliveryApi.create({
  client_name: 'John Doe',
  phone: '987654321',
  address: '123 Main St',
  product_type_id: 'pt_1',
  city_id: 'city_1'
});
```

---

## Setup Instructions

### 1. Backend Setup

```bash
cd Backend

# Copy env file
copy .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-service-role-key
# JWT_SECRET=your-secret-key

# Install dependencies
npm install

# Start server
npm start
```

### 2. Database Setup

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the contents of `schema.sql`

### 3. Storage Setup

1. Go to Supabase Storage
2. Create new bucket named: `delivery-images`
3. Make it public

### 4. Frontend Setup

Update `.env` with:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:3000/api
```

---

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|------------|
| PORT | Server port (default: 3000) |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_KEY | Supabase service role key |
| JWT_SECRET | Secret key for JWT tokens |

### Frontend (.env)
| Variable | Description |
|----------|------------|
| REACT_APP_SUPABASE_URL | Supabase project URL |
| REACT_APP_SUPABASE_ANON_KEY | Supabase anon key |
| REACT_APP_API_URL | Backend API URL |

---

## Notes

- Employer and Driver login uses **phone + password** (not email)
- Images are uploaded to Supabase Storage as base64
- JWT tokens expire in 7 days
- All routes require authentication except register/login