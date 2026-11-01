'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Car,
  AlertTriangle,
  Award,
  Layers,
  Calendar,
  Building,
  Loader2,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [role, setRole] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [viewScope, setViewScope] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [viewScope]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?scope=${viewScope}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setAnalytics(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Parking Behavioral Analytics & Views</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Feature 12: High-performance SQL analytical queries with multi-table JOINs, GROUP BY, HAVING, and pre-computed database views.
          </p>
        </div>

        {role === 'ADMIN' && (
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewScope('user')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              My Personal Behavior
            </button>
            <button
              onClick={() => setViewScope('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Enterprise Admin Analytics
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400 flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Aggregating analytics across SQL views...</span>
        </div>
      ) : !analytics ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
          No analytics data available.
        </div>
      ) : viewScope === 'admin' ? (
        /* ================= ADMIN ENTERPRISE VIEW ================= */
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Total System Revenue</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">
                ${Number(analytics.overview?.gross_revenue || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">From completed sessions</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Total Reservations</div>
              <div className="text-2xl font-extrabold font-mono text-indigo-400">
                {analytics.overview?.total_reservations || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">All facilities combined</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Cancellation Rate</div>
              <div className="text-2xl font-extrabold font-mono text-amber-400">
                {analytics.overview?.cancellation_rate_pct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Reallocated via queue</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">No-Show Rate</div>
              <div className="text-2xl font-extrabold font-mono text-rose-400">
                {analytics.overview?.noshow_rate_pct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Post 15m grace expiration</div>
            </div>
          </div>

          {/* Real-time Occupancy Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Facility Occupancy View (v_active_occupancy)</span>
            </h3>

            <div className="space-y-3">
              {analytics.occupancy?.map((fac: any) => (
                <div key={fac.facility_id} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-100">{fac.facility_name}</span>
                    <span className="font-mono text-indigo-300">
                      {fac.currently_occupied} / {fac.total_slots} slots ({fac.occupancy_percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, fac.occupancy_percentage || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue & Volume by Facility Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                Facility Performance Summary (v_facility_revenue_summary)
              </h3>
            </div>
            <div className="overflow-x-auto text-xs text-slate-300">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Facility</th>
                    <th className="py-3 px-4">Bookings</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Cancelled</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4 text-right">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {analytics.facilityRevenue?.map((f: any) => (
                    <tr key={f.facility_id}>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-100">{f.facility_name}</td>
                      <td className="py-3 px-4">{f.total_bookings}</td>
                      <td className="py-3 px-4 text-emerald-400">{f.completed_bookings}</td>
                      <td className="py-3 px-4 text-slate-400">{f.cancelled_bookings}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">${Number(f.total_revenue).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{f.avg_duration_minutes || 0} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CUSTOMER PERSONAL VIEW ================= */
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Total Parking Spend</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">
                ${Number(analytics.summary?.total_spent || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Across all completed sessions</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Completed Sessions</div>
              <div className="text-2xl font-extrabold font-mono text-indigo-400">
                {analytics.summary?.completed_reservations || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Total parking visits</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Avg Duration</div>
              <div className="text-2xl font-extrabold font-mono text-slate-200">
                {analytics.summary?.avg_duration_minutes || 0}m
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Minutes per session</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 mb-1">Cancellation Rate</div>
              <div className="text-2xl font-extrabold font-mono text-amber-400">
                {analytics.summary?.cancellation_rate_pct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {analytics.summary?.cancelled_reservations || 0} cancellations
              </div>
            </div>
          </div>

          {/* Most Frequent Facilities */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Most Frequently Used Facilities</span>
            </h3>

            {analytics.frequentFacilities?.length === 0 ? (
              <p className="text-xs text-slate-400">No completed visits recorded yet.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {analytics.frequentFacilities?.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{f.facility_name}</div>
                      <div className="text-[11px] text-slate-400">Total Spent: ${Number(f.total_spent_facility || 0).toFixed(2)}</div>
                    </div>
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold px-2.5 py-1 rounded-lg">
                      {f.visit_count} visits
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
