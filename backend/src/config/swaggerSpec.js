const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'School Management System API Documentation',
    version: '1.0.0',
    description: 'Comprehensive REST API & Real-Time Telemetry Specification for the Multi-Tenant School Management System platform. Includes Authentication, SuperAdmin, SchoolAdmin, Teacher Portal, Parent Module, Driver Staff, Transport, Attendance, Homework, Timetable, Exams, Fees, Finance, Payroll, and Subscriptions.',
    contact: {
      name: 'System Engineering Team',
      email: 'support@schoolapp.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5005',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT bearer token in the format: Bearer <token>'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
          errors: { type: 'array', items: { type: 'string' } }
        }
      },
      SignupPayload: {
        type: 'object',
        required: ['name', 'password', 'role'],
        properties: {
          name: { type: 'string', example: 'School Admin' },
          email: { type: 'string', example: 'admin@school.com' },
          mobile: { type: 'string', example: '9876543210' },
          password: { type: 'string', example: 'Password123' },
          role: { type: 'string', enum: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff', 'Parent', 'Driver'], example: 'SchoolAdmin' }
        }
      },
      LoginPayload: {
        type: 'object',
        required: ['password'],
        properties: {
          email: { type: 'string', example: 'admin@school.com' },
          mobile: { type: 'string', example: '9876543210' },
          password: { type: 'string', example: 'Password123' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/api/auth/signup': {
      post: {
        summary: 'Create User Account (Sign Up)',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupPayload' }
            }
          }
        },
        responses: {
          201: {
            description: 'Account created successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Account created successfully',
                  user: {
                    _id: '650000000000000000000001',
                    name: 'School Admin',
                    email: 'admin@school.com',
                    phone: '9876543210',
                    role: 'SchoolAdmin',
                    status: 'Active'
                  },
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          },
          400: { description: 'Duplicate email/phone or missing fields' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate User & Get JWT Token (Sign In)',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginPayload' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Login successful',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: {
                    _id: '650000000000000000000001',
                    name: 'School Admin',
                    email: 'admin@school.com',
                    role: 'SchoolAdmin'
                  }
                }
              }
            }
          },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        tags: ['Authentication'],
        responses: {
          200: { description: 'User profile retrieved successfully' },
          401: { description: 'Unauthorized / Token invalid' }
        }
      }
    },
    '/api/auth/profile': {
      put: {
        summary: 'Update User Profile Details',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { name: 'Admin Name Updated', phone: '9876543210' }
            }
          }
        },
        responses: {
          200: { description: 'Profile updated successfully' }
        }
      }
    },
    '/api/auth/change-password': {
      put: {
        summary: 'Change User Password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { currentPassword: 'Password123', newPassword: 'NewPassword456' }
            }
          }
        },
        responses: {
          200: { description: 'Password changed successfully' }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request Password Reset Token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { email: 'admin@school.com' }
            }
          }
        },
        responses: {
          200: { description: 'Reset token generated successfully' }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset Password with Reset Token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { resetToken: 'token_string', newPassword: 'NewPassword456' }
            }
          }
        },
        responses: {
          200: { description: 'Password reset successfully' }
        }
      }
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh JWT Token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { refreshToken: 'eyJhbGci...' }
            }
          }
        },
        responses: {
          200: { description: 'Token refreshed successfully' }
        }
      }
    },
    '/api/driver/auth/login': {
      post: {
        summary: 'Driver Mobile Login',
        tags: ['Driver Module'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { mobile_number: '9876543210', password: 'Driver@123' }
            }
          }
        },
        responses: { 200: { description: 'Driver token returned' } }
      }
    },
    '/api/driver/portal': {
      get: {
        summary: 'Driver Portal Summary & Assigned Bus',
        tags: ['Driver Module'],
        responses: { 200: { description: 'Portal data returned' } }
      }
    },
    '/api/driver/trip/start': {
      post: {
        summary: 'Start Bus Trip',
        tags: ['Driver Module'],
        requestBody: {
          content: { 'application/json': { example: { trip_type: 'Pickup' } } }
        },
        responses: { 200: { description: 'Trip started' } }
      }
    },
    '/api/driver/gps/update': {
      post: {
        summary: 'Stream Live GPS Location',
        tags: ['Driver Module'],
        requestBody: {
          content: { 'application/json': { example: { latitude: 12.9716, longitude: 77.5946, speed: 35.5 } } }
        },
        responses: { 200: { description: 'GPS location updated' } }
      }
    },
    '/api/parent/auth/login': {
      post: {
        summary: 'Parent Login',
        tags: ['Parent Module'],
        security: [],
        requestBody: {
          content: { 'application/json': { example: { email_or_phone: 'siva@gmail.com', password: '123456' } } }
        },
        responses: { 200: { description: 'Parent token returned' } }
      }
    },
    '/api/parent/students': {
      get: {
        summary: 'Get Linked Children List',
        tags: ['Parent Module'],
        responses: { 200: { description: 'Child list returned' } }
      }
    }
  }
};

module.exports = swaggerDefinition;
