// User types
export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// Room types
export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose?: string;
  attendees?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  room?: Room;
}

// Time slot types
export interface TimeSlot {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface BookingFormData {
  roomId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  attendees?: number;
}

// Filter types
export interface BookingFilters {
  roomId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface RoomFilters {
  building?: string;
  floor?: number;
  capacity?: number;
  amenities?: string[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  indexNumber: string;
  course: string;
  department?: string;
}

// Room types (extended)
export interface RoomWithTimeSlots extends Room {
  timeSlots: TimeSlot[];
}

export interface CreateRoomData {
  name: string;
  building: string;
  floor: number;
  capacity: number;
  amenities: string[];
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  isActive?: boolean;
}

export interface RoomAvailability {
  room: Room;
  date: string;
  dayOfWeek: number;
  availability: Array<TimeSlot & { isAvailable: boolean; booking?: any }>;
}

// Booking types (extended)
export interface CreateBookingData {
  roomId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  attendees?: number;
}

export interface UpdateBookingData extends Partial<CreateBookingData> {
  status?: BookingStatus;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter types (extended)
export interface RoomFilters {
  building?: string;
  floor?: number;
  capacity?: number;
  amenities?: string[];
  equipment?: string[];
  isActive?: boolean;
}

// Audit log types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
