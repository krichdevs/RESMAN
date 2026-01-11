import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  booked?: boolean;
  maintenance?: boolean;
}

interface RoomCalendarProps {
  roomId: string;
  roomName: string;
  date: string;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push({
      id: `${hour}:00`,
      time: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`,
      available: Math.random() > 0.4,
      booked: Math.random() > 0.7,
      maintenance: Math.random() > 0.95,
    });
  }
  return slots;
};

export default function RoomCalendar({
  roomId,
  roomName,
  date,
  onDateChange,
  onSlotSelect,
  selectedSlot,
}: RoomCalendarProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [displayDate, setDisplayDate] = useState(new Date(date));

  useEffect(() => {
    // TODO: Fetch real time slots from API based on room and date
    setTimeSlots(generateTimeSlots());
  }, [date, roomId]);

  const handlePreviousDay = () => {
    const newDate = new Date(displayDate);
    newDate.setDate(newDate.getDate() - 1);
    setDisplayDate(newDate);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const newDate = new Date(displayDate);
    newDate.setDate(newDate.getDate() + 1);
    setDisplayDate(newDate);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const availableSlots = timeSlots.filter(s => s.available && !s.booked && !s.maintenance);
  const bookedSlots = timeSlots.filter(s => s.booked);
  const maintenanceSlots = timeSlots.filter(s => s.maintenance);

  return (
    <div className="bg-white rounded-xl p-6 shadow-card border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{roomName} Availability</h2>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <button
            onClick={handlePreviousDay}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {displayDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-2xl font-bold text-green-600">{availableSlots.length}</p>
          <p className="text-xs text-green-700 mt-1">Available Slots</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-2xl font-bold text-red-600">{bookedSlots.length}</p>
          <p className="text-xs text-red-700 mt-1">Booked Slots</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{maintenanceSlots.length}</p>
          <p className="text-xs text-yellow-700 mt-1">Maintenance</p>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Select a time slot:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onSlotSelect(slot)}
              disabled={!slot.available || slot.booked || slot.maintenance}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedSlot?.id === slot.id
                  ? 'border-blue-500 bg-blue-50'
                  : slot.maintenance
                  ? 'border-yellow-200 bg-yellow-50 cursor-not-allowed opacity-50'
                  : slot.booked
                  ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-50'
                  : slot.available
                  ? 'border-green-200 bg-green-50 hover:border-green-400'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">{slot.time}</span>
                </div>
                {slot.maintenance ? (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                ) : slot.booked ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : slot.available ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : null}
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {slot.maintenance ? 'Maintenance' : slot.booked ? 'Booked' : 'Available'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-200 rounded"></div>
          <span className="text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-200 rounded"></div>
          <span className="text-gray-600">Maintenance</span>
        </div>
      </div>
    </div>
  );
}
