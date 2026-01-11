import apiClient from './client';
import type {
  Room,
  RoomWithTimeSlots,
  CreateRoomData,
  UpdateRoomData,
  PaginatedResponse,
  PaginationParams,
  RoomFilters,
  RoomAvailability,
} from '../types';

export const roomsApi = {
  // Get all rooms with pagination and filters
  async getRooms(
    params?: PaginationParams & RoomFilters
  ): Promise<PaginatedResponse<Room>> {
    const response = await apiClient.get<PaginatedResponse<Room>>('/rooms', params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch rooms');
    }
    return response.data;
  },

  // Get room by ID
  async getRoom(id: string): Promise<Room> {
    const response = await apiClient.get<{ room: Room }>(`/rooms/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch room');
    }
    return response.data.room;
  },

  // Get room with time slots
  async getRoomWithTimeSlots(id: string): Promise<RoomWithTimeSlots> {
    const response = await apiClient.get<{ room: RoomWithTimeSlots }>(`/rooms/${id}/timeslots`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch room with time slots');
    }
    return response.data.room;
  },

  // Create new room
  async createRoom(data: CreateRoomData): Promise<Room> {
    const response = await apiClient.post<{ room: Room }>('/rooms', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create room');
    }
    return response.data.room;
  },

  // Update room
  async updateRoom(id: string, data: UpdateRoomData): Promise<Room> {
    const response = await apiClient.put<{ room: Room }>(`/rooms/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update room');
    }
    return response.data.room;
  },

  // Delete room
  async deleteRoom(id: string): Promise<void> {
    const response = await apiClient.delete(`/rooms/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete room');
    }
  },

  // Get room availability for a specific date
  async getRoomAvailability(roomId: string, date: string): Promise<RoomAvailability> {
    const response = await apiClient.get<{ availability: RoomAvailability }>(
      `/rooms/${roomId}/availability`,
      { date }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch room availability');
    }
    return response.data.availability;
  },

  // Get available rooms for a time slot
  async getAvailableRooms(startTime: string, endTime: string, filters?: RoomFilters): Promise<Room[]> {
    const params = {
      startTime,
      endTime,
      ...filters,
    };

    const response = await apiClient.get<{ rooms: Room[] }>('/rooms/available', params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch available rooms');
    }
    return response.data.rooms;
  },

  // Get occupancy metrics for all rooms for a specific date
  async getOccupancy(date: string): Promise<any[]> {
    const response = await apiClient.get('/rooms/occupancy', { date });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch room occupancy');
    }
    // Response may be { data: [...] } or the array directly depending on backend shape
    return (response.data && (response.data.data ?? response.data)) as any[];
  },

  // Get occupancy time-series for rooms between start and end dates
  async getOccupancyRange(start: string, end: string): Promise<any[]> {
    const response = await apiClient.get('/rooms/occupancy/range', { start, end });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch occupancy range');
    }
    return (response.data && (response.data.data ?? response.data)) as any[];
  },

  // Search rooms
  async searchRooms(query: string, filters?: RoomFilters): Promise<Room[]> {
    const params = {
      q: query,
      ...filters,
    };

    const response = await apiClient.get<{ rooms: Room[] }>('/rooms/search', params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search rooms');
    }
    return response.data.rooms;
  },
};
