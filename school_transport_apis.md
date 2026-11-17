

## 19. Section 1: School Admin – Transport Management APIs

This section documents all backend APIs for **Transport Management** in the School Admin portal. All routes are mounted at `/api/school-admin/transport/*` and `/api/transport/*`. They enforce multi-tenant isolation via the authenticated school ID (`school_id`).

### API Audit & Inventory Summary

| Functional Area | API Requirement | Existing / Newly Created | Route Endpoint | HTTP Method |
| :--- | :--- | :--- | :--- | :--- |
| **A. Transport Routes** | Get Transport Routes | Existing (Enhanced Envelope) | `/api/school-admin/transport/routes` | `GET` |
| | Get Route Details by ID | Newly Created | `/api/school-admin/transport/routes/:id` | `GET` |
| | Create Transport Route | Existing | `/api/school-admin/transport/routes` | `POST` |
| | Update Transport Route | Existing | `/api/school-admin/transport/routes/:id` | `PUT` |
| | Delete Transport Route | Existing | `/api/school-admin/transport/routes/:id` | `DELETE` |
| **B. Vehicle Management** | Get Vehicle List | Existing (Enhanced Envelope) | `/api/school-admin/transport/vehicles` | `GET` |
| | Get Vehicle Details | Newly Created | `/api/school-admin/transport/vehicles/:id` | `GET` |
| | Create Vehicle | Existing | `/api/school-admin/transport/vehicles` | `POST` |
| | Update Vehicle | Existing | `/api/school-admin/transport/vehicles/:id` | `PUT` |
| | Delete Vehicle | Existing | `/api/school-admin/transport/vehicles/:id` | `DELETE` |
| **C. Driver Management** | Get Driver List | Existing (Enhanced Envelope) | `/api/school-admin/transport/drivers` | `GET` |
| | Get Driver Details | Newly Created | `/api/school-admin/transport/drivers/:id` | `GET` |
| | Create Driver | Existing | `/api/school-admin/transport/drivers` | `POST` |
| | Update Driver | Existing | `/api/school-admin/transport/drivers/:id` | `PUT` |
| | Delete Driver | Existing | `/api/school-admin/transport/drivers/:id` | `DELETE` |
| **D. Transport Allocation**| Get Student Transport Details | Newly Created | `/api/school-admin/transport/student-allocations/:id` | `GET` |
| | Assign Transport to Student | Existing (Enhanced) | `/api/school-admin/transport/student-allocations` | `POST` |
| | Update Student Transport | Newly Created | `/api/school-admin/transport/student-allocations/:id` | `PUT` |
| | Remove Student Transport | Existing | `/api/school-admin/transport/student-allocations/:id` | `DELETE` |
| | Get Route-wise Students | Newly Created | `/api/school-admin/transport/routes/:id/students` | `GET` |
| | Get Vehicle-wise Students | Newly Created | `/api/school-admin/transport/vehicles/:id/students` | `GET` |
| **E. Transport Fees** | Get Transport Fee Summary | Newly Created | `/api/school-admin/transport/fees` | `GET` |
| | Get Student-wise Transport Fees| Newly Created | `/api/school-admin/transport/fees/students` | `GET` |
| | Get Fee Payment Status | Newly Created | `/api/school-admin/transport/fees/status` | `GET` |
| | Get Pending Transport Fees | Newly Created | `/api/school-admin/transport/fees/pending` | `GET` |

**Missing APIs identified during inspection**:
- Get Route Details by ID
- Get Vehicle Details by ID
- Get Driver Details by ID
- Get Student Transport Allocation by ID
- Update Student Transport Allocation
- Get Route-wise Student List
- Get Vehicle-wise Student List
- All 4 Transport Fee APIs (`/fees`, `/fees/students`, `/fees/status`, `/fees/pending`)

*All missing APIs have now been created, connected, and verified via automated testing.*

---

### 19.1 Transport Route APIs

#### 19.1.1 Get Transport Routes
- **Endpoint**: `GET /api/school-admin/transport/routes` (Alias: `GET /api/transport/routes?envelope=true`)
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `Route` (`routes`), `RouteStop` (`routestops`)
- **Files**: `backend/src/routes/transportRoutes.js`, `backend/src/controllers/transportController.js:getRoutes`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transport routes retrieved successfully",
    "data": {
      "routes": [
        {
          "routeId": "6ae090d920096a858540f0c1",
          "routeName": "Route 1 - North Campus Express",
          "routeNumber": "R001",
          "pickupPoint": "Main Bus Stop",
          "dropPoint": "School Gate A",
          "vehicleId": "6ae090d920096a858540f0d1",
          "vehicleNumber": "TN01AB1234",
          "vehicleName": "School Bus 1",
          "totalDistanceKm": 12.5,
          "estimatedDurationMins": 35,
          "stops": [],
          "status": "Active",
          "createdDate": "2026-11-01T08:00:00.000Z",
          "updatedDate": "2026-11-01T08:00:00.000Z"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 19.1.2 Get Route Details by ID
- **Endpoint**: `GET /api/school-admin/transport/routes/:id`
- **Path Parameter**: `id` – 24-character Route ObjectId
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Route details retrieved successfully",
    "data": {
      "routeId": "6ae090d920096a858540f0c1",
      "routeNumber": "R001",
      "routeName": "Route 1 - North Campus Express",
      "pickupPoint": "Main Bus Stop",
      "dropPoint": "School Gate A",
      "totalDistanceKm": 12.5,
      "estimatedDurationMins": 35,
      "assignedVehicle": {
        "vehicleId": "6ae090d920096a858540f0d1",
        "vehicleNumber": "TN01AB1234",
        "vehicleName": "School Bus 1"
      },
      "stops": [],
      "status": "Active"
    }
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Route not found"
  }
  ```

#### 19.1.3 Create Transport Route
- **Endpoint**: `POST /api/school-admin/transport/routes`
- **Request Payload**:
  ```json
  {
    "route_id": "R002",
    "route_name": "Route 2 - South Extension",
    "start_point": "South Junction",
    "end_point": "School Main Gate",
    "total_distance_km": 15.2,
    "estimated_duration_mins": 45,
    "assigned_bus_id": "6ae090d920096a858540f0d1",
    "status": "Active"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Route created successfully",
    "route": {
      "_id": "6ae090d920096a858540f0c2",
      "route_id": "R002",
      "route_name": "Route 2 - South Extension",
      "start_point": "South Junction",
      "end_point": "School Main Gate",
      "total_distance_km": 15.2,
      "estimated_duration_mins": 45,
      "status": "Active"
    }
  }
  ```

#### 19.1.4 Update Transport Route
- **Endpoint**: `PUT /api/school-admin/transport/routes/:id`
- **Request Payload**:
  ```json
  {
    "route_name": "Route 2 - South Extension Express",
    "estimated_duration_mins": 40
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Route updated successfully",
    "route": {
      "_id": "6ae090d920096a858540f0c2",
      "route_name": "Route 2 - South Extension Express",
      "estimated_duration_mins": 40
    }
  }
  ```

#### 19.1.5 Delete Transport Route
- **Endpoint**: `DELETE /api/school-admin/transport/routes/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Route and associated stops deleted successfully"
  }
  ```

---

### 19.2 Vehicle Management APIs

#### 19.2.1 Get Vehicle List
- **Endpoint**: `GET /api/school-admin/transport/vehicles` (Alias: `GET /api/transport/buses?envelope=true`)
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `Bus` (`buses`)
- **Files**: `backend/src/routes/transportRoutes.js`, `backend/src/controllers/transportController.js:getBuses`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vehicles retrieved successfully",
    "data": {
      "vehicles": [
        {
          "vehicleId": "6ae090d920096a858540f0d1",
          "vehicleNumber": "TN01AB1234",
          "vehicleName": "School Bus 1",
          "vehicleType": "Bus",
          "registrationNumber": "TN01AB1234",
          "totalSeats": 40,
          "capacity": 40,
          "status": "Active",
          "createdDate": "2026-11-01T08:00:00.000Z",
          "updatedDate": "2026-11-01T08:00:00.000Z"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 19.2.2 Get Vehicle Details
- **Endpoint**: `GET /api/school-admin/transport/vehicles/:id`
- **Path Parameter**: `id` – 24-character Bus ObjectId
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vehicle details retrieved successfully",
    "data": {
      "vehicleId": "6ae090d920096a858540f0d1",
      "vehicleNumber": "TN01AB1234",
      "vehicleName": "School Bus 1",
      "vehicleType": "Bus",
      "registrationNumber": "TN01AB1234",
      "totalSeats": 40,
      "capacity": 40,
      "gpsEnabled": true,
      "status": "Active"
    }
  }
  ```

#### 19.2.3 Create Vehicle
- **Endpoint**: `POST /api/school-admin/transport/vehicles`
- **Request Payload**:
  ```json
  {
    "bus_number": "TN01AB5678",
    "vehicle_reg_number": "TN01AB5678",
    "bus_name": "School Mini Bus 2",
    "bus_type": "Mini Bus",
    "total_seats": 25,
    "gps_enabled": true,
    "status": "Active"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Bus created successfully",
    "bus": {
      "_id": "6ae090d920096a858540f0d2",
      "bus_number": "TN01AB5678",
      "vehicle_reg_number": "TN01AB5678",
      "bus_name": "School Mini Bus 2",
      "total_seats": 25,
      "status": "Active"
    }
  }
  ```

#### 19.2.4 Update Vehicle
- **Endpoint**: `PUT /api/school-admin/transport/vehicles/:id`
- **Request Payload**:
  ```json
  {
    "total_seats": 28,
    "status": "Active"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Bus updated successfully",
    "bus": {
      "_id": "6ae090d920096a858540f0d2",
      "total_seats": 28
    }
  }
  ```

#### 19.2.5 Delete Vehicle
- **Endpoint**: `DELETE /api/school-admin/transport/vehicles/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Bus deleted successfully"
  }
  ```

---

### 19.3 Driver Management APIs

#### 19.3.1 Get Driver List
- **Endpoint**: `GET /api/school-admin/transport/drivers`
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `Driver` (`drivers`), `Staff` (`staffs`)
- **Files**: `backend/src/controllers/transportController.js:getDrivers`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Drivers retrieved successfully",
    "data": {
      "drivers": [
        {
          "driverId": "6ae090d920096a858540f0e1",
          "driverCode": "DRV001",
          "driverName": "Rajesh Kumar",
          "driverPhone": "9876543210",
          "email": "driver.rajesh@school.com",
          "licenseNumber": "DL-TN0120200001",
          "assignedVehicle": {
            "vehicleId": "6ae090d920096a858540f0d1",
            "vehicleNumber": "TN01AB1234",
            "vehicleName": "School Bus 1"
          },
          "status": "Active",
          "createdDate": "2026-11-01T08:00:00.000Z",
          "updatedDate": "2026-11-01T08:00:00.000Z"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 19.3.2 Get Driver Details
- **Endpoint**: `GET /api/school-admin/transport/drivers/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Driver details retrieved successfully",
    "data": {
      "driverId": "6ae090d920096a858540f0e1",
      "driverCode": "DRV001",
      "driverName": "Rajesh Kumar",
      "driverPhone": "9876543210",
      "email": "driver.rajesh@school.com",
      "licenseNumber": "DL-TN0120200001",
      "assignedVehicle": {
        "vehicleId": "6ae090d920096a858540f0d1",
        "vehicleNumber": "TN01AB1234",
        "vehicleName": "School Bus 1"
      },
      "status": "Active"
    }
  }
  ```

#### 19.3.3 Create Driver
- **Endpoint**: `POST /api/school-admin/transport/drivers`
- **Request Payload**:
  ```json
  {
    "driver_id": "DRV002",
    "name": "Murugan S",
    "mobile_number": "9876543211",
    "email": "driver.murugan@school.com",
    "license_number": "DL-TN0120210002",
    "password": "DriverPassword@123",
    "status": "Active"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Driver registered successfully",
    "driver": {
      "_id": "6ae090d920096a858540f0e2",
      "driver_id": "DRV002",
      "name": "Murugan S",
      "mobile_number": "9876543211",
      "status": "Active"
    }
  }
  ```

#### 19.3.4 Update Driver
- **Endpoint**: `PUT /api/school-admin/transport/drivers/:id`
- **Request Payload**:
  ```json
  {
    "name": "Murugan Swamy",
    "mobile_number": "9876543212"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Driver updated successfully",
    "driver": {
      "_id": "6ae090d920096a858540f0e2",
      "name": "Murugan Swamy",
      "mobile_number": "9876543212"
    }
  }
  ```

#### 19.3.5 Delete Driver
- **Endpoint**: `DELETE /api/school-admin/transport/drivers/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Driver deleted successfully"
  }
  ```

---

### 19.4 Transport Allocation APIs

#### 19.4.1 Get Student Transport Allocations
- **Endpoint**: `GET /api/school-admin/transport/student-allocations` (Alias: `/allocations`)
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `StudentTransport` (`studenttransports`), `Student` (`students`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student transport allocations retrieved successfully",
    "data": {
      "allocations": [
        {
          "allocationId": "6ae090d920096a858540f0f1",
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "10",
          "section": "A",
          "routeId": "6ae090d920096a858540f0c1",
          "routeName": "Route 1 - North Campus Express",
          "routeNumber": "R001",
          "pickupPoint": "Main Bus Stop",
          "dropPoint": "School Gate A",
          "vehicleId": "6ae090d920096a858540f0d1",
          "vehicleNumber": "TN01AB1234",
          "transportFee": 1500,
          "paymentStatus": "Paid",
          "status": "Active"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 19.4.2 Get Student Transport Details by ID
- **Endpoint**: `GET /api/school-admin/transport/student-allocations/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student transport allocation details retrieved successfully",
    "data": {
      "allocationId": "6ae090d920096a858540f0f1",
      "studentId": "6ae090d920096a858540f0a1",
      "studentName": "Aarav Sharma",
      "admissionNumber": "ADM2026001",
      "class": "10",
      "section": "A",
      "routeId": "6ae090d920096a858540f0c1",
      "routeName": "Route 1 - North Campus Express",
      "pickupPoint": "Main Bus Stop",
      "vehicleNumber": "TN01AB1234",
      "transportFee": 1500,
      "paymentStatus": "Paid",
      "status": "Active"
    }
  }
  ```

#### 19.4.3 Assign Transport to Student
- **Endpoint**: `POST /api/school-admin/transport/student-allocations`
- **Request Payload**:
  ```json
  {
    "student_id": "6ae090d920096a858540f0a1",
    "admission_number": "ADM2026001",
    "class_id": "6ac8f6397ae01d3a464b2c15",
    "route_id": "6ae090d920096a858540f0c1",
    "bus_id": "6ae090d920096a858540f0d1",
    "pickup_stop_id": "6ae090d920096a858540f0c5",
    "transport_fee": 1500,
    "transport_fee_payment_status": "Paid"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Student transport assigned successfully",
    "data": {
      "_id": "6ae090d920096a858540f0f1",
      "student_id": "6ae090d920096a858540f0a1",
      "route_id": "6ae090d920096a858540f0c1",
      "bus_id": "6ae090d920096a858540f0d1",
      "status": "Active"
    }
  }
  ```

#### 19.4.4 Update Student Transport Allocation
- **Endpoint**: `PUT /api/school-admin/transport/student-allocations/:id`
- **Request Payload**:
  ```json
  {
    "route_id": "6ae090d920096a858540f0c2",
    "bus_id": "6ae090d920096a858540f0d2",
    "transport_fee": 1800,
    "transport_fee_payment_status": "Paid"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student transport allocation updated successfully",
    "data": {
      "_id": "6ae090d920096a858540f0f1",
      "status": "Active"
    }
  }
  ```

#### 19.4.5 Remove Student Transport Allocation
- **Endpoint**: `DELETE /api/school-admin/transport/student-allocations/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student transport unassigned successfully"
  }
  ```

#### 19.4.6 Get Route-wise Student List
- **Endpoint**: `GET /api/school-admin/transport/routes/:id/students`
- **Path Parameter**: `id` – Route ID
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Route-wise student list retrieved successfully",
    "data": {
      "routeId": "6ae090d920096a858540f0c1",
      "students": [
        {
          "allocationId": "6ae090d920096a858540f0f1",
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "10",
          "section": "A",
          "pickupPoint": "Main Bus Stop",
          "vehicleNumber": "TN01AB1234",
          "transportFee": 1500,
          "paymentStatus": "Paid"
        }
      ],
      "totalStudents": 1
    }
  }
  ```

#### 19.4.7 Get Vehicle-wise Student List
- **Endpoint**: `GET /api/school-admin/transport/vehicles/:id/students` (Alias: `/buses/:id/students`)
- **Path Parameter**: `id` – Vehicle / Bus ID
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vehicle-wise student list retrieved successfully",
    "data": {
      "vehicleId": "6ae090d920096a858540f0d1",
      "students": [
        {
          "allocationId": "6ae090d920096a858540f0f1",
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "10",
          "section": "A",
          "routeName": "Route 1 - North Campus Express",
          "routeNumber": "R001",
          "pickupPoint": "Main Bus Stop",
          "transportFee": 1500,
          "paymentStatus": "Paid"
        }
      ],
      "totalStudents": 1
    }
  }
  ```

---

### 19.5 Transport Fee APIs

#### 19.5.1 Get Transport Fee Summary
- **Endpoint**: `GET /api/school-admin/transport/fees`
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `StudentTransport`, `Student`
- **Files**: `backend/src/controllers/transportController.js:getTransportFeeSummary`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transport fee summary retrieved successfully",
    "data": {
      "totalStudentsUsingTransport": 1,
      "totalExpectedFee": 1500,
      "totalCollectedFee": 1500,
      "totalPendingFee": 0,
      "paidStudentsCount": 1,
      "pendingStudentsCount": 0
    }
  }
  ```

#### 19.5.2 Get Student-wise Transport Fees
- **Endpoint**: `GET /api/school-admin/transport/fees/students`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student-wise transport fees retrieved successfully",
    "data": {
      "studentFees": [
        {
          "allocationId": "6ae090d920096a858540f0f1",
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "10",
          "section": "A",
          "routeId": "6ae090d920096a858540f0c1",
          "routeName": "Route 1 - North Campus Express",
          "routeNumber": "R001",
          "vehicleNumber": "TN01AB1234",
          "pickupPoint": "Main Bus Stop",
          "transportFee": 1500,
          "feeType": "Monthly",
          "paymentStatus": "Paid"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 19.5.3 Get Transport Fee Payment Status
- **Endpoint**: `GET /api/school-admin/transport/fees/status`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transport fee payment status summary retrieved successfully",
    "data": {
      "paymentStatusSummary": {
        "Paid": { "count": 1, "totalAmount": 1500 },
        "Pending": { "count": 0, "totalAmount": 0 },
        "Partial": { "count": 0, "totalAmount": 0 },
        "Waived": { "count": 0, "totalAmount": 0 }
      },
      "totalStudents": 1
    }
  }
  ```

#### 19.5.4 Get Pending Transport Fees
- **Endpoint**: `GET /api/school-admin/transport/fees/pending`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pending transport fees retrieved successfully",
    "data": {
      "totalPendingStudents": 0,
      "totalPendingAmount": 0,
      "pendingList": []
    }
  }
  ```

---

### 19.6 Postman Testing Results – Transport

| Test Case | Method | Endpoint / Route | Status Code | Result | Response Validation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Get All Routes | `GET` | `/api/school-admin/transport/routes` | `200 OK` | **PASS** | Validated `routes` array and `totalRecords` |
| Get Route By ID | `GET` | `/api/school-admin/transport/routes/:id` | `200 OK` | **PASS** | Validated `routeId`, `routeName`, stops |
| Create Route | `POST` | `/api/school-admin/transport/routes` | `201 Created` | **PASS** | Validated creation & schema insertion |
| Get Route Students | `GET` | `/api/school-admin/transport/routes/:id/students` | `200 OK` | **PASS** | Validated route-wise student list |
| Get Vehicles | `GET` | `/api/school-admin/transport/vehicles` | `200 OK` | **PASS** | Validated `vehicles` list with registration |
| Get Vehicle By ID | `GET` | `/api/school-admin/transport/vehicles/:id` | `200 OK` | **PASS** | Validated vehicle details & capacity |
| Get Vehicle Students| `GET` | `/api/school-admin/transport/vehicles/:id/students` | `200 OK` | **PASS** | Validated vehicle-wise student list |
| Get Drivers | `GET` | `/api/school-admin/transport/drivers` | `200 OK` | **PASS** | Validated driver details & mobile phone |
| Get Driver By ID | `GET` | `/api/school-admin/transport/drivers/:id` | `200 OK` | **PASS** | Validated driver contact & vehicle link |
| Get Allocations | `GET` | `/api/school-admin/transport/student-allocations` | `200 OK` | **PASS** | Validated student allocations envelope |
| Get Allocation ID | `GET` | `/api/school-admin/transport/student-allocations/:id` | `200 OK` | **PASS** | Validated allocation details by ID |
| Assign Transport | `POST` | `/api/school-admin/transport/student-allocations` | `201 Created` | **PASS** | Validated allocation & Student doc sync |
| Update Allocation | `PUT` | `/api/school-admin/transport/student-allocations/:id` | `200 OK` | **PASS** | Validated fee and stop updates |
| Fee Summary | `GET` | `/api/school-admin/transport/fees` | `200 OK` | **PASS** | Validated totalExpected, totalCollected |
| Student Fees | `GET` | `/api/school-admin/transport/fees/students` | `200 OK` | **PASS** | Validated student-wise fee breakdowns |
| Fee Status Summary| `GET` | `/api/school-admin/transport/fees/status` | `200 OK` | **PASS** | Validated Paid/Pending/Partial counts |
| Pending Fees List | `GET` | `/api/school-admin/transport/fees/pending` | `200 OK` | **PASS** | Validated pending fee list & amounts |
| Raw Array (Legacy)| `GET` | `/api/transport/routes` | `200 OK` | **PASS** | Validated 100% backward compatibility |
| Raw Array (Legacy)| `GET` | `/api/transport/buses` | `200 OK` | **PASS** | Validated raw array for frontend app |

---

## 20. Section 2: School Admin – Homework Assignment APIs

This section documents all backend APIs for the **Homework Assignment Module** in the School Admin portal. All endpoints are mounted at `/api/school-admin/homework/*` and `/api/homework/*` with strict data isolation by `school_id`.

### API Audit & Inventory Summary

| Functional Area | API Requirement | Existing / Newly Created | Route Endpoint | HTTP Method |
| :--- | :--- | :--- | :--- | :--- |
| **A. Homework Management**| Get Homework List | Existing (Enhanced Envelope & Filters) | `/api/school-admin/homework` | `GET` |
| | Get Homework Details by ID | Existing (Enhanced Envelope & Stats) | `/api/school-admin/homework/:id` | `GET` |
| | Create Homework | Existing | `/api/school-admin/homework` | `POST` |
| | Update Homework | Existing | `/api/school-admin/homework/:id` | `PUT` |
| | Delete Homework | Existing | `/api/school-admin/homework/:id` | `DELETE` |
| **B. Homework Assignment**| Assign Homework to Class | Existing (via `assignment_type: "Class"`) | `/api/school-admin/homework` | `POST` |
| | Assign Homework to Section | Existing (via `assignment_type: "Section"`) | `/api/school-admin/homework` | `POST` |
| | Assign to Individual Students | Existing (via `assignment_type: "Student"`) | `/api/school-admin/homework` | `POST` |
| | Get Class-wise Homework | Newly Created Convenience Endpoint | `/api/school-admin/homework/class/:classId` | `GET` |
| | Get Section-wise Homework | Newly Created Convenience Endpoint | `/api/school-admin/homework/class/:classId/section/:section` | `GET` |
| | Get Subject-wise Homework | Newly Created Convenience Endpoint | `/api/school-admin/homework/subject/:subjectId` | `GET` |
| **C. Homework Submission**| Get Student Submissions | Newly Created Endpoint | `/api/school-admin/homework/submissions` | `GET` |
| | Get Submission Details by ID | Newly Created Endpoint | `/api/school-admin/homework/submissions/:submissionId`| `GET` |
| | Get Pending Submissions | Newly Created Endpoint | `/api/school-admin/homework/submissions/pending` | `GET` |
| | Get Completed Submissions | Newly Created Endpoint | `/api/school-admin/homework/submissions/completed` | `GET` |
| | Get Submission Attachments | Newly Created Endpoint | `/api/school-admin/homework/submissions/:submissionId/attachments` | `GET` |
| **D. Homework Reports** | Get Homework Summary Report | Newly Created Endpoint | `/api/school-admin/homework/reports/summary` | `GET` |
| | Student-wise Homework Report| Newly Created Endpoint | `/api/school-admin/homework/reports/student` | `GET` |
| | Class-wise Homework Report | Newly Created Endpoint | `/api/school-admin/homework/reports/class` | `GET` |
| | Submission Status Report | Newly Created Endpoint | `/api/school-admin/homework/reports/status` | `GET` |

**Missing APIs identified during inspection**:
- Convenience Class-wise, Section-wise, and Subject-wise endpoints (`/class/:classId`, `/class/:classId/section/:section`, `/subject/:subjectId`)
- General Homework Submissions retrieval (`/submissions`, `/submissions/:submissionId`, `/submissions/pending`, `/submissions/completed`, `/submissions/:submissionId/attachments`)
- All 4 Homework Reports endpoints (`/reports/summary`, `/reports/student`, `/reports/class`, `/reports/status`)

*All missing APIs have now been created, connected, and verified via automated testing.*

---

### 20.1 Homework Management APIs

#### 20.1.1 Get Homework List
- **Endpoint**: `GET /api/school-admin/homework` (Alias: `GET /api/homework/list?envelope=true`)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `class_id` (optional): Filter by Class ObjectId
  - `section` (optional): Filter by Section letter (e.g., `A`)
  - `subject_id` (optional): Filter by Subject ObjectId or Name
  - `status` (optional): `Draft`, `Assigned`, `In Progress`, `Completed`, `Archived`
  - `page` (optional): Page number (default: `1`)
  - `limit` (optional): Records per page (default: `50`)
- **Database Model**: `Homework` (`homeworks`)
- **Files**: `backend/src/routes/homeworkRoutes.js`, `backend/src/controllers/homeworkController.js:getHomeworkList`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework retrieved successfully",
    "data": {
      "homework": [
        {
          "homeworkId": "6ae090d920096a858540f0b0",
          "title": "Mathematics Homework - Quadratic Equations",
          "description": "Solve exercise problems 1 to 10 on page 45 of NCERT textbook.",
          "academicYear": "2026-2027",
          "classId": "6ac8f6397ae01d3a464b2c15",
          "className": "10",
          "sectionName": "A",
          "subjectId": "6ae090d920096a858540f0b5",
          "subjectName": "Mathematics",
          "teacherId": "6ab081ef40d436814b7e9a01",
          "teacherName": "Teacher/Admin",
          "assignedDate": "2026-11-15T08:00:00.000Z",
          "submissionDate": "2026-11-20T23:59:59.000Z",
          "dueDate": "2026-11-20T23:59:59.000Z",
          "attachment": "https://schoolapp.s3.amazonaws.com/hw/math_quad.pdf",
          "status": "Assigned",
          "createdDate": "2026-11-15T08:00:00.000Z",
          "updatedDate": "2026-11-15T08:00:00.000Z",
          "stats": {
            "totalAssigned": 40,
            "totalSubmitted": 32,
            "totalReviewed": 28,
            "totalLate": 2,
            "pendingSubmissions": 8
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

#### 20.1.2 Get Homework Details by ID
- **Endpoint**: `GET /api/school-admin/homework/:id`
- **Path Parameter**: `id` – 24-character Homework ObjectId
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework details retrieved successfully",
    "data": {
      "homeworkId": "6ae090d920096a858540f0b0",
      "title": "Mathematics Homework - Quadratic Equations",
      "description": "Solve exercise problems 1 to 10 on page 45 of NCERT textbook.",
      "academicYear": "2026-2027",
      "className": "10",
      "sectionName": "A",
      "subjectName": "Mathematics",
      "assignedDate": "2026-11-15T08:00:00.000Z",
      "submissionDate": "2026-11-20T23:59:59.000Z",
      "dueDate": "2026-11-20T23:59:59.000Z",
      "attachment": "https://schoolapp.s3.amazonaws.com/hw/math_quad.pdf",
      "status": "Assigned",
      "stats": {
        "totalAssigned": 40,
        "totalSubmitted": 32,
        "totalReviewed": 28,
        "pendingSubmissions": 8
      },
      "assignments": [],
      "submissions": [],
      "reviews": []
    }
  }
  ```

#### 20.1.3 Create Homework
- **Endpoint**: `POST /api/school-admin/homework`
- **Headers**: `Authorization: Bearer <token>`
- **Request Payload**:
  ```json
  {
    "title": "Science Assignment - Chemical Reactions",
    "description": "Write balanced chemical equations for reactions discussed in Chapter 3.",
    "subject_name": "Science",
    "subject_id": "6ae090d920096a858540f0b6",
    "assignment_type": "Class",
    "assigned_classes": ["6ac8f6397ae01d3a464b2c15"],
    "assigned_section": "A",
    "assigned_date": "2026-11-17",
    "due_date": "2026-11-22",
    "max_marks": 25,
    "instructions": "Submit scanned PDF or notebook photo.",
    "category": "Homework"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Homework created and assigned successfully",
    "homework": {
      "_id": "6ae090d920096a858540f0b1",
      "title": "Science Assignment - Chemical Reactions",
      "description": "Write balanced chemical equations for reactions discussed in Chapter 3.",
      "subject_name": "Science",
      "status": "Assigned",
      "assigned_date": "2026-11-17T00:00:00.000Z",
      "due_date": "2026-11-22T00:00:00.000Z"
    },
    "totalAssigned": 40
  }
  ```

#### 20.1.4 Update Homework
- **Endpoint**: `PUT /api/school-admin/homework/:id`
- **Request Payload**:
  ```json
  {
    "title": "Science Assignment - Chemical Reactions & Equations (Updated)",
    "due_date": "2026-11-24"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Homework updated successfully",
    "homework": {
      "_id": "6ae090d920096a858540f0b1",
      "title": "Science Assignment - Chemical Reactions & Equations (Updated)",
      "due_date": "2026-11-24T00:00:00.000Z"
    }
  }
  ```

#### 20.1.5 Delete Homework
- **Endpoint**: `DELETE /api/school-admin/homework/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Homework and all associated records deleted successfully"
  }
  ```

---

### 20.2 Homework Assignment APIs

#### 20.2.1 Assign Homework (Class, Section, or Individual Students)
The creation endpoint `POST /api/school-admin/homework` dynamically provisions assignments to target students:
- `assignment_type: "Class"`: Automatically assigns to all students in `assigned_classes`.
- `assignment_type: "Section"`: Filters students in `assigned_classes` by `assigned_section`.
- `assignment_type: "Student"`: Assigns exclusively to the list in `assigned_students: ["student_id_1", "student_id_2"]`.

#### 20.2.2 Get Class-wise Homework
- **Endpoint**: `GET /api/school-admin/homework/class/:classId`
- **Path Parameter**: `classId` – 24-character Class ObjectId
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Class homework retrieved successfully",
    "data": {
      "classId": "6ac8f6397ae01d3a464b2c15",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "6ae090d920096a858540f0b0",
          "title": "Mathematics Homework - Quadratic Equations",
          "subject_name": "Mathematics",
          "due_date": "2026-11-20T23:59:59.000Z",
          "status": "Assigned"
        }
      ]
    }
  }
  ```

#### 20.2.3 Get Section-wise Homework
- **Endpoint**: `GET /api/school-admin/homework/class/:classId/section/:section`
- **Path Parameters**:
  - `classId` – Class ObjectId
  - `section` – Section name (e.g. `A`)
- **Success Response (200 OK)**:
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
          "_id": "6ae090d920096a858540f0b0",
          "title": "Mathematics Homework - Quadratic Equations",
          "subject_name": "Mathematics",
          "assigned_section": "A"
        }
      ]
    }
  }
  ```

#### 20.2.4 Get Subject-wise Homework
- **Endpoint**: `GET /api/school-admin/homework/subject/:subjectId`
- **Path Parameter**: `subjectId` – Subject ObjectId or Subject Name (e.g. `Mathematics`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subject homework retrieved successfully",
    "data": {
      "subjectId": "Mathematics",
      "totalRecords": 1,
      "homework": [
        {
          "_id": "6ae090d920096a858540f0b0",
          "title": "Mathematics Homework - Quadratic Equations",
          "subject_name": "Mathematics",
          "status": "Assigned"
        }
      ]
    }
  }
  ```

---

### 20.3 Homework Submission APIs

#### 20.3.1 Get Student Homework Submissions
- **Endpoint**: `GET /api/school-admin/homework/submissions` (Alias: `GET /api/school-admin/homework/:id/submissions`)
- **Headers**: `Authorization: Bearer <token>`
- **Database Model**: `HomeworkSubmission` (`homeworksubmissions`)
- **Files**: `backend/src/controllers/homeworkController.js:getHomeworkSubmissions`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework submissions retrieved successfully",
    "data": {
      "submissions": [
        {
          "submissionId": "6a990deae0ad21491133ce39",
          "homeworkId": "6ae090d920096a858540f0b0",
          "homeworkTitle": "Mathematics Homework - Quadratic Equations",
          "subjectName": "Mathematics",
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "className": "10",
          "sectionName": "A",
          "submissionDate": "2026-11-18T10:30:00.000Z",
          "submissionStatus": "Submitted",
          "attachments": [
            {
              "file_url": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
              "file_name": "aarav_math.pdf",
              "file_type": "application/pdf"
            }
          ],
          "teacherRemarks": "Well done! Clean calculations.",
          "marksObtained": 24,
          "createdDate": "2026-11-18T10:30:00.000Z",
          "updatedDate": "2026-11-18T14:00:00.000Z"
        }
      ],
      "totalRecords": 1
    }
  }
  ```

#### 20.3.2 Get Submission Details by ID
- **Endpoint**: `GET /api/school-admin/homework/submissions/:submissionId`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submission details retrieved successfully",
    "data": {
      "submissionId": "6a990deae0ad21491133ce39",
      "homeworkId": "6ae090d920096a858540f0b0",
      "homeworkTitle": "Mathematics Homework - Quadratic Equations",
      "studentName": "Aarav Sharma",
      "submissionStatus": "Submitted",
      "attachments": [
        {
          "file_url": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "file_name": "aarav_math.pdf"
        }
      ],
      "teacherRemarks": "Well done! Clean calculations.",
      "marksObtained": 24
    }
  }
  ```

#### 20.3.3 Get Pending Submissions
- **Endpoint**: `GET /api/school-admin/homework/submissions/pending`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pending submissions retrieved successfully",
    "data": {
      "totalPending": 0,
      "pendingSubmissions": []
    }
  }
  ```

#### 20.3.4 Get Completed Submissions
- **Endpoint**: `GET /api/school-admin/homework/submissions/completed`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Completed submissions retrieved successfully",
    "data": {
      "totalCompleted": 1,
      "completedSubmissions": [
        {
          "submissionId": "6a990deae0ad21491133ce39",
          "homeworkId": "6ae090d920096a858540f0b0",
          "homeworkTitle": "Mathematics Homework - Quadratic Equations",
          "studentName": "Aarav Sharma",
          "status": "Submitted",
          "marks": 24
        }
      ]
    }
  }
  ```

#### 20.3.5 Get Submission Attachments
- **Endpoint**: `GET /api/school-admin/homework/submissions/:submissionId/attachments`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submission attachments retrieved successfully",
    "data": {
      "submissionId": "6a990deae0ad21491133ce39",
      "totalAttachments": 1,
      "attachments": [
        {
          "file_url": "https://schoolapp.s3.amazonaws.com/subs/aarav_math.pdf",
          "file_name": "aarav_math.pdf",
          "file_type": "application/pdf"
        }
      ]
    }
  }
  ```

---

### 20.4 Homework Reports APIs

#### 20.4.1 Get Homework Summary Report
- **Endpoint**: `GET /api/school-admin/homework/reports/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Files**: `backend/src/controllers/homeworkController.js:getHomeworkSummaryReport`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Homework summary report retrieved successfully",
    "data": {
      "totalHomeworks": 1,
      "totalAssignments": 1,
      "totalSubmissions": 1,
      "totalReviewed": 1,
      "submissionRate": 100,
      "reviewRate": 100,
      "categoryBreakdown": {
        "Homework": 1
      }
    }
  }
  ```

#### 20.4.2 Get Student-wise Homework Report
- **Endpoint**: `GET /api/school-admin/homework/reports/student`
- **Query Parameter**: `class_id` (optional)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Student-wise homework report retrieved successfully",
    "data": {
      "totalStudents": 1,
      "report": [
        {
          "studentId": "6ae090d920096a858540f0a1",
          "studentName": "Aarav Sharma",
          "admissionNumber": "ADM2026001",
          "class": "10",
          "section": "A",
          "totalAssigned": 1,
          "totalSubmitted": 1,
          "totalPending": 0,
          "submissionPercentage": 100
        }
      ]
    }
  }
  ```

#### 20.4.3 Get Class-wise Homework Report
- **Endpoint**: `GET /api/school-admin/homework/reports/class`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Class-wise homework report retrieved successfully",
    "data": {
      "totalClasses": 1,
      "report": [
        {
          "classId": "6ac8f6397ae01d3a464b2c15",
          "className": "10",
          "section": "A",
          "totalHomeworks": 1,
          "totalAssignments": 1,
          "totalSubmissions": 1,
          "classSubmissionRate": 100
        }
      ]
    }
  }
  ```

#### 20.4.4 Get Submission Status Report
- **Endpoint**: `GET /api/school-admin/homework/reports/status`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submission status report retrieved successfully",
    "data": {
      "statusBreakdown": {
        "Submitted": 1,
        "Reviewed": 0,
        "Late": 0,
        "Resubmitted": 0
      },
      "totalSubmissions": 1
    }
  }
  ```

---

### 20.5 Postman Testing Results – Homework

| Test Case | Method | Endpoint / Route | Status Code | Result | Response Validation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Get Homework List | `GET` | `/api/school-admin/homework` | `200 OK` | **PASS** | Validated dual envelope & stats object |
| Get Homework By ID | `GET` | `/api/school-admin/homework/:id` | `200 OK` | **PASS** | Validated submissions, assignments & stats |
| Create Homework | `POST` | `/api/school-admin/homework` | `201 Created` | **PASS** | Auto-provisions assignments by class/section |
| Class Homework | `GET` | `/api/school-admin/homework/class/:classId` | `200 OK` | **PASS** | Filtered homework list for specific class |
| Section Homework | `GET` | `/api/school-admin/homework/class/:classId/section/A` | `200 OK` | **PASS** | Filtered homework list for specific section |
| Subject Homework | `GET` | `/api/school-admin/homework/subject/Mathematics` | `200 OK` | **PASS** | Matches both ObjectId and subject name string |
| All Submissions | `GET` | `/api/school-admin/homework/submissions` | `200 OK` | **PASS** | Validated student submission records |
| Submission By ID | `GET` | `/api/school-admin/homework/submissions/:subId` | `200 OK` | **PASS** | Validated submission attachments & remarks |
| Attachments List | `GET` | `/api/school-admin/homework/submissions/:subId/attachments` | `200 OK` | **PASS** | Validated submission attachment URLs |
| Pending Submissions| `GET` | `/api/school-admin/homework/submissions/pending` | `200 OK` | **PASS** | Validated pending status filtering |
| Completed Subs | `GET` | `/api/school-admin/homework/submissions/completed` | `200 OK` | **PASS** | Validated completed submissions list |
| Summary Report | `GET` | `/api/school-admin/homework/reports/summary` | `200 OK` | **PASS** | Validated submission & review rates |
| Student Report | `GET` | `/api/school-admin/homework/reports/student` | `200 OK` | **PASS** | Validated student-wise assignment completion |
| Class Report | `GET` | `/api/school-admin/homework/reports/class` | `200 OK` | **PASS** | Validated class submission percentages |
| Status Report | `GET` | `/api/school-admin/homework/reports/status` | `200 OK` | **PASS** | Validated status breakdown breakdown |
| Raw Array (Legacy)| `GET` | `/api/homework/list` | `200 OK` | **PASS** | Validated raw array for frontend app |

---

