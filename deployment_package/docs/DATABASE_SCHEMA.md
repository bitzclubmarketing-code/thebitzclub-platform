# BITZ Club - Database Schema

## Collections Overview

### 1. users
Stores all user accounts (admins, telecallers, members).

```json
{
  "id": "uuid",
  "mobile": "string (10 digits)",
  "email": "string (optional)",
  "name": "string",
  "password": "string (bcrypt hashed)",
  "role": "super_admin | telecaller | member",
  "member_id": "string (BITZ-YYYY-XXXXXX format)",
  "date_of_birth": "string (ISO date, optional)",
  "is_active": "boolean",
  "created_at": "string (ISO datetime)"
}
```

### 2. members
Stores membership details.

```json
{
  "id": "uuid",
  "member_id": "string (BITZ-YYYY-XXXXXX)",
  "user_id": "uuid (references users)",
  "name": "string",
  "mobile": "string",
  "email": "string (optional)",
  "plan_id": "uuid (references plans)",
  "plan_name": "string",
  "status": "active | pending | expired | cancelled",
  "membership_start": "string (ISO date)",
  "membership_end": "string (ISO date)",
  "referral_id": "string (optional, BITZ-E*** or BITZ-A***)",
  "assigned_telecaller": "uuid (optional)",
  "created_at": "string (ISO datetime)",
  "created_by": "uuid"
}
```

### 3. plans
Stores membership plan configurations.

```json
{
  "id": "uuid",
  "name": "string (Silver, Gold, Platinum)",
  "description": "string",
  "duration_months": "integer",
  "price": "float",
  "features": ["array of strings"],
  "is_active": "boolean",
  "created_at": "string (ISO datetime)"
}
```

### 4. partners
Stores partner venue information.

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "logo_url": "string (URL)",
  "location": "string",
  "contact": "string",
  "facilities": [
    {
      "facility_name": "string",
      "discount_percentage": "float",
      "description": "string"
    }
  ],
  "is_active": "boolean",
  "created_at": "string (ISO datetime)"
}
```

### 5. payments
Stores payment transaction records.

```json
{
  "id": "uuid",
  "order_id": "string (Razorpay order ID)",
  "member_id": "string",
  "member_name": "string",
  "plan_id": "uuid",
  "plan_name": "string",
  "amount": "float",
  "payment_type": "online | offline",
  "payment_method": "razorpay | cash | upi | card",
  "status": "pending | completed | failed",
  "razorpay_payment_id": "string (optional)",
  "razorpay_signature": "string (optional)",
  "created_at": "string (ISO datetime)"
}
```

### 6. leads
Stores enquiry leads from landing page.

```json
{
  "id": "uuid",
  "name": "string",
  "mobile": "string",
  "city": "string",
  "interested_in": "membership | partnership",
  "status": "new | contacted | converted | not_interested",
  "source": "string (landing_page, referral, etc.)",
  "notes": "string (optional)",
  "assigned_telecaller": "uuid (optional)",
  "created_at": "string (ISO datetime)"
}
```

### 7. experiences
Stores CMS content for lifestyle experiences.

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "image_url": "string (URL)",
  "discount_tag": "string (e.g., 'Up to 40% Off')",
  "category": "string",
  "is_active": "boolean",
  "order": "integer",
  "created_at": "string (ISO datetime)"
}
```

### 8. gallery
Stores gallery images for CMS.

```json
{
  "id": "uuid",
  "images": ["array of image URLs"],
  "updated_at": "string (ISO datetime)"
}
```

---

## Indexes (Recommended)

```javascript
// Users
db.users.createIndex({ "mobile": 1 }, { unique: true })
db.users.createIndex({ "member_id": 1 })
db.users.createIndex({ "role": 1 })

// Members
db.members.createIndex({ "member_id": 1 }, { unique: true })
db.members.createIndex({ "mobile": 1 })
db.members.createIndex({ "status": 1 })
db.members.createIndex({ "plan_id": 1 })

// Payments
db.payments.createIndex({ "member_id": 1 })
db.payments.createIndex({ "status": 1 })
db.payments.createIndex({ "created_at": -1 })

// Leads
db.leads.createIndex({ "status": 1 })
db.leads.createIndex({ "created_at": -1 })
```

---

## Sample Data Counts (Current)

| Collection   | Documents |
|--------------|-----------|
| users        | 18        |
| members      | 10        |
| plans        | 3         |
| partners     | 5         |
| payments     | 13        |
| leads        | 16        |
| experiences  | 8         |
| gallery      | 1         |
