import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def member_token(api_client):
    """Get member authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": "7777777777",
        "password": "member123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Member authentication failed — skipping authenticated tests")

@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": "9999999999",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed — skipping authenticated tests")

@pytest.fixture
def authenticated_member(api_client, member_token):
    """Session with member auth header"""
    api_client.headers.update({"Authorization": f"Bearer {member_token}"})
    return api_client

@pytest.fixture
def authenticated_admin(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client

@pytest.fixture
def telecaller_token(api_client):
    """Get telecaller authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": "8888888888",
        "password": "telecaller123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Telecaller authentication failed — skipping telecaller tests")

@pytest.fixture
def authenticated_telecaller(api_client, telecaller_token):
    """Session with telecaller auth header"""
    api_client.headers.update({"Authorization": f"Bearer {telecaller_token}"})
    return api_client
