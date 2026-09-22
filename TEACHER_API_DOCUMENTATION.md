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
