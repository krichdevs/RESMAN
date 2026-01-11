/**
 * Time overlap detection utilities for booking conflict prevention
 */

interface TimeRange {
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

interface BookingTimeRange extends TimeRange {
  date: string; // ISO date string (YYYY-MM-DD)
  roomId: string;
}

/**
 * Convert time string to minutes since midnight
 * @param time - Time string in "HH:mm" format
 * @returns Minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in "HH:mm" format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 * @param range1 - First time range
 * @param range2 - Second time range
 * @returns True if ranges overlap
 */
export function doTimesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  const start1 = timeToMinutes(range1.startTime);
  const end1 = timeToMinutes(range1.endTime);
  const start2 = timeToMinutes(range2.startTime);
  const end2 = timeToMinutes(range2.endTime);

  // Two ranges overlap if one starts before the other ends
  // and the other starts before the first one ends
  return start1 < end2 && start2 < end1;
}

/**
 * Check if a new booking conflicts with existing bookings
 * @param newBooking - The new booking to check
 * @param existingBookings - Array of existing bookings
 * @returns Array of conflicting bookings
 */
export function findConflictingBookings(
  newBooking: BookingTimeRange,
  existingBookings: BookingTimeRange[]
): BookingTimeRange[] {
  return existingBookings.filter((existing) => {
    // Must be same room
    if (existing.roomId !== newBooking.roomId) {
      return false;
    }

    // Must be same date
    const newDate = new Date(newBooking.date).toDateString();
    const existingDate = new Date(existing.date).toDateString();
    if (newDate !== existingDate) {
      return false;
    }

    // Check time overlap
    return doTimesOverlap(
      { startTime: newBooking.startTime, endTime: newBooking.endTime },
      { startTime: existing.startTime, endTime: existing.endTime }
    );
  });
}

/**
 * Validate that start time is before end time
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns True if valid
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return start < end;
}

/**
 * Calculate duration in minutes between two times
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end - start;
}

/**
 * Check if a time is within business hours
 * @param time - Time in "HH:mm" format
 * @param businessStart - Business start time (default: "08:00")
 * @param businessEnd - Business end time (default: "20:00")
 * @returns True if within business hours
 */
export function isWithinBusinessHours(
  time: string,
  businessStart: string = '08:00',
  businessEnd: string = '20:00'
): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(businessStart);
  const endMinutes = timeToMinutes(businessEnd);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Get available time slots for a room on a specific date
 * @param existingBookings - Existing bookings for the room on that date
 * @param businessStart - Business start time
 * @param businessEnd - Business end time
 * @param slotDuration - Duration of each slot in minutes
 * @returns Array of available time slots
 */
export function getAvailableSlots(
  existingBookings: TimeRange[],
  businessStart: string = '08:00',
  businessEnd: string = '20:00',
  slotDuration: number = 90
): TimeRange[] {
  const availableSlots: TimeRange[] = [];
  const startMinutes = timeToMinutes(businessStart);
  const endMinutes = timeToMinutes(businessEnd);

  // Sort existing bookings by start time
  const sortedBookings = [...existingBookings].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  let currentTime = startMinutes;

  for (const booking of sortedBookings) {
    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);

    // Check if there's a gap before this booking
    if (currentTime + slotDuration <= bookingStart) {
      // Add available slots in the gap
      while (currentTime + slotDuration <= bookingStart) {
        availableSlots.push({
          startTime: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + slotDuration),
        });
        currentTime += slotDuration;
      }
    }

    // Move current time to after this booking
    currentTime = Math.max(currentTime, bookingEnd);
  }

  // Check for available slots after the last booking
  while (currentTime + slotDuration <= endMinutes) {
    availableSlots.push({
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + slotDuration),
    });
    currentTime += slotDuration;
  }

  return availableSlots;
}
