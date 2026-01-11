# Central University Available Class System - API Documentation

## Overview

The Central University Available Class System (CU ACS) provides a RESTful API for managing classroom bookings and reservations.

## Base URL

```
https://api.cu-acs.edu.gh/v1
```

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Authentication Endpoints

### POST /auth/login

Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@centraluniversity.edu.gh",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "STUDENT|LECTURER|ADMIN|STAFF",
      "department": "string",
      "createdAt": "string",
      "updatedAt": "string"
    },
    "token": "jwt_token_string"
  }
}
```

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@centraluniversity.edu.gh",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "department": "Computer Science"
}
```

### GET /auth/profile

Get current user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "STUDENT|LECTURER|ADMIN|STAFF",
      "department": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

### POST /auth/logout

Logout the current user and invalidate the token.

### POST /auth/change-password

Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

## Booking Endpoints

### GET /bookings

Get all bookings with optional filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (PENDING|CONFIRMED|CANCELLED|COMPLETED)
- `roomId` (string): Filter by room ID
- `startDate` (string): Filter by start date (ISO 8601)
- `endDate` (string): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "userId": "string",
        "roomId": "string",
        "startTime": "string",
        "endTime": "string",
        "status": "PENDING|CONFIRMED|CANCELLED|COMPLETED",
        "purpose": "string",
        "attendees": 25,
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
          "id": "string",
          "firstName": "string",
          "lastName": "string",
          "email": "string"
        },
        "room": {
          "id": "string",
          "name": "string",
          "building": "string",
          "capacity": 50
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### GET /bookings/{id}

Get a specific booking by ID.

### POST /bookings

Create a new booking.

**Request Body:**
```json
{
  "roomId": "room_uuid",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "purpose": "Computer Science Lecture",
  "attendees": 30
}
```

### PUT /bookings/{id}

Update an existing booking.

**Request Body:**
```json
{
  "purpose": "Updated purpose",
  "attendees": 35,
  "status": "CONFIRMED"
}
```

### DELETE /bookings/{id}

Delete a booking (admin only).

### PUT /bookings/{id}/cancel

Cancel a booking.

### GET /bookings/my

Get current user's bookings.

### GET /bookings/check-availability

Check if a room is available for a specific time slot.

**Query Parameters:**
- `roomId` (string, required): Room ID
- `startTime` (string, required): Start time (ISO 8601)
- `endTime` (string, required): End time (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

## Room Endpoints

### GET /rooms

Get all rooms with optional filtering and pagination.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `building` (string): Filter by building
- `floor` (number): Filter by floor
- `capacity` (number): Minimum capacity
- `amenities` (string): Comma-separated amenities

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "name": "Room 101",
        "building": "Main Building",
        "floor": 1,
        "capacity": 50,
        "amenities": ["projector", "whiteboard"],
        "isActive": true,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### GET /rooms/{id}

Get a specific room by ID.

### GET /rooms/{id}/timeslots

Get room details with available time slots.

### POST /rooms

Create a new room (admin only).

**Request Body:**
```json
{
  "name": "Room 201",
  "building": "Science Building",
  "floor": 2,
  "capacity": 75,
  "amenities": ["projector", "computers", "lab_equipment"]
}
```

### PUT /rooms/{id}

Update a room (admin only).

### DELETE /rooms/{id}

Delete a room (admin only).

### GET /rooms/available

Get rooms available for a specific time slot.

**Query Parameters:**
- `startTime` (string, required): Start time (ISO 8601)
- `endTime` (string, required): End time (ISO 8601)
- `building` (string): Filter by building
- `capacity` (number): Minimum capacity

### GET /rooms/search

Search rooms by name or amenities.

**Query Parameters:**
- `q` (string, required): Search query
- `building` (string): Filter by building

### GET /rooms/{id}/availability

Get room availability for a specific date.

**Query Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "string",
    "date": "2024-01-15",
    "availableSlots": [
      {
        "id": "string",
        "startTime": "2024-01-15T09:00:00Z",
        "endTime": "2024-01-15T10:00:00Z",
        "isAvailable": true
      }
    ]
  }
}
```

## Time Slot Endpoints

### GET /timeslots

Get all time slots with optional filtering.

**Query Parameters:**
- `roomId` (string): Filter by room
- `date` (string): Filter by date
- `isAvailable` (boolean): Filter by availability

### POST /timeslots

Create time slots for a room (admin only).

**Request Body:**
```json
{
  "roomId": "room_uuid",
  "slots": [
    {
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### PUT /timeslots/{id}

Update a time slot (admin only).

### DELETE /timeslots/{id}

Delete a time slot (admin only).

## Audit Endpoints

### GET /audit/logs

Get audit logs (admin only).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `userId` (string): Filter by user
- `action` (string): Filter by action
- `resource` (string): Filter by resource
- `startDate` (string): Start date filter
- `endDate` (string): End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "userId": "string",
        "action": "CREATE_BOOKING",
        "resource": "booking",
        "resourceId": "string",
        "details": {},
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "string"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 10,
    "totalPages": 100
  }
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- General API endpoints: 10 requests per second
- Authentication endpoints: 5 requests per minute
- Health check endpoints: No limit

## WebSocket Events

The API also provides real-time updates via WebSocket:

### Connection

Connect to: `wss://api.cu-acs.edu.gh/socket.io/?token=<jwt_token>`

### Events

#### Client Events

- `join-room` - Join a room for real-time updates
- `leave-room` - Leave a room

#### Server Events

- `booking-created` - New booking created
- `booking-updated` - Booking updated
- `booking-cancelled` - Booking cancelled
- `room-updated` - Room information updated

## SDKs and Libraries

- JavaScript/TypeScript SDK: Available on npm as `@cu-acs/sdk`
- Python SDK: Available on PyPI as `cu-acs-sdk`
- Postman Collection: Available in the repository

## Support

For API support, contact the IT department at it-support@centraluniversity.edu.gh
