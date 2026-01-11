import React from 'react';
import { X, Users, MapPin, Wifi, Projector, Clock, DollarSign } from 'lucide-react';

interface RoomDetailsModalProps {
  isOpen: boolean;
  roomId: string;
  roomName: string;
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  availability: string;
  bookingPrice?: number;
  onClose: () => void;
  onBook?: () => void;
}

export default function RoomDetailsModal({
  isOpen,
  roomId,
  roomName,
  capacity,
  building,
  floor,
  equipment,
  availability,
  bookingPrice,
  onClose,
  onBook,
}: RoomDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{roomName}</h2>
            <p className="text-blue-100 mt-1">{building} — Floor {floor}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Capacity */}
          <div className="flex items-center gap-4">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="text-lg font-semibold text-gray-900">{capacity} people</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-4">
            <MapPin className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-lg font-semibold text-gray-900">{building} Building</p>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-4">
            <Clock className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Availability</p>
              <p className="text-lg font-semibold text-gray-900">{availability}</p>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Equipment</h3>
            <div className="flex flex-wrap gap-2">
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700"
                  >
                    {item === 'Projector' && <Projector className="w-4 h-4" />}
                    {item === 'WiFi' && <Wifi className="w-4 h-4" />}
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-600">No special equipment</span>
              )}
            </div>
          </div>

          {/* Price (if applicable) */}
          {bookingPrice && (
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="text-lg font-semibold text-gray-900">GHS {bookingPrice}/hour</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            Close
          </button>
          {onBook && (
            <button
              onClick={onBook}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
