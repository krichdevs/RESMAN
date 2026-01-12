import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, MapPin, Wifi, Monitor, Coffee } from 'lucide-react';
import apiClient from '../api/client';

type Room = {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  equipment: string;
  description?: string;
};

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await apiClient.get('/rooms');
      if (response.success && response.data) {
        const responseData = response.data as any;
        setRooms(responseData.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentIcons = (equipment: string) => {
    const items = equipment.split(',');
    return items.map((item, index) => {
      const trimmed = item.trim().toLowerCase();
      if (trimmed.includes('projector')) return <Monitor key={index} className="w-4 h-4" />;
      if (trimmed.includes('wifi')) return <Wifi key={index} className="w-4 h-4" />;
      if (trimmed.includes('coffee') || trimmed.includes('refreshment')) return <Coffee key={index} className="w-4 h-4" />;
      return null;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Available Rooms</h1>
        <p className="text-blue-100">Browse all classrooms and facilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden hover:shadow-lg transition">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-600">{room.description}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{room.building}, {room.floor}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {room.capacity} people</span>
                </div>

                {room.equipment && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Equipment:</span>
                    <div className="flex gap-1">
                      {getEquipmentIcons(room.equipment)}
                    </div>
                  </div>
                )}
              </div>

              <button className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No rooms available at the moment.</p>
        </div>
      )}
    </div>
  );
}