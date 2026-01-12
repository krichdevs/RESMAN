import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roomsApi } from '../api/rooms';
import { bookingsApi } from '../api/bookings';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [showForm, setShowForm] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [form, setForm] = useState({
    title: '',
    courseCode: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Load rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const data = await roomsApi.getRooms({ page: 1, limit: 100 });
        setRooms(data.data || []);
      } catch (e) {
        toast.error('Failed to load rooms');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  // Load my bookings
  useEffect(() => {
    const loadMyBookings = async () => {
      try {
        const data = await bookingsApi.getMyBookings({ page: 1, limit: 10 });
        setMyBookings(data.data || []);
      } catch (e) {
        // Silent fail
      }
    };
    if (isAuthenticated) {
      loadMyBookings();
    }
  }, [isAuthenticated]);

  // Load available slots when room and date change
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedRoom || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const response = await roomsApi.getRoomAvailability(selectedRoom, selectedDate);
        console.log('Response structure:', response);
        
        // Response is: { success, data: { room, date, dayOfWeek, availability } }
        const allSlots = response.data?.availability || [];
        console.log('All slots:', allSlots);
        
        // Filter only available slots (where isAvailable === true)
        const available = allSlots.filter((slot: any) => slot.isAvailable);
        console.log('Available slots:', available);
        
        setAvailableSlots(available);
      } catch (e) {
        console.error('Failed to load slots:', e);
        toast.error('Failed to load available slots');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedRoom, selectedDate]);

  const handleBooking = async () => {
    if (!selectedRoom || !selectedDate || !selectedSlot) {
      toast.error('Please select room, date, and time slot');
      return;
    }

    if (!form.title) {
      toast.error('Please enter a booking title');
      return;
    }

    try {
      const slot = availableSlots.find((s) => s.id === selectedSlot);
      if (!slot) {
        toast.error('Invalid time slot selected');
        return;
      }

      await bookingsApi.createBooking({
        roomId: selectedRoom,
        title: form.title,
        courseCode: form.courseCode,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendees: 0,
      } as any);

      toast.success('🎉 Booking confirmed!');
      setForm({ title: '', courseCode: '', description: '' });
      setSelectedRoom('');
      setSelectedSlot('');
      setAvailableSlots([]);

      // Reload my bookings
      const data = await bookingsApi.getMyBookings({ page: 1, limit: 10 });
      setMyBookings(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please log in to make bookings</p>
        <button
          onClick={() => navigate('/login', { state: { from: location } })}
          className="btn-primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Book a Room
        </h1>
        <p className="text-gray-600 mt-2">Simple 4-step booking process</p>
      </div>

      {/* Smart Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-card p-8 space-y-6">
            {/* Step 1: Select Room */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Step 1: Select Room
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full input"
              >
                <option value="">Choose a room...</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} • {r.building} • Capacity: {r.capacity}
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  ✓ Room selected: {rooms.find((r) => r.id === selectedRoom)?.name}
                </div>
              )}
            </div>

            {/* Step 2: Select Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Step 2: Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                disabled={!selectedRoom}
                className="w-full input"
              />
              {selectedDate && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  ✓ Date selected: {new Date(selectedDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Step 3: Select Time Slot */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Step 3: Select Time Slot
              </label>
              {loadingSlots ? (
                <div className="p-4 text-center text-gray-500">Loading available slots...</div>
              ) : selectedRoom && selectedDate ? (
                <>
                  {availableSlots.length === 0 ? (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                      ⚠ No available slots for this room on this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`p-3 rounded-lg border-2 transition ${
                            selectedSlot === slot.id
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      ✓ Time selected: {availableSlots.find((s) => s.id === selectedSlot)?.startTime} -{' '}
                      {availableSlots.find((s) => s.id === selectedSlot)?.endTime}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">Select room and date first</div>
              )}
            </div>

            {/* Step 4: Booking Details */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Step 4: Booking Details
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g., ITEC 303 - Systems Design Lecture"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full input"
                />
                <input
                  type="text"
                  placeholder="Course code (optional)"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                  className="w-full input"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full input"
                  rows={2}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleBooking}
              disabled={!selectedRoom || !selectedDate || !selectedSlot || !form.title}
              className="w-full btn-primary text-lg py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Confirm Booking
            </button>
          </div>
        </div>

        {/* Right: Booking Summary & My Bookings */}
        <div className="space-y-6">
          {/* Summary Card */}
          {selectedRoom && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Room:</p>
                  <p className="font-semibold text-gray-900">
                    {rooms.find((r) => r.id === selectedRoom)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedSlot && (
                  <div>
                    <p className="text-gray-600">Time:</p>
                    <p className="font-semibold text-gray-900">
                      {availableSlots.find((s) => s.id === selectedSlot)?.startTime} -{' '}
                      {availableSlots.find((s) => s.id === selectedSlot)?.endTime}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Recent Bookings */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">My Bookings</h3>
            {myBookings.length === 0 ? (
              <p className="text-gray-500 text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {myBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                    <p className="font-semibold text-gray-900">{booking.title}</p>
                    <p className="text-gray-600">
                      {booking.room?.name} • {booking.date}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {booking.startTime} - {booking.endTime}
                    </p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
