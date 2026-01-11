import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function LandingPage() {
  const [occupancy, setOccupancy] = useState<Occupancy[]>([]);
  const [rangeData, setRangeData] = useState<OccupancyRange[]>([]);

  useEffect(() => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    roomsApi.getOccupancy(date).then((data) => setOccupancy(data as Occupancy[])).catch(() => setOccupancy([]));

    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    roomsApi.getOccupancyRange(start, end).then((d) => setRangeData(d as OccupancyRange[])).catch(() => setRangeData([]));
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden mb-6 shadow-[0_12px_36px_rgba(16,24,40,0.06)]">
          <div className="bg-gradient-to-r from-red-100 via-white to-yellow-50 p-8">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-red-900">Central University — Miotso Campus</h1>
                <p className="text-red-700 mt-1">RESMAN — Reservation Manager — find and request classrooms.</p>
                <p className="text-sm text-red-500 mt-2">Motto: FIATH. INTEGRITY. EXCELLENCE. Real-time occupancy powered by actual bookings — no mock data.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-primary">Sign in</Link>
                <Link to="/register" className="btn-outline">Register</Link>
              </div>
            </header>
          </div>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-xl p-6 shadow-card border border-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-red-800">Quick search</h2>
                <p className="text-red-600 mt-1">Pick a date and filter rooms by capacity or equipment to see availability.</p>
              </div>
              <div className="text-sm text-gray-500">Search without login</div>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="date" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200" />
                <input placeholder="Capacity (min)" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200" />
                <input placeholder="Equipment (e.g. projector)" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button className="px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800">Search availability</button>
                <button className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50">Advanced filters</button>
              </div>

              <div className="mt-6 text-gray-500 text-sm">
                <p>Note: You can browse availability without signing in. Sign in to request or manage bookings.</p>
              </div>
            </div>
          </section>

          <aside className="bg-red-50 rounded-xl p-6 shadow-card border border-red-100">
            <h3 className="text-lg font-semibold text-red-800">For Students</h3>
            <ul className="mt-3 list-disc ml-5 text-red-700">
              <li>Search available rooms by date and capacity</li>
              <li>Request a booking for your class or event</li>
              <li>View and manage your own bookings after sign-in</li>
            </ul>
            <div className="mt-6">
              <Link to="/login" className="w-full inline-block text-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800">Sign in to Book</Link>
            </div>
            <div className="mt-3 text-xs text-red-600">Students get priority scheduling during term weeks.</div>
          </aside>
        </main>

          <section className="mt-8 bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Featured rooms</h2>
                <p className="text-gray-500 mt-2">Rooms with recent activity — occupancy shown for last 7 days.</p>
              </div>
              <div className="text-sm text-gray-500">Updated live</div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupancy.slice(0, 6).map((r) => {
                const rangeRoom = rangeData.find((rd) => rd.roomId === r.roomId);
                const sparkValues = rangeRoom ? rangeRoom.series.map((s) => s.occupancyPercent) : [];
                return (
                  <div
                    key={r.roomId}
                    className="group bg-white border border-red-50 rounded-xl p-4 hover:shadow-md transition-shadow duration-150"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-red-600">Room</div>
                        <div className="text-base font-medium text-red-800">{r.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-red-600">Occupancy</div>
                        <div className="text-base font-semibold text-red-800">{r.occupancyPercent}%</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Sparkline data={sparkValues} width={260} height={36} color="#d4af37" />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <div className="text-red-600">{r.bookedSlots} / {r.totalSlots} slots</div>
                      <div className="flex items-center gap-2">
                        <Link to="/register" className="px-3 py-1 rounded-md bg-red-700 text-white text-xs hover:bg-red-800">Request</Link>
                        <Link to="/app/rooms" className="px-3 py-1 rounded-md border border-yellow-400 text-xs text-red-800 hover:bg-yellow-50">View</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
      </div>
    </div>
  );
}
