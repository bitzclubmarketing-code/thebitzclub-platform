# BITZ Club - Changelog

## [2026-03-09] PWA Implementation & Mobile Optimization

### Added
- PWA manifest.json with BITZ Club branding (name, icons, theme colors)
- Service worker (sw.js) with offline caching strategies
- PWA icons in all required sizes (72x72 to 512x512)
- Apple touch icon for iOS devices
- InstallPWA component with "Add to Home Screen" prompt
- iOS-specific installation instructions modal
- Splash screen with BITZ Club logo and loading animation

### Fixed
- Modal/Dialog overlay bug - overlays now properly cleanup on close
- MongoDB ObjectId serialization error in user registration endpoint
- QR code sizing for mobile viewports (responsive sizing)

### Improved
- Membership card mobile responsiveness
- Toast notifications z-index for proper layering with modals
- Mobile viewport optimization across all pages
- Dialog component with better scroll handling (max-h-90vh, overflow-y-auto)

### Testing
- Created 5 E2E test specs (Playwright)
- Created 14 backend API tests (pytest)
- All tests passing (100% success rate)

---

## [Previous] Initial Application Build

### Core Features
- Full-stack application (React + FastAPI + MongoDB)
- Role-based authentication (Super Admin, Telecaller, Member)
- Member management with CRUD operations
- Digital membership card with QR code
- Partner affiliations with facility-wise discounts
- Lead capture and management system
- Referral ID tracking
- Social media landing page
- Admin dashboard with statistics
- Reports with Excel export

### Mocked Integrations
- Razorpay payments (ready for real keys)
- SendGrid email (ready for real keys)
- Twilio SMS (ready for real keys)
