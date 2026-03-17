# BITZ Club Membership Management System - PRD

## Project Overview
A comprehensive membership management web application for BITZ Club featuring member registration, QR-based verification, partner discounts, telecaller management, lead capture, family members management, and advanced reporting.

## Deployment Status
- **Live URL**: https://thebitzclub.com
- **Server**: DigitalOcean (139.59.24.136)
- **Last Deployed**: March 17, 2026
- **Backend Service**: systemd (bitz-backend.service)
- **Frontend**: Static build served via Nginx

## Latest Features Added (March 17, 2026)
### Core System Enhancements
1. **Julian Member ID Format (10-digit)**: `YYDDDNNNNN`
   - YY: Last 2 digits of year (26 for 2026)
   - DDD: Day of year (001-366)
   - NNNNN: Sequential 5-digit counter
   - Example: `2607600001` (Year 2026, Day 76, Sequence 00001)
   - Counter stored in MongoDB `counters` collection

2. **Offline Member Creation (Admin)**
   - New dedicated page at `/admin/members/add`
   - Three-tab form matching existing system:
     - **Brief Tab**: Title, First/Middle/Last Name, Email, Password, Mobile, Joining Date, Photo Upload
     - **Personal Details Tab**: DOB, Gender, Address, Area, Pin Code, City, State, Country, Family Members section
     - **Payment Details Tab**: Card Type/Plan selection, Payment Method (Cash/Cheque/UPI/Card/Bank Transfer/Online), Payment Summary with GST, Referral ID, Notes
   - Family Members management with Add/Remove

3. **Maintenance Configuration (Plans)**
   - Maintenance Type: None / Inclusive / Enter Value
   - Maintenance Amount and GST %
   - Billing Cycle: Monthly / Quarterly / Half-Yearly / Yearly
   - Renewal Amount field

4. **Enhanced Payment Verification**
   - Primary: Razorpay signature verification
   - Fallback: Direct payment status check via API if signature fails

## Previous Features (March 16, 2026)
- **Refer & Earn Feature**: Members can share referral code via WhatsApp, SMS, or copy link
- **Referral Sharing Options**: WhatsApp, SMS, Copy Link with pre-filled messages

## Original Problem Statement
Build a membership management web application for BITZ Club with:
- Public website homepage
- Social media landing page for ad campaigns
- Digital Marketing Landing Page with multi-step registration
- Membership registration and payment (Razorpay)
- Admin dashboard with full member/family/payment management
- Telecaller login and member assignment
- Membership plans management with maintenance configuration
- Partner affiliations with facility-wise discounts
- Advanced reports (general, transactions) with filters and Excel export
- Maintenance module with category-based pricing, discounts, and tax
- Family members module
- Membership card generation with QR code
- Email notifications for reminders and renewals
- Lead capture, assignment, and management system
- Referral tracking (Employee/Associate IDs)

## User Personas

### 1. Super Admin
- Full access to all features
- Manages members, plans, partners, telecallers
- Manages family members under primary accounts
- Views and manages leads from landing page
- Assigns leads to telecallers
- Views reports and analytics (general, transactions)
- Creates/manages maintenance fees with discounts and tax
- Can export data

### 2. Telecaller
- Views and manages assigned members only
- Views member details including payment history
- Gets assigned leads from admin
- Creates new members
- Manages follow-ups
- Dashboard with performance stats

### 3. Member
- Self-service portal
- Views membership card with QR code
- Downloads membership card
- Views partner benefits
- Email is MANDATORY for renewal/maintenance reminders

### 4. Landing Page Visitor
- Views lifestyle experiences
- Submits enquiry form
- Multi-step registration with Razorpay payment
- Gets redirected to registration

## Core Requirements (Static)

### Authentication
- Mobile + Password login
- Member ID + Password login
- JWT-based session management
- Role-based access control

### Member Management
- CRUD operations
- **Member ID generation: 10-digit Julian format (YYDDDNNNNN)**
  - YY = Year (26 for 2026)
  - DDD = Day of year (001-366)
  - NNNNN = Sequential counter (00001-99999)
  - Example: `2607600001`
- QR code generation for verification
- Status tracking (active, pending, expired, cancelled)
- **Referral ID tracking (BITZ-E*** for Employees, BITZ-A*** for Associates)**
- **Offline Member Creation with 3-tab form (Brief, Personal Details, Payment Details)**

### Plans Management
- Multiple tiers (Silver, Gold, Platinum)
- Duration and pricing configuration
- Feature list per plan
- Active/inactive toggle

### Partner Affiliations
- Partner CRUD with logo/images
- Facility-wise discount configuration
- Active/inactive toggle

### Lead Management
- Lead capture from landing page
- Status tracking (new, contacted, converted, not_interested)
- Interest type (membership/partnership)
- Source tracking
- Excel export

### Reports
- Dashboard statistics
- Member reports with filters (including Referral ID)
- Lead reports
- Excel export functionality

## Tech Stack
- **Frontend**: React 19, TailwindCSS, Radix UI, Framer Motion
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **Auth**: JWT (python-jose)
- **UI**: Dark theme with gold accents (BITZ branding)

## Implementation Status

### Completed (March 9, 2026)

#### PWA Implementation (Latest)
- [x] Web App Manifest (manifest.json) with BITZ Club branding
- [x] Service Worker (sw.js) with caching strategies
- [x] PWA icons (72x72 to 512x512, including Apple touch icon)
- [x] PWA meta tags in index.html (theme-color, apple-mobile-web-app-capable, etc.)
- [x] Splash screen with BITZ Club logo and loading animation
- [x] InstallPWA component with "Add to Home Screen" prompt
- [x] iOS-specific installation instructions
- [x] Offline capability for static assets

#### Membership Card Feature (March 14, 2026)
- [x] **Front Side Design** - BITZ Club logo, Member photo, Name, Member ID, QR code, Plan, Validity
- [x] **Back Side Design** - Terms & Conditions, Partner usage instructions, Contact details, Website, Emergency contact
- [x] **Credit card size format** (85.6mm x 53.98mm) - Print ready for double-sided printing
- [x] **Photo Upload** - Members can upload their photo via POST /api/members/{member_id}/photo
- [x] **Download as PDF** - Generates 2-page PDF with front and back sides
- [x] **Download as Image** - Generates combined PNG with both sides
- [x] **Flip animation** - Toggle between front and back views
- [x] **QR Code** - Contains member ID for quick verification
- [x] Share functionality with native share API fallback

#### Payment-First Registration Flow (March 14, 2026)
- [x] **Registration with Plan Selection** - User selects plan during registration
- [x] **Photo Upload at Registration** - Optional photo upload included in registration
- [x] **Razorpay Integration** - Payment processed BEFORE member account creation
- [x] **Member ID Generation** - Generated only after successful payment
- [x] **Auto-Activation** - Membership automatically activated with plan and validity dates
- [x] **Digital Card Generation** - Membership card available immediately after payment
- [x] New endpoints: POST /api/registration/initiate, POST /api/registration/complete

#### Mobile Responsiveness (Latest)
- [x] Membership card optimized for mobile viewports
- [x] Responsive QR code sizing based on screen width
- [x] Modal/dialog overlay bug fixed
- [x] Toast notifications with proper z-index
- [x] Mobile-friendly navigation and forms
- [x] Landing page fully responsive
- [x] Member dashboard fully responsive

#### Date of Birth Feature (Latest - March 9, 2026)
- [x] DOB field in registration form with date picker
- [x] DOB stored in database with member record
- [x] DOB displayed in Admin Members table
- [x] DOB displayed in Reports page
- [x] DOB included in Excel export
- [x] Admin can edit DOB in member modal

#### Content Management System (CMS) - March 9, 2026
- [x] Admin → Content page with 3 tabs (Experiences, Gallery, Settings)
- [x] Manage lifestyle experience sections (8 categories)
- [x] Add/Edit/Delete experiences with image URLs
- [x] Gallery image management
- [x] Website settings (hero text, contact info)
- [x] Dynamic content on homepage from database
- [x] Partner venue management (existing)
- [x] Plan pricing and features management (existing)

#### Comprehensive Reports Module - March 10, 2026
- [x] Dashboard Summary (Total, Active, Expired, Today's registrations, Monthly revenue)
- [x] Member Reports with filters (Name, Mobile, Member ID, Plan, Status, City, Pincode, Date range, Expiry range, Referral ID)
- [x] Payment Reports (Amount, Type, Method, Plan, Date/Month/Year filters)
- [x] Payment Type Report (Online Razorpay vs Offline Cash)
- [x] Location Report (City-wise, Pincode-wise, Area-wise)
- [x] Telecaller Performance Report (Leads assigned, contacted, converted, pending, conversion %)
- [x] Referral Report (Employee, Associate, Member referrals with counts)
- [x] Birthday Report (Today, 7 days, 30 days)
- [x] Membership Expiry Report (7 days, 30 days, Expired)
- [x] Export to Excel (.xlsx)
- [x] Export to CSV
- [x] Print report functionality

#### Backend
- [x] Complete API server with 25+ endpoints
- [x] Authentication system (JWT)
- [x] Member CRUD with search/filter/pagination
- [x] **Referral ID field in member model**
- [x] Plans CRUD
- [x] Partners CRUD with facility discounts
- [x] Telecaller management
- [x] Follow-ups system
- [x] **Lead capture and management APIs**
- [x] Dashboard statistics API
- [x] Reports with Excel export (includes Referral ID)
- [x] **Leads Excel export**
- [x] QR code generation
- [x] Public member verification endpoint
- [x] Mocked payment service (Razorpay)
- [x] Mocked email service (SendGrid)
- [x] Mocked SMS service (Twilio)

#### Frontend
- [x] Public homepage with plans/partners
- [x] **Social Media Landing Page (/landing, /social)**
  - Hero section with premium imagery
  - Lifestyle experience cards (10 categories)
  - Video/reel section
  - Membership plans display
  - Lead capture form
  - WhatsApp integration (wa.me/7812901118)
  - CTA buttons
- [x] Login page (mobile/member ID + password)
- [x] Registration page with plan selection and **Referral ID field**
- [x] Member verification page (QR scan result)
- [x] Member dashboard with digital card
- [x] Admin layout with collapsible sidebar
- [x] Admin dashboard with charts
- [x] Members management page with **Referral ID column and filter**
- [x] **Admin Leads page with stats, filters, and export**
- [x] Plans management page
- [x] Partners management page
- [x] Telecallers management page
- [x] Reports page with filters (**including Referral ID**) and Excel export
- [x] Telecaller dashboard
- [x] Responsive design (mobile-friendly)
- [x] Dark theme with gold accents

## Page URLs
- `/` - Main homepage
- `/landing` or `/social` - Social media landing page
- `/login` - User login
- `/register` - Member registration
- `/verify/:memberId` - QR verification
- `/member` - Member dashboard
- `/admin` - Admin dashboard
- `/admin/members` - Members management
- `/admin/leads` - Leads management
- `/admin/plans` - Plans management
- `/admin/partners` - Partners management
- `/admin/telecallers` - Telecallers management
- `/admin/reports` - Reports & exports
- `/telecaller` - Telecaller dashboard
- `/join` or `/marketing` or `/promo` - Digital Marketing Landing Page (NEW)

## Prioritized Backlog

### P0 - Critical (Completed March 14, 2026)
- [x] Real Razorpay payment integration - COMPLETED (test keys configured)
- [x] Real SMTP email integration - COMPLETED (configured, needs actual password)
- [x] Real SoftSMS integration - COMPLETED (API configured)
- [x] **Digital Marketing Landing Page** - COMPLETED (March 14, 2026)
  - Multi-step registration flow (Lead capture → Plan selection → Payment → Photo/ID upload)
  - Lead capture with Name, Mobile, Email, Referral Code
  - Razorpay payment integration
  - Photo and ID proof upload after payment
  - WhatsApp contact button (+91 7812901118)
  - Call Now option
  - Chat/Enquiry box
  - All leads stored in admin dashboard with referral tracking
  - **Auto-fill features** (March 14, 2026):
    - Country code selector with 15 countries (India, US, UK, UAE, Singapore, Australia, etc.)
    - PIN code auto-fill for city/state using India Post API (Indian users only)
    - Referral code auto-population from URL params: ?ref=, ?referral=, ?code=, ?promo=, ?utm_campaign=
    - International payment support via Razorpay (domestic + international cards)
- [x] **Backend Features Enhancement** - COMPLETED (March 14, 2026)
  - **Family Members Module**: Add/edit/delete family members under primary member accounts
  - **Lead Assignment**: Admin can assign leads to telecallers, view unassigned leads
  - **Maintenance Module**: Category-based maintenance with discounts (0-5% tax), linked to payment history
  - **Telecaller Dashboard**: Stats API for assigned members, leads, follow-ups
  - **Telecaller Member Access**: View member details including payment history, maintenance fees
  - **Reports Enhanced**: General overview report with revenue/leads/plan distribution, Transaction reports with filters
  - **Email Mandatory**: Email required for member registration (for reminders/notifications)
- [x] **UI Updates & Affiliations** - COMPLETED (March 14, 2026)
  - **Navigation Renamed**: Experiences → Event Plans, Partners → Affiliations
  - **Login → Member Login**: Login button renamed to Member Login
  - **OFFERS Section**: New section displaying special offers and deals from database
  - **GALLERY Section**: New photo gallery section on homepage
  - **Affiliations Enhanced**: Partner model with category, image_url, contact_person, phone, address, website, offers fields
  - **Booking System**: Members can book visits at affiliates (POST /api/bookings)
  - **Member Dashboard Revamped**: 6 tabs - My Card, My Profile, Affiliations, Bookings, Payments, Feedback
  - **Payment History Access**: Members can view their own payment history
- [ ] Payment gateway webhook handling
- [ ] Automatic maintenance reminder system

### P1 - High Priority
- [ ] Admin User Management System (Super Admin role, activity logging)
- [x] Family Member Module - COMPLETED (Backend)
- [ ] Frontend UI for Family Members
- [ ] Member renewal flow
- [ ] Bulk member import (CSV)
- [ ] OTP-based login option
- [ ] Password reset flow
- [ ] Video embed in landing page

### P2 - Medium Priority
- [ ] Member activity logs
- [ ] Partner portal
- [ ] Push notifications
- [ ] Monthly membership expiry reminders (email service ready)
- [ ] Referral commission tracking
- [x] Enhance Telecaller Module (assign members/leads, track follow-ups) - COMPLETED (Backend)

### P3 - Low Priority
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## API Endpoints Summary

### Public
- GET /api/plans - List active plans
- GET /api/partners - List active partners
- GET /api/verify/{member_id} - Verify membership
- POST /api/auth/login - User login
- POST /api/auth/register - User registration
- **POST /api/leads - Submit lead enquiry**

### Marketing Landing Page (Public)
- **POST /api/marketing/lead** - Step 1: Capture lead (name, mobile, email, referral_code)
- **POST /api/marketing/lead/{lead_id}/step2** - Step 2: Full details & create payment order
- **POST /api/marketing/lead/{lead_id}/complete** - Step 3: Complete registration after payment
- **POST /api/marketing/enquiry** - Submit chat/contact enquiry

### Authenticated
- GET /api/auth/me - Current user info
- GET /api/members - List members (paginated, filterable by referral_id)
- POST /api/members - Create member (with referral_id)
- PUT /api/members/{id} - Update member
- DELETE /api/members/{id} - Delete member
- POST /api/members/{id}/assign-telecaller - Assign telecaller
- **POST /api/members/{member_id}/photo** - Upload member photo (multipart/form-data)
- **GET /api/uploads/photos/{filename}** - Get uploaded member photo

### Admin Only
- CRUD /api/plans
- CRUD /api/partners
- CRUD /api/telecallers
- **GET /api/leads - List leads (paginated)**
- **GET /api/leads/stats - Lead statistics**
- **PUT /api/leads/{id} - Update lead status**
- **DELETE /api/leads/{id} - Delete lead**
- **GET /api/leads/export-excel - Export leads**
- **POST /api/leads/assign - Assign leads to telecaller** (NEW)
- **GET /api/leads/by-telecaller - Get leads by telecaller** (NEW)
- **GET /api/leads/unassigned - Get unassigned leads** (NEW)
- **GET /api/marketing/leads - List marketing landing page leads**
- **GET /api/enquiries - List chat enquiries**
- **PUT /api/enquiries/{id} - Update enquiry status**
- GET /api/reports/dashboard-stats
- GET /api/reports/members (filterable by referral_id)
- GET /api/reports/export-excel (includes referral_id)
- **GET /api/reports/general - General overview report** (NEW)
- **GET /api/reports/transactions - Transaction report with filters** (NEW)
- **GET /api/reports/transactions/export - Export transactions** (NEW)

### Family Members (Admin Only)
- **POST /api/members/{member_id}/family** - Add family member
- **GET /api/members/{member_id}/family** - Get family members
- **PUT /api/family/{id}** - Update family member
- **DELETE /api/family/{id}** - Delete family member
- **GET /api/family** - List all family members (paginated)

### Maintenance Fees (Admin Only)
- **GET /api/maintenance-fees** - List maintenance fees
- **POST /api/maintenance-fees** - Create fee with discount/tax
- **PUT /api/maintenance-fees/{id}** - Update fee
- **DELETE /api/maintenance-fees/{id}** - Delete fee
- **POST /api/maintenance-fees/{id}/pay** - Mark as paid and create payment record

### Telecaller Dashboard
- **GET /api/telecaller/dashboard** - Telecaller stats (assigned members, leads, follow-ups)
- **GET /api/telecaller/members** - Get assigned members (essential fields)
- **GET /api/telecaller/members/{id}/details** - Get member details with payment history

## Test Credentials
- **Admin**: Mobile: 9999999999, Password: admin123
- **Telecaller**: Mobile: 8888888888, Password: telecaller123
- **Member**: Mobile: 7777777777, Password: member123

## Real Integrations Status (March 11, 2026)
The following integrations are now REAL and configured:

### 1. Razorpay (Payment Processing) - ACTIVE
- Test keys configured in `/app/backend/.env`
- Creates real orders with Razorpay order IDs
- Ready for production with live keys

### 2. SoftSMS (SMS Notifications) - ACTIVE
- API key and sender ID configured
- Sends real SMS on member registration and payment
- Uses `https://softsms.in/app/smsapi/index.php`

### 3. SMTP Email - CONFIGURED (Password Needed)
- Host: `mail.bitzclub.com`
- Port: 465 (SSL)
- Username: `noreply@bitzclub.com`
- **ACTION REQUIRED**: Update `SMTP_PASSWORD` in `/app/backend/.env` with actual password

### Email Configuration
- **Leads Email**: `leads@bitzclub.com` - Receives all landing page enquiries
- **Admin Email**: `admin@bitzclub.com` - Receives membership registration notifications

**Lead Email Contains:**
- Name
- Mobile Number  
- City
- Interested In (Membership/Partnership)
- Source
- Timestamp

**Membership Email Contains:**
- Member Name
- Membership ID
- Membership Plan
- Join Date
- Referral ID
- Mobile
- Email

To enable real email sending, add your SendGrid API key to `/app/backend/.env`:
```
SENDGRID_API_KEY=your_real_key_here
SENDER_EMAIL=noreply@bitzclub.com
```

## Next Actions
1. Update SMTP password in `/app/backend/.env` with real webmail password
2. ~~**Fix Registration Flow** - Implement payment-first registration~~ ✅ COMPLETED (March 14, 2026)
3. Implement payment webhook handlers for Razorpay (for server-to-server verification)
4. Implement automatic maintenance reminder system
5. Add member renewal flow
6. Add password reset functionality
7. Embed promotional video in landing page
8. **Homepage Redesign** - Rename "Experiences" to "Events", "Partners" to "Offers", add About Us & Testimonials
9. Enhance Telecaller Module (assign members/leads, track follow-ups)
10. **Family Member Module** - Add family members under primary member account
11. **Maintenance Fee Module** - Track maintenance fee payments and reports
