import React, { useEffect, useState } from 'react';
import logo from '../media/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import Sparkline from '../components/common/Sparkline';
import { Users, UserCheck, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type Occupancy = {
  roomId: string;
  name: string;
  capacity: number;
  totalSlots: number;
  bookedSlots: number;
  occupancyPercent: number;
};

type OccupancyRange = {
  roomId: string;
  name: string;
  capacity: number;
  series: Array<{ date: string; totalSlots: number; bookedSlots: number; occupancyPercent: number }>;
};

type MaintenanceAlert = {
  id: string;
  roomId: string;
  roomName: string;
  reason: string;
  startDate: string;
  endDate: string;
  severity: 'info' | 'warning' | 'critical';
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [occupancy, setOccupancy] = useState<Occupancy[]>([]);
  const [rangeData, setRangeData] = useState<OccupancyRange[]>([]);
  const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Occupancy[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock maintenance alerts - in production, fetch from API
  const [maintenanceAlerts] = useState<MaintenanceAlert[]>([
    {
      id: '1',
      roomId: 'room-101',
      roomName: 'SC-B101',
      reason: 'AV System Upgrade',
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      severity: 'warning',
    },
    {
      id: '2',
      roomId: 'room-205',
      roomName: 'AB-LT1',
      reason: 'Holiday Closure',
      startDate: '2026-01-20',
      endDate: '2026-01-22',
      severity: 'info',
    },
  ]);

  useEffect(() => {
    // TODO: These endpoints need to be created
    // const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // roomsApi.getOccupancy(date).then((data) => setOccupancy(data as Occupancy[])).catch(() => setOccupancy([]));

    // const end = new Date().toISOString().split('T')[0];
    // const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // roomsApi.getOccupancyRange(start, end).then((d) => setRangeData(d as OccupancyRange[])).catch(() => setRangeData([]));
    
    // For now, set empty data to prevent errors
    setOccupancy([]);
    setRangeData([]);
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      let filtered = occupancy;

      if (minCapacity) {
        const capacity = parseInt(minCapacity);
        filtered = filtered.filter(r => r.capacity >= capacity);
      }

      // In a real app, you'd filter by equipment from room details
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = () => {
    navigate(`/app/bookings?date=${searchDate}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-red-900 flex items-center gap-2">
                <img src={logo} alt="Central University Logo" className="h-6 w-auto inline-block" />
                <span>CENTRAL UNIVERSITY</span>
              </h1>
              <p className="text-sm sm:text-base text-red-700 mt-1">RESMAN — Smart Classroom Scheduling</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition">
                Sign in
              </Link>
              <Link to="/register" className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero: RESMAN title (left aligned) */}
        <div className="mb-8">
          <div className="flex items-center justify-start gap-4">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-red-900">RESMAN</h2>
              <p className="text-sm text-red-700 mt-1 opacity-90">Smart Classroom Scheduling</p>
            </div>
          </div>
        </div>
        {/* Role-Based Access Section */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Facility panels - diagonal holders for future images */}
            <div className="relative overflow-hidden rounded-xl bg-gray-100 h-48">
              <div className="absolute inset-0 bg-[url('../media/placeholder1.jpg')] bg-center bg-cover opacity-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}>
                {/* image will go here */}
              </div>
              <div className="absolute left-4 bottom-4 text-white font-semibold">Classrooms</div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gray-100 h-48">
              <div className="absolute inset-0 bg-[url('../media/placeholder2.jpg')] bg-center bg-cover opacity-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
              <div className="absolute inset-0" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)' }}>
                {/* image will go here */}
              </div>
              <div className="absolute left-4 bottom-4 text-white font-semibold">Halls</div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gray-100 h-48">
              <div className="absolute inset-0 bg-[url('../media/placeholder3.jpg')] bg-center bg-cover opacity-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}>
                {/* image will go here */}
              </div>
              <div className="absolute left-4 bottom-4 text-white font-semibold">Labs</div>
            </div>
          </div>
        </section>

        {/* Maintenance Alerts */}
        {maintenanceAlerts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Upcoming Maintenance</h2>
            <div className="space-y-3">
              {maintenanceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-4 border flex gap-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 mt-1 flex-shrink-0 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : alert.severity === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{alert.roomName} — {alert.reason}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(alert.startDate).toLocaleDateString()} to {new Date(alert.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Public Search Section */}
        <section className="mb-12 bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Search Classrooms</h2>
          <p className="text-gray-600 mb-6">Browse availability without signing in. Sign in to make a booking.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Capacity</label>
                <input
                  type="number"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment (optional)</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="e.g., projector, whiteboard"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={handleAdvancedSearch}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">Found {searchResults.length} available rooms</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 8).map((room) => (
                    <div key={room.roomId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <p className="font-semibold text-gray-900">{room.name}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4" /> Capacity: {room.capacity}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" /> {room.bookedSlots}/{room.totalSlots} booked
                        </p>
                        <p className="text-xs font-medium text-red-600">{room.occupancyPercent}% full</p>
                      </div>
                      <Link
                        to="/register"
                        className="mt-3 block w-full text-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                      >
                        Request Booking
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-600">No rooms available matching your criteria.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Featured Rooms */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Room Status Today</h2>
              <p className="text-gray-600 text-sm mt-1">Real-time occupancy data powered by actual bookings</p>
            </div>
            <p className="text-xs text-gray-500">Updated live</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {occupancy.slice(0, 6).map((r) => {
              const rangeRoom = rangeData.find((rd) => rd.roomId === r.roomId);
              const sparkValues = rangeRoom ? rangeRoom.series.map((s) => s.occupancyPercent) : [];
              const occupancyLevel = r.occupancyPercent > 75 ? 'high' : r.occupancyPercent > 50 ? 'medium' : 'low';
              const occupancyColor =
                occupancyLevel === 'high' ? 'bg-red-100 border-red-300' : occupancyLevel === 'medium' ? 'bg-yellow-100 border-yellow-300' : 'bg-green-100 border-green-300';

              return (
                <div key={r.roomId} className={`${occupancyColor} rounded-lg p-4 border`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Room</p>
                      <p className="text-lg font-bold text-gray-900">{r.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Occupancy</p>
                      <p className="text-lg font-bold text-gray-900">{r.occupancyPercent}%</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Sparkline data={sparkValues} width={260} height={32} color="#d4af37" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">Capacity: {r.capacity}</span>
                    <span className="text-gray-600">{r.bookedSlots} / {r.totalSlots} slots</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      to="/register"
                      className="flex-1 text-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition font-medium"
                    >
                      Book Now
                    </Link>
                    <button className="flex-1 text-center px-2 py-1 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-50 transition font-medium">
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600 py-6 border-t border-gray-200">
          <p>RESMAN is your smart booking assistant. All times are in GMT.</p>
          <p className="mt-2 text-xs text-gray-500">Motto: FAITH. INTEGRITY. EXCELLENCE.</p>
        </div>
      </div>
    </div>
  );
}