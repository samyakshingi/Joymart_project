import requests
import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_phase3():
    print("--- Testing Phase 3 Backend Features ---")
    
    # 1. Update Product
    print("\n1. Updating Product ID 2...")
    res = requests.put(f"{BASE_URL}/products/2", json={
        "name": "Whole Wheat Bread",
        "price": 45.0,
        "discounted_price": 39.0,
        "stock_count": 25,
        "category": "Bakery",
        "is_available": True
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 2. Create Coupon
    coupon_code = f"TEST{datetime.datetime.now().strftime('%M%S')}"
    print(f"\n2. Creating Coupon '{coupon_code}'...")
    res = requests.post(f"{BASE_URL}/coupons", json={
        "code": coupon_code,
        "discount_percentage": 15,
        "is_active": True
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 3. Validate Coupon
    print(f"\n3. Validating Coupon '{coupon_code}'...")
    res = requests.get(f"{BASE_URL}/coupons/{coupon_code}")
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 4. Create Order with Phase 3 Metadata
    print("\n4. Placing Order with Tip, Instructions, and Coupon...")
    # First get a user (or create one)
    user_res = requests.post(f"{BASE_URL}/users", json={
        "phone": "9876543210",
        "name": "Test User",
        "society_id": 1,
        "flat_number": "B-202"
    })
    user_id = user_res.json()["id"]
    
    order_res = requests.post(f"{BASE_URL}/orders", json={
        "user_id": user_id,
        "items": [{"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 1}],
        "tip_amount": 20.0,
        "delivery_instructions": "Gate code 1234. Leave at door.",
        "applied_coupon": coupon_code
    })
    print(f"Status: {order_res.status_code}, Response: {order_res.json()}")

if __name__ == "__main__":
    test_phase3()
