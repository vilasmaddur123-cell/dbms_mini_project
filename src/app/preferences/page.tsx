'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, ShieldCheck, Zap, Accessibility, Umbrella, Info, Loader2 } from 'lucide-react';

export default function PreferencesPage() {
  const [preferredFloor, setPreferredFloor] = useState<number | ''>('');
  const [preferCovered, setPreferCovered] = useState(false);
  const [preferNearEntrance, setPreferNearEntrance] = useState(false);
  const [preferNearExit, setPreferNearExit] = useState(false);
  const [preferNearLift, setPreferNearLift] = useState(false);
  const [requireEv, setRequireEv] = useState(false);
  const [requireAccessible, setRequireAccessible] = useState(false);
  const [maxHourlyBudget, setMaxHourlyBudget] = useState<string>('');
  const [maxWalkingDistanceM, setMaxWalkingDistanceM] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/preferences');
      if (res.ok) {
        const data = await res.json();
        const p = data.preferences;
        if (p) {
          setPreferredFloor(p.preferred_floor !== null ? p.preferred_floor : '');
          setPreferCovered(Boolean(p.prefer_covered));
          setPreferNearEntrance(Boolean(p.prefer_near_entrance));
          setPreferNearExit(Boolean(p.prefer_near_exit));
          setPreferNearLift(Boolean(p.prefer_near_lift));
          setRequireEv(Boolean(p.require_ev));
          setRequireAccessible(Boolean(p.require_accessible));
          setMaxHourlyBudget(p.max_hourly_budget ? String(p.max_hourly_budget) : '');
          setMaxWalkingDistanceM(p.max_walking_distance_m ? String(p.max_walking_distance_m) : '');
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredFloor: preferredFloor === '' ? null : Number(preferredFloor),
          preferCovered,
          preferNearEntrance,
          preferNearExit,
          preferNearLift,
          requireEv,
          requireAccessible,
          maxHourlyBudget: maxHourlyBudget ? parseFloat(maxHourlyBudget) : null,
          maxWalkingDistanceM: maxWalkingDistanceM ? parseInt(maxWalkingDistanceM, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ error: data.error || 'Failed to save preferences' });
      } else {
        setMessage({ success: 'Preferences saved and integrated with recommendation engine!' });
      }
    } catch {
      setMessage({ error: 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          <span>Parking Slot Preferences</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Feature 11: Structured searchable preferences stored in MySQL, driving personalized suitability ranking and hard-constraint exclusion.
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

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading preferences...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-300">
          {/* Section 1: Hard Constraints */}
          <div>
            <h3 className="font-bold text-sm text-white mb-1 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Mandatory Requirements (Hard Filters)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Slots that fail these requirements are automatically excluded from recommendations.
            </p>

            <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireEv}
                  onChange={(e) => setRequireEv(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mandatory EV Fast Charging Bay</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Exclude all non-EV slots</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAccessible}
                  onChange={(e) => setRequireAccessible(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <Accessibility className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mandatory Accessible / ADA Bay</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Exclude non-accessible slots</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Soft Preferences */}
          <div>
            <h3 className="font-bold text-sm text-white mb-1 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Amenity & Location Soft Preferences</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Used to calculate the normalized 0–100 suitability score for ranking alternatives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-slate-400 mb-1">Preferred Floor Level</label>
                <select
                  value={preferredFloor}
                  onChange={(e) => setPreferredFloor(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">No Preference</option>
                  <option value="0">Ground Floor (Floor 0)</option>
                  <option value="1">Floor 1</option>
                  <option value="2">Floor 2</option>
                  <option value="-1">Basement 1 (B1)</option>
                  <option value="-2">Basement 2 (B2)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Hourly Budget Limit ($/hr)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 6.50"
                  value={maxHourlyBudget}
                  onChange={(e) => setMaxHourlyBudget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-2.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferCovered}
                  onChange={(e) => setPreferCovered(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="flex items-center space-x-1.5">
                  <Umbrella className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Prefer Weather-Protected Covered Parking</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferNearEntrance}
                  onChange={(e) => setPreferNearEntrance(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Prefer Slots Near Main Entrance Barrier</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferNearLift}
                  onChange={(e) => setPreferNearLift(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Prefer Slots Near Elevator / Lift Access</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferNearExit}
                  onChange={(e) => setPreferNearExit(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Prefer Slots Near Exit Gates</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Update Preferences</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
