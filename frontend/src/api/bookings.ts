import apiClient from './client';
import type {
  Booking,
  CreateBookingData,
  UpdateBookingData,
  PaginatedResponse,
  PaginationParams,
  BookingFilters,
} from '../types';

export const bookingsApi = {
  // Get all bookings with pagination and filters
  async getBookings(
    params?: PaginationParams & BookingFilters
  ): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/bookings', params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch bookings');
    }
    return response.data;
  },

  // Get booking by ID
  async getBooking(id: string): Promise<Booking> {
    const response = await apiClient.get<{ booking: Booking }>(`/bookings/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch booking');
    }
    return response.data.booking;
  },

  // Create new booking
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>('/bookings', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create booking');
    }
    return response.data.booking;
  },

  // Update booking
  async updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/bookings/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update booking');
    }
    return response.data.booking;
  },

  // Cancel booking
  async cancelBooking(id: string): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/bookings/${id}/cancel`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to cancel booking');
    }
    return response.data.booking;
  },

  // Delete booking
  async deleteBooking(id: string): Promise<void> {
    const response = await apiClient.delete(`/bookings/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete booking');
    }
  },

  // Get user's bookings
  async getMyBookings(
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/bookings/my', params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch my bookings');
    }
    return response.data;
  },

  // Check room availability for booking
  async checkAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<{ available: boolean; conflicts?: any[] }>
  {
    const response = await apiClient.get<{ available: boolean; conflicts?: any[] }>(
      `/bookings/check-availability`,
      { roomId, date, startTime, endTime }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to check availability');
    }
    return response.data as { available: boolean; conflicts?: any[] };
  },
};
