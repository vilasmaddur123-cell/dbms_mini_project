'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  DollarSign,
  Zap,
  Accessibility,
  Umbrella,
  Loader2,
  X,
} from 'lucide-react';
import SuitabilityComparisonTable from '@/components/SuitabilityComparisonTable';

export default function RecommendationsPage() {
  const searchParams = useSearchParams();
  const initialFacilityId = searchParams.get('facilityId') || '';

  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityId, setFacilityId] = useState(initialFacilityId);
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 150 * 60000).toISOString().slice(0, 16)
  );
  const [maxBudget, setMaxBudget] = useState('');
  const [requireEv, setRequireEv] = useState(false);
  const [requireAccessible, setRequireAccessible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Booking Modal
  const [bookingSlot, setBookingSlot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<any>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (facilityId || initialFacilityId) {
      handleEvaluate();
    }
  }, [facilityId]);

  const fetchFacilities = async () => {
    try {
      const res = await fetch('/api/facilities');
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        if (data.facilities?.length > 0 && !facilityId) {
          setFacilityId(initialFacilityId || data.facilities[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: facilityId || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
          requireEv,
          requireAccessible,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Evaluation failed');
        setRecommendationResult(null);
      } else {
        setRecommendationResult(data);
      }
    } catch {
      setError('Unable to reach recommendation engine');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (slot: any) => {
    setBookingSlot(slot);
    setBookingMessage(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingMessage(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: bookingSlot.id,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingMessage({ error: data.error || 'Booking conflict' });
      } else {
        setBookingMessage({ success: true, details: data });
      }
    } catch {
      setBookingMessage({ error: 'Network failure' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const topSlot = recommendationResult?.recommended;
  const allCandidates = topSlot
    ? [topSlot, ...(recommendationResult?.alternatives || [])]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span>Smart Parking Slot Recommendation & Suitability Scoring</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Features 1 & 5: Hard constraint filtering followed by transparent 0–100 suitability ranking.
        </p>
      </div>

      {/* Constraints & Preferences Filter Bar */}
      <form onSubmit={handleEvaluate} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Evaluation Parameters & Hard Constraints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Target Facility</label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Any Facility in Bengaluru</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Arrival Time</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Departure Time</label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Max Hourly Budget ($/hr)</label>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 7.00 (Optional)"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Checkbox Constraints */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-4 text-xs text-slate-300">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireEv}
                onChange={(e) => setRequireEv(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Require EV Charging Bay (Hard Filter)</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAccessible}
                onChange={(e) => setRequireAccessible(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                <Accessibility className="w-3.5 h-3.5 text-blue-400" />
                <span>Require Accessible / ADA Bay (Hard Filter)</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center space-x-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Calculate Suitability Scores</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Top Recommended Slot Hero Card */}
      {topSlot && (
        <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full mb-3 shadow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Recommended Match</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Slot {topSlot.slot_number} &bull; Floor {topSlot.floor}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                {topSlot.facility_name} &bull; {topSlot.category} Category
              </p>

              {/* Reasons */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Why this slot is recommended:
                </span>
                {topSlot.reasons?.map((reason: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score & Reserve CTA */}
            <div className="bg-slate-900/90 border border-slate-700 p-5 rounded-2xl text-center md:w-64 shrink-0 shadow-lg">
              <div className="text-xs text-slate-400">Suitability Score</div>
              <div className="text-4xl font-extrabold font-mono text-emerald-400 my-1">
                {topSlot.suitability_score}/100
              </div>
              <div className="text-xs font-mono text-slate-300 mb-3">
                ${Number(topSlot.base_hourly_rate).toFixed(2)}/hr
              </div>

              <button
                onClick={() => handleBook(topSlot)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition flex items-center justify-center space-x-1"
              >
                <span>Reserve Recommended</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {allCandidates.length > 0 && (
        <SuitabilityComparisonTable
          candidates={allCandidates}
          onBookSlot={handleBook}
        />
      )}

      {/* Booking Confirmation Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setBookingSlot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-white mb-1">Confirm Slot Booking</h3>
            <p className="text-xs text-slate-400 mb-4">
              Slot <strong className="text-indigo-400">{bookingSlot.slot_number}</strong> (Floor {bookingSlot.floor}) &bull; Suitability Score: {bookingSlot.suitability_score}/100
            </p>

            {bookingMessage?.error && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {bookingMessage.error}
              </div>
            )}

            {bookingMessage?.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl space-y-1">
                  <div className="font-bold text-sm text-emerald-200">Reservation Confirmed!</div>
                  <div>Booking ID: <span className="font-mono">{bookingMessage.details.reservationId}</span></div>
                  <div>Total Charged: <span className="font-bold font-mono">${bookingMessage.details.totalFee?.toFixed(2)}</span></div>
                  <div>Payment Reference: <span className="font-mono">{bookingMessage.details.transactionReference}</span></div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/reservations"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg text-center"
                  >
                    Go to My Bookings
                  </a>
                  <button
                    onClick={() => setBookingSlot(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Arrival Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>

                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Hourly Rate:</span>
                    <span className="font-mono font-bold">${Number(bookingSlot.base_hourly_rate).toFixed(2)}/hr</span>
                  </div>
                  <div className="flex justify-between text-indigo-400">
                    <span>Simulated Payment:</span>
                    <span>Test Card (Simulated)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Securing Slot with Row Lock...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Book Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
