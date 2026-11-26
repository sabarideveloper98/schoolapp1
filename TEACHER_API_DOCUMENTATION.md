# Teacher Portal API Specification & Payload Documentation

This document contains full API endpoint details, HTTP methods, route paths, headers, request body sample payloads, and success responses for all **Teacher Portal** endpoints in the School Management System.

---

## Global Authentication & Headers

All endpoints under `/api/teacher/*` require JWT Bearer token authorization with **Teacher** role privileges.

```http
Authorization: Bearer <your_teacher_jwt_token>
Content-Type: application/json
```

---

## Table of Contents
1. [Teacher Authentication & Profile](#1-teacher-authentication--profile)
2. [Teacher Dashboard Overview](#2-teacher-dashboard-overview)
3. [My Classes & Student Management](#3-my-classes--student-management)
4. [Student Attendance Module](#4-student-attendance-module)
5. [Exams & Marks Entry](#5-exams--marks-entry)
6. [Study Materials & Resources](#6-study-materials--resources)
7. [Teacher Leave Management](#7-teacher-leave-management)
8. [Student Conduct & Remarks](#8-student-conduct--remarks)
9. [Parent Queries & Messages](#9-parent-queries--messages)
10. [Notices & Announcements](#10-notices--announcements)
11. [Academic Reports & Notifications](#11-academic-reports--notifications)
12. [Teacher Login – Homework Module API Documentation (Section A)](#12-teacher-login--homework-module-api-documentation-section-a)
13. [Teacher Login – Assignments Module API Documentation (Section B)](#13-teacher-login--assignments-module-api-documentation-section-b)
14. [Frontend Integration & Field Mapping Verification](#14-frontend-integration--field-mapping-verification)

---

## 1. Teacher Authentication & Profile

### 1.1 Teacher Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Request Payload**:
```json
{
  "email": "arun@gmail.com",
  "password": "123"
}
```
- **Response (200 OK)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a01",
  "email": "arun@gmail.com",
  "phone": "9876543210",
  "role": "Teacher",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 Get Teacher Profile & Assignments
- **Method**: `GET`
- **URL**: `/api/teacher/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "teacher": {
    "_id": "66e7b1a20a1b2c3d4e5f6a01",
    "name": "Arun Kumar",
    "email": "arun@gmail.com",
    "phone": "9876543210",
    "qualification": "M.Sc Mathematics",
    "experience": 5,
    "photo": "https://example.com/photo.jpg"
  },
  "inchargeClasses": [
    {
      "_id": "66e7b1a20a1b2c3d4e5f6a04",
      "class": "10",
      "section": "A"
    }
  ],
  "assignments": [
    {
      "class_id": { "_id": "66e7b1a20a1b2c3d4e5f6a04", "class": "10", "section": "A" },
      "subject_id": { "_id": "66e7b1a20a1b2c3d4e5f6a03", "name": "Mathematics", "code": "MATH101" }
    }
  ],
  "isClassIncharge": true
}
```

---

### 1.3 Update Teacher Profile
- **Method**: `PUT`
- **URL**: `/api/teacher/profile`
- **Request Payload**:
```json
{
  "qualification": "M.Sc, B.Ed Mathematics",
  "experience": 6,
  "phone": "9876543210",
  "photo": "https://example.com/new_photo.jpg"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Profile updated successfully",
  "teacher": {
    "_id": "66e7b1a20a1b2c3d4e5f6a01",
    "qualification": "M.Sc, B.Ed Mathematics",
    "experience": 6
  }
}
```

---

### 1.4 Change Password
- **Method**: `PUT`
- **URL**: `/api/teacher/change-password`
- **Request Payload**:
```json
{
  "old_password": "123",
  "new_password": "newpassword123"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Password changed successfully"
}
```

---

## 2. Teacher Dashboard Overview

### 2.1 Get Dashboard Overview & Today's Schedule
- **Method**: `GET`
- **URL**: `/api/teacher/dashboard-stats`
- **Response (200 OK)**:
```json
{
  "assignedClassesCount": 2,
  "totalStudents": 65,
  "todaysClassesCount": 4,
  "todaysClasses": [
    {
      "day": "Monday",
      "period": 1,
      "subject": "Mathematics",
      "class": "10-A",
      "start_time": "09:00 AM",
      "end_time": "09:45 AM"
    }
  ],
  "pendingAttendanceCount": 1,
  "pendingHomeworkCount": 2,
  "upcomingExamsCount": 1,
  "unreadQueriesCount": 3,
  "latestAnnouncements": [
    {
      "_id": "66e7b1a20a1b2c3d4e5f6a20",
      "title": "Annual Sports Day Notice",
      "content": "Sports Day starts next Friday."
    }
  ]
}
```

---

## 3. My Classes & Student Management

### 3.1 Get Assigned Classes List
- **Method**: `GET`
- **URL**: `/api/teacher/classes`
- **Response (200 OK)**:
```json
[
  {
    "_id": "66e7b1a20a1b2c3d4e5f6a04",
    "class": "10",
    "section": "A",
    "isIncharge": true,
    "subjects": [
      { "_id": "66e7b1a20a1b2c3d4e5f6a03", "name": "Mathematics", "code": "MATH101" }
    ]
  }
]
```

---

### 3.2 Get Assigned Class Students
- **Method**: `GET`
- **URL**: `/api/teacher/students?classId=66e7b1a20a1b2c3d4e5f6a04`
- **Response (200 OK)**:
```json
[
  {
    "_id": "66e7b1a20a1b2c3d4e5f6a07",
    "student_name": "Oliver Ullrich",
    "roll_no": "101",
    "admission_number": "ADM10123",
    "gender": "Male",
    "group": "Science",
    "parent_name": "John Ullrich",
    "parent_phone": "9876543210"
  }
]
```

---

### 3.3 Get Single Student Details
- **Method**: `GET`
- **URL**: `/api/teacher/students/66e7b1a20a1b2c3d4e5f6a07`
- **Response (200 OK)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a07",
  "student_name": "Oliver Ullrich",
  "first_name": "Oliver",
  "last_name": "Ullrich",
  "roll_no": "101",
  "admission_number": "ADM10123",
  "dob": "2012-05-15",
  "blood_group": "O+",
  "religion": "Christianity",
  "address": "789 Pine Ave, Boston",
  "parent_name": "John Ullrich",
  "parent_phone": "9876543210",
  "parent_email": "john.ullrich@gmail.com"
}
```

---

### 3.4 Add New Student (Class Incharge privilege)
- **Method**: `POST`
- **URL**: `/api/teacher/students`
- **Request Payload**:
```json
{
  "first_name": "Sarah",
  "last_name": "Conor",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "roll_no": "102",
  "gender": "Female",
  "group": "Science",
  "admission_number": "ADM10124",
  "guardian_name": "James Conor",
  "guardian_phone": "9876543299",
  "guardian_email": "james.conor@gmail.com",
  "guardian_relation": "Father"
}
```
- **Response (201 Created)**:
```json
{
  "student": {
    "_id": "66e7b1a20a1b2c3d4e5f6a25",
    "student_name": "Sarah Conor",
    "roll_no": "102"
  },
  "parentPassword": "123456",
  "message": "Student created successfully"
}
```

---

### 3.5 Update Student Details
- **Method**: `PUT`
- **URL**: `/api/teacher/students/66e7b1a20a1b2c3d4e5f6a07`
- **Request Payload**:
```json
{
  "roll_no": "101",
  "guardian_phone": "9876543210",
  "address": "790 Pine Ave, Boston"
}
```

---

## 4. Student Attendance Module

### 4.1 Mark Daily Class Attendance
- **Method**: `POST`
- **URL**: `/api/teacher/attendance`
- **Request Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "date": "2026-09-16",
  "records": [
    {
      "student_id": "66e7b1a20a1b2c3d4e5f6a07",
      "name": "Oliver Ullrich",
      "admission_number": "ADM10123",
      "roll_no": "101",
      "status": "Present"
    },
    {
      "student_id": "66e7b1a20a1b2c3d4e5f6a25",
      "name": "Sarah Conor",
      "admission_number": "ADM10124",
      "roll_no": "102",
      "status": "Absent"
    }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "message": "Attendance marked successfully"
}
```

---

### 4.2 Get Class Attendance Log Report
- **Method**: `GET`
- **URL**: `/api/teacher/attendance/report?classId=66e7b1a20a1b2c3d4e5f6a04&date=2026-09-16`
- **Response (200 OK)**:
```json
{
  "date": "2026-09-16",
  "class": "10-A",
  "totalStudents": 2,
  "presentCount": 1,
  "absentCount": 1,
  "attendanceRate": 50.0,
  "records": [
    {
      "student_id": "66e7b1a20a1b2c3d4e5f6a07",
      "student_name": "Oliver Ullrich",
      "status": "Present"
    }
  ]
}
```

---

## 5. Exams & Marks Entry

### 5.1 Get Assigned Class Exams
- **Method**: `GET`
- **URL**: `/api/teacher/exams?classId=66e7b1a20a1b2c3d4e5f6a04`
- **Response (200 OK)**:
```json
[
  {
    "_id": "66e7b1a20a1b2c3d4e5f6a10",
    "name": "Mid-Term Examination 2026",
    "exam_type": "Term Exam",
    "start_date": "2026-10-01",
    "end_date": "2026-10-10"
  }
]
```

---

### 5.2 Save Student Exam Marks
- **Method**: `POST`
- **URL**: `/api/teacher/marks`
- **Request Payload**:
```json
{
  "exam_id": "66e7b1a20a1b2c3d4e5f6a10",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "student_marks": [
    {
      "student_id": "66e7b1a20a1b2c3d4e5f6a07",
      "marks": [
        {
          "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
          "marks_obtained": 92,
          "total_marks": 100
        }
      ]
    }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "message": "Exam marks saved successfully"
}
```

---

### 5.3 Get Marks Report & Rank List
- **Method**: `GET`
- **URL**: `/api/teacher/marks/report?examId=66e7b1a20a1b2c3d4e5f6a10&classId=66e7b1a20a1b2c3d4e5f6a04`
- **Response (200 OK)**:
```json
[
  {
    "rank": 1,
    "student_name": "Oliver Ullrich",
    "totalMarksObtained": 92,
    "maxMarks": 100,
    "percentage": "92.00%",
    "grade": "A+"
  }
]
```

---

## 6. Study Materials & Resources

### 6.1 Get Uploaded Study Materials
- **Method**: `GET`
- **URL**: `/api/teacher/materials?classId=66e7b1a20a1b2c3d4e5f6a04`

---

### 6.2 Upload Study Material
- **Method**: `POST`
- **URL**: `/api/teacher/materials`
- **Request Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
  "title": "Chapter 4 Algebra Worksheets",
  "resource_type": "PDF Document",
  "url": "https://example.com/materials/algebra_ch4.pdf",
  "description": "Practice set for upcoming midterm."
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a30",
  "title": "Chapter 4 Algebra Worksheets",
  "resource_type": "PDF Document",
  "message": "Study material uploaded successfully"
}
```

---

### 6.3 Delete Study Material
- **Method**: `DELETE`
- **URL**: `/api/teacher/materials/66e7b1a20a1b2c3d4e5f6a30`

---

## 7. Teacher Leave Management

### 7.1 Get My Leave Requests
- **Method**: `GET`
- **URL**: `/api/teacher/leaves`

---

### 7.2 Apply for Leave
- **Method**: `POST`
- **URL**: `/api/teacher/leaves`
- **Request Payload**:
```json
{
  "leave_type": "Casual Leave",
  "start_date": "2026-09-25",
  "end_date": "2026-09-26",
  "reason": "Attending family function"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a40",
  "leave_type": "Casual Leave",
  "status": "Pending",
  "message": "Leave application submitted"
}
```

---

### 7.3 Cancel Leave Request
- **Method**: `PUT`
- **URL**: `/api/teacher/leaves/66e7b1a20a1b2c3d4e5f6a40/cancel`
- **Response (200 OK)**:
```json
{
  "message": "Leave request cancelled"
}
```

---

## 8. Student Conduct & Remarks

### 8.1 Get Student Conduct Remarks
- **Method**: `GET`
- **URL**: `/api/teacher/remarks?studentId=66e7b1a20a1b2c3d4e5f6a07`

---

### 8.2 Add Student Behaviour Note / Remark
- **Method**: `POST`
- **URL**: `/api/teacher/remarks`
- **Request Payload**:
```json
{
  "student_id": "66e7b1a20a1b2c3d4e5f6a07",
  "category": "Appreciation",
  "title": "Outstanding Class Participation",
  "remark": "Oliver solved advanced calculus problems on the board today."
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a50",
  "category": "Appreciation",
  "title": "Outstanding Class Participation",
  "message": "Remark added successfully"
}
```

---

### 8.3 Delete Student Remark
- **Method**: `DELETE`
- **URL**: `/api/teacher/remarks/66e7b1a20a1b2c3d4e5f6a50`

---

## 9. Parent Queries & Messages

### 9.1 Get Unread & Resolved Parent Queries
- **Method**: `GET`
- **URL**: `/api/teacher/queries`

---

### 9.2 Reply to Parent Query
- **Method**: `POST`
- **URL**: `/api/teacher/queries/66e7b1a20a1b2c3d4e5f6a60/reply`
- **Request Payload**:
```json
{
  "reply_message": "Oliver scored 92% in mathematics. His progress is great."
}
```
- **Response (200 OK)**:
```json
{
  "message": "Reply sent to parent successfully"
}
```

---

### 9.3 Send Direct Message / Announcement to Class
- **Method**: `POST`
- **URL**: `/api/teacher/messages`
- **Request Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "content": "Tomorrow we have a special Math quiz. Please prepare."
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a65",
  "content": "Tomorrow we have a special Math quiz. Please prepare."
}
```

---

## 10. Notices & Announcements

### 10.1 Get Class & School Notices
- **Method**: `GET`
- **URL**: `/api/teacher/notices`

---

### 10.2 Send Class Notice
- **Method**: `POST`
- **URL**: `/api/teacher/notices`
- **Request Payload**:
```json
{
  "title": "Assignment Deadline Extension",
  "content": "Math assignment 3 deadline extended to Friday.",
  "target_class_id": "66e7b1a20a1b2c3d4e5f6a04"
}
```

---

### 10.3 School Circulars Feed (Read-Only)
- **Method**: `GET`
- **URL**: `/api/teacher/announcements`

---

## 11. Academic Reports & Notifications

### 11.1 Get Teacher Reports Center Data
- **Method**: `GET`
- **URL**: `/api/teacher/reports?type=academic_summary`

---

### 11.2 Get Teacher In-App Notifications
- **Method**: `GET`
- **URL**: `/api/teacher/notifications`

---

### 11.3 Get Transport & Bus Details
- **Method**: `GET`
- **URL**: `/api/teacher/transport`

---

## 12. Teacher Login – Homework Module API Documentation (Section A)

This section documents all backend endpoints, data contracts, validation rules, database collections, and response schemas for the **Teacher Login – Homework Module**.

All endpoints enforce teacher authorization: teachers can access, view, create, edit, delete, and grade homework **only for their assigned classes and subjects**, or homework created by their authenticated account.

---

### 12.1 Get All Homework
Retrieves the list of homework assigned by or accessible to the authenticated teacher, with full submission stats and class details.

- **API Name**: Get All Homework
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework` (Aliases: `/api/teacher/homework/list`, `/api/homework/list`, `/api/homework`)
- **Controller**: `getHomeworkList` (`backend/src/controllers/homeworkController.js`)
- **Service Name**: `homeworkController` / Mongoose Tenant Proxy (`Homework`, `HomeworkAssignment`, `HomeworkSubmission`, `HomeworkReview`)
- **Authentication & Authorization**: Bearer JWT Token (`protect`, `authorize('Teacher')`). Teachers can only access homework they created or homework assigned to classes they teach.
- **Required Headers**:
  ```http
  Authorization: Bearer <your_teacher_jwt_token>
  Content-Type: application/json
  ```
- **Request Parameters**:
  - `class_id` (Query, Optional): 24-character Class ObjectId to filter homework by class.
  - `section` (Query, Optional): Section name (e.g. `"A"`).
  - `subject_id` (Query, Optional): Subject ObjectId or Subject name string.
  - `category` (Query, Optional): Filter category (`"Homework"` by default).
  - `status` (Query, Optional): Filter status (`"Active"`, `"Completed"`, `"Cancelled"`).
  - `envelope` (Query, Optional): Pass `envelope=true` to receive structured JSON envelope with pagination.
  - `page` (Query, Optional): Page number (default: 1).
  - `limit` (Query, Optional): Items per page (default: 50).
- **Request Payload**: None (GET request).
- **Successful Response (200 OK - Enveloped)**:
  ```json
  {
    "success": true,
    "message": "Homework retrieved successfully",
    "data": {
      "homework": [
        {
          "_id": "673b50c18400afef78578a10",
          "homeworkId": "673b50c18400afef78578a10",
          "school_id": "6a80c942dfec1156a94d3c01",
          "created_by": "6a82bd339b0cdf6610288f25",
          "creator_name": "Balaji",
          "teacherId": "6a82bd339b0cdf6610288f25",
          "teacherName": "Balaji",
          "title": "Quadratic Equations Practice Set 3",
          "description": "Complete textbook exercises 4.1 to 4.3 on quadratic roots and factorization.",
          "instructions": "Show all intermediate derivation steps. Submit scanned PDF.",
          "category": "Homework",
          "assignment_type": "Class",
          "academicYear": "2026-2027",
          "classId": "6ac8f6397ae01d3a464b2c15",
          "className": "Class 10",
          "sectionId": "A",
          "sectionName": "A",
          "subjectId": "6a8400afef78578a90316732",
          "subjectName": "Mathematics",
          "assignedDate": "2026-11-17T09:00:00.000Z",
          "submissionDate": "2026-11-20T23:59:59.000Z",
          "dueDate": "2026-11-20T23:59:59.000Z",
          "attachment": "https://schoolapp.s3.amazonaws.com/homework/math_set3.pdf",
          "document": "https://schoolapp.s3.amazonaws.com/homework/math_set3.pdf",
          "video_link": "https://youtube.com/watch?v=sampleMathDemo",
          "max_marks": 100,
          "status": "Active",
          "createdDate": "2026-11-17T09:00:00.000Z",
          "updatedDate": "2026-11-17T09:00:00.000Z",
          "stats": {
            "totalAssigned": 35,
            "totalSubmitted": 28,
            "totalReviewed": 24,
            "totalLate": 3,
            "pendingSubmissions": 7
          }
        }
      ],
      "totalRecords": 1,
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "limit": 50
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    { "message": "Not authorized, token failed" }
    ```
  - `403 Forbidden`:
    ```json
    { "message": "Forbidden: You do not have permission to access this resource" }
    ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`, `classes`.

---

### 12.2 Get Homework by ID
Fetches full details of a specific homework item by its unique ObjectId.

- **API Name**: Get Homework by ID
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/:id` (Alias: `/api/homework/:id`)
- **Controller**: `getHomeworkById` (`backend/src/controllers/homeworkController.js`)
- **Service Name**: `homeworkController`
- **Authentication & Authorization**: Bearer JWT Token (`protect`, `authorize('Teacher')`). Teacher must be creator or assigned to the homework's class.
- **Required Headers**: `Authorization: Bearer <token>`
- **Request Parameters**:
  - `id` (Path, Required): 24-character Homework ObjectId.
- **Request Payload**: None.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework details retrieved successfully",
    "data": {
      "homework": {
        "homeworkId": "673b50c18400afef78578a10",
        "title": "Quadratic Equations Practice Set 3",
        "description": "Complete textbook exercises 4.1 to 4.3 on quadratic roots and factorization.",
        "instructions": "Show all intermediate derivation steps. Submit scanned PDF.",
        "category": "Homework",
        "className": "Class 10",
        "sectionName": "A",
        "subjectName": "Mathematics",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "assignedDate": "2026-11-17T09:00:00.000Z",
        "dueDate": "2026-11-20T23:59:59.000Z",
        "submissionDate": "2026-11-20T23:59:59.000Z",
        "max_marks": 100,
        "status": "Active",
        "stats": {
          "totalAssigned": 35,
          "totalSubmitted": 28,
          "totalReviewed": 24,
          "pendingSubmissions": 7
        }
      },
      "assignments": [
        {
          "_id": "673b50c18400afef78578b01",
          "homework_id": "673b50c18400afef78578a10",
          "student_id": {
            "_id": "671234567890abcdef123456",
            "student_name": "Aarav Sharma",
            "roll_no": "101",
            "admission_number": "ADM2026001",
            "parent_name": "Rajesh Sharma",
            "parent_phone": "9876543210"
          },
          "status": "Submitted"
        }
      ],
      "submissions": [
        {
          "_id": "673b50c18400afef78578c01",
          "homework_id": "673b50c18400afef78578a10",
          "student_id": "671234567890abcdef123456",
          "submission_notes": "Completed all 15 questions.",
          "attachment_url": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "submitted_at": "2026-11-18T14:30:00.000Z",
          "is_late": false
        }
      ],
      "reviews": [
        {
          "_id": "673b50c18400afef78578d01",
          "submission_id": "673b50c18400afef78578c01",
          "marks_obtained": 96,
          "remarks": "Excellent work. Clear derivation steps.",
          "status": "Approved",
          "evaluated_at": "2026-11-18T16:00:00.000Z"
        }
      ]
    }
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Homework / Assignment not found"
  }
  ```
- **Error Response (403 Forbidden)**:
  ```json
  {
    "success": false,
    "message": "Forbidden: You do not have permission to access this homework/assignment"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`.

---

### 12.3 Get Homework by Class
Retrieves all homework assigned to a specific class.

- **API Name**: Get Homework by Class
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/class/:classId` (Alias: `/api/homework/class/:classId`)
- **Controller**: `getClassHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`). Verified against teacher's authorized class list.
- **Request Parameters**:
  - `classId` (Path, Required): 24-character Class ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Class homework retrieved successfully",
    "data": {
      "classId": "6ac8f6397ae01d3a464b2c15",
      "totalRecords": 2,
      "homework": [
        {
          "_id": "673b50c18400afef78578a10",
          "title": "Quadratic Equations Practice Set 3",
          "subject_name": "Mathematics",
          "category": "Homework",
          "assigned_section": "A",
          "due_date": "2026-11-20T23:59:59.000Z",
          "status": "Active"
        }
      ]
    }
  }
  ```
- **Error Response (403 Forbidden)**:
  ```json
  {
    "success": false,
    "message": "Forbidden: You are not authorized to view homework for this class"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `500 Server Error`.
- **Database Collections**: `homeworks`, `classes`.

---

### 12.4 Get Homework by Section
Retrieves all homework assigned to a specific class and section.

- **API Name**: Get Homework by Section
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/class/:classId/section/:section` (Alias: `/api/homework/class/:classId/section/:section`)
- **Controller**: `getSectionHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`). Authorized for teacher's classes.
- **Request Parameters**:
  - `classId` (Path, Required): Class ObjectId.
  - `section` (Path, Required): Section name (e.g. `"A"`).
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Section homework retrieved successfully",
    "data": {
      "classId": "6ac8f6397ae01d3a464b2c15",
      "section": "A",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "673b50c18400afef78578a10",
          "title": "Quadratic Equations Practice Set 3",
          "subject_name": "Mathematics",
          "assigned_section": "A",
          "due_date": "2026-11-20T23:59:59.000Z"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`.

---

### 12.5 Get Homework by Subject
Retrieves all homework filtered by subject identifier or subject name.

- **API Name**: Get Homework by Subject
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/subject/:subjectId` (Alias: `/api/homework/subject/:subjectId`)
- **Controller**: `getSubjectHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `subjectId` (Path, Required): Subject ObjectId or Subject Name string (e.g. `Mathematics`).
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subject homework retrieved successfully",
    "data": {
      "subjectId": "Mathematics",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "673b50c18400afef78578a10",
          "title": "Quadratic Equations Practice Set 3",
          "subject_name": "Mathematics",
          "category": "Homework",
          "status": "Active"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Server Error`.
- **Database Collections**: `homeworks`.

---

### 12.6 Create Homework
Creates a new homework record, automatically associates the authenticated teacher's ID, provisions student assignment rows (`HomeworkAssignment`), and triggers notifications.

- **API Name**: Create Homework
- **HTTP Method**: `POST`
- **Complete Route**: `/api/teacher/homework` (Aliases: `/api/teacher/homework/create`, `/api/homework/create`, `/api/homework`)
- **Controller**: `createHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer JWT Token (`protect`, `authorize('Teacher')`). Verifies teacher is authorized for target classes.
- **Required Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Request Payload (JSON)**:
  ```json
  {
    "title": "Quadratic Equations Practice Set 3",
    "subject_name": "Mathematics",
    "subject_id": "6a8400afef78578a90316732",
    "description": "Complete textbook exercises 4.1 to 4.3 on quadratic roots and factorization.",
    "instructions": "Show all intermediate derivation steps. Submit scanned PDF.",
    "category": "Homework",
    "assignment_type": "Class",
    "assigned_classes": ["6ac8f6397ae01d3a464b2c15"],
    "assigned_section": "A",
    "assigned_students": [],
    "due_date": "2026-11-20T23:59:59.000Z",
    "attachment_url": "https://schoolapp.s3.amazonaws.com/homework/math_set3.pdf",
    "video_link": "https://youtube.com/watch?v=sampleMathDemo",
    "max_marks": 100
  }
  ```
- **Validation Rules**:
  - `title`, `subject_name`, `description`, `assignment_type`, and `due_date` are mandatory.
  - `assigned_classes` must belong to classes assigned to the logged-in teacher.
  - `category` defaults to `"Homework"` when called under homework routes.
- **Successful Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Homework created and assigned successfully",
    "homework": {
      "_id": "673b50c18400afef78578a10",
      "school_id": "6a80c942dfec1156a94d3c01",
      "created_by": "6a82bd339b0cdf6610288f25",
      "creator_name": "Balaji",
      "teacher_id": "6a82bd339b0cdf6610288f25",
      "title": "Quadratic Equations Practice Set 3",
      "subject_name": "Mathematics",
      "description": "Complete textbook exercises 4.1 to 4.3 on quadratic roots and factorization.",
      "category": "Homework",
      "assignment_type": "Class",
      "assigned_classes": ["6ac8f6397ae01d3a464b2c15"],
      "assigned_section": "A",
      "due_date": "2026-11-20T23:59:59.000Z",
      "attachment_url": "https://schoolapp.s3.amazonaws.com/homework/math_set3.pdf",
      "max_marks": 100,
      "status": "Active",
      "createdAt": "2026-11-17T09:00:00.000Z"
    },
    "data": {
      "homework": { /* object */ },
      "assignedCount": 35
    },
    "assignedCount": 35
  }
  ```
- **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Title, subject name, description, assignment type and due date are required"
  }
  ```
- **Error Response (403 Forbidden)**:
  ```json
  {
    "success": false,
    "message": "Forbidden: You are not authorized to assign homework/assignments to classes you do not teach"
  }
  ```
- **HTTP Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworknotifications`.

---

### 12.7 Update Homework
Updates attributes (title, description, due date, attachments) of an existing homework item.

- **API Name**: Update Homework
- **HTTP Method**: `PUT`
- **Complete Route**: `/api/teacher/homework/:id` (Aliases: `/api/teacher/homework/update/:id`, `/api/homework/update/:id`, `/api/homework/:id`)
- **Controller**: `updateHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`). Teacher must be creator or class incharge.
- **Request Parameters**:
  - `id` (Path, Required): Homework ObjectId.
- **Request Payload (JSON)**:
  ```json
  {
    "title": "Quadratic Equations Practice Set 3 (Extended)",
    "description": "Deadline extended by 2 days. Complete questions 1 to 20.",
    "due_date": "2026-11-22T23:59:59.000Z",
    "max_marks": 100
  }
  ```
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework updated successfully",
    "homework": {
      "_id": "673b50c18400afef78578a10",
      "title": "Quadratic Equations Practice Set 3 (Extended)",
      "due_date": "2026-11-22T23:59:59.000Z",
      "status": "Active"
    },
    "data": {
      "homework": { /* updated object */ }
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`.

---

### 12.8 Delete Homework
Deletes a homework item and cascades removal of all associated assignment rows, submissions, reviews, and notifications.

- **API Name**: Delete Homework
- **HTTP Method**: `DELETE`
- **Complete Route**: `/api/teacher/homework/:id` (Aliases: `/api/teacher/homework/delete/:id`, `/api/homework/delete/:id`, `/api/homework/:id`)
- **Controller**: `deleteHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`). Teacher must be creator or authorized class teacher.
- **Request Parameters**:
  - `id` (Path, Required): Homework ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework and associated records deleted successfully"
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Homework / Assignment not found"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`, `homeworknotifications`.

---

### 12.9 Get Homework Details
Fetches homework metadata alongside full student assignment lists, submission records, and evaluation reviews.

- **API Name**: Get Homework Details
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/details/:id` (Alias: `/api/homework/details/:id`)
- **Controller**: `getHomeworkById` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`).
- **Request Parameters**:
  - `id` (Path, Required): Homework ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework details retrieved successfully",
    "data": {
      "homework": {
        "homeworkId": "673b50c18400afef78578a10",
        "title": "Quadratic Equations Practice Set 3",
        "subjectName": "Mathematics",
        "className": "Class 10",
        "sectionName": "A",
        "dueDate": "2026-11-20T23:59:59.000Z",
        "stats": {
          "totalAssigned": 35,
          "totalSubmitted": 28,
          "totalReviewed": 24,
          "pendingSubmissions": 7
        }
      },
      "assignments": [ /* assignment array */ ],
      "submissions": [ /* submission array */ ],
      "reviews": [ /* review array */ ]
    },
    "homework": { /* dual-envelope compatibility for UI */ },
    "assignments": [ /* ... */ ],
    "submissions": [ /* ... */ ],
    "reviews": [ /* ... */ ]
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`.

---

### 12.10 Get Homework Submission Status
Provides real-time submission metrics (total, submitted, pending, late, reviewed, percentage completion rate) and student-by-student status records for a given homework.

- **API Name**: Get Homework Submission Status
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/:id/submission-status` (Aliases: `/api/homework/:id/submission-status`, `/api/homework/submission-status/:id`, `/api/teacher/homework/reports/status`)
- **Controller**: `getHomeworkSubmissionStatus` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`).
- **Request Parameters**:
  - `id` (Path, Required): Homework ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework submission status retrieved successfully",
    "data": {
      "homeworkId": "673b50c18400afef78578a10",
      "title": "Quadratic Equations Practice Set 3",
      "category": "Homework",
      "subjectName": "Mathematics",
      "className": "Class 10",
      "sectionName": "A",
      "assignedDate": "2026-11-17T09:00:00.000Z",
      "dueDate": "2026-11-20T23:59:59.000Z",
      "submissionDate": "2026-11-20T23:59:59.000Z",
      "status": "Active",
      "totalStudents": 35,
      "submittedStudents": 28,
      "pendingStudents": 7,
      "reviewedStudents": 24,
      "lateStudents": 3,
      "submissionRate": 80.0,
      "students": [
        {
          "assignmentId": "673b50c18400afef78578b01",
          "studentId": "671234567890abcdef123456",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "rollNo": "101",
          "class": "Class 10",
          "section": "A",
          "status": "Reviewed",
          "submittedAt": "2026-11-18T14:30:00.000Z",
          "attachmentUrl": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "submissionNotes": "Completed all 15 questions.",
          "isLate": false,
          "marksObtained": 96,
          "maxMarks": 100,
          "teacherRemarks": "Excellent work. Clear derivation steps.",
          "evaluatedAt": "2026-11-18T16:00:00.000Z"
        },
        {
          "assignmentId": "673b50c18400afef78578b02",
          "studentId": "671234567890abcdef123457",
          "studentName": "Diya Patel",
          "admissionNumber": "ADM2026002",
          "rollNo": "102",
          "class": "Class 10",
          "section": "A",
          "status": "Pending",
          "submittedAt": null,
          "attachmentUrl": "",
          "submissionNotes": "",
          "isLate": false,
          "marksObtained": null,
          "maxMarks": 100,
          "teacherRemarks": "",
          "evaluatedAt": null
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`.

---

### 12.11 Get Student Homework Submissions
Retrieves student submissions with student profile, class, attachments, notes, and grading review records.

- **API Name**: Get Student Homework Submissions
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/homework/submissions` (Aliases: `/api/teacher/homework/:id/submissions`, `/api/homework/submissions`, `/api/homework/:id/submissions`)
- **Controller**: `getHomeworkSubmissions` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`).
- **Request Parameters**:
  - `homework_id` / `:id` (Query / Path, Optional): Filter submissions by Homework ID.
  - `class_id` (Query, Optional): Filter submissions by Class ID.
  - `student_id` (Query, Optional): Filter submissions by Student ID.
  - `status` (Query, Optional): Filter by status (`"Submitted"`, `"Reviewed"`, `"Late"`).
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework submissions retrieved successfully",
    "data": {
      "submissions": [
        {
          "submissionId": "673b50c18400afef78578c01",
          "homeworkId": "673b50c18400afef78578a10",
          "homeworkTitle": "Quadratic Equations Practice Set 3",
          "subjectName": "Mathematics",
          "dueDate": "2026-11-20T23:59:59.000Z",
          "maxMarks": 100,
          "studentId": "671234567890abcdef123456",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "Class 10",
          "section": "A",
          "submissionNotes": "Completed all 15 questions.",
          "attachmentUrl": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "document": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "submittedAt": "2026-11-18T14:30:00.000Z",
          "submissionDate": "2026-11-18T14:30:00.000Z",
          "isLate": false,
          "submissionStatus": "Reviewed",
          "marksObtained": 96,
          "teacherRemarks": "Excellent work. Clear derivation steps.",
          "evaluatedBy": "Balaji",
          "evaluatedAt": "2026-11-18T16:00:00.000Z",
          "createdDate": "2026-11-18T14:30:00.000Z",
          "updatedDate": "2026-11-18T16:00:00.000Z"
        }
      ],
      "totalRecords": 1
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworksubmissions`, `homeworkreviews`, `students`, `homeworks`.

---

### 12.12 Review Student Homework
Records teacher evaluations, marks obtained, qualitative remarks, and approval status for a student's submission.

- **API Name**: Review Student Homework
- **HTTP Method**: `POST`
- **Complete Route**: `/api/teacher/homework/evaluate` (Aliases: `/api/teacher/homework/review`, `/api/homework/evaluate`, `/api/homework/review`)
- **Controller**: `evaluateSubmission` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`).
- **Required Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Payload (JSON)**:
  ```json
  {
    "submission_id": "673b50c18400afef78578c01",
    "marks_obtained": 96,
    "remarks": "Excellent work. Clear derivation steps.",
    "status": "Approved"
  }
  ```
- **Payload Validation**:
  - `submission_id` is required (24-character ObjectId).
  - `marks_obtained` must be a non-negative number.
  - `status` must be one of: `"Approved"`, `"Needs Improvement"`, `"Rejected"`.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework evaluated successfully",
    "review": {
      "_id": "673b50c18400afef78578d01",
      "submission_id": "673b50c18400afef78578c01",
      "homework_id": "673b50c18400afef78578a10",
      "student_id": "671234567890abcdef123456",
      "evaluated_by": "6a82bd339b0cdf6610288f25",
      "marks_obtained": 96,
      "remarks": "Excellent work. Clear derivation steps.",
      "status": "Approved",
      "evaluated_at": "2026-11-18T16:00:00.000Z"
    },
    "data": {
      "review": { /* review object */ }
    }
  }
  ```
- **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Submission ID is required"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`.
- **Database Collections**: `homeworkreviews`, `homeworksubmissions`, `homeworkassignments`, `homeworknotifications`.

---

### 12.13 Update Homework Status
Changes the lifecycle status of a homework item between Active, Completed, and Cancelled.

- **API Name**: Update Homework Status
- **HTTP Method**: `PATCH` (Also accepts `PUT`)
- **Complete Route**: `/api/teacher/homework/:id/status` (Aliases: `/api/homework/:id/status`, `/api/homework/status/:id`)
- **Controller**: `updateHomeworkStatus` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`). Teacher must be creator or class incharge.
- **Request Parameters**:
  - `id` (Path, Required): Homework ObjectId.
- **Request Payload (JSON)**:
  ```json
  {
    "status": "Completed"
  }
  ```
- **Allowed Status Values**: `"Active"`, `"Completed"`, `"Cancelled"`.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework status updated to Completed successfully",
    "data": {
      "homeworkId": "673b50c18400afef78578a10",
      "title": "Quadratic Equations Practice Set 3",
      "category": "Homework",
      "status": "Completed",
      "updatedAt": "2026-11-18T16:30:00.000Z"
    }
  }
  ```
- **Error Response (400 Bad Request - Invalid Status)**:
  ```json
  {
    "success": false,
    "message": "Invalid status. Allowed values are: Active, Completed, Cancelled"
  }
  ```
- **Error Response (403 Forbidden)**:
  ```json
  {
    "success": false,
    "message": "Forbidden: You are not authorized to update the status of this homework/assignment"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`.

---

## 13. Teacher Login – Assignments Module API Documentation (Section B)

This section documents all backend endpoints, data contracts, validation rules, database collections, and response schemas for the **Teacher Login – Assignments Module**.

The Assignments Module shares the unified coursework architecture where `category = "Assignment"`. When invoking routes under `/api/teacher/assignments/*` or `/api/assignments/*`, the backend automatically filters and persists `category: "Assignment"`.

---

### 13.1 Get All Assignments
Retrieves all academic assignments assigned by or accessible to the teacher.

- **API Name**: Get All Assignments
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments` (Aliases: `/api/teacher/assignments/list`, `/api/assignments`, `/api/assignments/list`)
- **Controller**: `getHomeworkList` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`).
- **Request Parameters**:
  - `class_id` (Query, Optional): Filter by Class ObjectId.
  - `section` (Query, Optional): Section name (e.g. `"A"`).
  - `subject_id` (Query, Optional): Subject ObjectId or name string.
  - `status` (Query, Optional): `"Active"`, `"Completed"`, `"Cancelled"`.
  - `envelope` (Query, Optional): Pass `envelope=true` for full envelope.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment retrieved successfully",
    "data": {
      "homework": [
        {
          "_id": "673b50c18400afef78578e10",
          "homeworkId": "673b50c18400afef78578e10",
          "title": "Science Lab Term Project – Organic Chemistry",
          "description": "Perform synthesis report on esters and submit observations with laboratory apparatus diagrams.",
          "category": "Assignment",
          "assignment_type": "Class",
          "className": "Class 10",
          "sectionName": "A",
          "subjectName": "Science",
          "teacherId": "6a82bd339b0cdf6610288f25",
          "teacherName": "Balaji",
          "assignedDate": "2026-11-15T09:00:00.000Z",
          "submissionDate": "2026-11-25T23:59:59.000Z",
          "dueDate": "2026-11-25T23:59:59.000Z",
          "attachment": "https://schoolapp.s3.amazonaws.com/assignments/chemistry_project.pdf",
          "document": "https://schoolapp.s3.amazonaws.com/assignments/chemistry_project.pdf",
          "max_marks": 50,
          "status": "Active",
          "stats": {
            "totalAssigned": 35,
            "totalSubmitted": 30,
            "totalReviewed": 26,
            "totalLate": 2,
            "pendingSubmissions": 5
          }
        }
      ],
      "totalRecords": 1,
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "limit": 50
      }
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`.

---

### 13.2 Get Assignment by ID
Retrieves details for a specific assignment by its ObjectId.

- **API Name**: Get Assignment by ID
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/:id` (Alias: `/api/assignments/:id`)
- **Controller**: `getHomeworkById` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` (Path, Required): Assignment ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment details retrieved successfully",
    "data": {
      "homework": {
        "homeworkId": "673b50c18400afef78578e10",
        "title": "Science Lab Term Project – Organic Chemistry",
        "category": "Assignment",
        "subjectName": "Science",
        "className": "Class 10",
        "sectionName": "A",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "assignedDate": "2026-11-15T09:00:00.000Z",
        "dueDate": "2026-11-25T23:59:59.000Z",
        "max_marks": 50,
        "status": "Active"
      },
      "assignments": [ /* assignment array */ ],
      "submissions": [ /* submission array */ ],
      "reviews": [ /* review array */ ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`.

---

### 13.3 Get Assignments by Class
Retrieves assignments targeted to a specific class.

- **API Name**: Get Assignments by Class
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/class/:classId` (Alias: `/api/assignments/class/:classId`)
- **Controller**: `getClassHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `classId` (Path, Required): Class ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment homework retrieved successfully",
    "data": {
      "classId": "6ac8f6397ae01d3a464b2c15",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "673b50c18400afef78578e10",
          "title": "Science Lab Term Project – Organic Chemistry",
          "category": "Assignment",
          "due_date": "2026-11-25T23:59:59.000Z"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`.

---

### 13.4 Get Assignments by Section
Retrieves assignments targeted to a specific class and section.

- **API Name**: Get Assignments by Section
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/class/:classId/section/:section` (Alias: `/api/assignments/class/:classId/section/:section`)
- **Controller**: `getSectionHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `classId` (Path, Required): Class ObjectId.
  - `section` (Path, Required): Section name (e.g. `"A"`).
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment homework retrieved successfully",
    "data": {
      "classId": "6ac8f6397ae01d3a464b2c15",
      "section": "A",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "673b50c18400afef78578e10",
          "title": "Science Lab Term Project – Organic Chemistry",
          "category": "Assignment",
          "assigned_section": "A"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`.

---

### 13.5 Get Assignments by Subject
Retrieves assignments filtered by subject name or subject ObjectId.

- **API Name**: Get Assignments by Subject
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/subject/:subjectId` (Alias: `/api/assignments/subject/:subjectId`)
- **Controller**: `getSubjectHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `subjectId` (Path, Required): Subject ObjectId or name (e.g. `Science`).
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment homework retrieved successfully",
    "data": {
      "subjectId": "Science",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "673b50c18400afef78578e10",
          "title": "Science Lab Term Project – Organic Chemistry",
          "subject_name": "Science",
          "category": "Assignment"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`.

---

### 13.6 Create Assignment
Creates a new assignment record with automatic category resolution (`"Assignment"`), stores teacher identity, and distributes student assignments.

- **API Name**: Create Assignment
- **HTTP Method**: `POST`
- **Complete Route**: `/api/teacher/assignments` (Aliases: `/api/teacher/assignments/create`, `/api/assignments`, `/api/assignments/create`)
- **Controller**: `createHomework` (`backend/src/controllers/homeworkController.js`)
- **Authentication & Authorization**: Bearer Token (`protect`, `authorize('Teacher')`). Enforces class teaching authorization.
- **Request Payload (JSON)**:
  ```json
  {
    "title": "Science Lab Term Project – Organic Chemistry",
    "subject_name": "Science",
    "subject_id": "6a8400afef78578a90316744",
    "description": "Perform synthesis report on esters and submit observations with laboratory apparatus diagrams.",
    "instructions": "Max 5 pages. Attach chemical reaction equations and apparatus schematics.",
    "category": "Assignment",
    "assignment_type": "Class",
    "assigned_classes": ["6ac8f6397ae01d3a464b2c15"],
    "assigned_section": "A",
    "due_date": "2026-11-25T23:59:59.000Z",
    "attachment_url": "https://schoolapp.s3.amazonaws.com/assignments/chemistry_project.pdf",
    "max_marks": 50
  }
  ```
- **Successful Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Assignment created and assigned successfully",
    "homework": {
      "_id": "673b50c18400afef78578e10",
      "title": "Science Lab Term Project – Organic Chemistry",
      "category": "Assignment",
      "teacher_id": "6a82bd339b0cdf6610288f25",
      "due_date": "2026-11-25T23:59:59.000Z",
      "max_marks": 50,
      "status": "Active"
    },
    "data": {
      "homework": { /* object */ },
      "assignedCount": 35
    },
    "assignedCount": 35
  }
  ```
- **HTTP Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworknotifications`.

---

### 13.7 Update Assignment
Modifies assignment title, description, due date, maximum marks, or attachments.

- **API Name**: Update Assignment
- **HTTP Method**: `PUT`
- **Complete Route**: `/api/teacher/assignments/:id` (Aliases: `/api/teacher/assignments/update/:id`, `/api/assignments/:id`)
- **Controller**: `updateHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` (Path, Required): Assignment ObjectId.
- **Request Payload (JSON)**:
  ```json
  {
    "title": "Science Lab Term Project – Organic Chemistry (Updated Guidelines)",
    "due_date": "2026-11-28T23:59:59.000Z"
  }
  ```
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment updated successfully",
    "homework": {
      "_id": "673b50c18400afef78578e10",
      "title": "Science Lab Term Project – Organic Chemistry (Updated Guidelines)",
      "due_date": "2026-11-28T23:59:59.000Z"
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`.

---

### 13.8 Delete Assignment
Removes an assignment and cleans up all associated records across student assignments, submissions, and evaluations.

- **API Name**: Delete Assignment
- **HTTP Method**: `DELETE`
- **Complete Route**: `/api/teacher/assignments/:id` (Alias: `/api/assignments/:id`)
- **Controller**: `deleteHomework` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` (Path, Required): Assignment ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment and associated records deleted successfully"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`, `homeworknotifications`.

---

### 13.9 Get Assignment Details
Fetches full assignment details with embedded student assignment records and submissions.

- **API Name**: Get Assignment Details
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/details/:id` (Alias: `/api/assignments/details/:id`)
- **Controller**: `getHomeworkById` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` (Path, Required): Assignment ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment details retrieved successfully",
    "data": {
      "homework": {
        "homeworkId": "673b50c18400afef78578e10",
        "title": "Science Lab Term Project – Organic Chemistry",
        "category": "Assignment",
        "subjectName": "Science",
        "className": "Class 10",
        "sectionName": "A",
        "dueDate": "2026-11-25T23:59:59.000Z",
        "max_marks": 50,
        "status": "Active"
      },
      "assignments": [ /* array */ ],
      "submissions": [ /* array */ ],
      "reviews": [ /* array */ ]
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`, `homeworkassignments`, `homeworksubmissions`, `homeworkreviews`.

---

### 13.10 Get Student Assignment Submissions
Fetches submissions specifically associated with an assignment.

- **API Name**: Get Student Assignment Submissions
- **HTTP Method**: `GET`
- **Complete Route**: `/api/teacher/assignments/:id/submissions` (Aliases: `/api/teacher/assignments/submissions`, `/api/assignments/:id/submissions`, `/api/assignments/submissions`)
- **Controller**: `getHomeworkSubmissions` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` / `homework_id` (Path / Query, Optional): Assignment ObjectId.
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework submissions retrieved successfully",
    "data": {
      "submissions": [
        {
          "submissionId": "673b50c18400afef78578f01",
          "homeworkId": "673b50c18400afef78578e10",
          "homeworkTitle": "Science Lab Term Project – Organic Chemistry",
          "subjectName": "Science",
          "maxMarks": 50,
          "studentId": "671234567890abcdef123456",
          "studentName": "Aarav Sharma",
          "class": "Class 10",
          "section": "A",
          "submissionNotes": "Attached project report and ester reaction data.",
          "attachmentUrl": "https://schoolapp.s3.amazonaws.com/subs/aarav_chem_project.pdf",
          "submittedAt": "2026-11-20T11:00:00.000Z",
          "submissionStatus": "Reviewed",
          "marksObtained": 48,
          "teacherRemarks": "Thorough report with accurate diagrams.",
          "evaluatedBy": "Balaji"
        }
      ],
      "totalRecords": 1
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Database Collections**: `homeworksubmissions`, `homeworkreviews`, `students`.

---

### 13.11 Review Assignment Submission
Evaluates student project and assignment submissions, recording marks and feedback.

- **API Name**: Review Assignment Submission
- **HTTP Method**: `POST`
- **Complete Route**: `/api/teacher/assignments/evaluate` (Aliases: `/api/teacher/assignments/review`, `/api/assignments/evaluate`, `/api/assignments/review`)
- **Controller**: `evaluateSubmission` (`backend/src/controllers/homeworkController.js`)
- **Required Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Payload (JSON)**:
  ```json
  {
    "submission_id": "673b50c18400afef78578f01",
    "marks_obtained": 48,
    "remarks": "Thorough report with accurate diagrams.",
    "status": "Approved"
  }
  ```
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework evaluated successfully",
    "review": {
      "_id": "673b50c18400afef78578f99",
      "submission_id": "673b50c18400afef78578f01",
      "homework_id": "673b50c18400afef78578e10",
      "student_id": "671234567890abcdef123456",
      "evaluated_by": "6a82bd339b0cdf6610288f25",
      "marks_obtained": 48,
      "remarks": "Thorough report with accurate diagrams.",
      "status": "Approved",
      "evaluated_at": "2026-11-21T10:15:00.000Z"
    },
    "data": {
      "review": { /* review object */ }
    }
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`.
- **Database Collections**: `homeworkreviews`, `homeworksubmissions`, `homeworkassignments`, `homeworknotifications`.

---

### 13.12 Update Assignment Status
Updates the assignment lifecycle status (`"Active"`, `"Completed"`, `"Cancelled"`).

- **API Name**: Update Assignment Status
- **HTTP Method**: `PATCH` (Also accepts `PUT`)
- **Complete Route**: `/api/teacher/assignments/:id/status` (Aliases: `/api/assignments/:id/status`, `/api/assignments/status/:id`)
- **Controller**: `updateHomeworkStatus` (`backend/src/controllers/homeworkController.js`)
- **Request Parameters**:
  - `id` (Path, Required): Assignment ObjectId.
- **Request Payload (JSON)**:
  ```json
  {
    "status": "Completed"
  }
  ```
- **Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment status updated to Completed successfully",
    "data": {
      "homeworkId": "673b50c18400afef78578e10",
      "title": "Science Lab Term Project – Organic Chemistry",
      "category": "Assignment",
      "status": "Completed",
      "updatedAt": "2026-11-26T18:00:00.000Z"
    }
  }
  ```
- **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Invalid status. Allowed values are: Active, Completed, Cancelled"
  }
  ```
- **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Database Collections**: `homeworks`.

---

## 14. Frontend Integration & Field Mapping Verification

### 14.1 Frontend Component Architecture
- **Component File**: [`TeacherHomework.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/teacher/TeacherHomework.jsx)
- **Mount Point**: Registered in [`Dashboard.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/teacher/Dashboard.jsx) under route `/teacher/homework` and sidebar navigation item `"Homework Assignments"`.
- **Teacher Context**: Authenticated teacher ID and JWT token are extracted directly from `useAuthStore` (`user.token`, `user.reference_id`, `user.teacher_id`, `user._id`).
- **Class & Student Resolution**:
  - Class list: `GET /api/teacher/classes`
  - Student list: `GET /api/teacher/students`
- **Coursework Management**:
  - Fetch list: `GET /api/homework/list` (also accessible via `/api/teacher/homework/list`)
  - View details & submissions: `GET /api/homework/details/:id` (also accessible via `/api/teacher/homework/details/:id`)
  - Create coursework: `POST /api/homework/create` (with selectable category `"Homework"`, `"Assignment"`, `"Class Work"`, `"Project Work"`)
  - Grade submission: `POST /api/homework/evaluate` (with marks, remarks, and approval status)

### 14.2 Field Mapping Verification Table

| Required Specification Field | Backend Database Property | API Response Property | Frontend Component Consumption |
| :--- | :--- | :--- | :--- |
| **Homework ID / Assignment ID** | `Homework._id` | `_id`, `homeworkId` | `hw._id`, `selectedHomework.homework._id` |
| **Teacher ID** | `Homework.teacher_id`, `created_by` | `teacherId` | Populated in metadata and authorization checks |
| **Teacher Name** | `Homework.creator_name`, `created_by.name` | `teacherName`, `creator_name` | Displayed in assignment header & submission cards |
| **Class Name** | `Class.class`, `class_name` | `className` | Displayed on badge and filter selectors |
| **Section Name** | `Homework.assigned_section` | `sectionName` | Displayed on section pills |
| **Subject Name** | `Homework.subject_name` | `subject_name`, `subjectName` | `hw.subject_name`, `selectedHomework.homework.subject_name` |
| **Title** | `Homework.title` | `title` | `hw.title`, `selectedHomework.homework.title` |
| **Description** | `Homework.description` | `description` | `selectedHomework.homework.description` |
| **Assigned Date** | `Homework.assigned_date` | `assignedDate` | Displayed in details drawer |
| **Submission Date / Due Date** | `Homework.due_date` | `dueDate`, `submissionDate` | `due.toLocaleDateString()` with overdue alerts |
| **Attachment / File URL** | `Homework.attachment_url` | `attachment`, `attachment_url` | Download link and preview button |
| **Total Students** | `HomeworkAssignment` count | `stats.totalAssigned`, `totalStudents` | Stat card 2 & submission counters |
| **Submitted Students** | `HomeworkSubmission` count | `stats.totalSubmitted`, `submittedStudents` | Stat card 3 & progress ratio |
| **Pending Students** | `totalAssigned - totalSubmitted` | `stats.pendingSubmissions`, `pendingStudents` | Dynamic pending badge |
| **Submission Status** | `HomeworkAssignment.status` | `status`, `submissionStatus` | Badge styling (`"Submitted"`, `"Reviewed"`, `"Late"`, `"Pending"`) |
| **Student Submission Details** | `HomeworkSubmission` record | `submissionNotes`, `attachmentUrl` | Submission modal & grading view |
| **Teacher Remarks** | `HomeworkReview.remarks` | `teacherRemarks`, `remarks` | Evaluated remarks input and display |
| **Created At** | `Homework.createdAt` | `createdDate`, `createdAt` | Metadata timestamps |
| **Updated At** | `Homework.updatedAt` | `updatedDate`, `updatedAt` | Metadata timestamps |


