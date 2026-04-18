import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
import models

from sqlalchemy.pool import StaticPool

# 1. Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Dependency Override (forces API to use our test memory DB instead of the real one)
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Pre-populate required foreign keys (Society and User) for Order testing
    society = models.Society(name="Test Society")
    db.add(society)
    db.commit()
    
    user = models.User(society_id=society.id, flat_number="101", phone="111222333", name="Test User")
    db.add(user)
    db.commit()
    
    yield
    # Teardown
    Base.metadata.drop_all(bind=engine)

def test_create_and_get_product():
    # Test valid product creation
    response = client.post("/products", json={
        "name": "Bread",
        "price": 40.0,
        "category": "Bakery",
        "stock_count": 3
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Bread"
    assert data["is_available"] is True

    # Test get products
    response = client.get("/products")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_create_order_valid():
    # 1. Product 1 (Bread) was created above. We will order 3.
    # 3 * 40 = 120 (This is > 100, so delivery should be free!)
    response = client.post("/orders", json={
        "user_id": 1, 
        "items": [
            {"product_id": 1, "quantity": 3} 
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_amount"] == 120.0
    assert data["status"] == "Pending"

    # Verify stock decrement and is_available toggle
    prod_resp = client.get("/products")
    bread = prod_resp.json()[0]
    assert bread["stock_count"] == 0
    assert bread["is_available"] is False

def test_create_order_invalid_product():
    # Test ordering a product that doesn't exist
    response = client.post("/orders", json={
        "user_id": 1,
        "items": [{"product_id": 999, "quantity": 1}]
    })
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]
    
def test_update_order_status():
    # Test updating to a valid status
    response = client.put("/orders/1/status", json={"status": "OutForDelivery"})
    assert response.status_code == 200
    assert response.json()["status"] == "OutForDelivery"

    # Test Invalid Status
    response = client.put("/orders/1/status", json={"status": "Magic"})
    assert response.status_code == 400

def test_get_user_by_phone():
    response = client.get("/users/111222333")
    assert response.status_code == 200
    assert response.json()["name"] == "Test User"
    
    response = client.get("/users/000000000")
    assert response.status_code == 404

def test_get_frequent_products():
    response = client.get("/orders/frequent/111222333")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Bread"

    print("\n[SUCCESS] API Endpoints logic verified via TestClient!")
