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
  }
  ```

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

### 10.1 Get Staff / Teacher Attendance List

- **Endpoint**: `GET /api/schooladmin/attendance?role=Staff&date=2026-10-01`
- **Access**: Private (SchoolAdmin)
- **Query Parameters**:
  - `role` (Required): `"Staff"` | `"Teacher"`
  - `date` (Required): `"YYYY-MM-DD"`

---

### 10.2 Save / Update Staff Attendance Records

- **Endpoint**: `POST /api/schooladmin/attendance`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "role": "Staff",
    "date": "2026-10-01",
    "records": [
      {
        "user_id": "6ab21fc3c5ca856a445592fb",
        "name": "Sundar Staff",
        "role": "Staff",
        "status": "Present",
        "in_time": "09:00 AM",
        "out_time": "05:00 PM"
      }
    ],
    "notify_via": "Do not send"
  }
  ```

---

## 11. Student Attendance Management

### 11.1 Get Class Student Attendance List

- **Endpoint**: `GET /api/schooladmin/student-attendance?class_id=6a840119ef78578a90316739&date=2026-10-01`
- **Access**: Private (SchoolAdmin)

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
