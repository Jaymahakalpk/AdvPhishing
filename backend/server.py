from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ==================== Models ====================

class User(BaseModel):
    phone: str
    name: Optional[str] = None
    role: str  # customer, delivery_partner, shop_owner
    language_preference: str = "en"  # en, hi, gu
    location: Optional[Dict[str, float]] = None  # {lat, lng}
    village: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class Shop(BaseModel):
    owner_id: str
    name: str
    category: str  # kirana, vegetables, medicine, etc.
    description: Optional[str] = None
    address: str
    location: Dict[str, float]  # {lat, lng}
    village: str
    photos: List[str] = []  # base64 images
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Product(BaseModel):
    shop_id: str
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    category: str
    photo: Optional[str] = None  # base64 image
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    customer_id: str
    shop_id: str
    delivery_partner_id: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    payment_method: str  # upi, cod
    payment_status: str = "pending"  # pending, completed, failed
    delivery_address: str
    delivery_location: Dict[str, float]
    status: str = "placed"  # placed, accepted, assigned, picked_up, on_the_way, delivered, cancelled
    status_history: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryPartner(BaseModel):
    user_id: str
    photo: Optional[str] = None  # base64 image
    aadhaar_photo: Optional[str] = None  # base64 image
    is_verified: bool = False
    is_available: bool = True
    current_location: Optional[Dict[str, float]] = None
    total_earnings: float = 0.0
    rating: float = 5.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(BaseModel):
    delivery_partner_id: str
    order_id: Optional[str] = None
    amount: float
    type: str  # earning, payout
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== Auth Routes ====================

@api_router.post("/auth/send-otp")
async def send_otp(login: UserLogin):
    """Send OTP to phone number (mocked for now)"""
    # Generate 4-digit OTP
    otp = str(random.randint(1000, 9999))
    
    # In production, send via SMS service
    # For now, just log it
    print(f"OTP for {login.phone}: {otp}")
    
    # Store OTP in database with expiry
    await db.otps.update_one(
        {"phone": login.phone},
        {"$set": {"otp": otp, "created_at": datetime.utcnow()}},
        upsert=True
    )
    
    return {"success": True, "message": "OTP sent successfully", "otp": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(verify: OTPVerify):
    """Verify OTP and return user data"""
    # Check OTP
    otp_doc = await db.otps.find_one({"phone": verify.phone})
    
    if not otp_doc or otp_doc["otp"] != verify.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Find or create user
    user_doc = await db.users.find_one({"phone": verify.phone})
    
    if not user_doc:
        # Create new user
        new_user = User(phone=verify.phone, role="customer")
        result = await db.users.insert_one(new_user.dict())
        user_doc = await db.users.find_one({"_id": result.inserted_id})
    
    # Delete OTP
    await db.otps.delete_one({"phone": verify.phone})
    
    return {"success": True, "user": serialize_doc(user_doc)}

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: Dict[str, Any]):
    """Update user profile"""
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return {"success": True, "user": serialize_doc(user_doc)}

# ==================== Shop Routes ====================

@api_router.post("/shops")
async def create_shop(shop: Shop):
    """Create a new shop"""
    result = await db.shops.insert_one(shop.dict())
    shop_doc = await db.shops.find_one({"_id": result.inserted_id})
    return {"success": True, "shop": serialize_doc(shop_doc)}

@api_router.get("/shops")
async def get_shops(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    village: Optional[str] = None,
    category: Optional[str] = None
):
    """Get shops based on location or village"""
    query = {"is_active": True}
    
    if village:
        query["village"] = village
    
    if category:
        query["category"] = category
    
    shops = await db.shops.find(query).to_list(100)
    
    # If location provided, filter by distance (simple calculation for MVP)
    if lat and lng:
        filtered_shops = []
        for shop in shops:
            if "location" in shop and shop["location"]:
                # Simple distance calculation (not accurate but good for MVP)
                shop_lat = shop["location"]["lat"]
                shop_lng = shop["location"]["lng"]
                distance = ((lat - shop_lat) ** 2 + (lng - shop_lng) ** 2) ** 0.5
                # Filter within ~10km (approximately 0.1 degrees)
                if distance < 0.1:
                    filtered_shops.append(shop)
        shops = filtered_shops
    
    return {"success": True, "shops": [serialize_doc(shop) for shop in shops]}

@api_router.get("/shops/{shop_id}")
async def get_shop(shop_id: str):
    """Get shop details"""
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"success": True, "shop": serialize_doc(shop)}

# ==================== Product Routes ====================

@api_router.post("/products")
async def create_product(product: Product):
    """Create a new product"""
    result = await db.products.insert_one(product.dict())
    product_doc = await db.products.find_one({"_id": result.inserted_id})
    return {"success": True, "product": serialize_doc(product_doc)}

@api_router.get("/products")
async def get_products(shop_id: Optional[str] = None, category: Optional[str] = None):
    """Get products by shop or category"""
    query = {"is_available": True}
    
    if shop_id:
        query["shop_id"] = shop_id
    
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(1000)
    return {"success": True, "products": [serialize_doc(p) for p in products]}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get product details"""
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "product": serialize_doc(product)}

# ==================== Order Routes ====================

@api_router.post("/orders")
async def create_order(order: Order):
    """Create a new order"""
    order_dict = order.dict()
    order_dict["status_history"] = [
        {"status": "placed", "timestamp": datetime.utcnow()}
    ]
    
    result = await db.orders.insert_one(order_dict)
    order_doc = await db.orders.find_one({"_id": result.inserted_id})
    
    # Update product stock
    for item in order.items:
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
    
    return {"success": True, "order": serialize_doc(order_doc)}

@api_router.get("/orders")
async def get_orders(
    customer_id: Optional[str] = None,
    shop_id: Optional[str] = None,
    delivery_partner_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get orders with filters"""
    query = {}
    
    if customer_id:
        query["customer_id"] = customer_id
    
    if shop_id:
        query["shop_id"] = shop_id
    
    if delivery_partner_id:
        query["delivery_partner_id"] = delivery_partner_id
    
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    return {"success": True, "orders": [serialize_doc(o) for o in orders]}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details"""
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "order": serialize_doc(order)}

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: Dict[str, str]):
    """Update order status"""
    new_status = status_update.get("status")
    
    # Add to status history
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    status_history = order.get("status_history", [])
    status_history.append({
        "status": new_status,
        "timestamp": datetime.utcnow()
    })
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": new_status,
            "status_history": status_history,
            "updated_at": datetime.utcnow()
        }}
    )
    
    order_doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    return {"success": True, "order": serialize_doc(order_doc)}

# ==================== Delivery Partner Routes ====================

@api_router.post("/delivery-partners")
async def create_delivery_partner(partner: DeliveryPartner):
    """Register a delivery partner"""
    # Auto-verify for MVP
    partner_dict = partner.dict()
    partner_dict["is_verified"] = True  # Auto-approve for MVP
    
    result = await db.delivery_partners.insert_one(partner_dict)
    partner_doc = await db.delivery_partners.find_one({"_id": result.inserted_id})
    return {"success": True, "partner": serialize_doc(partner_doc)}

@api_router.get("/delivery-partners/{user_id}")
async def get_delivery_partner(user_id: str):
    """Get delivery partner profile"""
    partner = await db.delivery_partners.find_one({"user_id": user_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    return {"success": True, "partner": serialize_doc(partner)}

@api_router.put("/delivery-partners/{user_id}")
async def update_delivery_partner(user_id: str, update_data: Dict[str, Any]):
    """Update delivery partner profile"""
    await db.delivery_partners.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    partner_doc = await db.delivery_partners.find_one({"user_id": user_id})
    return {"success": True, "partner": serialize_doc(partner_doc)}

@api_router.get("/delivery-partners/user/{user_id}/available-orders")
async def get_available_orders(user_id: str, lat: Optional[float] = None, lng: Optional[float] = None):
    """Get available orders for delivery partner (unassigned or assigned to them)"""
    # Get partner's current location if not provided
    partner = await db.delivery_partners.find_one({"user_id": user_id})
    
    if not lat or not lng:
        if partner and partner.get("current_location"):
            lat = partner["current_location"]["lat"]
            lng = partner["current_location"]["lng"]
    
    # Find orders that are accepted by shop but not assigned to any partner
    query = {
        "$or": [
            {"status": "accepted", "delivery_partner_id": None},
            {"delivery_partner_id": user_id, "status": {"$in": ["assigned", "picked_up", "on_the_way"]}}
        ]
    }
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(50)
    
    # Enrich with shop details
    enriched_orders = []
    for order in orders:
        shop = await db.shops.find_one({"_id": ObjectId(order["shop_id"])})
        order["shop_details"] = serialize_doc(shop) if shop else None
        enriched_orders.append(serialize_doc(order))
    
    return {"success": True, "orders": enriched_orders}

@api_router.put("/orders/{order_id}/assign")
async def assign_order_to_partner(order_id: str, assign_data: Dict[str, str]):
    """Assign order to delivery partner"""
    partner_id = assign_data.get("delivery_partner_id")
    
    # Check if order exists and is available
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("delivery_partner_id"):
        raise HTTPException(status_code=400, detail="Order already assigned")
    
    # Update order
    status_history = order.get("status_history", [])
    status_history.append({
        "status": "assigned",
        "timestamp": datetime.utcnow()
    })
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "delivery_partner_id": partner_id,
            "status": "assigned",
            "status_history": status_history,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Add earning for partner (fixed delivery fee for MVP)
    delivery_fee = 30.0  # ₹30 per delivery
    
    transaction = Transaction(
        delivery_partner_id=partner_id,
        order_id=order_id,
        amount=delivery_fee,
        type="earning",
        status="completed"
    )
    await db.transactions.insert_one(transaction.dict())
    
    # Update partner's total earnings
    await db.delivery_partners.update_one(
        {"user_id": partner_id},
        {"$inc": {"total_earnings": delivery_fee}}
    )
    
    order_doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    return {"success": True, "order": serialize_doc(order_doc)}

@api_router.put("/delivery-partners/{user_id}/location")
async def update_partner_location(user_id: str, location_data: Dict[str, float]):
    """Update delivery partner's current location"""
    await db.delivery_partners.update_one(
        {"user_id": user_id},
        {"$set": {"current_location": location_data}}
    )
    return {"success": True, "message": "Location updated"}

@api_router.get("/delivery-partners/{user_id}/earnings")
async def get_earnings(user_id: str, period: Optional[str] = "all"):
    """Get delivery partner earnings"""
    query = {"delivery_partner_id": user_id, "type": "earning"}
    
    # Filter by period
    if period == "today":
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        query["created_at"] = {"$gte": today_start}
    elif period == "week":
        from datetime import timedelta
        week_start = datetime.utcnow() - timedelta(days=7)
        query["created_at"] = {"$gte": week_start}
    
    transactions = await db.transactions.find(query).sort("created_at", -1).to_list(100)
    
    partner = await db.delivery_partners.find_one({"user_id": user_id})
    
    # Calculate stats
    total_deliveries = len([t for t in transactions if t.get("type") == "earning"])
    total_earned = sum([t.get("amount", 0) for t in transactions if t.get("type") == "earning"])
    
    return {
        "success": True,
        "total_earnings": partner.get("total_earnings", 0.0) if partner else 0.0,
        "period_earnings": total_earned,
        "total_deliveries": total_deliveries,
        "transactions": [serialize_doc(t) for t in transactions]
    }

@api_router.post("/delivery-partners/{user_id}/payout-request")
async def request_payout(user_id: str, payout_data: Dict[str, float]):
    """Request payout"""
    amount = payout_data.get("amount", 0)
    
    partner = await db.delivery_partners.find_one({"user_id": user_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    if partner.get("total_earnings", 0) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create payout transaction
    transaction = Transaction(
        delivery_partner_id=user_id,
        order_id=None,
        amount=amount,
        type="payout",
        status="pending"
    )
    result = await db.transactions.insert_one(transaction.dict())
    
    # Deduct from earnings
    await db.delivery_partners.update_one(
        {"user_id": user_id},
        {"$inc": {"total_earnings": -amount}}
    )
    
    transaction_doc = await db.transactions.find_one({"_id": result.inserted_id})
    return {"success": True, "transaction": serialize_doc(transaction_doc)}

# ==================== Village & Utility Routes ====================

@api_router.get("/villages")
async def get_villages():
    """Get list of all villages"""
    villages = await db.shops.distinct("village")
    return {"success": True, "villages": sorted(villages)}

@api_router.get("/categories")
async def get_categories():
    """Get list of shop categories"""
    categories = ["kirana", "vegetables", "fruits", "medicine", "dairy", "bakery", "meat", "other"]
    return {"success": True, "categories": categories}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
