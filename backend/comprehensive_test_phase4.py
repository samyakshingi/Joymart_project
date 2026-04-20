import requests
import datetime
import time

BASE_URL = "http://127.0.0.1:8000"

def test_report(name, result, detail=""):
    status = "PASS" if result else "FAIL"
    print(f"[{status}] | {name} {(': ' + detail) if detail else ''}")
    return result

def run_comprehensive_tests():
    print("=== Phase 4 Comprehensive Test Suite ===\n")
    results = []

    # 1. Test Reconciliation Status Logic
    print("--- Testing Reconciliation Logic ---")
    user_id = requests.post(f"{BASE_URL}/users", json={"phone": "9998887776", "name": "Audit Test", "society_id": 1, "flat_number": "T-100"}).json()["id"]
    
    # Order 1: Pending (Should NOT count)
    requests.post(f"{BASE_URL}/orders", json={"user_id": user_id, "items": [{"product_id": 1, "quantity": 1}], "payment_method": "Cash"})
    
    # Order 2: Completed (Should count)
    o2 = requests.post(f"{BASE_URL}/orders", json={"user_id": user_id, "items": [{"product_id": 1, "quantity": 1}], "payment_method": "UPI"}).json()
    requests.put(f"{BASE_URL}/orders/{o2['id']}/status", json={"status": "Completed"})
    
    recon = requests.get(f"{BASE_URL}/reports/reconciliation").json()
    results.append(test_report("Reconciliation Filter Status", recon["expected_upi"] > 0 and recon["expected_cash"] == 0, f"Expected UPI > 0, got {recon['expected_upi']}"))

    # 2. Test Supplier Balance Precision
    print("\n--- Testing Supplier Ledger Precision ---")
    s = requests.post(f"{BASE_URL}/suppliers", json={"name": "Precision Test Vendor", "phone": "000", "outstanding_balance": 0}).json()
    sid = s["id"]
    
    # Add 10 invoices of 10.33
    for _ in range(10):
        requests.post(f"{BASE_URL}/suppliers/{sid}/transactions", json={"amount": 10.33, "transaction_type": "Invoice", "description": "T"})
    
    s_check = requests.get(f"{BASE_URL}/suppliers").json()
    vendor = next(v for v in s_check if v["id"] == sid)
    # 10 * 10.33 = 103.3
    results.append(test_report("Supplier Balance Precision", float(vendor["outstanding_balance"]) == 103.3, f"Expected 103.3, got {vendor['outstanding_balance']}"))

    # 3. Test CSV Column Presence
    print("\n--- Testing CSV Data ---")
    csv_res = requests.get(f"{BASE_URL}/reports/export")
    header = csv_res.text.split("\n")[0]
    results.append(test_report("CSV Payment Method Column", "Payment Method" in header, f"Header: {header}"))

    # 4. Test Missing Payment Method (Legacy Support)
    # Manually creating a situation where payment_method might be null if handled incorrectly
    # But our schema requires it now. Let's check if API rejects missing field.
    print("\n--- Testing API Constraints ---")
    bad_order = requests.post(f"{BASE_URL}/orders", json={"user_id": user_id, "items": [{"product_id": 1, "quantity": 1}]})
    results.append(test_report("Order Payment Method Required", bad_order.status_code == 422, "API should reject orders without payment_method"))

    # Summary
    pass_count = sum(1 for r in results if r)
    print(f"\n=== FINAL RESULT: {pass_count}/{len(results)} PASSED ===")

if __name__ == "__main__":
    run_comprehensive_tests()
