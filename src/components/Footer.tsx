import React from 'react';
import { Database, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 mt-auto text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <span className="bg-indigo-600 text-white p-1 rounded">PW</span>
              <span>ParkWise</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              University DBMS Level 3 Capstone Project. High-concurrency Smart Parking Reservation & Navigation Platform.
            </p>
            <div className="flex items-center space-x-2 text-xs text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>ACID Transaction Safe</span>
            </div>
          </div>

          {/* Database Architecture */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Paradigm DBMS</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><strong className="text-slate-300">MySQL 8.0:</strong> Authoritative Transactions, Row Locking, Stored Procedures, Triggers, Views</li>
              <li><strong className="text-slate-300">MongoDB:</strong> Flexible Feedback, Incident Logs, Aggregation Pipelines</li>
            </ul>
          </div>

          {/* Key Algorithms */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Algorithmic Modules</span>
            </h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>Smart Slot Recommendation (0-100 Score)</li>
              <li>Historical Availability Prediction (SQL Aggregates)</li>
              <li>Priority Allocation & Auto-Reallocation</li>
              <li>Dynamic Time-Based Pricing Rules</li>
              <li>Immutable Reward Ledger with Constraints</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Navigation & Map</span>
            </h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>OpenStreetMap Tile Integration</li>
              <li>OSRM Driving Route (Origin to Parking)</li>
              <li>OSRM Walking Route (Parking to Destination)</li>
              <li>Simulated Geocoding & GPS Location</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>&copy; 2026 ParkWise Smart Parking System. Level 3 DBMS University Submission.</div>
          <div className="mt-2 sm:mt-0 font-mono text-slate-400">
            Node.js 20 &bull; Next.js 14 &bull; MySQL 8 &bull; MongoDB 7
          </div>
        </div>
      </div>
    </footer>
  );
}
