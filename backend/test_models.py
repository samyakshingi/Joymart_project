import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import Society, User, Product, Order, OrderItem

# In unit testing, it's best practice to isolate the database. 
# We use an in-memory SQLite database instead of PostgreSQL so tests run instantly and don't require external services.
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    # Setup: Create all tables in the temporary in-memory database
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    # Teardown: Close session and drop tables
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_schema_creation_and_inserts(db):
    # 1. Insert Society
    society = Society(name="Greenwoods Residency")
    db.add(society)
    db.commit()
    assert society.id is not None

    # 2. Insert User
    user = User(society_id=society.id, flat_number="101A", phone="9876543210", name="Test User")
    db.add(user)
    db.commit()
    assert user.id is not None

    # 3. Insert Product
    product = Product(name="Milk 1L", price=60.00, is_available=True, image_url="http://example.com/milk.png", category="Dairy")
    db.add(product)
    db.commit()
    assert product.id is not None

    # 4. Insert Order and OrderItem
    order = Order(user_id=user.id, total_amount=120.00, status="Pending")
    db.add(order)
    db.commit()

    order_item = OrderItem(order_id=order.id, product_id=product.id, quantity=2, price_at_purchase=60.00)
    db.add(order_item)
    db.commit()

    # Verify Order relationships and foreign keys
    assert order.id is not None
    assert len(order.items) == 1
    assert order.items[0].quantity == 2
    assert order.items[0].product_id == product.id

    print("\n[SUCCESS] Schema initialized and relationships tested successfully!")
