'use client';

import React from 'react';
import {
  CheckCircle2,
  Zap,
  Accessibility,
  Umbrella,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export interface ComparisonSlot {
  id: string;
  slot_number: string;
  floor: number;
  category: string;
  is_covered: number | boolean;
  near_entrance: number | boolean;
  near_exit: number | boolean;
  near_lift: number | boolean;
  is_ev_charging: number | boolean;
  is_accessible: number | boolean;
  distance_to_entrance_m: number;
  distance_to_exit_m: number;
  base_hourly_rate: number;
  suitability_score?: number;
  score_breakdown?: Record<string, number>;
  reasons?: string[];
  estimated_cost?: number;
  walking_distance_to_dest_m?: number;
  facility_name?: string;
}

export default function SuitabilityComparisonTable({
  candidates,
  onBookSlot,
}: {
  candidates: ComparisonSlot[];
  onBookSlot: (slot: ComparisonSlot) => void;
}) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <p>No slot candidates available for comparison.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Parking Suitability Score Comparison Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked using normalized 0-100 scoring across pricing, floor preference, proximity, and amenities.
          </p>
        </div>
        <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-full font-mono">
          {candidates.length} Evaluated
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Rank / Slot</th>
              <th className="py-3 px-4">Suitability Score</th>
              <th className="py-3 px-4">Floor / Category</th>
              <th className="py-3 px-4">Amenities & Features</th>
              <th className="py-3 px-4">Proximity</th>
              <th className="py-3 px-4">Est. Hourly</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {candidates.map((slot, index) => {
              const score = slot.suitability_score || 50;
              const isTopRanked = index === 0;

              return (
                <tr
                  key={slot.id}
                  className={`hover:bg-slate-800/40 transition ${
                    isTopRanked ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Slot Number & Top Badge */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isTopRanked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{slot.slot_number}</div>
                        {isTopRanked && (
                          <span className="inline-flex items-center space-x-1 text-[10px] text-indigo-400 font-semibold">
                            <Sparkles className="w-3 h-3" />
                            <span>Top Recommendation</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Suitability Score Bar */}
                  <td className="py-3 px-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-100">{score}/100</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            score >= 80
                              ? 'text-emerald-400'
                              : score >= 60
                              ? 'text-indigo-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {score >= 80 ? 'Optimal' : score >= 60 ? 'Suitable' : 'Fair'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score >= 80
                              ? 'bg-emerald-500'
                              : score >= 60
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Floor & Category */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">Floor {slot.floor}</div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                      {slot.category}
                    </span>
                  </td>

                  {/* Amenities */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {slot.is_covered ? (
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center space-x-1 text-[10px]">
                          <Umbrella className="w-3 h-3 text-cyan-400" />
                          <span>Covered</span>
                        </span>
                      ) : null}
                      {slot.is_ev_charging ? (
                        <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded flex items-center space-x-1 text-[10px]">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>EV Fast</span>
                        </span>
                      ) : null}
                      {slot.is_accessible ? (
                        <span className="bg-blue-950/60 text-blue-300 border border-blue-800 px-2 py-0.5 rounded flex items-center space-x-1 text-[10px]">
                          <Accessibility className="w-3 h-3 text-blue-400" />
                          <span>Accessible</span>
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Proximity */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    <div>Entrance: {slot.distance_to_entrance_m}m</div>
                    <div className="text-slate-500">Exit: {slot.distance_to_exit_m}m</div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-100 text-sm">
                      ${Number(slot.base_hourly_rate).toFixed(2)}/hr
                    </div>
                    {slot.estimated_cost && (
                      <div className="text-[10px] text-slate-400">Est. Total: ${slot.estimated_cost}</div>
                    )}
                  </td>

                  {/* CTA */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onBookSlot(slot)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1 ${
                        isTopRanked
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>Reserve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
