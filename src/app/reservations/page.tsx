'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  QrCode,
  DollarSign,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<any>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let url = '/api/reservations';
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reservations/${id}/checkin`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ error: data.error || 'Check-in failed' });
      } else {
        setActionMessage({ success: 'Vehicle successfully checked in at parking barrier!' });
        fetchReservations();
      }
    } catch {
      setActionMessage({ error: 'Connection error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reservations/${id}/checkout`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ error: data.error || 'Check-out failed' });
      } else {
        setActionMessage({
          success: `Check-out successful! Earned ${data.pointsEarned || 50} reward points in your ledger.`,
        });
        fetchReservations();
      }
    } catch {
      setActionMessage({ error: 'Connection error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? If any waiting list candidate is queued, the slot will be automatically reallocated.')) {
      return;
    }

    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reservations/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ error: data.error || 'Cancellation failed' });
      } else {
        setActionMessage({
          success: data.message || 'Reservation cancelled and slot atomically reallocated.',
        });
        fetchReservations();
      }
    } catch {
      setActionMessage({ error: 'Connection error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <span>My Parking Reservations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Features 4 & 10: Transaction-safe active sessions, check-in barrier simulation, and atomic cancellation reallocation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {['', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs border ${
            actionMessage.error
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
          }`}
        >
          {actionMessage.error || actionMessage.success}
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading reservations from MySQL...</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-1">No reservations found</p>
          <p className="mb-4">You have no reservations matching this filter.</p>
          <a
            href="/map"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow inline-block"
          >
            Find & Book a Slot
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((r) => {
            const isConfirmed = r.status === 'CONFIRMED';
            const isCheckedIn = r.status === 'CHECKED_IN';
            const isCompleted = r.status === 'COMPLETED';
            const isCancelled = r.status === 'CANCELLED';
            const isNoShow = r.status === 'NO_SHOW';

            const statusColors: Record<string, string> = {
              CONFIRMED: 'bg-indigo-950 text-indigo-300 border-indigo-800',
              CHECKED_IN: 'bg-blue-950 text-blue-300 border-blue-800',
              COMPLETED: 'bg-emerald-950 text-emerald-300 border-emerald-800',
              CANCELLED: 'bg-slate-800 text-slate-400 border-slate-700',
              NO_SHOW: 'bg-rose-950 text-rose-300 border-rose-800',
            };

            return (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-100 text-base">{r.facility_name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{r.facility_address}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${
                        statusColors[r.status] || 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {/* Slot Details */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs mb-3 font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Slot</div>
                      <div className="font-bold text-indigo-300 text-sm">{r.slot_number}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Floor</div>
                      <div className="font-bold text-slate-200 text-sm">Floor {r.floor}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Amount</div>
                      <div className="font-bold text-emerald-400 text-sm">${Number(r.total_price).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Schedule Timings */}
                  <div className="space-y-1 text-xs text-slate-300 mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        <strong>Start:</strong> {new Date(r.start_time).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        <strong>End:</strong> {new Date(r.end_time).toLocaleString()}
                      </span>
                    </div>
                    {r.license_plate && (
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                        <Car className="w-3.5 h-3.5 text-slate-500" />
                        <span>Vehicle: {r.license_plate} ({r.make} {r.model})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    ID: {r.id}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Check In */}
                    {isConfirmed && (
                      <button
                        onClick={() => handleCheckIn(r.id)}
                        disabled={actionLoadingId === r.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
                      >
                        {actionLoadingId === r.id ? 'Processing...' : 'Simulate Check-In'}
                      </button>
                    )}

                    {/* Check Out */}
                    {isCheckedIn && (
                      <button
                        onClick={() => handleCheckOut(r.id)}
                        disabled={actionLoadingId === r.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                      >
                        {actionLoadingId === r.id ? 'Processing...' : 'Check-Out & Earn Points'}
                      </button>
                    )}

                    {/* Cancel with Atomic Reallocation */}
                    {isConfirmed && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={actionLoadingId === r.id}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition"
                      >
                        Cancel & Reallocate
                      </button>
                    )}

                    {/* Review Feedback CTA for completed */}
                    {isCompleted && (
                      <a
                        href={`/feedback?resId=${r.id}&facId=${r.facility_id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Leave Review</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
