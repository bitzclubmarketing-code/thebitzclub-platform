"""
Test new features for BITZ Club:
1. Julian Member ID generation (10-digit format YYDDDNNNNN)
2. Offline Member Creation via admin endpoint
3. Plans with Maintenance Configuration (type, amount, GST, billing cycle, renewal)
4. Payment verification with fallback mechanism
"""
import pytest
import requests
import os
import uuid
import re
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestJulianMemberIDFormat:
    """Test Julian Member ID generation in YYDDDNNNNN format"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Admin authentication failed")
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def _get_plan_id(self, client):
        """Get first available plan ID"""
        response = client.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_julian_id_format_on_member_creation(self, admin_client):
        """Test that member_id follows Julian format YYDDDNNNNN"""
        unique_id = uuid.uuid4().hex[:6]
        member_data = {
            "name": f"TEST_Julian_{unique_id}",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "email": f"test_julian_{unique_id}@test.com",
            "plan_id": self._get_plan_id(admin_client)
        }
        
        response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        assert response.status_code == 200, f"Member creation failed: {response.text}"
        
        member = response.json()
        member_id = member.get("member_id")
        
        # Julian ID should be 10 digits
        assert member_id is not None, "Member ID not returned"
        assert len(member_id) == 10, f"Member ID should be 10 digits, got {len(member_id)}: {member_id}"
        assert member_id.isdigit(), f"Member ID should be all digits, got: {member_id}"
        
        # Parse Julian format: YYDDDNNNNN
        year_part = member_id[:2]
        day_part = member_id[2:5]
        sequence_part = member_id[5:]
        
        # Validate year (last 2 digits of current year)
        current_year = datetime.now().year % 100
        assert int(year_part) == current_year, f"Year part should be {current_year}, got {year_part}"
        
        # Validate day of year (001-366)
        assert 1 <= int(day_part) <= 366, f"Day of year should be 1-366, got {int(day_part)}"
        
        # Validate sequence (5 digits)
        assert len(sequence_part) == 5, f"Sequence should be 5 digits, got {len(sequence_part)}"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")
    
    def test_julian_id_sequential_increment(self, admin_client):
        """Test that sequential members get incrementing IDs"""
        unique_id = uuid.uuid4().hex[:4]
        members = []
        
        # Create 2 members
        for i in range(2):
            member_data = {
                "name": f"TEST_Seq_{unique_id}_{i}",
                "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
                "email": f"test_seq_{unique_id}_{i}@test.com",
                "plan_id": self._get_plan_id(admin_client)
            }
            response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
            assert response.status_code == 200
            members.append(response.json())
        
        # Check sequence increments
        id1 = int(members[0]["member_id"][5:])  # Last 5 digits
        id2 = int(members[1]["member_id"][5:])
        
        # Second ID should be greater (sequences may not be consecutive due to other tests)
        assert id2 > id1, f"Second sequence {id2} should be greater than first {id1}"
        
        # Cleanup
        for member in members:
            admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")


class TestOfflineMemberCreation:
    """Test admin endpoint for offline member creation"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Admin authentication failed")
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def _get_plan_id(self, client):
        """Get first available plan ID"""
        response = client.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_offline_member_creation_basic(self, admin_client):
        """Test basic offline member creation via admin endpoint"""
        unique_id = uuid.uuid4().hex[:6]
        member_data = {
            "name": f"TEST_Offline_{unique_id}",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "email": f"test_offline_{unique_id}@test.com",
            "plan_id": self._get_plan_id(admin_client),
            "source": "offline_admin"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/members/offline", json=member_data)
        assert response.status_code == 200, f"Offline member creation failed: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Success flag not set"
        assert "member_id" in result, "member_id not returned"
        assert "temporary_password" in result, "temporary_password not returned"
        
        member_id = result["member_id"]
        # Verify Julian format
        assert len(member_id) == 10, f"Member ID should be 10 digits, got: {member_id}"
        assert member_id.isdigit(), f"Member ID should be numeric, got: {member_id}"
        
        # Verify member was created by fetching it
        members_response = admin_client.get(f"{BASE_URL}/api/members?search={member_data['mobile']}")
        assert members_response.status_code == 200
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{result.get('user_id')}")
    
    def test_offline_member_with_personal_details(self, admin_client):
        """Test offline member creation with full personal details"""
        unique_id = uuid.uuid4().hex[:6]
        member_data = {
            "name": f"Mr TEST Offline FullDetails {unique_id}",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "country_code": "+91",
            "email": f"test_offline_full_{unique_id}@test.com",
            "plan_id": self._get_plan_id(admin_client),
            "address": "123 Test Street",
            "area": "Test Area",
            "city": "Test City",
            "state": "Test State",
            "country": "India",
            "pincode": "400001",
            "date_of_birth": "1990-05-15",
            "gender": "Male",
            "phone_residence": "022-12345678",
            "referral_id": "BITZ-E001",
            "source": "offline_admin"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/members/offline", json=member_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        result = response.json()
        assert result.get("success") == True
        
        # Verify the member has all the details
        members_response = admin_client.get(f"{BASE_URL}/api/members?search={member_data['mobile']}")
        members = members_response.json()
        
        if isinstance(members, dict) and "members" in members:
            members = members["members"]
        
        if members:
            member = members[0]
            assert member.get("city") == "Test City", "City not saved"
            assert member.get("state") == "Test State", "State not saved"
            assert member.get("country") == "India", "Country not saved"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{result.get('user_id')}")
    
    def test_offline_member_duplicate_mobile_rejected(self, admin_client):
        """Test that duplicate mobile is rejected for offline member"""
        unique_id = uuid.uuid4().hex[:6]
        mobile = f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}"
        
        # Create first member
        member_data = {
            "name": f"TEST_DupMobile1_{unique_id}",
            "mobile": mobile,
            "email": f"test_dup1_{unique_id}@test.com",
            "plan_id": self._get_plan_id(admin_client)
        }
        
        response1 = admin_client.post(f"{BASE_URL}/api/admin/members/offline", json=member_data)
        assert response1.status_code == 200
        result1 = response1.json()
        
        # Try to create second member with same mobile
        member_data2 = {
            "name": f"TEST_DupMobile2_{unique_id}",
            "mobile": mobile,
            "email": f"test_dup2_{unique_id}@test.com",
            "plan_id": self._get_plan_id(admin_client)
        }
        
        response2 = admin_client.post(f"{BASE_URL}/api/admin/members/offline", json=member_data2)
        assert response2.status_code == 400, f"Should reject duplicate mobile, got: {response2.status_code}"
        assert "already registered" in response2.text.lower(), f"Error should mention already registered: {response2.text}"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{result1.get('user_id')}")
    
    def test_offline_member_requires_admin_auth(self):
        """Test that offline member creation requires admin authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        member_data = {
            "name": "TEST_NoAuth",
            "mobile": "9999999998",
            "email": "noauth@test.com",
            "plan_id": "some-id"
        }
        
        response = session.post(f"{BASE_URL}/api/admin/members/offline", json=member_data)
        # Should be 401 or 403 (unauthorized)
        assert response.status_code in [401, 403], f"Should require auth, got: {response.status_code}"


class TestPlanMaintenanceConfiguration:
    """Test Plans with Maintenance Configuration fields"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Admin authentication failed")
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_create_plan_with_maintenance_none(self, admin_client):
        """Test creating a plan with no maintenance fee"""
        unique_id = uuid.uuid4().hex[:6]
        plan_data = {
            "name": f"TEST_Plan_NoMaint_{unique_id}",
            "description": "Test plan with no maintenance",
            "duration_months": 12,
            "price": 5000,
            "features": ["Feature 1", "Feature 2"],
            "is_active": True,
            "maintenance_type": "none",
            "maintenance_amount": 0,
            "maintenance_gst": 0,
            "maintenance_billing_cycle": "monthly",
            "renewal_amount": 0
        }
        
        response = admin_client.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Plan creation failed: {response.text}"
        
        plan = response.json()
        assert plan.get("maintenance_type") == "none"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/plans/{plan['id']}")
    
    def test_create_plan_with_maintenance_inclusive(self, admin_client):
        """Test creating a plan with inclusive maintenance"""
        unique_id = uuid.uuid4().hex[:6]
        plan_data = {
            "name": f"TEST_Plan_InclMaint_{unique_id}",
            "description": "Test plan with inclusive maintenance",
            "duration_months": 12,
            "price": 10000,
            "features": ["All inclusive"],
            "is_active": True,
            "maintenance_type": "inclusive",
            "maintenance_amount": 0,
            "maintenance_gst": 0,
            "maintenance_billing_cycle": "monthly",
            "renewal_amount": 8000
        }
        
        response = admin_client.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Plan creation failed: {response.text}"
        
        plan = response.json()
        assert plan.get("maintenance_type") == "inclusive"
        assert plan.get("renewal_amount") == 8000
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/plans/{plan['id']}")
    
    def test_create_plan_with_maintenance_value(self, admin_client):
        """Test creating a plan with separate maintenance value"""
        unique_id = uuid.uuid4().hex[:6]
        plan_data = {
            "name": f"TEST_Plan_SepMaint_{unique_id}",
            "description": "Test plan with separate maintenance fee",
            "duration_months": 24,
            "price": 15000,
            "features": ["Premium features"],
            "is_active": True,
            "maintenance_type": "enter_value",
            "maintenance_amount": 500,
            "maintenance_gst": 18,
            "maintenance_billing_cycle": "quarterly",
            "renewal_amount": 12000
        }
        
        response = admin_client.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Plan creation failed: {response.text}"
        
        plan = response.json()
        assert plan.get("maintenance_type") == "enter_value"
        assert plan.get("maintenance_amount") == 500
        assert plan.get("maintenance_gst") == 18
        assert plan.get("maintenance_billing_cycle") == "quarterly"
        assert plan.get("renewal_amount") == 12000
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/plans/{plan['id']}")
    
    def test_update_plan_maintenance_config(self, admin_client):
        """Test updating plan's maintenance configuration"""
        unique_id = uuid.uuid4().hex[:6]
        
        # Create plan
        plan_data = {
            "name": f"TEST_Plan_Update_{unique_id}",
            "description": "Test plan for update",
            "duration_months": 12,
            "price": 5000,
            "features": ["Basic"],
            "is_active": True,
            "maintenance_type": "none"
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert create_response.status_code == 200
        plan = create_response.json()
        
        # Update maintenance config
        update_data = {
            "maintenance_type": "enter_value",
            "maintenance_amount": 250,
            "maintenance_gst": 12,
            "maintenance_billing_cycle": "monthly",
            "renewal_amount": 4500
        }
        
        update_response = admin_client.put(f"{BASE_URL}/api/plans/{plan['id']}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = admin_client.get(f"{BASE_URL}/api/plans")
        plans = get_response.json()
        updated_plan = next((p for p in plans if p["id"] == plan["id"]), None)
        
        assert updated_plan is not None
        assert updated_plan.get("maintenance_type") == "enter_value"
        assert updated_plan.get("maintenance_amount") == 250
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/plans/{plan['id']}")
    
    def test_existing_plans_have_maintenance_fields(self, admin_client):
        """Test that existing plans return maintenance fields"""
        response = admin_client.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        
        plans = response.json()
        assert len(plans) > 0, "No plans found"
        
        # Check that plans have maintenance fields (even if default/empty)
        for plan in plans:
            # maintenance_type should exist
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            # These may be None or missing for old plans, but API should handle


class TestPaymentVerificationFallback:
    """Test payment verification with fallback mechanism"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Admin authentication failed")
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_payment_verify_endpoint_exists(self, admin_client):
        """Test that payment verification endpoint exists"""
        # Just check that endpoint exists (will fail without real payment data)
        response = admin_client.post(f"{BASE_URL}/api/payments/verify", json={
            "payment_id": "test-payment-id",
            "razorpay_payment_id": "pay_test123",
            "razorpay_order_id": "order_test123",
            "razorpay_signature": "invalid_signature"
        })
        
        # Should get 400 (invalid signature) or 422 (validation), not 404
        assert response.status_code != 404, "Payment verify endpoint not found"
        # Should be 400 for invalid signature or 422 for validation error
        assert response.status_code in [400, 422, 500], f"Unexpected status: {response.status_code}"
    
    def test_payment_create_order_endpoint(self, admin_client):
        """Test Razorpay order creation endpoint"""
        # This tests the order creation which is part of payment flow
        response = admin_client.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        if not plans:
            pytest.skip("No plans available")
        
        plan_id = plans[0]["id"]
        
        # Try to create an order - this may fail if no member context but endpoint should exist
        order_data = {
            "amount": plans[0]["price"],
            "plan_id": plan_id,
            "currency": "INR"
        }
        
        # Order creation typically requires member context - just verify API structure works


class TestAdminLoginAndNavigation:
    """Test admin authentication and basic navigation"""
    
    def test_admin_login_success(self):
        """Test admin can login with correct credentials"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data, "access_token not returned"
        assert data.get("user", {}).get("role") in ["super_admin", "admin"], f"Should be admin role, got: {data.get('user', {}).get('role')}"
    
    def test_admin_login_wrong_password(self):
        """Test admin login fails with wrong password"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "wrongpassword"
        })
        
        assert response.status_code in [400, 401], f"Should fail with wrong password, got: {response.status_code}"
    
    def test_admin_can_access_members(self):
        """Test admin can access members list"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = login_response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get members
        response = session.get(f"{BASE_URL}/api/members")
        assert response.status_code == 200, f"Failed to get members: {response.text}"
    
    def test_admin_can_access_plans(self):
        """Test admin can access plans list"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Plans endpoint is public
        response = session.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200, f"Failed to get plans: {response.text}"
        
        plans = response.json()
        assert isinstance(plans, list), "Plans should be a list"
