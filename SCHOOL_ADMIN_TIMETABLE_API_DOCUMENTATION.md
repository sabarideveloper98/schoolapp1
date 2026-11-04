# School Admin Timetable API Specification & Technical Documentation

This document provides a comprehensive, production-grade specification of all Application Programming Interfaces (APIs), database models, entity relationships, validation rules, and integration workflows for the **Timetable Management Module** within the School Management System.

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Timetable Entity Relationships & Filtering Workflow](#2-timetable-entity-relationships--filtering-workflow)
3. [Summary of Discovered Timetable APIs](#3-summary-of-discovered-timetable-apis)
4. [Discovery Checklist & Implementation Status](#4-discovery-checklist--implementation-status)
5. [Detailed API Endpoint Specifications](#5-detailed-api-endpoint-specifications)
   - [5.1 Master Timetable & Dashboard APIs](#51-master-timetable--dashboard-apis)
   - [5.2 Class & Section Timetable APIs](#52-class--section-timetable-apis)
   - [5.3 Teacher Timetable & Workload APIs](#53-teacher-timetable--workload-apis)
   - [5.4 Timetable Settings & Period Timing APIs](#54-timetable-settings--period-timing-apis)
   - [5.5 Teacher Assignment & Availability APIs](#55-teacher-assignment--availability-apis)
   - [5.6 Automated Generation & Conflict Detection APIs](#56-automated-generation--conflict-detection-apis)
   - [5.7 Print & Student Views](#57-print--student-views)
   - [5.8 Auxiliary School Admin APIs](#58-auxiliary-school-admin-apis)
6. [Practical API Testing Examples](#6-practical-api-testing-examples)
7. [Source File & Component References](#7-source-file--component-references)

---

## 1. Architectural Overview

The School Admin Timetable module employs a resilient dual-layer architecture designed to support both relational normalized data querying and fast denormalized aggregation:

```
+----------------------------------------------------------------------------------------------------+
|                                    Timetable Settings & Configuration                              |
|  - TimetableSettings: school_start_time, school_end_time, period_duration, lunch_duration          |
|  - PeriodConfig: P1, P2, Break, P3, P4, Lunch, P5, P6, P7, P8 (start_time, end_time, type, order)  |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                      Teacher Assignments                                           |
|  - TeacherAssignment & ClassSubject: class_id, subject_id, teacher_id, weekly_periods_required      |
|  - TeacherAvailability: teacher_id, unavailabilities: [{ day, period_name, reason }]               |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                Timetable Storage & Mirror Architecture                             |
|  [Normalized Relational Storage]               |  [Denormalized Document Storage]                  |
|  1. TimetableMaster (1 per class-section-year) |  2. Timetable (Embedded schedule array)           |
|     - school_id, class_id, section_id, status  |     - school_id, class_id, academic_year, status   |
|  2. TimetableEntry (1 doc per slot)            |     - schedule: [{ day, period_name, subject_id,  |
|     - timetable_id, day, period_name,          |                   teacher_id, room, is_fixed }]    |
|       subject_id, teacher_id, room_no          |                                                   |
+----------------------------------------------------------------------------------------------------+
```

### Key Architectural Behaviors
- **Tenant Isolation**: Every query and mutation uses `getSchoolId(req.user)` to guarantee multi-tenant scoping via `school_id`.
- **Dual-Model Mirroring**: When a timetable is created via `POST /api/timetable/create` or updated via `PUT /api/timetable/update/:id`, both the normalized collections (`TimetableMaster` + `TimetableEntry`) and the legacy embedded collection (`Timetable`) are synchronized automatically.
- **Period Synchronicity**: Period timings are maintained both as individual documents in `PeriodConfig` and serialized within `TimetableSettings.generated_periods` with bidirectional ID preservation.
- **Strict Validation Engine**: Real-time validation checks for teacher clashes, subject daily frequency ceilings, and assignment integrity prior to persisting timetable records.

---

## 2. Timetable Entity Relationships & Filtering Workflow

### 2.1 Entity Relationship Diagram

```
+-------------------+        1:N        +-------------------+
|      School       | ----------------> |   Academic Year   | (e.g. '2026-2027')
+-------------------+                   +-------------------+
          | 1:N                                   | 1:N
          v                                       v
+-------------------+        1:N        +-------------------+
|       Class       | ----------------> |  TimetableMaster  | (Status: Draft/Published)
| (class, section)  |                   +-------------------+
+-------------------+                             |
          |                                       | 1:N
          | 1:N                                   v
          v                             +-------------------+
+-------------------+                   |  TimetableEntry   |
|  TeacherAssignment|                   | (Slot per day &   |
|   / ClassSubject  |                   |  period_name)     |
+-------------------+                   +-------------------+
   |             |                                |       |
   | N:1         | N:1                            | N:1   | N:1
   v             v                                v       v
+-------+   +---------+                      +---------+ +-------+
|Teacher|   | Subject |                      | Subject | |Teacher|
+-------+   +---------+                      +---------+ +-------+
```

### 2.2 Entity Definitions & Linkages

| Entity | Description & Primary Keys | Inter-Connection Logic |
| :--- | :--- | :--- |
| **School Admin** | Authenticated user (`User._id`) with role `SchoolAdmin` or `SuperAdmin`. | Scopes all actions to `school_id`. |
| **Academic Year** | String identifier (default `'2026-2027'`). | Part of composite unique index on `TimetableMaster`, `TimetableSettings`, and `TeacherAssignment`. |
| **Class** | Represents a grade standard (`Class._id`, `class: "10"`). | Belongs to a school; holds reference to `class_incharge_id`. |
| **Section** | Division identifier (e.g., `'A'`, `'B'`, `'C'`). | Combined with `class_id` and `academic_year_id` to form unique timetable schedule. |
| **Subject** | Curricular subject (`Subject._id`, `name`, `code`, `type`). | Referenced by both `TeacherAssignment` and `TimetableEntry`. |
| **Teacher** | Faculty profile (`Teacher._id`, `name`, `email`, `qualification`). | Assigned to subjects and classes; referenced in slots. |
| **Period / Period Timing** | Configuration defining start/end clock times (`PeriodConfig._id`, `start_time`, `end_time`, `order`). | Configured once per school; applies uniformly across all classes. |
| **Timetable Slot** | Granular cell intersection (`TimetableEntry._id`: `day` + `period_name`). | Bound to `TimetableMaster._id`, allocating one `subject_id` and one `teacher_id`. |

### 2.3 Teacher Dropdown Filtering & Subject Assignment Logic

When an administrator clicks a timetable grid slot on the **Create Timetable** interface:

1. **Class & Section Selection**: The UI establishes `class_id` and `section_id` from the active class context.
2. **Subject Selection**: When a user selects a subject (e.g., *Mathematics*), the frontend executes `getEligibleTeachers(subjectId, classId)`.
3. **Assignment Cross-Referencing**:
   - The system inspects both `/api/timetable/assignments` (`TeacherAssignment`) and `/api/schooladmin/assignments` (`ClassSubject`).
   - It filters for records where `class_id == selectedClassId` AND `subject_id == selectedSubjectId`.
4. **Class In-Charge Badge**:
   - If the teacher is also the designated `class_incharge_id` on the `Class` model or has `is_class_teacher: true`, the teacher is tagged with `• Class In-Charge`.
5. **Backend Verification during Creation (`POST /api/timetable/create`)**:
   - If teacher assignments exist for that class and subject, the backend enforces that the submitted `teacher_id` matches an assigned teacher or the class incharge.
   - If an unauthorized teacher is submitted, the API rejects the request with HTTP `400 Bad Request`:
     ```json
     { "message": "Teacher <Name> is not assigned to teach <Subject> for this class." }
     ```
6. **Teacher Period Conflict Verification**:
   - The backend scans `TimetableEntry` across all classes for that school and academic year.
   - If the teacher is already scheduled for that specific `day` and `period_name` in another section/class, the API halts execution with HTTP `400 Bad Request`:
     ```json
     { "message": "Teacher already assigned for this period. Teacher <Name> is busy on <Day> <Period>." }
     ```
7. **Subject Daily Frequency Ceiling**:
   - The backend counts occurrences of `subject_id` on that `day`. If count exceeds 2, it halts execution with HTTP `400 Bad Request`:
     ```json
     { "message": "Subject Daily Limit Exceeded. <Subject> cannot exceed 2 periods on <Day>." }
     ```

---

## 3. Summary of Discovered Timetable APIs

All timetable endpoints are prefixed with `/api/timetable` (mounted in `backend/src/server.js:112` and routed via `backend/src/routes/timetableRoutes.js`).

| # | HTTP Method | Endpoint Path | Controller Method | Access Roles | Purpose |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/timetable` | `getAllTimetables` | SchoolAdmin, SuperAdmin | Overview stats & all master timetables for academic year |
| 2 | `GET` | `/api/timetable/class/:classId/:sectionId` | `getClassTimetableBySection` | Protected (Admin, Teacher, Parent) | Detailed class/section timetable, periods, entries, assignments |
| 3 | `GET` | `/api/timetable/teacher` | `getTeacherTimetableByTeacherId` | Protected | Weekly schedule & workload status for logged-in teacher |
| 4 | `GET` | `/api/timetable/teacher/:teacherId` | `getTeacherTimetableByTeacherId` | Protected | Weekly schedule & workload status for specific teacher |
| 5 | `POST` | `/api/timetable/create` | `createTimetable` | SchoolAdmin, SuperAdmin | Create class timetable with clash & subject limit validation |
| 6 | `PUT` | `/api/timetable/update/:id` | `updateTimetable` | SchoolAdmin, SuperAdmin | Update status (Draft/Published) or slot entries of timetable |
| 7 | `DELETE` | `/api/timetable/delete/:id` | `deleteTimetable` | SchoolAdmin, SuperAdmin | Delete timetable master, entries, and mirrored timetable |
| 8 | `POST` | `/api/timetable/auto-generate` | `autoGenerate` | SchoolAdmin, SuperAdmin | Algorithmic automated timetable generation |
| 9 | `POST` | `/api/timetable/generate` | `autoGenerate` | SchoolAdmin, SuperAdmin | Alias for auto-generate timetable |
| 10 | `GET` | `/api/timetable/print` | `getPrintTimetable` | SchoolAdmin, SuperAdmin, Teacher | Printable timetable payload for class, teacher, or all |
| 11 | `PUT` | `/api/timetable/period/:id` | `updatePeriodTiming` | SchoolAdmin, SuperAdmin | Update start/end time and labels of a period configuration |
| 12 | `PUT` | `/api/timetable/periods/:id` | `updatePeriodTiming` | SchoolAdmin, SuperAdmin | Alias for updating period timing |
| 13 | `GET` | `/api/timetable/dashboard` | `getDashboardStats` | SchoolAdmin, SuperAdmin | Analytics on active timetables, teachers, and conflict counts |
| 14 | `GET` | `/api/timetable/settings` | `getSettings` | SchoolAdmin, SuperAdmin | Retrieve school timing parameters and generated periods |
| 15 | `POST` | `/api/timetable/settings` | `saveSettings` | SchoolAdmin, SuperAdmin | Save timing rules and auto-calculate period slots |
| 16 | `GET` | `/api/timetable/classes` | `getClasses` | SchoolAdmin, SuperAdmin, Teacher | Fetch classes with in-charge details for timetable |
| 17 | `GET` | `/api/timetable/class/:id` | `getClassTimetable` | Protected | Fetch legacy class timetable with embedded schedule |
| 18 | `POST` | `/api/timetable/save` | `saveClassTimetable` | SchoolAdmin, SuperAdmin | Bulk save timetable into legacy collection |
| 19 | `POST` | `/api/timetable/publish` | `saveClassTimetable` | SchoolAdmin, SuperAdmin | Bulk publish timetable into legacy collection |
| 20 | `GET` | `/api/timetable/global` | `getGlobalTimetable` | SchoolAdmin, SuperAdmin | Master school-wide matrix across all classes and days |
| 21 | `POST` | `/api/timetable/conflicts` | `checkConflicts` | SchoolAdmin, SuperAdmin | Scan school timetables for teacher, room, and frequency clashes |
| 22 | `GET` | `/api/timetable/assignments` | `getAssignments` | SchoolAdmin, SuperAdmin | Get subject-teacher assignments for timetable module |
| 23 | `POST` | `/api/timetable/assignments` | `saveAssignment` | SchoolAdmin, SuperAdmin | Create/update teacher-subject-class assignment |
| 24 | `DELETE` | `/api/timetable/assignments/:id` | `deleteAssignment` | SchoolAdmin, SuperAdmin | Remove teacher-subject assignment |
| 25 | `GET` | `/api/timetable/availability` | `getTeacherAvailability` | SchoolAdmin, SuperAdmin, Teacher | Get teachers' unavailabilities and blocked periods |
| 26 | `POST` | `/api/timetable/availability` | `saveTeacherAvailability` | SchoolAdmin, SuperAdmin, Teacher | Save blocked days and periods for a teacher |
| 27 | `GET` | `/api/timetable/student` | `getStudentTimetable` | Student, Parent, SchoolAdmin | Get student/parent view for a class timetable |

---

## 4. Discovery Checklist & Implementation Status

Below is the verification of the 26 discovery items requested:

| Item # | Functionality Requested | Implementation Status | Actual Backend Endpoint / Implementation Details |
| :-: | :--- | :--- | :--- |
| 1 | Get timetable | **Implemented** | `GET /api/timetable` (Overview list) & `GET /api/timetable/class/:classId/:sectionId` |
| 2 | Create timetable | **Implemented** | `POST /api/timetable/create` (Validates clashes, limits, and assignments) |
| 3 | Update timetable | **Implemented** | `PUT /api/timetable/update/:id` |
| 4 | Delete timetable | **Implemented** | `DELETE /api/timetable/delete/:id` |
| 5 | Get timetable by class | **Implemented** | `GET /api/timetable/class/:id` (Legacy) & `GET /api/timetable/class/:classId/:sectionId` |
| 6 | Get timetable by section | **Implemented** | `GET /api/timetable/class/:classId/:sectionId` |
| 7 | Get timetable by academic year | **Implemented** | `GET /api/timetable?academic_year=2026-2027` |
| 8 | Get available classes | **Implemented** | `GET /api/timetable/classes` and `GET /api/schooladmin/classes` |
| 9 | Get available sections | **Implemented** | Retrieved via class objects (`section` property in `GET /api/timetable/classes` and `/api/schooladmin/classes`) |
| 10 | Get available subjects | **Implemented** | `GET /api/schooladmin/subjects` and `GET /api/schooladmin/common-subjects` |
| 11 | Get assigned teachers | **Implemented** | `GET /api/timetable/assignments` and `GET /api/schooladmin/assignments` |
| 12 | Get subject-wise teachers | **Implemented** | `GET /api/timetable/assignments` and filtered dynamically on client via `getEligibleTeachers()` |
| 13 | Create timetable periods | **Implemented** | Generated through `POST /api/timetable/settings` or initialized in `PeriodConfig` |
| 14 | Update period details | **Implemented** | `PUT /api/timetable/period/:id` and `PUT /api/timetable/periods/:id` |
| 15 | Delete periods | **Specialized** | Handled declaratively via `POST /api/timetable/settings` (omitted periods in `generated_periods` array are safely pruned); standalone `DELETE /api/timetable/periods/:id` is **Not Implemented** |
| 16 | Get period timings | **Implemented** | `GET /api/timetable/settings` (in `generated_periods`) and `GET /api/timetable/class/:classId/:sectionId` (in `periods`) |
| 17 | Update period timings | **Implemented** | `PUT /api/timetable/period/:id` and `POST /api/timetable/settings` |
| 18 | Add timetable slots | **Implemented** | Handled within `entries` array in `POST /api/timetable/create` and `PUT /api/timetable/update/:id` |
| 19 | Update timetable slots | **Implemented** | Handled within `entries` array in `PUT /api/timetable/update/:id` and `POST /api/timetable/save` |
| 20 | Delete timetable slots | **Specialized** | Handled by sending an updated `entries` list or omitting the slot in `PUT /api/timetable/update/:id`; single slot `DELETE` route is **Not Implemented** |
| 21 | Get teacher-wise timetable | **Implemented** | `GET /api/timetable/teacher` and `GET /api/timetable/teacher/:teacherId` |
| 22 | Get class-wise timetable | **Implemented** | `GET /api/timetable/class/:classId/:sectionId` |
| 23 | Get section-wise timetable | **Implemented** | `GET /api/timetable/class/:classId/:sectionId` |
| 24 | Check teacher timetable conflicts | **Implemented** | `POST /api/timetable/conflicts` and synchronous checks during `POST /api/timetable/create` |
| 25 | Check classroom/period conflicts | **Implemented** | `POST /api/timetable/conflicts` detects room collisions, teacher unavailabilities, and weekly frequency shortages |
| 26 | Additional timetable APIs | **Implemented** | `autoGenerate`, `getGlobalTimetable`, `getDashboardStats`, `getPrintTimetable`, `getTeacherAvailability`, `saveTeacherAvailability` |

---

## 5. Detailed API Endpoint Specifications

### Global Request Headers

All authenticated endpoints require the standard JWT Bearer authorization header:

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

### 5.1 Master Timetable & Dashboard APIs

#### 5.1.1 Get All Timetables & Overview
- **Name**: Get All Timetables
- **Purpose**: Retrieve summary statistics (total timetables, scheduled classes, teachers assigned, unassigned periods) along with the complete list of master timetables for an academic year.
- **Method**: `GET`
- **URL**: `/api/timetable`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Query Parameters**:
  - `academic_year` (string, optional): Target academic year (defaults to `"2026-2027"`).
- **Backend Reference**: `backend/src/controllers/timetableController.js:40` (`getAllTimetables`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:35`
- **Frontend Component**: `frontend/src/pages/schooladmin/timetable/ManageTimetable.jsx`
- **Success Response (200 OK)**:
```json
{
  "totalTimetables": 2,
  "classesScheduled": 2,
  "totalClasses": 5,
  "teachersAssigned": 12,
  "unassignedPeriods": 16,
  "timetables": [
    {
      "_id": "6724a1b2c3d4e5f6a0110001",
      "school_id": "650000000000000000000001",
      "academic_year_id": "2026-2027",
      "class_id": {
        "_id": "66e7b1a20a1b2c3d4e5f6a04",
        "class": "10",
        "section": "A",
        "class_incharge_id": "66e7b1a20a1b2c3d4e5f6a01"
      },
      "section_id": "A",
      "status": "Published",
      "created_by": {
        "_id": "6a82b7bc84adbdc3f3c19d1f",
        "email": "schooladmin@example.com"
      },
      "createdAt": "2026-11-01T10:00:00.000Z",
      "updatedAt": "2026-11-01T10:00:00.000Z"
    }
  ]
}
```

#### 5.1.2 Get Timetable Dashboard Stats
- **Name**: Get Timetable Dashboard Statistics
- **Purpose**: Fetch high-level analytics, active timetable totals, assigned subjects, and active conflict logs.
- **Method**: `GET`
- **URL**: `/api/timetable/dashboard`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Query Parameters**:
  - `academic_year` (string, optional, default `"2026-2027"`)
- **Backend Reference**: `backend/src/controllers/timetableController.js:442` (`getDashboardStats`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:50`
- **Frontend Component**: `frontend/src/pages/schooladmin/timetable/TimetableDashboard.jsx`
- **Success Response (200 OK)**:
```json
{
  "totalClasses": 5,
  "totalTeachers": 12,
  "totalSubjects": 8,
  "assignedSubjects": 6,
  "activeTimetables": 2,
  "conflictsCount": 1,
  "conflicts": [
    {
      "school_id": "650000000000000000000001",
      "academic_year": "2026-2027",
      "conflict_type": "Subject Frequency Conflict",
      "severity": "Warning",
      "class_id": "66e7b1a20a1b2c3d4e5f6a04",
      "description": "Subject Frequency Gap in 10-A: Science requires 6 weekly periods, but only 4 assigned."
    }
  ]
}
```

---

### 5.2 Class & Section Timetable APIs

#### 5.2.1 Get Timetable by Class and Section
- **Name**: Get Class Section Timetable
- **Purpose**: Retrieve the full timetable dataset for a class and section, including class metadata, master record status, scheduled slot entries, ordered period configurations, and teacher assignments.
- **Method**: `GET`
- **URL**: `/api/timetable/class/:classId/:sectionId`
- **Access / Role**: Protected (`SchoolAdmin`, `Teacher`, `Parent`, `Student`)
- **URL Parameters**:
  - `classId` (string, required): Mongo ObjectId or class standard string (e.g., `"66e7b1a20a1b2c3d4e5f6a04"`).
  - `sectionId` (string, required): Section letter or code (e.g., `"A"`).
- **Query Parameters**:
  - `academic_year` (string, optional, default `"2026-2027"`).
- **Backend Reference**: `backend/src/controllers/timetableController.js:75` (`getClassTimetableBySection`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:36`
- **Frontend Component**: `frontend/src/pages/schooladmin/timetable/CreateTimetable.jsx`, `ClassTimetable.jsx`
- **Success Response (200 OK)**:
```json
{
  "classObj": {
    "_id": "66e7b1a20a1b2c3d4e5f6a04",
    "class": "10",
    "section": "A",
    "class_incharge_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a01",
      "name": "Arun Kumar",
      "email": "arun.kumar@gmail.com"
    }
  },
  "master": {
    "_id": "6724a1b2c3d4e5f6a0110001",
    "school_id": "650000000000000000000001",
    "academic_year_id": "2026-2027",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "section_id": "A",
    "status": "Published"
  },
  "entries": [
    {
      "_id": "6724a1b2c3d4e5f6a0110010",
      "timetable_id": "6724a1b2c3d4e5f6a0110001",
      "day": "Monday",
      "period_name": "P1",
      "subject_id": {
        "_id": "66e7b1a20a1b2c3d4e5f6a03",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "teacher_id": {
        "_id": "66e7b1a20a1b2c3d4e5f6a01",
        "name": "Arun Kumar",
        "email": "arun.kumar@gmail.com"
      },
      "room_no": "Room 101",
      "remarks": ""
    }
  ],
  "periods": [
    {
      "_id": "672400000000000000000001",
      "period_name": "P1",
      "start_time": "09:00 AM",
      "end_time": "09:45 AM",
      "type": "Teaching Period",
      "is_lunch": false,
      "is_break": false,
      "order": 1
    }
  ],
  "assignments": [
    {
      "_id": "66e7b1a20a1b2c3d4e5f6a06",
      "class_id": "66e7b1a20a1b2c3d4e5f6a04",
      "subject_id": { "_id": "66e7b1a20a1b2c3d4e5f6a03", "name": "Mathematics" },
      "teacher_id": { "_id": "66e7b1a20a1b2c3d4e5f6a01", "name": "Arun Kumar" },
      "weekly_periods_required": 6,
      "is_class_teacher": true
    }
  ]
}
```
- **Error Response (404 Not Found)**:
```json
{
  "message": "Class not found"
}
```

#### 5.2.2 Create Timetable
- **Name**: Create Timetable & Entries
- **Purpose**: Persist a complete timetable master and slot entries for a class and section. Automatically validates teacher schedule collisions, subject daily maximums, and teacher-subject eligibility.
- **Method**: `POST`
- **URL**: `/api/timetable/create`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Request Body Fields**:
  - `academic_year_id` (string, optional, default `"2026-2027"`): Academic year identifier.
  - `class_id` (string, required): ObjectId of the target class.
  - `section_id` (string, optional, default `"A"`): Target section identifier.
  - `status` (string, optional, default `"Draft"`): Enum `["Draft", "Published"]`.
  - `entries` (array of objects, required): Array of period slots.
    - `day` (string, required): `["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]`.
    - `period_name` (string, required): e.g. `"P1"`, `"P2"`, `"P3"`.
    - `subject_id` (string, optional/nullable): ObjectId of subject.
    - `teacher_id` (string, optional/nullable): ObjectId of teacher.
    - `room_no` (string, optional): Classroom or laboratory name.
    - `remarks` (string, optional): Specific notes.
- **Sample Request Body**:
```json
{
  "academic_year_id": "2026-2027",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "section_id": "A",
  "status": "Published",
  "entries": [
    {
      "day": "Monday",
      "period_name": "P1",
      "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
      "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
      "room_no": "Room 101",
      "remarks": "Bring Geometry box"
    },
    {
      "day": "Monday",
      "period_name": "P2",
      "subject_id": "66e7b1a20a1b2c3d4e5f6a05",
      "teacher_id": "66e7b1a20a1b2c3d4e5f6a02",
      "room_no": "Science Lab",
      "remarks": "Physics lab experiment"
    }
  ]
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Timetable created successfully",
  "master": {
    "_id": "6724a1b2c3d4e5f6a0110001",
    "school_id": "650000000000000000000001",
    "academic_year_id": "2026-2027",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "section_id": "A",
    "status": "Published",
    "created_by": "6a82b7bc84adbdc3f3c19d1f",
    "createdAt": "2026-11-03T06:30:00.000Z",
    "updatedAt": "2026-11-03T06:30:00.000Z"
  },
  "entryCount": 2
}
```
- **Error Responses (400 Bad Request)**:
  - *Teacher Double-Booking Clash*:
    ```json
    {
      "message": "Teacher already assigned for this period. Teacher Arun Kumar is busy on Monday P1."
    }
    ```
  - *Subject Daily Limit (Max 2 periods/day)*:
    ```json
    {
      "message": "Subject Daily Limit Exceeded. Mathematics cannot exceed 2 periods on Monday."
    }
    ```
  - *Teacher Eligibility / Not Assigned to Subject*:
    ```json
    {
      "message": "Teacher Arun Kumar is not assigned to teach Chemistry for this class."
    }
    ```
  - *Missing Required Field*:
    ```json
    {
      "message": "class_id is required"
    }
    ```

#### 5.2.3 Update Timetable
- **Name**: Update Timetable
- **Purpose**: Update timetable status (`Draft` or `Published`) or replace its slot entries.
- **Method**: `PUT`
- **URL**: `/api/timetable/update/:id`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **URL Parameters**:
  - `id` (string, required): `TimetableMaster` ObjectId.
- **Request Body Fields**:
  - `status` (string, optional): `"Draft"` or `"Published"`.
  - `entries` (array of objects, optional): Updated slots.
- **Sample Request Body (Status Toggle)**:
```json
{
  "status": "Published"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Timetable updated successfully",
  "master": {
    "_id": "6724a1b2c3d4e5f6a0110001",
    "school_id": "650000000000000000000001",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "section_id": "A",
    "status": "Published"
  }
}
```
- **Error Response (404 Not Found)**:
```json
{
  "message": "Timetable master not found"
}
```

#### 5.2.4 Delete Timetable
- **Name**: Delete Timetable
- **Purpose**: Permanently remove a class timetable master record and cascade delete all associated timetable entries and legacy mirrored schedules.
- **Method**: `DELETE`
- **URL**: `/api/timetable/delete/:id`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **URL Parameters**:
  - `id` (string, required): `TimetableMaster` ObjectId.
- **Backend Reference**: `backend/src/controllers/timetableController.js:408` (`deleteTimetable`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:41`
- **Success Response (200 OK)**:
```json
{
  "message": "Timetable deleted successfully"
}
```

---

### 5.3 Teacher Timetable & Workload APIs

#### 5.3.1 Get Teacher-Wise Timetable
- **Name**: Get Teacher Timetable & Workload
- **Purpose**: Retrieve a teacher's weekly scheduled periods, calculate their total allocated periods against school workload ceilings (`max_teacher_weekly_periods`), and determine their overload status (`OK` vs `OVERLOADED`).
- **Method**: `GET`
- **URLs**:
  - `/api/timetable/teacher` (Fetches timetable of logged-in teacher)
  - `/api/timetable/teacher/:teacherId` (Fetches timetable for specified teacher ObjectId)
- **Access / Role**: Protected (`SchoolAdmin`, `SuperAdmin`, `Teacher`)
- **URL Parameters**:
  - `teacherId` (string, optional): Teacher ObjectId or `'me'`.
- **Backend Reference**: `backend/src/controllers/timetableController.js:121` (`getTeacherTimetableByTeacherId`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:37-38`
- **Frontend Component**: `frontend/src/pages/schooladmin/timetable/TeacherTimetable.jsx`
- **Success Response (200 OK)**:
```json
{
  "teacher": {
    "_id": "66e7b1a20a1b2c3d4e5f6a01",
    "name": "Arun Kumar",
    "email": "arun.kumar@gmail.com",
    "qualification": "M.Sc Mathematics",
    "phone": "9876543210"
  },
  "settings": {
    "max_teacher_weekly_periods": 36,
    "school_start_time": "08:45 AM",
    "school_end_time": "02:25 PM"
  },
  "periods": [
    {
      "_id": "672400000000000000000001",
      "period_name": "P1",
      "start_time": "09:00 AM",
      "end_time": "09:45 AM",
      "type": "Teaching Period"
    }
  ],
  "totalPeriods": 22,
  "maxAllowed": 36,
  "workloadStatus": "OK",
  "schedule": [
    {
      "_id": "6724a1b2c3d4e5f6a0110010",
      "day": "Monday",
      "period_name": "P1",
      "subject_name": "Mathematics",
      "subjectName": "Mathematics",
      "className": "10-A",
      "class_name": "10-A",
      "room_no": "Room 101"
    },
    {
      "_id": "6724a1b2c3d4e5f6a0110011",
      "day": "Monday",
      "period_name": "P3",
      "subject_name": "Mathematics",
      "subjectName": "Mathematics",
      "className": "9-B",
      "class_name": "9-B",
      "room_no": "Room 204"
    }
  ],
  "entries": [
    {
      "_id": "6724a1b2c3d4e5f6a0110010",
      "day": "Monday",
      "period_name": "P1",
      "subject_name": "Mathematics",
      "subjectName": "Mathematics",
      "className": "10-A",
      "class_name": "10-A",
      "room_no": "Room 101"
    }
  ]
}
```
- **Error Response (404 Not Found)**:
```json
{
  "message": "Teacher not found"
}
```

---

### 5.4 Timetable Settings & Period Timing APIs

#### 5.4.1 Get Timetable Settings
- **Name**: Get Timetable Settings & Period Timings
- **Purpose**: Retrieve school timing rules (school start/end time, period duration, lunch break duration, working days, Saturday rules, max weekly periods) and generated periods list.
- **Method**: `GET`
- **URL**: `/api/timetable/settings`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Query Parameters**:
  - `academic_year` (string, optional, default `"2026-2027"`)
- **Backend Reference**: `backend/src/controllers/timetableController.js:470` (`getSettings`)
- **Route Reference**: `backend/src/routes/timetableRoutes.js:51`
- **Frontend Component**: `frontend/src/pages/schooladmin/timetable/TimetableSettings.jsx`
- **Success Response (200 OK)**:
```json
{
  "_id": "6724b1a20a1b2c3d4e5f6a20",
  "school_id": "650000000000000000000001",
  "academic_year": "2026-2027",
  "school_start_time": "08:45 AM",
  "school_end_time": "02:25 PM",
  "period_duration": 40,
  "lunch_duration": 20,
  "lunch_after_period": 4,
  "periods_per_day": 8,
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "saturday_half_day": true,
  "saturday_periods": 4,
  "max_teacher_weekly_periods": 36,
  "generated_periods": [
    {
      "_id": "672400000000000000000001",
      "period_name": "P1",
      "start_time": "08:45 AM",
      "end_time": "09:25 AM",
      "type": "Teaching Period",
      "is_lunch": false,
      "is_break": false
    },
    {
      "_id": "672400000000000000000002",
      "period_name": "P2",
      "start_time": "09:25 AM",
      "end_time": "10:05 AM",
      "type": "Teaching Period",
      "is_lunch": false,
      "is_break": false
    },
    {
      "_id": "672400000000000000000003",
      "period_name": "Lunch",
      "start_time": "11:25 AM",
      "end_time": "11:45 AM",
      "type": "Lunch",
      "is_lunch": true,
      "is_break": false
    }
  ]
}
```

#### 5.4.2 Save Timetable Settings & Periods
- **Name**: Save Timetable Settings
- **Purpose**: Persist school timing parameters and save or recalculate `generated_periods`. Automatically synchronizes configurations to `PeriodConfig` documents and validates that `end_time` is later than `start_time`.
- **Method**: `POST`
- **URL**: `/api/timetable/settings`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Request Body Payload**:
```json
{
  "academic_year": "2026-2027",
  "school_start_time": "08:45 AM",
  "school_end_time": "02:25 PM",
  "period_duration": 40,
  "lunch_duration": 20,
  "lunch_after_period": 4,
  "periods_per_day": 8,
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "saturday_half_day": true,
  "saturday_periods": 4,
  "max_teacher_weekly_periods": 36,
  "generated_periods": [
    {
      "_id": "672400000000000000000001",
      "period_name": "P1",
      "start_time": "08:45 AM",
      "end_time": "09:25 AM",
      "type": "Teaching Period"
    },
    {
      "_id": "672400000000000000000002",
      "period_name": "P2",
      "start_time": "09:25 AM",
      "end_time": "10:05 AM",
      "type": "Teaching Period"
    },
    {
      "_id": "672400000000000000000003",
      "period_name": "Break",
      "start_time": "10:05 AM",
      "end_time": "10:15 AM",
      "type": "Break"
    },
    {
      "_id": "672400000000000000000004",
      "period_name": "Lunch",
      "start_time": "11:35 AM",
      "end_time": "11:55 AM",
      "type": "Lunch"
    }
  ]
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Settings saved",
  "settings": {
    "_id": "6724b1a20a1b2c3d4e5f6a20",
    "school_id": "650000000000000000000001",
    "academic_year": "2026-2027",
    "period_duration": 40,
    "periods_per_day": 8
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "message": "Invalid timing for period \"P1\": End time (08:40 AM) must be later than start time (08:45 AM)."
}
```

#### 5.4.3 Update Individual Period Timing
- **Name**: Update Period Timing
- **Purpose**: Modifies the start time, end time, and label of a specific period slot. Propagates changes to both `PeriodConfig` and `TimetableSettings.generated_periods`.
- **Method**: `PUT`
- **URLs**:
  - `/api/timetable/period/:id`
  - `/api/timetable/periods/:id`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **URL Parameters**:
  - `id` (string, required): ObjectId of the period in `PeriodConfig` or period identifier.
- **Request Body Payload**:
```json
{
  "period_name": "P1",
  "start_time": "08:50 AM",
  "end_time": "09:35 AM",
  "type": "Teaching Period",
  "is_lunch": false,
  "is_break": false
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Period timing updated successfully",
  "period": {
    "_id": "672400000000000000000001",
    "school_id": "650000000000000000000001",
    "period_name": "P1",
    "start_time": "08:50 AM",
    "end_time": "09:35 AM",
    "type": "Teaching Period",
    "is_lunch": false,
    "is_break": false,
    "order": 1
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "message": "Invalid timing: End time (08:30 AM) must be later than start time (08:50 AM)."
}
```

---

### 5.5 Teacher Assignment & Availability APIs

#### 5.5.1 Get Timetable Teacher Assignments
- **Name**: Get Teacher Assignments
- **Purpose**: Returns all teacher-to-subject-to-class assignments across both `TeacherAssignment` and `ClassSubject` collections.
- **Method**: `GET`
- **URL**: `/api/timetable/assignments`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "66e7b1a20a1b2c3d4e5f6a06",
    "school_id": "650000000000000000000001",
    "academic_year": "2026-2027",
    "class_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a04",
      "class": "10",
      "section": "A"
    },
    "subject_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a03",
      "name": "Mathematics",
      "code": "MATH101"
    },
    "teacher_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a01",
      "name": "Arun Kumar",
      "email": "arun.kumar@gmail.com"
    },
    "weekly_periods_required": 6,
    "is_class_teacher": true,
    "is_lab_required": false,
    "lab_type": "None"
  }
]
```

#### 5.5.2 Save Teacher Assignment
- **Name**: Save Teacher Assignment
- **Purpose**: Upserts an assignment mapping a teacher to a subject for a class, configuring weekly required periods and lab details.
- **Method**: `POST`
- **URL**: `/api/timetable/assignments`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Request Body Payload**:
```json
{
  "academic_year": "2026-2027",
  "class_id": "66e7b1a20a1b2c3d4e5f6a04",
  "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
  "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
  "weekly_periods_required": 6,
  "is_class_teacher": true,
  "is_lab_required": false,
  "lab_type": "None"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Assignment saved",
  "assignment": {
    "_id": "66e7b1a20a1b2c3d4e5f6a06",
    "school_id": "650000000000000000000001",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
    "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
    "weekly_periods_required": 6
  }
}
```

#### 5.5.3 Delete Teacher Assignment
- **Name**: Delete Teacher Assignment
- **Method**: `DELETE`
- **URL**: `/api/timetable/assignments/:id`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Success Response (200 OK)**:
```json
{
  "message": "Assignment deleted"
}
```

#### 5.5.4 Get & Save Teacher Availability
- **Name**: Get Teacher Availability
- **Method**: `GET`
- **URL**: `/api/timetable/availability`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`, `Teacher`
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "6724c0000000000000000001",
    "school_id": "650000000000000000000001",
    "teacher_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a01",
      "name": "Arun Kumar"
    },
    "unavailabilities": [
      {
        "day": "Friday",
        "period_name": "P8",
        "reason": "Administrative duty"
      }
    ]
  }
]
```

- **Name**: Save Teacher Availability
- **Method**: `POST`
- **URL**: `/api/timetable/availability`
- **Request Body Payload**:
```json
{
  "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
  "unavailabilities": [
    {
      "day": "Friday",
      "period_name": "P8",
      "reason": "Administrative duty"
    }
  ]
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Availability saved",
  "availability": {
    "_id": "6724c0000000000000000001",
    "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
    "unavailabilities": [
      {
        "day": "Friday",
        "period_name": "P8",
        "reason": "Administrative duty"
      }
    ]
  }
}
```

---

### 5.6 Automated Generation & Conflict Detection APIs

#### 5.6.1 Auto-Generate Timetables
- **Name**: Auto Generate Timetables
- **Purpose**: Generates conflict-free timetable schedules automatically using constraint-satisfaction algorithms that adhere to teacher availability, room requirements, weekly frequencies, and subject daily limits.
- **Method**: `POST`
- **URLs**:
  - `/api/timetable/auto-generate`
  - `/api/timetable/generate` (Alias)
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Request Body Payload**:
```json
{
  "academic_year": "2026-2027",
  "class_ids": [
    "66e7b1a20a1b2c3d4e5f6a04",
    "66e7b1a20a1b2c3d4e5f6a05"
  ]
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Timetable auto-generated successfully!",
  "count": 2,
  "timetables": [
    {
      "class_id": "66e7b1a20a1b2c3d4e5f6a04",
      "academic_year": "2026-2027",
      "status": "Draft",
      "schedule": [
        {
          "day": "Monday",
          "period_name": "P1",
          "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
          "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
          "room": "Room 101"
        }
      ]
    }
  ]
}
```

#### 5.6.2 Detect Timetable Conflicts
- **Name**: Scan & Check Timetable Conflicts
- **Purpose**: Runs a complete audit across the school's timetables and returns detected teacher overlaps, room collisions, teacher unavailabilities, teacher weekly overloads, and subject frequency deficiencies.
- **Method**: `POST`
- **URL**: `/api/timetable/conflicts`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`
- **Request Body Payload**:
```json
{
  "academic_year": "2026-2027"
}
```
- **Success Response (200 OK)**:
```json
{
  "count": 2,
  "conflicts": [
    {
      "school_id": "650000000000000000000001",
      "academic_year": "2026-2027",
      "conflict_type": "Teacher Conflict",
      "severity": "Error",
      "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
      "day": "Monday",
      "period_name": "P2",
      "description": "Teacher Conflict: Arun Kumar is assigned to multiple classes (10-A and 9-B) on Monday P2."
    },
    {
      "school_id": "650000000000000000000001",
      "academic_year": "2026-2027",
      "conflict_type": "Teacher Workload Conflict",
      "severity": "Warning",
      "teacher_id": "66e7b1a20a1b2c3d4e5f6a02",
      "description": "Teacher Overloaded: Priya Sharma is assigned 38 periods/week (Max: 36)."
    }
  ]
}
```

---

### 5.7 Print & Student Views

#### 5.7.1 Print Timetable
- **Name**: Get Printable Timetable
- **Method**: `GET`
- **URL**: `/api/timetable/print`
- **Access / Role**: `SchoolAdmin`, `SuperAdmin`, `Teacher`
- **Query Parameters**:
  - `type` (string, optional, enum `["class", "teacher", "global"]`, default `"class"`).
  - `id` (string, optional): Target Class or Teacher ObjectId.
  - `academic_year` (string, optional, default `"2026-2027"`).
- **Success Response (200 OK)**:
  Returns formatted printable data structure matching `getClassTimetableBySection` or `getTeacherTimetableByTeacherId`.

#### 5.7.2 Student / Parent Timetable View
- **Name**: Get Student Timetable
- **Method**: `GET`
- **URL**: `/api/timetable/student`
- **Access / Role**: `Student`, `Parent`, `SchoolAdmin`, `SuperAdmin`
- **Query Parameters**:
  - `class_id` (string, required): Student's enrolled class ObjectId.
- **Success Response (200 OK)**:
```json
{
  "classObj": {
    "_id": "66e7b1a20a1b2c3d4e5f6a04",
    "class": "10",
    "section": "A",
    "class_incharge_id": {
      "_id": "66e7b1a20a1b2c3d4e5f6a01",
      "name": "Arun Kumar"
    }
  },
  "timetable": {
    "_id": "6724a1b2c3d4e5f6a0110001",
    "status": "Published",
    "schedule": [
      {
        "day": "Monday",
        "period_name": "P1",
        "subject_id": {
          "_id": "66e7b1a20a1b2c3d4e5f6a03",
          "name": "Mathematics"
        },
        "teacher_id": {
          "_id": "66e7b1a20a1b2c3d4e5f6a01",
          "name": "Arun Kumar"
        },
        "room": "Room 101"
      }
    ]
  }
}
```

---

### 5.8 Auxiliary School Admin APIs

The Timetable UI integrates with these auxiliary endpoints under `/api/schooladmin/*`:

| Endpoint | Method | Purpose in Timetable Module |
| :--- | :---: | :--- |
| `/api/schooladmin/classes` | `GET` | Fetches available classes, sections, and class in-charge assignments. |
| `/api/schooladmin/subjects` | `GET` | Fetches curriculum subjects (`name`, `code`, `type`). |
| `/api/schooladmin/common-subjects` | `GET` | Fetches global standard subjects. |
| `/api/schooladmin/teachers` | `GET` | Fetches active teacher directory with qualification, domains, and contact. |
| `/api/schooladmin/assignments` | `GET` | Fetches class-subject teacher assignments from `ClassSubject` collection. |

---

## 6. Practical API Testing Examples

Below are concrete, practical `curl` commands and payloads for end-to-end testing of the Timetable module.

### Step 1: Configure School Timings & Periods

```bash
curl -X POST http://localhost:5005/api/timetable/settings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year": "2026-2027",
    "school_start_time": "08:45 AM",
    "school_end_time": "02:25 PM",
    "period_duration": 40,
    "lunch_duration": 20,
    "lunch_after_period": 4,
    "periods_per_day": 8,
    "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "saturday_half_day": true,
    "saturday_periods": 4,
    "max_teacher_weekly_periods": 36,
    "generated_periods": [
      { "period_name": "P1", "start_time": "08:45 AM", "end_time": "09:25 AM", "type": "Teaching Period" },
      { "period_name": "P2", "start_time": "09:25 AM", "end_time": "10:05 AM", "type": "Teaching Period" },
      { "period_name": "Break", "start_time": "10:05 AM", "end_time": "10:15 AM", "type": "Break" },
      { "period_name": "P3", "start_time": "10:15 AM", "end_time": "10:55 AM", "type": "Teaching Period" },
      { "period_name": "P4", "start_time": "10:55 AM", "end_time": "11:35 AM", "type": "Teaching Period" },
      { "period_name": "Lunch", "start_time": "11:35 AM", "end_time": "11:55 AM", "type": "Lunch" },
      { "period_name": "P5", "start_time": "11:55 AM", "end_time": "12:35 PM", "type": "Teaching Period" },
      { "period_name": "P6", "start_time": "12:35 PM", "end_time": "01:15 PM", "type": "Teaching Period" },
      { "period_name": "P7", "start_time": "01:15 PM", "end_time": "01:55 PM", "type": "Teaching Period" },
      { "period_name": "P8", "start_time": "01:55 PM", "end_time": "02:25 PM", "type": "Teaching Period" }
    ]
  }'
```

---

### Step 2: Assign Subject Teacher to Class

```bash
curl -X POST http://localhost:5005/api/timetable/assignments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year": "2026-2027",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
    "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
    "weekly_periods_required": 6,
    "is_class_teacher": true,
    "is_lab_required": false,
    "lab_type": "None"
  }'
```

---

### Step 3: Create & Publish Class Timetable

```bash
curl -X POST http://localhost:5005/api/timetable/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year_id": "2026-2027",
    "class_id": "66e7b1a20a1b2c3d4e5f6a04",
    "section_id": "A",
    "status": "Published",
    "entries": [
      {
        "day": "Monday",
        "period_name": "P1",
        "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
        "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
        "room_no": "Room 101",
        "remarks": "Algebra Introduction"
      },
      {
        "day": "Tuesday",
        "period_name": "P1",
        "subject_id": "66e7b1a20a1b2c3d4e5f6a03",
        "teacher_id": "66e7b1a20a1b2c3d4e5f6a01",
        "room_no": "Room 101"
      }
    ]
  }'
```

---

### Step 4: Fetch Class Timetable & Scheduled Entries

```bash
curl -X GET "http://localhost:5005/api/timetable/class/66e7b1a20a1b2c3d4e5f6a04/A?academic_year=2026-2027" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Step 5: Update Period Timing

```bash
curl -X PUT http://localhost:5005/api/timetable/period/672400000000000000000001 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "period_name": "P1",
    "start_time": "08:50 AM",
    "end_time": "09:30 AM",
    "type": "Teaching Period"
  }'
```

---

### Step 6: Fetch Teacher Timetable & Workload Analysis

```bash
curl -X GET http://localhost:5005/api/timetable/teacher/66e7b1a20a1b2c3d4e5f6a01 \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Step 7: Check for System-Wide Schedule Conflicts

```bash
curl -X POST http://localhost:5005/api/timetable/conflicts \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year": "2026-2027"
  }'
```

---

### Step 8: Delete Timetable

```bash
curl -X DELETE http://localhost:5005/api/timetable/delete/6724a1b2c3d4e5f6a0110001 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 7. Source File & Component References

### Backend Implementation Files

- **Routes**:
  - [`backend/src/routes/timetableRoutes.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/routes/timetableRoutes.js) — Timetable routes and middleware bindings.
  - [`backend/src/routes/schoolAdminRoutes.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/routes/schoolAdminRoutes.js) — Class, Subject, and Teacher master routes.
- **Controllers & Services**:
  - [`backend/src/controllers/timetableController.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/controllers/timetableController.js) — All 22 core timetable controller methods.
  - [`backend/src/services/conflictDetectionService.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/services/conflictDetectionService.js) — Teacher collision, room clash, unavailability, and frequency check logic.
  - [`backend/src/services/timetableGeneratorService.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/services/timetableGeneratorService.js) — Automated constraint-satisfaction generation algorithm.
- **Database Models**:
  - [`backend/src/models/TimetableMaster.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableMaster.js) — Header record for class-section-year timetable.
  - [`backend/src/models/TimetableEntry.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableEntry.js) — Individual slot allocation cells.
  - [`backend/src/models/TimetableSettings.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TimetableSettings.js) — School working days, hours, lunch, and generated periods.
  - [`backend/src/models/PeriodConfig.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/PeriodConfig.js) — Period timing configurations with start/end time.
  - [`backend/src/models/TeacherAssignment.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TeacherAssignment.js) — Subject teacher assignments per class.
  - [`backend/src/models/TeacherAvailability.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/TeacherAvailability.js) — Teacher blocked periods.
  - [`backend/src/models/Timetable.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/Timetable.js) — Embedded schedule collection mirror.
  - [`backend/src/models/ConflictLog.js`](file:///Users/sabari/Documents/git/schoolapp/backend/src/models/ConflictLog.js) — Persisted conflict incident records.

### Frontend Pages & Components

All timetable interfaces are located under [`frontend/src/pages/schooladmin/timetable/`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/):

- [`CreateTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/CreateTimetable.jsx) — Grid-based interactive timetable editor with teacher filtering, modal slot assignment, and period timing edits.
- [`ManageTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/ManageTimetable.jsx) — Table listing all timetables, status toggling (Draft/Published), and deletion.
- [`ClassTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/ClassTimetable.jsx) — Class-wise timetable viewer with section tabs.
- [`TeacherTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TeacherTimetable.jsx) — Teacher-wise schedule viewer with workload analysis.
- [`TimetableSettings.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TimetableSettings.jsx) — School timing configurations, working days, period timings, and duration rules.
- [`ConflictDetection.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/ConflictDetection.jsx) — Conflict audit dashboard with resolution guidance.
- [`AutoGenerator.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/AutoGenerator.jsx) — Algorithmic automated generator UI.
- [`PrintTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/PrintTimetable.jsx) — Clean printable timetable views for classes and teachers.
- [`GlobalTimetable.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/GlobalTimetable.jsx) — School-wide master matrix view.
- [`TeacherAssignment.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TeacherAssignment.jsx) — Teacher-subject assignment allocation interface.
- [`TimetableDashboard.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TimetableDashboard.jsx) — Metrics, counts, and completion analytics.
- [`TimetableReports.jsx`](file:///Users/sabari/Documents/git/schoolapp/frontend/src/pages/schooladmin/timetable/TimetableReports.jsx) — Academic timetable reports and exports.
