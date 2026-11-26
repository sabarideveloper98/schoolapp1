# Teacher Login – Timetable Module API Documentation

This document provides complete, production-verified API specifications for all APIs in the **Teacher Login – Timetable Module** of the School Management System. All endpoints, HTTP methods, controllers, services, database collections, request parameters, error schemas, and response payloads documented below are verified against the active Node.js / Express backend and live MongoDB Atlas database.

---

## 1. Module Overview & Architectural Design

The Teacher Timetable Module provides the logged-in teacher with real-time access to their assigned teaching schedule, daily routine, weekly period distribution, period timings, room allocations, subject loads, and upcoming live classes.

### Architecture Highlights
- **Service Layer**: [`teacherTimetableService.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/services/teacherTimetableService.js) normalizes periods, timings, and schedules across both `TimetableEntry` (manual and master slots) and `Timetable` (auto-generated slots).
- **Controller Layer**: [`teacherController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/teacherController.js) and [`timetableController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/timetableController.js).
- **Route Mounting**:
  - Teacher Portal Routes: `/api/teacher/timetable/*` (in [`teacherRoutes.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/routes/teacherRoutes.js))
  - Compatibility & Shared Routes: `/api/timetable/teacher` and `/api/timetable/teacher/:teacherId` (in [`timetableRoutes.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/routes/timetableRoutes.js))
- **Role-Based Authorization Security**:
  - Enforced via `protect` and `authorize('Teacher')` middlewares.
  - Teachers can only view their own schedule. Any attempt by a teacher to access another teacher's timetable using `:teacherId` yields `403 Forbidden: Access denied: You can only view your own timetable`.
  - SchoolAdmin and SuperAdmin retain full authorization to query any teacher's timetable.
- **Frontend Backward Compatibility**:
  - Both `/api/teacher/timetable/*` and `/api/timetable/teacher/:teacherId` return all 14 required fields, the standardized `{ success: true, message, data: { teacherId, teacherName, timetable: [...] } }` envelope, as well as `schedule`, `periods`, and `settings` for existing UI components.

---

## 2. Standard Headers & Authentication

All private teacher timetable APIs require valid JSON Web Token (JWT) credentials:

| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <JWT_TOKEN>` | Bearer token generated upon teacher login |
| `Content-Type` | `application/json` | Required for all POST/PUT requests |

---

## 3. Complete Timetable API Endpoints

### 3.1 Get Teacher Timetable (Main / Weekly All Slots)

Returns the full active timetable for the authenticated teacher across all weekdays and periods.

- **API Name**: Get Teacher Timetable
- **HTTP Method**: `GET`
- **Endpoints**:
  - Primary: `/api/teacher/timetable`
  - Fallback / Shared: `/api/timetable/teacher`
- **Controller Name**: `getTeacherTimetableEndpoint` (in `teacherController.js`) / `getTeacherTimetableByTeacherId` (in `timetableController.js`)
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Query Parameters (Optional):
    - `day` (String): Filter by weekday (e.g. `Monday`, `Tuesday`)
    - `date` (String): Filter by ISO date (e.g. `2026-11-16`)
    - `classId` (String): Filter by Class ObjectId
- **Request Payload**: None
- **Database Collections**: `timetables`, `timetableentries`, `timetablemasters`, `periodconfigs`, `timetablesettings`, `classes`, `subjects`, `teachers`
- **HTTP Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: Missing or invalid JWT
  - `403 Forbidden`: Role not authorized
  - `404 Not Found`: Teacher profile not found
  - `500 Internal Server Error`: Backend error

#### Actual Live Success Response (200 OK)
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
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400afef78578a90316732",
        "subject_id": "6a8400afef78578a90316732",
        "subjectName": "Language",
        "subject_name": "Language",
        "periodNumber": 1,
        "period_name": "P1",
        "periodName": "P1",
        "startTime": "09:20 AM",
        "start_time": "09:20 AM",
        "endTime": "10:00 AM",
        "end_time": "10:00 AM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "day": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "101",
        "room_no": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6afc4c7fc18e9221e634c234",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6a840124ef78578a9031673a",
        "className": "Class 11",
        "class_name": "Class 11 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "",
        "subject_id": "",
        "subjectName": "General",
        "subject_name": "General",
        "periodNumber": 3,
        "period_name": "P3",
        "periodName": "P3",
        "startTime": "11:00 AM",
        "start_time": "11:00 AM",
        "endTime": "11:40 AM",
        "end_time": "11:40 AM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "day": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "Main Classroom",
        "room_no": "Main Classroom",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c58",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subject_id": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "subject_name": "Social",
        "periodNumber": 5,
        "period_name": "P5",
        "periodName": "P5",
        "startTime": "1:00 PM",
        "start_time": "1:00 PM",
        "endTime": "01:40 PM",
        "end_time": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "day": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "103",
        "room_no": "103",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5b",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subject_id": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "subject_name": "Social",
        "periodNumber": 8,
        "period_name": "P8",
        "periodName": "P8",
        "startTime": "3:20 PM",
        "start_time": "3:20 PM",
        "endTime": "4:00 PM",
        "end_time": "4:00 PM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "day": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "101",
        "room_no": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5c",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400afef78578a90316732",
        "subject_id": "6a8400afef78578a90316732",
        "subjectName": "Language",
        "subject_name": "Language",
        "periodNumber": 1,
        "period_name": "P1",
        "periodName": "P1",
        "startTime": "09:20 AM",
        "start_time": "09:20 AM",
        "endTime": "10:00 AM",
        "end_time": "10:00 AM",
        "durationMinutes": 40,
        "timetableDay": "Tuesday",
        "day": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "room_no": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c60",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subject_id": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "subject_name": "Social",
        "periodNumber": 5,
        "period_name": "P5",
        "periodName": "P5",
        "startTime": "1:00 PM",
        "start_time": "1:00 PM",
        "endTime": "01:40 PM",
        "end_time": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Tuesday",
        "day": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "room_no": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      }
    ]
  }
}
```

---

### 3.2 Get Teacher Daily Timetable

Returns classes scheduled for the current date or specified day/date, including total teaching duration and free period calculations.

- **API Name**: Get Teacher Daily Timetable
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/daily`
- **Controller Name**: `getTeacherDailyTimetable`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Query Parameters (Optional):
    - `day` (String): e.g. `Tuesday`
    - `date` (String): e.g. `2026-11-17`
- **Request Payload**: None
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`, `timetablesettings`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
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
    "classes": [
      {
        "_id": "6acb2942dfec1156a94d3c5c",
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
        "timetableDay": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c60",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "periodName": "P5",
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      }
    ],
    "timetable": [
      {
        "_id": "6acb2942dfec1156a94d3c5c",
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
        "timetableDay": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c60",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "periodName": "P5",
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Tuesday",
        "timetableDate": "2026-11-17",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      }
    ]
  }
}
```

---

### 3.3 Get Teacher Weekly Timetable

Returns the entire week's schedule structured and grouped by day (Monday through Friday/Saturday) along with daily teaching period tallies.

- **API Name**: Get Teacher Weekly Timetable
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/weekly`
- **Controller Name**: `getTeacherWeeklyTimetable`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**: None
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`, `timetablesettings`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Weekly timetable fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "academicYear": "2026-2027",
    "workingDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "totalWeeklyPeriods": 6,
    "maxAllowedWeeklyPeriods": 36,
    "workloadStatus": "OK",
    "dailySummary": {
      "Monday": { "periodCount": 4, "teachingMinutes": 160 },
      "Tuesday": { "periodCount": 2, "teachingMinutes": 80 },
      "Wednesday": { "periodCount": 0, "teachingMinutes": 0 },
      "Thursday": { "periodCount": 0, "teachingMinutes": 0 },
      "Friday": { "periodCount": 0, "teachingMinutes": 0 }
    },
    "weeklySchedule": {
      "Monday": [ /* 4 classes: P1 (Language), P3 (General), P5 (Social), P8 (Social) */ ],
      "Tuesday": [ /* 2 classes: P1 (Language), P5 (Social) */ ],
      "Wednesday": [],
      "Thursday": [],
      "Friday": []
    },
    "weeklyTimetable": { /* Object with Monday to Friday keys */ },
    "timetable": [ /* Full flat array of 6 weekly slots */ ]
  }
}
```

---

### 3.4 Get Timetable by Date

Returns classes scheduled for a specific calendar date (YYYY-MM-DD), resolving the calendar date to the correct weekday.

- **API Name**: Get Timetable by Date
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/date/:date` (also supports query `?date=YYYY-MM-DD`)
- **Controller Name**: `getTeacherTimetableByDate`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Path Parameter: `date` (String, required): e.g. `2026-11-16`
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`
- **HTTP Status Codes**: `200 OK`, `400 Bad Request` (invalid date format), `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Timetable for date 2026-11-16 (Monday) fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "date": "2026-11-16",
    "day": "Monday",
    "totalClasses": 4,
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
      },
      {
        "_id": "6afc4c7fc18e9221e634c234",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6a840124ef78578a9031673a",
        "className": "Class 11",
        "sectionName": "A",
        "subjectId": "",
        "subjectName": "General",
        "periodNumber": 3,
        "periodName": "P3",
        "startTime": "11:00 AM",
        "endTime": "11:40 AM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "Main Classroom",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c58",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "periodName": "P5",
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "103",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5b",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 8,
        "periodName": "P8",
        "startTime": "3:20 PM",
        "endTime": "4:00 PM",
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

---

### 3.5 Get Timetable by Day

Returns all periods scheduled for the teacher on a named weekday (e.g., Monday, Tuesday, etc.).

- **API Name**: Get Timetable by Day
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/day/:day` (also supports query `?day=Monday`)
- **Controller Name**: `getTeacherTimetableByDay`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Path Parameter: `day` (String, required): e.g. `Monday`
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`
- **HTTP Status Codes**: `200 OK`, `400 Bad Request` (invalid day name), `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Timetable for Monday fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "day": "Monday",
    "date": "2026-11-16",
    "totalClasses": 4,
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
      },
      {
        "_id": "6afc4c7fc18e9221e634c234",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6a840124ef78578a9031673a",
        "className": "Class 11",
        "sectionName": "A",
        "subjectId": "",
        "subjectName": "General",
        "periodNumber": 3,
        "periodName": "P3",
        "startTime": "11:00 AM",
        "endTime": "11:40 AM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "Main Classroom",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c58",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "periodName": "P5",
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "103",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5b",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 8,
        "periodName": "P8",
        "startTime": "3:20 PM",
        "endTime": "4:00 PM",
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

---

### 3.6 Get Timetable by Class

Returns all periods the logged-in teacher instructs for a specific Class ID.

- **API Name**: Get Timetable by Class
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/class/:classId`
- **Controller Name**: `getTeacherClassTimetable`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Path Parameter: `classId` (ObjectId string, required): e.g. `6ac8f6397ae01d3a464b2c15`
- **Database Collections**: `classes`, `timetables`, `timetableentries`, `periodconfigs`
- **HTTP Status Codes**: `200 OK`, `400 Bad Request` (invalid ObjectId), `404 Not Found` (class not found), `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Timetable for class 1-A fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "classId": "6ac8f6397ae01d3a464b2c15",
    "className": "Class 1",
    "sectionName": "A",
    "totalAssignedPeriods": 5,
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
        "startTime": "09:20 AM",
        "endTime": "10:00 AM",
        "timetableDay": "Monday",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c58",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "timetableDay": "Monday",
        "roomNumber": "103",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5b",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 8,
        "startTime": "3:20 PM",
        "endTime": "4:00 PM",
        "timetableDay": "Monday",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c5c",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400afef78578a90316732",
        "subjectName": "Language",
        "periodNumber": 1,
        "startTime": "09:20 AM",
        "endTime": "10:00 AM",
        "timetableDay": "Tuesday",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      },
      {
        "_id": "6acb2942dfec1156a94d3c60",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "sectionName": "A",
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "periodNumber": 5,
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "timetableDay": "Tuesday",
        "roomNumber": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      }
    ]
  }
}
```

---

### 3.7 Get Timetable by Section

Returns periods scheduled for the teacher in a specific class and section combination.

- **API Name**: Get Timetable by Section
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/class/:classId/section/:sectionId`
- **Controller Name**: `getTeacherSectionTimetable`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Path Parameter: `classId` (ObjectId string, required): e.g. `6ac8f6397ae01d3a464b2c15`
  - Path Parameter: `sectionId` (String, required): e.g. `A`
- **Database Collections**: `classes`, `timetables`, `timetableentries`, `periodconfigs`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Timetable for section A fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "classId": "6ac8f6397ae01d3a464b2c15",
    "sectionName": "A",
    "totalPeriods": 5,
    "timetable": [ /* 5 period objects in Class 1 Section A */ ]
  }
}
```

---

### 3.8 Get Teacher Assigned Subjects

Aggregates all unique subjects assigned to the logged-in teacher in active timetables, along with the class-sections taught and weekly period counts.

- **API Name**: Get Teacher Assigned Subjects
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/subjects`
- **Controller Name**: `getTeacherAssignedSubjects`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**: None
- **Database Collections**: `subjects`, `timetables`, `timetableentries`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Teacher assigned subjects fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "totalSubjects": 3,
    "subjects": [
      {
        "subjectId": "6a8400afef78578a90316732",
        "subjectName": "Language",
        "classes": [
          "Class 1 - A"
        ],
        "weeklyPeriodsCount": 2
      },
      {
        "subjectId": "",
        "subjectName": "General",
        "classes": [
          "Class 11 - A"
        ],
        "weeklyPeriodsCount": 1
      },
      {
        "subjectId": "6a8400e8ef78578a90316736",
        "subjectName": "Social",
        "classes": [
          "Class 1 - A"
        ],
        "weeklyPeriodsCount": 3
      }
    ]
  }
}
```

---

### 3.9 Get Teacher Period Details & Timing

Returns the school's configured period bell timings, period labels (P1..P8, Lunch, Break), period order, start and end times, and duration.

- **API Name**: Get Teacher Period Details / Get Period Timing
- **HTTP Method**: `GET`
- **Endpoints**:
  - `/api/teacher/timetable/periods`
  - `/api/teacher/timetable/period-timings`
- **Controller Name**: `getTeacherPeriodDetails`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**: None
- **Database Collections**: `periodconfigs`, `timetablesettings`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Period details and timings fetched successfully",
  "data": {
    "totalPeriods": 9,
    "schoolStartTime": "09:00 AM",
    "schoolEndTime": "04:00 PM",
    "periods": [
      {
        "periodId": "6ac913737ae01d3a464b2cba",
        "periodName": "P1",
        "periodNumber": 1,
        "startTime": "09:20 AM",
        "endTime": "10:00 AM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cbb",
        "periodName": "P2",
        "periodNumber": 2,
        "startTime": "10:00 AM",
        "endTime": "10:40 AM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cbd",
        "periodName": "P3",
        "periodNumber": 3,
        "startTime": "11:00 AM",
        "endTime": "11:40 AM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cbe",
        "periodName": "p4",
        "periodNumber": 4,
        "startTime": "11:40 AM",
        "endTime": "12:20 PM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cc0",
        "periodName": "P5",
        "periodNumber": 5,
        "startTime": "1:00 PM",
        "endTime": "01:40 PM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cc1",
        "periodName": "P6",
        "periodNumber": 6,
        "startTime": "01:40 PM",
        "endTime": "02:20 PM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cc2",
        "periodName": "Break",
        "periodNumber": 7,
        "startTime": "02:20 PM",
        "endTime": "02:40 PM",
        "durationMinutes": 20,
        "type": "Break",
        "isLunch": false,
        "isBreak": true
      },
      {
        "periodId": "6ac913737ae01d3a464b2cc3",
        "periodName": "P7",
        "periodNumber": 8,
        "startTime": "02:40 PM",
        "endTime": "03:20 PM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      },
      {
        "periodId": "6ac913737ae01d3a464b2cc4",
        "periodName": "P8",
        "periodNumber": 9,
        "startTime": "3:20 PM",
        "endTime": "4:00 PM",
        "durationMinutes": 40,
        "type": "Teaching Period",
        "isLunch": false,
        "isBreak": false
      }
    ]
  }
}
```

---

### 3.10 Get Teacher Schedule & Workload Summary

Returns the complete schedule matrix along with period workload compliance status (`OK` vs `OVERLOADED`) based on school timetable configuration rules.

- **API Name**: Get Teacher Schedule
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/schedule`
- **Controller Name**: `getTeacherScheduleEndpoint`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**: None
- **Database Collections**: `timetables`, `timetableentries`, `timetablesettings`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Teacher schedule fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "totalWeeklyPeriods": 6,
    "maxAllowedWeeklyPeriods": 36,
    "workloadStatus": "OK",
    "schedule": [ /* List of 6 scheduled teaching slots */ ]
  }
}
```

---

### 3.11 Get Upcoming Classes (Real-Time Status & Next Class Countdown)

Calculates the teacher's schedule relative to current system time, returning the ongoing class (with minutes remaining), next class countdown, upcoming periods today, and tomorrow's preview.

- **API Name**: Get Upcoming Classes
- **HTTP Method**: `GET`
- **Endpoint**: `/api/teacher/timetable/upcoming`
- **Controller Name**: `getTeacherUpcomingClasses`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`, `authorize('Teacher')`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**: None
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`
- **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Upcoming classes fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "currentTime": "06:25 PM",
    "currentDay": "Tuesday",
    "hasClassesToday": true,
    "ongoingClass": null,
    "nextClass": null,
    "upcomingToday": [],
    "totalUpcomingToday": 0,
    "allTodayClassesCount": 2,
    "tomorrowDay": "Wednesday",
    "tomorrowClassesCount": 0,
    "tomorrowPreview": []
  }
}
```

---

### 3.12 Get Teacher Timetable by Teacher ID (Frontend Component API)

This is the API directly called by the frontend timetable component (`TeacherTimetable.jsx`). It supports fetching by teacher ObjectId, `"me"`, or `"my"`, with full security authorization enforcement.

- **API Name**: Get Timetable by Teacher ID
- **HTTP Method**: `GET`
- **Endpoint**: `/api/timetable/teacher/:teacherId`
- **Controller Name**: `getTeacherTimetableByTeacherId`
- **Service Name**: `teacherTimetableService.getEnrichedTeacherSchedule`
- **Authentication**: JWT Bearer Token (`protect`)
- **Required Headers**: `Authorization: Bearer <TOKEN>`
- **Request Parameters**:
  - Path Parameter: `teacherId` (ObjectId string or `"me"`): e.g. `6a82bd339b0cdf6610288f25`
- **Database Collections**: `timetables`, `timetableentries`, `periodconfigs`, `timetablesettings`, `teachers`
- **HTTP Status Codes**:
  - `200 OK`: Timetable successfully fetched for self or by admin
  - `401 Unauthorized`: Token missing or expired
  - `403 Forbidden`: Teacher attempting to query another teacher's timetable
  - `404 Not Found`: Teacher ID not found

#### Actual Live Success Response (200 OK)
```json
{
  "success": true,
  "message": "Teacher timetable fetched successfully",
  "data": {
    "teacherId": "6a82bd339b0cdf6610288f25",
    "teacherName": "Balaji",
    "timetable": [
      {
        "_id": "6acb2942dfec1156a94d3c54",
        "teacherId": "6a82bd339b0cdf6610288f25",
        "teacherName": "Balaji",
        "classId": "6ac8f6397ae01d3a464b2c15",
        "className": "Class 1",
        "class_name": "Class 1 - A",
        "sectionName": "A",
        "section_name": "A",
        "subjectId": "6a8400afef78578a90316732",
        "subjectName": "Language",
        "periodNumber": 1,
        "period_name": "P1",
        "startTime": "09:20 AM",
        "endTime": "10:00 AM",
        "durationMinutes": 40,
        "timetableDay": "Monday",
        "day": "Monday",
        "timetableDate": "2026-11-16",
        "roomNumber": "101",
        "room_no": "101",
        "academicYear": "2026-2027",
        "status": "Published"
      }
    ]
  },
  "teacher": { "_id": "6a82bd339b0cdf6610288f25", "name": "Balaji", "email": "eng21@gmail.com" },
  "settings": { "school_start_time": "09:00 AM", "school_end_time": "04:00 PM", "max_teacher_weekly_periods": 36 },
  "periods": [ /* 9 period configs */ ],
  "totalPeriods": 6,
  "maxAllowed": 36,
  "workloadStatus": "OK",
  "schedule": [ /* Schedule array matching frontend TeacherTimetable.jsx requirements */ ],
  "entries": [ /* Array matching timetable entries */ ]
}
```

#### Actual Live Authorization Failure Response (403 Forbidden)
When teacher `Balaji` attempts to access teacher `Nathiya`'s timetable via `/api/timetable/teacher/6a83fed2ef78578a9031672f`:
```json
{
  "success": false,
  "message": "Access denied: You can only view your own timetable"
}
```

---

## 4. Verification of Requested Timetable Fields

Every slot in `data.timetable` is populated with all 14 required fields:

| Field Name | Type | Source & Mapping in Backend | Sample Actual Value |
| :--- | :--- | :--- | :--- |
| `teacherId` | String | `teacher.teacher_id` or `teacher._id` | `"6a82bd339b0cdf6610288f25"` |
| `teacherName` | String | `teacher.name` | `"Balaji"` |
| `className` | String | `Class.class` normalized with `"Class "` prefix | `"Class 1"` |
| `sectionName` | String | `Class.section` or `timetable_id.section_id` | `"A"` |
| `subjectName` | String | `Subject.name` populated from DB | `"Language"` / `"Social"` |
| `subjectId` | String | `Subject._id` populated from DB | `"6a8400afef78578a90316732"` |
| `periodNumber` | Number | Integer extracted from period name / order | `1`, `3`, `5`, `8` |
| `periodStartTime` / `startTime` | String | Configured start time from `PeriodConfig` | `"09:20 AM"` |
| `periodEndTime` / `endTime` | String | Configured end time from `PeriodConfig` | `"10:00 AM"` |
| `timetableDay` / `day` | String | Day name from timetable entry | `"Monday"`, `"Tuesday"` |
| `timetableDate` | String | Calculated ISO date for current week (YYYY-MM-DD) | `"2026-11-16"` |
| `roomNumber` / `room_no` | String | Room identifier assigned in timetable entry | `"101"`, `"103"`, `"Main Classroom"` |
| `academicYear` | String | Academic year ID from master record | `"2026-2027"` |
| `timetableStatus` / `status` | String | Status from `TimetableMaster` or `Timetable` | `"Published"` |

---

## 5. Frontend & Backend Integration Analysis

### 5.1 Teacher Timetable Component Flow
1. **Mounting**: In [`frontend/src/pages/teacher/Dashboard.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/teacher/Dashboard.jsx), the route `/timetable` renders:
   ```jsx
   <TeacherTimetable preselectedTeacherId={user?.reference_id || user?.teacher_id || user?._id} />
   ```
2. **Component Execution**: In [`frontend/src/pages/schooladmin/timetable/TeacherTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TeacherTimetable.jsx):
   - Determines `idToFetch` from `preselectedTeacherId` or logged-in teacher context.
   - Executes `GET /api/timetable/teacher/${idToFetch}`.
   - Sets state:
     - `schedule`: receives `response.data.schedule` (or `response.data.data.timetable`)
     - `periods`: receives `response.data.periods`
     - `settings`: receives `response.data.settings`
3. **Period Timing & Grid Mapping**:
   - The UI maps days (`Monday` to `Friday`) as columns and periods (`P1` to `P8`) as rows.
   - Uses `slot = schedule.find(s => s.day === day && s.period_name === period.period_name)`.
   - Displays `slot.subject_name`, `slot.className`, `slot.room_no`.
4. **Security & Boundary Check**:
   - If teacher tries to tamper with `idToFetch` in URL or client storage, the backend rejects it with `403 Access denied: You can only view your own timetable`.

---

## 6. Database Collections & Schemas

| Collection Name | Model File | Purpose in Timetable Module |
| :--- | :--- | :--- |
| `timetables` | [`Timetable.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/Timetable.js) | Stores class schedule grids with embedded `schedule` slots |
| `timetableentries` | [`TimetableEntry.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableEntry.js) | Stores individual scheduled slots referencing `timetable_id`, `teacher_id`, `subject_id` |
| `timetablemasters` | [`TimetableMaster.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableMaster.js) | Master record linking a timetable to `class_id`, `section_id`, and `academic_year_id` |
| `periodconfigs` | [`PeriodConfig.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/PeriodConfig.js) | Period definitions with `start_time`, `end_time`, `order`, `type` |
| `timetablesettings` | [`TimetableSettings.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableSettings.js) | School timetable configuration (working days, periods per day, max teacher load) |
| `teachers` | [`Teacher.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/Teacher.js) | Teacher profiles, user associations, and department details |
| `classes` | [`Class.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/Class.js) | Class and section metadata |
| `subjects` | [`Subject.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/Subject.js) | Subject definitions and names |

---

## 7. Error Responses

| Status Code | Error Message | Scenario |
| :--- | :--- | :--- |
| **400 Bad Request** | `{"success": false, "message": "Invalid date format. Use YYYY-MM-DD"}` | Malformed date string passed in path or query |
| **400 Bad Request** | `{"success": false, "message": "Invalid class ID format"}` | Non-ObjectId classId provided |
| **400 Bad Request** | `{"success": false, "message": "Invalid day. Allowed: Monday, Tuesday, ..."}` | Unrecognized weekday string |
| **401 Unauthorized** | `{"message": "Not authorized, token failed"}` | Invalid or expired Bearer token |
| **403 Forbidden** | `{"success": false, "message": "Access denied: You can only view your own timetable"}` | Teacher trying to access another teacher's timetable |
| **404 Not Found** | `{"success": false, "message": "Teacher not found"}` | No teacher document associated with user |
| **404 Not Found** | `{"success": false, "message": "Class not found"}` | Specified class ID does not exist in DB |
| **500 Server Error**| `{"success": false, "message": "Failed to fetch teacher timetable", "error": "..."}` | Unexpected backend database or runtime error |
