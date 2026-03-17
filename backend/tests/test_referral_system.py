"""
Tests for the BITZ Club Referral System APIs

Tests:
1. Referral code validation endpoint (GET /api/referrals/validate)
2. Admin referrals dashboard endpoint (GET /api/admin/referrals)
3. Member referral stats endpoint (GET /api/members/{member_id}/referral-stats)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": "9999999999",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Headers with admin authentication"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestReferralValidation:
    """Tests for GET /api/referrals/validate endpoint"""
    
    def test_validate_valid_member_referral_code(self):
        """Test validation of a valid member referral code (member_id format)"""
        # Using the test referral code provided: 2607600015
        response = requests.get(f"{BASE_URL}/api/referrals/validate", params={
            "referral_code": "2607600015"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") is True
        assert data.get("type") == "member"
        assert "referrer_name" in data
        assert "message" in data
        assert "valid" in data["message"].lower()
    
    def test_validate_invalid_referral_code(self):
        """Test validation returns false for invalid referral code"""
        response = requests.get(f"{BASE_URL}/api/referrals/validate", params={
            "referral_code": "INVALID_CODE_12345"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") is False
        assert data.get("type") is None
        assert data.get("referrer_name") is None
        assert "invalid" in data.get("message", "").lower()
    
    def test_validate_employee_referral_code_format(self):
        """Test validation of employee referral code format (BITZ-E001)"""
        # Using the test employee code provided
        response = requests.get(f"{BASE_URL}/api/referrals/validate", params={
            "referral_code": "BITZ-E001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") is True
        assert data.get("type") == "employee"
        assert "message" in data
    
    def test_validate_associate_referral_code_format(self):
        """Test validation of associate referral code format (BITZ-A001)"""
        response = requests.get(f"{BASE_URL}/api/referrals/validate", params={
            "referral_code": "BITZ-A001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") is True
        assert data.get("type") == "associate"
        assert "message" in data
    
    def test_validate_missing_referral_code_param(self):
        """Test that missing referral_code parameter returns error"""
        response = requests.get(f"{BASE_URL}/api/referrals/validate")
        
        # Should return 422 for missing required parameter
        assert response.status_code == 422
    
    def test_validate_empty_referral_code(self):
        """Test validation with empty referral code"""
        response = requests.get(f"{BASE_URL}/api/referrals/validate", params={
            "referral_code": ""
        })
        
        # Empty string should be rejected
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert data.get("valid") is False


class TestAdminReferralsDashboard:
    """Tests for GET /api/admin/referrals endpoint"""
    
    def test_admin_referrals_requires_auth(self):
        """Test that admin referrals endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals")
        
        assert response.status_code in [401, 403]
    
    def test_admin_referrals_with_valid_auth(self, admin_headers):
        """Test admin referrals dashboard with valid authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "referrals" in data
        assert "summary" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        # Verify summary structure
        summary = data.get("summary", {})
        assert "total_referrers" in summary
        assert "total_referred_members" in summary
        assert "by_type" in summary
        assert "employee" in summary.get("by_type", {})
        assert "associate" in summary.get("by_type", {})
        assert "member" in summary.get("by_type", {})
    
    def test_admin_referrals_pagination(self, admin_headers):
        """Test pagination parameters on admin referrals endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers, params={
            "page": 1,
            "limit": 5
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("page") == 1
        assert data.get("limit") == 5
    
    def test_admin_referrals_filter_by_type_employee(self, admin_headers):
        """Test filtering referrals by type=employee"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers, params={
            "referral_type": "employee"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # All referrals in response should be employee type
        for referral in data.get("referrals", []):
            assert referral.get("referral_type") == "employee"
    
    def test_admin_referrals_filter_by_type_member(self, admin_headers):
        """Test filtering referrals by type=member"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers, params={
            "referral_type": "member"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # All referrals in response should be member type
        for referral in data.get("referrals", []):
            assert referral.get("referral_type") == "member"
    
    def test_admin_referrals_search(self, admin_headers):
        """Test search functionality on admin referrals"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers, params={
            "search": "2607600015"
        })
        
        assert response.status_code == 200
        data = response.json()
        # Response should be valid structure even if no results
        assert "referrals" in data


class TestMemberReferralStats:
    """Tests for GET /api/members/{member_id}/referral-stats endpoint"""
    
    def test_member_referral_stats_requires_auth(self):
        """Test that member referral stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/members/2607600015/referral-stats")
        
        assert response.status_code in [401, 403]
    
    def test_member_referral_stats_with_valid_member(self, admin_headers):
        """Test getting referral stats for a valid member"""
        response = requests.get(
            f"{BASE_URL}/api/members/2607600015/referral-stats",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "referral_code" in data
        assert "referral_link" in data
        assert "total_referred" in data
        assert "active_referrals" in data
        assert "pending_referrals" in data
        assert "referred_members" in data
        assert "rewards" in data
        
        # Verify referral link format
        assert "join?ref=" in data.get("referral_link", "")
        
        # Verify rewards structure
        rewards = data.get("rewards", {})
        assert "total" in rewards
        assert "pending" in rewards
        assert "claimed" in rewards
        assert "history" in rewards
    
    def test_member_referral_stats_nonexistent_member(self, admin_headers):
        """Test getting referral stats for nonexistent member returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/members/NONEXISTENT_MEMBER_ID/referral-stats",
            headers=admin_headers
        )
        
        assert response.status_code == 404
    
    def test_member_referral_stats_numeric_values(self, admin_headers):
        """Test that referral stats return numeric values"""
        response = requests.get(
            f"{BASE_URL}/api/members/2607600015/referral-stats",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All count fields should be integers
        assert isinstance(data.get("total_referred"), int)
        assert isinstance(data.get("active_referrals"), int)
        assert isinstance(data.get("pending_referrals"), int)
        
        # referred_members should be a list
        assert isinstance(data.get("referred_members"), list)


class TestReferralRewardCreation:
    """Tests for POST /api/admin/referral-rewards endpoint"""
    
    def test_create_referral_reward_requires_auth(self):
        """Test that creating referral reward requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/referral-rewards", params={
            "referrer_member_id": "2607600015",
            "referred_member_id": "TEST123",
            "reward_amount": 100
        })
        
        assert response.status_code in [401, 403]
    
    def test_create_referral_reward_with_auth(self, admin_headers):
        """Test creating a referral reward with valid auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/referral-rewards",
            headers=admin_headers,
            params={
                "referrer_member_id": "2607600015",
                "referred_member_id": f"TEST_{uuid.uuid4().hex[:8]}",
                "reward_amount": 100,
                "reward_type": "cashback",
                "notes": "TEST: Automated test reward"
            }
        )
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 201, 404, 400]
        if response.status_code in [200, 201]:
            data = response.json()
            # API returns reward_id instead of id
            assert "reward_id" in data or "id" in data
            assert "message" in data or data.get("status") == "pending"


class TestReferralLinkGeneration:
    """Tests for referral link functionality"""
    
    def test_referral_link_in_member_stats(self, admin_headers):
        """Test that referral link is properly generated in member stats"""
        response = requests.get(
            f"{BASE_URL}/api/members/2607600015/referral-stats",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check referral link format
        referral_link = data.get("referral_link", "")
        assert "join?ref=" in referral_link
        assert "2607600015" in referral_link or data.get("referral_code") in referral_link


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
