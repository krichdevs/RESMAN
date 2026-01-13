// api/lib/validators.ts - Validation schemas and utilities

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed.getTime());
}

/**
 * Validate time format (HH:MM in 24-hour format)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate password strength
 * Requirements: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: any,
  limit?: any
): {
  page: number;
  limit: number;
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  if (pageNum < 1) {
    errors.push('Page must be greater than 0');
  }

  if (limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate room schema fields
 */
export function validateRoomData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Room name is required and must be a string');
  }

  if (!data.capacity || typeof data.capacity !== 'number' || data.capacity < 1) {
    errors.push('Capacity is required and must be a positive number');
  }

  if (!data.building || typeof data.building !== 'string') {
    errors.push('Building is required and must be a string');
  }

  if (data.floor !== undefined && typeof data.floor !== 'number') {
    errors.push('Floor must be a number if provided');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate booking schema fields
 */
export function validateBookingData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.roomId || !isValidUUID(data.roomId)) {
    errors.push('Valid roomId is required');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.date || !isValidDateFormat(data.date)) {
    errors.push('Valid date (YYYY-MM-DD) is required');
  }

  if (!data.startTime || !isValidTimeFormat(data.startTime)) {
    errors.push('Valid start time (HH:MM) is required');
  }

  if (!data.endTime || !isValidTimeFormat(data.endTime)) {
    errors.push('Valid end time (HH:MM) is required');
  }

  // Check if startTime is before endTime
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push('Start time must be before end time');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user schema fields
 */
export function validateUserData(data: any, isUpdate = false): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isUpdate) {
    if (!data.email || !isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.password) {
      errors.push('Password is required');
    } else {
      const passwordCheck = isStrongPassword(data.password);
      if (!passwordCheck.valid) {
        errors.push(...passwordCheck.errors);
      }
    }
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email must be a valid email address');
  }

  if (data.firstName && typeof data.firstName !== 'string') {
    errors.push('First name must be a string');
  }

  if (data.lastName && typeof data.lastName !== 'string') {
    errors.push('Last name must be a string');
  }

  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.push('Phone number format is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate time slot schema fields
 */
export function validateTimeSlotData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.roomId || !isValidUUID(data.roomId)) {
    errors.push('Valid roomId is required');
  }

  if (typeof data.dayOfWeek !== 'number' || data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    errors.push('dayOfWeek must be a number between 0 and 6');
  }

  if (!data.startTime || !isValidTimeFormat(data.startTime)) {
    errors.push('Valid start time (HH:MM) is required');
  }

  if (!data.endTime || !isValidTimeFormat(data.endTime)) {
    errors.push('Valid end time (HH:MM) is required');
  }

  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push('Start time must be before end time');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input (basic)
 */
export function sanitizeString(input: any): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 1000); // Max 1000 chars
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: any): string {
  if (typeof input !== 'string') return '';

  return input.trim().toLowerCase().substring(0, 255);
}
