import requests
import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_phase4_step1():
    print("--- Testing Phase 4 Step 1 Backend Features ---")
    
    # 1. Create a Supplier
    print("\n1. Creating Supplier 'Amul Dairy'...")
    res = requests.post(f"{BASE_URL}/suppliers", json={
        "name": "Amul Dairy",
        "phone": "1234567890",
        "outstanding_balance": 0
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")
    supplier_id = res.json()["id"]

    # 2. Add Invoice to Supplier
    print("\n2. Adding Invoice of 500.00 to Amul Dairy...")
    res = requests.post(f"{BASE_URL}/suppliers/{supplier_id}/transactions", json={
        "amount": 500.00,
        "transaction_type": "Invoice",
        "description": "Weekly milk stock"
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 3. Add Payment to Supplier
    print("\n3. Adding Payment of 200.00 to Amul Dairy...")
    res = requests.post(f"{BASE_URL}/suppliers/{supplier_id}/transactions", json={
        "amount": 200.00,
        "transaction_type": "Payment",
        "description": "Part payment"
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 4. Check Supplier Balance
    print("\n4. Checking Supplier Balance (Expected: 300.00)...")
    res = requests.get(f"{BASE_URL}/suppliers")
    suppliers = res.json()
    amul = next(s for s in suppliers if s["id"] == supplier_id)
    print(f"Amul Balance: {amul['outstanding_balance']}")

    # 5. Place Orders with Payment Methods
    print("\n5. Placing Orders with Payment Methods...")
    user_res = requests.post(f"{BASE_URL}/users", json={
        "phone": "1112223334",
        "name": "ERP Tester",
        "society_id": 1,
        "flat_number": "A-101"
    })
    user_id = user_res.json()["id"]

    # Order 1: Cash
    requests.post(f"{BASE_URL}/orders", json={
        "user_id": user_id,
        "items": [{"product_id": 1, "quantity": 1}],
        "payment_method": "Cash"
    })
    
    # Order 2: UPI
    order_res = requests.post(f"{BASE_URL}/orders", json={
        "user_id": user_id,
        "items": [{"product_id": 1, "quantity": 2}],
        "payment_method": "UPI"
    })
    order_id_upi = order_res.json()["id"]

    # 6. Complete the UPI Order
    print("\n6. Completing UPI Order...")
    requests.put(f"{BASE_URL}/orders/{order_id_upi}/status", json={"status": "Completed"})

    # 7. Check Reconciliation Report
    print("\n7. Checking Reconciliation Report...")
    res = requests.get(f"{BASE_URL}/reports/reconciliation")
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 8. Test CSV Export
    print("\n8. Testing CSV Export...")
    res = requests.get(f"{BASE_URL}/reports/export")
    print(f"Status: {res.status_code}, Content-Type: {res.headers.get('Content-Type')}")
    if res.status_code == 200:
        print("CSV Data Preview:")
        print("\n".join(res.text.split("\n")[:3]))

if __name__ == "__main__":
    test_phase4_step1()
