'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, Car, Calendar, ShieldCheck, ArrowRight, X, Loader2 } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs space-x-2">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      <span>Loading Interactive Map & Navigation Layers...</span>
    </div>
  ),
});

export default function MapPage() {
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking fields
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 150 * 60000).toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<any>(null);

  const handleFacilitySelect = async (fac: any) => {
    setSelectedFacility(fac);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/slots?facilityId=${fac.id}&startTime=${new Date(startTime).toISOString()}&endTime=${new Date(endTime).toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBooking = (slot: any) => {
    setBookingSlot(slot);
    setBookingMessage(null);
    setShowBookingModal(true);
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
        setBookingMessage({ error: data.error || 'Failed to complete booking' });
      } else {
        setBookingMessage({
          success: true,
          details: data,
        });
      }
    } catch {
      setBookingMessage({ error: 'Network error communicating with reservation engine' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            <span>PES RR Campus — Parking Map & Booking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search locations within PES University Ring Road Campus, find registered parking facilities, and book available slots.
          </p>
        </div>
      </div>

      {/* Main Map Component */}
      <div className="min-h-[580px]">
        <MapComponent onSelectFacility={handleFacilitySelect} />
      </div>

      {/* Selected Facility Slot Picker Panel */}
      {selectedFacility && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-3">
            <div>
              <h2 className="text-base font-bold text-white">{selectedFacility.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFacility.address}</p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={`/recommendations?facilityId=${selectedFacility.id}`}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Run AI Suitability Score
              </a>
              <a
                href={`/predictions?facilityId=${selectedFacility.id}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg"
              >
                Forecast Availability
              </a>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Available Slots for Selected Time
            </h3>
            {loadingSlots ? (
              <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Checking slot availability in MySQL...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-slate-800/40 p-4 rounded-lg text-center text-xs text-slate-400">
                No slots currently available for this facility interval. You can{' '}
                <a href="/waitlist" className="text-indigo-400 font-semibold underline">
                  join the priority waiting list
                </a>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-center flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{s.slot_number}</div>
                      <div className="text-[10px] text-slate-400">Floor {s.floor} &bull; {s.category}</div>
                      <div className="text-xs font-mono font-semibold text-indigo-300 mt-1">
                        ${Number(s.base_hourly_rate).toFixed(2)}/hr
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenBooking(s)}
                      className="mt-3 w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold transition"
                    >
                      Reserve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && bookingSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-white mb-1">Confirm Slot Reservation</h3>
            <p className="text-xs text-slate-400 mb-4">
              {selectedFacility?.name} &bull; Slot <strong className="text-indigo-400">{bookingSlot.slot_number}</strong> (Floor {bookingSlot.floor})
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
                    View in My Bookings
                  </a>
                  <button
                    onClick={() => setShowBookingModal(false)}
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
                      <span>Verifying Row Locks & Booking...</span>
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
