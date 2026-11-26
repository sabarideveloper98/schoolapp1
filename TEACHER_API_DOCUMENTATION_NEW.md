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
16. [Teacher Login – Timetable Module API Documentation](#16-teacher-login--timetable-module-api-documentation)
    - [16.1 Get Teacher Timetable (Main / Weekly)](#161-get-teacher-timetable-main--weekly)
    - [16.2 Get Teacher Daily Timetable](#162-get-teacher-daily-timetable)
    - [16.3 Get Teacher Weekly Timetable](#163-get-teacher-weekly-timetable)
    - [16.4 Get Timetable by Date](#164-get-timetable-by-date)
    - [16.5 Get Timetable by Day](#165-get-timetable-by-day)
    - [16.6 Get Timetable by Class](#166-get-timetable-by-class)
    - [16.7 Get Timetable by Section](#167-get-timetable-by-section)
    - [16.8 Get Teacher Assigned Subjects](#168-get-teacher-assigned-subjects)
    - [16.9 Get Teacher Period Details & Timing](#169-get-teacher-period-details--timing)
    - [16.10 Get Teacher Schedule & Workload Summary](#1610-get-teacher-schedule--workload-summary)
    - [16.11 Get Upcoming Classes](#1611-get-upcoming-classes)
    - [16.12 Frontend Timetable Component Integration](#1612-frontend-timetable-component-integration)
17. [Teacher Login – Homework Module API Documentation (Section A)](#17-teacher-login--homework-module-api-documentation-section-a)
    - [17.1 Get All Homework](#171-get-all-homework)
    - [17.2 Get Homework by ID](#172-get-homework-by-id)
    - [17.3 Get Homework by Class](#173-get-homework-by-class)
    - [17.4 Get Homework by Section](#174-get-homework-by-section)
    - [17.5 Get Homework by Subject](#175-get-homework-by-subject)
    - [17.6 Create Homework](#176-create-homework)
    - [17.7 Update Homework](#177-update-homework)
    - [17.8 Delete Homework](#178-delete-homework)
    - [17.9 Get Homework Details](#179-get-homework-details)
    - [17.10 Get Homework Submission Status](#1710-get-homework-submission-status)
    - [17.11 Get Student Homework Submissions](#1711-get-student-homework-submissions)
    - [17.12 Review Student Homework](#1712-review-student-homework)
    - [17.13 Update Homework Status](#1713-update-homework-status)
18. [Teacher Login – Assignments Module API Documentation (Section B)](#18-teacher-login--assignments-module-api-documentation-section-b)
    - [18.1 Get All Assignments](#181-get-all-assignments)
    - [18.2 Get Assignment by ID](#182-get-assignment-by-id)
    - [18.3 Get Assignments by Class](#183-get-assignments-by-class)
    - [18.4 Get Assignments by Section](#184-get-assignments-by-section)
    - [18.5 Get Assignments by Subject](#185-get-assignments-by-subject)
    - [18.6 Create Assignment](#186-create-assignment)
    - [18.7 Update Assignment](#187-update-assignment)
    - [18.8 Delete Assignment](#188-delete-assignment)
    - [18.9 Get Assignment Details](#189-get-assignment-details)
    - [18.10 Get Student Assignment Submissions](#1810-get-student-assignment-submissions)
    - [18.11 Review Assignment Submission](#1811-review-assignment-submission)
    - [18.12 Update Assignment Status](#1812-update-assignment-status)
19. [Frontend Integration & Field Mapping Verification](#19-frontend-integration--field-mapping-verification)

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

## 16. Teacher Login – Timetable Module API Documentation

For complete, dedicated documentation and live schema details, refer to [TEACHER_TIMETABLE_API_DOCUMENTATION.md](file:///Users/sabari/Documents/git/schoolapp/TEACHER_TIMETABLE_API_DOCUMENTATION.md).

### 16.1 Get Teacher Timetable (Main / Weekly)
- **Method & Route**: `GET /api/teacher/timetable` (also `/api/timetable/teacher`)
- **Controller**: `getTeacherTimetableEndpoint` in `teacherController.js`
- **Service**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Auth**: Bearer Token (`protect`, `authorize('Teacher')`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Teacher timetable fetched successfully",
    "data": {
      "teacherId": "6a82bd339b0cdf6610288f25",
      "teacherName": "Balaji",
      "totalPeriods": 6,
      "maxAllowedWeeklyPeriods": 36,
      "workloadStatus": "OK",
      "timetable": [
        {
          "_id": "6acb2942dfec1156a94d3c54",
          "teacherId": "6a82bd339b0cdf6610288f25",
          "teacherName": "Balaji",
          "classId": "6ac8f6397ae01d3a464b2c15",
          "className": "Class 1",
          "sectionName": "A",
          "subjectId": "6a8400afef78578a90316732",
          "subjectName": "Language",
          "periodNumber": 1,
          "periodName": "P1",
          "startTime": "09:20 AM",
          "endTime": "10:00 AM",
          "durationMinutes": 40,
          "timetableDay": "Monday",
          "timetableDate": "2026-11-16",
          "roomNumber": "101",
          "academicYear": "2026-2027",
          "status": "Published"
        }
      ]
    }
  }
  ```

### 16.2 Get Teacher Daily Timetable
- **Method & Route**: `GET /api/teacher/timetable/daily`
- **Query Params**: `?day=Tuesday` or `?date=2026-11-17`
- **Controller**: `getTeacherDailyTimetable` in `teacherController.js`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Daily timetable for Tuesday fetched successfully",
    "data": {
      "teacherId": "6a82bd339b0cdf6610288f25",
      "teacherName": "Balaji",
      "day": "Tuesday",
      "date": "2026-11-17",
      "totalClasses": 2,
      "totalTeachingMinutes": 80,
      "freePeriodsCount": 5,
      "classes": [ /* period objects */ ],
      "timetable": [ /* period objects */ ]
    }
  }
  ```

### 16.3 Get Teacher Weekly Timetable
- **Method & Route**: `GET /api/teacher/timetable/weekly`
- **Controller**: `getTeacherWeeklyTimetable` in `teacherController.js`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Weekly timetable fetched successfully",
    "data": {
      "teacherId": "6a82bd339b0cdf6610288f25",
      "teacherName": "Balaji",
      "academicYear": "2026-2027",
      "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "totalWeeklyPeriods": 6,
      "maxAllowedWeeklyPeriods": 36,
      "workloadStatus": "OK",
      "dailySummary": {
        "Monday": { "periodCount": 4, "teachingMinutes": 160 },
        "Tuesday": { "periodCount": 2, "teachingMinutes": 80 }
      },
      "weeklySchedule": { "Monday": [ /* ... */ ], "Tuesday": [ /* ... */ ] },
      "timetable": [ /* full 6 slots */ ]
    }
  }
  ```

### 16.4 Get Timetable by Date
- **Method & Route**: `GET /api/teacher/timetable/date/:date` (e.g. `/date/2026-11-16`)
- **Controller**: `getTeacherTimetableByDate` in `teacherController.js`

### 16.5 Get Timetable by Day
- **Method & Route**: `GET /api/teacher/timetable/day/:day` (e.g. `/day/Monday`)
- **Controller**: `getTeacherTimetableByDay` in `teacherController.js`

### 16.6 Get Timetable by Class
- **Method & Route**: `GET /api/teacher/timetable/class/:classId` (e.g. `/class/6ac8f6397ae01d3a464b2c15`)
- **Controller**: `getTeacherClassTimetable` in `teacherController.js`

### 16.7 Get Timetable by Section
- **Method & Route**: `GET /api/teacher/timetable/class/:classId/section/:sectionId`
- **Controller**: `getTeacherSectionTimetable` in `teacherController.js`

### 16.8 Get Teacher Assigned Subjects
- **Method & Route**: `GET /api/teacher/timetable/subjects`
- **Controller**: `getTeacherAssignedSubjects` in `teacherController.js`

### 16.9 Get Teacher Period Details & Timing
- **Method & Route**: `GET /api/teacher/timetable/periods` & `GET /api/teacher/timetable/period-timings`
- **Controller**: `getTeacherPeriodDetails` in `teacherController.js`

### 16.10 Get Teacher Schedule & Workload Summary
- **Method & Route**: `GET /api/teacher/timetable/schedule`
- **Controller**: `getTeacherScheduleEndpoint` in `teacherController.js`

### 16.11 Get Upcoming Classes
- **Method & Route**: `GET /api/teacher/timetable/upcoming`
- **Controller**: `getTeacherUpcomingClasses` in `teacherController.js`

### 16.12 Frontend Timetable Component Integration
- **Component File**: [`TeacherTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TeacherTimetable.jsx)
- **Invocation**: Mounted in [`Dashboard.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/teacher/Dashboard.jsx) via `<TeacherTimetable preselectedTeacherId={user?.reference_id || user?.teacher_id || user?._id} />`.
- **API Call**: `GET /api/timetable/teacher/${idToFetch}`
- **Security Check**: Teachers can only view their own timetable. Any attempt to access another teacher's timetable ID yields `403 Forbidden: Access denied: You can only view your own timetable`.

---

## 17. Teacher Login – Homework Module API Documentation (Section A)

This section documents all backend endpoints, data contracts, validation rules, database collections, and response schemas for the **Teacher Login – Homework Module**.

All endpoints enforce teacher authorization: teachers can access, view, create, edit, delete, and grade homework **only for their assigned classes and subjects**, or homework created by their authenticated account.

---

### 17.1 Get All Homework
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

### 17.2 Get Homework by ID
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

### 17.3 Get Homework by Class
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

### 17.4 Get Homework by Section
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

### 17.5 Get Homework by Subject
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

### 17.6 Create Homework
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

### 17.7 Update Homework
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

### 17.8 Delete Homework
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

### 17.9 Get Homework Details
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

### 17.10 Get Homework Submission Status
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

### 17.11 Get Student Homework Submissions
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

### 17.12 Review Student Homework
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

### 17.13 Update Homework Status
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

## 18. Teacher Login – Assignments Module API Documentation (Section B)

This section documents all backend endpoints, data contracts, validation rules, database collections, and response schemas for the **Teacher Login – Assignments Module**.

The Assignments Module shares the unified coursework architecture where `category = "Assignment"`. When invoking routes under `/api/teacher/assignments/*` or `/api/assignments/*`, the backend automatically filters and persists `category: "Assignment"`.

---

### 18.1 Get All Assignments
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

### 18.2 Get Assignment by ID
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

### 18.3 Get Assignments by Class
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

### 18.4 Get Assignments by Section
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

### 18.5 Get Assignments by Subject
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

### 18.6 Create Assignment
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

### 18.7 Update Assignment
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

### 18.8 Delete Assignment
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

### 18.9 Get Assignment Details
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

### 18.10 Get Student Assignment Submissions
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

### 18.11 Review Assignment Submission
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

### 18.12 Update Assignment Status
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

## 19. Frontend Integration & Field Mapping Verification

### 19.1 Frontend Component Architecture
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

### 19.2 Field Mapping Verification Table

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


