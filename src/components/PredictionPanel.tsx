'use client';

import React, { useState, useEffect } from 'react';
import { Clock, BarChart2, ShieldAlert, Sparkles, CheckCircle, Info, Loader2 } from 'lucide-react';

export default function PredictionPanel({ defaultFacilityId }: { defaultFacilityId?: string }) {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityId, setFacilityId] = useState(defaultFacilityId || '');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetHour, setTargetHour] = useState(new Date().getHours());
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (facilityId) {
      handlePredict();
    }
  }, [facilityId, targetDate, targetHour]);

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

  const handlePredict = async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId,
          targetDate,
          targetHour,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">Historical Availability Forecast Engine</h3>
        </div>
        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
          SQL Time Aggregation
        </span>
      </div>

      {/* Select Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Facility</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Forecast Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
          </input>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Target Hour</label>
          <select
            value={targetHour}
            onChange={(e) => setTargetHour(parseInt(e.target.value, 10))}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, '0')}:00 {h < 12 ? 'AM' : 'PM'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading & Results */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-xs space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Aggregating historical sessions...</span>
        </div>
      ) : prediction ? (
        <div className="space-y-4">
          {/* Main Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-slate-400 text-[11px] mb-1">Estimated Availability</div>
              <div
                className={`text-2xl font-bold font-mono ${
                  prediction.estimatedAvailabilityPercentage >= 60
                    ? 'text-emerald-400'
                    : prediction.estimatedAvailabilityPercentage >= 30
                    ? 'text-indigo-400'
                    : 'text-rose-400'
                }`}
              >
                {prediction.estimatedAvailabilityPercentage}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ~{prediction.expectedFreeSlots} of {prediction.totalSlots} slots free
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-slate-400 text-[11px] mb-1">Confidence Score</div>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                {prediction.confidenceScore}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {prediction.confidenceScore >= 70 ? 'High Statistical Confidence' : 'Moderate Baseline'}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-slate-400 text-[11px] mb-1">Turnover Window</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                ~{prediction.durationUntilAvailableMinutes}m
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Expected turnover time</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-slate-400 text-[11px] mb-1">Sample Count</div>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {prediction.historicalSampleCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Matching historical runs</div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Forecasting Explanation</div>
              <p className="text-slate-300 leading-relaxed">{prediction.explanation}</p>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-2">
                <span>Data Source: <strong className="text-slate-400">{prediction.dataSource}</strong></span>
                <span>&bull;</span>
                <span>{prediction.targetDayOfWeek} @ {prediction.targetHour}:00</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
