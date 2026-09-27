# FoodDash: MERN Food Delivery App

A full-stack food delivery app. Customers browse restaurants, order food and track it live. Restaurant owners manage menus, process orders and see sales analytics.

**Stack:** MongoDB · Express 5 · React 19 (Vite) · Node · Socket.IO · JWT

## Getting started

```bash
npm run install-all   # install root, server and client deps
npm run seed          # optional: demo restaurants, menus and users
npm run dev           # API on :5000, web app on http://localhost:5173
```

Configuration lives in `server/.env` (see `server/.env.example`).

### Demo logins (after seeding, password `password123`)
| Email | Role |
|---|---|
| customer@demo.com | Customer (has a saved address) |
| owner1@demo.com … owner4@demo.com | Restaurant owners |

To see real-time tracking, open the customer and an owner in two browsers (or one normal + one private window), place an order, and advance its status from **Partner → Orders**.

## Features

**Customers**
- Register / login (JWT, bcrypt-hashed passwords)
- Browse restaurants: search by name, cuisine or dish; filter by cuisine, pure-veg and open-now; sort by rating, delivery time or fee
- Restaurant menu grouped by category, with veg filter and in-menu search
- Cart with quantity controls (one restaurant at a time, persisted in localStorage)
- Checkout with saved-address selection or a new address, plus payment method and note
- Live order tracking (Socket.IO) with a status timeline; cancel while still "placed"
- Order history with one-click **Reorder** (uses current prices and availability)
- Profile: edit name and phone, change password, manage addresses

**Restaurant owners**
- Register as a partner and create or edit the restaurant profile, including an open/closed toggle
- Menu management: add, edit and delete items, plus an in-stock/out-of-stock toggle
- Live order board: new orders arrive instantly; accept → preparing → out for delivery → delivered, or reject/cancel
- Sales dashboard: revenue, order count, average order value, active orders, a daily revenue chart (7/14/30/90 days), top items and a status breakdown

## Project structure

```
server/src
  index.js            Express app + Socket.IO bootstrap
  socket.js           JWT-authenticated sockets; rooms user:<id>, restaurant:<id>
  middleware/auth.js  protect + requireRole
  models/             User, Restaurant, MenuItem, Order
  routes/             auth, users, restaurants, menu, orders, analytics
  seed.js             demo data
client/src
  context/            Auth, Cart, Socket (+ toasts)
  pages/              customer pages
  pages/owner/        dashboard, restaurant profile, menu, orders
```

## API summary

| Method | Path | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | auth |
| PUT | /api/users/profile | auth |
| POST/PUT/DELETE | /api/users/addresses[/:id] | auth |
| GET | /api/restaurants?search=&cuisine=&veg=&openNow=&sort= | public |
| GET | /api/restaurants/cuisines, /api/restaurants/:id | public |
| GET/POST/PUT | /api/restaurants/mine, /api/restaurants | owner |
| GET/POST/PUT/DELETE | /api/menu[/:id] | owner |
| POST | /api/orders | customer |
| GET | /api/orders/my, /api/orders/:id | auth |
| PATCH | /api/orders/:id/cancel | customer |
| GET | /api/orders/restaurant?status= | owner |
| PATCH | /api/orders/:id/status | owner |
| GET | /api/analytics?days=&tz= | owner |

Socket events: `order:new` (to the restaurant) and `order:updated` (to the customer and the restaurant).

Order totals are always recomputed on the server from database prices, so clients cannot tamper with them.
