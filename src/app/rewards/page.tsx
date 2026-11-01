'use client';

import React, { useState, useEffect } from 'react';
import { Award, Gift, Clock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function RewardsPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setHistory(data.history || []);
        setDiscounts(data.eligibleDiscounts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item: any) => {
    if (balance < item.pointsRequired) {
      alert(`You need at least ${item.pointsRequired} points for this voucher.`);
      return;
    }

    setRedeemLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsToRedeem: item.pointsRequired,
          description: `Redeemed ${item.pointsRequired} points for ${item.label}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ error: data.error || 'Redemption failed' });
      } else {
        setMessage({
          success: `Voucher Generated: ${data.voucherCode}! New Balance: ${data.newBalance} pts.`,
        });
        fetchRewards();
      }
    } catch {
      setMessage({ error: 'Connection error' });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Award className="w-6 h-6 text-amber-400" />
          <span>Parking Rewards & Immutable Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Feature 7: Ledger-based rewards derived from ACID-protected MySQL transactions with trigger-enforced balance guardrails.
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

      {/* Balance Hero Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Available Verified Points Balance
          </span>
          <div className="text-5xl font-extrabold font-mono text-white mt-1">
            {balance} <span className="text-xl font-normal text-slate-400">PTS</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Earn 50 points on every completed paid session &bull; 100 welcome bonus on account creation.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 space-y-1.5 shrink-0">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Database Integrity Guardrails</span>
          </div>
          <div className="text-[11px] text-slate-400">
            &bull; MySQL Trigger: <code className="text-amber-300">trg_prevent_negative_rewards</code>
          </div>
          <div className="text-[11px] text-slate-400">
            &bull; Constraint: <code className="text-amber-300">uq_reward_event (user_id, ref_id, type)</code>
          </div>
        </div>
      </div>

      {/* Redeem Catalog */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Gift className="w-4 h-4 text-indigo-400" />
          <span>Redemption Vouchers</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discounts.map((d, i) => {
            const canAfford = balance >= d.pointsRequired;
            return (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-slate-100 text-sm">{d.label}</div>
                  <div className="text-xs font-mono text-amber-400 mt-0.5">
                    Requires {d.pointsRequired} Points (${d.discountValue}.00 value)
                  </div>
                </div>

                <button
                  onClick={() => handleRedeem(d)}
                  disabled={!canAfford || redeemLoading}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold shadow transition ${
                    canAfford
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Redeem
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Immutable Transaction Ledger
          </h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
            {history.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {history.map((row) => {
                const isPositive = row.points > 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">{row.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${row.points}` : row.points} pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100">
                      {row.balance_after} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
