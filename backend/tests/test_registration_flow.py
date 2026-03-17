"""
CRITICAL Registration Flow Backend API Tests
Testing the complete end-to-end API flow for BITZ Club membership registration
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRegistrationFlowStep1:
    """Test Step 1: Lead capture (/api/marketing/lead)"""
    
    def test_create_lead_success(self, api_client):
        """Test successful lead creation with valid data"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Test User {timestamp}",
            "mobile": f"+9198{timestamp % 100000000:08d}",
            "email": f"test_{timestamp}@example.com",
            "country_code": "+91",
            "country": "India",
            "source": "pytest_test"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
        assert data["message"] == "Lead captured successfully"
        assert "name" in data
        assert "mobile" in data
    
    def test_create_lead_with_referral_code(self, api_client):
        """Test lead creation with referral code"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Referral Test {timestamp}",
            "mobile": f"+9197{timestamp % 100000000:08d}",
            "email": f"referral_{timestamp}@example.com",
            "referral_code": "BITZ-E001",
            "country_code": "+91",
            "country": "India",
            "source": "pytest_test"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
    
    def test_create_lead_without_email(self, api_client):
        """Test lead creation without email (email is optional in step 1)"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"No Email Test {timestamp}",
            "mobile": f"+9196{timestamp % 100000000:08d}",
            "country_code": "+91",
            "country": "India",
            "source": "pytest_test"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
    
    def test_create_lead_missing_name_fails(self, api_client):
        """Test that lead creation fails without name"""
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "mobile": "+919876543210",
            "country_code": "+91",
            "source": "pytest_test"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_create_lead_missing_mobile_fails(self, api_client):
        """Test that lead creation fails without mobile"""
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": "Test User",
            "country_code": "+91",
            "source": "pytest_test"
        })
        
        assert response.status_code == 422  # Validation error


class TestRegistrationFlowStep2:
    """Test Step 2: Complete profile and initiate payment (/api/marketing/lead/{lead_id}/step2)"""
    
    @pytest.fixture
    def lead_id(self, api_client):
        """Create a lead and return its ID"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Step2 Test {timestamp}",
            "mobile": f"+9195{timestamp % 100000000:08d}",
            "email": f"step2_{timestamp}@example.com",
            "country_code": "+91",
            "country": "India",
            "source": "pytest_test"
        })
        assert response.status_code == 200
        return response.json()["lead_id"]
    
    @pytest.fixture
    def plan_id(self, api_client):
        """Get a valid plan ID"""
        response = api_client.get(f"{BASE_URL}/api/plans?is_active=true")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) > 0
        return plans[0]["id"]
    
    def test_step2_initiates_razorpay_order(self, api_client, lead_id, plan_id):
        """Test Step 2 creates Razorpay order for payment"""
        response = api_client.post(f"{BASE_URL}/api/marketing/lead/{lead_id}/step2", json={
            "lead_id": lead_id,
            "plan_id": plan_id,
            "password": "SecurePass123!",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "pincode": "400001"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify Razorpay order creation
        assert "order_id" in data
        assert data["order_id"].startswith("order_")
        assert "razorpay_key" in data
        assert data["razorpay_key"].startswith("rzp_")
        assert "amount" in data
        assert data["amount"] > 0
        assert "plan_name" in data
    
    def test_step2_with_invalid_lead_fails(self, api_client, plan_id):
        """Test Step 2 fails with invalid lead ID"""
        fake_lead_id = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead/{fake_lead_id}/step2", json={
            "lead_id": fake_lead_id,
            "plan_id": plan_id,
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 404
    
    def test_step2_with_invalid_plan_fails(self, api_client, lead_id):
        """Test Step 2 fails with invalid plan ID"""
        fake_plan_id = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/marketing/lead/{lead_id}/step2", json={
            "lead_id": lead_id,
            "plan_id": fake_plan_id,
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 404


class TestLoginFlow:
    """Test login endpoints"""
    
    def test_member_login_with_mobile(self, api_client):
        """Test member login with mobile number"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "member"
        assert "member_id" in data["user"]
    
    def test_member_login_with_member_id(self, api_client):
        """Test member login with member ID"""
        # First get a member's ID by logging in with mobile
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        
        if login_response.status_code == 200:
            member_id = login_response.json()["user"]["member_id"]
            
            # Now try logging in with member_id
            response = api_client.post(f"{BASE_URL}/api/auth/login", json={
                "identifier": member_id,
                "password": "member123"
            })
            
            assert response.status_code == 200
            assert "access_token" in response.json()
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] in ["super_admin", "admin"]
    
    def test_invalid_credentials_fail(self, api_client):
        """Test login fails with wrong credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "0000000000",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json().get("detail", "")


class TestMemberEndpoints:
    """Test member-specific endpoints"""
    
    def test_get_member_profile(self, authenticated_member):
        """Test getting current member's info"""
        response = authenticated_member.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "mobile" in data
        assert "member_id" in data
    
    def test_get_member_card(self, authenticated_member):
        """Test getting member card with QR code"""
        # Get member ID first
        me_response = authenticated_member.get(f"{BASE_URL}/api/auth/me")
        member_id = me_response.json().get("member_id")
        
        response = authenticated_member.get(f"{BASE_URL}/api/members/{member_id}/card")
        
        assert response.status_code == 200
        data = response.json()
        assert "member_id" in data
        assert "name" in data
        assert "qr_code" in data
        assert data["qr_code"].startswith("data:image/png;base64,")
    
    def test_get_member_payments(self, authenticated_member):
        """Test getting member's payment history"""
        me_response = authenticated_member.get(f"{BASE_URL}/api/auth/me")
        member_id = me_response.json().get("member_id")
        
        response = authenticated_member.get(f"{BASE_URL}/api/members/{member_id}/payments")
        
        assert response.status_code == 200
        # Response is a list of payments (may be empty)
        assert isinstance(response.json(), list)


class TestPlansEndpoint:
    """Test membership plans endpoints"""
    
    def test_get_active_plans(self, api_client):
        """Test getting active membership plans"""
        response = api_client.get(f"{BASE_URL}/api/plans?is_active=true")
        
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
            assert plan["price"] > 0
    
    def test_plans_have_features(self, api_client):
        """Test that plans have features list"""
        response = api_client.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        
        for plan in plans:
            assert "features" in plan
            assert isinstance(plan["features"], list)


class TestPartnersEndpoint:
    """Test affiliations/partners endpoints"""
    
    def test_get_active_partners(self, api_client):
        """Test getting active partners/affiliations"""
        response = api_client.get(f"{BASE_URL}/api/partners?is_active=true")
        
        assert response.status_code == 200
        partners = response.json()
        assert isinstance(partners, list)
        
        # Verify partner structure if any exist
        for partner in partners[:5]:  # Check first 5
            assert "id" in partner
            assert "name" in partner


class TestBookingsEndpoint:
    """Test booking endpoints"""
    
    def test_get_member_bookings(self, authenticated_member):
        """Test getting member's bookings"""
        response = authenticated_member.get(f"{BASE_URL}/api/bookings")
        
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)


class TestDuplicateMobileHandling:
    """Test handling of already registered mobile numbers"""
    
    def test_duplicate_lead_handling(self, api_client):
        """Test that duplicate mobile in lead creation is handled"""
        # Use the test member's mobile number
        response = api_client.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": "Duplicate Test",
            "mobile": "+917777777777",  # Already registered
            "email": "duplicate@test.com",
            "country_code": "+91",
            "country": "India",
            "source": "pytest_test"
        })
        
        # Should still succeed for lead capture (lead != user)
        # Or return 400 if already converted - either is acceptable
        assert response.status_code in [200, 400]
