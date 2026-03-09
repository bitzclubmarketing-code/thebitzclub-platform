from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import qrcode
from io import BytesIO
import base64
from openpyxl import Workbook
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET", "bitz-club-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
security = HTTPBearer()

app = FastAPI(title="BITZ Club Membership API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole:
    SUPER_ADMIN = "super_admin"
    TELECALLER = "telecaller"
    MEMBER = "member"

class MembershipStatus:
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"
    CANCELLED = "cancelled"

# Auth Models
class UserCreate(BaseModel):
    mobile: str
    password: str
    name: str
    email: Optional[EmailStr] = None
    date_of_birth: Optional[str] = None
    role: str = UserRole.MEMBER

class UserLogin(BaseModel):
    identifier: str  # mobile or member_id
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Member Models
class MemberCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    plan_id: str
    password: Optional[str] = None
    referral_id: Optional[str] = None  # Employee ID (BITZ-E001) or Associate ID (BITZ-A001)

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    plan_id: Optional[str] = None
    referral_id: Optional[str] = None

# Plan Models
class PlanCreate(BaseModel):
    name: str
    description: str
    duration_months: int
    price: float
    features: List[str] = []
    is_active: bool = True

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Partner Models
class FacilityDiscount(BaseModel):
    facility_name: str
    discount_percentage: float
    description: Optional[str] = None

class PartnerCreate(BaseModel):
    name: str
    description: str
    logo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    facilities: List[FacilityDiscount] = []
    is_active: bool = True

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    facilities: Optional[List[FacilityDiscount]] = None
    is_active: Optional[bool] = None

# Telecaller Models
class TelecallerCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[EmailStr] = None
    password: str

class TelecallerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

# Follow-up Models
class FollowUpCreate(BaseModel):
    member_id: str
    notes: str
    follow_up_date: str
    status: str = "pending"

class FollowUpUpdate(BaseModel):
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    status: Optional[str] = None

# Payment Models
class PaymentCreate(BaseModel):
    member_id: str
    plan_id: str
    amount: float

# Lead Models
class LeadCreate(BaseModel):
    name: str
    mobile: str
    city: str
    interested_in: str  # 'membership' or 'partnership'
    source: Optional[str] = 'landing_page'

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class LeadStatus:
    NEW = "new"
    CONTACTED = "contacted"
    CONVERTED = "converted"
    NOT_INTERESTED = "not_interested"

# ==================== UTILITY FUNCTIONS ====================

def generate_member_id():
    """Generate unique member ID like BITZ-2024-XXXX"""
    year = datetime.now().year
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"BITZ-{year}-{random_part}"

def generate_qr_code(data: str) -> str:
    """Generate QR code and return base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_admin_or_telecaller(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.TELECALLER]:
        raise HTTPException(status_code=403, detail="Admin or Telecaller access required")
    return current_user

# ==================== EMAIL CONFIGURATION ====================

EMAIL_CONFIG = {
    "LEADS_EMAIL": "leads@bitzclub.com",
    "ADMIN_EMAIL": "admin@bitzclub.com",
    "FROM_EMAIL": os.environ.get("SENDER_EMAIL", "noreply@bitzclub.com")
}

# ==================== MOCKED SERVICES ====================

class MockedPaymentService:
    """Mocked Razorpay Service"""
    @staticmethod
    async def create_order(amount: float, member_id: str) -> dict:
        order_id = f"order_{uuid.uuid4().hex[:16]}"
        return {
            "id": order_id,
            "amount": int(amount * 100),
            "currency": "INR",
            "status": "created",
            "member_id": member_id
        }
    
    @staticmethod
    async def verify_payment(payment_id: str, order_id: str, signature: str) -> bool:
        # In production, verify with Razorpay
        return True
    
    @staticmethod
    async def capture_payment(payment_id: str, amount: float) -> dict:
        return {
            "payment_id": payment_id,
            "status": "captured",
            "amount": amount
        }

class MockedEmailService:
    """Mocked SendGrid Service - Ready for real integration"""
    
    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Send email using SendGrid (currently mocked).
        When SENDGRID_API_KEY is configured with a real key, this will send actual emails.
        """
        logger.info(f"[EMAIL] To: {to_email}")
        logger.info(f"[EMAIL] Subject: {subject}")
        logger.info(f"[EMAIL] Content Preview: {html_content[:200]}...")
        
        # TODO: When real SendGrid key is added, uncomment this:
        # import sendgrid
        # from sendgrid.helpers.mail import Mail
        # sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        # message = Mail(
        #     from_email=EMAIL_CONFIG['FROM_EMAIL'],
        #     to_emails=to_email,
        #     subject=subject,
        #     html_content=html_content
        # )
        # response = sg.send(message)
        # return response.status_code == 202
        
        return True
    
    @staticmethod
    async def send_lead_notification(lead: dict) -> bool:
        """Send lead notification to leads@bitzclub.com"""
        subject = f"New Lead Enquiry: {lead['name']} - {lead['interested_in'].title()}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #D4AF37; margin: 0;">BITZ Club</h1>
                    <p style="color: #666; margin-top: 5px;">New Lead Enquiry</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0; font-size: 18px;">Lead Details</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;">Name</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{lead['name']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Mobile Number</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{lead['mobile']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">City</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{lead['city']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Interested In</td>
                            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold; text-transform: uppercase;">{lead['interested_in']}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #D4AF37; color: #000; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-weight: bold;">Source: {lead.get('source', 'Landing Page')}</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px;">Submitted on {datetime.now().strftime('%d %B %Y at %I:%M %p')}</p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>This lead has been saved in your Admin Dashboard</p>
                    <p>Please follow up within 24 hours for best conversion</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await MockedEmailService.send_email(
            EMAIL_CONFIG['LEADS_EMAIL'],
            subject,
            html_content
        )
    
    @staticmethod
    async def send_membership_notification(member: dict, plan: dict) -> bool:
        """Send membership registration notification to admin@bitzclub.com"""
        subject = f"New Membership Registration: {member['name']} - {plan['name']} Plan"
        
        join_date = datetime.now().strftime('%d %B %Y')
        referral_id = member.get('referral_id', 'N/A') or 'N/A'
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #D4AF37; margin: 0;">BITZ Club</h1>
                    <p style="color: #666; margin-top: 5px;">New Membership Registration</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #8F741F 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">{plan['name']} Membership</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">₹{plan['price']:,.0f} / {plan['duration_months']} months</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #333; margin-top: 0; font-size: 16px;">Member Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;">Member Name</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{member['name']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Membership ID</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #D4AF37; font-weight: bold; font-family: monospace;">{member['member_id']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Membership Plan</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{plan['name']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Join Date</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{join_date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Referral ID</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">{referral_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Mobile</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">{member['mobile']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Email</td>
                            <td style="padding: 10px 0; color: #333;">{member.get('email', 'N/A') or 'N/A'}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #2e7d32; font-weight: bold;">Status: Pending Payment</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Member details saved in Admin Dashboard</p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>Registration completed on {datetime.now().strftime('%d %B %Y at %I:%M %p')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await MockedEmailService.send_email(
            EMAIL_CONFIG['ADMIN_EMAIL'],
            subject,
            html_content
        )
    
    @staticmethod
    async def send_welcome_email(member: dict) -> bool:
        """Send welcome email to the new member"""
        subject = f"Welcome to BITZ Club - Your Membership ID: {member['member_id']}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #0F0F10; padding: 30px; border-radius: 10px; color: white;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #D4AF37; margin: 0;">Welcome to BITZ Club</h1>
                    <p style="color: #999; margin-top: 5px;">Your Premium Lifestyle Membership</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <p style="font-size: 18px; margin: 0;">Dear <strong>{member['name']}</strong>,</p>
                    <p style="color: #999;">Thank you for joining the BITZ Club family!</p>
                </div>
                
                <div style="background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0.5) 100%); border: 2px solid #D4AF37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                    <p style="color: #D4AF37; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Membership ID</p>
                    <p style="font-size: 28px; font-weight: bold; margin: 10px 0; font-family: monospace; color: #D4AF37;">{member['member_id']}</p>
                </div>
                
                <div style="text-align: center; padding: 20px 0; border-top: 1px solid #333;">
                    <p style="color: #999; font-size: 14px;">Login to your member dashboard to:</p>
                    <ul style="list-style: none; padding: 0; color: #ccc;">
                        <li style="padding: 5px 0;">✓ View your digital membership card</li>
                        <li style="padding: 5px 0;">✓ Download your QR code</li>
                        <li style="padding: 5px 0;">✓ Explore partner benefits</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #666; font-size: 12px;">For support, contact us at hello@bitzclub.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        member_email = member.get('email')
        if member_email:
            return await MockedEmailService.send_email(member_email, subject, html_content)
        return True
    
    @staticmethod
    async def send_payment_receipt(member: dict, payment: dict) -> bool:
        """Send payment receipt to admin and member"""
        # This would send payment confirmation emails
        return await MockedEmailService.send_email(
            member.get("email", EMAIL_CONFIG['ADMIN_EMAIL']),
            "Payment Receipt - BITZ Club",
            f"Payment of ₹{payment['amount']} received successfully for {member['name']}"
        )

class MockedSMSService:
    """Mocked Twilio Service"""
    @staticmethod
    async def send_sms(phone: str, message: str) -> bool:
        logger.info(f"[MOCKED SMS] To: {phone}, Message: {message}")
        return True
    
    @staticmethod
    async def send_welcome_sms(member: dict) -> bool:
        return await MockedSMSService.send_sms(
            member["mobile"],
            f"Welcome to BITZ Club! Your Member ID: {member['member_id']}"
        )
    
    @staticmethod
    async def send_payment_sms(member: dict, amount: float) -> bool:
        return await MockedSMSService.send_sms(
            member["mobile"],
            f"BITZ Club: Payment of Rs.{amount} received. Thank you!"
        )

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks):
    # Check if mobile already exists
    existing = await db.users.find_one({"mobile": user_data.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    user_id = str(uuid.uuid4())
    member_id = generate_member_id()
    hashed_password = pwd_context.hash(user_data.password)
    
    user = {
        "id": user_id,
        "member_id": member_id,
        "mobile": user_data.mobile,
        "password": hashed_password,
        "name": user_data.name,
        "email": user_data.email,
        "date_of_birth": user_data.date_of_birth,
        "role": user_data.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Remove _id that MongoDB adds after insert
    user.pop('_id', None)
    
    # Send welcome SMS to user
    background_tasks.add_task(MockedSMSService.send_welcome_sms, user)
    
    # Send welcome email to user
    if user_data.email:
        background_tasks.add_task(MockedEmailService.send_welcome_email, user)
    
    # If this is a member registration, send notification to admin@bitzclub.com
    if user_data.role == UserRole.MEMBER:
        # Get default plan for notification (or create a basic notification)
        default_plan = {"name": "Self-Registered", "price": 0, "duration_months": 0}
        plans = await db.plans.find({}, {"_id": 0}).to_list(1)
        if plans:
            default_plan = plans[0]
        
        member_notification = {
            "member_id": member_id,
            "name": user_data.name,
            "mobile": user_data.mobile,
            "email": user_data.email,
            "referral_id": None
        }
        background_tasks.add_task(MockedEmailService.send_membership_notification, member_notification, default_plan)
    
    token = create_access_token({"sub": user_id, "role": user_data.role})
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user by mobile or member_id
    user = await db.users.find_one({
        "$or": [
            {"mobile": credentials.identifier},
            {"member_id": credentials.identifier}
        ]
    }, {"_id": 0})
    
    if not user or not pwd_context.verify(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

# ==================== MEMBERSHIP PLANS ENDPOINTS ====================

@api_router.post("/plans")
async def create_plan(plan: PlanCreate, admin: dict = Depends(require_admin)):
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "id": plan_id,
        **plan.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    await db.plans.insert_one(plan_doc)
    return {"id": plan_id, **plan.model_dump()}

@api_router.get("/plans")
async def get_plans(is_active: Optional[bool] = None):
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    plans = await db.plans.find(query, {"_id": 0}).to_list(100)
    return plans

@api_router.get("/plans/{plan_id}")
async def get_plan(plan_id: str):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@api_router.put("/plans/{plan_id}")
async def update_plan(plan_id: str, plan: PlanUpdate, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in plan.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.plans.update_one({"id": plan_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return await db.plans.find_one({"id": plan_id}, {"_id": 0})

@api_router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, admin: dict = Depends(require_admin)):
    result = await db.plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deleted"}

# ==================== MEMBERS ENDPOINTS ====================

@api_router.post("/members")
async def create_member(member: MemberCreate, background_tasks: BackgroundTasks, user: dict = Depends(require_admin_or_telecaller)):
    # Check if mobile already exists
    existing = await db.members.find_one({"mobile": member.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    # Get plan details
    plan = await db.plans.find_one({"id": member.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    member_id = generate_member_id()
    user_id = str(uuid.uuid4())
    
    # Create user account
    password = member.password or ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    hashed_password = pwd_context.hash(password)
    
    user_doc = {
        "id": user_id,
        "member_id": member_id,
        "mobile": member.mobile,
        "password": hashed_password,
        "name": member.name,
        "email": member.email,
        "role": UserRole.MEMBER,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Calculate membership dates
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=plan["duration_months"] * 30)
    
    member_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "member_id": member_id,
        "name": member.name,
        "mobile": member.mobile,
        "email": member.email,
        "address": member.address,
        "date_of_birth": member.date_of_birth,
        "plan_id": member.plan_id,
        "plan_name": plan["name"],
        "membership_start": start_date.isoformat(),
        "membership_end": end_date.isoformat(),
        "status": MembershipStatus.PENDING,
        "qr_code": generate_qr_code(member_id),
        "referral_id": member.referral_id,
        "assigned_telecaller": user["id"] if user["role"] == UserRole.TELECALLER else None,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.members.insert_one(member_doc)
    
    # Send welcome SMS to member
    background_tasks.add_task(MockedSMSService.send_welcome_sms, {"mobile": member.mobile, "member_id": member_id})
    
    # Send welcome email to member
    if member.email:
        background_tasks.add_task(MockedEmailService.send_welcome_email, {"email": member.email, "name": member.name, "member_id": member_id})
    
    # Send membership notification to admin@bitzclub.com
    background_tasks.add_task(MockedEmailService.send_membership_notification, member_doc, plan)
    
    return {**member_doc, "temporary_password": password, "_id": None}

@api_router.get("/members")
async def get_members(
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    search: Optional[str] = None,
    telecaller_id: Optional[str] = None,
    referral_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_admin_or_telecaller)
):
    query = {}
    
    # Telecallers can only see their assigned members
    if user["role"] == UserRole.TELECALLER:
        query["assigned_telecaller"] = user["id"]
    elif telecaller_id:
        query["assigned_telecaller"] = telecaller_id
    
    if status:
        query["status"] = status
    if plan_id:
        query["plan_id"] = plan_id
    if referral_id:
        query["referral_id"] = {"$regex": referral_id, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"mobile": {"$regex": search, "$options": "i"}},
            {"member_id": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"referral_id": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.members.count_documents(query)
    members = await db.members.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "members": members,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/members/{member_id}")
async def get_member(member_id: str, user: dict = Depends(get_current_user)):
    member = await db.members.find_one(
        {"$or": [{"id": member_id}, {"member_id": member_id}]},
        {"_id": 0}
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Members can only view their own profile
    if user["role"] == UserRole.MEMBER and member.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Telecallers can only view assigned members
    if user["role"] == UserRole.TELECALLER and member.get("assigned_telecaller") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return member

@api_router.put("/members/{member_id}")
async def update_member(member_id: str, member: MemberUpdate, user: dict = Depends(require_admin_or_telecaller)):
    update_data = {k: v for k, v in member.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # If plan is updated, update plan_name too
    if "plan_id" in update_data:
        plan = await db.plans.find_one({"id": update_data["plan_id"]}, {"_id": 0})
        if plan:
            update_data["plan_name"] = plan["name"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.members.update_one({"id": member_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return await db.members.find_one({"id": member_id}, {"_id": 0})

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, admin: dict = Depends(require_admin)):
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Delete user account
    await db.users.delete_one({"id": member["user_id"]})
    await db.members.delete_one({"id": member_id})
    
    return {"message": "Member deleted"}

@api_router.post("/members/{member_id}/assign-telecaller")
async def assign_telecaller(member_id: str, telecaller_id: str, admin: dict = Depends(require_admin)):
    result = await db.members.update_one(
        {"id": member_id},
        {"$set": {"assigned_telecaller": telecaller_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Telecaller assigned"}

# ==================== MEMBER VERIFICATION (PUBLIC) ====================

@api_router.get("/verify/{member_id}")
async def verify_member(member_id: str):
    """Public endpoint for QR code verification"""
    member = await db.members.find_one({"member_id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check validity
    end_date = datetime.fromisoformat(member["membership_end"].replace("Z", "+00:00"))
    is_valid = end_date > datetime.now(timezone.utc) and member["status"] == MembershipStatus.ACTIVE
    
    return {
        "member_id": member["member_id"],
        "name": member["name"],
        "plan_name": member["plan_name"],
        "membership_end": member["membership_end"],
        "status": member["status"],
        "is_valid": is_valid
    }

# ==================== PARTNERS ENDPOINTS ====================

@api_router.post("/partners")
async def create_partner(partner: PartnerCreate, admin: dict = Depends(require_admin)):
    partner_id = str(uuid.uuid4())
    partner_doc = {
        "id": partner_id,
        "name": partner.name,
        "description": partner.description,
        "logo_url": partner.logo_url,
        "contact_email": partner.contact_email,
        "contact_phone": partner.contact_phone,
        "address": partner.address,
        "facilities": [f.model_dump() for f in partner.facilities],
        "is_active": partner.is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    await db.partners.insert_one(partner_doc)
    return {k: v for k, v in partner_doc.items() if k != "_id"}

@api_router.get("/partners")
async def get_partners(is_active: Optional[bool] = None):
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    partners = await db.partners.find(query, {"_id": 0}).to_list(100)
    return partners

@api_router.get("/partners/{partner_id}")
async def get_partner(partner_id: str):
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner

@api_router.put("/partners/{partner_id}")
async def update_partner(partner_id: str, partner: PartnerUpdate, admin: dict = Depends(require_admin)):
    update_data = {}
    for k, v in partner.model_dump().items():
        if v is not None:
            if k == "facilities":
                update_data[k] = [f if isinstance(f, dict) else f.model_dump() for f in v]
            else:
                update_data[k] = v
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.partners.update_one({"id": partner_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return await db.partners.find_one({"id": partner_id}, {"_id": 0})

@api_router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str, admin: dict = Depends(require_admin)):
    result = await db.partners.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    return {"message": "Partner deleted"}

# ==================== TELECALLERS ENDPOINTS ====================

@api_router.post("/telecallers")
async def create_telecaller(telecaller: TelecallerCreate, admin: dict = Depends(require_admin)):
    # Check if mobile already exists
    existing = await db.users.find_one({"mobile": telecaller.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(telecaller.password)
    
    user_doc = {
        "id": user_id,
        "mobile": telecaller.mobile,
        "password": hashed_password,
        "name": telecaller.name,
        "email": telecaller.email,
        "role": UserRole.TELECALLER,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    await db.users.insert_one(user_doc)
    
    return {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}

@api_router.get("/telecallers")
async def get_telecallers(admin: dict = Depends(require_admin)):
    telecallers = await db.users.find(
        {"role": UserRole.TELECALLER},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Get assigned member counts
    for tc in telecallers:
        tc["assigned_count"] = await db.members.count_documents({"assigned_telecaller": tc["id"]})
    
    return telecallers

@api_router.get("/telecallers/{telecaller_id}")
async def get_telecaller(telecaller_id: str, admin: dict = Depends(require_admin)):
    telecaller = await db.users.find_one(
        {"id": telecaller_id, "role": UserRole.TELECALLER},
        {"_id": 0, "password": 0}
    )
    if not telecaller:
        raise HTTPException(status_code=404, detail="Telecaller not found")
    
    telecaller["assigned_count"] = await db.members.count_documents({"assigned_telecaller": telecaller_id})
    return telecaller

@api_router.put("/telecallers/{telecaller_id}")
async def update_telecaller(telecaller_id: str, telecaller: TelecallerUpdate, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in telecaller.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.users.update_one(
        {"id": telecaller_id, "role": UserRole.TELECALLER},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Telecaller not found")
    
    return await db.users.find_one({"id": telecaller_id}, {"_id": 0, "password": 0})

@api_router.delete("/telecallers/{telecaller_id}")
async def delete_telecaller(telecaller_id: str, admin: dict = Depends(require_admin)):
    # Unassign all members first
    await db.members.update_many(
        {"assigned_telecaller": telecaller_id},
        {"$set": {"assigned_telecaller": None}}
    )
    
    result = await db.users.delete_one({"id": telecaller_id, "role": UserRole.TELECALLER})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Telecaller not found")
    return {"message": "Telecaller deleted"}

# ==================== FOLLOW-UPS ENDPOINTS ====================

@api_router.post("/follow-ups")
async def create_follow_up(follow_up: FollowUpCreate, user: dict = Depends(require_admin_or_telecaller)):
    follow_up_id = str(uuid.uuid4())
    follow_up_doc = {
        "id": follow_up_id,
        **follow_up.model_dump(),
        "telecaller_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.follow_ups.insert_one(follow_up_doc)
    return {k: v for k, v in follow_up_doc.items() if k != "_id"}

@api_router.get("/follow-ups")
async def get_follow_ups(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_admin_or_telecaller)
):
    query = {}
    if user["role"] == UserRole.TELECALLER:
        query["telecaller_id"] = user["id"]
    if member_id:
        query["member_id"] = member_id
    if status:
        query["status"] = status
    
    follow_ups = await db.follow_ups.find(query, {"_id": 0}).to_list(100)
    return follow_ups

@api_router.put("/follow-ups/{follow_up_id}")
async def update_follow_up(follow_up_id: str, follow_up: FollowUpUpdate, user: dict = Depends(require_admin_or_telecaller)):
    update_data = {k: v for k, v in follow_up.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.follow_ups.update_one({"id": follow_up_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    return await db.follow_ups.find_one({"id": follow_up_id}, {"_id": 0})

# ==================== PAYMENTS ENDPOINTS ====================

@api_router.post("/payments/create-order")
async def create_payment_order(payment: PaymentCreate, user: dict = Depends(get_current_user)):
    member = await db.members.find_one({"id": payment.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    order = await MockedPaymentService.create_order(payment.amount, payment.member_id)
    
    payment_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order["id"],
        "member_id": payment.member_id,
        "plan_id": payment.plan_id,
        "amount": payment.amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    return {**order, "payment_id": payment_doc["id"]}

@api_router.post("/payments/verify")
async def verify_payment(
    payment_id: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Verify payment (mocked)
    is_valid = await MockedPaymentService.verify_payment(
        razorpay_payment_id, razorpay_order_id, razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update payment status
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": "completed",
            "razorpay_payment_id": razorpay_payment_id,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update member status to active
    member = await db.members.find_one({"id": payment["member_id"]})
    if member:
        plan = await db.plans.find_one({"id": payment["plan_id"]})
        end_date = datetime.now(timezone.utc) + timedelta(days=plan["duration_months"] * 30)
        
        await db.members.update_one(
            {"id": payment["member_id"]},
            {"$set": {
                "status": MembershipStatus.ACTIVE,
                "membership_start": datetime.now(timezone.utc).isoformat(),
                "membership_end": end_date.isoformat()
            }}
        )
        
        # Send notifications
        background_tasks.add_task(MockedSMSService.send_payment_sms, member, payment["amount"])
        if member.get("email"):
            background_tasks.add_task(MockedEmailService.send_payment_receipt, member, payment)
    
    return {"message": "Payment verified successfully", "status": "completed"}

@api_router.get("/payments")
async def get_payments(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_admin_or_telecaller)
):
    query = {}
    if member_id:
        query["member_id"] = member_id
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    total = await db.payments.count_documents(query)
    payments = await db.payments.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "payments": payments,
        "total": total,
        "page": page,
        "limit": limit
    }

# ==================== REPORTS ENDPOINTS ====================

@api_router.get("/reports/dashboard-stats")
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    total_members = await db.members.count_documents({})
    active_members = await db.members.count_documents({"status": MembershipStatus.ACTIVE})
    pending_members = await db.members.count_documents({"status": MembershipStatus.PENDING})
    expired_members = await db.members.count_documents({"status": MembershipStatus.EXPIRED})
    
    # Revenue stats
    payments = await db.payments.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    # This month stats
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_members = await db.members.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    month_payments = await db.payments.find({
        "status": "completed",
        "completed_at": {"$gte": month_start.isoformat()}
    }, {"_id": 0}).to_list(10000)
    month_revenue = sum(p.get("amount", 0) for p in month_payments)
    
    # Plan distribution
    plan_stats = await db.members.aggregate([
        {"$group": {"_id": "$plan_name", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "pending_members": pending_members,
        "expired_members": expired_members,
        "total_revenue": total_revenue,
        "month_members": month_members,
        "month_revenue": month_revenue,
        "plan_distribution": [{"plan": p["_id"], "count": p["count"]} for p in plan_stats if p["_id"]],
        "telecallers_count": await db.users.count_documents({"role": UserRole.TELECALLER}),
        "partners_count": await db.partners.count_documents({})
    }

@api_router.get("/reports/members")
async def get_members_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    referral_id: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    if status:
        query["status"] = status
    if plan_id:
        query["plan_id"] = plan_id
    if referral_id:
        query["referral_id"] = {"$regex": referral_id, "$options": "i"}
    
    members = await db.members.find(query, {"_id": 0, "qr_code": 0}).to_list(10000)
    return members

@api_router.get("/reports/export-excel")
async def export_members_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    referral_id: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    if status:
        query["status"] = status
    if referral_id:
        query["referral_id"] = {"$regex": referral_id, "$options": "i"}
    
    members = await db.members.find(query, {"_id": 0, "qr_code": 0}).to_list(10000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Members Report"
    
    # Headers
    headers = ["Member ID", "Name", "Mobile", "Email", "Date of Birth", "Plan", "Status", "Referral ID", "Start Date", "End Date", "Created At"]
    ws.append(headers)
    
    # Data
    for m in members:
        ws.append([
            m.get("member_id", ""),
            m.get("name", ""),
            m.get("mobile", ""),
            m.get("email", ""),
            m.get("date_of_birth", ""),
            m.get("plan_name", ""),
            m.get("status", ""),
            m.get("referral_id", ""),
            m.get("membership_start", ""),
            m.get("membership_end", ""),
            m.get("created_at", "")
        ])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=members_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# ==================== LEADS ENDPOINTS ====================

@api_router.post("/leads")
async def create_lead(lead: LeadCreate, background_tasks: BackgroundTasks):
    """Public endpoint for lead capture from landing page"""
    lead_id = str(uuid.uuid4())
    lead_doc = {
        "id": lead_id,
        "name": lead.name,
        "mobile": lead.mobile,
        "city": lead.city,
        "interested_in": lead.interested_in,
        "source": lead.source,
        "status": LeadStatus.NEW,
        "notes": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(lead_doc)
    
    # Send notification email to leads@bitzclub.com
    background_tasks.add_task(
        MockedEmailService.send_lead_notification,
        lead_doc
    )
    
    return {"message": "Thank you! We will contact you soon.", "id": lead_id}

@api_router.get("/leads")
async def get_leads(
    status: Optional[str] = None,
    interested_in: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin)
):
    query = {}
    if status:
        query["status"] = status
    if interested_in:
        query["interested_in"] = interested_in
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"mobile": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.leads.count_documents(query)
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "leads": leads,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/leads/stats")
async def get_leads_stats(admin: dict = Depends(require_admin)):
    total = await db.leads.count_documents({})
    new_leads = await db.leads.count_documents({"status": LeadStatus.NEW})
    contacted = await db.leads.count_documents({"status": LeadStatus.CONTACTED})
    converted = await db.leads.count_documents({"status": LeadStatus.CONVERTED})
    membership_leads = await db.leads.count_documents({"interested_in": "membership"})
    partnership_leads = await db.leads.count_documents({"interested_in": "partnership"})
    
    return {
        "total": total,
        "new": new_leads,
        "contacted": contacted,
        "converted": converted,
        "membership_leads": membership_leads,
        "partnership_leads": partnership_leads
    }

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, lead: LeadUpdate, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in lead.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return await db.leads.find_one({"id": lead_id}, {"_id": 0})

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin: dict = Depends(require_admin)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}

@api_router.get("/leads/export-excel")
async def export_leads_excel(
    status: Optional[str] = None,
    interested_in: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    query = {}
    if status:
        query["status"] = status
    if interested_in:
        query["interested_in"] = interested_in
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Leads Report"
    
    headers = ["Name", "Mobile", "City", "Interested In", "Status", "Source", "Created At"]
    ws.append(headers)
    
    for lead in leads:
        ws.append([
            lead.get("name", ""),
            lead.get("mobile", ""),
            lead.get("city", ""),
            lead.get("interested_in", ""),
            lead.get("status", ""),
            lead.get("source", ""),
            lead.get("created_at", "")
        ])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=leads_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data including admin user and sample plans"""
    
    # Create super admin if not exists
    admin_exists = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if not admin_exists:
        admin = {
            "id": str(uuid.uuid4()),
            "mobile": "9999999999",
            "password": pwd_context.hash("admin123"),
            "name": "Super Admin",
            "email": "admin@bitzclub.com",
            "role": UserRole.SUPER_ADMIN,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
    
    # Create sample plans if not exist
    plans_count = await db.plans.count_documents({})
    if plans_count == 0:
        sample_plans = [
            {
                "id": str(uuid.uuid4()),
                "name": "Silver",
                "description": "Basic membership with essential benefits",
                "duration_months": 6,
                "price": 5000,
                "features": ["Access to partner facilities", "Member discounts", "Digital membership card"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Gold",
                "description": "Premium membership with enhanced benefits",
                "duration_months": 12,
                "price": 10000,
                "features": ["All Silver benefits", "Priority support", "Exclusive events access", "Higher discounts"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Platinum",
                "description": "Elite membership with all benefits",
                "duration_months": 24,
                "price": 20000,
                "features": ["All Gold benefits", "Personal concierge", "VIP events", "Maximum discounts", "Family benefits"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.plans.insert_many(sample_plans)
    
    # Create sample partners if not exist
    partners_count = await db.partners.count_documents({})
    if partners_count == 0:
        sample_partners = [
            {
                "id": str(uuid.uuid4()),
                "name": "Luxury Spa & Wellness",
                "description": "Premium spa and wellness center",
                "logo_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200",
                "contact_email": "info@luxuryspa.com",
                "contact_phone": "9876543210",
                "address": "123 Wellness Street",
                "facilities": [
                    {"facility_name": "Spa Treatment", "discount_percentage": 20, "description": "All spa services"},
                    {"facility_name": "Gym Access", "discount_percentage": 15, "description": "Monthly gym membership"}
                ],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Fine Dining Restaurant",
                "description": "Exclusive fine dining experience",
                "logo_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200",
                "contact_email": "reservations@finedining.com",
                "contact_phone": "9876543211",
                "address": "456 Gourmet Avenue",
                "facilities": [
                    {"facility_name": "Dining", "discount_percentage": 15, "description": "All menu items"},
                    {"facility_name": "Private Events", "discount_percentage": 10, "description": "Private dining rooms"}
                ],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.partners.insert_many(sample_partners)
    
    return {"message": "Seed data created successfully", "admin_credentials": {"mobile": "9999999999", "password": "admin123"}}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
