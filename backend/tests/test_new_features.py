"""
Test new backend features:
1. Family Members CRUD
2. Lead Assignment
3. Maintenance Fees with discount and tax
4. Telecaller Dashboard
5. Telecaller Member Access
6. General Report
7. Transaction Report
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestFamilyMembersCRUD:
    """Test Family Members CRUD operations"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture
    def test_member(self, admin_client):
        """Create a test member for family member tests"""
        unique_mobile = f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}"
        member_data = {
            "name": "TEST_FamilyTestMember",
            "mobile": unique_mobile,
            "email": f"test_family_{uuid.uuid4().hex[:8]}@test.com",
            "plan_id": self._get_plan_id(admin_client)
        }
        response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        assert response.status_code == 200
        member = response.json()
        yield member
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")
    
    def _get_plan_id(self, client):
        """Get first available plan ID"""
        response = client.get(f"{BASE_URL}/api/plans?is_active=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_add_family_member(self, admin_client, test_member):
        """Test adding a family member to a primary member"""
        family_data = {
            "member_id": test_member["member_id"],
            "name": "TEST_SpouseMember",
            "relationship": "spouse",
            "date_of_birth": "1990-05-15",
            "mobile": f"TEST{datetime.now().strftime('%S%f')[:10]}",
            "email": f"spouse_{uuid.uuid4().hex[:6]}@test.com"
        }
        
        response = admin_client.post(
            f"{BASE_URL}/api/members/{test_member['member_id']}/family",
            json=family_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "family_count" in data
        assert data["family_count"] >= 1
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/family/{data['id']}")
    
    def test_get_family_members(self, admin_client, test_member):
        """Test getting family members for a primary member"""
        # Add a family member first
        family_data = {
            "member_id": test_member["member_id"],
            "name": "TEST_ChildMember",
            "relationship": "child"
        }
        add_response = admin_client.post(
            f"{BASE_URL}/api/members/{test_member['member_id']}/family",
            json=family_data
        )
        family_id = add_response.json().get("id")
        
        # Get family members
        response = admin_client.get(f"{BASE_URL}/api/members/{test_member['member_id']}/family")
        
        assert response.status_code == 200
        data = response.json()
        assert "family_members" in data
        assert "count" in data
        assert data["count"] >= 1
        
        # Cleanup
        if family_id:
            admin_client.delete(f"{BASE_URL}/api/family/{family_id}")
    
    def test_update_family_member(self, admin_client, test_member):
        """Test updating a family member's details"""
        # Add a family member first
        family_data = {
            "member_id": test_member["member_id"],
            "name": "TEST_SiblingOriginal",
            "relationship": "sibling"
        }
        add_response = admin_client.post(
            f"{BASE_URL}/api/members/{test_member['member_id']}/family",
            json=family_data
        )
        family_id = add_response.json().get("id")
        
        # Update family member
        update_data = {
            "name": "TEST_SiblingUpdated",
            "relationship": "parent"
        }
        response = admin_client.put(f"{BASE_URL}/api/family/{family_id}", json=update_data)
        
        assert response.status_code == 200
        assert response.json().get("message") == "Family member updated successfully"
        
        # Verify update by getting family members
        get_response = admin_client.get(f"{BASE_URL}/api/members/{test_member['member_id']}/family")
        family_members = get_response.json().get("family_members", [])
        updated_member = next((f for f in family_members if f["id"] == family_id), None)
        assert updated_member is not None
        assert updated_member["name"] == "TEST_SiblingUpdated"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/family/{family_id}")
    
    def test_delete_family_member(self, admin_client, test_member):
        """Test soft deleting a family member"""
        # Add a family member first
        family_data = {
            "member_id": test_member["member_id"],
            "name": "TEST_ToDelete",
            "relationship": "child"
        }
        add_response = admin_client.post(
            f"{BASE_URL}/api/members/{test_member['member_id']}/family",
            json=family_data
        )
        family_id = add_response.json().get("id")
        
        # Delete family member
        response = admin_client.delete(f"{BASE_URL}/api/family/{family_id}")
        
        assert response.status_code == 200
        assert response.json().get("message") == "Family member removed successfully"
    
    def test_get_all_family_members(self, admin_client):
        """Test getting all family members with pagination"""
        response = admin_client.get(f"{BASE_URL}/api/family?page=1&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert "family_members" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data


class TestLeadAssignment:
    """Test Lead Assignment endpoints"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture
    def telecaller_client(self):
        """Get authenticated telecaller client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "8888888888",
            "password": "telecaller123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        user = response.json().get("user")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session, user["id"]
    
    @pytest.fixture
    def test_lead(self, admin_client):
        """Create a test lead for assignment tests"""
        lead_data = {
            "name": "TEST_LeadForAssignment",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "city": "TestCity",
            "interested_in": "membership",
            "source": "test"
        }
        response = admin_client.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        lead = response.json()
        yield lead
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/leads/{lead['id']}")
    
    def test_assign_leads_to_telecaller(self, admin_client, telecaller_client, test_lead):
        """Test assigning leads to a telecaller"""
        _, telecaller_id = telecaller_client
        
        assignment_data = {
            "lead_ids": [test_lead["id"]],
            "telecaller_id": telecaller_id
        }
        
        response = admin_client.post(f"{BASE_URL}/api/leads/assign", json=assignment_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "assigned_count" in data
        assert data["assigned_count"] == 1
    
    def test_get_leads_by_telecaller(self, admin_client, telecaller_client, test_lead):
        """Test getting leads assigned to a telecaller"""
        client, telecaller_id = telecaller_client
        
        # First assign the lead
        assignment_data = {
            "lead_ids": [test_lead["id"]],
            "telecaller_id": telecaller_id
        }
        admin_client.post(f"{BASE_URL}/api/leads/assign", json=assignment_data)
        
        # Get leads by telecaller (as admin)
        response = admin_client.get(f"{BASE_URL}/api/leads/by-telecaller?telecaller_id={telecaller_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "total" in data
        
        # Telecaller accessing their own leads
        response2 = client.get(f"{BASE_URL}/api/leads/by-telecaller")
        assert response2.status_code == 200
    
    def test_get_unassigned_leads(self, admin_client):
        """Test getting unassigned leads"""
        # Create an unassigned lead
        lead_data = {
            "name": "TEST_UnassignedLead",
            "mobile": f"TEST{datetime.now().strftime('%S%f')[:10]}",
            "city": "TestCity",
            "interested_in": "membership"
        }
        create_response = admin_client.post(f"{BASE_URL}/api/leads", json=lead_data)
        lead = create_response.json()
        
        # Get unassigned leads
        response = admin_client.get(f"{BASE_URL}/api/leads/unassigned")
        
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "total" in data
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/leads/{lead['id']}")


class TestMaintenanceFees:
    """Test Maintenance Fees with discount and tax"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture
    def test_member(self, admin_client):
        """Create a test member for maintenance fee tests"""
        unique_mobile = f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}"
        # Get plan ID
        plans = admin_client.get(f"{BASE_URL}/api/plans?is_active=true").json()
        plan_id = plans[0]["id"] if plans else None
        
        member_data = {
            "name": "TEST_MaintenanceMember",
            "mobile": unique_mobile,
            "email": f"test_maint_{uuid.uuid4().hex[:8]}@test.com",
            "plan_id": plan_id
        }
        response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        assert response.status_code == 200
        member = response.json()
        yield member
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")
    
    def test_create_maintenance_fee_with_discount_and_tax(self, admin_client, test_member):
        """Test creating maintenance fee with discount and tax"""
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        fee_data = {
            "member_id": test_member["member_id"],
            "amount": 1000,
            "fee_type": "monthly",
            "due_date": due_date,
            "discount_amount": 100,
            "discount_reason": "Early payment discount",
            "tax_rate": 5,  # 5% tax
            "notes": "TEST maintenance fee"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/maintenance-fees", json=fee_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "amount" in data
        # Final amount = (1000 - 100) * 1.05 = 945
        assert data["amount"] == 945.0
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/maintenance-fees/{data['id']}")
    
    def test_pay_maintenance_fee_creates_payment_record(self, admin_client, test_member):
        """Test paying maintenance fee creates payment record"""
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Create maintenance fee
        fee_data = {
            "member_id": test_member["member_id"],
            "amount": 500,
            "fee_type": "monthly",
            "due_date": due_date
        }
        create_response = admin_client.post(f"{BASE_URL}/api/maintenance-fees", json=fee_data)
        fee = create_response.json()
        
        # Pay the fee
        pay_response = admin_client.post(
            f"{BASE_URL}/api/maintenance-fees/{fee['id']}/pay",
            params={
                "payment_method": "cash",
                "transaction_id": f"TEST-TXN-{uuid.uuid4().hex[:8]}",
                "notes": "Test payment"
            }
        )
        
        assert pay_response.status_code == 200
        pay_data = pay_response.json()
        assert "payment_id" in pay_data
        
        # Verify payment appears in member's payment history
        payments_response = admin_client.get(f"{BASE_URL}/api/members/{test_member['member_id']}/payments")
        payments = payments_response.json()
        
        # Check maintenance payment exists
        maintenance_payments = [p for p in payments if p.get("payment_type") == "maintenance"]
        assert len(maintenance_payments) >= 1
    
    def test_get_maintenance_fees(self, admin_client, test_member):
        """Test getting maintenance fees with filters"""
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Create a maintenance fee
        fee_data = {
            "member_id": test_member["member_id"],
            "amount": 300,
            "fee_type": "quarterly",
            "due_date": due_date
        }
        create_response = admin_client.post(f"{BASE_URL}/api/maintenance-fees", json=fee_data)
        fee = create_response.json()
        
        # Get all maintenance fees
        response = admin_client.get(f"{BASE_URL}/api/maintenance-fees")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
        # Get by member_id
        response2 = admin_client.get(f"{BASE_URL}/api/maintenance-fees?member_id={test_member['member_id']}")
        assert response2.status_code == 200
        
        # Get by status
        response3 = admin_client.get(f"{BASE_URL}/api/maintenance-fees?status=pending")
        assert response3.status_code == 200
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/maintenance-fees/{fee['id']}")
    
    def test_maintenance_fee_tax_capped_at_5_percent(self, admin_client, test_member):
        """Test that tax rate is capped at 5%"""
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        fee_data = {
            "member_id": test_member["member_id"],
            "amount": 1000,
            "fee_type": "monthly",
            "due_date": due_date,
            "tax_rate": 10  # Try 10% but should be capped at 5%
        }
        
        response = admin_client.post(f"{BASE_URL}/api/maintenance-fees", json=fee_data)
        
        assert response.status_code == 200
        data = response.json()
        # Amount with 5% tax (capped) = 1000 * 1.05 = 1050
        assert data["amount"] == 1050.0
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/maintenance-fees/{data['id']}")


class TestTelecallerDashboard:
    """Test Telecaller Dashboard endpoints"""
    
    @pytest.fixture
    def telecaller_client(self):
        """Get authenticated telecaller client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "8888888888",
            "password": "telecaller123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_telecaller_dashboard_stats(self, telecaller_client):
        """Test telecaller dashboard returns correct stats"""
        response = telecaller_client.get(f"{BASE_URL}/api/telecaller/dashboard")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        assert "assigned_members" in data
        assert "active_members" in data
        assert "assigned_leads" in data
        assert "new_leads" in data
        assert "pending_followups" in data
        assert "telecaller_name" in data
        
        # Values should be integers
        assert isinstance(data["assigned_members"], int)
        assert isinstance(data["active_members"], int)
        assert isinstance(data["assigned_leads"], int)
    
    def test_admin_cannot_access_telecaller_dashboard(self):
        """Test that admin gets 403 when accessing telecaller dashboard"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = session.get(f"{BASE_URL}/api/telecaller/dashboard")
        assert response.status_code == 403


class TestTelecallerMemberAccess:
    """Test Telecaller Member Access endpoints"""
    
    @pytest.fixture
    def telecaller_client(self):
        """Get authenticated telecaller client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "8888888888",
            "password": "telecaller123"
        })
        assert response.status_code == 200
        token = response.json().get("access_token")
        user = response.json().get("user")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session, user["id"]
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_telecaller_members(self, telecaller_client):
        """Test getting members assigned to telecaller"""
        client, _ = telecaller_client
        
        response = client.get(f"{BASE_URL}/api/telecaller/members")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "members" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        
        # Verify member fields are limited to essential ones
        if data["members"]:
            member = data["members"][0]
            # Should have essential fields
            essential_fields = ["member_id", "name", "mobile", "status"]
            for field in essential_fields:
                assert field in member
    
    def test_get_telecaller_member_details(self, telecaller_client, admin_client):
        """Test getting detailed member info including payment history"""
        client, telecaller_id = telecaller_client
        
        # First, create a member and assign to telecaller
        plans = admin_client.get(f"{BASE_URL}/api/plans?is_active=true").json()
        plan_id = plans[0]["id"] if plans else None
        
        unique_mobile = f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}"
        member_data = {
            "name": "TEST_TelecallerMember",
            "mobile": unique_mobile,
            "email": f"test_tc_{uuid.uuid4().hex[:8]}@test.com",
            "plan_id": plan_id
        }
        create_response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        member = create_response.json()
        
        # Assign to telecaller
        admin_client.put(
            f"{BASE_URL}/api/members/{member['member_id']}/assign",
            json={"telecaller_id": telecaller_id}
        )
        
        # Get member details as telecaller
        response = client.get(f"{BASE_URL}/api/telecaller/members/{member['member_id']}/details")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "member" in data
        assert "payment_history" in data
        assert "maintenance_fees" in data
        assert "family_count" in data
        assert "follow_ups" in data
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")
    
    def test_telecaller_cannot_access_unassigned_member(self, telecaller_client, admin_client):
        """Test telecaller cannot access member not assigned to them"""
        client, _ = telecaller_client
        
        # Create a member without assigning to telecaller
        plans = admin_client.get(f"{BASE_URL}/api/plans?is_active=true").json()
        plan_id = plans[0]["id"] if plans else None
        
        unique_mobile = f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}"
        member_data = {
            "name": "TEST_UnassignedMember",
            "mobile": unique_mobile,
            "email": f"test_unassigned_{uuid.uuid4().hex[:8]}@test.com",
            "plan_id": plan_id
        }
        create_response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        member = create_response.json()
        
        # Try to access as telecaller
        response = client.get(f"{BASE_URL}/api/telecaller/members/{member['member_id']}/details")
        
        assert response.status_code == 404
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")


class TestGeneralReport:
    """Test General Report endpoint"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_general_report_structure(self, admin_client):
        """Test general report returns correct structure"""
        response = admin_client.get(f"{BASE_URL}/api/reports/general")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify members section
        assert "members" in data
        assert "total" in data["members"]
        assert "active" in data["members"]
        assert "expired" in data["members"]
        assert "family_members" in data["members"]
        
        # Verify revenue section
        assert "revenue" in data
        assert "total" in data["revenue"]
        assert "membership" in data["revenue"]
        assert "maintenance" in data["revenue"]
        
        # Verify leads section
        assert "leads" in data
        assert "total" in data["leads"]
        assert "converted" in data["leads"]
        assert "conversion_rate" in data["leads"]
        
        # Verify other sections
        assert "plan_distribution" in data
        assert "monthly_revenue" in data
        assert "telecallers" in data
    
    def test_general_report_values_are_numeric(self, admin_client):
        """Test general report values are of correct types"""
        response = admin_client.get(f"{BASE_URL}/api/reports/general")
        data = response.json()
        
        # Members should be integers
        assert isinstance(data["members"]["total"], int)
        assert isinstance(data["members"]["active"], int)
        
        # Revenue should be numeric
        assert isinstance(data["revenue"]["total"], (int, float))
        assert isinstance(data["revenue"]["membership"], (int, float))
        
        # Conversion rate should be a percentage
        assert isinstance(data["leads"]["conversion_rate"], (int, float))
        assert 0 <= data["leads"]["conversion_rate"] <= 100


class TestTransactionReport:
    """Test Transaction Report endpoint"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_transaction_report_structure(self, admin_client):
        """Test transaction report returns correct structure"""
        response = admin_client.get(f"{BASE_URL}/api/reports/transactions")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "pages" in data
        assert "summary" in data
        
        # Verify summary structure
        assert "total_amount" in data["summary"]
        assert "total_transactions" in data["summary"]
        assert "by_payment_method" in data["summary"]
    
    def test_transaction_report_date_filter(self, admin_client):
        """Test transaction report with date filters"""
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        
        response = admin_client.get(
            f"{BASE_URL}/api/reports/transactions?start_date={start_date}&end_date={end_date}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
    
    def test_transaction_report_payment_type_filter(self, admin_client):
        """Test transaction report with payment type filter"""
        response = admin_client.get(f"{BASE_URL}/api/reports/transactions?payment_type=maintenance")
        
        assert response.status_code == 200
        data = response.json()
        
        # All transactions should be maintenance type
        for txn in data["transactions"]:
            assert txn.get("payment_type") == "maintenance"
    
    def test_transaction_report_payment_method_filter(self, admin_client):
        """Test transaction report with payment method filter"""
        response = admin_client.get(f"{BASE_URL}/api/reports/transactions?payment_method=cash")
        
        assert response.status_code == 200
        data = response.json()
        
        # All transactions should have cash payment method
        for txn in data["transactions"]:
            assert txn.get("payment_method") == "cash"
    
    def test_transaction_report_pagination(self, admin_client):
        """Test transaction report pagination"""
        response = admin_client.get(f"{BASE_URL}/api/reports/transactions?page=1&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["limit"] == 10
        assert len(data["transactions"]) <= 10


class TestEmailMandatory:
    """Test that email is mandatory for member registration"""
    
    @pytest.fixture
    def admin_client(self):
        """Get authenticated admin client"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "9999999999",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_member_creation_requires_email(self, admin_client):
        """Test that member creation fails without email"""
        plans = admin_client.get(f"{BASE_URL}/api/plans?is_active=true").json()
        plan_id = plans[0]["id"] if plans else None
        
        # Try to create member without email
        member_data = {
            "name": "TEST_NoEmailMember",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "plan_id": plan_id
        }
        
        response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        
        # Should fail with validation error
        assert response.status_code == 422
    
    def test_member_creation_with_email_succeeds(self, admin_client):
        """Test that member creation with email succeeds"""
        plans = admin_client.get(f"{BASE_URL}/api/plans?is_active=true").json()
        plan_id = plans[0]["id"] if plans else None
        
        unique_id = uuid.uuid4().hex[:8]
        member_data = {
            "name": "TEST_WithEmailMember",
            "mobile": f"TEST{datetime.now().strftime('%H%M%S%f')[:10]}",
            "email": f"test_email_{unique_id}@test.com",
            "plan_id": plan_id
        }
        
        response = admin_client.post(f"{BASE_URL}/api/members", json=member_data)
        
        assert response.status_code == 200
        member = response.json()
        assert member.get("email") == f"test_email_{unique_id}@test.com"
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/members/{member['id']}")
