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

## 1. Driver Authentication APIs (OTP Based)

### 1.1 Send Driver OTP
Generates a random 6-digit OTP for active drivers assigned to a school and bus.

- **Method**: `POST`
- **URL**: `/api/driver/send-otp`
- **Access**: Public
- **Request Payload**:
```json
{
  "mobile": "9876543210"
}
```

- **Success Response (200 OK - Development Mode)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "483921"
}
```

- **Success Response (200 OK - Production Mode)**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### 1.2 Verify Driver OTP
Verifies the 6-digit OTP and generates a JWT Bearer token upon successful validation.

- **Method**: `POST`
- **URL**: `/api/driver/verify-otp`
- **Access**: Public
- **Request Payload**:
```json
{
  "mobile": "9876543210",
  "otp": "483921"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "650000000000000000000101",
    "name": "Rajesh Kumar",
    "mobile": "9876543210",
    "busId": "650000000000000000000201",
    "schoolId": "650000000000000000000001"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "message": "Mobile number and OTP are required"}`
  - `404 Not Found`: `{"success": false, "message": "Driver not found"}`
  - `403 Forbidden`: `{"success": false, "message": "Driver account is inactive. Please contact School Administration."}`
  - `429 Too Many Requests`: `{"success": false, "message": "Account is locked due to 5 failed attempts. Please try again after 15 minutes."}`

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
Fetches complete operational dashboard data including assigned vehicle, route stops, active trip status, total allocated students, and total route distance.

- **Method**: `GET`
- **URL**: `/api/driver/portal`
- **Access**: Private (Driver)
- **Success Response (200 OK)**:
```json
{
  "driver": {
    "id": "650000000000000000000101",
    "name": "Rajesh Kumar",
    "driver_id": "DRV001",
    "mobile_number": "9876543210"
  },
  "bus": {
    "_id": "650000000000000000000201",
    "bus_number": "BUS-101",
    "bus_name": "Yellow Express 101",
    "registration_number": "KA-01-EQ-9999",
    "capacity": 40
  },
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
      "stop_order": 1
    },
    {
      "_id": "650000000000000000000402",
      "stop_name": "Sunrise Apartments",
      "pickup_time": "07:30 AM",
      "drop_time": "03:30 PM",
      "stop_order": 2
    }
  ],
  "allocated_students_count": 28,
  "active_trip": {
    "_id": "650000000000000000000501",
    "trip_id": "TRIP-1726934400000",
    "trip_type": "Pickup",
    "status": "In Progress",
    "start_time": "2026-09-21T07:10:00.000Z",
    "current_stop": "Green Park Gate 1",
    "arrival_status": "On-Time"
  }
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
