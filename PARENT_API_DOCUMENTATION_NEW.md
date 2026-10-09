# Parent API Documentation

## 1. Overview

This document provides complete, accurate, and implementation-verified API documentation for the **Parent Module** of the Multi-Tenant School Management Platform.

Every endpoint, HTTP method, request payload, response schema, parameter, validation rule, error code, and security control documented herein has been directly extracted and verified against the backend implementation source code (`server.js`, `parentRoutes.js`, `parentAuthRoutes.js`, `parentAuthController.js`, `parentModuleController.js`, `authMiddleware.js`, and `auditMiddleware.js`).

---

## 2. Base URL

All parent endpoints are hosted under the following prefix:

```http
http://localhost:5005/api/parent
```

---

## 3. Authentication

### Overview
All protected parent APIs require authentication via JWT Bearer Token.

### Request Headers
For all protected routes under `/api/parent/*` (except public auth endpoints):

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### JWT Token Payload
When a parent logs in, the backend issues an `accessToken` signed with `process.env.JWT_SECRET` (fallback: `'fallback_secret'`).
* **Algorithm**: HS256
* **Expiration**: 7 days (`7d`)
* **Refresh Token Expiration**: 30 days (`30d`)
* **Token Payload**:
  ```json
  {
    "id": "<user_object_id>",
    "role": "Parent"
  }
  ```

### Authentication & Authorization Rules
* **Authentication (`protect`)**: Middleware parses the `Authorization` header, extracts the Bearer token, verifies its signature and expiration, and fetches the user account from the `User` collection.
* **Role Verification (`authorize('Parent')`)**: Verifies that `req.user.role === 'Parent'`. Returns `HTTP 403 Forbidden` if role requirement is not met.
* **Audit Logging (`logParentActivity`)**: Asynchronously records API requests into the `AuditLog` collection post-response.

---

## 4. Parent Authentication APIs

### 4.1 Parent Login

#### Endpoint
`POST /api/parent/auth/login`

#### Access
Public

#### Headers
```http
Content-Type: application/json
```

#### Request Body
The backend dynamically checks for phone number or email under multiple input field names: `email`, `phone`, `mobile`, `mobile_number`, `phone_number`, `email_or_phone`, `username`, or `identifier`.

```json
{
  "email_or_phone": "siva@gmail.com",
  "password": "123456"
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "message": "Parent login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6a84052b93171b71e3158e7f",
    "name": "siva",
    "email": "siva@gmail.com",
    "phone": "67890765444",
    "role": "Parent",
    "status": "Active",
    "last_login_at": "2026-09-16T02:05:00.000Z"
  },
  "parent": {
    "_id": "6aa9f948c53afc6b23e52421",
    "user_id": "6a84052b93171b71e3158e7f",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "siva",
    "father_name": "siva",
    "mother_name": "",
    "phone": "67890765444",
    "email": "siva@gmail.com",
    "address": "Chennai",
    "last_login_at": "2026-09-16T02:05:00.000Z"
  },
  "profile": {
    "_id": "6aa9f948c53afc6b23e52421",
    "user_id": "6a84052b93171b71e3158e7f",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "siva",
    "phone": "67890765444",
    "email": "siva@gmail.com"
  },
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "first_name": "Arvind",
      "last_name": "Siva",
      "admission_number": "STDCLASS1SECB158E80",
      "roll_no": "1",
      "class_id": {
        "_id": "6a840119ef78578a90316739",
        "class": "class 1",
        "section": "B"
      },
      "photo": ""
    }
  ]
}
```

#### Error Responses
* **HTTP 400 Bad Request**:
  ```json
  { "message": "Please provide mobile number/email and password" }
  ```
* **HTTP 401 Unauthorized**:
  ```json
  { "message": "Invalid credentials or non-parent account" }
  ```
* **HTTP 401 Unauthorized**:
  ```json
  { "message": "Invalid credentials" }
  ```
* **HTTP 403 Forbidden**:
  ```json
  { "message": "Parent account is deactivated or blocked. Please contact school administration." }
  ```

---

### 4.2 Parent Logout

#### Endpoint
`POST /api/parent/auth/logout`

#### Access
Public / Authenticated Parent

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "message": "Parent logged out successfully"
}
```

---

### 4.3 Refresh Access Token

#### Endpoint
`POST /api/parent/auth/refresh-token`

#### Access
Public

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Refresh token is required" }`
* **HTTP 401 Unauthorized**: `{ "message": "Invalid or expired refresh token" }`
* **HTTP 401 Unauthorized**: `{ "message": "Refresh token revoked" }`
* **HTTP 403 Forbidden**: `{ "message": "Invalid user session or account deactivated" }`

---

### 4.4 Forgot Password Request

#### Endpoint
`POST /api/parent/auth/forgot-password`

#### Access
Public

#### Request Body
Accepts `email_or_phone`, `email`, or `phone`.

```json
{
  "email_or_phone": "siva@gmail.com"
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "message": "Password reset code generated successfully. Please use this code to reset your password within 15 minutes.",
  "resetToken": "A1B2C3"
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Please provide registered email or mobile number" }`
* **HTTP 404 Not Found**: `{ "message": "No active parent account found with given mobile number/email" }`

---

### 4.5 Reset Password

#### Endpoint
`POST /api/parent/auth/reset-password`

#### Access
Public

#### Request Body
```json
{
  "resetToken": "A1B2C3",
  "newPassword": "newpassword123"
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Reset token and new password are required" }`
* **HTTP 400 Bad Request**: `{ "message": "Invalid or expired reset token" }`

---

### 4.6 Change Password

#### Endpoint
`POST /api/parent/auth/change-password`

#### Access
Authenticated Parent

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "oldPassword": "123456",
  "newPassword": "newsecurepassword123"
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Old and new passwords are required" }`
* **HTTP 400 Bad Request**: `{ "message": "Incorrect old password" }`

---

### 4.7 Get Authenticated Parent Auth Profile

#### Endpoint
`GET /api/parent/auth/profile`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
{
  "user": {
    "_id": "6a84052b93171b71e3158e7f",
    "email": "siva@gmail.com",
    "phone": "67890765444",
    "role": "Parent",
    "status": "Active",
    "last_login_at": "2026-09-16T02:05:00.000Z"
  },
  "profile": {
    "_id": "6aa9f948c53afc6b23e52421",
    "user_id": "6a84052b93171b71e3158e7f",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "name": "siva",
    "father_name": "siva",
    "mother_name": "",
    "phone": "67890765444",
    "email": "siva@gmail.com",
    "address": "Chennai"
  },
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "admission_number": "STDCLASS1SECB158E80",
      "roll_no": "1",
      "class_id": {
        "_id": "6a840119ef78578a90316739",
        "class": "class 1",
        "section": "B"
      },
      "school_id": {
        "_id": "6a82b7bc84adbdc3f3c19d20",
        "name": "Global Academy",
        "code": "GA01",
        "logo": ""
      }
    }
  ]
}
```

---

## 5. Parent Profile API

### 5.1 Get Full Parent Profile Details

#### Endpoint
`GET /api/parent/profile`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
{
  "parentId": "6aa9f948c53afc6b23e52421",
  "userId": "6a84052b93171b71e3158e7f",
  "parentName": "siva",
  "fatherName": "siva",
  "motherName": "",
  "mobileNumber": "67890765444",
  "alternateMobileNumber": "",
  "email": "siva@gmail.com",
  "address": "Chennai",
  "occupation": "",
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1",
      "class_id": {
        "_id": "6a840119ef78578a90316739",
        "class": "class 1",
        "section": "B"
      },
      "school_id": {
        "_id": "6a82b7bc84adbdc3f3c19d20",
        "name": "Global Academy",
        "code": "GA01",
        "logo": ""
      }
    }
  ]
}
```

---

## 6. Parent Dashboard API

### 6.1 Get Dashboard Aggregated Overview

#### Endpoint
`GET /api/parent/dashboard`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
{
  "totalChildrenCount": 1,
  "todayAttendanceSummary": [
    {
      "studentId": "6a84052b93171b71e3158e80",
      "studentName": "arvind",
      "status": "Present"
    }
  ],
  "pendingHomeworkCount": 2,
  "upcomingExamsCount": 1,
  "unreadMessagesCount": 1,
  "latestAnnouncements": [
    {
      "_id": "6aa9f948c53afc6b23e52410",
      "title": "School Sports Day Schedule",
      "content": "Sports Day starts next Monday.",
      "createdAt": "2026-09-14T00:00:00.000Z"
    }
  ],
  "children": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "class_id": {
        "_id": "6a840119ef78578a90316739",
        "class": "class 1",
        "section": "B"
      },
      "school_id": {
        "_id": "6a82b7bc84adbdc3f3c19d20",
        "name": "Global Academy"
      }
    }
  ]
}
```

---

## 7. Child Management APIs

### 7.1 List Linked Children

#### Endpoint
`GET /api/parent/students`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind",
    "first_name": "Arvind",
    "last_name": "Siva",
    "admission_number": "STDCLASS1SECB158E80",
    "roll_no": "1",
    "class_id": {
      "_id": "6a840119ef78578a90316739",
      "class": "class 1",
      "section": "B"
    },
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "Global Academy",
      "code": "GA01",
      "logo": ""
    },
    "parent_user_id": "6a84052b93171b71e3158e7f"
  }
]
```

---

### 7.2 Get Specific Child Details

#### Endpoint
`GET /api/parent/students/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "admissionNumber": "STDCLASS1SECB158E80",
  "name": "arvind",
  "firstName": "Arvind",
  "lastName": "Siva",
  "rollNumber": "1",
  "class": "class 1",
  "section": "B",
  "dateOfBirth": "2020-07-18T00:00:00.000Z",
  "bloodGroup": "O+",
  "photo": "",
  "academicInformation": {
    "group": "General",
    "registrationNo": "",
    "religion": ""
  },
  "parentInformation": {
    "fatherName": "siva",
    "motherName": "",
    "parentName": "siva",
    "parentPhone": "67890765444",
    "parentEmail": "siva@gmail.com",
    "guardianRelation": "Parent",
    "address": "Chennai"
  },
  "student": {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind",
    "admission_number": "STDCLASS1SECB158E80",
    "roll_no": "1",
    "class_id": {
      "_id": "6a840119ef78578a90316739",
      "class": "class 1",
      "section": "B"
    },
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "Global Academy",
      "code": "GA01",
      "logo": "",
      "email": "info@globalacademy.com",
      "phone": "9876543210",
      "location": "Chennai"
    }
  }
}
```

#### Error Responses
* **HTTP 403 Forbidden** (Ownership check failed - target student does not belong to logged-in parent):
  ```json
  {
    "message": "Access forbidden: You can only access details for your linked children."
  }
  ```

---

## 8. Attendance APIs

### 8.1 Get Attendance Summary & Logs

#### Endpoint
`GET /api/parent/attendance`  
`GET /api/parent/attendance/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Query Parameters
* `filter`: Optional (`daily` | `monthly` | `academic_year`)
* `month`: Optional (`1` to `12`)
* `year`: Optional (e.g. `2026`)
* `startDate`: Optional ISO Date string
* `endDate`: Optional ISO Date string

#### Success Response
**HTTP 200 OK**
```json
{
  "presentDays": 22,
  "absentDays": 2,
  "leaveDays": 1,
  "totalDays": 25,
  "attendancePercentage": 88.0,
  "records": [
    {
      "_id": "6aa9f948c53afc6b23e52450",
      "student_id": "6a84052b93171b71e3158e80",
      "date": "2026-09-15T00:00:00.000Z",
      "status": "Present"
    }
  ]
}
```

#### Error Responses
* **HTTP 403 Forbidden**: `{ "message": "Access forbidden: You can only access details for your linked children." }`

---

## 9. Homework APIs

### 9.1 Get Assigned Homework & Submissions

#### Endpoint
`GET /api/parent/homework`  
`GET /api/parent/homework/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Query Parameters
* `subjectId`: Optional Subject MongoDB ObjectId
* `startDate`: Optional ISO Date
* `endDate`: Optional ISO Date

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "homeworkId": "6aa9f948c53afc6b23e52460",
    "homeworkTitle": "Algebra Exercise 3.2",
    "subject": "Mathematics",
    "description": "Complete problems 1 to 15 on page 45.",
    "dueDate": "2026-09-20T00:00:00.000Z",
    "assignedDate": "2026-09-15T00:00:00.000Z",
    "teacherName": "Arun Kumar",
    "submissionStatus": "Submitted",
    "submittedAt": "2026-09-16T01:30:00.000Z",
    "marksObtained": 9
  }
]
```

---

## 10. Timetable APIs

### 10.1 Get Daily Class Timetable

#### Endpoint
`GET /api/parent/timetable`  
`GET /api/parent/timetable/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "day": "Monday",
    "period": 1,
    "subject": "Mathematics",
    "teacherName": "Arun Kumar",
    "startTime": "09:00 AM",
    "endTime": "09:45 AM"
  },
  {
    "day": "Monday",
    "period": 2,
    "subject": "Science",
    "teacherName": "Priya Sharma",
    "startTime": "09:45 AM",
    "endTime": "10:30 AM"
  }
]
```

---

## 11. Exam APIs

### 11.1 Get Exam Schedule

#### Endpoint
`GET /api/parent/exams`  
`GET /api/parent/exams/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "examId": "6a87fe6d1636652d6e1c2ada",
    "examName": "Mid-Term Examination 2026",
    "examType": "Term Exam",
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-10-10T00:00:00.000Z",
    "subjects": [
      {
        "subject_name": "Mathematics",
        "exam_date": "2026-10-01",
        "max_marks": 100
      }
    ],
    "schedule": []
  }
]
```

---

## 12. Marks & Report Card APIs

### 12.1 Get Exam Results Summary

#### Endpoint
`GET /api/parent/results`  
`GET /api/parent/results/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "examId": "6a87fe6d1636652d6e1c2ada",
    "examName": "Mid-Term Examination 2026",
    "studentId": "6a84052b93171b71e3158e80",
    "subjectWiseMarks": [
      {
        "subjectName": "Mathematics",
        "marksObtained": 85,
        "totalMarks": 100,
        "grade": "A"
      },
      {
        "subjectName": "Science",
        "marksObtained": 90,
        "totalMarks": 100,
        "grade": "A+"
      }
    ],
    "totalMarks": 200,
    "totalMarksObtained": 175,
    "percentage": 87.5,
    "grade": "A",
    "resultStatus": "Pass"
  }
]
```

---

### 12.2 Get Full Exam Report Card

#### Endpoint
`GET /api/parent/report-card/:studentId/:examId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Required)
* `examId`: MongoDB ObjectId of the exam (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "student": {
    "id": "6a84052b93171b71e3158e80",
    "name": "arvind",
    "admissionNumber": "STDCLASS1SECB158E80",
    "rollNo": "1"
  },
  "exam": {
    "id": "6a87fe6d1636652d6e1c2ada",
    "name": "Mid-Term Examination 2026",
    "type": "Term Exam"
  },
  "subjectWiseMarks": [
    {
      "subjectName": "Mathematics",
      "subjectCode": "MATH101",
      "marksObtained": 85,
      "totalMarks": 100,
      "percentage": 85.0,
      "grade": "A",
      "status": "Pass"
    }
  ],
  "totalMarks": 100,
  "totalMarksObtained": 85,
  "percentage": 85.0,
  "grade": "A",
  "rank": 1,
  "resultStatus": "Pass"
}
```

#### Error Responses
* **HTTP 403 Forbidden**: `{ "message": "Access forbidden: You can only access details for your linked children." }`
* **HTTP 404 Not Found**: `{ "message": "Exam not found" }`

---

## 13. Fee APIs (Read-Only)

### 13.1 Get Fee Summary & Payment History

#### Endpoint
`GET /api/parent/fees`  
`GET /api/parent/fees/:studentId`

#### Access
Authenticated Parent

#### Path Parameters
* `studentId`: MongoDB ObjectId of the student (Optional)

#### Success Response
**HTTP 200 OK**
```json
{
  "totalFees": 25000,
  "paidAmount": 15000,
  "pendingAmount": 10000,
  "feeAssignments": [
    {
      "_id": "6aa9f948c53afc6b23e52470",
      "student_id": {
        "_id": "6a84052b93171b71e3158e80",
        "student_name": "arvind",
        "roll_no": "1"
      },
      "total_amount": 25000,
      "total_paid": 15000
    }
  ],
  "paymentHistory": [
    {
      "_id": "6aa9f948c53afc6b23e52475",
      "amount_paid": 15000,
      "payment_mode": "Online",
      "transaction_id": "TXN987654321",
      "payment_date": "2026-08-10T00:00:00.000Z"
    }
  ]
}
```

---

## 14. Announcement APIs

### 14.1 List School Announcements (Paginated)

#### Endpoint
`GET /api/parent/announcements`

#### Access
Authenticated Parent

#### Query Parameters
* `page`: Integer page number (Default: `1`)
* `limit`: Items per page (Default: `10`)

#### Success Response
**HTTP 200 OK**
```json
{
  "total": 5,
  "page": 1,
  "pages": 1,
  "announcements": [
    {
      "id": "6aa9f948c53afc6b23e52480",
      "title": "Annual Science Fair Guidelines",
      "description": "Science fair registration opens on Monday.",
      "createdDate": "2026-09-14T00:00:00.000Z",
      "attachment": ""
    }
  ]
}
```

---

### 14.2 Get Specific Announcement Details

#### Endpoint
`GET /api/parent/announcements/:id`

#### Access
Authenticated Parent

#### Path Parameters
* `id`: MongoDB ObjectId of the Notice (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "id": "6aa9f948c53afc6b23e52480",
  "title": "Annual Science Fair Guidelines",
  "description": "Science fair registration opens on Monday.",
  "createdDate": "2026-09-14T00:00:00.000Z",
  "attachment": ""
}
```

#### Error Responses
* **HTTP 404 Not Found**: `{ "message": "Announcement not found" }`

---

## 15. Teacher Communication APIs

### 15.1 Get Active Conversations List

#### Endpoint
`GET /api/parent/messages`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "_id": "6aa9f948c53afc6b23e52490",
    "parent_id": "6a84052b93171b71e3158e7f",
    "recipient_id": {
      "_id": "6a82b7bc84adbdc3f3c19d1f",
      "email": "teacher@school.com",
      "phone": "9876543210",
      "role": "Teacher"
    },
    "recipient_role": "Class Teacher",
    "student_id": {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1"
    },
    "subject": "Inquiry regarding Math homework performance",
    "last_message": "Thank you, teacher!",
    "last_message_at": "2026-09-16T02:00:00.000Z"
  }
]
```

---

### 15.2 Get Specific Conversation Thread Details

#### Endpoint
`GET /api/parent/messages/:conversationId`

#### Access
Authenticated Parent

#### Path Parameters
* `conversationId`: MongoDB ObjectId of `ParentConversation` (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "_id": "6aa9f948c53afc6b23e52490",
  "parent_id": "6a84052b93171b71e3158e7f",
  "recipient_id": {
    "_id": "6a82b7bc84adbdc3f3c19d1f",
    "email": "teacher@school.com",
    "phone": "9876543210",
    "role": "Teacher"
  },
  "recipient_role": "Class Teacher",
  "student_id": {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind",
    "roll_no": "1"
  },
  "subject": "Inquiry regarding Math homework performance",
  "messages": [
    {
      "sender_id": "6a84052b93171b71e3158e7f",
      "sender_role": "Parent",
      "message": "Hello Teacher, I wanted to ask how Arvind is performing in Math.",
      "read_at": "2026-09-16T01:45:00.000Z"
    }
  ]
}
```

#### Error Responses
* **HTTP 404 Not Found**: `{ "message": "Conversation not found or access forbidden" }`

---

### 15.3 Start New Conversation

#### Endpoint
`POST /api/parent/messages`

#### Access
Authenticated Parent

#### Request Body
```json
{
  "recipient_id": "6a82b7bc84adbdc3f3c19d1f",
  "recipient_role": "Class Teacher",
  "student_id": "6a84052b93171b71e3158e80",
  "subject": "Inquiry regarding Math homework performance",
  "message": "Hello Teacher, I wanted to ask how Arvind is performing in Math."
}
```

#### Success Response
**HTTP 201 Created**
```json
{
  "_id": "6aa9f948c53afc6b23e52490",
  "parent_id": "6a84052b93171b71e3158e7f",
  "recipient_id": "6a82b7bc84adbdc3f3c19d1f",
  "recipient_role": "Class Teacher",
  "student_id": "6a84052b93171b71e3158e80",
  "subject": "Inquiry regarding Math homework performance",
  "last_message": "Hello Teacher, I wanted to ask how Arvind is performing in Math.",
  "last_message_at": "2026-09-16T02:00:00.000Z",
  "messages": [
    {
      "sender_id": "6a84052b93171b71e3158e7f",
      "sender_role": "Parent",
      "message": "Hello Teacher, I wanted to ask how Arvind is performing in Math."
    }
  ]
}
```

#### Error Responses
* **HTTP 400 Bad Request**:
  ```json
  { "message": "Recipient ID, role, student ID, subject, and message are required" }
  ```
* **HTTP 403 Forbidden** (When recipient is not the Class Incharge, Subject Teacher, or School Admin of the child's class):
  ```json
  { "message": "Forbidden: Parents can only initiate messages with their child's Class Teacher, Subject Teacher, or School Admin." }
  ```

---

### 15.4 Reply to Conversation Thread

#### Endpoint
`POST /api/parent/messages/:conversationId/reply`

#### Access
Authenticated Parent

#### Path Parameters
* `conversationId`: MongoDB ObjectId of `ParentConversation` (Required)

#### Request Body
```json
{
  "message": "Thank you for the update!",
  "attachment": ""
}
```

#### Success Response
**HTTP 200 OK**
```json
{
  "message": "Reply sent successfully",
  "conversation": {
    "_id": "6aa9f948c53afc6b23e52490",
    "parent_id": "6a84052b93171b71e3158e7f",
    "last_message": "Thank you for the update!",
    "last_message_at": "2026-09-16T02:10:00.000Z"
  }
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Message text is required" }`
* **HTTP 404 Not Found**: `{ "message": "Conversation not found or access forbidden" }`

---

## 16. Leave Request APIs

### 16.1 Submit Leave Request for Child

#### Endpoint
`POST /api/parent/leave`

#### Access
Authenticated Parent

#### Request Body
```json
{
  "student_id": "6a84052b93171b71e3158e80",
  "leave_type": "Sick Leave",
  "from_date": "2026-09-20",
  "to_date": "2026-09-21",
  "reason": "Fever and doctor recommended rest.",
  "attachment": ""
}
```

#### Success Response
**HTTP 201 Created**
```json
{
  "message": "Leave request submitted successfully",
  "leave": {
    "_id": "6aa9f94ec53afc6b23e52430",
    "student_id": "6a84052b93171b71e3158e80",
    "parent_user_id": "6a84052b93171b71e3158e7f",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "class_id": "6a840119ef78578a90316739",
    "leave_type": "Sick Leave",
    "from_date": "2026-09-20T00:00:00.000Z",
    "to_date": "2026-09-21T00:00:00.000Z",
    "reason": "Fever and doctor recommended rest.",
    "attachment": "",
    "status": "Pending"
  }
}
```

#### Error Responses
* **HTTP 400 Bad Request**: `{ "message": "Student ID, leave type, dates, and reason are required" }`
* **HTTP 403 Forbidden**: `{ "message": "Access forbidden: You can only access details for your linked children." }`

---

### 16.2 List Submitted Leave Requests

#### Endpoint
`GET /api/parent/leave`

#### Access
Authenticated Parent

#### Query Parameters
* `studentId`: Optional MongoDB ObjectId of student filter

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "_id": "6aa9f94ec53afc6b23e52430",
    "student_id": {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1"
    },
    "leave_type": "Sick Leave",
    "from_date": "2026-09-20T00:00:00.000Z",
    "to_date": "2026-09-21T00:00:00.000Z",
    "reason": "Fever and doctor recommended rest.",
    "status": "Pending",
    "createdAt": "2026-09-16T02:00:00.000Z"
  }
]
```

---

### 16.3 Get Specific Leave Request Details

#### Endpoint
`GET /api/parent/leave/:id`

#### Access
Authenticated Parent

#### Path Parameters
* `id`: MongoDB ObjectId of `StudentLeave` (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "_id": "6aa9f94ec53afc6b23e52430",
  "student_id": {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind",
    "roll_no": "1"
  },
  "leave_type": "Sick Leave",
  "from_date": "2026-09-20T00:00:00.000Z",
  "to_date": "2026-09-21T00:00:00.000Z",
  "reason": "Fever and doctor recommended rest.",
  "status": "Pending"
}
```

#### Error Responses
* **HTTP 404 Not Found**: `{ "message": "Leave request not found or access forbidden" }`

---

## 17. Bus Tracking APIs

### 17.1 Get Allocated Transport Details

#### Endpoint
`GET /api/parent/transport`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
[
  {
    "_id": "6aa9f94ec53afc6b23e52440",
    "student_id": {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1"
    },
    "bus_id": {
      "_id": "6a82b7bc84adbdc3f3c19d40",
      "bus_number": "BUS-101",
      "registration_number": "TN-01-AB-1234"
    },
    "route_id": {
      "_id": "6a82b7bc84adbdc3f3c19d45",
      "name": "Route 4 - Anna Nagar East"
    },
    "stop_id": {
      "_id": "6a82b7bc84adbdc3f3c19d50",
      "name": "Anna Nagar Roundtana"
    }
  }
]
```

---

### 17.2 Get Real-Time Bus Live Location & ETA

#### Endpoint
`GET /api/parent/transport/live-location`

#### Access
Authenticated Parent

#### Success Response
**HTTP 200 OK**
```json
{
  "busNumber": "BUS-101",
  "registrationNumber": "TN-01-AB-1234",
  "routeName": "Route 4 - Anna Nagar East",
  "driverName": "Suresh Kumar",
  "driverMobile": "9876543210",
  "currentLatitude": 13.0827,
  "currentLongitude": 80.2707,
  "currentStop": "Koyambedu Roundtana",
  "nextStop": "Anna Nagar Roundtana",
  "estimatedArrivalTime": "8 mins"
}
```

#### Error Responses
* **HTTP 404 Not Found**: `{ "message": "No active bus transport allocation found for your children" }`

---

## 18. Notification APIs

### 18.1 Get Parent Notifications (Paginated)

#### Endpoint
`GET /api/parent/notifications`

#### Access
Authenticated Parent

#### Query Parameters
* `type`: Optional Notification type filter
* `page`: Integer page number (Default: `1`)
* `limit`: Items per page (Default: `15`)

#### Success Response
**HTTP 200 OK**
```json
{
  "total": 5,
  "unreadCount": 1,
  "page": 1,
  "pages": 1,
  "notifications": [
    {
      "_id": "6aa9f948c53afc6b23e52495",
      "recipient_id": "6a84052b93171b71e3158e7f",
      "title": "Attendance Alert",
      "message": "Arvind was marked Present today.",
      "type": "Attendance Alerts",
      "is_read": false,
      "createdAt": "2026-09-16T08:00:00.000Z"
    }
  ]
}
```

---

### 18.2 Mark Notification as Read

#### Endpoint
`PUT /api/parent/notifications/read/:id`

#### Access
Authenticated Parent

#### Path Parameters
* `id`: MongoDB ObjectId of `Notification` (Required)

#### Success Response
**HTTP 200 OK**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "_id": "6aa9f948c53afc6b23e52495",
    "recipient_id": "6a84052b93171b71e3158e7f",
    "is_read": true,
    "read_at": "2026-09-16T09:15:00.000Z"
  }
}
```

#### Error Responses
* **HTTP 404 Not Found**: `{ "message": "Notification not found" }`

---

## 19. Error Responses Summary

| HTTP Status Code | Scenario / Meaning | Sample Response Format |
|---|---|---|
| **400 Bad Request** | Missing required parameters or invalid payload format | `{ "message": "Please provide mobile number/email and password" }` |
| **401 Unauthorized** | Missing or invalid JWT token, or incorrect credentials | `{ "message": "Invalid credentials" }` or `{ "message": "Not authorized, token failed" }` |
| **403 Forbidden** | Account deactivated, role mismatch, or child ownership access violation | `{ "message": "Access forbidden: You can only access details for your linked children." }` |
| **404 Not Found** | Requested record (student, notice, exam, conversation, transport) does not exist | `{ "message": "Announcement not found" }` |
| **500 Internal Server Error** | Unexpected backend runtime exception | `{ "message": "Failed to fetch dashboard data", "error": "Detailed error string" }` |

---

## 20. Validation & Authorization Rules

1. **Child Ownership Verification (`verifyParentStudentOwnership`)**:
   - For student-specific endpoints (`/students/:studentId`, `/attendance/:studentId`, `/report-card/:studentId/:examId`, etc.), the backend executes `Student.findOne({ _id: studentId, parent_user_id: req.user._id })`.
   - If the student is not linked to `req.user._id`, execution stops immediately with `HTTP 403 Forbidden`.

2. **Teacher Messaging Eligibility Check**:
   - In `POST /api/parent/messages`, parents can only communicate with:
     - The **Class Incharge** of their child's class (`Class.class_incharge_id`).
     - Any **Subject Teacher** assigned to their child's class (`TeacherAssignment`).
     - A **School Admin** (`User` with role `'SchoolAdmin'`).
   - If the recipient does not match any of these criteria for the specified `student_id`, the API returns `HTTP 403 Forbidden`.

3. **Parent Auto-Sync / Profile Laziness**:
   - If a parent logs in or accesses `/api/parent/profile` before a `Parent` profile document is created, the system automatically checks `Student` records linked via `parent_user_id` and creates the `Parent` profile document transparently.

4. **Multi-Input Field Flexibility**:
   - Login accepts credentials passed in `email`, `phone`, `mobile`, `mobile_number`, `phone_number`, `email_or_phone`, `username`, or `identifier`.

---

## 21. Security Findings

> [!WARNING]
> **1. Sub-document ID Matching in `authMiddleware.js`**  
> In `authMiddleware.js`, line 27 attempts `Parent.findById(decoded.id)`. Because `decoded.id` holds `User._id` (and not `Parent._id`), `Parent.findById` will typically return `null`. The middleware then safely falls back to `User.findById(decoded.id)` (line 41). While authentication functions normally due to the fallback, `Parent.findById` query fails to match.

> [!NOTE]
> **2. Sensitive Information Scrubbing**  
> All parent APIs properly omit the password hash (`select('-password')`) and do not expose internal JWT secret strings or sensitive system environment variables.

---

## 22. Existing Documentation vs Actual Backend

| API Endpoint | Existing Documentation | Actual Backend Implementation | Difference / Verified Findings |
|---|---|---|---|
| `POST /api/parent/auth/login` | Documented accepting `email_or_phone` | Accepts `email`, `phone`, `mobile`, `mobile_number`, `phone_number`, `email_or_phone`, `username`, or `identifier` | Backend is far more flexible with field naming. Also returns `token` alongside `accessToken`, `parent`, and `profile`. |
| `POST /api/parent/auth/forgot-password` | Documented accepting `email_or_phone` | Accepts `email_or_phone`, `email`, or `phone` | Extended payload support verified in backend. |
| `GET /api/parent/attendance` | Documented only with `:studentId` path param | Supports both `/api/parent/attendance` (all children) and `/api/parent/attendance/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/homework` | Documented only with `:studentId` path param | Supports both `/api/parent/homework` (all children) and `/api/parent/homework/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/timetable` | Documented only with `:studentId` path param | Supports both `/api/parent/timetable` (all children) and `/api/parent/timetable/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/exams` | Documented only with `:studentId` path param | Supports both `/api/parent/exams` (all children) and `/api/parent/exams/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/results` | Documented only with `:studentId` path param | Supports both `/api/parent/results` (all children) and `/api/parent/results/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/fees` | Documented only with `:studentId` path param | Supports both `/api/parent/fees` (all children) and `/api/parent/fees/:studentId` | Omitted single endpoint form in old documentation. |
| `GET /api/parent/students/:studentId` | Documented flattened attributes only | Returns flattened attributes AND full populated `student` object | Old docs omitted the nested `student` root key. |
| `GET /api/parent/notifications` | Documented standard array output | Returns object with `total`, `unreadCount`, `page`, `pages`, and `notifications` | Old docs omitted pagination wrapper and `unreadCount`. |
| `GET /api/parent/messages/:conversationId` | Not present in old document TOC | Fully implemented in `parentModuleController.js` | Endpoint missing from old documentation. |
| `GET /api/parent/leave/:id` | Not present in old document TOC | Fully implemented in `parentModuleController.js` | Endpoint missing from old documentation. |

---

## 23. Complete Parent API Endpoint List

| # | Method | Endpoint Path | Authentication | Purpose / Functionality |
|---|---|---|---|---|
| 1 | `POST` | `/api/parent/auth/login` | Public | Parent authentication & token generation |
| 2 | `POST` | `/api/parent/auth/logout` | Public / Private | Revoke refresh token & log out parent |
| 3 | `POST` | `/api/parent/auth/refresh-token` | Public | Generate new access token using refresh token |
| 4 | `POST` | `/api/parent/auth/forgot-password` | Public | Request 6-character reset code |
| 5 | `POST` | `/api/parent/auth/reset-password` | Public | Reset password using reset token |
| 6 | `POST` | `/api/parent/auth/change-password` | Parent | Change password for authenticated parent |
| 7 | `GET` | `/api/parent/auth/profile` | Parent | Fetch authenticated user & parent profile |
| 8 | `GET` | `/api/parent/profile` | Parent | Fetch detailed parent profile with linked students |
| 9 | `GET` | `/api/parent/dashboard` | Parent | Fetch aggregated parent dashboard metrics |
| 10 | `GET` | `/api/parent/students` | Parent | List all linked children/students |
| 11 | `GET` | `/api/parent/students/:studentId` | Parent | Get detailed child profile (Ownership enforced) |
| 12 | `GET` | `/api/parent/attendance` | Parent | Get attendance summary for all linked children |
| 13 | `GET` | `/api/parent/attendance/:studentId` | Parent | Get attendance summary & logs for a specific child |
| 14 | `GET` | `/api/parent/homework` | Parent | Get homework assignments for all linked children |
| 15 | `GET` | `/api/parent/homework/:studentId` | Parent | Get homework assignments for a specific child |
| 16 | `GET` | `/api/parent/timetable` | Parent | Get timetable for all linked children |
| 17 | `GET` | `/api/parent/timetable/:studentId` | Parent | Get timetable for a specific child |
| 18 | `GET` | `/api/parent/exams` | Parent | Get exam schedule for all linked children |
| 19 | `GET` | `/api/parent/exams/:studentId` | Parent | Get exam schedule for a specific child |
| 20 | `GET` | `/api/parent/results` | Parent | Get exam results summary for all linked children |
| 21 | `GET` | `/api/parent/results/:studentId` | Parent | Get exam results summary for a specific child |
| 22 | `GET` | `/api/parent/report-card/:studentId/:examId` | Parent | Get full report card & class rank for child & exam |
| 23 | `GET` | `/api/parent/fees` | Parent | Get fee breakdown & payment history for all children |
| 24 | `GET` | `/api/parent/fees/:studentId` | Parent | Get fee breakdown & payment history for specific child |
| 25 | `GET` | `/api/parent/announcements` | Parent | List paginated school announcements |
| 26 | `GET` | `/api/parent/announcements/:id` | Parent | Get details of a specific announcement |
| 27 | `GET` | `/api/parent/messages` | Parent | Get all active conversation threads |
| 28 | `GET` | `/api/parent/messages/:conversationId` | Parent | Get specific conversation thread with messages |
| 29 | `POST` | `/api/parent/messages` | Parent | Start new conversation with teacher or admin |
| 30 | `POST` | `/api/parent/messages/:conversationId/reply` | Parent | Send reply in conversation thread |
| 31 | `POST` | `/api/parent/leave` | Parent | Submit leave request for child |
| 32 | `GET` | `/api/parent/leave` | Parent | List submitted leave requests |
| 33 | `GET` | `/api/parent/leave/:id` | Parent | Get details of a specific leave request |
| 34 | `GET` | `/api/parent/transport` | Parent | Get allocated bus transport details |
| 35 | `GET` | `/api/parent/transport/live-location` | Parent | Get real-time bus live location, driver info & ETA |
| 36 | `GET` | `/api/parent/notifications` | Parent | Fetch paginated in-app notifications |
| 37 | `PUT` | `/api/parent/notifications/read/:id` | Parent | Mark a notification as read |
