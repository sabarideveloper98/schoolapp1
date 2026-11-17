# Attendance API – Request, Response and Error Details

This document provides complete, verified technical documentation and root cause analysis for all **Attendance APIs** in the School Management Application (School Admin, Teacher, Student, and Parent modules). It details the root cause of the **"Unnamed Error"**, the implemented fixes, the standardized request/response contracts, Postman testing examples, and status of all attendance endpoints.

---

## Table of Contents

1. [Investigation & Root Cause Analysis of "Unnamed Error"](#1-investigation--root-cause-analysis-of-unnamed-error)
2. [Attendance APIs Implementation Directory & Status](#2-attendance-apis-implementation-directory--status)
3. [Database Models & Entity Architecture](#3-database-models--entity-architecture)
4. [Standardized API Response Architecture](#4-standardized-api-response-architecture)
5. [Complete Attendance API Specifications](#5-complete-attendance-api-specifications)
   - [5.1 Get Staff / Teacher Attendance List (`GET /api/schooladmin/attendance`)](#51-get-staff--teacher-attendance-list-get-apischooladminattendance)
   - [5.2 Save / Bulk Mark Staff Attendance (`POST /api/schooladmin/attendance`)](#52-save--bulk-mark-staff-attendance-post-apischooladminattendance)
   - [5.3 Get Staff Attendance Report (`GET /api/schooladmin/attendance/report`)](#53-get-staff-attendance-report-get-apischooladminattendancereport)
   - [5.4 Get Student Attendance List (`GET /api/schooladmin/student-attendance`)](#54-get-student-attendance-list-get-apischooladminstudent-attendance)
   - [5.5 Save / Bulk Mark Student Attendance (`POST /api/schooladmin/student-attendance`)](#55-save--bulk-mark-student-attendance-post-apischooladminstudent-attendance)
   - [5.6 Get Student Attendance Report (`GET /api/schooladmin/student-attendance/report`)](#56-get-student-attendance-report-get-apischooladminstudent-attendancereport)
   - [5.7 Student Portal Attendance Report (`GET /api/student/attendance/report`)](#57-student-portal-attendance-report-get-apistudentattendancereport)
   - [5.8 Teacher Portal Attendance APIs (`POST /api/teacher/attendance` & `GET /api/teacher/attendance/report`)](#58-teacher-portal-attendance-apis)
   - [5.9 Parent Portal Attendance API (`GET /api/parent/attendance`)](#59-parent-portal-attendance-api)
6. [Supported Attendance Data Fields](#6-supported-attendance-data-fields)
7. [Postman Testing Collection & Verification Results](#7-postman-testing-collection--verification-results)
8. [Summary of Files Modified](#8-summary-of-files-modified)

---

## 1. Investigation & Root Cause Analysis of "Unnamed Error"

### The Issue
When calling the School Admin Attendance APIs (such as `GET /api/schooladmin/student-attendance` or `GET /api/schooladmin/attendance`), API clients and frontend users intermittently received an **"Unnamed Error"**.

### Root Cause Identified

1. **Non-Standard HTTP Status Code 550**:
   In `backend/src/controllers/attendanceController.js`, lines 79 and 299 previously returned:
   ```javascript
   res.status(550).json({ message: 'Server error', error: error.message });
   ```
   - In the official HTTP specifications (RFC 9110 / IANA HTTP Status Code Registry), **status 550 does not exist**. HTTP status 550 is an SMTP email protocol code (*"Requested action not taken: mailbox unavailable"*).
   - In Node.js's standard `http` module:
     ```javascript
     http.STATUS_CODES[500] // => 'Internal Server Error'
     http.STATUS_CODES[550] // => undefined
     ```
   - Because `http.STATUS_CODES[550]` is `undefined`, the server emitted an HTTP response line with an empty reason phrase (`HTTP/1.1 550 `).
   - **Postman and other API testing tools literally display `Status: 550 (Unnamed Error)`** whenever a status code has no recognized IANA reason phrase.
   - In browser environments using Axios or Fetch, `response.statusText` is empty, leading frontends or error interceptors to display "Unnamed Error" or generic failure toasts.

2. **Fragile School Resolution in `getSchoolId`**:
   The controller helper `getSchoolId` was previously implemented as:
   ```javascript
   const getSchoolId = async (adminId) => {
       const school = await School.findOne({ admin_id: adminId });
       if (!school) throw new Error('School not found for this admin');
       return school._id;
   };
   ```
   If an administrator logged in whose `School` record referenced them via a tenant proxy, direct `user.school_id`, or if `School.admin_id` did not match `req.user._id` directly, `getSchoolId` threw `School not found for this admin`.
   This unhandled exception fell through to the catch block which emitted `550 (Unnamed Error)`.

3. **Unhandled Parameter Cast Errors**:
   When parameters such as `class_id`, `student_id`, or `user_id` were omitted or passed with invalid hexadecimal formats (e.g. `'undefined'`, `'null'`), Mongoose threw an unhandled `CastError`:
   `Cast to ObjectId failed for value "undefined" at path "class_id"`.
   This triggered the catch block and returned `550`.

4. **Frontend Toast Error Masking**:
   In `StudentAttendance.jsx`, `StaffAttendance.jsx`, `StudentReport.jsx`, and `StaffReport.jsx`, the fetch catch blocks previously hardcoded generic messages (e.g., `toast.error('Failed to fetch student attendance logs')`), masking the exact backend error details.

---

### Root Causes Fixed

1. **Eliminated HTTP Status 550**: Replaced all occurrences with standard HTTP status codes:
   - `200 OK` for successful fetches and updates.
   - `400 Bad Request` for missing or invalid query parameters and malformed dates.
   - `404 Not Found` when school, class, or student records do not exist.
   - `422 Unprocessable Entity` for schema validation errors.
   - `500 Internal Server Error` for unexpected database/server faults.
2. **Hardened `getSchoolId`**: Added secondary lookup on `User.school_id` and tenant fallback before throwing, eliminating false-positive school resolution errors.
3. **Strict Parameter Validation**: Added `mongoose.Types.ObjectId.isValid()` checks and `parseAndNormalizeDate()` safeguards to reject malformed parameters with clean 400 errors instead of throwing `CastError`.
4. **Standardized Error Envelope**: Implemented `sendErrorResponse` helper emitting `{ success: false, message, error: { code, details } }`.
5. **Enhanced Frontend Toasts**: Updated frontend catch blocks to extract `error.response?.data?.message || error.response?.data?.error?.details || error.message`.

---

## 2. Attendance APIs Implementation Directory & Status

| # | API Name | Route / Endpoint | HTTP Method | Target Persona | Status |
|---|----------|------------------|-------------|----------------|--------|
| 1 | **Staff Attendance List** | `/api/schooladmin/attendance` | `GET` | School Admin | **Implemented & Active** |
| 2 | **Staff Attendance Save / Bulk** | `/api/schooladmin/attendance` | `POST` | School Admin | **Implemented & Active** |
| 3 | **Staff Attendance Report** | `/api/schooladmin/attendance/report` | `GET` | School Admin | **Implemented & Active** |
| 4 | **Student Attendance List** | `/api/schooladmin/student-attendance` | `GET` | School Admin | **Implemented & Active** |
| 5 | **Student Attendance Save / Bulk** | `/api/schooladmin/student-attendance` | `POST` | School Admin | **Implemented & Active** |
| 6 | **Student Attendance Report** | `/api/schooladmin/student-attendance/report` | `GET` | School Admin | **Implemented & Active** |
| 7 | **Student Login Attendance Report** | `/api/student/attendance/report` | `GET` | Student | **Implemented & Active** |
| 8 | **Teacher Mark Student Attendance** | `/api/teacher/attendance` | `POST` | Teacher | **Implemented & Active** |
| 9 | **Teacher Attendance Report** | `/api/teacher/attendance/report` | `GET` | Teacher | **Implemented & Active** |
| 10 | **Parent Child Attendance API** | `/api/parent/attendance` | `GET` | Parent | **Implemented & Active** |
| 11 | **Dedicated Single Student Update API** | `/api/schooladmin/student-attendance/:id` | `PATCH` | School Admin | *Not Needed* (Handled via Bulk `/api/schooladmin/student-attendance`) |
| 12 | **Dedicated Biometric Ingest API** | `/api/schooladmin/attendance/biometric` | `POST` | School Admin | *Missing / Not Implemented* |

---

## 3. Database Models & Entity Architecture

The Attendance module persists data across two specialized Mongoose collections using tenant isolation:

```mermaid
erDiagram
    SCHOOL ||--o{ STUDENT_ATTENDANCE : partitions
    CLASS ||--o{ STUDENT_ATTENDANCE : associates
    STUDENT_ATTENDANCE ||--|{ STUDENT_ATTENDANCE_RECORD : contains
    STUDENT ||--o{ STUDENT_ATTENDANCE_RECORD : logs

    SCHOOL ||--o{ STAFF_ATTENDANCE : partitions
    STAFF_ATTENDANCE ||--|{ STAFF_ATTENDANCE_RECORD : contains
    USER ||--o{ STAFF_ATTENDANCE_RECORD : logs

    STUDENT_ATTENDANCE {
        ObjectId _id PK
        ObjectId school_id FK
        ObjectId class_id FK
        Date date "UTC Midnight"
        string academic_year "default: 2026-2027"
        ObjectId created_by FK
        ObjectId updated_by FK
        Date createdAt
        Date updatedAt
    }

    STUDENT_ATTENDANCE_RECORD {
        ObjectId student_id FK
        string name
        string admission_number
        string roll_no
        string status "Present, Absent, Leave, Late, Half Day, Holiday"
        string remarks
    }

    STAFF_ATTENDANCE {
        ObjectId _id PK
        ObjectId school_id FK
        Date date "UTC Midnight"
        string role_filter "Teacher, Staff"
        string academic_year "default: 2026-2027"
        string notify_via "Do not send, SMS, Email"
        ObjectId created_by FK
        ObjectId updated_by FK
        Date createdAt
        Date updatedAt
    }

    STAFF_ATTENDANCE_RECORD {
        ObjectId user_id FK
        string name
        string role "Teacher, Staff"
        string status "Present, Absent, Leave, Late, Half Day, Holiday"
        string in_time "e.g. 09:00 AM"
        string out_time "e.g. 05:00 PM"
        string remarks
    }
```

### Collection Compound Indexes
- **Student Attendance**: `{ school_id: 1, class_id: 1, date: 1 }` (Unique). Exactly one attendance document per class per day.
- **Staff Attendance**: `{ school_id: 1, date: 1, role_filter: 1 }` (Unique). Exactly one attendance document per personnel role per day.

---

## 4. Standardized API Response Architecture

To ensure consistent responses without breaking existing clients, all Attendance APIs adhere to backward-compatible envelopes.

### Standard Success Response Pattern (200 / 201)
```json
{
  "success": true,
  "message": "Student attendance retrieved successfully",
  "data": {
    "attendance": {},
    "records": [],
    "totalRecords": 0
  },
  "attendance": {},
  "records": []
}
```
*Note: Top-level legacy fields (`attendance`, `records`, `summary`) are preserved alongside the `data` wrapper for complete backward compatibility with existing frontend pages.*

### Standard Error Response Pattern (400, 401, 403, 404, 422, 500)
```json
{
  "success": false,
  "message": "Class ID and Date parameters are required",
  "error": {
    "code": "MISSING_REQUIRED_PARAMS",
    "details": "Class ID and Date parameters are required"
  }
}
```

---

## 5. Complete Attendance API Specifications

---

### 5.1 Get Staff / Teacher Attendance List (`GET /api/schooladmin/attendance`)

- **API Name**: Get Staff / Teacher Daily Attendance
- **Route / Endpoint**: `/api/schooladmin/attendance`
- **HTTP Method**: `GET`
- **Authentication**: Bearer Token required (`protect` middleware)
- **Authorized Role**: `SchoolAdmin`
- **Required Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `role` | String | Yes | Category of employee: `'Teacher'` or `'Staff'`. |
  | `date` | String | Yes | Date in `'YYYY-MM-DD'` format. |

#### Success Response (200 OK) — Existing Saved Record
```json
{
  "success": true,
  "message": "Staff attendance retrieved successfully",
  "_id": "6a91b2c3d4e5f6a012345678",
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "date": "2026-11-17T00:00:00.000Z",
  "role_filter": "Teacher",
  "notify_via": "Do not send",
  "records": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "08:45 AM",
      "out_time": "04:30 PM",
      "remarks": "On time"
    }
  ],
  "attendance": { ... },
  "data": {
    "attendance": { ... },
    "records": [ ... ],
    "totalRecords": 1
  }
}
```

#### Success Response (200 OK) — Template Auto-Generated
When no attendance has been recorded for the date, generates an active roster of teachers/staff initialized to `'Present'`:
```json
{
  "success": true,
  "message": "Template staff attendance list generated successfully",
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "date": "2026-11-17T00:00:00.000Z",
  "role_filter": "Teacher",
  "records": [ ... ],
  "notify_via": "Do not send",
  "data": {
    "totalRecords": 17
  }
}
```

#### Error Responses
- **400 Bad Request (Missing parameters)**:
  ```json
  {
    "success": false,
    "message": "Role and Date parameters are required",
    "error": { "code": "MISSING_REQUIRED_PARAMS", "details": "Role and Date parameters are required" }
  }
  ```
- **400 Bad Request (Invalid role)**:
  ```json
  {
    "success": false,
    "message": "Role parameter must be either \"Teacher\" or \"Staff\"",
    "error": { "code": "INVALID_ROLE", "details": "Role parameter must be either \"Teacher\" or \"Staff\"" }
  }
  ```

---

### 5.2 Save / Bulk Mark Staff Attendance (`POST /api/schooladmin/attendance`)

- **API Name**: Save / Bulk Mark Staff Attendance
- **Route / Endpoint**: `/api/schooladmin/attendance`
- **HTTP Method**: `POST`
- **Authentication**: Bearer Token required (`protect` middleware)
- **Authorized Role**: `SchoolAdmin`
- **Request Body**:
```json
{
  "role": "Teacher",
  "date": "2026-11-17",
  "notify_via": "SMS",
  "academic_year": "2026-2027",
  "records": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "08:45 AM",
      "out_time": "04:30 PM",
      "remarks": "Present in session"
    },
    {
      "user_id": "6a8400a1ef78578a90316730",
      "name": "Priya Sharma",
      "role": "Teacher",
      "status": "Leave",
      "in_time": "-",
      "out_time": "-",
      "remarks": "Approved medical leave"
    }
  ]
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "attendance": {
    "_id": "6a91b2c3d4e5f6a012345678",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "date": "2026-11-17T00:00:00.000Z",
    "role_filter": "Teacher",
    "academic_year": "2026-2027",
    "notify_via": "SMS",
    "records": [ ... ]
  },
  "data": {
    "totalRecords": 2
  }
}
```

---

### 5.3 Get Staff Attendance Report (`GET /api/schooladmin/attendance/report`)

- **API Name**: Get Staff Attendance Report
- **Route / Endpoint**: `/api/schooladmin/attendance/report`
- **HTTP Method**: `GET`
- **Authentication**: Bearer Token required
- **Query Parameters**:
  - `role` (Optional): `'Teacher'` or `'Staff'`.
  - `month` & `year` (Conditional): Month (`1-12`) and Year (`2026`).
  - `week_start` (Conditional): ISO date (`YYYY-MM-DD`).
  - `user_id` (Optional): If provided, returns date-by-date attendance for this individual employee.

#### Success Response (200 OK) — Overview Mode
`GET /api/schooladmin/attendance/report?role=Teacher&month=11&year=2026`
```json
{
  "success": true,
  "message": "Staff attendance overview report retrieved successfully",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-11-30T23:59:59.999Z",
  "summary": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "present": 22,
      "absent": 1,
      "rate": 96
    }
  ],
  "data": {
    "summary": [ ... ],
    "totalRecords": 17
  }
}
```

---

### 5.4 Get Student Attendance List (`GET /api/schooladmin/student-attendance`)

- **API Name**: Get Class Student Daily Attendance
- **Route / Endpoint**: `/api/schooladmin/student-attendance`
- **HTTP Method**: `GET`
- **Authentication**: Bearer Token required
- **Query Parameters**:
  - `class_id` (String, Required): MongoDB ObjectId of the Class / Section.
  - `date` (String, Required): Date in `'YYYY-MM-DD'`.

#### Success Response (200 OK)
`GET /api/schooladmin/student-attendance?class_id=6a840119ef78578a90316739&date=2026-11-17`
```json
{
  "success": true,
  "message": "Student attendance retrieved successfully",
  "school_name": "Jonson International School",
  "attendance": {
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-11-17T00:00:00.000Z",
    "records": [
      {
        "student_id": "6737512a5779c17e3ef42299",
        "name": "Aarav Sharma",
        "admission_number": "ADM2026001",
        "roll_no": "101",
        "photo": "",
        "status": "Present",
        "remarks": ""
      }
    ]
  },
  "records": [ ... ],
  "data": {
    "school_name": "Jonson International School",
    "totalRecords": 1
  }
}
```

---

### 5.5 Save / Bulk Mark Student Attendance (`POST /api/schooladmin/student-attendance`)

- **API Name**: Save / Bulk Mark Student Attendance
- **Route / Endpoint**: `/api/schooladmin/student-attendance`
- **HTTP Method**: `POST`
- **Authentication**: Bearer Token required
- **Request Body**:
```json
{
  "class_id": "6a840119ef78578a90316739",
  "date": "2026-11-17",
  "academic_year": "2026-2027",
  "records": [
    {
      "student_id": "6737512a5779c17e3ef42299",
      "name": "Aarav Sharma",
      "admission_number": "ADM2026001",
      "roll_no": "101",
      "status": "Present",
      "remarks": "On time"
    },
    {
      "student_id": "6737514f5779c17e3ef422b2",
      "name": "Ananya Patel",
      "admission_number": "ADM2026002",
      "roll_no": "102",
      "status": "Half Day",
      "remarks": "Left after lunch"
    }
  ]
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "attendance": {
    "_id": "6a99ce81ef78578a90316880",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-11-17T00:00:00.000Z",
    "academic_year": "2026-2027",
    "records": [ ... ]
  },
  "data": {
    "totalRecords": 2
  }
}
```

---

### 5.6 Get Student Attendance Report (`GET /api/schooladmin/student-attendance/report`)

- **API Name**: Get Class Student Attendance Report
- **Route / Endpoint**: `/api/schooladmin/student-attendance/report`
- **HTTP Method**: `GET`
- **Authentication**: Bearer Token required
- **Query Parameters**:
  - `class_id` (String, Required): Class ObjectId.
  - `month` & `year` (Conditional): Month (`1-12`) and Year (`2026`).
  - `week_start` (Conditional): ISO date (`YYYY-MM-DD`).
  - `student_id` (Optional): If provided, returns date-by-date attendance for this individual student.

#### Success Response (200 OK) — Class Overview Mode
`GET /api/schooladmin/student-attendance/report?class_id=6a840119ef78578a90316739&month=11&year=2026`
```json
{
  "success": true,
  "message": "Student attendance class overview report retrieved successfully",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-11-30T23:59:59.999Z",
  "summary": [
    {
      "student_id": "6737512a5779c17e3ef42299",
      "name": "Aarav Sharma",
      "roll_no": "101",
      "admission_number": "ADM2026001",
      "present": 21,
      "absent": 1,
      "rate": 95
    }
  ],
  "data": {
    "summary": [ ... ],
    "totalRecords": 1
  }
}
```

---

### 5.7 Student Portal Attendance Report (`GET /api/student/attendance/report`)

- **API Name**: Student Self Attendance Report
- **Route / Endpoint**: `/api/student/attendance/report`
- **HTTP Method**: `GET`
- **Authentication**: Bearer Token required (`protect`, `authorize('Student')`)
- **Security Check**: Enforces access control; student can only access their own attendance records.

---

### 5.8 Teacher Portal Attendance APIs

- **Mark Attendance**: `POST /api/teacher/attendance`
  - Validates that the class is authorized for the logged-in teacher.
  - Records student attendance array with upsert.
- **Attendance Report**: `GET /api/teacher/attendance/report?class_id={id}&month={m}&year={y}`
  - Returns flattened attendance records and summary statistics (`total`, `present`, `absent`, `leave`, `halfDay`).

---

### 5.9 Parent Portal Attendance API

- **Get Child Attendance**: `GET /api/parent/attendance` & `GET /api/parent/attendance/:studentId`
  - Returns attendance history and percentage for children linked to the parent account.

---

## 6. Supported Attendance Data Fields

| Field Name | Type | Model Location | Supported Values / Description |
|------------|------|----------------|--------------------------------|
| `student_id` | ObjectId | `StudentAttendance.records` | Reference to `Student` collection. |
| `name` | String | `StudentAttendance.records` / `StaffAttendance.records` | Name of the student or staff member. |
| `admission_number` | String | `StudentAttendance.records` | Official school admission number. |
| `roll_no` | String | `StudentAttendance.records` | Class roll number. |
| `class_id` | ObjectId | `StudentAttendance` | Reference to `Class` collection. |
| `section_id` | ObjectId / String | Embedded in `Class` model | Identified via the `Class` collection's `section` attribute. |
| `academic_year` | String | `StudentAttendance` / `StaffAttendance` | e.g. `'2026-2027'`. |
| `date` | Date | `StudentAttendance` / `StaffAttendance` | UTC Midnight date. |
| `status` | String | Subdocument `records[].status` | Enum: `'Present'`, `'Absent'`, `'Leave'`, `'Late'`, `'Half Day'`, `'Holiday'`. |
| `in_time` | String | `StaffAttendance.records` | e.g. `'08:45 AM'`. |
| `out_time` | String | `StaffAttendance.records` | e.g. `'04:30 PM'`. |
| `remarks` | String | Subdocument `records[].remarks` | Text notes. |
| `created_by` | ObjectId | `StudentAttendance` / `StaffAttendance` | User ID who initially marked attendance. |
| `updated_by` | ObjectId | `StudentAttendance` / `StaffAttendance` | User ID who last updated attendance. |

---

## 7. Postman Testing Collection & Verification Results

### Postman Examples

#### 1. Fetch Daily Student Attendance
```http
GET {{baseUrl}}/api/schooladmin/student-attendance?class_id=6a840119ef78578a90316739&date=2026-11-17
Headers:
  Authorization: Bearer {{adminToken}}
```

#### 2. Save / Bulk Mark Student Attendance
```http
POST {{baseUrl}}/api/schooladmin/student-attendance
Headers:
  Authorization: Bearer {{adminToken}}
  Content-Type: application/json

Body:
{
  "class_id": "6a840119ef78578a90316739",
  "date": "2026-11-17",
  "academic_year": "2026-2027",
  "records": [
    {
      "student_id": "6737512a5779c17e3ef42299",
      "name": "Aarav Sharma",
      "admission_number": "ADM2026001",
      "roll_no": "101",
      "status": "Present",
      "remarks": "On time"
    }
  ]
}
```

#### 3. Fetch Monthly Student Attendance Report
```http
GET {{baseUrl}}/api/schooladmin/student-attendance/report?class_id=6a840119ef78578a90316739&month=11&year=2026
Headers:
  Authorization: Bearer {{adminToken}}
```

#### 4. Fetch Staff Attendance List
```http
GET {{baseUrl}}/api/schooladmin/attendance?role=Teacher&date=2026-11-17
Headers:
  Authorization: Bearer {{adminToken}}
```

#### 5. Save Staff Attendance
```http
POST {{baseUrl}}/api/schooladmin/attendance
Headers:
  Authorization: Bearer {{adminToken}}
  Content-Type: application/json

Body:
{
  "role": "Teacher",
  "date": "2026-11-17",
  "notify_via": "SMS",
  "records": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "08:45 AM",
      "out_time": "04:30 PM",
      "remarks": "On time"
    }
  ]
}
```

---

### Empirical Verification Test Suite Results

Live database testing was executed against MongoDB Atlas:

```text
Connecting to MongoDB...
MongoDB Connected: ac-j0brx1l-shard-00-00.higxfum.mongodb.net
Fetching test admin user and school...
Using admin user: johnson@gmail.com (6a82b7bc84adbdc3f3c19d1f)
Using school: jonson (6a82b7bc84adbdc3f3c19d20)
Using class: 12 - A (6a840119ef78578a90316739)

--- TEST 1: GET Staff Attendance (Role: Teacher) ---
Status: 200 | Success: true | Message: Template staff attendance list generated successfully | Records: 17

--- TEST 2: POST Save Staff Attendance ---
Status: 200 | Success: true | Message: Attendance saved successfully | Saved records: 1

--- TEST 3: GET Staff Attendance Report ---
Status: 200 | Success: true | Summary count: 17

--- TEST 4: GET Student Attendance (Class Template / Existing) ---
Status: 200 | Success: true | Message: Template student attendance list generated successfully | Records: 1

--- TEST 5: POST Save Student Attendance ---
Status: 200 | Success: true | Message: Attendance saved successfully | Saved totalRecords: 1

--- TEST 6: GET Student Attendance Report ---
Status: 200 | Success: true | Summary count: 1

--- TEST 7: ERROR CASES (Verifying NO 550 or Unnamed Errors) ---
Missing class_id       -> Status: 400 | Code: MISSING_REQUIRED_PARAMS | Message: Class ID and Date parameters are required
Invalid class_id format-> Status: 400 | Code: INVALID_CLASS_ID        | Message: Invalid class_id parameter format
Invalid date format    -> Status: 400 | Code: INVALID_DATE_FORMAT     | Message: Invalid date format. Please provide a valid date string (e.g. YYYY-MM-DD)
Invalid role           -> Status: 400 | Code: INVALID_ROLE            | Message: Role parameter must be either "Teacher" or "Staff"

ALL TESTS EXECUTED SUCCESSFULLY (Zero 550 codes emitted)!
```

---

## 8. Summary of Files Modified

| File Path | Description of Changes |
|-----------|------------------------|
| [`backend/src/controllers/attendanceController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/attendanceController.js) | Removed HTTP 550 status codes; added `sendErrorResponse` helper; hardened `getSchoolId`; validated `class_id`, `date`, `role`; standardized success/error JSON response envelopes with backward compatibility. |
| [`backend/src/models/StudentAttendance.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/StudentAttendance.js) | Added `'Holiday'` to status enum; added optional `academic_year`, `created_by`, `updated_by` fields. |
| [`backend/src/models/StaffAttendance.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/StaffAttendance.js) | Added `'Leave'`, `'Late'`, `'Half Day'`, `'Holiday'` to status enum; added `remarks`; added optional `academic_year`, `created_by`, `updated_by`. |
| [`frontend/src/pages/schooladmin/StudentAttendance.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StudentAttendance.jsx) | Updated catch blocks in `fetchAttendance` and `handleSaveAttendance` to display actual backend error details instead of generic messages. |
| [`frontend/src/pages/schooladmin/StaffAttendance.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StaffAttendance.jsx) | Updated catch blocks in `fetchAttendance` and `handleSaveAttendance` to display actual backend error details. |
| [`frontend/src/pages/schooladmin/StudentReport.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StudentReport.jsx) | Updated catch block in `fetchReport` to display exact API error messages. |
| [`frontend/src/pages/schooladmin/StaffReport.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StaffReport.jsx) | Updated catch block in `fetchReport` to display exact API error messages. |
| [`SCHOOL_ADMIN_ATTENDANCE_API_DOCUMENTATION.md`](file:///Users/sabari/Documents/git/schoolapp/SCHOOL_ADMIN_ATTENDANCE_API_DOCUMENTATION.md) | Created complete technical documentation, Postman requests, payload schemas, and root cause analysis. |
