# School Management System – Backend API Specification

This document provides the complete API list and valid payload details for mobile and frontend integration.



## 1. Authentication Module

### 1.1 Login User
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Headers**:
  http
  Content-Type: application/json
  
- **Request Payload**:
  json
  {
    "email": "superadmin@gmail.com",
    "password": "superadmin_password"
  }
  
- **Success Response (200 OK)**:
  json
  {
    "_id": "60d5ec49ad4d67327092305a",
    "email": "superadmin@gmail.com",
    "role": "SuperAdmin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  

---

### 1.2 Get User Profile
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "_id": "60d5ec49ad4d67327092305a",
    "email": "superadmin@gmail.com",
    "role": "SuperAdmin"
  }
  ```

---

## 2. Super Admin Module

### 2.1 Get Dashboard Statistics
- **Method**: `GET`
- **URL**: `/api/superadmin/dashboard`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "totalSchools": 3,
    "totalTeachers": 12,
    "totalStaff": 6,
    "totalStudents": 45,
    "totalParents": 38
  }
  ```

---

### 2.2 List All Schools
- **Method**: `GET`
- **URL**: `/api/superadmin/schools`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d5ec49ad4d67327092305b",
      "name": "St. John's Academy",
      "location": "New York, USA",
      "contact_number": "+1234567890",
      "email": "stjohns.admin@gmail.com",
      "founder_name": "John Doe",
      "founder_phone": "+1987654321",
      "founder_email": "john.doe@gmail.com",
      "logo": "https://cloudinary.com/logo_url",
      "admin_id": {
        "_id": "60d5ec49ad4d67327092305c",
        "email": "stjohns.admin@gmail.com",
        "phone": "+1234567890",
        "name": "John Doe"
      }
    }
  ]
  ```

---

### 2.3 Create New School & Admin Account
- **Method**: `POST`
- **URL**: `/api/superadmin/schools`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "name": "St. John's Academy",
    "location": "New York, USA",
    "contact_number": "+1234567890",
    "email": "stjohns.admin@gmail.com",
    "founder_name": "John Doe",
    "founder_phone": "+1987654321",
    "founder_email": "john.doe@gmail.com",
    "logo": "data:image/png;base64,iVBORw0KGgo...",
    "adminPassword": "adminpassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "school": {
      "_id": "60d5ec49ad4d67327092305b",
      "name": "St. John's Academy",
      "location": "New York, USA",
      "contact_number": "+1234567890",
      "email": "stjohns.admin@gmail.com",
      "founder_name": "John Doe",
      "admin_id": "60d5ec49ad4d67327092305c"
    },
    "message": "School and Admin created successfully"
  }
  ```

---

### 2.4 Update School Details
- **Method**: `PUT`
- **URL**: `/api/superadmin/schools/60d5ec49ad4d67327092305b`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "name": "St. John's International Academy",
    "location": "Boston, USA",
    "contact_number": "+1444555666",
    "founder_name": "Johnathan Doe"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "_id": "60d5ec49ad4d67327092305b",
    "name": "St. John's International Academy",
    "location": "Boston, USA",
    "contact_number": "+1444555666",
    "email": "stjohns.admin@gmail.com",
    "founder_name": "Johnathan Doe"
  }
  ```

---

### 2.5 Delete School
- **Method**: `DELETE`
- **URL**: `/api/superadmin/schools/60d5ec49ad4d67327092305b`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "School removed"
  }
  ```

---

## 3. School Admin Module

### 3.1 Get Dashboard Statistics
- **Method**: `GET`
- **URL**: `/api/schooladmin/dashboard`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "totalTeachers": 12,
    "totalStudents": 45,
    "totalClasses": 6,
    "totalSubjects": 10
  }
  ```

---

### 3.2 Create Teacher Profile
- **Method**: `POST`
- **URL**: `/api/schooladmin/teachers`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "name": "Arun Kumar",
    "phone": "9876543210",
    "email": "arun.kumar@gmail.com",
    "password": "teacherpassword123",
    "qualification": "M.Sc Mathematics",
    "experience": 5,
    "domains": "Algebra, Calculus",
    "address": "456 Park Avenue, New York",
    "photo": "data:image/png;base64,iVBORw..."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "_id": "60d5ec49ad4d67327092305d",
    "name": "Arun Kumar",
    "qualification": "M.Sc Mathematics",
    "experience": 5
  }
  ```

---

### 3.3 Create Student Profile (includes Parent account initialization)
- **Method**: `POST`
- **URL**: `/api/schooladmin/students`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "first_name": "Oliver",
    "last_name": "Ullrich",
    "father_name": "John Ullrich",
    "mother_name": "Emma Ullrich",
    "class_id": "60d5ec49ad4d67327092305f",
    "group": "Science",
    "roll_no": "13",
    "registration_no": "REG890123",
    "religion": "Christianity",
    "admission_number": "STD60d5ec49ad4d6",
    "address": "789 Pine Ave, Boston",
    "photo": "data:image/png;base64,iVBORw...",
    "gender": "Male",
    "dob": "2012-05-15",
    "blood_group": "O+",
    "parent_name": "John Ullrich",
    "parent_phone": "+199988877",
    "parent_email": "john.ullrich@gmail.com",
    "login_password": "parentpassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "student": {
      "_id": "60d5ec49ad4d673270923060",
      "student_name": "Oliver Ullrich",
      "roll_no": "13",
      "admission_number": "STD60d5ec49ad4d6",
      "class_id": "60d5ec49ad4d67327092305f",
      "parent_user_id": "60d5ec49ad4d673270923061"
    },
    "parentPassword": "parentpassword123",
    "message": "Student and parent account created successfully"
  }
  ```

---

### 3.4 Manage Staff Attendance (Save/Upsert Logs)
- **Method**: `POST`
- **URL**: `/api/schooladmin/attendance`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "role": "Teacher",
    "date": "2026-08-28",
    "notify_via": "Do not send",
    "records": [
      {
        "user_id": "60d5ec49ad4d67327092305c",
        "name": "Arun Kumar",
        "role": "Teacher",
        "status": "Present",
        "in_time": "09:00 AM",
        "out_time": "05:00 PM"
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Attendance saved successfully"
  }
  ```

---

### 3.5 Manage Student Attendance (Save/Upsert Logs)
- **Method**: `POST`
- **URL**: `/api/schooladmin/student-attendance`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "class_id": "60d5ec49ad4d67327092305f",
    "date": "2026-08-28",
    "records": [
      {
        "student_id": "60d5ec49ad4d673270923060",
        "name": "Oliver Ullrich",
        "admission_number": "STD60d5ec49ad4d6",
        "roll_no": "13",
        "status": "Present"
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Attendance saved successfully"
  }
  ```

---

### 3.6 Save Student Exam Marks
- **Method**: `POST`
- **URL**: `/api/schooladmin/exam-marks`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "exam_id": "60d5ec49ad4d673270923062",
    "class_id": "60d5ec49ad4d67327092305f",
    "student_marks": [
      {
        "student_id": "60d5ec49ad4d673270923060",
        "marks": [
          {
            "subject_id": "60d5ec49ad4d673270923063",
            "marks_obtained": 85,
            "total_marks": 100
          }
        ]
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Exam marks saved successfully"
  }
  ```

---

## 4. Teacher Module

### 4.1 Send Announcement Message
- **Method**: `POST`
- **URL**: `/api/teacher/messages`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "class_id": "60d5ec49ad4d67327092305f",
    "content": "Tomorrow we have a special Math quiz. Please prepare."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "_id": "60d5ec49ad4d673270923064",
    "content": "Tomorrow we have a special Math quiz. Please prepare.",
    "sender_id": "60d5ec49ad4d67327092305c"
  }
  ```

---

## 5. Parent Module

### 5.1 Parent Dashboard Stats & announcements
- **Method**: `GET`
- **URL**: `/api/parent/dashboard`
- **Headers**:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "children": [
      {
        "_id": "60d5ec49ad4d673270923060",
        "student_name": "Oliver Ullrich",
        "roll_no": "13",
        "class": "Class 9",
        "section": "A"
      }
    ],
    "announcements": [
      {
        "_id": "60d5ec49ad4d673270923064",
        "content": "Tomorrow we have a special Math quiz. Please prepare.",
        "teacher": "Arun Kumar"
      }
    ]
  }
