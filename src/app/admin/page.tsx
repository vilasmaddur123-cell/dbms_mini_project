'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building,
  Clock,
  MessageSquare,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'noshow' | 'incidents' | 'feedback' | 'audit'>('noshow');
  const [noshows, setNoshows] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // No-show batch trigger
  const [gracePeriod, setGracePeriod] = useState(15);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  // Feedback response
  const [replyFeedbackId, setReplyFeedbackId] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'noshow') {
        const res = await fetch('/api/admin/noshow');
        if (res.ok) {
          const data = await res.json();
          setNoshows(data.records || []);
        }
      } else if (activeTab === 'incidents') {
        const res = await fetch('/api/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        }
      } else if (activeTab === 'feedback') {
        const res = await fetch('/api/feedback');
        if (res.ok) {
          const data = await res.json();
          setFeedbacks(data.feedbacks || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerNoShow = async () => {
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/admin/noshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gracePeriodMinutes: gracePeriod }),
      });
      const data = await res.json();
      if (res.ok) {
        setTriggerResult(data.message || 'No-show processing finished successfully.');
        fetchAdminData();
      } else {
        setTriggerResult(data.error || 'Trigger failed');
      }
    } catch {
      setTriggerResult('Network error');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleResolveAppeal = async (resId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/admin/noshow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: resId,
          action: 'RESOLVE_APPEAL',
          approved,
          notes: approved ? 'Admin waived penalty after review' : 'Appeal denied due to repeated failure',
        }),
      });
      if (res.ok) fetchAdminData();
    } catch {
      // ignore
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          status: 'RESOLVED',
          notes: 'Maintenance engineering team inspected and cleared.',
        }),
      });
      if (res.ok) fetchAdminData();
    } catch {
      // ignore
    }
  };

  const handleSendFeedbackReply = async (feedbackId: string) => {
    if (!replyComment.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          responseComment: replyComment,
        }),
      });
      if (res.ok) {
        setReplyFeedbackId(null);
        setReplyComment('');
        fetchAdminData();
      }
    } catch {
      // ignore
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <span>System Administration & Operations Hub</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Server-side authorized control center for no-show enforcement, incident resolution, feedback moderation, and database audits.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('noshow')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'noshow'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>No-Show Detection & Appeals</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'incidents'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reported Incidents (MongoDB)</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'feedback'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback Moderation (MongoDB)</span>
        </button>
      </div>

      {/* TAB 1: NO-SHOW DETECTION & APPEALS */}
      {activeTab === 'noshow' && (
        <div className="space-y-6">
          {/* Action Trigger Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Execute Automated No-Show Batch Processing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Scans all reservations in <code className="text-indigo-300">CONFIRMED</code> status past arrival time + grace period. 
                Atomically marks status <code className="text-rose-400">NO_SHOW</code>, records penalty in <code className="text-slate-200">no_show_records</code>, and issues notifications.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <span>Grace Window:</span>
                <input
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value, 10))}
                  className="w-16 bg-slate-800 border border-slate-700 text-center text-slate-100 rounded px-2 py-1 font-mono font-bold"
                />
                <span>mins</span>
              </div>

              <button
                onClick={handleTriggerNoShow}
                disabled={triggerLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5"
              >
                {triggerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Trigger Processing</span>
              </button>
            </div>
          </div>

          {triggerResult && (
            <div className="p-4 bg-indigo-950/60 border border-indigo-800 text-indigo-200 text-xs rounded-xl">
              {triggerResult}
            </div>
          )}

          {/* No-Shows Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Recorded No-Show Events ({noshows.length})</h3>
            </div>

            <div className="overflow-x-auto text-xs text-slate-300">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Facility / Slot</th>
                    <th className="py-3 px-4">Detected At</th>
                    <th className="py-3 px-4">Grace Window</th>
                    <th className="py-3 px-4">Appeal Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {noshows.map((ns) => (
                    <tr key={ns.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                        {ns.user_name}
                        <span className="block text-[11px] text-slate-400 font-mono">{ns.user_email}</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">
                        {ns.facility_name} &bull; Slot {ns.slot_number}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(ns.detected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4">{ns.grace_period_minutes}m</td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            ns.appeal_status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : ns.appeal_status === 'PENDING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ns.appeal_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        {ns.appeal_status === 'PENDING' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleResolveAppeal(ns.reservation_id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleResolveAppeal(ns.reservation_id, false)}
                              className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENTS MANAGEMENT */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Reported Incidents in MongoDB ({incidents.length})</h3>
            </div>

            <div className="divide-y divide-slate-800 text-xs text-slate-300">
              {incidents.map((inc) => (
                <div key={inc._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{inc.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          inc.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1">
                      {inc.facilityName} {inc.slotNumber ? `&bull; Slot ${inc.slotNumber}` : ''} &bull; Category: {inc.category}
                    </div>

                    <p className="mt-2 text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                      {inc.description}
                    </p>
                  </div>

                  {inc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveIncident(inc._id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow shrink-0"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEEDBACK MODERATION */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Customer Reviews in MongoDB ({feedbacks.length})</h3>
            </div>

            <div className="divide-y divide-slate-800 text-xs text-slate-300">
              {feedbacks.map((f) => (
                <div key={f._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100">{f.facilityName}</div>
                      <div className="text-[11px] text-slate-400">
                        By {f.userName} &bull; Rating: {f.rating}/5 Stars &bull; Category: {f.category}
                      </div>
                    </div>

                    <button
                      onClick={() => setReplyFeedbackId(replyFeedbackId === f._id ? null : f._id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {replyFeedbackId === f._id ? 'Cancel' : 'Respond as Admin'}
                    </button>
                  </div>

                  <p className="text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                    "{f.comment}"
                  </p>

                  {f.adminResponse && (
                    <div className="bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-lg text-[11px] text-slate-300">
                      <span className="font-semibold text-indigo-300 block">Existing Admin Response:</span>
                      {f.adminResponse.comment}
                    </div>
                  )}

                  {replyFeedbackId === f._id && (
                    <div className="pt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Write official response to customer review..."
                        value={replyComment}
                        onChange={(e) => setReplyComment(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => handleSendFeedbackReply(f._id)}
                        disabled={replyLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        {replyLoading ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
