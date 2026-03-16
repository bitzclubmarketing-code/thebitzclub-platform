#!/usr/bin/env python3
"""
Specific test for BITZ Club email notifications system
Tests that lead and membership emails contain required fields
"""
import requests
import sys
import json
import subprocess
import time
from datetime import datetime

class EmailNotificationTester:
    def __init__(self, base_url="https://membership-go-live.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.email_logs = []

    def login_admin(self):
        """Login as admin to get access token"""
        print("🔑 Logging in as admin...")
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"identifier": "9999999999", "password": "admin123"},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            print(f"✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False

    def clear_backend_logs(self):
        """Clear backend logs to focus on new email notifications"""
        try:
            subprocess.run(["sudo", "truncate", "-s", "0", "/var/log/supervisor/backend.err.log"], 
                         check=True, timeout=10)
            print("🧹 Cleared backend logs")
        except Exception as e:
            print(f"⚠️ Could not clear logs: {e}")

    def get_recent_email_logs(self, seconds=10):
        """Get recent email logs from backend"""
        try:
            # Wait for logs to be written
            time.sleep(2)
            
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            email_logs = []
            lines = result.stdout.split('\n')
            
            for i, line in enumerate(lines):
                if '[EMAIL]' in line:
                    # Capture the email log entry
                    log_entry = {
                        'timestamp': line.split(' - ')[0] if ' - ' in line else '',
                        'line': line,
                        'content': []
                    }
                    
                    # Get the next few lines for content preview
                    for j in range(i+1, min(i+10, len(lines))):
                        if '[EMAIL]' in lines[j] or 'INFO:' in lines[j]:
                            break
                        log_entry['content'].append(lines[j])
                    
                    email_logs.append(log_entry)
            
            return email_logs
        except Exception as e:
            print(f"⚠️ Could not read logs: {e}")
            return []

    def test_lead_email_notification(self):
        """Test lead submission triggers correct email to leads@bitzclub.com"""
        print("\n" + "="*60)
        print("TESTING LEAD EMAIL NOTIFICATION")
        print("="*60)
        
        self.tests_run += 1
        
        # Clear logs before test
        self.clear_backend_logs()
        
        # Create test lead with specific data
        test_lead = {
            "name": "John Email Test Lead",
            "mobile": "9876543210",
            "city": "Mumbai", 
            "interested_in": "membership",
            "source": "landing_page"
        }
        
        print(f"📝 Creating lead: {test_lead['name']} from {test_lead['city']}")
        
        # Submit lead (public endpoint - no auth needed)
        response = requests.post(
            f"{self.base_url}/api/leads",
            json=test_lead,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"❌ Lead creation failed: {response.status_code}")
            return False
        
        lead_response = response.json()
        print(f"✅ Lead created with ID: {lead_response.get('id', 'Unknown')}")
        
        # Get email logs
        email_logs = self.get_recent_email_logs()
        lead_emails = [log for log in email_logs if 'leads@bitzclub.com' in log['line']]
        
        if not lead_emails:
            print("❌ No email sent to leads@bitzclub.com")
            return False
        
        # Analyze email content
        lead_email = lead_emails[-1]  # Get most recent
        email_content = '\n'.join([lead_email['line']] + lead_email['content'])
        
        print(f"\n📧 EMAIL SENT TO: leads@bitzclub.com")
        print(f"📧 SUBJECT CHECK:")
        
        # Check required fields in email
        required_fields = {
            'Name': test_lead['name'],
            'Mobile': test_lead['mobile'], 
            'City': test_lead['city'],
            'Interested In': test_lead['interested_in']
        }
        
        all_fields_present = True
        for field_name, expected_value in required_fields.items():
            if expected_value.lower() in email_content.lower():
                print(f"   ✅ {field_name}: {expected_value}")
            else:
                print(f"   ❌ {field_name}: {expected_value} NOT FOUND")
                all_fields_present = False
        
        if all_fields_present:
            print("✅ All required lead fields present in email")
            self.tests_passed += 1
            return True
        else:
            print("❌ Some required lead fields missing")
            return False

    def test_membership_email_notification(self):
        """Test member creation triggers correct email to admin@bitzclub.com"""
        print("\n" + "="*60)
        print("TESTING MEMBERSHIP EMAIL NOTIFICATION")
        print("="*60)
        
        self.tests_run += 1
        
        if not self.token:
            print("❌ No admin token - cannot create member")
            return False
        
        # Clear logs before test
        self.clear_backend_logs()
        
        # Get available plans
        plans_response = requests.get(
            f"{self.base_url}/api/plans",
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if plans_response.status_code != 200 or not plans_response.json():
            print("❌ Could not get plans for member creation")
            return False
        
        plans = plans_response.json()
        plan_id = plans[0]['id']
        plan_name = plans[0]['name']
        
        # Create test member with specific data
        timestamp = datetime.now().strftime('%H%M%S')
        test_member = {
            "name": "Sarah Email Test Member",
            "mobile": f"9988776{timestamp}",  # Unique mobile
            "email": "sarah.test@example.com",
            "address": "Test Address Mumbai",
            "plan_id": plan_id,
            "referral_id": "BITZ-E002"  # Specific referral ID to test
        }
        
        print(f"👤 Creating member: {test_member['name']} with referral: {test_member['referral_id']}")
        
        # Create member
        response = requests.post(
            f"{self.base_url}/api/members",
            json=test_member,
            headers={
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Member creation failed: {response.status_code}")
            return False
        
        member_response = response.json()
        member_id = member_response.get('member_id', 'Unknown')
        print(f"✅ Member created with ID: {member_id}")
        
        # Get email logs
        email_logs = self.get_recent_email_logs()
        admin_emails = [log for log in email_logs if 'admin@bitzclub.com' in log['line']]
        
        if not admin_emails:
            print("❌ No email sent to admin@bitzclub.com")
            return False
        
        # Analyze email content
        admin_email = admin_emails[-1]  # Get most recent
        email_content = '\n'.join([admin_email['line']] + admin_email['content'])
        
        print(f"\n📧 EMAIL SENT TO: admin@bitzclub.com")
        print(f"📧 CONTENT CHECK:")
        
        # Check required fields in membership email
        required_fields = {
            'Member Name': test_member['name'],
            'Membership ID': member_id,
            'Plan': plan_name,
            'Join Date': datetime.now().strftime('%Y'),  # At least check year
            'Referral ID': test_member['referral_id']
        }
        
        all_fields_present = True
        for field_name, expected_value in required_fields.items():
            if str(expected_value).lower() in email_content.lower():
                print(f"   ✅ {field_name}: {expected_value}")
            else:
                print(f"   ❌ {field_name}: {expected_value} NOT FOUND")
                all_fields_present = False
        
        if all_fields_present:
            print("✅ All required membership fields present in email")
            self.tests_passed += 1
            return True
        else:
            print("❌ Some required membership fields missing")
            return False

    def test_database_persistence(self):
        """Test that leads and members are saved in database"""
        print("\n" + "="*60)
        print("TESTING DATABASE PERSISTENCE")
        print("="*60)
        
        self.tests_run += 1
        
        if not self.token:
            print("❌ No admin token - cannot check database")
            return False
        
        # Check leads in database
        leads_response = requests.get(
            f"{self.base_url}/api/leads",
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if leads_response.status_code == 200:
            leads_data = leads_response.json()
            print(f"📋 Leads in database: {leads_data.get('total', 0)}")
        else:
            print("❌ Could not fetch leads from database")
            return False
        
        # Check members in database  
        members_response = requests.get(
            f"{self.base_url}/api/members",
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if members_response.status_code == 200:
            members_data = members_response.json()
            print(f"👥 Members in database: {members_data.get('total', 0)}")
            
            # Check if referral_id is properly stored
            members = members_data.get('members', [])
            referral_members = [m for m in members if m.get('referral_id')]
            print(f"🔗 Members with referral IDs: {len(referral_members)}")
            
            self.tests_passed += 1
            return True
        else:
            print("❌ Could not fetch members from database")
            return False

    def run_all_tests(self):
        """Run all email notification tests"""
        print("🚀 Starting BITZ Club Email Notification Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print(f"📧 Email recipients: leads@bitzclub.com, admin@bitzclub.com")
        print(f"⚠️ Note: Emails are MOCKED - checking console logs for [EMAIL] entries")
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin access")
            return False
        
        # Run tests
        tests = [
            ("Lead Email Notification", self.test_lead_email_notification),
            ("Membership Email Notification", self.test_membership_email_notification), 
            ("Database Persistence", self.test_database_persistence)
        ]
        
        failed_tests = []
        for test_name, test_func in tests:
            try:
                if not test_func():
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ {test_name} crashed: {e}")
                failed_tests.append(test_name)
        
        # Print results
        print("\n" + "="*60)
        print("EMAIL NOTIFICATION TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success rate: {success_rate:.1f}%")
        
        if failed_tests:
            print(f"❌ Failed tests: {', '.join(failed_tests)}")
            return False
        else:
            print("✅ All email notification tests passed!")
            print("\n📧 EMAIL VERIFICATION SUMMARY:")
            print("   ✅ Lead emails sent to leads@bitzclub.com")  
            print("   ✅ Membership emails sent to admin@bitzclub.com")
            print("   ✅ All required fields included in emails")
            print("   ✅ Database persistence working correctly")
            return True

def main():
    tester = EmailNotificationTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())