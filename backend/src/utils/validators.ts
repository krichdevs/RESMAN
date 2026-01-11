import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

// Time format regex (HH:mm)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  indexNumber: z.string().min(3, 'Student ID is required'),
  department: z.string().min(1, 'Course/Department is required'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

// Room validation schemas
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  building: z.string().min(1, 'Building is required'),
  floor: z.string().min(1, 'Floor is required'),
  description: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  building: z.string().min(1).optional(),
  floor: z.string().min(1).optional(),
  description: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Booking validation schemas
export const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Invalid room ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)'),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateBookingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)').optional(),
  endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)').optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
});

// Time slot validation schemas
export const createTimeSlotSchema = z.object({
  roomId: z.string().min(1, 'Invalid room ID'),
  dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be 0-6'),
  startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)'),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const roomFilterSchema = z.object({
  building: z.string().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
  equipment: z.string().optional(), // Comma-separated list
  isActive: z.coerce.boolean().optional(),
});

export const bookingFilterSchema = z.object({
  roomId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Audit log filter schema
export const auditFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Validate data against a schema
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or throws error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validate data against a schema
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Result object with success status and data/error
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
