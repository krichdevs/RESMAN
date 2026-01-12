#!/bin/bash

# Test new smart booking form workflow
BASE_URL="http://localhost:5000/api"

echo "=== Testing New Smart Booking Form ==="
echo ""

# Test 1: Login as student
echo "TEST 1: Login as student"
STUDENT_CREDS='{"email":"int/23/01/0001@student.centraluniversity.edu.gh","password":"student123"}'
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$STUDENT_CREDS")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"
echo "Response: $LOGIN_RESPONSE" | jq '.'
echo ""

# Test 2: Fetch all rooms (dropdown)
echo "TEST 2: Fetch rooms for dropdown"
ROOMS=$(curl -s -X GET "$BASE_URL/rooms?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
ROOM_ID=$(echo "$ROOMS" | jq -r '.data[0].id')
ROOM_NAME=$(echo "$ROOMS" | jq -r '.data[0].name')
echo "First room: $ROOM_NAME (ID: $ROOM_ID)"
echo ""

# Test 3: Get available slots for room and date
echo "TEST 3: Get available time slots for room"
DATE="2026-01-13"
AVAILABILITY=$(curl -s -X GET "$BASE_URL/rooms/$ROOM_ID/availability?date=$DATE" \
  -H "Authorization: Bearer $TOKEN")
echo "Availability response:"
echo "$AVAILABILITY" | jq '.data'
echo ""

# Extract available slots
AVAILABLE_SLOTS=$(echo "$AVAILABILITY" | jq -r '.data.availability[] | select(.isAvailable == true) | .id' | head -1)
SLOT_START=$(echo "$AVAILABILITY" | jq -r '.data.availability[] | select(.isAvailable == true) | .startTime' | head -1)
SLOT_END=$(echo "$AVAILABILITY" | jq -r '.data.availability[] | select(.isAvailable == true) | .endTime' | head -1)
echo "Selected slot: $SLOT_START - $SLOT_END"
echo ""

# Test 4: Create booking with smart form data
echo "TEST 4: Create booking with form fields"
BOOKING_DATA=$(cat <<EOF
{
  "roomId": "$ROOM_ID",
  "title": "ITEC 303 - Systems Design Class",
  "courseCode": "ITEC 303",
  "date": "$DATE",
  "startTime": "$SLOT_START",
  "endTime": "$SLOT_END",
  "attendees": 0
}
EOF
)

BOOKING=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BOOKING_DATA")

echo "Booking response:"
echo "$BOOKING" | jq '.'
echo ""

# Test 5: Verify form shows updated occupancy
echo "TEST 5: Verify room occupancy updated"
OCCUPANCY=$(curl -s -X GET "$BASE_URL/rooms/occupancy?date=$DATE" \
  -H "Authorization: Bearer $TOKEN")
ROOM_OCCUPANCY=$(echo "$OCCUPANCY" | jq ".data[] | select(.roomId == \"$ROOM_ID\")")
echo "Room occupancy after booking:"
echo "$ROOM_OCCUPANCY" | jq '.'
echo ""

echo "=== All Tests Complete ==="
