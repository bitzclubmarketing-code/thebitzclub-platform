import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMarketingLeadStep1:
    """Test marketing lead capture (Step 1)"""
    
    def test_create_marketing_lead_success(self):
        """Test successful lead capture with all fields"""
        unique_mobile = f"9{str(uuid.uuid4().int)[:9]}"  # Unique 10-digit mobile
        
        response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Test User {unique_mobile}",
            "mobile": unique_mobile,
            "email": f"test_{unique_mobile}@example.com",
            "referral_code": "REF001",
            "source": "marketing_landing"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "lead_id" in data
        assert data["name"] == f"Test User {unique_mobile}"
        assert data["mobile"] == unique_mobile
        assert "message" in data
    
    def test_create_marketing_lead_minimal(self):
        """Test lead capture with only required fields (name, mobile)"""
        unique_mobile = f"8{str(uuid.uuid4().int)[:9]}"
        
        response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Minimal User {unique_mobile}",
            "mobile": unique_mobile,
            "source": "marketing_landing"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "lead_id" in data
        assert data["mobile"] == unique_mobile
    
    def test_create_marketing_lead_duplicate_mobile_returns_existing(self):
        """Test that duplicate mobile returns existing lead instead of error"""
        unique_mobile = f"7{str(uuid.uuid4().int)[:9]}"
        
        # Create first lead
        response1 = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": "First User",
            "mobile": unique_mobile,
            "source": "marketing_landing"
        })
        assert response1.status_code == 200
        first_lead_id = response1.json()["lead_id"]
        
        # Try to create lead with same mobile
        response2 = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": "Second User",
            "mobile": unique_mobile,
            "source": "marketing_landing"
        })
        
        # Should return existing lead, not error
        assert response2.status_code == 200
        data = response2.json()
        assert data["lead_id"] == first_lead_id
        assert "Lead already exists" in data.get("message", "")
    
    def test_create_marketing_lead_registered_mobile_fails(self):
        """Test that already registered mobile number fails"""
        # Using admin mobile which should be registered
        response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": "Test Admin",
            "mobile": "9999999999",  # Admin mobile
            "source": "marketing_landing"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
    
    def test_create_marketing_lead_with_referral_code(self):
        """Test lead capture with referral code"""
        unique_mobile = f"6{str(uuid.uuid4().int)[:9]}"
        
        response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Referral User {unique_mobile}",
            "mobile": unique_mobile,
            "referral_code": "BITZ-E001",  # Employee referral code
            "source": "marketing_landing"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data


class TestMarketingLeadStep2:
    """Test marketing lead step 2 (plan selection and payment)"""
    
    @pytest.fixture
    def lead_id(self):
        """Create a fresh lead for step 2 tests"""
        unique_mobile = f"5{str(uuid.uuid4().int)[:9]}"
        response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Step2 Test User {unique_mobile}",
            "mobile": unique_mobile,
            "source": "marketing_landing"
        })
        assert response.status_code == 200
        return response.json()["lead_id"]
    
    @pytest.fixture
    def plan_id(self):
        """Get a valid plan ID"""
        response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) > 0
        return plans[0]["id"]
    
    def test_marketing_lead_step2_success(self, lead_id, plan_id):
        """Test step 2 with valid lead and plan"""
        response = requests.post(f"{BASE_URL}/api/marketing/lead/{lead_id}/step2", json={
            "lead_id": lead_id,
            "address": "123 Test Street",
            "city": "Test City",
            "pincode": "123456",
            "date_of_birth": "1990-01-01",
            "plan_id": plan_id,
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return Razorpay order details
        assert "order_id" in data
        assert data["order_id"].startswith("order_")  # Razorpay order ID format
        assert "amount" in data
        assert "currency" in data
        assert "razorpay_key" in data
        assert "name" in data
        assert "mobile" in data
    
    def test_marketing_lead_step2_invalid_lead(self, plan_id):
        """Test step 2 with non-existent lead"""
        response = requests.post(f"{BASE_URL}/api/marketing/lead/invalid-lead-id/step2", json={
            "lead_id": "invalid-lead-id",
            "plan_id": plan_id,
            "password": "testpass123"
        })
        
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
    
    def test_marketing_lead_step2_invalid_plan(self, lead_id):
        """Test step 2 with non-existent plan"""
        response = requests.post(f"{BASE_URL}/api/marketing/lead/{lead_id}/step2", json={
            "lead_id": lead_id,
            "plan_id": "invalid-plan-id",
            "password": "testpass123"
        })
        
        assert response.status_code == 404
        assert "plan" in response.json().get("detail", "").lower()
    
    def test_marketing_lead_step2_minimal_fields(self, lead_id, plan_id):
        """Test step 2 with only required fields"""
        response = requests.post(f"{BASE_URL}/api/marketing/lead/{lead_id}/step2", json={
            "lead_id": lead_id,
            "plan_id": plan_id,
            "password": "minpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data


class TestMarketingEnquiry:
    """Test marketing enquiry/chat submission"""
    
    def test_create_enquiry_success(self):
        """Test successful enquiry submission"""
        unique_mobile = f"4{str(uuid.uuid4().int)[:9]}"
        
        response = requests.post(f"{BASE_URL}/api/marketing/enquiry", json={
            "name": f"Enquiry User {unique_mobile}",
            "mobile": unique_mobile,
            "email": f"enquiry_{unique_mobile}@example.com",
            "message": "I want to know more about BITZ Club membership benefits.",
            "source": "marketing_landing"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "enquiry_id" in data or "id" in data
        assert "message" in data
    
    def test_create_enquiry_minimal(self):
        """Test enquiry with required fields only"""
        unique_mobile = f"3{str(uuid.uuid4().int)[:9]}"
        
        response = requests.post(f"{BASE_URL}/api/marketing/enquiry", json={
            "name": f"Minimal Enquiry {unique_mobile}",
            "mobile": unique_mobile,
            "message": "Quick question about pricing",
            "source": "marketing_landing"
        })
        
        assert response.status_code == 200
    
    def test_create_enquiry_missing_message_fails(self):
        """Test enquiry without message fails validation"""
        response = requests.post(f"{BASE_URL}/api/marketing/enquiry", json={
            "name": "Test User",
            "mobile": "1234567890",
            "source": "marketing_landing"
        })
        
        assert response.status_code == 422  # Validation error


class TestMarketingLeadsAdminEndpoint:
    """Test admin endpoint for marketing leads"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_get_marketing_leads_authorized(self, admin_token):
        """Test fetching marketing leads with admin token"""
        response = requests.get(
            f"{BASE_URL}/api/marketing/leads",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert isinstance(data["leads"], list)
    
    def test_get_marketing_leads_with_pagination(self, admin_token):
        """Test marketing leads pagination"""
        response = requests.get(
            f"{BASE_URL}/api/marketing/leads?page=1&limit=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["limit"] == 5
        assert len(data["leads"]) <= 5
    
    def test_get_marketing_leads_with_status_filter(self, admin_token):
        """Test marketing leads filtering by status"""
        response = requests.get(
            f"{BASE_URL}/api/marketing/leads?status=step1_complete",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned leads should have the filtered status
        for lead in data["leads"]:
            assert lead["status"] == "step1_complete"
    
    def test_get_marketing_leads_unauthorized(self):
        """Test fetching marketing leads without auth fails"""
        response = requests.get(f"{BASE_URL}/api/marketing/leads")
        
        assert response.status_code in [401, 403]


class TestEnquiriesAdminEndpoint:
    """Test admin endpoint for enquiries"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_get_enquiries_authorized(self, admin_token):
        """Test fetching enquiries with admin token"""
        response = requests.get(
            f"{BASE_URL}/api/enquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "enquiries" in data
        assert "total" in data
        assert isinstance(data["enquiries"], list)
    
    def test_get_enquiries_with_pagination(self, admin_token):
        """Test enquiries pagination"""
        response = requests.get(
            f"{BASE_URL}/api/enquiries?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["limit"] == 10
    
    def test_get_enquiries_unauthorized(self):
        """Test fetching enquiries without auth fails"""
        response = requests.get(f"{BASE_URL}/api/enquiries")
        
        assert response.status_code in [401, 403]


class TestLeadsInRegularEndpoint:
    """Test that marketing leads also appear in regular leads endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_marketing_lead_appears_in_leads(self, admin_token):
        """Test that a marketing lead is also added to regular leads"""
        unique_mobile = f"2{str(uuid.uuid4().int)[:9]}"
        
        # Create marketing lead
        create_response = requests.post(f"{BASE_URL}/api/marketing/lead", json={
            "name": f"Cross-check User {unique_mobile}",
            "mobile": unique_mobile,
            "source": "marketing_landing"
        })
        assert create_response.status_code == 200
        
        # Check in regular leads
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert leads_response.status_code == 200
        
        leads = leads_response.json()["leads"]
        # Find our lead by mobile
        found = any(lead["mobile"] == unique_mobile for lead in leads)
        assert found, f"Marketing lead with mobile {unique_mobile} not found in regular leads"
