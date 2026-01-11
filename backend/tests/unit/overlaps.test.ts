import {
  timeToMinutes,
  minutesToTime,
  doTimesOverlap,
  findConflictingBookings,
  isValidTimeRange,
  calculateDuration,
  isWithinBusinessHours,
  getAvailableSlots,
} from '../../src/utils/overlap-check';

describe('Time Utility Functions', () => {
  describe('timeToMinutes', () => {
    it('should convert time string to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('01:00')).toBe(60);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should handle edge cases', () => {
      expect(timeToMinutes('08:00')).toBe(480);
      expect(timeToMinutes('17:30')).toBe(1050);
    });
  });

  describe('minutesToTime', () => {
    it('should convert minutes to time string', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(60)).toBe('01:00');
      expect(minutesToTime(750)).toBe('12:30');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    it('should pad single digits with zeros', () => {
      expect(minutesToTime(65)).toBe('01:05');
      expect(minutesToTime(9)).toBe('00:09');
    });
  });

  describe('doTimesOverlap', () => {
    it('should detect overlapping time ranges', () => {
      // Complete overlap
      expect(
        doTimesOverlap(
          { startTime: '09:00', endTime: '11:00' },
          { startTime: '09:00', endTime: '11:00' }
        )
      ).toBe(true);

      // Partial overlap at start
      expect(
        doTimesOverlap(
          { startTime: '09:00', endTime: '11:00' },
          { startTime: '10:00', endTime: '12:00' }
        )
      ).toBe(true);

      // Partial overlap at end
      expect(
        doTimesOverlap(
          { startTime: '10:00', endTime: '12:00' },
          { startTime: '09:00', endTime: '11:00' }
        )
      ).toBe(true);

      // One contains the other
      expect(
        doTimesOverlap(
          { startTime: '09:00', endTime: '17:00' },
          { startTime: '10:00', endTime: '12:00' }
        )
      ).toBe(true);
    });

    it('should detect non-overlapping time ranges', () => {
      // Completely separate
      expect(
        doTimesOverlap(
          { startTime: '09:00', endTime: '10:00' },
          { startTime: '11:00', endTime: '12:00' }
        )
      ).toBe(false);

      // Adjacent (end of one equals start of other)
      expect(
        doTimesOverlap(
          { startTime: '09:00', endTime: '10:00' },
          { startTime: '10:00', endTime: '11:00' }
        )
      ).toBe(false);
    });
  });

  describe('isValidTimeRange', () => {
    it('should return true for valid time ranges', () => {
      expect(isValidTimeRange('09:00', '10:00')).toBe(true);
      expect(isValidTimeRange('08:00', '17:00')).toBe(true);
      expect(isValidTimeRange('00:00', '23:59')).toBe(true);
    });

    it('should return false for invalid time ranges', () => {
      expect(isValidTimeRange('10:00', '09:00')).toBe(false);
      expect(isValidTimeRange('10:00', '10:00')).toBe(false);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      expect(calculateDuration('09:00', '10:00')).toBe(60);
      expect(calculateDuration('09:00', '10:30')).toBe(90);
      expect(calculateDuration('08:00', '17:00')).toBe(540);
    });
  });

  describe('isWithinBusinessHours', () => {
    it('should return true for times within business hours', () => {
      expect(isWithinBusinessHours('09:00')).toBe(true);
      expect(isWithinBusinessHours('12:00')).toBe(true);
      expect(isWithinBusinessHours('17:00')).toBe(true);
    });

    it('should return false for times outside business hours', () => {
      expect(isWithinBusinessHours('07:00')).toBe(false);
      expect(isWithinBusinessHours('21:00')).toBe(false);
    });

    it('should respect custom business hours', () => {
      expect(isWithinBusinessHours('07:00', '06:00', '22:00')).toBe(true);
      expect(isWithinBusinessHours('23:00', '06:00', '22:00')).toBe(false);
    });
  });
});

describe('Booking Conflict Detection', () => {
  describe('findConflictingBookings', () => {
    const existingBookings = [
      {
        roomId: 'room-1',
        date: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '10:30',
      },
      {
        roomId: 'room-1',
        date: new Date('2024-01-15'),
        startTime: '14:00',
        endTime: '15:30',
      },
      {
        roomId: 'room-2',
        date: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '10:30',
      },
    ];

    it('should find conflicting bookings for same room and overlapping time', () => {
      const newBooking = {
        roomId: 'room-1',
        date: new Date('2024-01-15'),
        startTime: '09:30',
        endTime: '11:00',
      };

      const conflicts = findConflictingBookings(newBooking, existingBookings);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].startTime).toBe('09:00');
    });

    it('should not find conflicts for different rooms', () => {
      const newBooking = {
        roomId: 'room-3',
        date: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '10:30',
      };

      const conflicts = findConflictingBookings(newBooking, existingBookings);
      expect(conflicts).toHaveLength(0);
    });

    it('should not find conflicts for different dates', () => {
      const newBooking = {
        roomId: 'room-1',
        date: new Date('2024-01-16'),
        startTime: '09:00',
        endTime: '10:30',
      };

      const conflicts = findConflictingBookings(newBooking, existingBookings);
      expect(conflicts).toHaveLength(0);
    });

    it('should not find conflicts for non-overlapping times', () => {
      const newBooking = {
        roomId: 'room-1',
        date: new Date('2024-01-15'),
        startTime: '11:00',
        endTime: '12:30',
      };

      const conflicts = findConflictingBookings(newBooking, existingBookings);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return all slots when no bookings exist', () => {
      const slots = getAvailableSlots([], '08:00', '12:00', 60);
      expect(slots).toHaveLength(4);
      expect(slots[0]).toEqual({ startTime: '08:00', endTime: '09:00' });
      expect(slots[3]).toEqual({ startTime: '11:00', endTime: '12:00' });
    });

    it('should exclude booked slots', () => {
      const existingBookings = [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '11:00', endTime: '12:00' },
      ];

      const slots = getAvailableSlots(existingBookings, '08:00', '13:00', 60);
      expect(slots).toHaveLength(3);
      expect(slots.map((s) => s.startTime)).toEqual(['08:00', '10:00', '12:00']);
    });

    it('should handle custom slot durations', () => {
      const slots = getAvailableSlots([], '08:00', '11:00', 90);
      expect(slots).toHaveLength(2);
      expect(slots[0]).toEqual({ startTime: '08:00', endTime: '09:30' });
      expect(slots[1]).toEqual({ startTime: '09:30', endTime: '11:00' });
    });
  });
});
