// api/lib/overlap-check.ts - Conflict detection utilities for booking time slots

export interface BookingSlot {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Check if startTime is before endTime
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    return startTotal < endTotal;
  } catch (error) {
    return false;
  }
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 * Returns true if there is any overlap between [start1, end1] and [start2, end2]
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // No overlap if one ends before or at the start of the other
  return !(end1Min <= start2Min || end2Min <= start1Min);
}

/**
 * Find all bookings that conflict with a proposed booking
 */
export function findConflictingBookings(
  proposed: BookingSlot,
  existing: BookingSlot[]
): BookingSlot[] {
  return existing.filter((booking) => {
    // Must be same room and date
    if (booking.roomId !== proposed.roomId || booking.date !== proposed.date) {
      return false;
    }

    // Check time overlap
    return timesOverlap(
      proposed.startTime,
      proposed.endTime,
      booking.startTime,
      booking.endTime
    );
  });
}

/**
 * Calculate duration of a booking in minutes
 */
export function getBookingDuration(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return endMin - startMin;
}

/**
 * Check if proposed booking fits within available time slots
 */
export function checkTimeSlotAvailability(
  date: string,
  startTime: string,
  endTime: string,
  availableSlots: Array<{ startTime: string; endTime: string }>
): boolean {
  if (availableSlots.length === 0) return false;

  const proposedStart = timeToMinutes(startTime);
  const proposedEnd = timeToMinutes(endTime);

  // Check if proposed time falls within at least one available slot
  return availableSlots.some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Proposed booking must start at or after slot start
    // and must end at or before slot end
    return proposedStart >= slotStart && proposedEnd <= slotEnd;
  });
}

/**
 * Get available time slots in a day, excluding booked times
 */
export function getAvailableSlots(
  operatingHours: { startTime: string; endTime: string },
  bookedTimes: Array<{ startTime: string; endTime: string }>
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];

  let currentStart = timeToMinutes(operatingHours.startTime);
  const dayEnd = timeToMinutes(operatingHours.endTime);

  // Sort booked times by start time
  const sortedBooked = [...bookedTimes].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (const booking of sortedBooked) {
    const bookStart = timeToMinutes(booking.startTime);
    const bookEnd = timeToMinutes(booking.endTime);

    // Add slot before this booking if there's a gap
    if (currentStart < bookStart) {
      slots.push({
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(bookStart),
      });
    }

    // Move current start to end of this booking
    currentStart = Math.max(currentStart, bookEnd);
  }

  // Add remaining time until day end
  if (currentStart < dayEnd) {
    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(dayEnd),
    });
  }

  return slots;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Validate time format (HH:MM with 24-hour format)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}
