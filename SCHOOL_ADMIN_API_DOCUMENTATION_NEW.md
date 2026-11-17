# School Admin API Documentation

This document is the official, implementation-verified API contract for all **School Admin** endpoints in the School Management System. All endpoints, parameters, request payloads, response objects, data types, and error responses documented herein reflect the active backend source code and empirical live API responses.

---

## Table of Contents

1. [Authentication & Global Headers](#1-authentication--global-headers)
2. [School Admin Authentication & Profile](#2-school-admin-authentication--profile)
   - [2.1 School Admin Dedicated Login](#21-school-admin-dedicated-login)
   - [2.2 Get School Admin Profile](#22-get-school-admin-profile)
3. [Dashboard Overview & Statistics](#3-dashboard-overview--statistics)
   - [3.1 Get School Admin Dashboard Overview](#31-get-school-admin-dashboard-overview)
4. [Teacher Management](#4-teacher-management)
   - [4.1 Get All Teachers List](#41-get-all-teachers-list)
   - [4.2 Create Teacher Profile](#42-create-teacher-profile)
   - [4.3 Update Teacher Profile](#43-update-teacher-profile)
   - [4.4 Delete Teacher Profile](#44-delete-teacher-profile)
   - [4.5 Bulk Import Teachers](#45-bulk-import-teachers)
5. [Staff Management](#5-staff-management)
   - [5.1 Get Staff List](#51-get-staff-list)
   - [5.2 Create New Staff Member](#52-create-new-staff-member)
   - [5.3 Update Staff Profile](#53-update-staff-profile)
   - [5.4 Delete Staff Member](#54-delete-staff-member)
6. [Subject Management](#6-subject-management)
   - [6.1 Get Subjects List](#61-get-subjects-list)
   - [6.2 Create New Subject](#62-create-new-subject)
   - [6.3 Update Subject](#63-update-subject)
   - [6.4 Delete Subject](#64-delete-subject)
7. [Class & Section Management](#7-class--section-management)
   - [7.1 Get Classes & Sections List](#71-get-classes--sections-list)
   - [7.2 Create New Class & Section](#72-create-new-class--section)
   - [7.3 Update Class Details](#73-update-class-details)
   - [7.4 Delete Class & Section](#74-delete-class--section)
8. [Teacher & Subject Assignments](#8-teacher--subject-assignments)
   - [8.1 Get Class Subject Teacher Assignments](#81-get-class-subject-teacher-assignments)
   - [8.2 Assign Subject Teacher to Class](#82-assign-subject-teacher-to-class)
   - [8.3 Update Class Subject Assignment](#83-update-class-subject-assignment)
   - [8.4 Remove Subject Teacher Assignment](#84-remove-subject-teacher-assignment)
9. [Student Management](#9-student-management)
   - [9.1 Get Students List](#91-get-students-list)
   - [9.2 Create Student Profile & Parent Account](#92-create-student-profile--parent-account)
   - [9.3 Update Student Information](#93-update-student-information)
   - [9.4 Delete Student Profile](#94-delete-student-profile)
   - [9.5 Bulk Import Students](#95-bulk-import-students)
10. [Staff & Teacher Attendance](#10-staff--teacher-attendance)
    - [10.1 Get Staff / Teacher Attendance List](#101-get-staff--teacher-attendance-list)
    - [10.2 Save / Update Staff Attendance Records](#102-save--update-staff-attendance-records)
    - [10.3 Get Staff Attendance Summary Report](#103-get-staff-attendance-summary-report)
11. [Student Attendance Management](#11-student-attendance-management)
    - [11.1 Get Class Student Attendance List](#111-get-class-student-attendance-list)
    - [11.2 Save / Update Student Attendance Records](#112-save--update-student-attendance-records)
    - [11.3 Get Student Attendance Summary Report](#113-get-student-attendance-summary-report)
    - [11.4 Attendance Module Entity Relationships](#114-attendance-module-entity-relationships)
    - [11.5 Attendance Discovery Checklist & Implementation Status](#115-attendance-discovery-checklist--implementation-status)
12. [Exams & Marks Entry](#12-exams--marks-entry)
    - [12.1 Get Examinations List](#121-get-examinations-list)
    - [12.2 Create New Examination](#122-create-new-examination)
    - [12.3 Get Students Exam Marks](#123-get-students-exam-marks)
    - [12.4 Save Student Exam Marks](#124-save-student-exam-marks)
    - [12.5 Bulk Import Exam Marks](#125-bulk-import-exam-marks)
    - [12.6 Get Examination Summary Report](#126-get-examination-summary-report)
13. [Payroll & Salary Management](#13-payroll--salary-management)
    - [13.1 Get Staff Salary Setup List](#131-get-staff-salary-setup-list)
    - [13.2 Save / Update Staff Salary Setup](#132-save--update-staff-salary-setup)
    - [13.3 Fetch Monthly Payroll Draft](#133-fetch-monthly-payroll-draft)
    - [13.4 Save Monthly Payroll Records](#134-save-monthly-payroll-records)
    - [13.5 Get Processed Payroll List](#135-get-processed-payroll-list)
    - [13.6 Update Payroll Payment Status](#136-update-payroll-payment-status)
    - [13.7 Get Payroll Dashboard Stats](#137-get-payroll-dashboard-stats)
14. [Fee Management](#14-fee-management)
    - [14.1 Get Fee Categories List](#141-get-fee-categories-list)
    - [14.2 Create Fee Category](#142-create-fee-category)
    - [14.3 Get Fee Structures](#143-get-fee-structures)
    - [14.4 Create Fee Structure](#144-create-fee-structure)
    - [14.5 Collect Student Fee Payment](#145-collect-student-fee-payment)
    - [14.6 Get Fee Dashboard Overview](#146-get-fee-dashboard-overview)
15. [School Finance & Expenses](#15-school-finance--expenses)
    - [15.1 Get Expense Categories](#151-get-expense-categories)
    - [15.2 Get Expenses List](#152-get-expenses-list)
    - [15.3 Create Expense Record](#153-create-expense-record)
    - [15.4 Get Income List](#154-get-income-list)
    - [15.5 Create Income Record](#155-create-income-record)
    - [15.6 Get Financial Dashboard Stats](#156-get-financial-dashboard-stats)
16. [Error Responses](#16-error-responses)
17. [Validation Rules](#17-validation-rules)
18. [Security Notes](#18-security-notes)

---

## 1. Authentication & Global Headers

Protected School Admin endpoints under `/api/schooladmin/*` require JWT Bearer Token authorization with `SchoolAdmin` role privileges.

```http
Authorization: Bearer <your_school_admin_jwt_token>
Content-Type: application/json
```

---

## 2. School Admin Authentication & Profile

### 2.1 School Admin Dedicated Login

Authenticates a School Admin user using email/phone and password, returning JWT access and refresh tokens.

- **Endpoint**: `POST /api/auth/login` (Also accessible at `POST /api/auth/login`)
- **Access**: Public
- **Authentication**: None
- **Request Headers**:
  ```http
  Content-Type: application/json
  ```
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "email": "johnson@gmail.com",
    "password": "123456"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contactInput` (`email` / `phone` / `mobile` / `username` / `identifier`) | String | Yes | School Admin login credential. |
| `password` | String | Yes | Plaintext password. |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "School Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6a82b7bc84adbdc3f3c19d1f",
    "name": "School Admin",
    "email": "johnson@gmail.com",
    "phone": "9876543210",
    "role": "SchoolAdmin",
    "status": "Active",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
}
```

#### Response Fields
| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `success` | Boolean | No | Operation status boolean (`true`). |
| `message` | String | No | Confirmation message. |
| `token` / `accessToken` | String | No | JWT Access token string. |
| `refreshToken` | String | No | Refresh token string. |
| `user._id` | String | No | MongoDB User ObjectId. |
| `user.email` | String | No | Registered admin email address. |
| `user.role` | String | No | User role string (`"SchoolAdmin"`). |
| `user.school_id` | String | Yes | Associated School ObjectId. |

---

### 2.2 Get School Admin Profile

Retrieves profile details and associated school information for the authenticated admin.

- **Endpoint**: `GET /api/schooladmin/profile` (Aliases: `/me`, `/auth/profile`)
- **Access**: Private (SchoolAdmin)
- **Authentication**: `Authorization: Bearer <admin_token>`
- **Request Body**: No request body required.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "School Admin profile retrieved successfully",
  "user": {
    "_id": "6a82b7bc84adbdc3f3c19d1f",
    "name": "School Admin",
    "email": "johnson@gmail.com",
    "phone": "9876543210",
    "role": "SchoolAdmin",
    "status": "Active",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  },
  "school": {
    "_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "jonson",
    "email": "jonson@gmail.com"
  }
}
```

---

## 3. Dashboard Overview & Statistics

### 3.1 Get School Admin Dashboard Overview

Retrieves aggregated statistical metrics including total count of teachers, students, classes, subjects, drivers, and buses.

- **Endpoint**: `GET /api/schooladmin/dashboard`
- **Access**: Private (SchoolAdmin)
- **Authentication**: `Authorization: Bearer <admin_token>`
- **Request Body**: No request body required.

#### Success Response (200 OK)
```json
{
  "totalTeachers": 13,
  "totalStudents": 4,
  "totalClasses": 3,
  "totalSubjects": 10,
  "totalStaff": 1,
  "totalDrivers": 4,
  "totalBuses": 1
}
```

#### Response Fields
| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `totalTeachers` | Number | No | Total teachers count in school. |
| `totalStudents` | Number | No | Total active students count in school. |
| `totalClasses` | Number | No | Total classes count configured. |
| `totalSubjects` | Number | No | Total academic subjects configured. |
| `totalStaff` | Number | No | Total non-teaching staff count. |
| `totalDrivers` | Number | No | Total transport drivers count. |
| `totalBuses` | Number | No | Total transport vehicles count. |

---

## 4. Teacher Management

### 4.1 Get All Teachers List

Retrieves complete teacher profiles populated with school details and photo URLs.

- **Endpoint**: `GET /api/schooladmin/teachers`
- **Access**: Private (SchoolAdmin)
- **Authentication**: `Authorization: Bearer <admin_token>`

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a83fed2ef78578a9031672f",
    "id": "6a83fed2ef78578a9031672f",
    "name": "arun",
    "email": "arun@gmail.com",
    "phone": "6758940987",
    "address": "chennai",
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6,
    "photo": "https://api.example.com/uploads/teachers/arun.jpg",
    "domains": ["maths", "science"],
    "user_id": "6a83fed2ef78578a9031672e",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "createdAt": "2026-08-18T06:42:26.399Z",
    "updatedAt": "2026-09-30T18:45:57.181Z",
    "__v": 0
  }
]
```

---

### 4.2 Create Teacher Profile

Creates a new teacher document and linked User login account.

- **Endpoint**: `POST /api/schooladmin/teachers`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Kavitha Krishnan",
    "email": "kavitha.teacher@school.com",
    "phone": "9876125931",
    "address": "45 Lake Road",
    "qualification": "M.Sc Physics",
    "experience": 5,
    "domains": ["Physics", "Science"],
    "password": "123456"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Teacher's full name. |
| `email` | String | Yes | Unique login email address. |
| `phone` | String | Yes | Contact phone number. |
| `address` | String | Yes | Residence address. |
| `qualification` | String | Yes | Highest academic qualification. |
| `experience` | Number | Yes | Teaching experience in years. |

#### Success Response (201 Created)
```json
{
  "message": "Teacher created successfully",
  "teacher": {
    "_id": "6abd7000a3dfbfc4d5449c70",
    "name": "Kavitha Krishnan",
    "email": "kavitha.teacher@school.com",
    "phone": "9876125931",
    "qualification": "M.Sc Physics",
    "experience": 5,
    "domains": ["Physics", "Science"],
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "user_id": "6abd7000a3dfbfc4d5449c6f"
  }
}
```

---

### 4.3 Update Teacher Profile

- **Endpoint**: `PUT /api/schooladmin/teachers/:id`
- **Access**: Private (SchoolAdmin)

---

### 4.4 Delete Teacher Profile

- **Endpoint**: `DELETE /api/schooladmin/teachers/:id`
- **Access**: Private (SchoolAdmin)

---

### 4.5 Bulk Import Teachers

- **Endpoint**: `POST /api/schooladmin/teachers/bulk-import`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "teachers": [
      {
        "teacher_name": "Ramesh Sundaram",
        "email": "ramesh@school.com",
        "phone": "9876533945",
        "qualification": "M.Sc Maths",
        "experience": 4,
        "subjects": "Mathematics, Science"
      }
    ]
  }
  ```

---

## 5. Staff Management

### 5.1 Get Staff List

- **Endpoint**: `GET /api/schooladmin/staff`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6ab21fc3c5ca856a445592fc",
    "id": "6ab21fc3c5ca856a445592fc",
    "name": "Sundar Staff",
    "email": "sundar@school.com",
    "phone": "9876543210",
    "role": "Office Staff",
    "address": "123 Main Road",
    "qualification": "B.Com",
    "experience": 4,
    "photo": null,
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "user_id": "6ab21fc3c5ca856a445592fb"
  }
]
```

---

### 5.2 Create New Staff Member

- **Endpoint**: `POST /api/schooladmin/staff`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Sundar Staff",
    "email": "sundar@school.com",
    "phone": "9876543210",
    "role": "Office Staff",
    "address": "123 Main Road",
    "qualification": "B.Com",
    "experience": 4,
    "password": "123456"
  ```

---

### 5.3 Staff Role Management

#### 5.3.1 Get All Staff Roles
- **Endpoint**: `GET /api/schooladmin/staff-roles`
- **Query Params**: `status` (`Active` | `Inactive`), `search` (text search)
- **Access**: Private (SchoolAdmin)
- Auto-seeds default roles (`Driver`, `Peon`, `Accountant`, `Librarian`, `Security`, `Office Assistant`, `Cleaner`, `Clerk`) if none exist for the school. Includes calculated `staffCount` for each role.

#### 5.3.2 Create Staff Role
- **Endpoint**: `POST /api/schooladmin/staff-roles`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Librarian",
    "description": "Library cataloging and book issue management",
    "status": "Active"
  }
  ```

#### 5.3.3 Update Staff Role
- **Endpoint**: `PUT /api/schooladmin/staff-roles/:id`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Head Librarian",
    "description": "Supervises library resources and staff",
    "status": "Active"
  }
  ```
- *Note*: If the role name is changed, all associated staff records are automatically updated.

#### 5.3.4 Toggle Staff Role Status
- **Endpoint**: `PATCH /api/schooladmin/staff-roles/:id/toggle-status`
- **Access**: Private (SchoolAdmin)
- Toggles role status between `Active` and `Inactive`.

#### 5.3.5 Delete Staff Role
- **Endpoint**: `DELETE /api/schooladmin/staff-roles/:id`
- **Access**: Private (SchoolAdmin)
- *Note*: Roles with assigned staff members cannot be deleted until reassigned.

---

### 5.4 Common Subject Management (Under Staff Information)

#### 5.4.1 Get All Common Subjects
- **Endpoint**: `GET /api/schooladmin/common-subjects`
- **Query Params**: `status` (`Active` | `Inactive`), `search` (text search)
- **Access**: Private (SchoolAdmin)
- Auto-seeds standard subjects (`Tamil`, `English`, `Mathematics`, `Science`, `Social Science`, `Computer Science`) and syncs existing school subjects. Returns live `teacherCount` for each subject.

#### 5.4.2 Create Common Subject
- **Endpoint**: `POST /api/schooladmin/common-subjects`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Physics",
    "code": "PHY101",
    "description": "Mechanics, Thermodynamics, and Electromagnetism",
    "status": "Active"
  }
  ```

#### 5.4.3 Update Common Subject
- **Endpoint**: `PUT /api/schooladmin/common-subjects/:id`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Advanced Physics",
    "code": "PHY201",
    "description": "Quantum mechanics and modern physics",
    "status": "Active"
  }
  ```
- *Note*: Cascades subject name updates to teachers' assigned domains.

#### 5.4.4 Toggle Common Subject Status
- **Endpoint**: `PATCH /api/schooladmin/common-subjects/:id/toggle-status`
- **Access**: Private (SchoolAdmin)
- Toggles subject status between `Active` and `Inactive`. Only Active subjects appear in the Add Teacher dropdown.

#### 5.4.5 Delete Common Subject
- **Endpoint**: `DELETE /api/schooladmin/common-subjects/:id`
- **Access**: Private (SchoolAdmin)
- *Note*: Subjects assigned to active teachers are protected from deletion until unassigned.

---

## 6. Subject Management

### 6.1 Get Subjects List

- **Endpoint**: `GET /api/schooladmin/subjects`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a82c138f177defe112928ce",
    "name": "MATHS",
    "code": "MATH101",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  },
  {
    "_id": "6a8400afef78578a90316732",
    "name": "Language",
    "code": "TAM101",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
]
```

---

### 6.2 Create New Subject

- **Endpoint**: `POST /api/schooladmin/subjects`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Social Science",
    "code": "SOC101"
  }
  ```

#### Success Response (201 Created)
```json
{
  "message": "Subject created",
  "subject": {
    "_id": "6abd7100a3dfbfc4d5449c80",
    "name": "Social Science",
    "code": "SOC101",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
}
```

---

## 7. Class & Section Management

### 7.1 Get Classes & Sections List

- **Endpoint**: `GET /api/schooladmin/classes`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a82c159f177defe112928d0",
    "class": "class 1",
    "section": "A",
    "no_student": 0,
    "class_incharge_id": {
      "_id": "6a83fed2ef78578a9031672f",
      "name": "arun",
      "email": "arun@gmail.com"
    },
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
]
```

---

### 7.2 Create New Class & Section

- **Endpoint**: `POST /api/schooladmin/classes`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "standard": "class 3",
    "section": "A",
    "class_incharge_id": "6a83fed2ef78578a9031672f"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `standard` | String | Yes | Class / Standard designation (maps to `class` in model). |
| `section` | String | Yes | Section identifier (e.g. `"A"`). |
| `class_incharge_id` | String | No | ObjectId reference to Teacher incharge. |

---

## 8. Teacher & Subject Assignments

### 8.1 Get Class Subject Teacher Assignments

- **Endpoint**: `GET /api/schooladmin/assignments`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a8401a3ef78578a90316741",
    "class_id": {
      "_id": "6a840119ef78578a90316739",
      "class": "class 1",
      "section": "B"
    },
    "subject_id": {
      "_id": "6a8400c8ef78578a90316734",
      "name": "Science",
      "code": "SCE101"
    },
    "teacher_id": {
      "_id": "6a83fed2ef78578a9031672f",
      "name": "arun",
      "email": "arun@gmail.com"
    },
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
]
```

---

### 8.2 Assign Subject Teacher to Class

- **Endpoint**: `POST /api/schooladmin/assignments`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "class_id": "6a82c159f177defe112928d0",
    "subject_id": "6a8400c8ef78578a90316734",
    "teacher_id": "6a83fed2ef78578a9031672f"
  }
  ```

---

## 9. Student Management

### 9.1 Get Students List

- **Endpoint**: `GET /api/schooladmin/students`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind kumar",
    "first_name": "arvind",
    "last_name": "kumar",
    "roll_no": "101",
    "admission_number": "STDCLASS1SECB158E80",
    "parent_name": "siva",
    "parent_phone": "67890765444",
    "parent_email": "siva@gmail.com",
    "class_id": {
      "_id": "6a840119ef78578a90316739",
      "class": "class 1",
      "section": "B"
    },
    "parent_user_id": {
      "_id": "6a84052b93171b71e3158e7f",
      "email": "siva@gmail.com",
      "phone": "67890765444"
    }
  }
]
```

---

### 9.2 Create Student Profile & Parent Account

- **Endpoint**: `POST /api/schooladmin/students`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "first_name": "Oliver",
    "last_name": "Ullrich",
    "gender": "Male",
    "dob": "2016-05-15",
    "blood_group": "O+",
    "class_id": "6a840119ef78578a90316739",
    "guardian_name": "John Ullrich",
    "guardian_phone": "9876543210",
    "guardian_email": "john.ullrich@gmail.com",
    "guardian_relation": "Father"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `first_name` / `student_name` | String | Yes | Student's name. |
| `guardian_phone` / `parent_phone` | String | Yes | Guardian contact phone (creates Parent login). |
| `class_id` | String | Yes | ObjectId reference to assigned Class. |

---

## 10. Staff & Teacher Attendance

> [!NOTE]
> For the complete Attendance API specifications, standardized response envelopes, Postman collections, and root cause analysis of the "Unnamed Error" resolution, refer to [**`SCHOOL_ADMIN_ATTENDANCE_API_DOCUMENTATION.md`**](file:///Users/sabari/Documents/git/schoolapp/SCHOOL_ADMIN_ATTENDANCE_API_DOCUMENTATION.md).

The School Admin Attendance module manages daily check-in/check-out logs, absence tracking, and periodic attendance reports for teaching staff and non-teaching personnel. All operations are scoped by `school_id` and isolated per tenant.

---

### 10.1 Get Staff / Teacher Attendance List

- **API Name**: Get Staff / Teacher Attendance List
- **Purpose**: Retrieve the daily attendance record for staff or teachers on a specified date. If attendance has already been recorded for that date, the API returns the saved `StaffAttendance` document. If no record has been submitted yet, it dynamically builds and returns a pre-filled template containing all active teachers or staff in the school with default status `Present` (`09:00 AM` to `05:00 PM`).
- **HTTP Method**: `GET`
- **Endpoint**: `/api/schooladmin/attendance`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `getStaffAttendance` (`backend/src/controllers/attendanceController.js:24`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | String | Yes | Filter by employee role category: `"Teacher"` or `"Staff"`. |
| `date` | String | Yes | Attendance date in ISO format `"YYYY-MM-DD"` (e.g. `"2026-10-01"`). Normalized to UTC start of day. |

#### Request Payload
- None (HTTP GET request).

#### Success Response (200 OK) — Saved Attendance Document Found
Returned when attendance has already been saved for this date and role:
```json
{
  "_id": "6a91b2c3d4e5f6a012345678",
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "date": "2026-10-01T00:00:00.000Z",
  "role_filter": "Teacher",
  "notify_via": "Do not send",
  "records": [
    {
      "_id": "6a91b2c3d4e5f6a012345679",
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    },
    {
      "_id": "6a91b2c3d4e5f6a01234567a",
      "user_id": "6a8400a1ef78578a90316730",
      "name": "Priya Sharma",
      "role": "Teacher",
      "status": "Absent",
      "in_time": "-",
      "out_time": "-"
    }
  ],
  "createdAt": "2026-10-01T09:30:00.000Z",
  "updatedAt": "2026-10-01T09:30:00.000Z"
}
```

#### Success Response (200 OK) — Template Auto-Generated
Returned when no record has been created yet for this date; supplies full roster for initial marking:
```json
{
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "date": "2026-10-01T00:00:00.000Z",
  "role_filter": "Staff",
  "notify_via": "Do not send",
  "records": [
    {
      "user_id": "6ab21fc3c5ca856a445592fb",
      "name": "Sundar Staff",
      "role": "Staff",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    },
    {
      "user_id": "6ab21fc3c5ca856a445592fc",
      "name": "Ramesh Accountant",
      "role": "Staff",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request** (Missing required query parameters):
  ```json
  {
    "message": "Role and Date parameters are required"
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "message": "Not authorized, token failed"
  }
  ```
- **403 Forbidden**:
  ```json
  {
    "message": "Not authorized as SchoolAdmin"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Server error",
    "error": "Error details"
  }
  ```

#### Database Model & Fields
- **Collection**: `staffattendances` (`backend/src/models/StaffAttendance.js`)
- **Key Fields**: `school_id` (ObjectId, ref `School`), `date` (Date, normalized to UTC midnight), `role_filter` (String: `'Teacher'` | `'Staff'`), `notify_via` (String), `records` (Array of subdocuments: `user_id`, `name`, `role`, `status`, `in_time`, `out_time`).
- **Index**: Unique compound index on `{ school_id: 1, date: 1, role_filter: 1 }`.

---

### 10.2 Save / Update Staff Attendance Records

- **API Name**: Save / Update Staff Attendance
- **Purpose**: Create or bulk update attendance logs for staff or teachers on a specific date. The controller performs an atomic upsert (`findOneAndUpdate` with `{ upsert: true, new: true }`) on `{ school_id, date, role_filter }`.
- **HTTP Method**: `POST`
- **Endpoint**: `/api/schooladmin/attendance`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `saveStaffAttendance` (`backend/src/controllers/attendanceController.js:86`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Request Body Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | String | Yes | Category of personnel: `"Teacher"` or `"Staff"`. |
| `date` | String | Yes | Attendance date in `"YYYY-MM-DD"` format. |
| `notify_via` | String | No | Notification trigger (e.g. `"Do not send"`, `"SMS"`, `"Email"`). Default: `"Do not send"`. |
| `records` | Array of Objects | Yes | Non-empty array of employee attendance status entries. |
| `records[].user_id` | String (ObjectId) | Yes | User ObjectId of the teacher or staff member. |
| `records[].name` | String | Yes | Full name of the employee. |
| `records[].role` | String | Yes | `"Teacher"` or `"Staff"`. |
| `records[].status` | String | Yes | Attendance status: `"Present"` or `"Absent"`. |
| `records[].in_time` | String | No | Arrival timestamp string (default `"09:00 AM"`). |
| `records[].out_time` | String | No | Departure timestamp string (default `"05:00 PM"`). |

#### Request Payload Example
```json
{
  "role": "Teacher",
  "date": "2026-10-01",
  "notify_via": "Do not send",
  "records": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    },
    {
      "user_id": "6a8400a1ef78578a90316730",
      "name": "Priya Sharma",
      "role": "Teacher",
      "status": "Absent",
      "in_time": "-",
      "out_time": "-"
    }
  ]
}
```

#### Success Response (200 OK)
```json
{
  "attendance": {
    "_id": "6a91b2c3d4e5f6a012345678",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "date": "2026-10-01T00:00:00.000Z",
    "role_filter": "Teacher",
    "notify_via": "Do not send",
    "records": [
      {
        "_id": "6a91b2c3d4e5f6a012345679",
        "user_id": "6a83fed2ef78578a9031672f",
        "name": "Arun Kumar",
        "role": "Teacher",
        "status": "Present",
        "in_time": "09:00 AM",
        "out_time": "05:00 PM"
      },
      {
        "_id": "6a91b2c3d4e5f6a01234567a",
        "user_id": "6a8400a1ef78578a90316730",
        "name": "Priya Sharma",
        "role": "Teacher",
        "status": "Absent",
        "in_time": "-",
        "out_time": "-"
      }
    ],
    "createdAt": "2026-10-01T09:30:00.000Z",
    "updatedAt": "2026-10-01T09:30:00.000Z"
  },
  "message": "Attendance saved successfully"
}
```

#### Error Responses
- **400 Bad Request** (Missing mandatory payload fields):
  ```json
  {
    "message": "Role, Date, and Records are required"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Server error",
    "error": "Error details"
  }
  ```

---

### 10.3 Get Staff Attendance Summary Report

- **API Name**: Get Staff Attendance Report
- **Purpose**: Generates periodic aggregate reports and individual date-by-date attendance histories for staff and teachers. Supports:
  1. **Overview Summary Mode** (`user_id` omitted): Computes total `present` days, `absent` days, and attendance `rate` percentage across the date range for all staff or teachers.
  2. **Individual History Mode** (`user_id` specified): Iterates through every calendar date in the range, returning daily attendance state (`Present`, `Absent`, or `N/A`), along with arrival and departure times.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/schooladmin/attendance/report`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `getStaffAttendanceReport` (`backend/src/controllers/attendanceController.js:122`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | String | No | Role filter: `"Teacher"` or `"Staff"`. If omitted, includes all roles in overview mode. |
| `month` | String / Number | Conditional | Month index (`1` to `12`). Required with `year` when `week_start` is not provided. |
| `year` | String / Number | Conditional | Four-digit calendar year (e.g. `2026`). Required with `month`. |
| `week_start` | String | Conditional | Start date of 7-day period (`YYYY-MM-DD`). Required if `month`/`year` is not provided. |
| `user_id` | String (ObjectId) | No | Target employee User ID. If supplied, activates **Individual History Mode**. |

#### Success Response (200 OK) — Overview Summary Mode (`user_id` omitted)
`GET /api/schooladmin/attendance/report?role=Teacher&month=10&year=2026`
```json
{
  "startDate": "2026-10-01T00:00:00.000Z",
  "endDate": "2026-10-31T23:59:59.999Z",
  "summary": [
    {
      "user_id": "6a83fed2ef78578a9031672f",
      "name": "Arun Kumar",
      "role": "Teacher",
      "present": 22,
      "absent": 2,
      "rate": 92
    },
    {
      "user_id": "6a8400a1ef78578a90316730",
      "name": "Priya Sharma",
      "role": "Teacher",
      "present": 20,
      "absent": 4,
      "rate": 83
    }
  ]
}
```

#### Success Response (200 OK) — Individual History Mode (`user_id` specified)
`GET /api/schooladmin/attendance/report?user_id=6a83fed2ef78578a9031672f&month=10&year=2026`
```json
{
  "user_id": "6a83fed2ef78578a9031672f",
  "startDate": "2026-10-01T00:00:00.000Z",
  "endDate": "2026-10-31T23:59:59.999Z",
  "records": [
    {
      "date": "2026-10-01T00:00:00.000Z",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    },
    {
      "date": "2026-10-02T00:00:00.000Z",
      "status": "Absent",
      "in_time": "-",
      "out_time": "-"
    },
    {
      "date": "2026-10-03T00:00:00.000Z",
      "status": "N/A",
      "in_time": "-",
      "out_time": "-"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request** (Missing time window):
  ```json
  {
    "message": "Either month/year or week_start is required"
  }
  ```

---

## 11. Student Attendance Management

The Student Attendance module tracks daily and period-level classroom presence for students across grades and sections.

---

### 11.1 Get Class Student Attendance List

- **API Name**: Get Class Student Attendance List
- **Purpose**: Retrieve student attendance records for a specific class and date. If attendance has already been recorded, returns the saved `StudentAttendance` document with status and remarks. If no attendance exists for that date, it dynamically fetches all enrolled students in the class from the `Student` collection and returns an auto-generated template with all students set to `Present`.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/schooladmin/student-attendance`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `getStudentAttendance` (`backend/src/controllers/attendanceController.js:251`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `class_id` | String (ObjectId) | Yes | Class & Section ObjectId reference (`Class._id`). |
| `date` | String | Yes | Attendance date in `"YYYY-MM-DD"` format (e.g. `"2026-10-01"`). |

#### Request Payload
- None (HTTP GET request).

#### Success Response (200 OK) — Saved Attendance Document Found
`GET /api/schooladmin/student-attendance?class_id=6a840119ef78578a90316739&date=2026-10-01`
```json
{
  "school_name": "Green Valley High School",
  "attendance": {
    "_id": "6a92c3d4e5f6a01234567890",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-10-01T00:00:00.000Z",
    "records": [
      {
        "_id": "6a92c3d4e5f6a01234567891",
        "student_id": "6a84052b93171b71e3158e80",
        "name": "Oliver Ullrich",
        "admission_number": "ADM10123",
        "roll_no": "101",
        "status": "Present",
        "remarks": ""
      },
      {
        "_id": "6a92c3d4e5f6a01234567892",
        "student_id": "6a84052b93171b71e3158e81",
        "name": "Sophia Davis",
        "admission_number": "ADM10124",
        "roll_no": "102",
        "status": "Absent",
        "remarks": "Fever sick leave"
      }
    ],
    "createdAt": "2026-10-01T09:15:00.000Z",
    "updatedAt": "2026-10-01T09:15:00.000Z"
  }
}
```

#### Success Response (200 OK) — Template Auto-Generated from Class Roster
When attendance has not yet been recorded for the requested date:
```json
{
  "school_name": "Green Valley High School",
  "attendance": {
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-10-01T00:00:00.000Z",
    "records": [
      {
        "student_id": "6a84052b93171b71e3158e80",
        "name": "Oliver Ullrich",
        "admission_number": "ADM10123",
        "roll_no": "101",
        "photo": "https://example.com/photos/oliver.jpg",
        "status": "Present"
      },
      {
        "student_id": "6a84052b93171b71e3158e81",
        "name": "Sophia Davis",
        "admission_number": "ADM10124",
        "roll_no": "102",
        "photo": "",
        "status": "Present"
      }
    ]
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing class_id or date):
  ```json
  {
    "message": "Class ID and Date parameters are required"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Server error",
    "error": "Error details"
  }
  ```

#### Database Model & Fields
- **Collection**: `studentattendances` (`backend/src/models/StudentAttendance.js`)
- **Key Fields**: `school_id` (ObjectId, ref `School`), `class_id` (ObjectId, ref `Class`), `date` (Date, normalized to UTC midnight), `records` (Array of subdocuments: `student_id`, `name`, `admission_number`, `roll_no`, `status`, `remarks`).
- **Index**: Unique compound index on `{ school_id: 1, class_id: 1, date: 1 }`.

---

### 11.2 Save / Update Student Attendance Records

- **API Name**: Save / Update Student Attendance
- **Purpose**: Record or update attendance for all students in a class on a specific date. Uses `findOneAndUpdate` with `{ upsert: true, new: true }` keyed by `{ school_id, class_id, date }`.
- **HTTP Method**: `POST`
- **Endpoint**: `/api/schooladmin/student-attendance`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `saveStudentAttendance` (`backend/src/controllers/attendanceController.js:306`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Request Body Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `class_id` | String (ObjectId) | Yes | Target Class & Section ObjectId (`Class._id`). |
| `date` | String | Yes | Attendance date in `"YYYY-MM-DD"` format. |
| `records` | Array of Objects | Yes | Array of student attendance status entries. |
| `records[].student_id` | String (ObjectId) | Yes | Student ObjectId reference (`Student._id`). |
| `records[].name` | String | Yes | Student full name. |
| `records[].admission_number` | String | No | Official student admission number. |
| `records[].roll_no` | String | No | Student roll number. |
| `records[].status` | String | Yes | Status enum: `"Present"`, `"Absent"`, `"Leave"`, `"Late"`, `"Half Day"`. |
| `records[].remarks` | String | No | Optional notes or absence reason. Default `""`. |

#### Request Payload Example
```json
{
  "class_id": "6a840119ef78578a90316739",
  "date": "2026-10-01",
  "records": [
    {
      "student_id": "6a84052b93171b71e3158e80",
      "name": "Oliver Ullrich",
      "admission_number": "ADM10123",
      "roll_no": "101",
      "status": "Present",
      "remarks": ""
    },
    {
      "student_id": "6a84052b93171b71e3158e81",
      "name": "Sophia Davis",
      "admission_number": "ADM10124",
      "roll_no": "102",
      "status": "Absent",
      "remarks": "Medical leave - fever"
    }
  ]
}
```

#### Success Response (200 OK)
```json
{
  "attendance": {
    "_id": "6a92c3d4e5f6a01234567890",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-10-01T00:00:00.000Z",
    "records": [
      {
        "_id": "6a92c3d4e5f6a01234567891",
        "student_id": "6a84052b93171b71e3158e80",
        "name": "Oliver Ullrich",
        "admission_number": "ADM10123",
        "roll_no": "101",
        "status": "Present",
        "remarks": ""
      },
      {
        "_id": "6a92c3d4e5f6a01234567892",
        "student_id": "6a84052b93171b71e3158e81",
        "name": "Sophia Davis",
        "admission_number": "ADM10124",
        "roll_no": "102",
        "status": "Absent",
        "remarks": "Medical leave - fever"
      }
    ],
    "createdAt": "2026-10-01T09:15:00.000Z",
    "updatedAt": "2026-10-01T09:15:00.000Z"
  },
  "message": "Attendance saved successfully"
}
```

#### Error Responses
- **400 Bad Request** (Missing mandatory fields):
  ```json
  {
    "message": "Class ID, Date, and Records are required"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Server error",
    "error": "Error details"
  }
  ```

---

### 11.3 Get Student Attendance Summary Report

- **API Name**: Get Student Attendance Report
- **Purpose**: Generates attendance summary analytics and individual attendance histories for students in a specific class. Supports:
  1. **Class Overview Mode** (`student_id` omitted): Computes `present` days, `absent` days, and attendance `rate` percentage across the requested time window for each student enrolled in the class.
  2. **Individual Student Mode** (`student_id` specified): Loops through every date in the selected month or week, returning daily attendance status (`Present`, `Absent`, or `N/A`).
- **HTTP Method**: `GET`
- **Endpoint**: `/api/schooladmin/student-attendance/report`
- **Route File**: `backend/src/routes/schoolAdminRoutes.js`
- **Controller Function**: `getStudentAttendanceReport` (`backend/src/controllers/attendanceController.js:341`)
- **Access / Role**: Private (`SchoolAdmin` only)
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `class_id` | String (ObjectId) | Yes | Target Class & Section ObjectId (`Class._id`). |
| `month` | String / Number | Conditional | Month index (`1` to `12`). Required with `year` when `week_start` is not provided. |
| `year` | String / Number | Conditional | Four-digit calendar year (e.g. `2026`). Required with `month`. |
| `week_start` | String | Conditional | Start date of 7-day period (`YYYY-MM-DD`). Required if `month`/`year` is absent. |
| `student_id` | String (ObjectId) | No | Student ObjectId. If provided, activates **Individual Student Mode**. |

#### Success Response (200 OK) — Class Overview Mode (`student_id` omitted)
`GET /api/schooladmin/student-attendance/report?class_id=6a840119ef78578a90316739&month=10&year=2026`
```json
{
  "startDate": "2026-10-01T00:00:00.000Z",
  "endDate": "2026-10-31T23:59:59.999Z",
  "summary": [
    {
      "student_id": "6a84052b93171b71e3158e80",
      "name": "Oliver Ullrich",
      "roll_no": "101",
      "admission_number": "ADM10123",
      "present": 23,
      "absent": 1,
      "rate": 96
    },
    {
      "student_id": "6a84052b93171b71e3158e81",
      "name": "Sophia Davis",
      "roll_no": "102",
      "admission_number": "ADM10124",
      "present": 19,
      "absent": 5,
      "rate": 79
    }
  ]
}
```

#### Success Response (200 OK) — Individual Student Mode (`student_id` specified)
`GET /api/schooladmin/student-attendance/report?class_id=6a840119ef78578a90316739&student_id=6a84052b93171b71e3158e80&month=10&year=2026`
```json
{
  "student_id": "6a84052b93171b71e3158e80",
  "startDate": "2026-10-01T00:00:00.000Z",
  "endDate": "2026-10-31T23:59:59.999Z",
  "records": [
    {
      "date": "2026-10-01T00:00:00.000Z",
      "status": "Present"
    },
    {
      "date": "2026-10-02T00:00:00.000Z",
      "status": "Present"
    },
    {
      "date": "2026-10-03T00:00:00.000Z",
      "status": "Absent"
    },
    {
      "date": "2026-10-04T00:00:00.000Z",
      "status": "N/A"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request** (Missing Class ID):
  ```json
  {
    "message": "Class ID parameter is required"
  }
  ```
- **400 Bad Request** (Missing date parameters):
  ```json
  {
    "message": "Either month/year or week_start is required"
  }
  ```

---

### 11.4 Attendance Module Entity Relationships

The Attendance module integrates across core school administration entities as follows:

```
+---------------------------------------------------------------------------------------------------+
|                                            School Admin                                           |
| - Scopes all staff and student queries via school_id resolved from admin_id or JWT reference      |
+---------------------------------------------------------------------------------------------------+
                               |                                                 |
                               v                                                 v
+---------------------------------------------+   +-------------------------------------------------+
|            Staff & Teachers                 |   |                Class & Section                  |
| - Teacher & Staff profiles (User accounts)  |   | - Class standard (e.g. 10) & section (e.g. A)    |
| - Role filter ('Teacher' | 'Staff')         |   | - Class in-charge teacher designation           |
| - Records check-in / check-out times        |   | - Encapsulated inside Class ObjectId (class_id) |
+---------------------------------------------+   +-------------------------------------------------+
                       |                                                   |
                       v                                                   v
+---------------------------------------------+   +-------------------------------------------------+
|           StaffAttendance Document          |   |                 Enrolled Students               |
| - Index: { school_id, date, role_filter }   |   | - Students assigned to class_id                 |
| - Records: [{ user_id, status, in, out }]   |   | - Identified by student_id, roll_no, admission  |
+---------------------------------------------+   +-------------------------------------------------+
                       |                                                   |
                       v                                                   v
+---------------------------------------------+   +-------------------------------------------------+
|            Payroll Integration              |   |            StudentAttendance Document           |
| - StaffAttendance records are consumed by   |   | - Index: { school_id, class_id, date }          |
|   payrollController.js to compute payable   |   | - Records: [{ student_id, status, remarks }]    |
|   working days, paid leaves, and deductions |   | - Status: Present, Absent, Leave, Late          |
+---------------------------------------------+   +-------------------------------------------------+
                                                                           |
                                                                           v
                                                  +-------------------------------------------------+
                                                  |            Parent & Teacher Views               |
                                                  | - Teacher routes: markAttendance, getReport     |
                                                  | - Parent routes: getAttendance, today's summary |
                                                  +-------------------------------------------------+
```

#### Relational Connections & Cross-Module Behavior
1. **School Admin**: All operations derive `school_id` from the logged-in administrator's profile via `getSchoolId(req.user._id)`. No admin can access or modify attendance records of another institution.
2. **Academic Year & Dates**: Attendance dates are normalized to UTC start of day (`00:00:00.000Z`) to prevent timezone offset discrepancies between server and clients.
3. **Class & Section**: In this system, sections are first-class instances of the `Class` model (e.g. Class 10 Section A has its own unique `_id`). Specifying `class_id` fully resolves both the standard and section.
4. **Student**: Students enrolled in a class are populated automatically when generating attendance templates. Attendance percentages (`rate = Math.round((present / total) * 100)`) are aggregated on demand in reports.
5. **Teacher & Staff**: Both teachers and staff records are stored in `StaffAttendance` using `role_filter: "Teacher"` or `role_filter: "Staff"`. Teachers also have class-level attendance marking privileges through `/api/teacher/attendance`.
6. **Payroll Connection**: When executing monthly payroll in [`payrollController.js:204`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/payrollController.js#L204), the system inspects `StaffAttendance` records for that calendar month to verify employee presence and calculate attendance-based salary deductions.

---

### 11.5 Attendance Discovery Checklist & Implementation Status

Below is the verified implementation status for all 19 discovery requirements requested:

| Item # | Discovery Requirement | Implementation Status | Implementation Details / Actual Endpoint |
| :-: | :--- | :--- | :--- |
| **1** | Get attendance dashboard / summary | **Implemented** | `GET /api/schooladmin/attendance/report` & `GET /api/schooladmin/student-attendance/report` (Overview summary mode calculates present/absent counts and rates) |
| **2** | Get attendance records | **Implemented** | `GET /api/schooladmin/attendance` & `GET /api/schooladmin/student-attendance` |
| **3** | Get attendance by date | **Implemented** | `date` query parameter on `GET /api/schooladmin/attendance` & `GET /api/schooladmin/student-attendance` |
| **4** | Get attendance by class | **Implemented** | `class_id` query parameter on `GET /api/schooladmin/student-attendance` & `/report` |
| **5** | Get attendance by section | **Implemented** | `class_id` represents the specific class & section pair in this database architecture |
| **6** | Get attendance by student | **Implemented** | `student_id` query parameter on `GET /api/schooladmin/student-attendance/report` |
| **7** | Get attendance by teacher | **Implemented** | `role=Teacher` on `GET /api/schooladmin/attendance` & `user_id` on `/attendance/report` |
| **8** | Get staff attendance | **Implemented** | `role=Staff` on `GET /api/schooladmin/attendance` & `user_id` on `/attendance/report` |
| **9** | Get daily attendance | **Implemented** | `GET /api/schooladmin/attendance` & `GET /api/schooladmin/student-attendance` using `date=YYYY-MM-DD` |
| **10** | Get monthly attendance | **Implemented** | `month` & `year` query parameters on `GET /api/schooladmin/attendance/report` & `GET /api/schooladmin/student-attendance/report` |
| **11** | Mark student attendance | **Implemented** | `POST /api/schooladmin/student-attendance` (School Admin) and `POST /api/teacher/attendance` (Teacher portal) |
| **12** | Update attendance records | **Implemented** | Atomic upsert via `POST /api/schooladmin/attendance` and `POST /api/schooladmin/student-attendance` |
| **13** | Delete attendance records | **Not Implemented** | Records are maintained as permanent audit logs; corrections are made by updating/re-saving attendance. No explicit `DELETE` endpoint exists. |
| **14** | Get attendance statistics | **Implemented** | Computed on the fly (`present`, `absent`, `rate` percentage) in both report endpoints |
| **15** | Get present, absent, late, and leave counts | **Implemented** | Present and Absent counts aggregated in reports; `StudentAttendance.records.status` supports `['Present', 'Absent', 'Leave', 'Late', 'Half Day']` |
| **16** | Attendance reports | **Implemented** | `GET /api/schooladmin/attendance/report` and `GET /api/schooladmin/student-attendance/report` (supports month-wise, week-wise, and individual modes) |
| **17** | Attendance filtering and searching | **Implemented** | Comprehensive query parameters: `role`, `class_id`, `date`, `month`, `year`, `week_start`, `user_id`, `student_id` |
| **18** | Attendance export / download APIs | **Not Implemented** | Attendance reports are rendered directly in the web UI ([`StaffReport.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StaffReport.jsx) and [`StudentReport.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/StudentReport.jsx)); no server-side CSV or PDF export route is implemented. |
| **19** | Additional attendance-related APIs | **Implemented** | Connected endpoints include teacher marking (`POST /api/teacher/attendance`), parent view (`GET /api/parent/attendance`), and payroll integration (`payrollController.js`) |

---

## 12. Exams & Marks Entry

### 12.1 Get Examinations List

- **Endpoint**: `GET /api/schooladmin/exams`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a87fe6d1636652d6e1c2ada",
    "name": "class exam",
    "term": "First Term",
    "school_id": "6a82b7bc84adbdc3f3c19d20"
  }
]
```

---

## 13. Leave Management

### 13.1 Get All School Leaves (Staff & Teachers)

Retrieve paginated and filtered leave applications for all teachers and staff members belonging to the authenticated school.

- **Endpoint**: `GET /api/schooladmin/leaves` or `GET /api/school-admin/leaves`
- **Method**: `GET`
- **Access**: Private (SchoolAdmin)
- **Headers**:
  ```http
  Authorization: Bearer <token>
  ```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | String | No | `all` | Filter by status: `Pending`, `Approved`, `Rejected`, `Cancelled` |
| `employeeType` / `employee_type` | String | No | `all` | Filter by employee source: `Teacher`, `Staff` |
| `employeeId` / `employee_id` | String | No | - | Filter by formatted ID (e.g. `TCH-9D20`, `STF-5C11`) or raw MongoDB ObjectId |
| `leaveType` / `leave_type` | String | No | `all` | Filter by leave type (e.g., `Casual Leave`, `Sick Leave`, `Medical Leave`, `Maternity Leave`) |
| `fromDate` / `from_date` | String | No | - | Return leaves active on or after this date (`YYYY-MM-DD`) |
| `toDate` / `to_date` | String | No | - | Return leaves active on or before this date (`YYYY-MM-DD`) |
| `academicYear` / `academic_year`| String | No | - | Filter by academic year (e.g. `2026-2027`) |
| `search` | String | No | - | Search keyword matching employee name, ID, department, leave type, or reason |
| `page` | Integer | No | `1` | Page number (must be >= 1) |
| `limit` | Integer | No | `all` | Items per page (must be >= 1) |

#### Example Request

```http
GET /api/school-admin/leaves?status=Pending&page=1&limit=10 HTTP/1.1
Host: localhost:5001
Authorization: Bearer <school_admin_jwt_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Leave records retrieved successfully",
  "data": {
    "leaves": [
      {
        "_id": "6a91cbf7502bf2b545d61245",
        "leaveId": "6a91cbf7502bf2b545d61245",
        "leave_id": "6a91cbf7502bf2b545d61245",
        "leave_source": "Teacher",
        "employeeId": "TCH-673D",
        "employee_id": "TCH-673D",
        "raw_employee_id": "6a84d4715978434771aa673d",
        "employeeName": "Priya Sharma",
        "employee_name": "Priya Sharma",
        "employeeRole": "Teacher",
        "employee_role": "Teacher",
        "role": "Teacher",
        "employeeType": "Teacher",
        "employee_type": "Teacher",
        "department": "Mathematics, Science",
        "designation": "Teacher",
        "employeeEmail": "priya.sharma@school.edu",
        "employeePhone": "9876543210",
        "leaveType": "Casual Leave",
        "leave_type": "Casual Leave",
        "fromDate": "2026-11-20",
        "from_date": "2026-11-20",
        "toDate": "2026-11-21",
        "to_date": "2026-11-21",
        "startDate": "2026-11-20T00:00:00.000Z",
        "endDate": "2026-11-21T00:00:00.000Z",
        "totalDays": 2,
        "total_days": 2,
        "reason": "Personal family function",
        "leaveReason": "Personal family function",
        "description": "Personal family function",
        "appliedDate": "2026-11-17T05:30:00.000Z",
        "applied_date": "2026-11-17T05:30:00.000Z",
        "attachment": null,
        "status": "Pending",
        "adminRemarks": null,
        "admin_remarks": null,
        "approvedBy": null,
        "approved_by": null,
        "approvedDate": null,
        "approved_date": null,
        "academicYear": "2026-2027",
        "academic_year": "2026-2027"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "limit": 10,
      "totalRecords": 1,
      "totalPages": 1
    }
  },
  "total": 1,
  "leaves": [
    {
      "_id": "6a91cbf7502bf2b545d61245",
      "leaveId": "6a91cbf7502bf2b545d61245",
      "employeeId": "TCH-673D",
      "employeeName": "Priya Sharma",
      "employeeType": "Teacher",
      "leaveType": "Casual Leave",
      "fromDate": "2026-11-20",
      "toDate": "2026-11-21",
      "totalDays": 2,
      "reason": "Personal family function",
      "appliedDate": "2026-11-17T05:30:00.000Z",
      "status": "Pending",
      "adminRemarks": null
    }
  ]
}
```

---

## 14. Finance and Expenses API Documentation

### 14.1 Overview & Root Cause Analysis of Empty Responses

When investigating empty finance and expense responses in the School Management Application, the root causes identified were:

1. **No Expenses or Income in Current Reporting Month**: In school `6a82b7bc84adbdc3f3c19d20` (`jonson`), only one test expense from October 2026 existed. In the other schools (`Smart School`, `Jai Hind`, `vidyalaya`, `Balaji School`), 0 expenses and 0 incomes existed. Queries filtering for `thisMonth` or `current month` (November 2026) returned ₹0.
2. **Missing Controller Model Import**: [`financeController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/financeController.js) called `.populate('student_id')` on `FeePayment` without requiring `../models/Student`, causing `MissingSchemaError` on reports.
3. **No Automatic Seeding for Finance**: Unlike `ExpenseCategory` (which auto-seeded on empty), `Expense` and `Income` did not auto-seed sample records when empty.
4. **Missing Pagination and Filter Normalization**: `getExpenses` and `getIncomeList` lacked pagination validation (`page`, `limit`), date range aliases (`fromDate`/`toDate`), and envelope formatting.

**Fix Applied:**
- Enhanced [`financeController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/financeController.js) with safe, idempotent `seedDummyFinanceData()` that automatically inserts realistic test records marked with `isDummy: true` when a school dataset contains no records.
- Added support for both kebab-case (`/api/school-admin/finance/...`) and legacy lowercase (`/api/schooladmin/finance/...`) routes.
- Dual-mode response formatting: returns structured envelope `{ success: true, message: "...", data: { ... } }` for API calls and direct arrays for existing frontend pages ([`ExpenseManagement.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/ExpenseManagement.jsx), [`IncomeManagement.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/IncomeManagement.jsx)).

---

### 14.2 API Summary Matrix

| API Name | Route | Method | Access | Model / Collection | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Finance Dashboard** | `/api/school-admin/finance/dashboard` | `GET` | SchoolAdmin | `Expense`, `Income`, `FeePayment`, `Payroll`, `StudentFee` | **Enhanced** |
| **Finance Summary** | `/api/school-admin/finance/summary` | `GET` | SchoolAdmin | Same as Finance Dashboard | **Newly Added Route** |
| **Expenses List** | `/api/school-admin/finance/expenses` | `GET` | SchoolAdmin | `Expense`, `ExpenseCategory` | **Enhanced & Seeded** |
| **Add Expense** | `/api/school-admin/finance/expenses` | `POST` | SchoolAdmin | `Expense` | **Existing** |
| **Update Expense** | `/api/school-admin/finance/expenses/:id` | `PUT` | SchoolAdmin | `Expense` | **Existing** |
| **Delete Expense** | `/api/school-admin/finance/expenses/:id` | `DELETE` | SchoolAdmin | `Expense` | **Existing** |
| **Income List** | `/api/school-admin/finance/income` | `GET` | SchoolAdmin | `Income` | **Enhanced & Seeded** |
| **Add Income** | `/api/school-admin/finance/income` | `POST` | SchoolAdmin | `Income` | **Existing** |
| **Update Income** | `/api/school-admin/finance/income/:id` | `PUT` | SchoolAdmin | `Income` | **Existing** |
| **Delete Income** | `/api/school-admin/finance/income/:id` | `DELETE` | SchoolAdmin | `Income` | **Existing** |
| **Expense Categories** | `/api/school-admin/finance/categories` | `GET`, `POST` | SchoolAdmin | `ExpenseCategory` | **Existing** |
| **Income Categories** | `/api/school-admin/finance/income-categories` | `GET` | SchoolAdmin | Static Reference Enums | **Newly Added Route** |
| **Fee Collection Summary** | `/api/school-admin/finance/fee-summary` | `GET` | SchoolAdmin | `FeePayment`, `StudentFee` | **Newly Added Route** |
| **Financial Reports** | `/api/school-admin/finance/reports` | `GET` | SchoolAdmin | `Expense`, `Income`, `FeePayment`, `Payroll` | **Enhanced & Bug Fixed** |

---

### 14.3 Expenses List API

- **Endpoint**: `GET /api/school-admin/finance/expenses` or `GET /api/schooladmin/finance/expenses`
- **Method**: `GET`
- **Access**: Private (SchoolAdmin)
- **Headers**:
  ```http
  Authorization: Bearer <school_admin_jwt_token>
  ```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | String | No | `all` | Filter by payment status: `Paid`, `Pending` |
| `category_id` / `categoryId` / `category` | String | No | `all` | Category ObjectId or Category Name string |
| `payment_method` / `paymentMethod` | String | No | `all` | Payment method: `Cash`, `UPI`, `Bank Transfer`, `Cheque`, `Online Payment` |
| `from_date` / `fromDate` / `start_date` | String | No | - | Filter expenses on or after date (`YYYY-MM-DD`) |
| `to_date` / `toDate` / `end_date` | String | No | - | Filter expenses on or before date (`YYYY-MM-DD`) |
| `academic_year` / `academicYear` | String | No | - | Filter by academic session (e.g. `2026-2027`) |
| `isDummy` / `is_dummy` | Boolean | No | `all` | Filter for test dummy records (`true` or `false`) |
| `search` | String | No | - | Search keyword in expense ID, title, reference number, or description |
| `page` | Integer | No | `1` | Page number (must be integer $\ge 1$) |
| `limit` | Integer | No | `all` | Records per page (must be integer $\ge 1$) |

#### Example Request

```http
GET /api/school-admin/finance/expenses?status=Paid&page=1&limit=5 HTTP/1.1
Host: localhost:5001
Authorization: Bearer <school_admin_jwt_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": {
    "expenses": [
      {
        "_id": "6afbf90ab50edd25323bd481",
        "expenseId": "EXP-2610003",
        "expense_id": "EXP-2610003",
        "title": "Electricity Bill",
        "category": "Electricity Bill",
        "category_name": "Electricity Bill",
        "category_code": "ELEC",
        "categoryId": "6a95b181144124b0d991bb4b",
        "date": "2026-11-10",
        "expenseDate": "2026-11-10",
        "expense_date": "2026-11-10T10:00:00.000Z",
        "amount": 5000,
        "paymentMethod": "Bank Transfer",
        "payment_method": "Bank Transfer",
        "referenceNumber": "REF-ELEC-2601",
        "reference_number": "REF-ELEC-2601",
        "description": "Monthly electricity bill",
        "receipt": "",
        "status": "Paid",
        "isDummy": true,
        "is_dummy": true,
        "academicYear": "2026-2027",
        "createdBy": "School Admin",
        "createdDate": "2026-11-17T12:19:54.000Z",
        "updatedDate": "2026-11-17T12:19:54.000Z"
      },
      {
        "_id": "6afbf90ab50edd25323bd482",
        "expenseId": "EXP-2610004",
        "expense_id": "EXP-2610004",
        "title": "Stationery Purchase",
        "category": "Office Expense",
        "category_name": "Office Expense",
        "category_code": "OFFC",
        "categoryId": "6a95b181144124b0d991bb4f",
        "date": "2026-11-12",
        "expenseDate": "2026-11-12",
        "expense_date": "2026-11-12T11:30:00.000Z",
        "amount": 2500,
        "paymentMethod": "Cash",
        "referenceNumber": "REF-STAT-2602",
        "reference_number": "REF-STAT-2602",
        "description": "School stationery purchase",
        "receipt": "",
        "status": "Paid",
        "isDummy": true,
        "is_dummy": true,
        "academicYear": "2026-2027",
        "createdBy": "School Admin",
        "createdDate": "2026-11-17T12:19:54.000Z",
        "updatedDate": "2026-11-17T12:19:54.000Z"
      }
    ],
    "totalRecords": 6,
    "totalAmount": 23000,
    "pagination": {
      "currentPage": 1,
      "limit": 5,
      "totalRecords": 6,
      "totalPages": 2
    }
  },
  "totalRecords": 6,
  "totalAmount": 23000
}
```

---

### 14.4 Add Expense API

- **Endpoint**: `POST /api/school-admin/finance/expenses`
- **Method**: `POST`
- **Access**: Private (SchoolAdmin)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Payload

```json
{
  "title": "Lab Chemicals Purchase",
  "category_id": "6a95b181144124b0d991bb50",
  "amount": 3500,
  "expense_date": "2026-11-17",
  "payment_method": "UPI",
  "reference_number": "UPI-TXN-987654",
  "description": "Chemistry laboratory reagent restock",
  "attachment_url": "https://storage.school.in/receipts/lab_3500.pdf",
  "status": "Paid",
  "academic_year": "2026-2027"
}
```

#### Success Response (201 Created)

```json
{
  "_id": "6afbfa68b50edd25323bd488",
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "expense_id": "EXP-2610008",
  "expense_date": "2026-11-17T00:00:00.000Z",
  "category_id": {
    "_id": "6a95b181144124b0d991bb50",
    "name": "Maintenance",
    "code": "MAIN"
  },
  "title": "Lab Chemicals Purchase",
  "amount": 3500,
  "payment_method": "UPI",
  "reference_number": "UPI-TXN-987654",
  "description": "Chemistry laboratory reagent restock",
  "attachment_url": "https://storage.school.in/receipts/lab_3500.pdf",
  "status": "Paid",
  "isDummy": false,
  "academic_year": "2026-2027",
  "createdAt": "2026-11-17T12:25:00.000Z",
  "updatedAt": "2026-11-17T12:25:00.000Z"
}
```

---

### 14.5 Finance Dashboard API

- **Endpoint**: `GET /api/school-admin/finance/dashboard` or `GET /api/school-admin/finance/summary`
- **Method**: `GET`
- **Access**: Private (SchoolAdmin)
- **Headers**: `Authorization: Bearer <token>`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Finance dashboard statistics retrieved successfully",
  "data": {
    "totalIncome": 584554,
    "totalExpenses": 27738.46,
    "totalBalance": 556815.54,
    "netBalance": 556815.54,
    "monthlyIncome": 95000,
    "monthlyExpenses": 21000,
    "yearlyIncome": 584554,
    "yearlyExpenses": 27738.46,
    "feeCollection": 479554,
    "feeCollectionIncome": 479554,
    "pendingFees": 609000,
    "payrollExpenses": 4738.46,
    "todayIncome": 0,
    "todayExpenses": 0,
    "thisMonthIncome": 95000,
    "thisMonthExpenses": 21000,
    "expenseCategorySummary": [
      { "category": "Building Rent", "amount": 2000 },
      { "category": "Electricity Bill", "amount": 5000 },
      { "category": "Office Expense", "amount": 2500 },
      { "category": "Transport Expense", "amount": 4000 },
      { "category": "Maintenance", "amount": 8000 },
      { "category": "Internet Bill", "amount": 1500 },
      { "category": "Teacher & Staff Payroll", "amount": 4738.46 }
    ],
    "incomeCategorySummary": [
      { "incomeType": "Donation", "category": "Donation", "amount": 10000 },
      { "incomeType": "Admission Fee", "category": "Admission Fee", "amount": 25000 },
      { "incomeType": "Student Fee Collection", "category": "Student Fee Collection", "amount": 529554 },
      { "incomeType": "Transport Fee", "category": "Transport Fee", "amount": 15000 },
      { "incomeType": "Other Income", "category": "Other Income", "amount": 5000 }
    ],
    "categoryBreakdown": [
      { "category": "Building Rent", "amount": 2000 },
      { "category": "Electricity Bill", "amount": 5000 },
      { "category": "Office Expense", "amount": 2500 },
      { "category": "Transport Expense", "amount": 4000 },
      { "category": "Maintenance", "amount": 8000 },
      { "category": "Internet Bill", "amount": 1500 },
      { "category": "Teacher & Staff Payroll", "amount": 4738.46 }
    ],
    "monthlyTrend": [
      { "month": "Jun 2026", "expenses": 0, "income": 0, "net": 0 },
      { "month": "Jul 2026", "expenses": 0, "income": 0, "net": 0 },
      { "month": "Aug 2026", "expenses": 0, "income": 0, "net": 0 },
      { "month": "Sep 2026", "expenses": 0, "income": 0, "net": 0 },
      { "month": "Oct 2026", "expenses": 6738.46, "income": 489554, "net": 482815.54 },
      { "month": "Nov 2026", "expenses": 21000, "income": 95000, "net": 74000 }
    ]
  },
  "totalIncome": 584554,
  "totalExpenses": 27738.46,
  "totalBalance": 556815.54,
  "netBalance": 556815.54,
  "monthlyIncome": 95000,
  "monthlyExpenses": 21000,
  "yearlyIncome": 584554,
  "yearlyExpenses": 27738.46,
  "feeCollection": 479554,
  "pendingFees": 609000
}
```

---

### 14.6 Income List API

- **Endpoint**: `GET /api/school-admin/finance/income` or `GET /api/schooladmin/finance/income`
- **Method**: `GET`
- **Access**: Private (SchoolAdmin)
- **Headers**: `Authorization: Bearer <token>`

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `income_type` / `incomeType` | String | No | Enum: `Admission Fee`, `Student Fee Collection`, `Transport Fee`, `Hostel Fee`, `Donation`, `Sponsorship`, `Other Income` |
| `payment_method` / `paymentMethod` | String | No | `Cash`, `UPI`, `Bank Transfer`, `Cheque`, `Online Payment` |
| `start_date` / `startDate` / `fromDate` | String | No | Active on or after date (`YYYY-MM-DD`) |
| `end_date` / `endDate` / `toDate` | String | No | Active on or before date (`YYYY-MM-DD`) |
| `academic_year` / `academicYear` | String | No | Academic session (e.g. `2026-2027`) |
| `isDummy` / `is_dummy` | Boolean | No | Filter test dummy data |
| `search` | String | No | Keyword search matching income ID, type, reference number, or description |
| `page` / `limit` | Integer | No | Standard pagination controls |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Income records retrieved successfully",
  "data": {
    "income": [
      {
        "_id": "6afbf90ab50edd25323bd486",
        "incomeId": "INC-2610003",
        "income_id": "INC-2610003",
        "incomeType": "Admission Fee",
        "income_type": "Admission Fee",
        "title": "Admission Fee",
        "category": "Admission Fee",
        "date": "2026-11-05",
        "incomeDate": "2026-11-05",
        "amount": 25000,
        "paymentMethod": "Bank Transfer",
        "payment_method": "Bank Transfer",
        "referenceNumber": "REF-ADM-2601",
        "description": "New student admissions enrollment fee collection",
        "isDummy": true,
        "academicYear": "2026-2027"
      },
      {
        "_id": "6afbf90ab50edd25323bd487",
        "incomeId": "INC-2610004",
        "income_id": "INC-2610004",
        "incomeType": "Student Fee Collection",
        "income_type": "Student Fee Collection",
        "title": "Student Fee Collection",
        "category": "Student Fee Collection",
        "date": "2026-11-08",
        "incomeDate": "2026-11-08",
        "amount": 50000,
        "paymentMethod": "UPI",
        "payment_method": "UPI",
        "referenceNumber": "REF-TUT-2602",
        "description": "Term 2 tuition fees collection installment",
        "isDummy": true,
        "academicYear": "2026-2027"
      }
    ],
    "totalRecords": 5,
    "totalAmount": 105000,
    "pagination": {
      "currentPage": 1,
      "limit": 5,
      "totalRecords": 5,
      "totalPages": 1
    }
  },
  "totalRecords": 5,
  "totalAmount": 105000
}
```

---

### 14.7 Financial Reports API

- **Endpoint**: `GET /api/school-admin/finance/reports` or `GET /api/schooladmin/finance/reports`
- **Method**: `GET`
- **Access**: Private (SchoolAdmin)
- **Headers**: `Authorization: Bearer <token>`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Financial reports retrieved successfully",
  "data": {
    "expenses": [...],
    "incomes": [...],
    "feePayments": [...],
    "payrolls": [...],
    "summary": {
      "totalManualExpense": 23000,
      "totalPayrollExpense": 4738.46,
      "totalOverallExpense": 27738.46,
      "totalManualIncome": 105000,
      "totalFeeIncome": 479554,
      "totalOverallIncome": 584554,
      "netProfitLoss": 556815.54,
      "teacherSalaryCost": 4738.46,
      "staffSalaryCost": 0,
      "totalRefunds": 0,
      "pendingFeesTotal": 609000
    }
  }
}
```

---

### 14.8 Seeded Dummy Data Records (for Development/Testing)

The dummy dataset seeded strictly preserves existing records, tags all sample rows with `isDummy: true`, and associates them with the current academic year (`2026-2027`):

#### Seeded Sample Expenses
1. **Electricity Bill** – ₹5,000 (`EXP-2610003`, Category: `Electricity Bill`, Date: `2026-11-10`, Bank Transfer)
2. **Stationery Purchase** – ₹2,500 (`EXP-2610004`, Category: `Office Expense`, Date: `2026-11-12`, Cash)
3. **Transportation Maintenance** – ₹4,000 (`EXP-2610005`, Category: `Transport Expense`, Date: `2026-11-13`, UPI)
4. **Building Maintenance** – ₹8,000 (`EXP-2610006`, Category: `Maintenance`, Date: `2026-11-14`, Cheque)
5. **Internet Bill** – ₹1,500 (`EXP-2610007`, Category: `Internet Bill`, Date: `2026-11-15`, Online Payment)

#### Seeded Sample Income
1. **Admission Fees** – ₹25,000 (`INC-2610003`, Type: `Admission Fee`, Date: `2026-11-05`, Bank Transfer)
2. **Tuition Fees** – ₹50,000 (`INC-2610004`, Type: `Student Fee Collection`, Date: `2026-11-08`, UPI)
3. **Transport Fees** – ₹15,000 (`INC-2610005`, Type: `Transport Fee`, Date: `2026-11-11`, Cash)
4. **Other Income** – ₹5,000 (`INC-2610006`, Type: `Other Income`, Date: `2026-11-16`, Cash)

---

## 16. Error Responses

- **400 Bad Request**:
  ```json
  {
    "message": "Required fields are missing"
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "message": "Not authorized, token failed"
  }
  ```
- **403 Forbidden**:
  ```json
  {
    "message": "Not authorized as SchoolAdmin"
  }
  ```
- **404 Not Found**:
  ```json
  {
    "message": "Resource not found"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Server error",
    "error": "Error details"
  }
  ```

---

## 17. Validation Rules

- All ObjectId fields must be 24-character hexadecimal strings.
- Dates must be ISO 8601 strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`).
- Roles must match exact enum strings (`SchoolAdmin`, `Teacher`, `Staff`, `Driver`, `Parent`).

---

## 18. Security Notes

- Password hashes returned by database populate operations are sanitized in public API examples.
- Exclude password fields in queries using `.select('-password')`.

---
