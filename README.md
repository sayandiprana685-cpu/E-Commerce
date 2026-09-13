# Vendora E-commerce Platform

Vendora is a full-stack e-commerce application with buyer, seller, and admin dashboards. The project includes a React + Vite client, an Express + MongoDB API, JWT-based authentication, role-aware routing, order flows, payments, seller management, and catalog administration.

## Features

- Buyer storefront and account dashboard
- Seller dashboard with product management, order control, and analytics
- Admin dashboard for users, sellers, products, payments, reviews, returns, categories, brands, and notifications
- JWT authentication, protected routes, role-based access, and rate limiting
- Catalog, cart, wishlist, checkout, order tracking, and returns
- Notifications, coupons, and file upload support

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Framer Motion, React Icons
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Authentication: JWT, bcryptjs
- Security: Helmet, CORS, compression, rate limiting

## Project Structure

- `client/` — React frontend
- `server/` — Express API and MongoDB models/routes/controllers
- `server/uploads/` — Uploaded media files

## Prerequisites

- Node.js 18+
- MongoDB running locally or via MongoDB Atlas
- npm

## Installation

1. Clone the repository.
2. Install client dependencies:
   ```bash
   cd client
   npm install
   ```
3. Install server dependencies:
   ```bash
   cd ../server
   n
   ```
4. pm installCreate environment variables using the server `.env.example` file as a template.

## Environment Variables

Create a `.env` file inside `server/` based on `.env.example`:



## Run the App

### Start the API

```bash
cd server
npm run dev
```

### Start the client

```bash
cd client
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:5000` by default.

## Seed Data

To populate sample catalog, users, and admin data:

```bash
cd server
npm run seed
```

## Default Admin Credentials

- Email: `admin@vendora.com`
- Password: `Admin@123`

## Notes

- The frontend uses the existing backend APIs and is designed to work with the current server implementation.
- Some dashboard pages were added to complete the missing UI layer while preserving the already implemented seller and admin backend routes.
- Browser-level runtime verification is recommended after the API and frontend are both running.

## Verification

The client build was verified successfully with:

```bash
cd client
npm run build
```

This produced a production bundle without compilation errors.
