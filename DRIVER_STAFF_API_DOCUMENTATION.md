# Driver Staff Module API Specification & Payload Documentation

This document provides full backend API specifications, HTTP methods, route paths, headers, sample request body payloads, and success responses for all **Driver Staff Module** endpoints in the School Management System.

---

## Global Authentication & Headers

All protected endpoints under `/api/driver/*` require JWT Bearer token authorization with **Driver** role privileges.

```http
Authorization: Bearer <your_driver_jwt_token>
Content-Type: application/json
```

---

## Table of Contents

1. [Driver Authentication APIs](#1-driver-authentication-apis)
   - [1.1 Driver Login](#11-driver-login)
2. [Driver Profile Management APIs](#2-driver-profile-management-apis)
   - [2.1 Get Driver Profile](#21-get-driver-profile)
   - [2.2 Update Driver Profile](#22-update-driver-profile)
   - [2.3 Change Driver Password](#23-change-driver-password)
3. [Driver Portal Dashboard & Allocation APIs](#3-driver-portal-dashboard--allocation-apis)
   - [3.1 Get Driver Portal Summary](#31-get-driver-portal-summary)
   - [3.2 Get Assigned Route & Stops](#32-get-assigned-route--stops)
   - [3.3 Get Allocated Students](#33-get-allocated-students)
4. [Trip Operations & Live Telemetry APIs](#4-trip-operations--live-telemetry-apis)
   - [4.1 Start Bus Trip](#41-start-bus-trip)
   - [4.2 Stream GPS Live Location & Telemetry](#42-stream-gps-live-location--telemetry)
   - [4.3 Mark Student Boarding / Deboarding](#43-mark-student-boarding--deboarding)
   - [4.4 Get Student Boarding History Logs](#44-get-student-boarding-history-logs)
   - [4.5 End Bus Trip](#45-end-bus-trip)
   - [4.6 Get Driver Trip History](#46-get-driver-trip-history)
5. [Emergency SOS & Alert Operations](#5-emergency-sos--alert-operations)
   - [5.1 Trigger Emergency SOS Alert](#51-trigger-emergency-sos-alert)
   - [5.2 Report Traffic or Breakdown Delay](#52-report-traffic-or-breakdown-delay)
   - [5.3 Get Transport Notifications](#53-get-transport-notifications)
6. [Real-Time Socket.IO Streaming Events](#6-real-time-socketio-streaming-events)
7. [Security & Authorization Guardrails](#7-security--authorization-guardrails)

---

## 1. Driver Authentication APIs

### 1.1 Driver Login
Authenticates a bus driver using registered mobile number and password. Returns a 30-day JWT bearer token.

- **Method**: `POST`
- **URL**: `/api/driver/auth/login`
- **Access**: Public
- **Request Payload**:
```json
{
  "mobile_number": "9876543210",
  "password": "Driver@123"
}
```

- **Success Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "650000000000000000000101",
    "driver_id": "DRV001",
    "name": "Rajesh Kumar",
    "mobile_number": "9876543210",
    "email": "rajesh.driver@school.com",
    "license_number": "DL-998877665544",
    "status": "Active",
    "assigned_bus": {
      "_id": "650000000000000000000201",
      "bus_number": "BUS-101",
      "bus_name": "Yellow Express 101",
      "registration_number": "KA-01-EQ-9999",
      "capacity": 40
    }
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: `{"message": "Mobile number and password are required"}`
  - `401 Unauthorized`: `{"message": "Invalid mobile number or password"}`
  - `403 Forbidden`: `{"message": "Driver account is inactive. Please contact School Administration."}`

---

## 2. Driver Profile Management APIs

### 2.1 Get Driver Profile
Retrieves the logged-in driver's personal and operational profile.

- **Method**: `GET`
- **URL**: `/api/driver/profile`
- **Access**: Private (Driver)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "_id": "650000000000000000000101",
  "school_id": "650000000000000000000001",
  "driver_id": "DRV001",
  "name": "Rajesh Kumar",
  "mobile_number": "9876543210",
  "email": "rajesh.driver@school.com",
  "address": "123 Main Street, Central City",
  "license_number": "DL-998877665544",
  "license_expiry": "2028-12-31T00:00:00.000Z",
  "photo": "https://school-cdn.example.com/drivers/drv001.jpg",
  "status": "Active",
  "assigned_bus_id": {
    "_id": "650000000000000000000201",
    "bus_number": "BUS-101",
    "bus_name": "Yellow Express 101"
  }
}
```

---

### 2.2 Update Driver Profile
Updates driver editable profile information (name, alternate email, address, photo URL).

- **Method**: `PUT`
- **URL**: `/api/driver/profile`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "name": "Rajesh Kumar Senior",
  "email": "rajesh.updated@school.com",
  "address": "456 Park Avenue, Central City",
  "photo": "https://school-cdn.example.com/drivers/drv001_new.jpg"
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "Driver profile updated successfully",
  "driver": {
    "_id": "650000000000000000000101",
    "name": "Rajesh Kumar Senior",
    "email": "rajesh.updated@school.com",
    "address": "456 Park Avenue, Central City",
    "photo": "https://school-cdn.example.com/drivers/drv001_new.jpg"
  }
}
```

---

### 2.3 Change Driver Password
Allows driver to securely update password.

- **Method**: `PUT`
- **URL**: `/api/driver/change-password`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "currentPassword": "Driver@123",
  "newPassword": "DriverNew@456"
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "Password updated successfully"
}
```

---

## 3. Driver Portal Dashboard & Allocation APIs

### 3.1 Get Driver Portal Summary
Fetches complete operational dashboard data for the authenticated driver, including assigned driver details, assigned vehicle (`assignedBus`), active assigned route (`assignedRoute`), sequenced route stops (`routeStops`), total stops count (`totalStopsCount`), allocated students count (`totalStudentsCount`), list of allocated student transport details (`assignedStudents`), and active trip status (`activeTrip`).

- **Method**: `GET`
- **URL**: `/api/driver/portal`
- **Access**: Private (Driver Role Required)
- **Headers**:
  ```http
  Authorization: Bearer <driver_jwt_token>
  Content-Type: application/json
  ```
- **Query Parameters**: None
- **Request Body**: None

- **Success Response (200 OK)**:
```json
{
  "driver": {
    "_id": "6a980555a181e5ba0c4100f6",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "driver_id": "DRV-1788347733584",
    "name": "Ravi Kumar",
    "mobile_number": "9886164085",
    "email": "ravi.driver@school.com",
    "address": "123 Station Road",
    "license_number": "DL-IND-15583",
    "photo": "",
    "status": "Active",
    "assigned_bus_id": {
      "_id": "6a9803e9457ae6d3918b7e87",
      "school_id": "6a82b7bc84adbdc3f3c19d20",
      "bus_number": "BUS-3",
      "vehicle_reg_number": "TN01AB7890",
      "bus_name": "no 3",
      "bus_type": "Van",
      "total_seats": 40,
      "gps_enabled": true,
      "status": "Active",
      "createdAt": "2026-09-02T11:09:29.442Z",
      "updatedAt": "2026-09-02T17:08:49.257Z",
      "__v": 0
    },
    "createdAt": "2026-09-02T11:15:33.594Z",
    "updatedAt": "2026-09-29T10:50:54.023Z",
    "__v": 0
  },
  "assignedBus": {
    "_id": "6a9803e9457ae6d3918b7e87",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "bus_number": "BUS-3",
    "vehicle_reg_number": "TN01AB7890",
    "bus_name": "no 3",
    "bus_type": "Van",
    "total_seats": 40,
    "gps_enabled": true,
    "status": "Active",
    "createdAt": "2026-09-02T11:09:29.442Z",
    "updatedAt": "2026-09-02T17:08:49.257Z",
    "__v": 0
  },
  "assignedRoute": {
    "_id": "6a9858803903f1740003d176",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "route_id": "RT-1",
    "route_name": "tambaram",
    "start_point": "koyambedu",
    "end_point": "tambaram",
    "total_distance_km": 0,
    "estimated_duration_mins": 0,
    "assigned_bus_id": "6a9803e9457ae6d3918b7e87",
    "status": "Active",
    "createdAt": "2026-09-02T17:10:24.484Z",
    "updatedAt": "2026-09-02T18:20:15.903Z",
    "__v": 0
  },
  "totalStopsCount": 5,
  "totalStudentsCount": 0,
  "routeStops": [
    {
      "_id": "6a985d073903f1740003d17f",
      "school_id": "6a82b7bc84adbdc3f3c19d20",
      "route_id": "6a9858803903f1740003d176",
      "stop_name": "M.G.R. Koyambedu (C.M.B.T.)",
      "stop_address": "",
      "latitude": 13.0678,
      "longitude": 80.2056,
      "stop_order": 1,
      "estimated_arrival_time": "08:00 AM",
      "createdAt": "2026-09-02T17:29:43.535Z",
      "updatedAt": "2026-09-02T17:29:43.535Z",
      "__v": 0
    }
  ],
  "assignedStudents": [],
  "activeTrip": null
}
```

#### Field-by-Field Description

##### 1. Top-Level Keys
- `driver` (`Object`): Complete authenticated driver profile object populated from the database.
- `assignedBus` (`Object` | `null`): The bus vehicle document assigned to the driver. `null` if no bus is assigned.
- `assignedRoute` (`Object` | `null`): Active route document linked to the assigned bus (`status: 'Active'`). `null` if no active route exists for the assigned bus.
- `totalStopsCount` (`Number`): Integer representing the total count of stops in `routeStops`.
- `totalStudentsCount` (`Number`): Integer representing the total count of active students allocated to the route.
- `routeStops` (`Array<Object>`): Array of ordered route stop objects linked to `assignedRoute`. Ordered ascending by `stop_order`.
- `assignedStudents` (`Array<Object>`): Array of student transport allocation records (`StudentTransport`) populated with student details (`student_id`) and pickup stop details (`pickup_stop_id`). Empty `[]` if no students are assigned.
- `activeTrip` (`Object` | `null`): Current active trip history document if a trip is currently in progress (`status: 'In Progress'` or `'Emergency'`). Returns `null` when no trip is active.

##### 2. `driver` Object Fields
- `_id` (`String`): Unique MongoDB ObjectId of the driver document.
- `school_id` (`String`): ObjectId reference to the associated school.
- `driver_id` (`String`): Driver's unique code identifier (e.g., `"DRV-1788347733584"`).
- `name` (`String`): Driver's full name.
- `mobile_number` (`String`): Driver's primary contact mobile phone number.
- `email` (`String`): Driver's email address.
- `address` (`String`): Driver's residential address.
- `license_number` (`String`): Driver's driving license number.
- `photo` (`String`): URL string pointing to driver's photo image asset.
- `status` (`String`): Driver account status (`"Active"` | `"Inactive"`).
- `assigned_bus_id` (`Object` | `String` | `null`): Populated Bus document assigned to driver (or ObjectId string/null).
- `createdAt` (`String`): ISO 8601 creation timestamp.
- `updatedAt` (`String`): ISO 8601 update timestamp.
- `__v` (`Number`): Mongoose document version key.

> **Security Note**: In compliance with API security best practices, sensitive authentication fields (such as `password` hashes) must not be exposed in API responses or public documentation.

##### 3. `assignedBus` Object Fields
- `_id` (`String`): Unique MongoDB ObjectId of the bus vehicle document.
- `school_id` (`String`): ObjectId reference to the associated school.
- `bus_number` (`String`): Bus designation code (e.g., `"BUS-3"`).
- `vehicle_reg_number` (`String`): Official vehicle registration number (e.g., `"TN01AB7890"`).
- `bus_name` (`String`): Bus display name (e.g., `"no 3"`).
- `bus_type` (`String`): Bus type category (e.g., `"Van"`, `"Bus"`).
- `total_seats` (`Number`): Total seating capacity.
- `gps_enabled` (`Boolean`): Indicates if GPS tracking hardware is enabled.
- `status` (`String`): Operational status of bus (`"Active"` | `"Inactive"`).
- `createdAt` (`String`): ISO 8601 creation timestamp.
- `updatedAt` (`String`): ISO 8601 update timestamp.
- `__v` (`Number`): Mongoose document version key.

##### 4. `assignedRoute` Object Fields
- `_id` (`String`): Unique MongoDB ObjectId of the route document.
- `school_id` (`String`): ObjectId reference to the associated school.
- `route_id` (`String`): Route code identifier (e.g., `"RT-1"`).
- `route_name` (`String`): Route name (e.g., `"tambaram"`).
- `start_point` (`String`): Origin location name.
- `end_point` (`String`): Destination location name.
- `total_distance_km` (`Number`): Total route distance in kilometers.
- `estimated_duration_mins` (`Number`): Total estimated travel time in minutes.
- `assigned_bus_id` (`String`): ObjectId reference to the linked bus.
- `status` (`String`): Route status (`"Active"` | `"Inactive"`).
- `createdAt` (`String`): ISO 8601 creation timestamp.
- `updatedAt` (`String`): ISO 8601 update timestamp.
- `__v` (`Number`): Mongoose document version key.

##### 5. `routeStops` Object Array Fields
- `_id` (`String`): Unique MongoDB ObjectId of the stop document.
- `school_id` (`String`): ObjectId reference to the school.
- `route_id` (`String`): ObjectId reference to the parent route.
- `stop_name` (`String`): Name of the bus stop (e.g., `"M.G.R. Koyambedu (C.M.B.T.)"`).
- `stop_address` (`String`): Detailed address of the stop.
- `latitude` (`Number`): GPS latitude coordinate.
- `longitude` (`Number`): GPS longitude coordinate.
- `stop_order` (`Number`): Numerical sequence order of the stop (1, 2, 3...).
- `estimated_arrival_time` (`String`): Formatted arrival time (e.g., `"08:00 AM"`).
- `createdAt` (`String`): ISO 8601 creation timestamp.
- `updatedAt` (`String`): ISO 8601 update timestamp.
- `__v` (`Number`): Mongoose document version key.

##### 6. `assignedStudents` Array Item Fields (When Populated)
- `_id` (`String`): Unique ObjectId of the student transport allocation.
- `school_id` (`String`): ObjectId reference to school.
- `student_id` (`Object`): Populated student record (`student_name`, `roll_no`, `parent_name`, `parent_phone`, `photo`, `class_id`).
- `admission_number` (`String`): Student's admission number.
- `class_id` (`String`): ObjectId reference to class.
- `route_id` (`String`): ObjectId reference to route.
- `bus_id` (`String`): ObjectId reference to bus.
- `pickup_stop_id` (`Object`): Populated pickup stop object (`stop_name`, `estimated_arrival_time`).
- `drop_stop_id` (`String` | `null`): Drop stop ObjectId reference if configured.
- `status` (`String`): Transport allocation status (`"Active"`).

##### 7. `activeTrip` Object Fields (When Trip Is In Progress)
When a trip is active (`status: 'In Progress'` or `'Emergency'`), `activeTrip` returns:
```json
{
  "_id": "6a9860003903f1740003d190",
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "trip_id": "TRIP-1726934400000",
  "driver_id": "6a980555a181e5ba0c4100f6",
  "bus_id": "6a9803e9457ae6d3918b7e87",
  "route_id": {
    "_id": "6a9858803903f1740003d176",
    "route_name": "tambaram",
    "start_point": "koyambedu",
    "end_point": "tambaram"
  },
  "start_time": "2026-10-01T07:10:00.000Z",
  "end_time": null,
  "status": "In Progress",
  "distance_travelled_km": 4.5,
  "current_latitude": 13.0503,
  "current_longitude": 80.2119,
  "current_speed": 35.0,
  "previous_stop": "M.G.R. Koyambedu (C.M.B.T.)",
  "current_stop": "Vadapalani",
  "next_stop": "Meenambakkam",
  "eta_minutes": 10,
  "arrival_status": "On Time",
  "gps_logs": [],
  "createdAt": "2026-10-01T07:10:00.000Z",
  "updatedAt": "2026-10-01T07:15:00.000Z",
  "__v": 0
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid JWT Bearer token.
  ```json
  {
    "message": "Not authorized, token failed"
  }
  ```
- **403 Forbidden**: Authenticated user role is not `Driver`.
  ```json
  {
    "message": "Not authorized as Driver"
  }
  ```
- **404 Not Found**: Driver profile not found in database for authenticated User ID.
  ```json
  {
    "message": "Driver not found"
  }
  ```
- **500 Internal Server Error**: Database connection or server failure.
  ```json
  {
    "message": "Failed to fetch portal data",
    "error": "Error message details"
  }
  ```

---

### 3.2 Get Assigned Route & Stops
Retrieves detailed information regarding the driver's route and sequenced stops.

- **Method**: `GET`
- **URL**: `/api/driver/route`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
{
  "route": {
    "_id": "650000000000000000000301",
    "route_name": "North Zone Route A",
    "start_point": "Central Bus Depot",
    "end_point": "Green Valley High School",
    "distance_km": 18.5
  },
  "stops": [
    {
      "_id": "650000000000000000000401",
      "stop_name": "Green Park Gate 1",
      "pickup_time": "07:15 AM",
      "drop_time": "03:45 PM",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "stop_order": 1
    }
  ]
}
```

---

### 3.3 Get Allocated Students
Returns all students assigned to the driver's bus route with pickup/drop stops and guardian emergency contact details.

- **Method**: `GET`
- **URL**: `/api/driver/students`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "650000000000000000000601",
    "student_id": {
      "_id": "650000000000000000000701",
      "first_name": "Arjun",
      "last_name": "Sharma",
      "admission_number": "ADM2026001",
      "roll_number": "101",
      "class_id": "10th",
      "section_id": "A"
    },
    "pickup_stop_id": {
      "_id": "650000000000000000000401",
      "stop_name": "Green Park Gate 1",
      "pickup_time": "07:15 AM"
    },
    "guardian_name": "Siva Sharma",
    "guardian_mobile": "9840123456"
  }
]
```

---

## 4. Trip Operations & Live Telemetry APIs

### 4.1 Start Bus Trip
Initiates a new bus trip (`Pickup` or `Drop`) and broadcasts `trip_started` event via Socket.IO.

- **Method**: `POST`
- **URL**: `/api/driver/trip/start`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "trip_type": "Pickup"
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "Trip started successfully",
  "active_trip": {
    "_id": "650000000000000000000501",
    "school_id": "650000000000000000000001",
    "bus_id": "650000000000000000000201",
    "driver_id": "650000000000000000000101",
    "route_id": "650000000000000000000301",
    "trip_id": "TRIP-1726934400000",
    "trip_type": "Pickup",
    "status": "In Progress",
    "start_time": "2026-09-21T07:10:00.000Z",
    "current_stop": "Central Bus Depot",
    "arrival_status": "On-Time"
  }
}
```

---

### 4.2 Pause Bus Trip
Temporarily pauses an active bus trip for rest breaks, refueling, or traffic delays, updating the trip status to `Paused` and emitting `trip_paused` event via Socket.IO.

- **Method**: `POST`
- **URL**: `/api/driver/trip/pause` (or `/api/driver/pause-trip`)
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "reason": "Refueling Stop",
  "notes": "Stopping for fuel refill at Central Gas Station",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Trip paused successfully",
  "trip": {
    "_id": "650000000000000000000501",
    "trip_id": "TRIP-1726934400000",
    "status": "Paused",
    "pause_reason": "Refueling Stop",
    "paused_at": "2026-09-21T07:20:00.000Z",
    "current_latitude": 12.9716,
    "current_longitude": 77.5946
  },
  "notification": {
    "_id": "650000000000000000000905",
    "title": "Bus Trip Paused",
    "message": "Bus BUS-101 trip has been temporarily paused. Reason: Refueling Stop.",
    "type": "TripPaused",
    "recipient_role": "All"
  }
}
```

---

### 4.3 Resume Bus Trip
Resumes a previously paused bus trip, restoring its status to `In Progress` and emitting `trip_resumed` event via Socket.IO.

- **Method**: `POST`
- **URL**: `/api/driver/trip/resume` (or `/api/driver/resume-trip`)
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "notes": "Refueling complete, resuming route"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Trip resumed successfully",
  "trip": {
    "_id": "650000000000000000000501",
    "trip_id": "TRIP-1726934400000",
    "status": "In Progress",
    "resumed_at": "2026-09-21T07:25:00.000Z"
  },
  "notification": {
    "_id": "650000000000000000000906",
    "title": "Bus Trip Resumed",
    "message": "Bus BUS-101 trip has resumed its route.",
    "type": "TripResumed",
    "recipient_role": "All"
  }
}
```

---

### 4.2 Stream GPS Live Location & Telemetry
Streams live GPS coordinates (`latitude`, `longitude`, `speed`), updates active trip trajectory, calculates nearest stop proximity, computes ETA, and broadcasts `bus_location_update` via Socket.IO.

- **Method**: `POST`
- **URL**: `/api/driver/gps/update`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 35.5
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "GPS location updated successfully",
  "locationPayload": {
    "trip_id": "TRIP-1726934400000",
    "bus_id": "650000000000000000000201",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 35.5,
    "current_stop": "Green Park Gate 1",
    "next_stop": "Sunrise Apartments",
    "eta_minutes": 8,
    "arrival_status": "On-Time",
    "timestamp": "2026-09-21T07:15:22.000Z"
  }
}
```

---

### 4.3 Mark Student Boarding / Deboarding
Records when a student boards, drops, or is marked absent during a bus trip and emits real-time `student_boarding_event` to parents.

- **Method**: `POST`
- **URL**: `/api/driver/student/boarding`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "student_id": "650000000000000000000701",
  "action_type": "Boarded",
  "stop_name": "Green Park Gate 1",
  "notes": "Boarded safely with school bag"
}
```

- **Success Response (201 Created)**:
```json
{
  "message": "Student marked as Boarded",
  "log": {
    "_id": "650000000000000000000801",
    "trip_id": "TRIP-1726934400000",
    "bus_id": "650000000000000000000201",
    "driver_id": "650000000000000000000101",
    "student_id": "650000000000000000000701",
    "stop_name": "Green Park Gate 1",
    "action_type": "Boarded",
    "timestamp": "2026-09-21T07:16:00.000Z",
    "notes": "Boarded safely with school bag"
  }
}
```

---

### 4.4 Get Student Boarding History Logs
Fetches all student boarding/deboarding entries recorded during the active trip or date range.

- **Method**: `GET`
- **URL**: `/api/driver/student/boarding-logs`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "650000000000000000000801",
    "trip_id": "TRIP-1726934400000",
    "student_id": {
      "_id": "650000000000000000000701",
      "first_name": "Arjun",
      "last_name": "Sharma",
      "roll_number": "101"
    },
    "stop_name": "Green Park Gate 1",
    "action_type": "Boarded",
    "timestamp": "2026-09-21T07:16:00.000Z",
    "notes": "Boarded safely with school bag"
  }
]
```

---

### 4.5 End Bus Trip
Completes the current bus trip, calculates total distance travelled in KM based on GPS logs, updates trip status to `Completed`, and notifies parents/admin.

- **Method**: `POST`
- **URL**: `/api/driver/trip/end`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
{
  "message": "Trip completed safely",
  "trip": {
    "_id": "650000000000000000000501",
    "trip_id": "TRIP-1726934400000",
    "status": "Completed",
    "start_time": "2026-09-21T07:10:00.000Z",
    "end_time": "2026-09-21T07:55:00.000Z",
    "distance_travelled_km": 17.8
  }
}
```

---

### 4.6 Get Driver Trip History
Retrieves past completed bus trips driven by the authenticated staff member.

- **Method**: `GET`
- **URL**: `/api/driver/trip-history`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "650000000000000000000501",
    "trip_id": "TRIP-1726934400000",
    "trip_type": "Pickup",
    "status": "Completed",
    "start_time": "2026-09-21T07:10:00.000Z",
    "end_time": "2026-09-21T07:55:00.000Z",
    "distance_travelled_km": 17.8,
    "bus_id": {
      "bus_number": "BUS-101",
      "bus_name": "Yellow Express 101"
    },
    "route_id": {
      "route_name": "North Zone Route A",
      "start_point": "Central Bus Depot",
      "end_point": "Green Valley High School"
    }
  }
]
```

---

## 5. Emergency SOS & Alert Operations

### 5.1 Trigger Emergency SOS Alert
Triggers an immediate high-priority SOS emergency alert broadcast (Accident, Mechanical Breakdown, Medical Emergency) to parents, transport managers, and school administrators.

- **Method**: `POST`
- **URL**: `/api/driver/emergency/alert`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "alert_type": "Traffic Breakdown",
  "description": "Engine overheating near Sector 4 intersection",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "Emergency SOS alert triggered successfully",
  "notification": {
    "_id": "650000000000000000000901",
    "title": "EMERGENCY SOS: Traffic Breakdown",
    "message": "EMERGENCY ALERT on Bus BUS-101: Engine overheating near Sector 4 intersection. Location: (12.9716, 77.5946)",
    "type": "Emergency",
    "recipient_role": "All",
    "createdAt": "2026-09-21T07:30:00.000Z"
  }
}
```

---

### 5.2 Report Traffic or Breakdown Delay
Informs parents and administrators of unexpected route delays along with estimated extra delay minutes.

- **Method**: `POST`
- **URL**: `/api/driver/trip/delay`
- **Access**: Private (Driver)
- **Request Payload**:
```json
{
  "delay_minutes": 15,
  "reason": "Heavy traffic jam at Central Flyover"
}
```

- **Success Response (200 OK)**:
```json
{
  "message": "Delay reported successfully",
  "trip": {
    "_id": "650000000000000000000501",
    "arrival_status": "Delayed",
    "eta_minutes": 25
  },
  "notification": {
    "_id": "650000000000000000000902",
    "title": "Bus Delay Alert",
    "message": "Bus BUS-101 is delayed by approx 15 mins. Reason: Heavy traffic jam at Central Flyover.",
    "type": "Delayed",
    "recipient_role": "All"
  }
}
```

---

### 5.3 Get Transport Notifications
Lists recent transport notifications generated for the driver's bus.

- **Method**: `GET`
- **URL**: `/api/driver/notifications`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "650000000000000000000902",
    "title": "Bus Delay Alert",
    "message": "Bus BUS-101 is delayed by approx 15 mins. Reason: Heavy traffic jam at Central Flyover.",
    "type": "Delayed",
    "createdAt": "2026-09-21T07:31:00.000Z"
  }
]
```

---

## 6. Real-Time Socket.IO Streaming Events

The backend emits real-time events over Socket.IO for live tracking dashboards and instant app notifications:

| Event Name | Trigger API / Action | Payload Structure |
| :--- | :--- | :--- |
| `trip_started` | `POST /api/driver/trip/start` | `{ trip_id, bus_id, trip_type, start_time }` |
| `trip_paused` | `POST /api/driver/trip/pause` | `{ trip_id, bus_id, bus_number, reason, latitude, longitude, timestamp }` |
| `trip_resumed` | `POST /api/driver/trip/resume` | `{ trip_id, bus_id, bus_number, timestamp }` |
| `bus_location_update` | `POST /api/driver/gps/update` | `{ trip_id, bus_id, latitude, longitude, speed, current_stop, next_stop, eta_minutes }` |
| `student_boarding_event` | `POST /api/driver/student/boarding` | `{ student_id, student_name, action_type, stop_name, timestamp }` |
| `emergency_alert` | `POST /api/driver/emergency/alert` | `{ alert_type, description, latitude, longitude, bus_number, timestamp }` |
| `bus_delay_alert` | `POST /api/driver/trip/delay` | `{ title, message, delay_minutes, reason }` |
| `trip_ended` | `POST /api/driver/trip/end` | `{ trip_id, distance_travelled_km, end_time }` |

---

## 7. Security & Authorization Guardrails

1. **Role Enforcement**: Every operational driver route strictly validates `req.user.role === 'Driver'` via `protect` and `authorize('Driver')` middlewares.
2. **Account Status Control**: Inactive driver accounts are rejected at login with HTTP 403 Forbidden.
3. **Double Hash Prevention**: Passwords are saved cleanly with Mongoose `pre('save')` bcrypt hooks without manual pre-hashing.
4. **Data Isolation**: Drivers can only view and update trips, locations, notifications, and student lists linked directly to their assigned vehicle (`assigned_bus_id`).

---

## Changes Added To Existing Documentation

### API: POST /api/driver/trip/pause
- **Existing Fields:** None (Newly created endpoint)
- **Newly Added Parameters (Optional):** `bus_id`, `trip_id`, `reason`, `latitude`, `longitude`, `notes`
- **Newly Added Response Fields:** `success`, `message`, `trip`, `notification`, `timestamp`, `requestId`
- **Newly Added Validations:** Active trip verification & reason validation; status set to `Paused`.
- **Newly Added Error Responses:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

### API: POST /api/driver/trip/resume
- **Existing Fields:** None (Newly created endpoint)
- **Newly Added Parameters (Optional):** `bus_id`, `trip_id`, `notes`
- **Newly Added Response Fields:** `success`, `message`, `trip`, `notification`, `timestamp`, `requestId`
- **Newly Added Validations:** Paused trip verification; status restored to `In Progress`.

### API: POST /api/driver/auth/login
- **Existing Fields:** `mobile_number`, `password`
- **Newly Added Parameters (Optional):** `phone`, `mobile`, `email`, `driver_id`, `identifier`
- **Newly Added Response Fields:** `accessToken`, `refreshToken`, `user`, `timestamp`, `requestId`
- **Newly Added Validations:** Input normalization across phone/email keys; account status check (`Active`).
- **Newly Added Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

### API: GET /api/driver/profile
- **Existing Fields:** None (Query params)
- **Newly Added Response Fields:** `user`, `timestamp`, `requestId`
- **Newly Added Permissions:** `Driver` role authorization.

### API: GET /api/driver/trip/history
- **Existing Query Parameters:** None
- **Newly Added Query Parameters:** `page`, `limit`, `search`, `sortBy`, `sortOrder`
- **Newly Added Response Fields:** `pagination` object (`{ page, limit, totalRecords, totalPages }`), `timestamp`, `requestId`

### API: GET /api/driver/notifications
- **Existing Query Parameters:** None
- **Newly Added Query Parameters:** `page`, `limit`, `search`, `sortBy`, `sortOrder`
- **Newly Added Response Fields:** `pagination` object (`{ page, limit, totalRecords, totalPages }`), `timestamp`, `requestId`

