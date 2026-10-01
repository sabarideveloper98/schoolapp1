# Teacher Portal API Documentation

This document is the official, implementation-verified API contract for all **Teacher Portal** endpoints in the School Management System. All endpoints, HTTP methods, parameters, request payloads, response objects, data types, and error responses documented herein reflect the active backend source code and empirical live API responses.

---

## Table of Contents

1. [Authentication & Global Headers](#1-authentication--global-headers)
2. [Teacher Authentication & Profile](#2-teacher-authentication--profile)
   - [2.1 Teacher Dedicated Login](#21-teacher-dedicated-login)
   - [2.2 Get Teacher Profile & Assignments](#22-get-teacher-profile--assignments)
   - [2.3 Update Teacher Profile](#23-update-teacher-profile)
   - [2.4 Change Teacher Password](#24-change-teacher-password)
3. [Teacher Dashboard Overview](#3-teacher-dashboard-overview)
   - [3.1 Get Dashboard Stats & Today's Schedule](#31-get-dashboard-stats--todays-schedule)
4. [My Classes & Student Management](#4-my-classes--student-management)
   - [4.1 Get Assigned Classes List](#41-get-assigned-classes-list)
   - [4.2 Get Class Students List](#42-get-class-students-list)
   - [4.3 Get Student Details & Profile](#43-get-student-details--profile)
   - [4.4 Add New Student (Class Incharge)](#44-add-new-student-class-incharge)
   - [4.5 Update Student Information](#45-update-student-information)
5. [Student Attendance Module](#5-student-attendance-module)
   - [5.1 Mark Daily Class Attendance](#51-mark-daily-class-attendance)
   - [5.2 Get Attendance Summary Report](#52-get-attendance-summary-report)
6. [Exams & Marks Entry](#6-exams--marks-entry)
   - [6.1 Get Assigned Class Exams](#61-get-assigned-class-exams)
   - [6.2 Save Student Exam Marks](#62-save-student-exam-marks)
   - [6.3 Bulk Import Exam Marks](#63-bulk-import-exam-marks)
   - [6.4 Get Exam Marks Report & Rank List](#64-get-exam-marks-report--rank-list)
7. [Study Materials & Resources](#7-study-materials--resources)
   - [7.1 Get Uploaded Study Materials](#71-get-uploaded-study-materials)
   - [7.2 Upload Study Material](#72-upload-study-material)
   - [7.3 Delete Study Material](#73-delete-study-material)
8. [Teacher Leave Management](#8-teacher-leave-management)
   - [8.1 Get My Leave Applications](#81-get-my-leave-applications)
   - [8.2 Apply for Leave](#82-apply-for-leave)
   - [8.3 Cancel Pending Leave Application](#83-cancel-pending-leave-application)
9. [Student Conduct & Remarks](#9-student-conduct--remarks)
   - [9.1 Get Student Remarks List](#91-get-student-remarks-list)
   - [9.2 Add Student Behaviour Remark](#92-add-student-behaviour-remark)
   - [9.3 Delete Student Remark](#93-delete-student-remark)
10. [Parent Queries & Messages](#10-parent-queries--messages)
    - [10.1 Get Parent Queries](#101-get-parent-queries)
    - [10.2 Reply to Parent Query](#102-reply-to-parent-query)
    - [10.3 Send Message to Class / Student](#103-send-message-to-class--student)
    - [10.4 Get Sent Messages](#104-get-sent-messages)
11. [Notices & Announcements](#11-notices--announcements)
    - [11.1 Get Teacher Notices](#111-get-teacher-notices)
    - [11.2 Send Class / General Notice](#112-send-class--general-notice)
    - [11.3 Get School Announcements (Read-Only)](#113-get-school-announcements-read-only)
12. [Academic Reports & Notifications](#12-academic-reports--notifications)
    - [12.1 Get Teacher Reports Center Stats](#121-get-teacher-reports-center-stats)
    - [12.2 Get Teacher In-App Notifications](#122-get-teacher-in-app-notifications)
    - [12.3 Get Transport & Bus Details for Assigned Students](#123-get-transport--bus-details-for-assigned-students)
13. [Error Responses](#13-error-responses)
14. [Validation Rules](#14-validation-rules)
15. [Security Notes](#15-security-notes)

---

## 1. Authentication & Global Headers

All operational Teacher endpoints under `/api/teacher/*` require JWT Bearer Token authorization with `Teacher` role privileges.

```http
Authorization: Bearer <your_teacher_jwt_token>
Content-Type: application/json
```

---

## 2. Teacher Authentication & Profile

### 2.1 Teacher Dedicated Login

Authenticates a teacher using email or phone and password, returning JWT access and refresh tokens.

- **Endpoint**: `POST /api/teacher/auth/login` (Also accessible at `POST /api/auth/login`)
- **Access**: Public
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "arun@gmail.com",
    "password": "123456"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contactInput` (`email` / `phone` / `mobile` / `username` / `identifier`) | String | Yes | Teacher email or mobile number. |
| `password` | String | Yes | Plaintext password. |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Teacher login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6a83fed2ef78578a9031672e",
    "name": "arun",
    "email": "arun@gmail.com",
    "role": "Teacher",
    "status": "Active",
    "reference_id": "6a83fed2ef78578a9031672f"
  },
  "teacher": {
    "_id": "6a83fed2ef78578a9031672f",
    "name": "arun",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "email": "arun@gmail.com",
    "phone": "6758940987",
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6
  }
}
```

---

### 2.2 Get Teacher Profile & Assignments

Retrieves complete teacher profile, incharge classes, and subject teaching assignments.

- **Endpoint**: `GET /api/teacher/profile`
- **Access**: Private (Teacher)
- **Authentication**: `Authorization: Bearer <teacher_token>`

#### Success Response (200 OK)
```json
{
  "teacher": {
    "_id": "6a83fed2ef78578a9031672f",
    "name": "arun",
    "email": "arun@gmail.com",
    "phone": "6758940987",
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6,
    "school_id": {
      "_id": "6a82b7bc84adbdc3f3c19d20",
      "name": "jonson"
    }
  },
  "inchargeClasses": [
    {
      "_id": "6a840119ef78578a90316739",
      "class": "class 1",
      "section": "B"
    }
  ],
  "assignments": [
    {
      "_id": "6aa583c7fa470d7fd97a7f34",
      "class_id": {
        "_id": "6a840119ef78578a90316739",
        "class": "class 1",
        "section": "B"
      },
      "subject_id": {
        "_id": "6a8400afef78578a90316732",
        "name": "Language",
        "code": "TAM101"
      }
    }
  ],
  "isClassIncharge": true
}
```

---

### 2.3 Update Teacher Profile

Updates editable profile fields (`qualification`, `experience`, `photo`, `phone`).

- **Endpoint**: `PUT /api/teacher/profile`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6,
    "phone": "6758940987",
    "photo": "https://example.com/photos/arun.jpg"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "teacher": {
    "_id": "6a83fed2ef78578a9031672f",
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6,
    "phone": "6758940987"
  }
}
```

---

### 2.4 Change Teacher Password

- **Endpoint**: `PUT /api/teacher/change-password`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "old_password": "123456",
    "new_password": "newpassword123"
  }
  ```

---

## 3. Teacher Dashboard Overview

### 3.1 Get Dashboard Stats & Today's Schedule

Retrieves counts for assigned classes, total students, today's schedule, pending attendance, pending homework, and latest announcements.

- **Endpoint**: `GET /api/teacher/dashboard-stats`
- **Access**: Private (Teacher)

#### Success Response (200 OK)
```json
{
  "assignedClassesCount": 3,
  "totalStudents": 3,
  "todaysClassesCount": 1,
  "todaysClasses": [
    {
      "_id": "6aa65cf15e419d6bae2ef430",
      "day": "Thursday",
      "period_name": "P1",
      "subject_id": "6a8400afef78578a90316732"
    }
  ],
  "pendingAttendanceCount": 3,
  "pendingHomeworkCount": 0,
  "upcomingExamsCount": 0,
  "unreadQueriesCount": 0,
  "latestAnnouncements": []
}
```

---

## 4. My Classes & Student Management

### 4.1 Get Assigned Classes List

- **Endpoint**: `GET /api/teacher/classes`
- **Access**: Private (Teacher)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a840119ef78578a90316739",
    "class": "class 1",
    "section": "B",
    "isIncharge": true,
    "studentCount": 2,
    "subjects": [
      {
        "_id": "6a8400afef78578a90316732",
        "name": "Language",
        "code": "TAM101"
      }
    ]
  }
]
```

---

### 4.2 Get Class Students List

- **Endpoint**: `GET /api/teacher/students?class_id=6a840119ef78578a90316739`
- **Access**: Private (Teacher)
- **Query Parameters**:
  - `class_id` (Optional): ObjectId string to filter by specific assigned class.

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a84052b93171b71e3158e80",
    "student_name": "arvind kumar",
    "roll_no": "101",
    "admission_number": "STDCLASS1SECB158E80",
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

### 4.3 Get Student Details & Profile

- **Endpoint**: `GET /api/teacher/students/:id`
- **Access**: Private (Teacher)

---

### 4.4 Add New Student (Class Incharge)

- **Endpoint**: `POST /api/teacher/students`
- **Access**: Private (Teacher - Must be Class Incharge for target class)
- **Request Body**:
  ```json
  {
    "student_name": "Sarah Conor",
    "class_id": "6a840119ef78578a90316739",
    "age": 10,
    "dob": "2016-05-15",
    "blood_group": "O+",
    "parent_name": "James Conor",
    "parent_phone": "9876543299",
    "parent_email": "james.conor@gmail.com"
  }
  ```

#### Success Response (201 Created)
```json
{
  "message": "Student and Parent account created successfully",
  "student": {
    "_id": "6abd7200a3dfbfc4d5449c90",
    "student_name": "Sarah Conor",
    "class_id": "6a840119ef78578a90316739"
  },
  "parentPassword": "JamesConor@123"
}
```

---

### 4.5 Update Student Information

- **Endpoint**: `PUT /api/teacher/students/:id`
- **Access**: Private (Teacher - Must be Class Incharge)
- **Request Body**:
  ```json
  {
    "roll_no": "101",
    "address": "790 Pine Ave, Boston"
  }
  ```

---

## 5. Student Attendance Module

### 5.1 Mark Daily Class Attendance

- **Endpoint**: `POST /api/teacher/attendance`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "class_id": "6a840119ef78578a90316739",
    "date": "2026-09-30",
    "records": [
      {
        "student_id": "6a84052b93171b71e3158e80",
        "status": "Present",
        "remarks": "On time"
      }
    ]
  }
  ```

---

### 5.2 Get Attendance Summary Report

- **Endpoint**: `GET /api/teacher/attendance/report?class_id=6a840119ef78578a90316739`
- **Access**: Private (Teacher)

#### Success Response (200 OK)
```json
{
  "records": [],
  "stats": {
    "total": 0,
    "present": 0,
    "absent": 0,
    "leave": 0,
    "halfDay": 0
  }
}
```

---

## 6. Exams & Marks Entry

### 6.1 Get Assigned Class Exams

- **Endpoint**: `GET /api/teacher/exams`
- **Access**: Private (Teacher)

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

### 6.2 Save Student Exam Marks

- **Endpoint**: `POST /api/teacher/marks`
- **Access**: Private (Teacher)

---

## 7. Study Materials & Resources

### 7.1 Get Uploaded Study Materials

- **Endpoint**: `GET /api/teacher/materials`
- **Access**: Private (Teacher)

---

### 7.2 Upload Study Material

- **Endpoint**: `POST /api/teacher/materials`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "title": "Chapter 4 Algebra Worksheets",
    "description": "Practice set for upcoming midterm.",
    "file_url": "https://example.com/materials/algebra_ch4.pdf",
    "file_type": "PDF",
    "class_id": "6a840119ef78578a90316739",
    "subject_id": "6a8400afef78578a90316732"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | Material title. |
| `file_url` | String | Yes | File download / storage URL. |
| `file_type` | String | Yes | Enum value (`"PDF"` | `"DOC"` | `"Video"` | `"Image"` | `"Audio"` | `"Other"`). |

#### Success Response (201 Created)
```json
{
  "message": "Study material uploaded successfully",
  "material": {
    "_id": "6abd5955a3dfbfc4d5449c1e",
    "title": "Chapter 4 Algebra Worksheets",
    "file_type": "PDF",
    "class_id": "6a840119ef78578a90316739"
  }
}
```

---

### 7.3 Delete Study Material

- **Endpoint**: `DELETE /api/teacher/materials/:id`
- **Access**: Private (Teacher)

---

## 8. Teacher Leave Management

### 8.1 Get My Leave Applications

- **Endpoint**: `GET /api/teacher/leaves`
- **Access**: Private (Teacher)

---

### 8.2 Apply for Leave

- **Endpoint**: `POST /api/teacher/leaves`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "leave_type": "Casual Leave",
    "start_date": "2026-10-10",
    "end_date": "2026-10-11",
    "reason": "Attending family function"
  }
  ```

#### Success Response (201 Created)
```json
{
  "message": "Leave application submitted successfully",
  "leave": {
    "_id": "6abd58eba3dfbfc4d5449c16",
    "leave_type": "Casual Leave",
    "status": "Pending"
  }
}
```

---

### 8.3 Cancel Pending Leave Application

- **Endpoint**: `PUT /api/teacher/leaves/:id/cancel`
- **Access**: Private (Teacher)

---

## 9. Student Conduct & Remarks

### 9.1 Get Student Remarks List

- **Endpoint**: `GET /api/teacher/remarks`
- **Access**: Private (Teacher)

---

### 9.2 Add Student Behaviour Remark

- **Endpoint**: `POST /api/teacher/remarks`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "student_id": "6a84052b93171b71e3158e80",
    "class_id": "6a840119ef78578a90316739",
    "type": "Appreciation",
    "title": "Outstanding Class Participation",
    "description": "Excellent performance in class."
  }
  ```

---

## 10. Parent Queries & Messages

### 10.1 Get Parent Queries

- **Endpoint**: `GET /api/teacher/queries`
- **Access**: Private (Teacher)

---

### 10.2 Reply to Parent Query

- **Endpoint**: `POST /api/teacher/queries/:id/reply`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "response": "Progress is great."
  }
  ```

---

### 10.3 Send Message to Class / Student

- **Endpoint**: `POST /api/teacher/messages`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "title": "Math Quiz Notice",
    "message": "Tomorrow we have a special Math quiz. Please prepare.",
    "receiver_type": "Class",
    "receiver_ids": ["6a840119ef78578a90316739"]
  }
  ```

---

## 11. Notices & Announcements

### 11.1 Get Teacher Notices

- **Endpoint**: `GET /api/teacher/notices`
- **Access**: Private (Teacher)

---

### 11.2 Send Class / General Notice

- **Endpoint**: `POST /api/teacher/notices`
- **Access**: Private (Teacher)
- **Request Body**:
  ```json
  {
    "title": "Assignment Deadline Extension",
    "message": "Math assignment 3 deadline extended to Friday.",
    "type": "General Notice",
    "class_id": "6a840119ef78578a90316739"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | Notice title string. |
| `message` | String | Yes | Notice body content. |
| `type` | String | Yes | Enum value (`"General Notice"` \| `"Homework Reminder"` \| `"Attendance Alert"` \| `"Exam Notification"`). |
| `class_id` | String | Yes | Target class ObjectId reference. |

---

## 13. Error Responses

- **400 Bad Request**:
  ```json
  {
    "message": "Old and new passwords are required"
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "message": "Invalid credentials"
  }
  ```
- **403 Forbidden**:
  ```json
  {
    "message": "Not authorized to add student to this class (Must be Class Incharge)"
  }
  ```
- **404 Not Found**:
  ```json
  {
    "message": "Student not found"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Failed to fetch student details",
    "error": "Error details"
  }
  ```

---

## 14. Validation Rules

- Study Material `file_type` must be one of: `"PDF"`, `"DOC"`, `"Video"`, `"Image"`, `"Audio"`, `"Other"`.
- Notice `type` must be one of: `"General Notice"`, `"Homework Reminder"`, `"Attendance Alert"`, `"Exam Notification"`.
- Teacher adding student requires teacher to be designated `class_incharge_id` on the target `Class` document.

---

## 15. Security Notes

- JWT authentication tokens expire after 30 days.
- Sensitive authentication credentials in API responses are redacted in public documentation examples.

---
