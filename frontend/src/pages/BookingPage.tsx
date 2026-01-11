import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roomsApi } from '../api/rooms';
import { bookingsApi } from '../api/bookings';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showFilters, setShowFilters] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryRoomId = searchParams.get('roomId');
  const queryDate = searchParams.get('date') || selectedDate;

  const [showForm, setShowForm] = useState<boolean>(false);
  const [form, setForm] = useState({ title: '', courseCode: '', start: '', end: '' });
  const [conflicts, setConflicts] = useState<any[] | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await roomsApi.getRooms({ page: 1, limit: 12 });
        setRooms(data.data || []);
      } catch (e) {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (queryRoomId && isAuthenticated) {
      setShowForm(true);
      setForm((f) => ({ ...f, start: '09:00', end: '10:00' }));
    }
  }, [queryRoomId, isAuthenticated]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Manage classroom reservations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login', { state: { from: location } });
                return;
              }
              navigate('/app/bookings');
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Room</label>
              <select className="input">
                <option value="">All Rooms</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input">
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Date Range</label>
              <input type="date" className="input" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h2>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">Day</button>
              <button className="btn-secondary text-sm">Week</button>
              <button className="btn-primary text-sm">Month</button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500 text-center py-12">Loading rooms...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.length === 0 && (
                <p className="text-gray-500 text-center py-12">No rooms found</p>
              )}
              {rooms.map((r) => (
                <div key={r.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{r.name}</h3>
                      <p className="text-sm text-gray-500">{r.building} • Capacity: {r.capacity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-sm font-medium text-green-600">Available</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // If not authenticated, redirect to login; otherwise open booking page for room
                          if (!isAuthenticated) {
                            navigate('/login', { state: { from: location } });
                            return;
                          }
                          // Navigate with query params so BookingPage can show the form
                          navigate(`/app/bookings?roomId=${r.id}&date=${selectedDate}`);
                        }}
                        className="btn-primary text-sm"
                      >
                        Book Now
                      </button>
                      <button className="btn-secondary text-sm">View</button>
                    </div>

                    {/* Inline booking form if this room is selected */}
                    {isAuthenticated && queryRoomId === r.id && showForm && (
                      <div className="mt-3 p-3 border rounded">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            className="input"
                            placeholder="Title (e.g., CS lecture)"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                          />
                          <input
                            className="input"
                            placeholder="Course code"
                            value={form.courseCode}
                            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                          />
                          <input
                            type="time"
                            className="input"
                            value={form.start}
                            onChange={(e) => setForm({ ...form, start: e.target.value })}
                          />
                          <input
                            type="time"
                            className="input"
                            value={form.end}
                            onChange={(e) => setForm({ ...form, end: e.target.value })}
                          />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            className="btn-primary"
                            onClick={async () => {
                              if (!form.title || !form.start || !form.end) {
                                toast.error('Please fill title, start and end times');
                                return;
                              }
                              try {
                                setConflicts(null);
                                // Check availability first
                                const availability = await bookingsApi.checkAvailability(r.id, queryDate, form.start, form.end);
                                if (!availability.available) {
                                  setConflicts(availability.conflicts || []);
                                  toast.error('Selected time conflicts with an existing booking');
                                  return;
                                }

                                await bookingsApi.createBooking({
                                  roomId: r.id,
                                  title: form.title,
                                  courseCode: form.courseCode,
                                  date: queryDate,
                                  startTime: form.start,
                                  endTime: form.end,
                                  attendees: 0,
                                } as any);
                                toast.success('Booking request submitted');
                                // Clear query and show bookings list
                                navigate('/app/bookings');
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to create booking');
                              }
                            }}
                          >
                            Submit Booking
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              // hide form and remove query params
                              setShowForm(false);
                              navigate('/app/bookings');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        {conflicts && conflicts.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <strong className="block mb-2">Conflicting bookings:</strong>
                            <ul className="list-disc pl-5 text-sm">
                              {conflicts.map((c, idx) => (
                                <li key={idx}>
                                  {c.title || 'Booking'} — {c.startTime} to {c.endTime} on {c.date}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <p className="text-gray-500 text-center py-12">No bookings found</p>
        </div>
      </div>
    </div>
  );
}
