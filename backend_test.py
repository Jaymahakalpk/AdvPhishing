#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Gaon Delivery App
Tests all critical APIs as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://gaon-delivery.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_PHONE = "9876543210"

class GaonDeliveryAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.user_id = None
        self.otp = None
        self.shop_ids = []
        self.product_ids = []
        self.order_id = None
        
        print(f"🚀 Starting Gaon Delivery API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 60)
    
    def test_auth_send_otp(self):
        """Test POST /api/auth/send-otp"""
        print("\n1️⃣ Testing Auth - Send OTP")
        
        url = f"{self.base_url}/auth/send-otp"
        payload = {"phone": TEST_PHONE}
        
        try:
            response = self.session.post(url, json=payload)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "otp" in data:
                    self.otp = data["otp"]
                    print(f"   ✅ OTP sent successfully: {self.otp}")
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_auth_verify_otp(self):
        """Test POST /api/auth/verify-otp"""
        print("\n2️⃣ Testing Auth - Verify OTP")
        
        if not self.otp:
            print("   ❌ No OTP available from previous test")
            return False
        
        url = f"{self.base_url}/auth/verify-otp"
        payload = {"phone": TEST_PHONE, "otp": self.otp}
        
        try:
            response = self.session.post(url, json=payload)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "user" in data:
                    user = data["user"]
                    self.user_id = user.get("id")
                    print(f"   ✅ OTP verified successfully")
                    print(f"   👤 User ID: {self.user_id}")
                    print(f"   📱 Phone: {user.get('phone')}")
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_shops(self):
        """Test GET /api/shops"""
        print("\n3️⃣ Testing Shops - Get All Shops")
        
        url = f"{self.base_url}/shops"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "shops" in data:
                    shops = data["shops"]
                    self.shop_ids = [shop["id"] for shop in shops]
                    print(f"   ✅ Retrieved {len(shops)} shops")
                    
                    # Check if we have expected 4 demo shops
                    if len(shops) >= 4:
                        print(f"   ✅ Expected demo shops found")
                        for shop in shops[:3]:  # Show first 3
                            print(f"      - {shop.get('name')} ({shop.get('category')}) in {shop.get('village')}")
                    else:
                        print(f"   ⚠️  Expected 4 shops, found {len(shops)}")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_shops_by_village(self):
        """Test GET /api/shops?village=Surat"""
        print("\n4️⃣ Testing Shops - Filter by Village")
        
        url = f"{self.base_url}/shops?village=Surat"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "shops" in data:
                    shops = data["shops"]
                    print(f"   ✅ Retrieved {len(shops)} shops in Surat")
                    
                    # Verify all shops are from Surat
                    surat_shops = [shop for shop in shops if shop.get("village") == "Surat"]
                    if len(surat_shops) == len(shops):
                        print(f"   ✅ All shops correctly filtered for Surat")
                    else:
                        print(f"   ⚠️  Filter issue: {len(surat_shops)}/{len(shops)} shops from Surat")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_villages(self):
        """Test GET /api/villages"""
        print("\n5️⃣ Testing Villages - Get All Villages")
        
        url = f"{self.base_url}/villages"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "villages" in data:
                    villages = data["villages"]
                    print(f"   ✅ Retrieved {len(villages)} villages")
                    print(f"   🏘️  Villages: {', '.join(villages)}")
                    
                    # Check for expected villages
                    expected_villages = ["Surat", "Vadodara", "Ahmedabad", "Rajkot", "Bhavnagar"]
                    found_villages = [v for v in expected_villages if v in villages]
                    print(f"   ✅ Found {len(found_villages)}/{len(expected_villages)} expected villages")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_products(self):
        """Test GET /api/products"""
        print("\n6️⃣ Testing Products - Get All Products")
        
        url = f"{self.base_url}/products"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "products" in data:
                    products = data["products"]
                    self.product_ids = [product["id"] for product in products]
                    print(f"   ✅ Retrieved {len(products)} products")
                    
                    # Check if we have expected 29 products
                    if len(products) >= 29:
                        print(f"   ✅ Expected demo products found")
                    else:
                        print(f"   ⚠️  Expected 29 products, found {len(products)}")
                    
                    # Show sample products
                    for product in products[:3]:
                        print(f"      - {product.get('name')} - ₹{product.get('price')} ({product.get('category')})")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_products_by_shop(self):
        """Test GET /api/products?shop_id=<shop_id>"""
        print("\n7️⃣ Testing Products - Filter by Shop")
        
        if not self.shop_ids:
            print("   ❌ No shop IDs available from previous tests")
            return False
        
        shop_id = self.shop_ids[0]  # Use first shop
        url = f"{self.base_url}/products?shop_id={shop_id}"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "products" in data:
                    products = data["products"]
                    print(f"   ✅ Retrieved {len(products)} products for shop {shop_id}")
                    
                    # Verify all products belong to the shop
                    shop_products = [p for p in products if p.get("shop_id") == shop_id]
                    if len(shop_products) == len(products):
                        print(f"   ✅ All products correctly filtered for shop")
                    else:
                        print(f"   ⚠️  Filter issue: {len(shop_products)}/{len(products)} products from shop")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_categories(self):
        """Test GET /api/categories"""
        print("\n8️⃣ Testing Categories - Get All Categories")
        
        url = f"{self.base_url}/categories"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "categories" in data:
                    categories = data["categories"]
                    print(f"   ✅ Retrieved {len(categories)} categories")
                    print(f"   🏪 Categories: {', '.join(categories)}")
                    
                    # Check for expected categories
                    expected_categories = ["kirana", "vegetables", "medicine"]
                    found_categories = [c for c in expected_categories if c in categories]
                    print(f"   ✅ Found {len(found_categories)}/{len(expected_categories)} expected categories")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_create_order(self):
        """Test POST /api/orders"""
        print("\n9️⃣ Testing Orders - Create Order")
        
        if not self.user_id:
            print("   ❌ No user ID available from auth tests")
            return False
        
        if not self.shop_ids or not self.product_ids:
            print("   ❌ No shop/product IDs available from previous tests")
            return False
        
        url = f"{self.base_url}/orders"
        
        # Create sample order with first shop and first two products
        order_data = {
            "customer_id": self.user_id,
            "shop_id": self.shop_ids[0],
            "items": [
                {
                    "product_id": self.product_ids[0],
                    "product_name": "Test Product 1",
                    "quantity": 2,
                    "price": 50.0
                },
                {
                    "product_id": self.product_ids[1] if len(self.product_ids) > 1 else self.product_ids[0],
                    "product_name": "Test Product 2",
                    "quantity": 1,
                    "price": 80.0
                }
            ],
            "total_amount": 180.0,
            "payment_method": "cod",
            "delivery_address": "Test Address, Surat, Gujarat",
            "delivery_location": {"lat": 21.1702, "lng": 72.8311}
        }
        
        try:
            response = self.session.post(url, json=order_data)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "order" in data:
                    order = data["order"]
                    self.order_id = order.get("id")
                    print(f"   ✅ Order created successfully")
                    print(f"   📦 Order ID: {self.order_id}")
                    print(f"   💰 Total: ₹{order.get('total_amount')}")
                    print(f"   📍 Status: {order.get('status')}")
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def test_get_orders(self):
        """Test GET /api/orders?customer_id=<user_id>"""
        print("\n🔟 Testing Orders - Get Customer Orders")
        
        if not self.user_id:
            print("   ❌ No user ID available from auth tests")
            return False
        
        url = f"{self.base_url}/orders?customer_id={self.user_id}"
        
        try:
            response = self.session.get(url)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "orders" in data:
                    orders = data["orders"]
                    print(f"   ✅ Retrieved {len(orders)} orders for customer")
                    
                    # Verify all orders belong to the customer
                    customer_orders = [o for o in orders if o.get("customer_id") == self.user_id]
                    if len(customer_orders) == len(orders):
                        print(f"   ✅ All orders correctly filtered for customer")
                    else:
                        print(f"   ⚠️  Filter issue: {len(customer_orders)}/{len(orders)} orders from customer")
                    
                    # Show order details
                    for order in orders[:2]:  # Show first 2 orders
                        print(f"      - Order {order.get('id')}: ₹{order.get('total_amount')} ({order.get('status')})")
                    
                    return True
                else:
                    print(f"   ❌ Invalid response format: {data}")
                    return False
            else:
                print(f"   ❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False
    
    def check_backend_logs(self):
        """Check backend logs for any errors"""
        print("\n🔍 Checking Backend Logs")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                logs = result.stdout.strip()
                if logs:
                    # Filter out normal server messages
                    error_lines = []
                    for line in logs.split("\n"):
                        if any(error_word in line.lower() for error_word in ["error", "exception", "traceback", "failed"]):
                            if not any(normal_word in line.lower() for normal_word in ["reloading", "startup", "shutdown"]):
                                error_lines.append(line)
                    
                    if error_lines:
                        print("   ⚠️  Backend errors found:")
                        print("   " + "\n   ".join(error_lines[-5:]))  # Last 5 error lines
                        return False
                    else:
                        print("   ✅ No critical errors in backend logs (only normal server messages)")
                        return True
                else:
                    print("   ✅ No recent errors in backend logs")
                    return True
            else:
                print("   ⚠️  Could not read backend logs")
                return True  # Don't fail test for log reading issues
                
        except Exception as e:
            print(f"   ⚠️  Exception reading logs: {str(e)}")
            return True  # Don't fail test for log reading issues
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🧪 Running Comprehensive Backend API Tests")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        tests = [
            ("Auth - Send OTP", self.test_auth_send_otp),
            ("Auth - Verify OTP", self.test_auth_verify_otp),
            ("Shops - Get All", self.test_get_shops),
            ("Shops - Filter by Village", self.test_get_shops_by_village),
            ("Villages - Get All", self.test_get_villages),
            ("Products - Get All", self.test_get_products),
            ("Products - Filter by Shop", self.test_get_products_by_shop),
            ("Categories - Get All", self.test_get_categories),
            ("Orders - Create Order", self.test_create_order),
            ("Orders - Get Customer Orders", self.test_get_orders),
        ]
        
        results = {}
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"   ❌ Test '{test_name}' crashed: {str(e)}")
                results[test_name] = False
                failed += 1
        
        # Check backend logs
        log_check = self.check_backend_logs()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n📈 Results: {passed} passed, {failed} failed")
        
        if failed == 0 and log_check:
            print("🎉 ALL TESTS PASSED - Backend APIs are working correctly!")
            return True
        else:
            print("⚠️  SOME TESTS FAILED - Check individual test results above")
            return False

def main():
    """Main test execution"""
    tester = GaonDeliveryAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Backend testing completed with failures")
        sys.exit(1)

if __name__ == "__main__":
    main()