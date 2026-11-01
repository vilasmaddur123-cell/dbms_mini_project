'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Layers, Users, Plus, X, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Join form
  const [facilityId, setFacilityId] = useState('');
  const [desiredCategory, setDesiredCategory] = useState('');
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 60 * 60000).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 180 * 60000).toISOString().slice(0, 16)
  );

  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    fetchWaitlist();
    fetchFacilities();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist');
      if (res.ok) {
        const data = await res.json();
        setWaitlist(data.waitlist || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await fetch('/api/facilities');
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        if (data.facilities?.length > 0 && !facilityId) {
          setFacilityId(data.facilities[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId,
          desiredCategory: desiredCategory || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ error: data.error || 'Failed to join waitlist' });
      } else {
        setMessage({
          success: `Joined waiting list at Queue Position #${data.queuePosition} with priority ranking!`,
        });
        fetchWaitlist();
      }
    } catch {
      setMessage({ error: 'Connection error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleLeave = async (entryId: string) => {
    try {
      const res = await fetch(`/api/waitlist?id=${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWaitlist();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Layers className="w-6 h-6 text-indigo-400" />
          <span>Priority Waiting List & Queue Allocation</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Feature 9: When slots are unavailable, join deterministic FIFO + Priority queues for automatic reallocation.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs border ${
            message.error
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
          }`}
        >
          {message.error || message.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Waitlist Entries */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Your Active Queue Entries
          </h2>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Fetching queue positions...</span>
            </div>
          ) : waitlist.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>You have no active waiting list requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitlist.map((w) => (
                <div
                  key={w.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{w.facility_name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          w.status === 'OFFERED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-300 space-y-0.5">
                      <div>
                        <strong>Window:</strong> {new Date(w.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} &ndash;{' '}
                        {new Date(w.end_time).toLocaleTimeString([], { timeStyle: 'short' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Category: {w.desired_category || 'Any Available'} &bull; Priority Level: {w.priority_level}
                      </div>
                    </div>
                  </div>

                  {/* Position Badge & Leave */}
                  <div className="flex items-center space-x-4">
                    {w.queuePosition !== null && w.status === 'WAITING' && (
                      <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Queue Position</div>
                        <div className="text-xl font-extrabold font-mono text-indigo-400">
                          #{w.queuePosition}
                        </div>
                      </div>
                    )}

                    {w.status === 'WAITING' && (
                      <button
                        onClick={() => handleLeave(w.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-2 rounded-lg border border-rose-900/60"
                        title="Leave Waitlist"
                      >
                        Leave Queue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Join Queue Form */}
        <div>
          <form
            onSubmit={handleJoin}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3.5 text-xs text-slate-300"
          >
            <h3 className="font-bold text-sm text-white flex items-center space-x-1.5 pb-2 border-b border-slate-800">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Join Waiting List</span>
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">Target Facility</label>
              <select
                required
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Desired Category</label>
              <select
                value={desiredCategory}
                onChange={(e) => setDesiredCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                <option value="">Any Category</option>
                <option value="STANDARD">Standard</option>
                <option value="EV">EV Fast Charging</option>
                <option value="ACCESSIBLE">Accessible / ADA</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Start Time</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">End Time</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1"
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Queue for Slot</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
