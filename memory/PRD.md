# BITZ Club Membership Management System - PRD

## Project Overview
A comprehensive membership management web application for BITZ Club featuring member registration, QR-based verification, partner discounts, telecaller management, lead capture, and advanced reporting.

## Original Problem Statement
Build a membership management web application for BITZ Club with:
- Public website homepage
- Social media landing page for ad campaigns
- Membership registration and payment (Razorpay)
- Admin dashboard
- Telecaller login and member assignment
- Membership plans management
- Partner affiliations with facility-wise discounts
- Advanced reports with filters and Excel export
- Membership card generation with QR code
- Email (SendGrid) / SMS (Twilio) notifications
- Lead capture and management system
- Referral tracking (Employee/Associate IDs)

## User Personas

### 1. Super Admin
- Full access to all features
- Manages members, plans, partners, telecallers
- Views and manages leads from landing page
- Views reports and analytics
- Can export data

### 2. Telecaller
- Views and manages assigned members only
- Creates new members
- Manages follow-ups

### 3. Member
- Self-service portal
- Views membership card with QR code
- Downloads membership card
- Views partner benefits

### 4. Landing Page Visitor
- Views lifestyle experiences
- Submits enquiry form
- Gets redirected to registration

## Core Requirements (Static)

### Authentication
- Mobile + Password login
- Member ID + Password login
- JWT-based session management
- Role-based access control

### Member Management
- CRUD operations
- Member ID generation (BITZ-YYYY-XXXXXX format)
- QR code generation for verification
- Status tracking (active, pending, expired, cancelled)
- **Referral ID tracking (BITZ-E*** for Employees, BITZ-A*** for Associates)**

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

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Real Razorpay payment integration
- [ ] Real SendGrid email integration
- [ ] Real Twilio SMS integration
- [ ] Payment gateway webhook handling
- [ ] Automatic maintenance reminder system

### P1 - High Priority
- [ ] Member renewal flow
- [ ] Bulk member import (CSV)
- [ ] OTP-based login option
- [ ] Password reset flow
- [ ] Video embed in landing page

### P2 - Medium Priority
- [ ] Member activity logs
- [ ] Partner portal
- [ ] Push notifications
- [ ] Monthly membership expiry reminders
- [ ] Referral commission tracking

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

### Authenticated
- GET /api/auth/me - Current user info
- GET /api/members - List members (paginated, filterable by referral_id)
- POST /api/members - Create member (with referral_id)
- PUT /api/members/{id} - Update member
- DELETE /api/members/{id} - Delete member
- POST /api/members/{id}/assign-telecaller - Assign telecaller

### Admin Only
- CRUD /api/plans
- CRUD /api/partners
- CRUD /api/telecallers
- **GET /api/leads - List leads (paginated)**
- **GET /api/leads/stats - Lead statistics**
- **PUT /api/leads/{id} - Update lead status**
- **DELETE /api/leads/{id} - Delete lead**
- **GET /api/leads/export-excel - Export leads**
- GET /api/reports/dashboard-stats
- GET /api/reports/members (filterable by referral_id)
- GET /api/reports/export-excel (includes referral_id)

## Test Credentials
- **Admin**: Mobile: 9999999999, Password: admin123
- **Test Member**: Mobile: 9123456789, Password: V5aRjs5c
- **PWA Test Member**: Mobile: 7777777777, Password: PWAtest123!

## Mocked Integrations Notice
The following integrations are currently MOCKED and need real API keys for production:
1. **Razorpay** - Payment processing
2. **SendGrid** - Email notifications (ready for real keys)
3. **Twilio** - SMS notifications

### Email Configuration (Ready for Production)
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
1. Integrate real Razorpay payment gateway (requires API keys)
2. Add real SendGrid API key for email notifications
3. Add real Twilio API key for SMS/WhatsApp notifications
4. Implement automatic maintenance reminder system
5. Implement payment webhook handlers
6. Add member renewal flow
7. Add password reset functionality
8. Embed promotional video in landing page
