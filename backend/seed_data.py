import sys
import os

# Add the current directory to sys.path to allow importing database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models

def seed_db():
    print("Initializing database connection...")
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Seed Societies
    if db.query(models.Society).count() == 0:
        print("Seeding Societies...")
        societies = [
            models.Society(name="Prestige Falcon City"),
            models.Society(name="Brigade Metropolis"),
            models.Society(name="Sobha City")
        ]
        db.add_all(societies)
        db.commit()
    else:
        print("Societies already exist. Skipping...")

    # 2. Seed Products
    # 2. Seed Products
    print("Seeding Grocery Products...")
    products_data = [
        {"name": "Fresh Milk 1L", "price": 60.00, "category": "Dairy", "stock": 50},
        {"name": "Whole Wheat Bread", "price": 45.00, "category": "Bakery", "stock": 30},
        {"name": "Farm Eggs (12 pcs)", "price": 85.00, "category": "Dairy", "stock": 40},
        {"name": "Amul Butter 100g", "price": 55.00, "category": "Dairy", "stock": 25},
        {"name": "Basmati Rice 5kg", "price": 450.00, "category": "Staples", "stock": 15},
        {"name": "Refined Sugar 1kg", "price": 48.00, "category": "Staples", "stock": 60},
        {"name": "Tata Salt 1kg", "price": 25.00, "category": "Staples", "stock": 100},
        {"name": "Sunflower Oil 1L", "price": 145.00, "category": "Staples", "stock": 40},
        {"name": "Red Onions 1kg", "price": 35.00, "category": "Vegetables", "stock": 80},
        {"name": "Potatoes 1kg", "price": 30.00, "category": "Vegetables", "stock": 80},
        {"name": "Fresh Tomatoes 1kg", "price": 40.00, "category": "Vegetables", "stock": 60},
        {"name": "Green Chillies 100g", "price": 15.00, "category": "Vegetables", "stock": 30},
        {"name": "Coriander Leaves", "price": 20.00, "category": "Vegetables", "stock": 25},
        {"name": "Fresh Paneer 200g", "price": 95.00, "category": "Dairy", "stock": 20},
        {"name": "Thick Yogurt 400g", "price": 65.00, "category": "Dairy", "stock": 35},
        {"name": "Kashmir Apples 1kg", "price": 180.00, "category": "Fruits", "stock": 20},
        {"name": "Robusta Bananas (1 Doz)", "price": 60.00, "category": "Fruits", "stock": 40},
        {"name": "Real Orange Juice 1L", "price": 110.00, "category": "Beverages", "stock": 50},
        {"name": "Maggi Noodles", "price": 14.00, "category": "Snacks", "stock": 100},
        {"name": "Lays Classic Salted", "price": 20.00, "category": "Snacks", "stock": 80},
        {"name": "Nutella Hazelnut Spread", "price": 350.00, "category": "Snacks", "stock": 40},
        {"name": "Whole Wheat Pasta", "price": 120.00, "category": "Staples", "stock": 50},
        {"name": "Greek Yogurt Blueberry", "price": 75.00, "category": "Dairy", "stock": 25},
        {"name": "Premium Cashews 250g", "price": 250.00, "category": "Snacks", "stock": 60},
        {"name": "Almond Milk 1L", "price": 300.00, "category": "Dairy", "stock": 30},
    ]
    
    for p in products_data:
        existing = db.query(models.Product).filter(models.Product.name == p["name"]).first()
        if not existing:
            # Generate a Cloudinary dummy image URL using the text overlay fetch API
            img_text = p['name'].replace(' ', '%20')
            image_url = f"https://res.cloudinary.com/demo/image/fetch/w_400,h_400,c_fill,q_auto,f_auto/https://placehold.co/400x400/png?text={img_text}"
            
            prod = models.Product(
                name=p["name"],
                price=p["price"],
                category=p["category"],
                stock_count=p["stock"],
                is_available=True,
                image_url=image_url
            )
            db.add(prod)
            
    db.commit()
        
    db.close()
    print("Database seeding complete! The mobile team can now begin testing.")

if __name__ == "__main__":
    seed_db()
