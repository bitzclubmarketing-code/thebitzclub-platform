#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class BITZClubAPITester:
    def __init__(self, base_url="https://hi-messenger-66.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            print(f"   URL: {url}")
            print(f"   Status: {response.status_code}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"identifier": "9999999999", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user = response['user']
            print(f"   🔑 Admin token obtained: {self.token[:20]}...")
            print(f"   👤 Logged in as: {self.admin_user['name']}")
            return True
        return False

    def test_plans_endpoints(self):
        """Test plans CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PLANS ENDPOINTS")
        print("="*50)
        
        # Get all plans
        success, plans_data = self.run_test("Get All Plans", "GET", "api/plans", 200)
        if not success:
            return False
            
        print(f"   📋 Found {len(plans_data)} plans")
        
        # Create a new plan
        new_plan = {
            "name": "Test Premium",
            "description": "Test premium membership",
            "duration_months": 6,
            "price": 15000,
            "features": ["Test feature 1", "Test feature 2"],
            "is_active": True
        }
        
        success, plan_response = self.run_test(
            "Create Plan",
            "POST", 
            "api/plans",
            200,
            data=new_plan
        )
        
        if success and 'id' in plan_response:
            plan_id = plan_response['id']
            print(f"   ✨ Created plan with ID: {plan_id}")
            
            # Get specific plan
            self.run_test(f"Get Plan {plan_id}", "GET", f"api/plans/{plan_id}", 200)
            
            # Update plan
            update_data = {"price": 16000}
            self.run_test(
                f"Update Plan {plan_id}",
                "PUT",
                f"api/plans/{plan_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def test_partners_endpoints(self):
        """Test partners CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PARTNERS ENDPOINTS")
        print("="*50)
        
        # Get all partners
        success, partners_data = self.run_test("Get All Partners", "GET", "api/partners", 200)
        if not success:
            return False
            
        print(f"   🏢 Found {len(partners_data)} partners")
        
        # Create a new partner
        new_partner = {
            "name": "Test Gym",
            "description": "Premium fitness center",
            "logo_url": "https://example.com/logo.jpg",
            "contact_email": "info@testgym.com",
            "contact_phone": "9876543210",
            "address": "Test Address",
            "facilities": [
                {
                    "facility_name": "Gym Access",
                    "discount_percentage": 25,
                    "description": "Full gym access"
                }
            ],
            "is_active": True
        }
        
        success, partner_response = self.run_test(
            "Create Partner",
            "POST",
            "api/partners",
            200,
            data=new_partner
        )
        
        if success and 'id' in partner_response:
            partner_id = partner_response['id']
            print(f"   ✨ Created partner with ID: {partner_id}")
            
            # Get specific partner
            self.run_test(f"Get Partner {partner_id}", "GET", f"api/partners/{partner_id}", 200)
            
            return True
        return False

    def test_members_endpoints(self):
        """Test members CRUD operations"""
        print("\n" + "="*50)
        print("TESTING MEMBERS ENDPOINTS")
        print("="*50)
        
        # Get all members
        success, members_data = self.run_test("Get All Members", "GET", "api/members", 200)
        if not success:
            return False
            
        print(f"   👥 Found {members_data.get('total', 0)} members")
        
        # Get plans for member creation
        plans_success, plans_data = self.run_test("Get Plans for Member", "GET", "api/plans", 200)
        if not plans_success or not plans_data:
            print("❌ Cannot create member without plans")
            return False
            
        plan_id = plans_data[0]['id']
        
        # Create a new member
        new_member = {
            "name": "Test Member",
            "mobile": f"98765{datetime.now().strftime('%H%M%S')}",  # Unique mobile
            "email": "testmember@example.com",
            "address": "Test Address",
            "plan_id": plan_id
        }
        
        success, member_response = self.run_test(
            "Create Member",
            "POST",
            "api/members",
            200,
            data=new_member
        )
        
        if success and 'id' in member_response:
            member_id = member_response['id']
            print(f"   ✨ Created member with ID: {member_id}")
            print(f"   🔑 Temp password: {member_response.get('temporary_password', 'N/A')}")
            
            # Get specific member
            self.run_test(f"Get Member {member_id}", "GET", f"api/members/{member_id}", 200)
            
            return True
        return False

    def test_telecallers_endpoints(self):
        """Test telecallers CRUD operations"""
        print("\n" + "="*50)
        print("TESTING TELECALLERS ENDPOINTS")
        print("="*50)
        
        # Get all telecallers
        success, telecallers_data = self.run_test("Get All Telecallers", "GET", "api/telecallers", 200)
        if not success:
            return False
            
        print(f"   📞 Found {len(telecallers_data)} telecallers")
        
        # Create a new telecaller
        new_telecaller = {
            "name": "Test Telecaller",
            "mobile": f"99887{datetime.now().strftime('%H%M%S')}",
            "email": "telecaller@example.com",
            "password": "testpass123"
        }
        
        success, telecaller_response = self.run_test(
            "Create Telecaller",
            "POST",
            "api/telecallers",
            200,
            data=new_telecaller
        )
        
        if success and 'id' in telecaller_response:
            telecaller_id = telecaller_response['id']
            print(f"   ✨ Created telecaller with ID: {telecaller_id}")
            return True
        return False

    def test_reports_endpoints(self):
        """Test reports endpoints"""
        print("\n" + "="*50)
        print("TESTING REPORTS ENDPOINTS")
        print("="*50)
        
        # Get dashboard stats
        success, stats_data = self.run_test("Dashboard Stats", "GET", "api/reports/dashboard-stats", 200)
        if success:
            print(f"   📊 Total Members: {stats_data.get('total_members', 0)}")
            print(f"   📊 Active Members: {stats_data.get('active_members', 0)}")
            print(f"   📊 Total Revenue: ₹{stats_data.get('total_revenue', 0)}")
            
        # Get members report
        self.run_test("Members Report", "GET", "api/reports/members", 200)
        
        return success

    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n" + "="*50)
        print("TESTING PUBLIC ENDPOINTS")
        print("="*50)
        
        # Save current token
        saved_token = self.token
        self.token = None
        
        # Test public plans endpoint
        success1, _ = self.run_test("Public Plans", "GET", "api/plans?is_active=true", 200)
        
        # Test public partners endpoint  
        success2, _ = self.run_test("Public Partners", "GET", "api/partners?is_active=true", 200)
        
        # Test member verification (create a dummy member first)
        self.token = saved_token
        plans_success, plans_data = self.run_test("Get Plans", "GET", "api/plans", 200)
        if plans_success and plans_data:
            member_data = {
                "name": "Verify Test Member",
                "mobile": f"77777{datetime.now().strftime('%H%M%S')}",
                "email": "verify@example.com",
                "plan_id": plans_data[0]['id']
            }
            member_success, member_response = self.run_test(
                "Create Member for Verification",
                "POST",
                "api/members",
                200,
                data=member_data
            )
            
            if member_success and 'member_id' in member_response:
                member_id = member_response['member_id']
                # Test verification endpoint (public)
                self.token = None
                success3, _ = self.run_test(
                    f"Verify Member {member_id}",
                    "GET",
                    f"api/verify/{member_id}",
                    200
                )
            else:
                success3 = False
        else:
            success3 = False
        
        # Restore token
        self.token = saved_token
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting BITZ Club API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        
        # Test auth first
        if not self.test_auth_flow():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all endpoint tests
        tests = [
            ("Plans", self.test_plans_endpoints),
            ("Partners", self.test_partners_endpoints),
            ("Members", self.test_members_endpoints),
            ("Telecallers", self.test_telecallers_endpoints),
            ("Reports", self.test_reports_endpoints),
            ("Public Endpoints", self.test_public_endpoints)
        ]
        
        failed_tests = []
        for test_name, test_func in tests:
            try:
                if not test_func():
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ {test_name} test crashed: {e}")
                failed_tests.append(test_name)
        
        # Print final results
        print("\n" + "="*50)
        print("FINAL RESULTS")
        print("="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success rate: {success_rate:.1f}%")
        
        if failed_tests:
            print(f"❌ Failed test categories: {', '.join(failed_tests)}")
            return False
        else:
            print("✅ All test categories passed!")
            return True

def main():
    tester = BITZClubAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())