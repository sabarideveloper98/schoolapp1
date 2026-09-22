# School Admin API Specification & Payload Documentation

This document contains complete API endpoint details, HTTP methods, route paths, headers, request body sample payloads, and success responses for all **School Admin** endpoints in the School Management System.

---

## Global Authentication & Headers

All endpoints under `/api/schooladmin/*` require JWT Bearer token authorization with **SchoolAdmin** role privileges.

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Table of Contents
1. [Dashboard & Core Statistics](#1-dashboard--core-statistics)
2. [Teacher Management](#2-teacher-management)
3. [Staff Management](#3-staff-management)
4. [Subject Management](#4-subject-management)
5. [Class & Section Management](#5-class--section-management)
6. [Class Subject & Teacher Assignments](#6-class-subject--teacher-assignments)
7. [Student Management](#7-student-management)
8. [Bulk Student Import](#8-bulk-student-import)
9. [Staff & Student Attendance Management](#9-staff--student-attendance-management)
10. [Exams & Marks Management](#10-exams--marks-management)
11. [Payroll & Salary Management](#11-payroll--salary-management)
12. [Fee Management](#12-fee-management)
13. [School Finance & Expenses](#13-school-finance--expenses)
14. [Timetable Management](#14-timetable-management)

---

## 1. Dashboard & Core Statistics

### 1.1 Get School Admin Dashboard Overview
- **Method**: `GET`
- **URL**: `/api/schooladmin/dashboard`
- **Response (200 OK)**:
```json
{
  "totalTeachers": 18,
  "totalStaff": 10,
  "totalStudents": 350,
  "totalClasses": 12,
  "totalSubjects": 14,
  "todayAttendancePercent": 94.5
}
```

---

## 2. Teacher Management

### 2.1 Get All Teachers
- **Method**: `GET`
- **URL**: `/api/schooladmin/teachers`
- **Response (200 OK)**:
```json
[
  {
    "_id": "66e7b1a20a1b2c3d4e5f6a01",
    "name": "Arun Kumar",
    "email": "arun.kumar@gmail.com",
    "phone": "9876543210",
    "qualification": "M.Sc Mathematics",
    "experience": 5,
    "domains": "Algebra, Calculus",
    "address": "456 Park Avenue, City",
    "photo": "https://example.com/photo.jpg"
  }
]
```

### 2.2 Create Teacher Profile
- **Method**: `POST`
- **URL**: `/api/schooladmin/teachers`
- **Payload**:
```json
{
  "name": "Arun Kumar",
  "phone": "9876543210",
  "email": "arun.kumar@gmail.com",
  "password": "teacherpassword123",
  "qualification": "M.Sc Mathematics",
  "experience": 5,
  "domains": "Algebra, Calculus",
  "address": "456 Park Avenue, City",
  "photo": "https://example.com/photo.jpg"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a01",
  "name": "Arun Kumar",
  "email": "arun.kumar@gmail.com",
  "phone": "9876543210",
  "message": "Teacher created successfully"
}
```

### 2.3 Update Teacher Profile
- **Method**: `PUT`
- **URL**: `/api/schooladmin/teachers/:id`
- **Payload**:
```json
{
  "name": "Arun Kumar",
  "phone": "9876543210",
  "email": "arun.kumar@gmail.com",
  "qualification": "Ph.D Mathematics",
  "experience": 7,
  "domains": "Algebra, Calculus, Statistics",
  "address": "789 Grand Lane, City"
}
```

### 2.4 Delete Teacher Profile
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/teachers/:id`
- **Response (200 OK)**:
```json
{
  "message": "Teacher deleted successfully"
}
```

---

## 3. Staff Management

### 3.1 Get All Staff Members
- **Method**: `GET`
- **URL**: `/api/schooladmin/staff`

### 3.2 Create Staff Profile
- **Method**: `POST`
- **URL**: `/api/schooladmin/staff`
- **Payload**:
```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543211",
  "email": "ramesh.staff@gmail.com",
  "password": "staffpassword123",
  "designation": "Accountant",
  "department": "Finance",
  "joining_date": "2024-01-15",
  "salary": 35000,
  "address": "123 Street, City"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a02",
  "name": "Ramesh Kumar",
  "designation": "Accountant",
  "message": "Staff member created successfully"
}
```

### 3.3 Update Staff Profile
- **Method**: `PUT`
- **URL**: `/api/schooladmin/staff/:id`
- **Payload**:
```json
{
  "name": "Ramesh Kumar",
  "designation": "Senior Accountant",
  "salary": 40000
}
```

### 3.4 Delete Staff Member
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/staff/:id`

---

## 4. Subject Management

### 4.1 Get All Subjects
- **Method**: `GET`
- **URL**: `/api/schooladmin/subjects`

### 4.2 Create Subject
- **Method**: `POST`
- **URL**: `/api/schooladmin/subjects`
- **Payload**:
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "type": "Theory"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a03",
  "name": "Mathematics",
  "code": "MATH101",
  "type": "Theory"
}
```

### 4.3 Update Subject
- **Method**: `PUT`
- **URL**: `/api/schooladmin/subjects/:id`
- **Payload**:
```json
{
  "name": "Advanced Mathematics",
  "code": "MATH102",
  "type": "Theory & Practical"
}
```

### 4.4 Delete Subject
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/subjects/:id`

---

## 5. Class & Section Management

### 5.1 Get All Classes
- **Method**: `GET`
- **URL**: `/api/schooladmin/classes`

### 5.2 Create Class & Section
- **Method**: `POST`
- **URL**: `/api/schooladmin/classes`
- **Payload**:
```json
{
  "class": "10",
  "section": "A",
  "class_incharge_id": "66e7b1a20a1b2c3d4e5f6a01"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a04",
  "class": "10",
  "section": "A",
  "class_incharge_id": "66e7b1a20a1b2c3d4e5f6a01"
}
```

### 5.3 Update Class
- **Method**: `PUT`
- **URL**: `/api/schooladmin/classes/:id`
- **Payload**:
```json
{
  "class": "10",
  "section": "A",
  "class_incharge_id": "66e7b1a20a1b2c3d4e5f6a05"
}
```

### 5.4 Delete Class
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/classes/:id`

---

## 6. Class Subject & Teacher Assignments

### 6.1 Get Class Subject Assignments
- **Method**: `GET`
- **URL**: `/api/schooladmin/assignments?classId=66e7b1a20a1b2c3d4e5f6a04`

### 6.2 Assign Subject & Teacher to Class
- **Method**: `POST`
- **URL**: `/api/schooladmin/assignments`
- **Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
  "teacher_id": "66e7b1a20a1b2c3d4e5f6a01"
}
```
- **Response (201 Created)**:
```json
{
  "_id": "66e7b1a20a1b2c3d4e5f6a06",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
  "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
  "message": "Subject assigned to teacher successfully"
}
```

### 6.3 Update Subject Teacher Assignment
- **Method**: `PUT`
- **URL**: `/api/schooladmin/assignments/:id`
- **Payload**:
```json
{
  "teacher_id": "66e7b1a20a1b2c3d4e5f6a05"
}
```

### 6.4 Remove Subject Teacher Assignment
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/assignments/:id`

---

## 7. Student Management

### 7.1 Get All Students
- **Method**: `GET`
- **URL**: `/api/schooladmin/students?classId=66e7b1a20a1b2c3d4e5f6a04`

### 7.2 Create Single Student & Provision Parent Account
- **Method**: `POST`
- **URL**: `/api/schooladmin/students`
- **Payload**:
```json
{
  "first_name": "Oliver",
  "last_name": "Ullrich",
  "father_name": "John Ullrich",
  "mother_name": "Emma Ullrich",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "group": "Science",
  "section": "A",
  "gender": "Male",
  "roll_no": "101",
  "registration_no": "REG10123",
  "religion": "Christianity",
  "admission_number": "ADM10123",
  "address": "789 Pine Ave, Boston",
  "blood_group": "O+",
  "dob": "2012-05-15",
  "guardian_name": "John Ullrich",
  "guardian_phone": "9876543210",
  "guardian_email": "john.ullrich@gmail.com",
  "guardian_relation": "Father",
  "login_password": "123456"
}
```
- **Response (201 Created)**:
```json
{
  "student": {
    "_id": "66e7b1a20a1b2c3d4e5f6a07",
    "student_name": "Oliver Ullrich",
    "roll_no": "101",
    "admission_number": "ADM10123",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "parent_user_id": "66e7b1a20a1b2c3d4e5f6a08"
  },
  "parentPassword": "123456",
  "message": "Student and Parent account created"
}
```

### 7.3 Update Student Details
- **Method**: `PUT`
- **URL**: `/api/schooladmin/students/:id`
- **Payload**:
```json
{
  "first_name": "Oliver",
  "last_name": "Ullrich",
  "roll_no": "102",
  "guardian_phone": "9876543210",
  "guardian_email": "john.updated@gmail.com"
}
```

### 7.4 Delete Student Profile
- **Method**: `DELETE`
- **URL**: `/api/schooladmin/students/:id`

---

## 8. Bulk Student Import

### 8.1 Import Multiple Students via CSV Array
- **Method**: `POST`
- **URL**: `/api/schooladmin/students/bulk-import`
- **Payload**:
```json
{
  "students": [
    {
      "student_name": "Alex Smith",
      "class": "10",
      "section": "A",
      "roll_no": "101",
      "gender": "Male",
      "group": "Science",
      "blood_group": "O+",
      "religion": "Islam",
      "admission_number": "ADM101",
      "registration_no": "REG101",
      "address": "123 Main St",
      "guardian_name": "Robert Smith",
      "guardian_phone": "9876543210",
      "guardian_email": "robert@gmail.com",
      "guardian_relation": "Father"
    },
    {
      "student_name": "Emma Johnson",
      "class": "10",
      "section": "B",
      "roll_no": "102",
      "gender": "Female",
      "group": "Commerce",
      "blood_group": "A+",
      "religion": "Christianity",
      "admission_number": "ADM102",
      "registration_no": "REG102",
      "address": "456 Park Ave",
      "guardian_name": "Sarah Johnson",
      "guardian_phone": "9876543211",
      "guardian_email": "sarah@gmail.com",
      "guardian_relation": "Mother"
    }
  ]
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "count": 2,
  "createdStudents": [
    {
      "student": {
        "_id": "66e7b1a20a1b2c3d4e5f6a09",
        "student_name": "Alex Smith",
        "roll_no": "101"
      },
      "parentPassword": "123456"
    }
  ],
  "errors": [],
  "message": "Successfully imported 2 students"
}
```

---

## 9. Staff & Student Attendance Management

### 9.1 Save Staff Attendance
- **Method**: `POST`
- **URL**: `/api/schooladmin/attendance`
- **Payload**:
```json
{
  "role": "Teacher",
  "date": "2026-09-16",
  "notify_via": "Do not send",
  "records": [
    {
      "user_id": "66e7b1a20a1b2c3d4e5f6a01",
      "name": "Arun Kumar",
      "role": "Teacher",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    }
  ]
}
```

### 9.2 Get Staff Attendance Logs
- **Method**: `GET`
- **URL**: `/api/schooladmin/attendance?date=2026-09-16&role=Teacher`

### 9.3 Get Staff Attendance Report
- **Method**: `GET`
- **URL**: `/api/schooladmin/attendance/report?month=09&year=2026`

### 9.4 Save Student Attendance
- **Method**: `POST`
- **URL**: `/api/schooladmin/student-attendance`
- **Payload**:
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
    }
  ]
}
```

### 9.5 Get Student Attendance Report
- **Method**: `GET`
- **URL**: `/api/schooladmin/student-attendance/report?classId=66e7b1a20a1b2c3d4e5f6a04&month=09&year=2026`

---

## 10. Exams & Marks Management

### 10.1 Create Exam Schedule
- **Method**: `POST`
- **URL**: `/api/schooladmin/exams`
- **Payload**:
```json
{
  "name": "Mid-Term Examination 2026",
  "exam_type": "Term Exam",
  "start_date": "2026-10-01",
  "end_date": "2026-10-10",
  "class_ids": ["66e7b1a20a1b2c3d4e5f6a04"]
}
```

### 10.2 Get Exam List
- **Method**: `GET`
- **URL**: `/api/schooladmin/exams`

### 10.3 Save Student Exam Marks
- **Method**: `POST`
- **URL**: `/api/schooladmin/exam-marks`
- **Payload**:
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
          "marks_obtained": 88,
          "total_marks": 100
        }
      ]
    }
  ]
}
```

### 10.4 Get Exam Report & Rank List
- **Method**: `GET`
- **URL**: `/api/schooladmin/exam-report?examId=66e7b1a20a1b2c3d4e5f6a10&classId=66e7b1a20a1b2c3d4e5f6a04`

---

## 11. Payroll & Salary Management

### 11.1 Save Staff/Teacher Salary Setup
- **Method**: `POST`
- **URL**: `/api/schooladmin/payroll/setup`
- **Payload**:
```json
{
  "employee_type": "Teacher",
  "employee_id": "66e7b1a20a1b2c3d4e5f6a01",
  "basic_salary": 45000,
  "allowances": [
    { "title": "HRA", "amount": 5000 },
    { "title": "Transport", "amount": 2000 }
  ],
  "deductions": [
    { "title": "PF", "amount": 1800 },
    { "title": "Tax", "amount": 1000 }
  ]
}
```

### 11.2 Save Monthly Payroll Execution
- **Method**: `POST`
- **URL**: `/api/schooladmin/payroll`
- **Payload**:
```json
{
  "month": "September",
  "year": 2026,
  "payroll_entries": [
    {
      "employee_id": "66e7b1a20a1b2c3d4e5f6a01",
      "employee_type": "Teacher",
      "basic_salary": 45000,
      "net_salary": 49200,
      "status": "Paid",
      "payment_method": "Bank Transfer"
    }
  ]
}
```

### 11.3 Update Payroll Status
- **Method**: `PUT`
- **URL**: `/api/schooladmin/payroll/:id`
- **Payload**:
```json
{
  "status": "Paid",
  "payment_method": "Bank Transfer",
  "remarks": "Salary disbursed via direct bank deposit"
}
```

---

## 12. Fee Management

### 12.1 Create Fee Category
- **Method**: `POST`
- **URL**: `/api/schooladmin/fees/categories`
- **Payload**:
```json
{
  "category_name": "Tuition Fee",
  "description": "Monthly tuition fee for academic courses"
}
```

### 12.2 Create Fee Structure
- **Method**: `POST`
- **URL**: `/api/schooladmin/fees/structures`
- **Payload**:
```json
{
  "category_id": "66e7b1a20a1b2c3d4e5f6a11",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "amount": 15000,
  "due_date": "2026-10-10",
  "fee_type": "Term Fee"
}
```

### 12.3 Bulk Assign Fee to Class Students
- **Method**: `POST`
- **URL**: `/api/schooladmin/fees/assignments/bulk`
- **Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "fee_structure_id": "66e7b1a20a1b2c3d4e5f6a12"
}
```

### 12.4 Collect Fee Payment
- **Method**: `POST`
- **URL**: `/api/schooladmin/fees/collect`
- **Payload**:
```json
{
  "assignment_id": "66e7b1a20a1b2c3d4e5f6a13",
  "amount_paid": 14000,
  "payment_mode": "Online",
  "transaction_id": "TXN987654321",
  "remarks": "Term 1 fee payment"
}
```

---

## 13. School Finance & Expenses

### 13.1 Create Expense Category
- **Method**: `POST`
- **URL**: `/api/schooladmin/finance/categories`
- **Payload**:
```json
{
  "category_name": "Utilities",
  "description": "Electricity, Water, and Internet expenses"
}
```

### 13.2 Add School Expense
- **Method**: `POST`
- **URL**: `/api/schooladmin/finance/expenses`
- **Payload**:
```json
{
  "category_id": "66e7b1a20a1b2c3d4e5f6a14",
  "title": "Electricity Bill August 2026",
  "amount": 24500,
  "date": "2026-09-05",
  "payment_method": "Bank Transfer",
  "receipt_no": "REC-99201"
}
```

### 13.3 Add Other Income Record
- **Method**: `POST`
- **URL**: `/api/schooladmin/finance/income`
- **Payload**:
```json
{
  "title": "Auditorium Rental",
  "amount": 50000,
  "date": "2026-09-10",
  "source": "Event Organization",
  "payment_method": "Cheque"
}
```

---

## 14. Timetable Management

### 14.1 Save Timetable Working Settings
- **Method**: `POST`
- **URL**: `/api/timetable/settings`
- **Payload**:
```json
{
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "periods_per_day": 7,
  "period_duration_minutes": 45,
  "break_after_period": 4,
  "break_duration_minutes": 30
}
```

### 14.2 Save / Publish Class Timetable
- **Method**: `POST`
- **URL**: `/api/timetable/save`
- **Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "timetable": [
    {
      "day": "Monday",
      "period": 1,
      "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
      "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
      "start_time": "09:00 AM",
      "end_time": "09:45 AM"
    }
  ]
}
```

### 14.3 Auto Generate Conflict-Free Timetable
- **Method**: `POST`
- **URL**: `/api/timetable/auto-generate`
- **Payload**:
```json
{
  "class_id": "66e7b1a20a1b2c3d4e5f6a04"
}
```
