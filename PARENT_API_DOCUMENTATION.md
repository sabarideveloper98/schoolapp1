# Parent Module API Specification & Payload Documentation

This document provides full backend API specifications, HTTP methods, route paths, headers, sample request body payloads, and success responses for all **Parent Module** endpoints in the School Management System.

---

## Global Authentication & Headers

All protected endpoints under `/api/parent/*` require JWT Bearer token authorization with **Parent** role privileges.

```http
Authorization: Bearer <your_parent_access_token>
Content-Type: application/json
```

---

## Table of Contents
1. [Parent Authentication APIs](#1-parent-authentication-apis)
2. [Parent Profile API](#2-parent-profile-api)
3. [Parent Dashboard API](#3-parent-dashboard-api)
4. [Child Management APIs](#4-child-management-apis)
5. [Attendance APIs](#5-attendance-apis)
6. [Homework APIs](#6-homework-apis)
7. [Timetable APIs](#7-timetable-apis)
8. [Exam APIs](#8-exam-apis)
9. [Marks & Report Card APIs](#9-marks--report-card-apis)
10. [Fee APIs (Read-Only)](#10-fee-apis-read-only)
11. [Announcement APIs](#11-announcement-apis)
12. [Teacher Communication APIs](#12-teacher-communication-apis)
13. [Leave Request APIs](#13-leave-request-apis)
14. [Bus Tracking APIs](#14-bus-tracking-apis)
15. [Notification APIs](#15-notification-apis)
16. [Security Rules & Audit Logging](#16-security-rules--audit-logging)

---

## 1. Parent Authentication APIs

### 1.1 Parent Login
- **Method**: `POST`
- **URL**: `/api/parent/auth/login`
- **Access**: Public
- **Request Payload**:
```json
{
  "email_or_phone": "siva@gmail.com",
  "password": "123456"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
    "name": "siva",
    "phone": "67890765444",
    "email": "siva@gmail.com"
  },
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1",
      "class_id": { "_id": "6a840119ef78578a90316739", "class": "class 1", "section": "B" }
    }
  ]
}
```

---

### 1.2 Parent Logout
- **Method**: `POST`
- **URL**: `/api/parent/auth/logout`
- **Access**: Private (Parent) / Public with refreshToken
- **Request Payload**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Parent logged out successfully"
}
```

---

### 1.3 Refresh Access Token
- **Method**: `POST`
- **URL**: `/api/parent/auth/refresh-token`
- **Access**: Public
- **Request Payload**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.4 Forgot Password Request
- **Method**: `POST`
- **URL**: `/api/parent/auth/forgot-password`
- **Access**: Public
- **Request Payload**:
```json
{
  "email_or_phone": "siva@gmail.com"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset code generated successfully. Please use this code to reset your password within 15 minutes.",
  "resetToken": "A1B2C3"
}
```

---

### 1.5 Reset Password
- **Method**: `POST`
- **URL**: `/api/parent/auth/reset-password`
- **Access**: Public
- **Request Payload**:
```json
{
  "resetToken": "A1B2C3",
  "newPassword": "newpassword123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

---

### 1.6 Change Password
- **Method**: `POST`
- **URL**: `/api/parent/auth/change-password`
- **Access**: Private (Parent)
- **Request Payload**:
```json
{
  "oldPassword": "123456",
  "newPassword": "newsecurepassword123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 1.7 Get Auth User & Profile
- **Method**: `GET`
- **URL**: `/api/parent/auth/profile`
- **Access**: Private (Parent)
- **Success Response (200 OK)**:
```json
{
  "user": {
    "_id": "6a84052b93171b71e3158e7f",
    "email": "siva@gmail.com",
    "phone": "67890765444",
    "role": "Parent",
    "status": "Active"
  },
  "profile": {
    "_id": "6aa9f948c53afc6b23e52421",
    "name": "siva",
    "phone": "67890765444",
    "email": "siva@gmail.com",
    "address": "chennai"
  },
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "admission_number": "STDCLASS1SECB158E80",
      "roll_no": "1"
    }
  ]
}
```

---

## 2. Parent Profile API

### 2.1 Get Full Parent Profile Details
- **Method**: `GET`
- **URL**: `/api/parent/profile`
- **Access**: Private (Parent)
- **Success Response (200 OK)**:
```json
{
  "parentId": "6aa9f948c53afc6b23e52421",
  "userId": "6a84052b93171b71e3158e7f",
  "parentName": "Siva",
  "fatherName": "Siva Kumar",
  "motherName": "Lakshmi",
  "mobileNumber": "67890765444",
  "alternateMobileNumber": "9876543210",
  "email": "siva@gmail.com",
  "address": "123 Main Street, Chennai",
  "occupation": "Software Engineer",
  "linkedStudents": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "roll_no": "1",
      "admission_number": "STDCLASS1SECB158E80"
    }
  ]
}
```

---

## 3. Parent Dashboard API

### 3.1 Get Dashboard Aggregated Overview
- **Method**: `GET`
- **URL**: `/api/parent/dashboard`
- **Access**: Private (Parent)
- **Success Response (200 OK)**:
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
      "content": "Sports Day starts next Monday."
    }
  ],
  "children": [
    {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind",
      "class_id": { "_id": "6a840119ef78578a90316739", "class": "class 1", "section": "B" }
    }
  ]
}
```

---

## 4. Child Management APIs

### 4.1 List Linked Children
- **Method**: `GET`
- **URL**: `/api/parent/students`
- **Access**: Private (Parent)
- **Success Response (200 OK)**:
```json
[
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
      "code": "GA01"
    }
  }
]
```

---

### 4.2 Get Specific Child Details
- **Method**: `GET`
- **URL**: `/api/parent/students/:studentId`
- **Access**: Private (Parent)
- **Success Response (200 OK)**:
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
  "photo": "https://example.com/student.jpg",
  "academicInformation": {
    "group": "General",
    "registrationNo": "REG10123",
    "religion": "General"
  },
  "parentInformation": {
    "fatherName": "Siva",
    "motherName": "Lakshmi",
    "parentName": "Siva",
    "parentPhone": "67890765444",
    "parentEmail": "siva@gmail.com",
    "guardianRelation": "Father",
    "address": "123 Main Street, Chennai"
  }
}
```
- **Error Response (403 Forbidden)** if trying to access another parent's child:
```json
{
  "message": "Access forbidden: You can only access details for your linked children."
}
```

---

## 5. Attendance APIs

### 5.1 Get Attendance Summary & Logs
- **Method**: `GET`
- **URL**: `/api/parent/attendance/:studentId`
- **Query Parameters**:
  - `filter`: `daily` | `monthly` | `academic_year`
  - `month`: `1` - `12`
  - `year`: `2026`
- **Success Response (200 OK)**:
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

---

## 6. Homework APIs

### 6.1 Get Assigned Homework & Submissions
- **Method**: `GET`
- **URL**: `/api/parent/homework/:studentId`
- **Query Parameters**:
  - `subjectId`: Optional subject filter ID
  - `startDate`, `endDate`: Optional date range
- **Success Response (200 OK)**:
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

## 7. Timetable APIs

### 7.1 Get Daily Class Timetable
- **Method**: `GET`
- **URL**: `/api/parent/timetable/:studentId`
- **Success Response (200 OK)**:
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

## 8. Exam APIs

### 8.1 Get Upcoming & Active Exam Schedule
- **Method**: `GET`
- **URL**: `/api/parent/exams/:studentId`
- **Success Response (200 OK)**:
```json
[
  {
    "examId": "6a87fe6d1636652d6e1c2ada",
    "examName": "Mid-Term Examination 2026",
    "examType": "Term Exam",
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-10-10T00:00:00.000Z",
    "subjects": [
      { "subject_name": "Mathematics", "exam_date": "2026-10-01", "max_marks": 100 },
      { "subject_name": "Science", "exam_date": "2026-10-03", "max_marks": 100 }
    ]
  }
]
```

---

## 9. Marks & Report Card APIs

### 9.1 Get All Exam Results Summary
- **Method**: `GET`
- **URL**: `/api/parent/results/:studentId`
- **Success Response (200 OK)**:
```json
[
  {
    "examId": "6a87fe6d1636652d6e1c2ada",
    "examName": "Mid-Term Examination 2026",
    "studentId": "6a84052b93171b71e3158e80",
    "subjectWiseMarks": [
      { "subjectName": "Mathematics", "marksObtained": 85, "totalMarks": 100, "grade": "A" },
      { "subjectName": "Science", "marksObtained": 90, "totalMarks": 100, "grade": "A+" }
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

### 9.2 Get Full Exam Report Card
- **Method**: `GET`
- **URL**: `/api/parent/report-card/:studentId/:examId`
- **Success Response (200 OK)**:
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

---

## 10. Fee APIs (Read-Only)

### 10.1 Get Fee Breakdown & Payment History
- **Method**: `GET`
- **URL**: `/api/parent/fees/:studentId`
- **Success Response (200 OK)**:
```json
{
  "totalFees": 25000,
  "paidAmount": 15000,
  "pendingAmount": 10000,
  "feeAssignments": [
    {
      "_id": "6aa9f948c53afc6b23e52470",
      "total_amount": 25000,
      "total_paid": 15000,
      "fee_items": [
        {
          "category_id": { "category_name": "Tuition Fee" },
          "amount": 20000,
          "paid_amount": 15000,
          "status": "Partial"
        }
      ]
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

## 11. Announcement APIs

### 11.1 List School Announcements (Paginated)
- **Method**: `GET`
- **URL**: `/api/parent/announcements?page=1&limit=10`
- **Success Response (200 OK)**:
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
      "attachment": "https://example.com/science_fair.pdf"
    }
  ]
}
```

---

### 11.2 Get Specific Announcement Details
- **Method**: `GET`
- **URL**: `/api/parent/announcements/:id`
- **Success Response (200 OK)**:
```json
{
  "id": "6aa9f948c53afc6b23e52480",
  "title": "Annual Science Fair Guidelines",
  "description": "Science fair registration opens on Monday.",
  "createdDate": "2026-09-14T00:00:00.000Z",
  "attachment": "https://example.com/science_fair.pdf"
}
```

---

## 12. Teacher Communication APIs

### 12.1 Get Active Conversations List
- **Method**: `GET`
- **URL**: `/api/parent/messages`
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "6aa9f948c53afc6b23e52490",
    "recipient_id": { "_id": "6a82b7bc84adbdc3f3c19d1f", "email": "arun@gmail.com" },
    "recipient_role": "Class Teacher",
    "subject": "Inquiry regarding Math homework performance",
    "last_message": "Thank you, teacher!",
    "last_message_at": "2026-09-16T02:00:00.000Z"
  }
]
```

---

### 12.2 Start New Conversation with Class/Subject Teacher or School Admin
- **Method**: `POST`
- **URL**: `/api/parent/messages`
- **Request Payload**:
```json
{
  "recipient_id": "6a82b7bc84adbdc3f3c19d1f",
  "recipient_role": "Class Teacher",
  "student_id": "6a84052b93171b71e3158e80",
  "subject": "Inquiry regarding Math homework performance",
  "message": "Hello Teacher, I wanted to ask how Arvind is performing in Math."
}
```
- **Error Response (403 Forbidden)** if attempting to message unassigned teacher:
```json
{
  "message": "Forbidden: Parents can only initiate messages with their child's Class Teacher, Subject Teacher, or School Admin."
}
```

---

### 12.3 Reply to Conversation Thread
- **Method**: `POST`
- **URL**: `/api/parent/messages/:conversationId/reply`
- **Request Payload**:
```json
{
  "message": "Thank you for the update!",
  "attachment": ""
}
```

---

## 13. Leave Request APIs

### 13.1 Submit Leave Request for Child
- **Method**: `POST`
- **URL**: `/api/parent/leave`
- **Request Payload**:
```json
{
  "student_id": "6a84052b93171b71e3158e80",
  "leave_type": "Sick Leave",
  "from_date": "2026-09-20",
  "to_date": "2026-09-21",
  "reason": "Fever and doctor recommended rest.",
  "attachment": "https://example.com/medical_certificate.pdf"
}
```
- **Success Response (201 Created)**:
```json
{
  "message": "Leave request submitted successfully",
  "leave": {
    "_id": "6aa9f94ec53afc6b23e52430",
    "student_id": "6a84052b93171b71e3158e80",
    "leave_type": "Sick Leave",
    "status": "Pending"
  }
}
```

---

### 13.2 List Submitted Leave Requests
- **Method**: `GET`
- **URL**: `/api/parent/leave?studentId=6a84052b93171b71e3158e80`

---

## 14. Bus Tracking APIs

### 14.1 Get Allocated Transport Details
- **Method**: `GET`
- **URL**: `/api/parent/transport`

---

### 14.2 Get Real-Time Bus Live Location & ETA
- **Method**: `GET`
- **URL**: `/api/parent/transport/live-location`
- **Success Response (200 OK)**:
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

---

## 15. Notification APIs

### 15.1 Get Parent In-App Notifications
- **Method**: `GET`
- **URL**: `/api/parent/notifications?type=Attendance Alerts&page=1&limit=15`
- **Supported Notification Types**:
  - `Attendance Alerts`
  - `Homework Alerts`
  - `Exam Notifications`
  - `Fee Notifications`
  - `School Announcements`
  - `Teacher Messages`
  - `Bus Alerts`

---

### 15.2 Mark Notification as Read
- **Method**: `PUT`
- **URL**: `/api/parent/notifications/read/:id`

---

## 16. Security Rules & Audit Logging

1. **Child Ownership Isolation**: Every request inspecting a child's attendance, homework, timetable, exams, report cards, or fees verifies that `student.parent_user_id === req.user._id`. Violations return `403 Forbidden`.
2. **Teacher Messaging Scope**: Parents can ONLY initiate conversations with the **Class Teacher**, **Subject Teacher**, or **School Admin** assigned to their linked children. Unassigned user messages return `403 Forbidden`.
3. **Audit Activity Log**: All parent API invocations are logged into the `AuditLog` collection with `user_id`, `action`, `ip_address`, `params`, and `timestamp`.
