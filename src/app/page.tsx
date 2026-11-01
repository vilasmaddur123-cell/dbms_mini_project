'use client';

import React from 'react';
import {
  Compass,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  Award,
  Layers,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MapPin,
  Car,
} from 'lucide-react';

export default function HomePage() {
  const quickDemoAccounts = [
    {
      role: 'System Administrator',
      email: 'admin@parkwise.com',
      password: 'Admin@123',
      badge: 'ADMIN',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
      description: 'Full administrative control, audit logs, no-show triggers, and feedback moderation.',
    },
    {
      role: 'Regular Commuter',
      email: 'john.doe@example.com',
      password: 'Password@123',
      badge: 'CUSTOMER',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      description: 'Active bookings, vehicle management, reward points ledger, and map navigation.',
    },
    {
      role: 'Accessibility Priority User',
      email: 'sarah.connor@example.com',
      password: 'Password@123',
      badge: 'PRIORITY 1',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      description: 'Highest-priority allocation, ground-floor preference, wheelchair-accessible bay scoring.',
    },
    {
      role: 'Faculty Member',
      email: 'david.miller@example.com',
      password: 'Password@123',
      badge: 'PRIORITY 2',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
      description: 'Institutional faculty priority ranking with automated waiting-list promotion.',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/40 p-8 sm:p-12 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 bg-indigo-900/60 border border-indigo-700/60 px-3 py-1 rounded-full text-xs text-indigo-300 font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>University DBMS Level 3 Project &bull; Advanced Capstone</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Parking Reservation & Navigation Platform
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            <strong className="text-indigo-400">ParkWise</strong> combines real multi-paradigm database architecture 
            (authoritative <strong className="text-white">MySQL 8.0</strong> with ACID transactions and flexible <strong className="text-white">MongoDB</strong> document stores) 
            with personalized recommendation scoring, historical availability predictions, time-based pricing, and interactive OSRM routing.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="/map"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Interactive Map</span>
            </a>
            <a
              href="/recommendations"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold rounded-xl transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Smart Recommendations</span>
            </a>
            <a
              href="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-800/80 text-sm font-semibold rounded-xl transition"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In / Demo Login</span>
            </a>
          </div>
        </div>
      </div>

      {/* Demo Accounts Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Pre-Configured Demo Credentials (Faculty & Evaluator Testing)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant logins for exploring role-based authorization, priority classes, and administrative oversight.
            </p>
          </div>
          <a
            href="/login"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickDemoAccounts.map((acc, i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-200">{acc.role}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${acc.badgeColor}`}>
                    {acc.badge}
                  </span>
                </div>
                <div className="text-xs font-mono text-indigo-300 bg-slate-900/80 p-1.5 rounded mb-1 truncate">
                  {acc.email}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  Password: <span className="text-slate-300">{acc.password}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{acc.description}</p>
              </div>

              <a
                href={`/login?email=${encodeURIComponent(acc.email)}&password=${encodeURIComponent(acc.password)}`}
                className="mt-3 text-center py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition border border-indigo-700/40"
              >
                Auto Fill & Sign In
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 13 Core Features Matrix */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Full Feature Implementation Matrix</h2>
          <p className="text-xs text-slate-400 mt-1">
            Every required numbered feature is fully integrated into real backend databases and responsive UI interfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* F1 & F5 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">1. Smart Slot Recommendation & Suitability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent 0–100 scoring evaluating price suitability, walking distance, floor level, weather cover, and user preferences with hard constraints.
            </p>
          </div>

          {/* F2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">2. Future Availability Prediction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              SQL aggregation baseline model using historical completed sessions, turnover duration, cancellations, and day-of-week patterns with statistical confidence scores.
            </p>
          </div>

          {/* F3 & F9 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">3. Priority Allocation & Waiting List</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-tiered priority hierarchy (Accessibility = 1, VIP/Faculty = 2, General = 99). Deterministic queue ordering with instant promotion notifications.
            </p>
          </div>

          {/* F4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">4. Automatic Slot Reallocation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic MySQL cancellation transaction that safely claims freed slots, matches candidate criteria, and promotes the waiting-list occupant without race conditions.
            </p>
          </div>

          {/* F6 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">6. Dynamic Time-Based Pricing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MySQL Stored Procedure <code className="text-indigo-300">sp_calculate_parking_fee</code> evaluating peak hours (morning/evening rush), weekend rules, and EV charging surcharges.
            </p>
          </div>

          {/* F7 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">7. Immutable Reward Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Points balance derived from ledger entries with database trigger preventing negative balances and unique composite constraints preventing duplicate awards.
            </p>
          </div>

          {/* F8 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">8. No-Show Detection & Appeals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated grace-period processing (15m window). Idempotent status transition with penalty recording, user warning notifications, and dispute resolution workflows.
            </p>
          </div>

          {/* F10 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">10. Concurrency Conflict Prevention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pessimistic row locking with <code className="text-indigo-300">SELECT ... FOR UPDATE</code> in MySQL transactions. Rigorously tested under simultaneous overlapping booking attempts.
            </p>
          </div>

          {/* F13, 14, 15, 16 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">13. Interactive Map & Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leaflet & OpenStreetMap integration with OSRM. Computes Route A (driving from origin to parking) and Route B (walking from parking to arbitrary destination).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
