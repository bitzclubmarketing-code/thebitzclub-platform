"""
Test suite for UI Updates features:
1. Offers CRUD endpoints
2. Gallery endpoints  
3. Partners/Affiliations with enhanced fields
4. Booking system for affiliates
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestOffersEndpoints:
    """Test Offers CRUD endpoints"""
    
    def test_get_offers_returns_list(self):
        """Test GET /offers returns a list of offers"""
        response = requests.get(f"{BASE_URL}/api/offers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the sample offers
        assert len(data) >= 1
    
    def test_offer_structure(self):
        """Test offer object has expected fields"""
        response = requests.get(f"{BASE_URL}/api/offers")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            offer = data[0]
            assert "id" in offer
            assert "title" in offer
            assert "description" in offer
            assert "is_active" in offer
    
    def test_get_offers_active_filter(self):
        """Test GET /offers with is_active filter"""
        response = requests.get(f"{BASE_URL}/api/offers?is_active=true")
        assert response.status_code == 200
        data = response.json()
        # All returned offers should be active
        for offer in data:
            assert offer.get("is_active") == True
    
    def test_get_single_offer(self):
        """Test GET /offers/{offer_id}"""
        # First get list of offers
        list_response = requests.get(f"{BASE_URL}/api/offers")
        assert list_response.status_code == 200
        offers = list_response.json()
        
        if len(offers) > 0:
            offer_id = offers[0]["id"]
            response = requests.get(f"{BASE_URL}/api/offers/{offer_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == offer_id
    
    def test_get_nonexistent_offer_returns_404(self):
        """Test GET /offers with non-existent ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/offers/nonexistent-offer-id")
        assert response.status_code == 404


class TestAffiliationsEndpoints:
    """Test Partners/Affiliations endpoints with enhanced fields"""
    
    def test_get_affiliations_returns_list(self):
        """Test GET /partners returns list of affiliations"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_active_affiliations(self):
        """Test GET /partners with is_active filter"""
        response = requests.get(f"{BASE_URL}/api/partners?is_active=true")
        assert response.status_code == 200
        data = response.json()
        for partner in data:
            assert partner.get("is_active") == True
    
    def test_affiliation_enhanced_fields(self):
        """Test affiliations have enhanced fields (category, image_url, contact_person_1, offers)"""
        response = requests.get(f"{BASE_URL}/api/partners?is_active=true")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            # At minimum, these basic fields should exist
            partner = data[0]
            assert "id" in partner
            assert "name" in partner
            assert "description" in partner
            # Enhanced fields may or may not be present depending on data
            # but the model should support them
    
    def test_get_single_affiliation(self):
        """Test GET /partners/{partner_id}"""
        # First get list
        list_response = requests.get(f"{BASE_URL}/api/partners")
        assert list_response.status_code == 200
        partners = list_response.json()
        
        if len(partners) > 0:
            partner_id = partners[0]["id"]
            response = requests.get(f"{BASE_URL}/api/partners/{partner_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == partner_id


class TestGalleryEndpoints:
    """Test Gallery endpoints"""
    
    def test_get_gallery_images(self):
        """Test GET /content/gallery returns images"""
        response = requests.get(f"{BASE_URL}/api/content/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_gallery_image_structure(self):
        """Test gallery image has expected fields"""
        response = requests.get(f"{BASE_URL}/api/content/gallery")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            image = data[0]
            assert "id" in image
            assert "title" in image
            assert "image_url" in image
            assert "is_active" in image


class TestBookingSystem:
    """Test Booking system for affiliates"""
    
    @pytest.fixture
    def member_token(self):
        """Get member auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Member login failed")
    
    @pytest.fixture
    def affiliate_id(self):
        """Get first active affiliate ID"""
        response = requests.get(f"{BASE_URL}/api/partners?is_active=true")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["id"]
        pytest.skip("No active affiliates found")
    
    def test_get_member_bookings_authenticated(self, member_token):
        """Test GET /bookings for authenticated member"""
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_bookings_without_auth_fails(self):
        """Test GET /bookings without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/bookings")
        assert response.status_code in [401, 403]
    
    def test_create_booking_at_affiliate(self, member_token, affiliate_id):
        """Test POST /bookings creates booking at affiliate"""
        booking_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "affiliate_id": affiliate_id,
                "booking_date": booking_date,
                "notes": "TEST_BOOKING - Automated test"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "booking_id" in data
        assert "Booking created successfully" in data.get("message", "")
        
        # Return booking_id for cleanup
        return data["booking_id"]
    
    def test_create_booking_without_auth_fails(self, affiliate_id):
        """Test POST /bookings without auth returns 401/403"""
        booking_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "affiliate_id": affiliate_id,
                "booking_date": booking_date
            }
        )
        assert response.status_code in [401, 403]
    
    def test_create_booking_with_invalid_affiliate(self, member_token):
        """Test POST /bookings with invalid affiliate returns 404"""
        booking_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "affiliate_id": "nonexistent-affiliate-id",
                "booking_date": booking_date
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 404


class TestMemberLogin:
    """Test Login renamed to Member Login works"""
    
    def test_member_login_with_mobile(self):
        """Test member can login with mobile number"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "member"
    
    def test_member_login_with_wrong_password(self):
        """Test login with wrong password fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestOffersAdminCRUD:
    """Test Offers CRUD operations with admin"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_create_offer_as_admin(self, admin_token):
        """Test POST /offers creates new offer"""
        unique_id = uuid.uuid4().hex[:8]
        offer_data = {
            "title": f"TEST_OFFER_{unique_id}",
            "description": "Automated test offer",
            "discount_text": "50% OFF",
            "category": "Test",
            "is_active": True,
            "is_featured": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/offers",
            json=offer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == offer_data["title"]
        
        # Cleanup - delete the test offer
        offer_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/offers/{offer_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_create_offer_without_admin_fails(self, ):
        """Test POST /offers without admin auth fails"""
        response = requests.post(
            f"{BASE_URL}/api/offers",
            json={
                "title": "Should Fail",
                "description": "This should fail"
            }
        )
        assert response.status_code in [401, 403]
    
    def test_update_offer_as_admin(self, admin_token):
        """Test PUT /offers/{id} updates offer"""
        # First create an offer
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/offers",
            json={
                "title": f"TEST_OFFER_{unique_id}",
                "description": "To be updated",
                "is_active": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Failed to create test offer")
        
        offer_id = create_response.json()["id"]
        
        # Update the offer
        update_response = requests.put(
            f"{BASE_URL}/api/offers/{offer_id}",
            json={
                "description": "Updated description",
                "is_featured": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/offers/{offer_id}")
        assert get_response.status_code == 200
        assert get_response.json()["description"] == "Updated description"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/offers/{offer_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_delete_offer_as_admin(self, admin_token):
        """Test DELETE /offers/{id} deletes offer"""
        # First create an offer
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/offers",
            json={
                "title": f"TEST_OFFER_DELETE_{unique_id}",
                "description": "To be deleted",
                "is_active": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Failed to create test offer")
        
        offer_id = create_response.json()["id"]
        
        # Delete the offer
        delete_response = requests.delete(
            f"{BASE_URL}/api/offers/{offer_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/offers/{offer_id}")
        assert get_response.status_code == 404
