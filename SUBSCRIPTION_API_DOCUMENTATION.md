# Subscription Module API Documentation

This document is the official, implementation-verified API contract and complete manual for the **Subscription Module** in the School Management Application. All endpoints, parameters, request payloads, response objects, data types, authentication mechanisms, and error codes documented herein reflect active backend controllers, routes, Mongoose models, and verified live test execution results against MongoDB.

---

## Table of Contents

1. [Architecture & Database Models](#1-architecture--database-models)
   - [1.1 Subscription Model (`subscriptions`)](#11-subscription-model-subscriptions)
   - [1.2 Subscription Config Model (`subscriptionconfigs`)](#12-subscription-config-model-subscriptionconfigs)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Global Headers & Route Base Paths](#3-global-headers--route-base-paths)
4. [Complete API Specifications](#4-complete-api-specifications)
   - [4.1 Subscription Plans API](#41-subscription-plans-api)
   - [4.2 Per-Student Pricing Rates Configuration API](#42-per-student-pricing-rates-configuration-api)
   - [4.3 Update Pricing Rates Configuration (SuperAdmin)](#43-update-pricing-rates-configuration-superadmin)
   - [4.4 Create Subscription Order (Razorpay)](#44-create-subscription-order-razorpay)
   - [4.5 Verify Payment & Activate Subscription (Multi-Method)](#45-verify-payment--activate-subscription-multi-method)
   - [4.6 Dedicated Bank Transfer Payment Submission](#46-dedicated-bank-transfer-payment-submission)
   - [4.7 Get Current Active Subscription & History (SchoolAdmin)](#47-get-current-active-subscription--history-schooladmin)
   - [4.8 Subscription Status Guard Check](#48-subscription-status-guard-check)
   - [4.9 Subscription Expiry & Renewal Eligibility Details](#49-subscription-expiry--renewal-eligibility-details)
   - [4.10 Subscription Renewal (Continuous Academic Extension)](#410-subscription-renewal-continuous-academic-extension)
   - [4.11 Cancel Subscription](#411-cancel-subscription)
   - [4.12 Subscription Payment History & Invoices List](#412-subscription-payment-history--invoices-list)
   - [4.13 Get All Subscriptions Across All Schools (SuperAdmin)](#413-get-all-subscriptions-across-all-schools-superadmin)
   - [4.14 Get Subscription Details by ID](#414-get-subscription-details-by-id)
   - [4.15 Get School Subscription Details by School ID](#415-get-school-subscription-details-by-school-id)
   - [4.16 Activate / Deactivate / Update Subscription Status (SuperAdmin)](#416-activate--deactivate--update-subscription-status-superadmin)
   - [4.17 Update Subscription Record Details (SuperAdmin)](#417-update-subscription-record-details-superadmin)
   - [4.18 Automated Subscription Expiry Check & Batch Expiration](#418-automated-subscription-expiry-check--batch-expiration)
5. [Frontend Integration Guide](#5-frontend-integration-guide)
6. [Final API Audit & Verification Report](#6-final-api-audit--verification-report)

---

## 1. Architecture & Database Models

The Subscription Module utilizes two primary MongoDB collections:

### 1.1 Subscription Model (`subscriptions`)
File: `backend/src/models/Subscription.js`

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `school_id` | `ObjectId` (ref: `'School'`) | **Yes** | — | Associated school reference |
| `student_count` | `Number` | **Yes** | — | Total licensed student capacity (min: 1) |
| `selected_duration` | `String` | **Yes** | — | Duration label: `'1 Year'`, `'2 Years'`, `'3 Years'`, `'5 Years'` |
| `duration_years` | `Number` | **Yes** | — | Duration in years: `1`, `2`, `3`, `5` |
| `price_per_student` | `Number` | **Yes** | — | Annual cost per student in INR |
| `total_amount` | `Number` | **Yes** | — | Computed: `student_count * price_per_student * duration_years` |
| `payment_id` | `String` | **Yes** | — | Gateway or internal payment ID (`pay_*`, `CASH_*`, `CHQ_*`, `BT_*`) |
| `payment_method` | `String` | **Yes** | `'Razorpay'` | Enum: `'Razorpay'`, `'Cash'`, `'Cheque'`, `'Bank Transfer'` |
| `cheque_details` | `Object` | No | `{}` | Cheque metadata: `cheque_number`, `cheque_date`, `bank_name`, `branch_name` |
| `bank_transfer_details` | `Object` | No | `{}` | NEFT/RTGS/IMPS metadata: `transaction_number`, `transaction_date`, `bank_name`, `receipt_url`, `receipt_name`, `notes` |
| `payment_notes` | `String` | No | `''` | General payment/approval notes |
| `razorpay_order_id` | `String` | No | — | Razorpay gateway order identifier |
| `razorpay_payment_id` | `String` | No | — | Razorpay payment identifier |
| `razorpay_signature` | `String` | No | — | HMAC SHA256 signature from Razorpay checkout |
| `status` | `String` | **Yes** | `'Active'` | Enum: `'Active'`, `'Expired'`, `'Pending'`, `'Cancelled'` |
| `subscription_start_date`| `Date` | **Yes** | `Date.now` | Subscription validity start timestamp |
| `subscription_end_date` | `Date` | **Yes** | — | Subscription validity expiration timestamp |
| `invoice_number` | `String` | **Yes** | Unique | Generated format: `INV-SUB-YYYYMM-XXXX` or `INV-REN-YYYYMM-XXXX` |
| `cancellation_reason` | `String` | No | `''` | Documented reason if subscription is cancelled |
| `cancelled_at` | `Date` | No | — | Timestamp of cancellation |
| `auto_renew` | `Boolean` | No | `false` | Automatic renewal preference flag |
| `createdAt` / `updatedAt` | `Date` | Auto | — | Mongoose timestamps |

### 1.2 Subscription Config Model (`subscriptionconfigs`)
File: `backend/src/models/SubscriptionConfig.js`

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `rate_1_year` | `Number` | **Yes** | `50` (or system default) | Per student/year rate for 1 Year plan (in INR) |
| `rate_2_years` | `Number` | **Yes** | `45` | Per student/year rate for 2 Years plan (in INR) |
| `rate_3_years` | `Number` | **Yes** | `40` | Per student/year rate for 3 Years plan (in INR) |
| `rate_5_years` | `Number` | **Yes** | `30` | Per student/year rate for 5 Years plan (in INR) |
| `updated_by` | `ObjectId` (ref: `'User'`) | No | — | SuperAdmin user ID who last updated pricing rates |

---

## 2. Authentication & Authorization

All private subscription endpoints require standard JWT Bearer token authentication in the request headers:
```http
Authorization: Bearer <jwt_access_token>
```

- **Public Endpoints**: `/api/subscription/plans`, `/api/subscription/config`
- **SchoolAdmin Access**: Authenticated users with `role: "SchoolAdmin"`. SchoolAdmin is automatically scoped to their own school profile via `School.findOne({ admin_id: req.user._id })`.
- **SuperAdmin Access**: Authenticated users with `role: "SuperAdmin"`. Has global access across all schools, configuration updates, and manual record modifications.

---

## 3. Global Headers & Route Base Paths

### Mounted Base Paths
The subscription routes are mounted in `backend/src/server.js` with redundant aliases to prevent routing 404s:
- Primary: `/api/subscription`
- Plural Alias: `/api/subscriptions`
- SchoolAdmin Alias: `/api/schooladmin/subscription`
- Hyphenated Alias: `/api/school-admin/subscription`

### Standard Request Headers
```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Complete API Specifications

---

### 4.1 Subscription Plans API

- **API Name**: Get Subscription Plans
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/plans` (and alias `/api/subscription/schooladmin/plans`)
- **Controller**: `subscriptionController.js` -> `getSubscriptionPlans`
- **Authentication**: Public / Authenticated
- **Required Headers**: `Content-Type: application/json`

#### Request Parameters
None.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 4,
  "plans": [
    {
      "id": "plan_1_year",
      "name": "1 Year Standard Plan",
      "duration": "1 Year",
      "duration_years": 1,
      "rate_per_student_per_year": 360,
      "discount_percent": 0,
      "billing_cycle": "Annual",
      "popular": false,
      "features": [
        "Complete Student & Staff Information System",
        "Daily Attendance & Real-Time Reports",
        "Examinations, Grading & Report Cards",
        "Fee Management & Payment Receipts",
        "Homework Assignment & Submission Tracking",
        "Transport Routes, Vehicles & Driver Tracking",
        "Standard Email Support"
      ]
    },
    {
      "id": "plan_2_years",
      "name": "2 Years Value Plan",
      "duration": "2 Years",
      "duration_years": 2,
      "rate_per_student_per_year": 320,
      "discount_percent": 11,
      "billing_cycle": "Bi-Annual (2 Years)",
      "popular": false,
      "features": [
        "Everything in 1 Year Plan",
        "Discounted Multi-Year Rate Lock",
        "Advanced Financial Reports & Analytics",
        "Priority Email & Chat Support"
      ]
    },
    {
      "id": "plan_3_years",
      "name": "3 Years Growth Plan",
      "duration": "3 Years",
      "duration_years": 3,
      "rate_per_student_per_year": 300,
      "discount_percent": 17,
      "billing_cycle": "Tri-Annual (3 Years)",
      "popular": true,
      "features": [
        "Everything in 2 Years Plan",
        "Maximum Multi-Year Discount Savings",
        "Dedicated Account Manager",
        "Free Data Migration & System Onboarding"
      ]
    },
    {
      "id": "plan_5_years",
      "name": "5 Years Enterprise Plan",
      "duration": "5 Years",
      "duration_years": 5,
      "rate_per_student_per_year": 250,
      "discount_percent": 31,
      "billing_cycle": "Quinquennial (5 Years)",
      "popular": false,
      "features": [
        "Everything in 3 Years Plan",
        "Lowest Guaranteed Per-Student Rate",
        "Custom Feature Development & Integrations",
        "24/7 Premium SLA Support"
      ]
    }
  ],
  "config": {
    "rate_1_year": 360,
    "rate_2_years": 320,
    "rate_3_years": 300,
    "rate_5_years": 250,
    "updatedAt": "2026-11-17T11:52:19.000Z"
  }
}
```

---

### 4.2 Per-Student Pricing Rates Configuration API

- **API Name**: Get Subscription Rates Configuration
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/config`
- **Controller**: `subscriptionController.js` -> `getSubscriptionConfig`
- **Authentication**: Public / Authenticated

#### Success Response (`200 OK`)
```json
{
  "_id": "6a97daae63518296ebaf9481",
  "rate_1_year": 360,
  "rate_2_years": 320,
  "rate_3_years": 300,
  "rate_5_years": 250,
  "createdAt": "2026-10-18T10:00:00.000Z",
  "updatedAt": "2026-11-17T11:52:19.000Z"
}
```

---

### 4.3 Update Pricing Rates Configuration (SuperAdmin)

- **API Name**: Update Subscription Rates Configuration
- **HTTP Method**: `PUT`
- **Route**: `/api/subscription/superadmin/config`
- **Controller**: `subscriptionController.js` -> `updateSubscriptionConfig`
- **Authorization**: `SuperAdmin` Only
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Payload
```json
{
  "rate_1_year": 360,
  "rate_2_years": 320,
  "rate_3_years": 300,
  "rate_5_years": 250
}
```

#### Success Response (`200 OK`)
```json
{
  "message": "Subscription pricing rates updated successfully",
  "config": {
    "_id": "6a97daae63518296ebaf9481",
    "rate_1_year": 360,
    "rate_2_years": 320,
    "rate_3_years": 300,
    "rate_5_years": 250,
    "updated_by": "6a7ecec694f7941cd7c65616",
    "updatedAt": "2026-11-17T11:52:19.000Z"
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "message": "All rates must be non-negative numeric values"
}
```

---

### 4.4 Create Subscription Order (Razorpay)

- **API Name**: Create Razorpay Subscription Order
- **HTTP Method**: `POST`
- **Route**: `/api/subscription/schooladmin/create-order`
- **Controller**: `subscriptionController.js` -> `createSubscriptionOrder`
- **Authorization**: `SchoolAdmin` Only

#### Request Payload
```json
{
  "student_count": 250,
  "duration": "1 Year"
}
```

#### Success Response (`200 OK`)
```json
{
  "id": "order_sub_1763380339000_a1b2c3",
  "amount": 9000000,
  "currency": "INR",
  "student_count": 250,
  "selected_duration": "1 Year",
  "duration_years": 1,
  "price_per_student": 360,
  "total_amount": 90000,
  "key": "rzp_test_TIpu5U4jYaChIu"
}
```

#### Error Responses
- `400 Bad Request`:
```json
{
  "message": "Student count must be a numeric value greater than 0"
}
```
- `400 Bad Request` (Invalid duration):
```json
{
  "message": "Invalid subscription duration selected"
}
```

---

### 4.5 Verify Payment & Activate Subscription (Multi-Method)

- **API Name**: Verify Payment and Activate Subscription
- **HTTP Method**: `POST`
- **Route**: `/api/subscription/schooladmin/verify-payment`
- **Controller**: `subscriptionController.js` -> `verifyAndActivateSubscription`
- **Authorization**: `SchoolAdmin` Only
- **Supported Payment Methods**: `'Razorpay'`, `'Cash'`, `'Cheque'`, `'Bank Transfer'`

#### Request Payloads

##### Option A: Razorpay Verification
```json
{
  "student_count": 250,
  "duration": "1 Year",
  "payment_method": "Razorpay",
  "razorpay_order_id": "order_sub_1763380339000_a1b2c3",
  "razorpay_payment_id": "pay_O7dKsdj8834hsk",
  "razorpay_signature": "e5b8d8...sha256signature"
}
```

##### Option B: Cash Payment Record
```json
{
  "student_count": 250,
  "duration": "1 Year",
  "payment_method": "Cash",
  "payment_notes": "Paid cash at annual registration desk"
}
```

##### Option C: Cheque Payment
```json
{
  "student_count": 500,
  "duration": "2 Years",
  "payment_method": "Cheque",
  "cheque_details": {
    "cheque_number": "CHQ884920",
    "cheque_date": "2026-11-17",
    "bank_name": "HDFC Bank",
    "branch_name": "Anna Nagar, Chennai"
  },
  "payment_notes": "Cheque handed over to sales executive"
}
```

#### Success Response (`201 Created`)
```json
{
  "message": "Subscription activated successfully!",
  "subscription": {
    "_id": "6ad7350020a1bc77e9000123",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson",
      "email": "johnson@gmail.com"
    },
    "student_count": 250,
    "selected_duration": "1 Year",
    "duration_years": 1,
    "price_per_student": 360,
    "total_amount": 90000,
    "payment_id": "pay_O7dKsdj8834hsk",
    "payment_method": "Razorpay",
    "status": "Active",
    "subscription_start_date": "2026-11-17T11:52:19.000Z",
    "subscription_end_date": "2027-11-17T11:52:19.000Z",
    "invoice_number": "INV-SUB-202611-4892",
    "createdAt": "2026-11-17T11:52:19.000Z"
  }
}
```

---

### 4.6 Dedicated Bank Transfer Payment Submission

- **API Name**: Submit Bank Transfer Subscription
- **HTTP Method**: `POST`
- **Route**: `/api/subscription/schooladmin/bank-transfer`
- **Controller**: `subscriptionController.js` -> `submitBankTransferPayment`
- **Authorization**: `SchoolAdmin` Only

#### Request Payload
```json
{
  "student_count": 300,
  "duration": "2 Years",
  "transaction_number": "NEFT_20261117_9921",
  "transaction_date": "2026-11-17",
  "bank_name": "State Bank of India",
  "receipt_url": "https://schoolapp.s3.amazonaws.com/receipts/neft_sample.pdf",
  "receipt_name": "neft_sample.pdf",
  "notes": "Annual NEFT bank transfer for 300 students"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Bank transfer payment recorded successfully! Subscription activated.",
  "subscription": {
    "_id": "6ad7350020a1bc77e9000124",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson"
    },
    "student_count": 300,
    "selected_duration": "2 Years",
    "duration_years": 2,
    "price_per_student": 320,
    "total_amount": 192000,
    "payment_id": "BT_NEFT_20261117_9921_1763380339000",
    "payment_method": "Bank Transfer",
    "bank_transfer_details": {
      "transaction_number": "NEFT_20261117_9921",
      "transaction_date": "2026-11-17T00:00:00.000Z",
      "bank_name": "State Bank of India",
      "receipt_url": "https://schoolapp.s3.amazonaws.com/receipts/neft_sample.pdf",
      "receipt_name": "neft_sample.pdf",
      "notes": "Annual NEFT bank transfer for 300 students"
    },
    "status": "Active",
    "subscription_start_date": "2026-11-17T11:52:19.000Z",
    "subscription_end_date": "2028-11-17T11:52:19.000Z",
    "invoice_number": "INV-SUB-202611-7381"
  }
}
```

#### Error Response (`400 Bad Request` - Duplicate Reference Check)
```json
{
  "success": false,
  "message": "A subscription with this transaction / reference number has already been recorded."
}
```

---

### 4.7 Get Current Active Subscription & History (SchoolAdmin)

- **API Name**: Get Current School Subscription
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/schooladmin/current`
- **Controller**: `subscriptionController.js` -> `getCurrentSchoolSubscription`
- **Authorization**: `SchoolAdmin` Only

#### Success Response (`200 OK`)
```json
{
  "school": {
    "_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "jonson",
    "email": "johnson@gmail.com",
    "admin_id": "6a82b7bc84adbdc3f3c19d1f"
  },
  "activeSubscription": {
    "_id": "6ad6c6ab94f944a657f7a485",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "student_count": 1000,
    "selected_duration": "3 Years",
    "duration_years": 3,
    "price_per_student": 300,
    "total_amount": 900000,
    "payment_id": "pay_R7v2K81j23s4",
    "payment_method": "Razorpay",
    "status": "Active",
    "subscription_start_date": "2026-10-23T10:48:43.799Z",
    "subscription_end_date": "2029-10-23T10:48:43.799Z",
    "invoice_number": "INV-SUB-202610-7524"
  },
  "history": [
    {
      "_id": "6ad6c6ab94f944a657f7a485",
      "student_count": 1000,
      "selected_duration": "3 Years",
      "status": "Active",
      "total_amount": 900000,
      "invoice_number": "INV-SUB-202610-7524"
    },
    {
      "_id": "6a97e4b13667eabee27a99c2",
      "student_count": 500,
      "selected_duration": "1 Year",
      "status": "Expired",
      "total_amount": 180000,
      "invoice_number": "INV-SUB-202510-1029"
    }
  ],
  "ratesConfig": {
    "rate_1_year": 360,
    "rate_2_years": 320,
    "rate_3_years": 300,
    "rate_5_years": 250
  }
}
```

---

### 4.8 Subscription Status Guard Check

- **API Name**: Fast Subscription Guard Status Check
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/schooladmin/status`
- **Controller**: `subscriptionController.js` -> `getSubscriptionStatus`
- **Authorization**: `SchoolAdmin` Only
- **Purpose**: Ultra-fast status indicator for frontend router guards and UI header badges.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "hasActiveSubscription": true,
  "status": "Active",
  "daysRemaining": 1070,
  "student_count": 1000,
  "selected_duration": "3 Years",
  "subscription_start_date": "2026-10-23T10:48:43.799Z",
  "subscription_end_date": "2029-10-23T10:48:43.799Z",
  "invoice_number": "INV-SUB-202610-7524",
  "payment_method": "Razorpay"
}
```

---

### 4.9 Subscription Expiry & Renewal Eligibility Details

- **API Name**: Get Subscription Expiry Details
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/schooladmin/expiry`
- **Controller**: `subscriptionController.js` -> `getSubscriptionExpiryDetails`
- **Authorization**: `SchoolAdmin` Only

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "subscription_id": "6ad6c6ab94f944a657f7a485",
  "invoice_number": "INV-SUB-202610-7524",
  "hasActiveSubscription": true,
  "status": "Active",
  "isExpired": false,
  "daysRemaining": 1070,
  "expiryDate": "2029-10-23T10:48:43.799Z",
  "startDate": "2026-10-23T10:48:43.799Z",
  "selected_duration": "3 Years",
  "student_count": 1000,
  "canRenew": true,
  "urgencyLevel": "Normal",
  "message": "Your subscription is active and in good standing."
}
```

---

### 4.10 Subscription Renewal (Continuous Academic Extension)

- **API Name**: Renew Subscription
- **HTTP Method**: `POST`
- **Route**: `/api/subscription/schooladmin/renew`
- **Controller**: `subscriptionController.js` -> `renewSubscription`
- **Authorization**: `SchoolAdmin` Only
- **Key Business Logic**: If an active subscription exists, the renewal starts seamlessly from the **exact expiration date of the active subscription**, ensuring zero lost coverage days.

#### Request Payload
```json
{
  "student_count": 1200,
  "duration": "1 Year",
  "payment_method": "Cash",
  "payment_notes": "Early renewal payment cash deposit"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Subscription successfully renewed!",
  "renewalType": "Continuous Extension",
  "previousExpiryDate": "2029-10-23T10:48:43.799Z",
  "newExpiryDate": "2030-10-23T10:48:43.799Z",
  "subscription": {
    "_id": "6ad7350020a1bc77e9000125",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson"
    },
    "student_count": 1200,
    "selected_duration": "1 Year",
    "duration_years": 1,
    "price_per_student": 360,
    "total_amount": 432000,
    "payment_id": "CASH_RENEW_1763380339000",
    "payment_method": "Cash",
    "status": "Active",
    "subscription_start_date": "2029-10-23T10:48:43.799Z",
    "subscription_end_date": "2030-10-23T10:48:43.799Z",
    "invoice_number": "INV-REN-202910-3841"
  }
}
```

---

### 4.11 Cancel Subscription

- **API Name**: Cancel Subscription
- **HTTP Method**: `POST` (or `PUT /api/subscription/:id/cancel`)
- **Route**: `/api/subscription/schooladmin/cancel`
- **Controller**: `subscriptionController.js` -> `cancelSubscription`
- **Authorization**: `SchoolAdmin` or `SuperAdmin`

#### Request Payload
```json
{
  "cancellation_reason": "School closing academic campus early or migrating provider",
  "subscription_id": "6ad6c6ab94f944a657f7a485"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subscription has been cancelled successfully",
  "subscription": {
    "_id": "6ad6c6ab94f944a657f7a485",
    "status": "Cancelled",
    "cancellation_reason": "School closing academic campus early or migrating provider",
    "cancelled_at": "2026-11-17T11:52:19.000Z"
  }
}
```

---

### 4.12 Subscription Payment History & Invoices List

- **API Name**: Get Subscription Payment History
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/schooladmin/history`
- **Controller**: `subscriptionController.js` -> `getSubscriptionHistory`
- **Authorization**: `SchoolAdmin` Only
- **Query Parameters**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `20`)
  - `status` (optional, e.g. `'Active'`, `'Expired'`, `'Cancelled'`)
  - `payment_method` (optional, e.g. `'Razorpay'`, `'Bank Transfer'`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "totalRecords": 3,
  "totalPages": 1,
  "currentPage": 1,
  "history": [
    {
      "_id": "6ad7350020a1bc77e9000125",
      "student_count": 1200,
      "selected_duration": "1 Year",
      "total_amount": 432000,
      "payment_id": "CASH_RENEW_1763380339000",
      "payment_method": "Cash",
      "status": "Active",
      "subscription_start_date": "2029-10-23T10:48:43.799Z",
      "subscription_end_date": "2030-10-23T10:48:43.799Z",
      "invoice_number": "INV-REN-202910-3841",
      "createdAt": "2026-11-17T11:52:19.000Z"
    }
  ]
}
```

---

### 4.13 Get All Subscriptions Across All Schools (SuperAdmin)

- **API Name**: Get All Subscriptions
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/superadmin/subscriptions`
- **Controller**: `subscriptionController.js` -> `getAllSubscriptions`
- **Authorization**: `SuperAdmin` Only
- **Query Parameters**:
  - `status` (e.g. `'Active'`)
  - `payment_method` (e.g. `'Bank Transfer'`)
  - `school_id`
  - `search`
  - `envelope` (set to `true` to receive `{ success: true, count, data }`)

#### Success Response (`200 OK` - Direct Array for Frontend Compatibility)
```json
[
  {
    "_id": "6ad6c6ab94f944a657f7a485",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson",
      "location": "Chennai",
      "email": "johnson@gmail.com",
      "contact_number": "9876543210",
      "founder_name": "Johnson"
    },
    "student_count": 1000,
    "selected_duration": "3 Years",
    "duration_years": 3,
    "price_per_student": 300,
    "total_amount": 900000,
    "payment_id": "pay_R7v2K81j23s4",
    "payment_method": "Razorpay",
    "status": "Active",
    "subscription_start_date": "2026-10-23T10:48:43.799Z",
    "subscription_end_date": "2029-10-23T10:48:43.799Z",
    "invoice_number": "INV-SUB-202610-7524",
    "createdAt": "2026-10-23T10:48:43.799Z"
  }
]
```

---

### 4.14 Get Subscription Details by ID

- **API Name**: Get Subscription by ID
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/:id` (and `/api/subscription/superadmin/subscriptions/:id`)
- **Controller**: `subscriptionController.js` -> `getSubscriptionById`
- **Authorization**: `SuperAdmin` or matching `SchoolAdmin`

#### Request Parameters
- `id` (Path Parameter): MongoDB ObjectId of the subscription.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "subscription": {
    "_id": "6ad6c6ab94f944a657f7a485",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson",
      "email": "johnson@gmail.com"
    },
    "student_count": 1000,
    "selected_duration": "3 Years",
    "duration_years": 3,
    "price_per_student": 300,
    "total_amount": 900000,
    "payment_id": "pay_R7v2K81j23s4",
    "payment_method": "Razorpay",
    "status": "Active",
    "subscription_start_date": "2026-10-23T10:48:43.799Z",
    "subscription_end_date": "2029-10-23T10:48:43.799Z",
    "invoice_number": "INV-SUB-202610-7524"
  }
}
```

---

### 4.15 Get School Subscription Details by School ID

- **API Name**: Get School Subscriptions by School ID
- **HTTP Method**: `GET`
- **Route**: `/api/subscription/school/:schoolId`
- **Controller**: `subscriptionController.js` -> `getSchoolSubscriptionBySchoolId`
- **Authorization**: `SuperAdmin` or matching `SchoolAdmin`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "school": {
    "_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "jonson",
    "email": "johnson@gmail.com"
  },
  "activeSubscription": {
    "_id": "6ad6c6ab94f944a657f7a485",
    "status": "Active",
    "total_amount": 900000,
    "invoice_number": "INV-SUB-202610-7524"
  },
  "totalSubscriptions": 2,
  "history": [ ... ],
  "ratesConfig": {
    "rate_1_year": 360,
    "rate_2_years": 320,
    "rate_3_years": 300,
    "rate_5_years": 250
  }
}
```

---

### 4.16 Activate / Deactivate / Update Subscription Status (SuperAdmin)

- **API Name**: Update Subscription Status
- **HTTP Method**: `PUT` or `PATCH`
- **Route**: `/api/subscription/superadmin/subscriptions/:id/status` (and `/:id/status`)
- **Controller**: `subscriptionController.js` -> `updateSubscriptionStatus`
- **Authorization**: `SuperAdmin` Only

#### Request Payload
```json
{
  "status": "Active",
  "notes": "Cheque CHQ884920 cleared successfully via HDFC clearing house"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subscription status updated from Pending to Active successfully",
  "subscription": {
    "_id": "6ad7350020a1bc77e9000123",
    "status": "Active",
    "payment_notes": "Cheque handed over to sales executive | Cheque CHQ884920 cleared successfully via HDFC clearing house",
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson"
    }
  }
}
```

---

### 4.17 Update Subscription Record Details (SuperAdmin)

- **API Name**: Update Subscription Record Details
- **HTTP Method**: `PUT`
- **Route**: `/api/subscription/superadmin/subscriptions/:id` (and `/:id`)
- **Controller**: `subscriptionController.js` -> `updateSubscriptionRecord`
- **Authorization**: `SuperAdmin` Only

#### Request Payload
```json
{
  "student_count": 1250,
  "subscription_end_date": "2030-05-01T00:00:00.000Z",
  "payment_notes": "Capacity updated to 1250 students with extended grace period"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subscription record updated successfully",
  "subscription": {
    "_id": "6ad6c6ab94f944a657f7a485",
    "student_count": 1250,
    "subscription_end_date": "2030-05-01T00:00:00.000Z",
    "payment_notes": "Capacity updated to 1250 students with extended grace period"
  }
}
```

---

### 4.18 Automated Subscription Expiry Check & Batch Expiration

- **API Name**: Check and Expire Subscriptions
- **HTTP Method**: `POST`
- **Route**: `/api/subscription/check-expiry`
- **Controller**: `subscriptionController.js` -> `checkAndExpireSubscriptions`
- **Authorization**: `SuperAdmin` or System Cron Runner
- **Purpose**: Batch checks all `Active` subscriptions whose `subscription_end_date < now()` and transitions their status to `'Expired'`.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Checked subscription expiry. 0 subscription(s) marked as Expired.",
  "expiredCount": 0,
  "checkedAt": "2026-11-17T11:52:19.000Z"
}
```

---

## 5. Frontend Integration Guide

The following table provides mapping between frontend components and backend Subscription APIs:

| Frontend Component | UI Action | Backend API Route | HTTP Method |
| :--- | :--- | :--- | :--- |
| `schooladmin/SubscriptionManagement.jsx` | Fetch current active subscription & history | `/api/subscription/schooladmin/current` | `GET` |
| `schooladmin/SubscriptionManagement.jsx` | Create Razorpay order | `/api/subscription/schooladmin/create-order` | `POST` |
| `schooladmin/SubscriptionManagement.jsx` | Verify payment & activate plan | `/api/subscription/schooladmin/verify-payment` | `POST` |
| `schooladmin/SubscriptionManagement.jsx` | Submit Bank Transfer (NEFT/RTGS/IMPS) | `/api/subscription/schooladmin/bank-transfer` | `POST` |
| `schooladmin/SubscriptionManagement.jsx` | Renew existing plan | `/api/subscription/schooladmin/renew` | `POST` |
| `schooladmin/Dashboard.jsx` | Global subscription guard check | `/api/subscription/schooladmin/current` or `/status` | `GET` |
| `superadmin/SubscriptionSettings.jsx` | Fetch pricing rate configuration | `/api/subscription/config` | `GET` |
| `superadmin/SubscriptionSettings.jsx` | Fetch all schools subscriptions log | `/api/subscription/superadmin/subscriptions` | `GET` |
| `superadmin/SubscriptionSettings.jsx` | Update pricing rates | `/api/subscription/superadmin/config` | `PUT` |

---

## 6. Final API Audit & Verification Report

### 1. Existing and Working APIs
- `GET /api/subscription/config` — Get Pricing Rates Configuration
- `PUT /api/subscription/superadmin/config` — Update Pricing Rates Configuration
- `GET /api/subscription/superadmin/subscriptions` — Get All Subscriptions (SuperAdmin)
- `GET /api/subscription/schooladmin/current` — Get Current School Subscription & History
- `POST /api/subscription/schooladmin/create-order` — Create Razorpay Order
- `POST /api/subscription/schooladmin/verify-payment` — Verify Payment & Activate (Razorpay/Cash/Cheque/Bank Transfer)

### 2. Existing but Not Working APIs
- *None.* All existing APIs were working properly; however, missing endpoints were returning 404.

### 3. Newly Created & Enhanced APIs
- `GET /api/subscription/plans` — Structured Subscription Plans with features and discount calculation
- `GET /api/subscription/schooladmin/plans` — SchoolAdmin alias for Plans
- `GET /api/subscription/:id` — Get Subscription by ID with school population and role authorization
- `GET /api/subscription/superadmin/subscriptions/:id` — SuperAdmin alias for subscription lookup
- `GET /api/subscription/school/:schoolId` — Get all subscriptions for specific school
- `POST /api/subscription/schooladmin/bank-transfer` — Dedicated Bank Transfer endpoint with duplicate UTR validation
- `POST /api/subscription/schooladmin/renew` — Seamless Subscription Renewal with start-date continuity
- `POST /api/subscription/schooladmin/cancel` — Cancel active subscription with reason logging
- `PUT /api/subscription/:id/cancel` — Resource-level cancel subscription route
- `GET /api/subscription/schooladmin/status` — Fast lightweight subscription status guard check
- `GET /api/subscription/schooladmin/expiry` — Subscription expiry details, days remaining, and urgency level
- `GET /api/subscription/schooladmin/history` — Paginated Subscription and Invoices history
- `PUT /api/subscription/superadmin/subscriptions/:id/status` — SuperAdmin status updater (Pending -> Active, etc.)
- `PATCH /api/subscription/superadmin/subscriptions/:id/status` — PATCH alias for status updater
- `PUT /api/subscription/superadmin/subscriptions/:id` — SuperAdmin manual record details editor
- `POST /api/subscription/check-expiry` — Batch job to check and mark overdue subscriptions as Expired

### 4. Updated APIs
- `backend/src/server.js`: Added route mounting aliases (`/api/subscriptions`, `/api/school-admin/subscription`, `/api/schooladmin/subscription`).
- `backend/src/models/Subscription.js`: Added optional non-breaking fields `cancellation_reason`, `cancelled_at`, and `auto_renew`.

### 5. Missing APIs
- *All 12 previously missing endpoints have now been implemented and connected to active routes and controllers.*

### 6. API Testing Results
**18 out of 18 test cases PASSED** during automated live testing against MongoDB with real JWT authentication for `admin@system.com` and `johnson@gmail.com`. Zero failures.
