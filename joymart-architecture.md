# JoyMart Commerce Platform: Architectural Handoff Document

Welcome to the JoyMart engineering team! This document serves as the absolute source of truth for the JoyMart backend architecture. You are tasked with building the native mobile applications (iOS and Android via React Native/Expo) that will consume this backend. 

**CRITICAL DIRECTIVE:** The mobile applications must consume this exact REST API backend. You are strictly forbidden from altering the existing database schema, bypassing the API to connect directly to the database, or writing custom endpoints that conflict with the established business logic.

---

## 1. Database Schema

The backend utilizes SQLAlchemy ORM. The following represents the exact relational schema currently implemented.

### `societies`
- `id` (Integer, Primary Key)
- `name` (String, Indexed)

### `users`
- `id` (Integer, Primary Key)
- `society_id` (Integer, ForeignKey -> societies.id)
- `flat_number` (String)
- `phone` (String, Unique, Indexed)
- `name` (String)

### `products`
- `id` (Integer, Primary Key)
- `name` (String, Indexed)
- `price` (Numeric 10,2)
- `is_available` (Boolean, default: True)
- `image_url` (String)
- `category` (String, Indexed)
- `stock_count` (Integer, default: 0)

### `orders`
- `id` (Integer, Primary Key)
- `user_id` (Integer, ForeignKey -> users.id)
- `order_date` (DateTime, default: UTC Now)
- `total_amount` (Numeric 10,2)
- `status` (String, default: "Pending") — Valid values: `Pending`, `Accepted`, `OutForDelivery`, `Completed`, `Cancelled`.

### `order_items`
- `id` (Integer, Primary Key)
- `order_id` (Integer, ForeignKey -> orders.id)
- `product_id` (Integer, ForeignKey -> products.id)
- `quantity` (Integer)
- `price_at_purchase` (Numeric 10,2)

### `store_settings`
- `id` (Integer, Primary Key)
- `is_open` (Boolean, default: True)

### ⚠️ Hybrid Stock-Out Logic (Must Read)
We utilize a hybrid inventory system that merges hard stock counts (`stock_count`) with a manual/automated kill switch (`is_available`). 
- **Ordering:** The backend explicitly enforces that `quantity <= stock_count`. If successful, the stock is decremented. If `stock_count` hits `0`, the backend automatically toggles `is_available = False`.
- **Cancellation:** If an order is cancelled, the items are restocked. If `stock_count` rises above `0`, the backend automatically toggles `is_available = True`.
- **UI Requirement:** Your mobile app must respect *both* fields. A product is only orderable if `is_available == True` AND `stock_count > 0`.

---

## 2. Core FastAPI Endpoints

The backend exposes the following RESTful endpoints. All endpoints are currently unauthenticated (session-based via phone number) for friction-less checkout.

### Store Operations
- `GET /store/status` - Returns `{ is_open: bool }`.
- `PUT /store/status?is_open=true|false` - Global kill-switch for accepting orders.

### Users & Auth
- `GET /societies` - List all deliverable societies.
- `POST /users` - Create or update a user profile.
- `GET /users/{phone}` - Fetch user by phone number.

### Catalog & Inventory
- `GET /products` - List all catalog items.
- `GET /products/trending` - Returns the top 5 most frequently bought products platform-wide.
- `POST /products` - Add a new product.
- `PUT /products/{product_id}/availability?is_available=true|false` - Manual toggle.
- `PUT /products/{product_id}/stock?stock_count=X` - Manual stock override.

### Order Management
- `GET /orders` - Fetch all orders (Admin use).
- `POST /orders` - Submit a new order. Enforces stock limits and store status.
- `PUT /orders/{order_id}/status` - Advance order stage (Admin use).
- `PUT /orders/{order_id}/cancel` - Customer self-serve cancellation (only allowed if status is `Pending`).
- `GET /orders/tracking/{phone}` - Returns all orders for a user, sorted newest first.
- `GET /orders/frequent/{phone}` - Returns the top 5 products historically bought by this specific user.

### Analytics
- `GET /analytics/today` - Returns daily revenue, order counts, and low-stock item counts.

---

## 3. Advanced Features Implemented

When building the React Native UI, ensure you port over the following advanced UX features that currently exist in the React Web App:

1. **Live Tracking:** The client should poll `GET /orders/tracking/{phone}` every 5 seconds. If an order transitions to `OutForDelivery`, trigger a local device push notification to alert the user.
2. **Smart Discovery (Trending & Frequent):** Utilize `GET /products/trending` on the home screen for global popularity. If a user is "logged in" (phone number known locally), utilize `GET /orders/frequent/{phone}` to show a "Buy Again" carousel.
3. **Frictionless Quick Checkout:** We do not use JWTs or passwords. The user's phone number acts as their primary identifier. Cache the user's details (Phone, Flat, Society) in `AsyncStorage` and automatically inject them into the checkout flow so returning users can checkout in 1 tap.
4. **Persistent Cart State:** The shopping cart array must be persisted to local storage (`AsyncStorage` in React Native) so that if the user hard-closes the app, their cart remains intact upon reopening.
5. **Self-Serve Order Cancellation:** Users can cancel orders directly from the Tracking screen *only* if the order is still in the `Pending` state. The backend handles the complex inventory restocking logic automatically.
6. **Smart Admin Operations:** The admin UI should use explicit 1-tap buttons for linear order progression (Pending -> Accepted -> OutForDelivery -> Completed) rather than generic dropdowns to save operational time.

---

## 4. Mobile App Architectural Instructions

1. **State Management:** Use a robust state manager (e.g., Zustand or Redux Toolkit) to manage the global cart state and user session state in React Native.
2. **Data Fetching:** Use React Query or SWR for caching, background refetching, and polling the live tracking endpoints.
3. **Responsive Design:** Ensure the Admin Dashboard gracefully scales down to mobile dimensions. Specifically, use a vertical stack layout for the Kanban columns on small screens instead of forcing horizontal swipes.
4. **Zero Backend Modifications:** If you require new data shapes for the mobile app, you must handle the data transformation on the client side or request a backend PR review. You may not alter the SQLAlchemy models or bypass the API constraints.
