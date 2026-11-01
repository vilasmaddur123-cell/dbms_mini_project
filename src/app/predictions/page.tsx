'use client';

import React from 'react';
import { Clock, Database, TrendingUp, Info, ShieldCheck } from 'lucide-react';
import PredictionPanel from '@/components/PredictionPanel';

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Clock className="w-6 h-6 text-indigo-400" />
          <span>Future Parking Availability Prediction</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Feature 2: Transparent, data-driven availability forecasting derived from historical MySQL session turnover patterns.
        </p>
      </div>

      {/* Main Interactive Forecast Panel */}
      <PredictionPanel />

      {/* DBMS Methodology Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-semibold">
            <Database className="w-4 h-4" />
            <span>SQL Aggregation Baseline</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Aggregates past sessions filtered by facility, <code className="text-indigo-300">DAYOFWEEK(start_time)</code>, and target hour window. 
            Calculates average session length (<code className="text-indigo-300">TIMESTAMPDIFF(MINUTE)</code>) to estimate slot turnover.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Turnover & Confidence</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Confidence scores scale dynamically with sample volume. Forecasts incorporate cancellation rates and no-show probabilities to prevent over-optimistic availability expectations.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Integrity Guardrail</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict policy: A prediction is never presented as a guarantee, and availability estimates never bypass the authoritative MySQL pessimistic booking lock transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
