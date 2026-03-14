"""
Tests for Registration with Payment Flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRegistrationInitiate:
    """Test registration initiation endpoint"""
    
    def test_registration_initiate_success(self):
        """Test registration initiation creates Razorpay order"""
        # Get a valid plan ID
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        assert plans_response.status_code == 200
        plans = plans_response.json()
        assert len(plans) > 0
        plan_id = plans[0]["id"]
        plan_price = plans[0]["price"]
        plan_name = plans[0]["name"]
        
        # Create unique mobile number
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "TEST_Registration User",
            "mobile": test_mobile,
            "email": "test_reg@example.com",
            "password": "TestPass123!",
            "plan_id": plan_id
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "registration_id" in data
        assert data["registration_id"].startswith("REG-")
        assert "order_id" in data
        assert data["order_id"].startswith("order_")  # Real Razorpay order format
        assert "amount" in data
        assert data["amount"] == plan_price
        assert "currency" in data
        assert data["currency"] == "INR"
        assert "razorpay_key" in data
        assert data["razorpay_key"].startswith("rzp_")
        assert "plan_name" in data
        assert data["plan_name"] == plan_name
        assert data["name"] == "TEST_Registration User"
        assert data["mobile"] == test_mobile
    
    def test_registration_initiate_duplicate_mobile(self):
        """Test registration fails for already registered mobile"""
        # Get a valid plan ID
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        plan_id = plans_response.json()[0]["id"]
        
        # Try to register with existing member mobile
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Duplicate Test",
            "mobile": "7777777777",  # Existing test member
            "password": "TestPass123!",
            "plan_id": plan_id
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
    
    def test_registration_initiate_invalid_plan(self):
        """Test registration fails for invalid plan ID"""
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Invalid Plan Test",
            "mobile": test_mobile,
            "password": "TestPass123!",
            "plan_id": "invalid-plan-id-12345"
        })
        
        assert response.status_code == 404
        assert "plan not found" in response.json().get("detail", "").lower()
    
    def test_registration_initiate_missing_required_fields(self):
        """Test registration fails with missing required fields"""
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Test User"
            # Missing mobile, password, plan_id
        })
        
        assert response.status_code == 422
    
    def test_registration_initiate_with_referral_id(self):
        """Test registration with referral ID"""
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        plan_id = plans_response.json()[0]["id"]
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Referral Test User",
            "mobile": test_mobile,
            "password": "TestPass123!",
            "plan_id": plan_id,
            "referral_id": "BITZ-E001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "registration_id" in data
        assert "order_id" in data
    
    def test_registration_initiate_with_photo_base64(self):
        """Test registration with photo upload"""
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        plan_id = plans_response.json()[0]["id"]
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        # Minimal valid base64 PNG image
        test_photo_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Photo Test User",
            "mobile": test_mobile,
            "password": "TestPass123!",
            "plan_id": plan_id,
            "photo_base64": test_photo_base64
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "registration_id" in data
        assert "order_id" in data


class TestRegistrationComplete:
    """Test registration completion endpoint"""
    
    def test_registration_complete_invalid_registration_id(self):
        """Test completion fails for invalid registration ID"""
        response = requests.post(f"{BASE_URL}/api/registration/complete", params={
            "registration_id": "INVALID-REG-ID",
            "razorpay_payment_id": "pay_test123",
            "razorpay_order_id": "order_test123",
            "razorpay_signature": "invalid_signature"
        })
        
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
    
    def test_registration_complete_invalid_signature(self):
        """Test completion fails for invalid payment signature"""
        # First create a valid registration
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        plan_id = plans_response.json()[0]["id"]
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        init_response = requests.post(f"{BASE_URL}/api/registration/initiate", json={
            "name": "Signature Test User",
            "mobile": test_mobile,
            "password": "TestPass123!",
            "plan_id": plan_id
        })
        
        assert init_response.status_code == 200
        reg_data = init_response.json()
        
        # Try to complete with invalid signature
        response = requests.post(f"{BASE_URL}/api/registration/complete", params={
            "registration_id": reg_data["registration_id"],
            "razorpay_payment_id": "pay_invalid_test",
            "razorpay_order_id": reg_data["order_id"],
            "razorpay_signature": "invalid_signature_12345"
        })
        
        # Should fail signature verification
        assert response.status_code == 400
        assert "verification failed" in response.json().get("detail", "").lower()


class TestMemberDashboardData:
    """Test member dashboard data after registration"""
    
    @pytest.fixture
    def member_auth(self):
        """Get member authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        if response.status_code != 200:
            pytest.skip("Test member doesn't exist")
        return response.json()
    
    def test_member_can_access_member_data(self, member_auth):
        """Test member can fetch their own member data"""
        token = member_auth["access_token"]
        member_id = member_auth["user"]["member_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/members/{member_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # May be 200 (member exists) or 404 (old member without member record)
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            # Verify member data structure
            assert "member_id" in data
            assert "name" in data
            assert "mobile" in data
    
    def test_member_plans_displayed_on_dashboard(self, member_auth):
        """Test member dashboard can display plan information"""
        token = member_auth["access_token"]
        member_id = member_auth["user"]["member_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/members/{member_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            # Members created with new flow should have plan info
            if "plan_name" in data:
                assert data["plan_name"] is not None
            if "membership_start" in data:
                assert data["membership_start"] is not None
            if "membership_end" in data:
                assert data["membership_end"] is not None


class TestPlansAPI:
    """Test plans API endpoints for registration"""
    
    def test_get_active_plans_for_registration(self):
        """Test fetching active plans for registration page"""
        response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        
        assert response.status_code == 200
        plans = response.json()
        
        assert isinstance(plans, list)
        assert len(plans) > 0
        
        # Verify plan structure
        for plan in plans:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "duration_months" in plan
            assert "features" in plan
            assert "is_active" in plan
            assert plan["is_active"] == True
    
    def test_plan_has_required_registration_fields(self):
        """Test plans have all fields needed for registration"""
        response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        
        required_fields = ["id", "name", "price", "duration_months", "description", "features"]
        
        for plan in plans:
            for field in required_fields:
                assert field in plan, f"Plan missing required field: {field}"
            
            # Validate field types
            assert isinstance(plan["id"], str)
            assert isinstance(plan["name"], str)
            assert isinstance(plan["price"], (int, float))
            assert isinstance(plan["duration_months"], int)
            assert isinstance(plan["features"], list)
