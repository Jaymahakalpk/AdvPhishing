"""
Seed script to populate the database with demo data
Run: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.shops.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})
    await db.delivery_partners.delete_many({})
    await db.otps.delete_many({})
    
    # Create sample villages in Gujarat
    villages = ["Surat", "Vadodara", "Ahmedabad", "Rajkot", "Bhavnagar"]
    
    # Create sample shops
    shops_data = [
        {
            "owner_id": "demo_owner_1",
            "name": "રામ કિરાણા સ્ટોર (Ram Kirana Store)",
            "category": "kirana",
            "description": "તમારી દૈનિક જરૂરિયાતો માટે (Your daily needs)",
            "address": "મુખ્ય બજાર, સુરત (Main Market, Surat)",
            "location": {"lat": 21.1702, "lng": 72.8311},
            "village": "Surat",
            "photos": [],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "owner_id": "demo_owner_2",
            "name": "શ્રી શાક-ભાજી (Shree Vegetable Shop)",
            "category": "vegetables",
            "description": "તાજા શાકભાજી દરરોજ (Fresh vegetables daily)",
            "address": "બજાર રોડ, વડોદરા (Bazaar Road, Vadodara)",
            "location": {"lat": 22.3072, "lng": 73.1812},
            "village": "Vadodara",
            "photos": [],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "owner_id": "demo_owner_3",
            "name": "આરોગ્ય મેડિકલ સ્ટોર (Arogya Medical Store)",
            "category": "medicine",
            "description": "તમામ પ્રકારની દવાઓ ઉપલબ્ધ (All types of medicines available)",
            "address": "હોસ્પિટલ રોડ, અમદાવાદ (Hospital Road, Ahmedabad)",
            "location": {"lat": 23.0225, "lng": 72.5714},
            "village": "Ahmedabad",
            "photos": [],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "owner_id": "demo_owner_4",
            "name": "મહેતા કિરાણા (Mehta Kirana)",
            "category": "kirana",
            "description": "Quality products at best prices",
            "address": "Station Road, Rajkot",
            "location": {"lat": 22.3039, "lng": 70.8022},
            "village": "Rajkot",
            "photos": [],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    shop_ids = []
    for shop in shops_data:
        result = await db.shops.insert_one(shop)
        shop_ids.append(str(result.inserted_id))
    
    print(f"Created {len(shop_ids)} shops")
    
    # Create sample products for each shop
    products_data = []
    
    # Kirana products (Shop 1 and 4)
    kirana_products = [
        {"name": "ચોખા (Rice)", "price": 50.0, "stock": 100, "category": "grains"},
        {"name": "તુવેર દાળ (Toor Dal)", "price": 80.0, "stock": 50, "category": "pulses"},
        {"name": "ઘઉં નો લોટ (Wheat Flour)", "price": 40.0, "stock": 75, "category": "grains"},
        {"name": "તેલ (Oil)", "price": 150.0, "stock": 30, "category": "oil"},
        {"name": "ખાંડ (Sugar)", "price": 45.0, "stock": 60, "category": "grocery"},
        {"name": "મીઠું (Salt)", "price": 15.0, "stock": 100, "category": "grocery"},
        {"name": "ચા (Tea)", "price": 120.0, "stock": 40, "category": "beverages"},
        {"name": "બિસ્કીટ (Biscuits)", "price": 20.0, "stock": 80, "category": "snacks"}
    ]
    
    for product in kirana_products:
        for shop_id in [shop_ids[0], shop_ids[3]]:
            products_data.append({
                "shop_id": shop_id,
                "name": product["name"],
                "description": f"Best quality {product['name']}",
                "price": product["price"],
                "stock_quantity": product["stock"],
                "category": product["category"],
                "photo": None,
                "is_available": True,
                "created_at": datetime.utcnow()
            })
    
    # Vegetable products (Shop 2)
    vegetable_products = [
        {"name": "ટામેટા (Tomato)", "price": 30.0, "stock": 50},
        {"name": "બટાકા (Potato)", "price": 25.0, "stock": 100},
        {"name": "ડુંગળી (Onion)", "price": 35.0, "stock": 80},
        {"name": "ભીંડા (Okra)", "price": 40.0, "stock": 30},
        {"name": "કારેલા (Bitter Gourd)", "price": 45.0, "stock": 25},
        {"name": "લીલું મરચું (Green Chili)", "price": 50.0, "stock": 20},
        {"name": "ધાણા (Coriander)", "price": 15.0, "stock": 40}
    ]
    
    for product in vegetable_products:
        products_data.append({
            "shop_id": shop_ids[1],
            "name": product["name"],
            "description": "Fresh from farm",
            "price": product["price"],
            "stock_quantity": product["stock"],
            "category": "vegetables",
            "photo": None,
            "is_available": True,
            "created_at": datetime.utcnow()
        })
    
    # Medicine products (Shop 3)
    medicine_products = [
        {"name": "Paracetamol 500mg", "price": 10.0, "stock": 200},
        {"name": "Crocin", "price": 15.0, "stock": 150},
        {"name": "Vicks VapoRub", "price": 80.0, "stock": 50},
        {"name": "Dettol Antiseptic", "price": 120.0, "stock": 40},
        {"name": "Band-Aid", "price": 25.0, "stock": 100},
        {"name": "Digene Tablet", "price": 12.0, "stock": 80}
    ]
    
    for product in medicine_products:
        products_data.append({
            "shop_id": shop_ids[2],
            "name": product["name"],
            "description": "Genuine medicines",
            "price": product["price"],
            "stock_quantity": product["stock"],
            "category": "medicine",
            "photo": None,
            "is_available": True,
            "created_at": datetime.utcnow()
        })
    
    await db.products.insert_many(products_data)
    print(f"Created {len(products_data)} products")
    
    print("✅ Database seeded successfully!")
    print("\nDemo credentials:")
    print("Phone: 9876543210")
    print("OTP: Will be generated and logged when you request")

if __name__ == "__main__":
    asyncio.run(seed_database())
    print("\n✅ Seeding complete!")
