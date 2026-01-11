import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Building2, Clock, TrendingUp } from 'lucide-react';
import { roomsApi } from '../api/rooms';
import Sparkline from '../components/common/Sparkline';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [occupancy, setOccupancy] = useState<Occupancy[]>([]);
  const [rangeData, setRangeData] = useState<OccupancyRange[]>([]);

  useEffect(() => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    roomsApi.getOccupancy(date).then((data) => setOccupancy(data as Occupancy[])).catch(() => setOccupancy([]));

    // fetch 7-day range (last 7 days up to today)
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    roomsApi
      .getOccupancyRange(start, end)
      .then((d) => setRangeData(d as OccupancyRange[]))
      .catch(() => setRangeData([]));
  }, []);

  const totalBookings = occupancy.reduce((s, r) => s + r.bookedSlots, 0);
  const availableRooms = occupancy.filter((r) => r.occupancyPercent < 100).length;

  const stats = [
    { name: 'Total Bookings (tomorrow)', value: String(totalBookings), icon: Calendar, color: 'bg-blue-500' },
    { name: 'Available Rooms (tomorrow)', value: String(availableRooms), icon: Building2, color: 'bg-green-500' },
    { name: 'Rooms Monitored', value: String(occupancy.length), icon: Clock, color: 'bg-yellow-500' },
    { name: 'This Week', value: '8', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-6 shadow-card">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your classroom bookings today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Occupancy list */}
      <div className="bg-white rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Room Occupancy (tomorrow)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {occupancy.map((r) => {
            const rangeRoom = rangeData.find((rd) => rd.roomId === r.roomId);
            const sparkValues = rangeRoom ? rangeRoom.series.map((s) => s.occupancyPercent) : [];
            return (
              <div key={r.roomId} className="p-3 border rounded">
                <div className="flex justify-between text-sm text-gray-700">
                  <div className="font-medium">{r.name}</div>
                  <div>{r.occupancyPercent}%</div>
                </div>
                    <div className="mt-2">
                      <Sparkline data={sparkValues} width={160} height={28} color="#d4af37" />
                    </div>
                <div className="text-xs text-gray-500 mt-1">{r.bookedSlots} / {r.totalSlots} slots</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Bookings
          </h2>
          <p className="text-gray-500">No upcoming bookings</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
