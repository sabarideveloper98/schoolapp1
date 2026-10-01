# Driver & Staff API Documentation

This document serves as the single source of truth for all **Driver** and **Staff** APIs in the School Management System. All endpoints, parameters, request payloads, response structures, data types, and error responses documented herein are derived directly from the active backend implementation and verified against live API responses.

---

## Table of Contents

1. [Authentication & Global Headers](#1-authentication--global-headers)
2. [Driver Operational APIs](#2-driver-operational-apis)
   - [2.1 Driver Dedicated Login](#21-driver-dedicated-login)
   - [2.2 Get Driver Profile](#22-get-driver-profile)
   - [2.3 Update Driver Profile](#23-update-driver-profile)
   - [2.4 Change Driver Password](#24-change-driver-password)
   - [2.5 Get Driver Portal Summary](#25-get-driver-portal-summary)
   - [2.6 Get Driver Route Details & Stops](#26-get-driver-route-details--stops)
   - [2.7 Get Driver Assigned Students List](#27-get-driver-assigned-students-list)
   - [2.8 Start Trip](#28-start-trip)
   - [2.9 Pause Active Trip](#29-pause-active-trip)
   - [2.10 Resume Paused Trip](#210-resume-paused-trip)
   - [2.11 Update GPS Location](#211-update-gps-location)
   - [2.12 Mark Student Boarding / Drop Status](#212-mark-student-boarding--drop-status)
   - [2.13 Get Student Boarding Logs](#213-get-student-boarding-logs)
   - [2.14 Trigger Emergency Alert](#214-trigger-emergency-alert)
   - [2.15 Report Trip Delay](#215-report-trip-delay)
   - [2.16 End Active Trip](#216-end-active-trip)
   - [2.17 Get Driver Notifications](#217-get-driver-notifications)
   - [2.18 Get Driver Trip History](#218-get-driver-trip-history)
3. [Driver Management & Allocation APIs (Admin)](#3-driver-management--allocation-apis-admin)
   - [3.1 Get All Drivers List](#31-get-all-drivers-list)
   - [3.2 Create Driver Profile](#32-create-driver-profile)
   - [3.3 Update Driver Profile](#33-update-driver-profile)
   - [3.4 Delete Driver Profile](#34-delete-driver-profile)
   - [3.5 Assign Driver to Bus](#35-assign-driver-to-bus)
   - [3.6 Unassign Driver from Bus](#36-unassign-driver-from-bus)
4. [Staff Management & Operational APIs (Admin)](#4-staff-management--operational-apis-admin)
   - [4.1 Get Staff List](#41-get-staff-list)
   - [4.2 Create New Staff Member](#42-create-new-staff-member)
   - [4.3 Update Staff Profile](#43-update-staff-profile)
   - [4.4 Delete Staff Member](#44-delete-staff-member)
   - [4.5 Get Staff / Teacher Attendance List](#45-get-staff--teacher-attendance-list)
   - [4.6 Save Staff / Teacher Attendance Records](#46-save-staff--teacher-attendance-records)
   - [4.7 Get Staff / Teacher Attendance Report](#47-get-staff--teacher-attendance-report)
5. [Security Notes & Implementation Issues](#5-security-notes--implementation-issues)

---

## 1. Authentication & Global Headers

All operational Driver endpoints under `/api/driver/*` require JWT Bearer Token authorization with `Driver` role privileges.  
Admin Driver and Staff endpoints under `/api/transport/*` and `/api/schooladmin/*` require JWT Bearer Token authorization with `SchoolAdmin` role privileges.

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## 2. Driver Operational APIs

### 2.1 Driver Dedicated Login

Authenticates a driver using mobile number, email, or driver ID along with password, returning JWT access and refresh tokens.

- **Endpoint**: `POST /api/driver/auth/login` (Also available at `POST /api/transport/driver/login`)
- **Access**: Public
- **Authentication**: None
- **Request Headers**:
  ```http
  Content-Type: application/json
  ```
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "driver_id": "DRV-1788347733584",
    "password": "123456"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contactInput` (`mobile_number` / `phone` / `email` / `driver_id` / `identifier`) | String | Yes | Driver contact credential (mobile, email, or driver ID). |
| `password` | String | Yes | Plaintext driver password. |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Driver login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "_id": "6a980555a181e5ba0c4100f6",
    "driver_id": "DRV-1788347733584",
    "name": "Ravi Kumar",
    "mobile_number": "9886164085",
    "email": "ravi.driver@school.com",
    "status": "Active",
    "assigned_bus_id": "6a9803e9457ae6d3918b7e87"
  }
}
```

#### Response Fields
| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `success` | Boolean | No | Indicates successful login (`true`). |
| `message` | String | No | Status message (`"Driver login successful"`). |
| `token` / `accessToken` | String | No | JWT Bearer access token valid for 30 days. |
| `refreshToken` | String | No | Refresh token valid for 90 days. |
| `driver._id` | String | No | MongoDB ObjectId string of the driver. |
| `driver.driver_id` | String | No | Unique driver registration code. |
| `driver.name` | String | No | Full name of the driver. |
| `driver.mobile_number` | String | No | Contact phone number. |
| `driver.email` | String | Yes | Optional email address. |
| `driver.status` | String | No | Account status (`"Active"` | `"Inactive"`). |
| `driver.assigned_bus_id` | Object / String | Yes | Populated or reference ID of assigned bus. |

#### Error Responses
- **400 Bad Request**:
  ```json
  {
    "message": "Mobile number/email and password are required"
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "message": "Invalid mobile number/email or password"
  }
  ```
- **403 Forbidden**:
  ```json
  {
    "message": "Driver account is inactive. Please contact School Administration."
  }
  ```

---

### 2.2 Get Driver Profile

Retrieves profile details for the authenticated driver.

- **Endpoint**: `GET /api/driver/profile`
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Headers**:
  ```http
  Authorization: Bearer <driver_token>
  Content-Type: application/json
  ```
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**: No request body required.

#### Success Response (200 OK)
```json
{
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
    "bus_number": "BUS-3",
    "vehicle_reg_number": "TN01AB7890",
    "bus_name": "no 3",
    "total_seats": 40
  },
  "createdAt": "2026-09-02T11:15:33.594Z",
  "updatedAt": "2026-09-29T10:50:54.023Z",
  "__v": 0
}
```

#### Error Responses
- **404 Not Found**:
  ```json
  {
    "message": "Driver profile not found"
  }
  ```

---

### 2.3 Update Driver Profile

Updates editable profile fields (`email`, `address`, `photo`, `mobile_number`).

- **Endpoint**: `PUT /api/driver/profile`
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Headers**:
  ```http
  Authorization: Bearer <driver_token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "ravi.updated@school.com",
    "address": "456 Park Avenue",
    "photo": "https://example.com/photos/ravi.jpg",
    "mobile_number": "9886164085"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | No | Updated email address. |
| `address` | String | No | Updated address string. |
| `photo` | String | No | Updated photo image URL. |
| `mobile_number` | String | No | Updated contact phone number. |

#### Success Response (200 OK)
```json
{
  "message": "Driver profile updated successfully",
  "driver": {
    "_id": "6a980555a181e5ba0c4100f6",
    "name": "Ravi Kumar",
    "email": "ravi.updated@school.com",
    "address": "456 Park Avenue",
    "photo": "https://example.com/photos/ravi.jpg"
  }
}
```

---

### 2.4 Change Driver Password

Allows the authenticated driver to change their account password.

- **Endpoint**: `PUT /api/driver/change-password`
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Body**:
  ```json
  {
    "old_password": "123456",
    "new_password": "newpassword123"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `old_password` | String | Yes | Existing plaintext password. |
| `new_password` | String | Yes | New password to set. |

#### Success Response (200 OK)
```json
{
  "message": "Password changed successfully"
}
```

#### Error Responses
- **400 Bad Request**:
  ```json
  {
    "message": "Incorrect old password"
  }
  ```

---

### 2.5 Get Driver Portal Summary

Retrieves operational dashboard summary including assigned driver, vehicle (`assignedBus`), route (`assignedRoute`), sequenced stops (`routeStops`), counts, allocated students (`assignedStudents`), and active trip (`activeTrip`).

- **Endpoint**: `GET /api/driver/portal` (Also available at `GET /api/transport/driver/portal-data`)
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Body**: No request body required.

#### Success Response (200 OK)
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
      "bus_number": "BUS-3",
      "vehicle_reg_number": "TN01AB7890",
      "bus_name": "no 3",
      "total_seats": 40
    }
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
    "status": "Active"
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
    "status": "Active"
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
      "estimated_arrival_time": "08:00 AM"
    }
  ],
  "assignedStudents": [],
  "activeTrip": null
}
```

#### Response Fields
| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `driver` | Object | No | Complete driver profile document. |
| `assignedBus` | Object | Yes | Bus details document. `null` if no bus assigned. |
| `assignedRoute` | Object | Yes | Active route document. `null` if no active route exists. |
| `totalStopsCount` | Number | No | Total count of route stops. |
| `totalStudentsCount` | Number | No | Total count of assigned students. |
| `routeStops` | Array<Object> | No | Sequenced array of route stops. |
| `assignedStudents` | Array<Object> | No | Array of allocated student transport objects. |
| `activeTrip` | Object | Yes | Active `TripHistory` document if trip in progress, else `null`. |

---

### 2.6 Get Driver Route Details & Stops

Retrieves the active route and ordered stops linked to the driver's assigned bus.

- **Endpoint**: `GET /api/driver/route`
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Body**: No request body required.

#### Success Response (200 OK)
```json
{
  "route": {
    "_id": "6a9858803903f1740003d176",
    "route_name": "tambaram",
    "start_point": "koyambedu",
    "end_point": "tambaram",
    "total_distance_km": 0,
    "assigned_bus_id": {
      "_id": "6a9803e9457ae6d3918b7e87",
      "bus_number": "BUS-3"
    }
  },
  "stops": [
    {
      "_id": "6a985d073903f1740003d17f",
      "stop_name": "M.G.R. Koyambedu (C.M.B.T.)",
      "stop_order": 1,
      "estimated_arrival_time": "08:00 AM"
    }
  ]
}
```

---

### 2.7 Get Driver Assigned Students List

Retrieves active student transport allocations for the driver's route.

- **Endpoint**: `GET /api/driver/students`
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a9861113903f1740003d1a2",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "student_id": {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind kumar",
      "roll_no": "101",
      "parent_name": "siva",
      "parent_phone": "67890765444"
    },
    "admission_number": "STDCLASS1SECB158E80",
    "class_id": "6a840119ef78578a90316739",
    "pickup_stop_id": {
      "_id": "6a985d073903f1740003d17f",
      "stop_name": "M.G.R. Koyambedu (C.M.B.T.)",
      "estimated_arrival_time": "08:00 AM"
    },
    "status": "Active"
  }
]
```

---

### 2.8 Start Trip

Starts a new bus trip (`Pickup` or `Drop`) for the driver's assigned route.

- **Endpoint**: `POST /api/driver/trip/start` (Also available at `POST /api/transport/driver/start-trip`)
- **Access**: Private (Driver)
- **Authentication**: `Authorization: Bearer <driver_token>`
- **Request Body**:
  ```json
  {
    "route_id": "6a9858803903f1740003d176",
    "bus_id": "6a9803e9457ae6d3918b7e87"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `route_id` | String | No (Auto-resolved if omitted) | ObjectId of active route. |
| `bus_id` | String | No (Auto-resolved if omitted) | ObjectId of assigned bus. |

#### Success Response (201 Created)
```json
{
  "message": "Trip started successfully",
  "trip": {
    "_id": "6abd6890a3dfbfc4d5449c30",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "trip_id": "TRIP-1790784144000",
    "driver_id": "6a980555a181e5ba0c4100f6",
    "bus_id": "6a9803e9457ae6d3918b7e87",
    "route_id": "6a9858803903f1740003d176",
    "start_time": "2026-10-01T07:15:44.000Z",
    "status": "In Progress",
    "current_stop": "M.G.R. Koyambedu (C.M.B.T.)",
    "arrival_status": "On Time"
  }
}
```

---

### 2.9 Pause Active Trip

Temporarily pauses an active trip.

- **Endpoint**: `POST /api/driver/trip/pause` (Also available at `POST /api/driver/pause-trip`)
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "reason": "Traffic Delay / Fuel Stop"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Trip paused successfully",
  "trip": {
    "_id": "6abd6890a3dfbfc4d5449c30",
    "status": "Paused"
  }
}
```

---

### 2.10 Resume Paused Trip

Resumes a previously paused trip back to `In Progress` status.

- **Endpoint**: `POST /api/driver/trip/resume` (Also available at `POST /api/driver/resume-trip`)
- **Access**: Private (Driver)
- **Request Body**: No request body required.

#### Success Response (200 OK)
```json
{
  "message": "Trip resumed successfully",
  "trip": {
    "_id": "6abd6890a3dfbfc4d5449c30",
    "status": "In Progress"
  }
}
```

---

### 2.11 Update GPS Location

Streams live GPS coordinates, speed, and current stop data for the active trip.

- **Endpoint**: `POST /api/driver/gps/update` (Also available at `POST /api/transport/driver/update-location`)
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "latitude": 13.0678,
    "longitude": 80.2056,
    "speed": 35.5,
    "current_stop": "Vadapalani",
    "next_stop": "Meenambakkam"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `latitude` | Number | Yes | Current GPS latitude. |
| `longitude` | Number | Yes | Current GPS longitude. |
| `speed` | Number | No | Vehicle speed in km/h. |
| `current_stop` | String | No | Name of current stop reached. |

#### Success Response (200 OK)
```json
{
  "message": "Location updated successfully"
}
```

---

### 2.12 Mark Student Boarding / Drop Status

Marks student boarding or drop-off status at a stop during a trip.

- **Endpoint**: `POST /api/driver/student/boarding`
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "student_id": "6a84052b93171b71e3158e80",
    "stop_id": "6a985d073903f1740003d17f",
    "status": "Boarded",
    "remarks": "On time at Koyambedu stop"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `student_id` | String | Yes | MongoDB ObjectId of student. |
| `stop_id` | String | Yes | MongoDB ObjectId of route stop. |
| `status` | String | Yes | Status (`"Boarded"` | `"Dropped"` | `"Absent"`). |

#### Success Response (200 OK)
```json
{
  "message": "Student boarding log recorded successfully",
  "log": {
    "_id": "6abd6900a3dfbfc4d5449c32",
    "student_id": "6a84052b93171b71e3158e80",
    "status": "Boarded",
    "timestamp": "2026-10-01T07:20:00.000Z"
  }
}
```

---

### 2.13 Get Student Boarding Logs

Retrieves student boarding logs for the active trip or date.

- **Endpoint**: `GET /api/driver/student/boarding-logs`
- **Access**: Private (Driver)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6abd6900a3dfbfc4d5449c32",
    "student_id": {
      "_id": "6a84052b93171b71e3158e80",
      "student_name": "arvind kumar"
    },
    "status": "Boarded",
    "timestamp": "2026-10-01T07:20:00.000Z"
  }
]
```

---

### 2.14 Trigger Emergency Alert

Triggers an emergency SOS broadcast to school administration and parents.

- **Endpoint**: `POST /api/driver/emergency/alert` (Also available at `POST /api/transport/driver/emergency`)
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "message": "Engine breakdown near Vadapalani junction",
    "latitude": 13.0503,
    "longitude": 80.2119
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Emergency alert triggered successfully"
}
```

---

### 2.15 Report Trip Delay

Reports a trip delay notification specifying minutes and reason.

- **Endpoint**: `POST /api/driver/trip/delay`
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "delay_minutes": 15,
    "reason": "Heavy rain and traffic jam"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Delay reported successfully"
}
```

---

### 2.16 End Active Trip

Completes the active trip and records total distance travelled.

- **Endpoint**: `POST /api/driver/trip/end` (Also available at `POST /api/transport/driver/end-trip`)
- **Access**: Private (Driver)
- **Request Body**:
  ```json
  {
    "distance_travelled_km": 18.5
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Trip completed successfully",
  "trip": {
    "_id": "6abd6890a3dfbfc4d5449c30",
    "status": "Completed",
    "end_time": "2026-10-01T08:00:00.000Z",
    "distance_travelled_km": 18.5
  }
}
```

---

### 2.17 Get Driver Notifications

Retrieves notifications broadcast to drivers.

- **Endpoint**: `GET /api/driver/notifications`
- **Access**: Private (Driver)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6a9865003903f1740003d1b0",
    "title": "Route Change Notice",
    "message": "Road work on Koyambedu flyover. Take alternate bypass.",
    "createdAt": "2026-10-01T06:00:00.000Z"
  }
]
```

---

### 2.18 Get Driver Trip History

Retrieves historical completed trips for the authenticated driver.

- **Endpoint**: `GET /api/driver/trip-history`
- **Access**: Private (Driver)

#### Success Response (200 OK)
```json
[
  {
    "_id": "6abd6890a3dfbfc4d5449c30",
    "trip_id": "TRIP-1790784144000",
    "status": "Completed",
    "start_time": "2026-10-01T07:15:44.000Z",
    "end_time": "2026-10-01T08:00:00.000Z",
    "distance_travelled_km": 18.5
  }
]
```

---

## 3. Driver Management & Allocation APIs (Admin)

### 3.1 Get All Drivers List

Retrieves all driver records configured for the school.

- **Endpoint**: `GET /api/transport/drivers`
- **Access**: Private (SchoolAdmin)
- **Authentication**: `Authorization: Bearer <admin_token>`

#### Success Response (200 OK)
```json
[
  {
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
    "assigned_bus_id": "6a9803e9457ae6d3918b7e87"
  }
]
```

---

### 3.2 Create Driver Profile

Creates a new driver profile record.

- **Endpoint**: `POST /api/transport/drivers`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Suresh Raina",
    "mobile_number": "9876543210",
    "email": "suresh.driver@school.com",
    "address": "789 Park Street",
    "license_number": "DL-IND-99887",
    "password": "123"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Driver full name. |
| `mobile_number` | String | Yes | Driver mobile number. |
| `license_number` | String | Yes | Driving license number. |
| `password` | String | Yes | Initial login password. |

#### Success Response (201 Created)
```json
{
  "message": "Driver created successfully",
  "driver": {
    "_id": "6abd6a10a3dfbfc4d5449c40",
    "driver_id": "DRV-1790784200000",
    "name": "Suresh Raina",
    "mobile_number": "9876543210",
    "license_number": "DL-IND-99887",
    "status": "Active"
  }
}
```

---

### 3.3 Update Driver Profile

Updates an existing driver record.

- **Endpoint**: `PUT /api/transport/drivers/:id`
- **Access**: Private (SchoolAdmin)

---

### 3.4 Delete Driver Profile

Deletes a driver record.

- **Endpoint**: `DELETE /api/transport/drivers/:id`
- **Access**: Private (SchoolAdmin)

---

### 3.5 Assign Driver to Bus

Assigns a driver to a bus vehicle.

- **Endpoint**: `POST /api/transport/assign-driver`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "driver_id": "6a980555a181e5ba0c4100f6",
    "bus_id": "6a9803e9457ae6d3918b7e87"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Driver assigned to bus successfully"
}
```

---

### 3.6 Unassign Driver from Bus

Unassigns a driver from their assigned bus vehicle.

- **Endpoint**: `POST /api/transport/unassign-driver`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "driver_id": "6a980555a181e5ba0c4100f6"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Driver unassigned successfully"
}
```

---

## 4. Staff Management & Operational APIs (Admin)

### 4.1 Get Staff List

Retrieves complete list of staff members for the school.

- **Endpoint**: `GET /api/schooladmin/staff`
- **Access**: Private (SchoolAdmin)
- **Authentication**: `Authorization: Bearer <admin_token>`

#### Success Response (200 OK)
```json
[
  {
    "_id": "6ab21fc3c5ca856a445592fc",
    "id": "6ab21fc3c5ca856a445592fc",
    "name": "Sundar Staff",
    "email": "sundar@school.com",
    "phone": "9876543210",
    "role": "Office Staff",
    "address": "123 Main Road",
    "qualification": "B.Com",
    "experience": 4,
    "photo": null,
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "user_id": "6ab21fc3c5ca856a445592fb",
    "createdAt": "2026-09-22T06:27:15.000Z",
    "updatedAt": "2026-09-22T06:27:15.000Z",
    "__v": 0
  }
]
```

---

### 4.2 Create New Staff Member

Creates a staff member profile along with a corresponding User login account.

- **Endpoint**: `POST /api/schooladmin/staff`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Kavitha",
    "email": "kavitha.staff@school.com",
    "phone": "9876123456",
    "role": "Office Staff",
    "address": "789 Station Road",
    "qualification": "M.Com",
    "experience": 3,
    "password": "StaffPassword@123"
  }
  ```

#### Required Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Mandatory login email address. |
| `name` | String | No | Staff member name. |
| `phone` | String | No | Staff contact phone number. |
| `role` | String | No | Staff role title (e.g. `"Office Staff"`, `"Driver"`). Defaults to `"Office Staff"`. |

#### Success Response (201 Created)
```json
{
  "message": "Staff created",
  "staff": {
    "_id": "6abd6b00a3dfbfc4d5449c50",
    "name": "Kavitha",
    "email": "kavitha.staff@school.com",
    "phone": "9876123456",
    "role": "Office Staff",
    "address": "789 Station Road",
    "qualification": "M.Com",
    "experience": 3,
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "user_id": "6abd6b00a3dfbfc4d5449c4f"
  }
}
```

---

### 4.3 Update Staff Profile

Updates staff profile and linked User login account details.

- **Endpoint**: `PUT /api/schooladmin/staff/:id`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "name": "Kavitha Raman",
    "phone": "9876123456",
    "address": "800 Station Road",
    "experience": 4
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Staff updated successfully",
  "staff": {
    "_id": "6abd6b00a3dfbfc4d5449c50",
    "name": "Kavitha Raman",
    "email": "kavitha.staff@school.com",
    "phone": "9876123456",
    "experience": 4
  }
}
```

---

### 4.4 Delete Staff Member

Deletes staff profile and associated User login record.

- **Endpoint**: `DELETE /api/schooladmin/staff/:id`
- **Access**: Private (SchoolAdmin)

#### Success Response (200 OK)
```json
{
  "message": "Staff removed"
}
```

---

### 4.5 Get Staff / Teacher Attendance List

Retrieves staff or teacher attendance records for a specified role and date.

- **Endpoint**: `GET /api/schooladmin/attendance?role=Staff&date=2026-10-01`
- **Access**: Private (SchoolAdmin)
- **Query Parameters**:
  - `role` (Required): `"Staff"` | `"Teacher"`
  - `date` (Required): Date string (`"YYYY-MM-DD"`)

#### Success Response (200 OK)
```json
{
  "school_id": "6a82b7bc84adbdc3f3c19d20",
  "date": "2026-10-01T00:00:00.000Z",
  "role_filter": "Staff",
  "records": [
    {
      "user_id": "6ab21fc3c5ca856a445592fb",
      "name": "Sundar Staff",
      "role": "Staff",
      "status": "Present",
      "in_time": "09:00 AM",
      "out_time": "05:00 PM"
    }
  ],
  "notify_via": "Do not send"
}
```

---

### 4.6 Save Staff / Teacher Attendance Records

Saves or updates staff/teacher attendance for a specific date and role.

- **Endpoint**: `POST /api/schooladmin/attendance`
- **Access**: Private (SchoolAdmin)
- **Request Body**:
  ```json
  {
    "role": "Staff",
    "date": "2026-10-01",
    "records": [
      {
        "user_id": "6ab21fc3c5ca856a445592fb",
        "name": "Sundar Staff",
        "role": "Staff",
        "status": "Present",
        "in_time": "09:00 AM",
        "out_time": "05:00 PM"
      }
    ],
    "notify_via": "Do not send"
  }
  ```

#### Success Response (200 OK)
```json
{
  "message": "Attendance saved successfully",
  "attendance": {
    "_id": "6abd6c00a3dfbfc4d5449c60",
    "school_id": "6a82b7bc84adbdc3f3c19d20",
    "date": "2026-10-01T00:00:00.000Z",
    "role_filter": "Staff",
    "records": [
      {
        "user_id": "6ab21fc3c5ca856a445592fb",
        "name": "Sundar Staff",
        "role": "Staff",
        "status": "Present",
        "in_time": "09:00 AM",
        "out_time": "05:00 PM"
      }
    ]
  }
}
```

---

### 4.7 Get Staff / Teacher Attendance Report

Retrieves attendance report aggregated monthly, weekly, or by individual staff member.

- **Endpoint**: `GET /api/schooladmin/attendance/report?role=Staff&month=10&year=2026`
- **Access**: Private (SchoolAdmin)
- **Query Parameters**:
  - `role` (Required): `"Staff"` | `"Teacher"`
  - `month` (Optional): Month number (1 - 12)
  - `year` (Optional): Year string / number
  - `week_start` (Optional): Week start date string (`"YYYY-MM-DD"`)

#### Success Response (200 OK)
```json
{
  "summary": {
    "totalDays": 1,
    "presentCount": 1,
    "absentCount": 0
  },
  "attendanceDocs": [
    {
      "_id": "6abd6c00a3dfbfc4d5449c60",
      "date": "2026-10-01T00:00:00.000Z",
      "role_filter": "Staff",
      "records": [
        {
          "name": "Sundar Staff",
          "status": "Present"
        }
      ]
    }
  ]
}
```

---

## 5. Security Notes & Implementation Issues

### Security Findings
1. **Driver Password Hash Exposure**:  
   In `driverStaffController.js` (`getDriverPortalData`), `Driver.findById()` is executed without `.select('-password')`. As a result, the bcrypt password hash is included in `driver.password` in database output.  
   *Recommendation*: Apply `.select('-password')` when fetching driver objects to ensure password hashes are not returned in public API payloads.

2. **Sanitized Payload Documentation**:  
   Per API documentation standards, all password hashes and plaintext credentials in sample responses in this document are sanitized/redacted (`"[REDACTED]"`).

---
