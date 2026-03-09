# BITZ Club Membership Management System - PRD

## Project Overview
A comprehensive membership management web application for BITZ Club featuring member registration, QR-based verification, partner discounts, telecaller management, and advanced reporting.

## Original Problem Statement
Build a membership management web application for BITZ Club with:
- Public website homepage
- Membership registration and payment (Razorpay)
- Admin dashboard
- Telecaller login and member assignment
- Membership plans management
- Partner affiliations with facility-wise discounts
- Advanced reports with filters and Excel export
- Membership card generation with QR code
- Email (SendGrid) / SMS (Twilio) notifications

## User Personas

### 1. Super Admin
- Full access to all features
- Manages members, plans, partners, telecallers
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

### Plans Management
- Multiple tiers (Silver, Gold, Platinum)
- Duration and pricing configuration
- Feature list per plan
- Active/inactive toggle

### Partner Affiliations
- Partner CRUD with logo/images
- Facility-wise discount configuration
- Active/inactive toggle

### Reports
- Dashboard statistics
- Member reports with filters
- Excel export functionality

## Tech Stack
- **Frontend**: React 19, TailwindCSS, Radix UI, Framer Motion
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **Auth**: JWT (python-jose)
- **UI**: Dark theme with gold accents (BITZ branding)

## Implementation Status

### Completed (March 9, 2026)

#### Backend
- [x] Complete API server with 20+ endpoints
- [x] Authentication system (JWT)
- [x] Member CRUD with search/filter/pagination
- [x] Plans CRUD
- [x] Partners CRUD with facility discounts
- [x] Telecaller management
- [x] Follow-ups system
- [x] Dashboard statistics API
- [x] Reports with Excel export
- [x] QR code generation
- [x] Public member verification endpoint
- [x] Mocked payment service (Razorpay)
- [x] Mocked email service (SendGrid)
- [x] Mocked SMS service (Twilio)

#### Frontend
- [x] Public homepage with plans/partners
- [x] Login page (mobile/member ID + password)
- [x] Registration page with plan selection
- [x] Member verification page (QR scan result)
- [x] Member dashboard with digital card
- [x] Admin layout with collapsible sidebar
- [x] Admin dashboard with charts
- [x] Members management page
- [x] Plans management page
- [x] Partners management page
- [x] Telecallers management page
- [x] Reports page with filters and Excel export
- [x] Telecaller dashboard
- [x] Responsive design (mobile-friendly)
- [x] Dark theme with gold accents

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Real Razorpay payment integration
- [ ] Real SendGrid email integration
- [ ] Real Twilio SMS integration
- [ ] Payment gateway webhook handling

### P1 - High Priority
- [ ] Member renewal flow
- [ ] Bulk member import (CSV)
- [ ] OTP-based login option
- [ ] Password reset flow

### P2 - Medium Priority
- [ ] Member activity logs
- [ ] Partner portal (for partners to view their redeemed discounts)
- [ ] Push notifications
- [ ] Monthly membership expiry reminders

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

### Authenticated
- GET /api/auth/me - Current user info
- GET /api/members - List members (paginated)
- POST /api/members - Create member
- PUT /api/members/{id} - Update member
- DELETE /api/members/{id} - Delete member
- POST /api/members/{id}/assign-telecaller - Assign telecaller

### Admin Only
- CRUD /api/plans
- CRUD /api/partners
- CRUD /api/telecallers
- GET /api/reports/dashboard-stats
- GET /api/reports/members
- GET /api/reports/export-excel

## Test Credentials
- **Admin**: Mobile: 9999999999, Password: admin123
- **Test Member**: Mobile: 9123456789, Password: V5aRjs5c

## Mocked Integrations Notice
The following integrations are currently MOCKED and need real API keys for production:
1. **Razorpay** - Payment processing
2. **SendGrid** - Email notifications
3. **Twilio** - SMS notifications

## Next Actions
1. Integrate real Razorpay payment gateway
2. Add real SendGrid/Twilio API keys
3. Implement payment webhook handlers
4. Add member renewal flow
5. Add password reset functionality
