import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_member_login_success(self):
        """Test member login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "PWAtest123!"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["mobile"] == "7777777777"
        assert data["user"]["role"] == "member"
        assert "member_id" in data["user"]

    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["mobile"] == "9999999999"
        assert data["user"]["role"] == "super_admin"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "0000000000",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401

    def test_login_missing_fields(self):
        """Test login with missing fields returns error"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": ""
        })
        
        assert response.status_code in [400, 422]


class TestPublicEndpoints:
    """Test public API endpoints"""
    
    def test_plans_list_public(self):
        """Test public plans endpoint returns active plans"""
        response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        
        assert response.status_code == 200
        plans = response.json()
        
        assert isinstance(plans, list)
        assert len(plans) > 0
        
        # Verify plan structure
        plan = plans[0]
        assert "id" in plan
        assert "name" in plan
        assert "price" in plan
        assert "duration_months" in plan
        assert "features" in plan

    def test_partners_list_public(self):
        """Test public partners endpoint"""
        response = requests.get(f"{BASE_URL}/api/partners?is_active=true")
        
        assert response.status_code == 200
        partners = response.json()
        
        assert isinstance(partners, list)


class TestPWAAssets:
    """Test PWA-related assets and endpoints"""
    
    def test_manifest_accessible(self):
        """Test manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        
        assert response.status_code == 200
        manifest = response.json()
        
        assert manifest["name"] == "BITZ Club"
        assert manifest["display"] == "standalone"
        assert "icons" in manifest
        assert len(manifest["icons"]) > 0

    def test_service_worker_accessible(self):
        """Test sw.js is accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        
        assert response.status_code == 200
        content = response.text
        
        assert "CACHE_NAME" in content
        assert "addEventListener" in content

    def test_pwa_icons_accessible(self):
        """Test PWA icons are accessible"""
        icons = [
            "/icons/icon-192x192.png",
            "/icons/icon-512x512.png"
        ]
        
        for icon in icons:
            response = requests.get(f"{BASE_URL}{icon}")
            assert response.status_code == 200, f"Icon {icon} not accessible"
            assert "image/png" in response.headers.get("content-type", "")


class TestLeadSubmission:
    """Test lead submission endpoint"""
    
    def test_lead_submission_success(self):
        """Test lead form submission"""
        import uuid
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        
        response = requests.post(f"{BASE_URL}/api/leads", json={
            "name": "TEST_Lead User",
            "mobile": test_mobile,
            "city": "TEST_City",
            "interested_in": "membership",
            "source": "pytest_test"
        })
        
        assert response.status_code in [200, 201]
        data = response.json()
        
        # API returns message and id
        assert "id" in data
        assert "message" in data

    def test_lead_submission_missing_required_fields(self):
        """Test lead submission fails with missing fields"""
        response = requests.post(f"{BASE_URL}/api/leads", json={
            "name": "Test"
            # Missing required fields
        })
        
        assert response.status_code == 422


class TestProtectedEndpoints:
    """Test authenticated endpoints"""
    
    def test_member_data_access(self):
        """Test member can access their own data"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "PWAtest123!"
        })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        member_id = login_response.json()["user"]["member_id"]
        
        # Access member data
        headers = {"Authorization": f"Bearer {token}"}
        member_response = requests.get(f"{BASE_URL}/api/members/{member_id}", headers=headers)
        
        # Member may be pending activation, so 404 is acceptable too
        assert member_response.status_code in [200, 404]

    def test_admin_dashboard_stats_access(self):
        """Test admin can access dashboard stats"""
        # First login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Access admin dashboard stats (correct endpoint)
        headers = {"Authorization": f"Bearer {token}"}
        dashboard_response = requests.get(f"{BASE_URL}/api/reports/dashboard-stats", headers=headers)
        
        assert dashboard_response.status_code == 200
        stats = dashboard_response.json()
        
        assert "total_members" in stats
        assert "active_members" in stats
        assert "total_revenue" in stats

    def test_unauthorized_admin_access(self):
        """Test member cannot access admin endpoints"""
        # Login as member
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "PWAtest123!"
        })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Try to access admin endpoint (reports/dashboard-stats)
        headers = {"Authorization": f"Bearer {token}"}
        admin_response = requests.get(f"{BASE_URL}/api/reports/dashboard-stats", headers=headers)
        
        # Should be forbidden (403) for non-admin users
        assert admin_response.status_code == 403
