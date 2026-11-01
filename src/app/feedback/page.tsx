'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Star,
  AlertTriangle,
  Send,
  CheckCircle2,
  Building,
  ShieldCheck,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const prefillResId = searchParams.get('resId') || '';
  const prefillFacId = searchParams.get('facId') || '';

  const [facilities, setFacilities] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form
  const [reservationId, setReservationId] = useState(prefillResId);
  const [facilityId, setFacilityId] = useState(prefillFacId);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('cleanliness');
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<any>(null);

  // Incident Form
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentFacId, setIncidentFacId] = useState('');
  const [incidentSlot, setIncidentSlot] = useState('');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentCategory, setIncidentCategory] = useState('maintenance');
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentMessage, setIncidentMessage] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, fbRes, incRes] = await Promise.all([
        fetch('/api/facilities'),
        fetch('/api/feedback'),
        fetch('/api/incidents'),
      ]);

      if (facRes.ok) {
        const facData = await facRes.json();
        setFacilities(facData.facilities || []);
        if (facData.facilities?.length > 0 && !facilityId) {
          setFacilityId(facData.facilities[0].id);
          setIncidentFacId(facData.facilities[0].id);
        }
      }

      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFeedbacks(fbData.feedbacks || []);
        setAnalytics(fbData.analytics || null);
      }

      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData.incidents || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewMessage(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          facilityId,
          rating,
          category,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewMessage({ error: data.error || 'Failed to submit review' });
      } else {
        setReviewMessage({ success: data.message || 'Feedback saved in MongoDB!' });
        setComment('');
        fetchData();
      }
    } catch {
      setReviewMessage({ error: 'Connection error' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentSubmitting(true);
    setIncidentMessage(null);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: incidentFacId,
          slotNumber: incidentSlot || undefined,
          title: incidentTitle,
          category: incidentCategory,
          severity: incidentSeverity,
          description: incidentDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIncidentMessage({ error: data.error || 'Failed to submit incident' });
      } else {
        setIncidentMessage({ success: 'Incident report filed in MongoDB!' });
        setIncidentTitle('');
        setIncidentDesc('');
        setIncidentSlot('');
        fetchData();
      }
    } catch {
      setIncidentMessage({ error: 'Connection error' });
    } finally {
      setIncidentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <span>User Feedback & Incident Management (MongoDB)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Feature 17: Multi-paradigm integration storing flexible reviews and operational incident logs in MongoDB with real aggregation pipelines.
        </p>
      </div>

      {/* Aggregation Insights Card */}
      {analytics?.ratings && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="text-center p-3 bg-slate-800/80 rounded-2xl border border-slate-700 min-w-[100px]">
              <div className="text-3xl font-extrabold font-mono text-amber-400">
                {(analytics.ratings.averageRating || 0).toFixed(1)}
              </div>
              <div className="flex items-center justify-center text-amber-400 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(analytics.ratings.averageRating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {analytics.ratings.totalCount} reviews
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>MongoDB Rating Aggregation Pipeline</span>
              </div>
              <div className="text-[11px] text-slate-400">
                5 Stars: {analytics.ratings.stars5} &bull; 4 Stars: {analytics.ratings.stars4} &bull; 3 Stars: {analytics.ratings.stars3}
              </div>
              <div className="text-[11px] text-slate-400">
                Common categories: {analytics.categoryStats?.map((c: any) => `${c._id} (${c.count})`).join(', ') || 'N/A'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowIncidentForm(!showIncidentForm)}
            className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold transition shrink-0 flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{showIncidentForm ? 'Close Incident Form' : 'Report Parking Incident'}</span>
          </button>
        </div>
      )}

      {/* Incident Form (Conditional) */}
      {showIncidentForm && (
        <form
          onSubmit={handleIncidentSubmit}
          className="bg-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-sm space-y-4 text-xs text-slate-300"
        >
          <h2 className="font-bold text-sm text-rose-400 flex items-center space-x-1.5 pb-2 border-b border-slate-800">
            <AlertTriangle className="w-4 h-4" />
            <span>Report Parking Bay or Barrier Incident</span>
          </h2>

          {incidentMessage && (
            <div
              className={`p-3 rounded-lg ${
                incidentMessage.error ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
              }`}
            >
              {incidentMessage.error || incidentMessage.success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Facility</label>
              <select
                required
                value={incidentFacId}
                onChange={(e) => setIncidentFacId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Slot Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. G-02, B1-04"
                value={incidentSlot}
                onChange={(e) => setIncidentSlot(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Severity</label>
              <select
                value={incidentSeverity}
                onChange={(e) => setIncidentSeverity(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                <option value="LOW">Low (Cosmetic/Minor)</option>
                <option value="MEDIUM">Medium (Equipment Delay)</option>
                <option value="HIGH">High (Blocked Slot)</option>
                <option value="CRITICAL">Critical (Barrier Failure)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Incident Title</label>
            <input
              type="text"
              required
              placeholder="e.g. EV charger cable connector loose"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Detailed Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue observed in the parking facility..."
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={incidentSubmitting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow transition flex items-center space-x-1.5"
          >
            {incidentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Incident Report</span>}
          </button>
        </form>
      )}

      {/* Submit Feedback Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <form
            onSubmit={handleReviewSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3.5 text-xs text-slate-300"
          >
            <h2 className="font-bold text-sm text-white flex items-center space-x-1.5 pb-2 border-b border-slate-800">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Leave Parking Review</span>
            </h2>

            {reviewMessage && (
              <div
                className={`p-3 rounded-lg ${
                  reviewMessage.error ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                {reviewMessage.error || reviewMessage.success}
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Reservation ID (Authoritative Link)</label>
              <input
                type="text"
                required
                placeholder="e.g. res-hist-01"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Facility</label>
              <select
                required
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Star Rating (1 to 5)</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono font-bold text-slate-200 ml-2">{rating} Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                <option value="cleanliness">Cleanliness & Lighting</option>
                <option value="accessibility">Accessibility & Ramps</option>
                <option value="availability">Availability & EV Charging</option>
                <option value="pricing">Pricing & Rates</option>
                <option value="security">Security & Surveillance</option>
                <option value="booking">Booking App & Gates</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Written Review</label>
              <textarea
                required
                rows={3}
                placeholder="Share your experience parking at this facility..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
            >
              {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Post Verified Review</span>
            </button>
          </form>
        </div>

        {/* Feedbacks Stream from MongoDB */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Verified Customer Reviews ({feedbacks.length})
          </h2>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {feedbacks.map((f) => (
              <div
                key={f._id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-100">{f.facilityName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      By <strong className="text-slate-300">{f.userName}</strong> &bull; {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-mono font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{f.rating}.0</span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                  "{f.comment}"
                </p>

                {/* Admin Response Box if present */}
                {f.adminResponse && (
                  <div className="bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-lg text-[11px] text-slate-300">
                    <span className="font-semibold text-indigo-300 block mb-0.5">
                      Facility Manager Response:
                    </span>
                    {f.adminResponse.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
