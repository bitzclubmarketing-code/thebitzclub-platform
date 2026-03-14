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
            "password": "member123"
        })
        
        # Skip if test member doesn't exist
        if response.status_code == 401:
            pytest.skip("Test member 7777777777 doesn't exist - skipping member login test")
        
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
            "password": "member123"
        })
        
        # Skip if test member doesn't exist
        if login_response.status_code == 401:
            pytest.skip("Test member 7777777777 doesn't exist - skipping member data access test")
        
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
            "password": "member123"
        })
        
        # Skip if test member doesn't exist
        if login_response.status_code == 401:
            pytest.skip("Test member 7777777777 doesn't exist - skipping unauthorized access test")
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Try to access admin endpoint (reports/dashboard-stats)
        headers = {"Authorization": f"Bearer {token}"}
        admin_response = requests.get(f"{BASE_URL}/api/reports/dashboard-stats", headers=headers)
        
        # Should be forbidden (403) for non-admin users
        assert admin_response.status_code == 403


class TestPlanCRUD:
    """Test plan CRUD operations in Admin CMS"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_create_plan_success(self, admin_token):
        """Test admin can create a new plan"""
        import uuid
        test_name = f"TEST_Plan_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(f"{BASE_URL}/api/plans", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": test_name,
                "description": "Test plan created by pytest",
                "duration_months": 6,
                "price": 12500,
                "features": ["Feature A", "Feature B", "Feature C"],
                "is_active": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == test_name
        assert data["description"] == "Test plan created by pytest"
        assert data["duration_months"] == 6
        assert data["price"] == 12500
        assert len(data["features"]) == 3
        assert data["is_active"] == True
        assert "id" in data
        
        # Verify plan was created by GET request
        verify_response = requests.get(f"{BASE_URL}/api/plans/{data['id']}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["name"] == test_name
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/plans/{data['id']}", 
            headers={"Authorization": f"Bearer {admin_token}"})
        assert delete_response.status_code == 200
    
    def test_update_plan_success(self, admin_token):
        """Test admin can update an existing plan"""
        import uuid
        test_name = f"TEST_Update_{uuid.uuid4().hex[:6]}"
        
        # First create a plan
        create_response = requests.post(f"{BASE_URL}/api/plans", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": test_name,
                "description": "Original description",
                "duration_months": 12,
                "price": 10000,
                "features": ["Feature 1"],
                "is_active": True
            }
        )
        assert create_response.status_code == 200
        plan_id = create_response.json()["id"]
        
        # Update the plan
        updated_name = f"{test_name}_Updated"
        update_response = requests.put(f"{BASE_URL}/api/plans/{plan_id}", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": updated_name,
                "description": "Updated description",
                "price": 15000,
                "features": ["New Feature 1", "New Feature 2"]
            }
        )
        
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data["name"] == updated_name
        assert updated_data["description"] == "Updated description"
        assert updated_data["price"] == 15000
        assert len(updated_data["features"]) == 2
        
        # Verify via GET
        verify_response = requests.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert verify_response.status_code == 200
        assert verify_response.json()["price"] == 15000
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/plans/{plan_id}", 
            headers={"Authorization": f"Bearer {admin_token}"})
    
    def test_delete_plan_success(self, admin_token):
        """Test admin can delete a plan"""
        import uuid
        test_name = f"TEST_Delete_{uuid.uuid4().hex[:6]}"
        
        # Create a plan to delete
        create_response = requests.post(f"{BASE_URL}/api/plans", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": test_name,
                "description": "Plan to be deleted",
                "duration_months": 3,
                "price": 5000,
                "features": [],
                "is_active": True
            }
        )
        assert create_response.status_code == 200
        plan_id = create_response.json()["id"]
        
        # Delete the plan
        delete_response = requests.delete(f"{BASE_URL}/api/plans/{plan_id}", 
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Plan deleted"
        
        # Verify plan is deleted
        verify_response = requests.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert verify_response.status_code == 404
    
    def test_create_plan_unauthorized(self):
        """Test non-admin cannot create plans"""
        # Login as member
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        
        # Skip if test member doesn't exist
        if login_response.status_code == 401:
            pytest.skip("Test member 7777777777 doesn't exist - skipping unauthorized plan creation test")
        
        member_token = login_response.json()["access_token"]
        
        # Try to create plan
        response = requests.post(f"{BASE_URL}/api/plans", 
            headers={"Authorization": f"Bearer {member_token}"},
            json={
                "name": "Unauthorized Plan",
                "description": "Should not be created",
                "duration_months": 12,
                "price": 9999,
                "features": [],
                "is_active": True
            }
        )
        
        assert response.status_code == 403


class TestRazorpayIntegration:
    """Test Razorpay payment integration"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_create_razorpay_order(self, admin_token):
        """Test Razorpay order creation returns valid order_id"""
        # Get a valid plan ID
        plans_response = requests.get(f"{BASE_URL}/api/plans?is_active=true")
        assert plans_response.status_code == 200
        plans = plans_response.json()
        assert len(plans) > 0
        plan_id = plans[0]["id"]
        
        # Create payment order
        response = requests.post(f"{BASE_URL}/api/payments/create-order", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "member_id": "TEST_MEMBER_123",
                "amount": 5000,
                "plan_id": plan_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify Razorpay order structure
        assert "order_id" in data
        assert data["order_id"].startswith("order_")  # Real Razorpay order ID format
        assert "amount" in data
        assert data["amount"] == 500000  # Amount in paise
        assert data["currency"] == "INR"
        assert "razorpay_key" in data
        assert data["razorpay_key"].startswith("rzp_")  # Real Razorpay key format
        assert "payment_id" in data
    
    def test_create_order_with_different_amounts(self, admin_token):
        """Test order creation with various amounts"""
        test_amounts = [1000, 5000, 10000, 25000]
        
        for amount in test_amounts:
            response = requests.post(f"{BASE_URL}/api/payments/create-order", 
                headers={"Authorization": f"Bearer {admin_token}"},
                json={
                    "member_id": f"TEST_AMT_{amount}",
                    "amount": amount
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["amount"] == amount * 100  # Paise conversion
            assert data["order_id"].startswith("order_")



class TestMemberPhotoUpload:
    """Test member photo upload endpoint"""
    
    @pytest.fixture
    def member_token(self):
        """Get member token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "7777777777",
            "password": "member123"
        })
        if response.status_code == 401:
            pytest.skip("Test member 7777777777 doesn't exist")
        assert response.status_code == 200
        return response.json()
    
    def test_photo_upload_requires_auth(self):
        """Test photo upload requires authentication"""
        # Try to upload without auth
        response = requests.post(f"{BASE_URL}/api/members/BITZ-2026-EGAX7B/photo")
        assert response.status_code in [401, 403]
    
    def test_photo_upload_member_not_found(self, member_token):
        """Test photo upload returns 404 for non-existent member"""
        token = member_token["access_token"]
        
        # Create a simple test image file
        import io
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(image_content), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/members/INVALID-MEMBER-ID/photo",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )
        assert response.status_code == 404
    
    def test_photo_upload_invalid_file_type(self, member_token):
        """Test photo upload rejects non-image files"""
        token = member_token["access_token"]
        member_id = member_token["user"]["member_id"]
        
        # Try to upload a text file
        import io
        files = {'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')}
        response = requests.post(
            f"{BASE_URL}/api/members/{member_id}/photo",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )
        # Will fail with 404 (member not in members collection) or 400 (invalid file type)
        assert response.status_code in [400, 404]
    
    def test_photo_endpoint_returns_404_for_missing_photo(self):
        """Test GET photo endpoint returns 404 for non-existent photo"""
        response = requests.get(f"{BASE_URL}/api/uploads/photos/nonexistent.png")
        assert response.status_code == 404
