'use client';

import React, { useState, useEffect } from 'react';
import { Car, Plus, Trash2, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [isEv, setIsEv] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate, make, model, color, isEv }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ error: data.error || 'Failed to add vehicle' });
      } else {
        setMessage({ success: 'Vehicle registered successfully!' });
        setLicensePlate('');
        setMake('');
        setModel('');
        setColor('');
        setIsEv(false);
        fetchVehicles();
      }
    } catch {
      setMessage({ error: 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchVehicles();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Car className="w-6 h-6 text-indigo-400" />
          <span>Vehicle Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered vehicles used for barrier sensor simulation and automated license plate entry.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Registered Fleet
          </h2>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Loading vehicles...</span>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              <Car className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No vehicles registered yet. Add your vehicle using the form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-base text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {v.license_plate}
                      </span>
                      {v.is_ev ? (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 font-semibold">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>EV</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-300 font-semibold">
                      {v.make} {v.model}
                    </div>
                    {v.color && (
                      <div className="text-[11px] text-slate-400 mt-0.5">Color: {v.color}</div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 p-1 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Vehicle Form */}
        <div>
          <form
            onSubmit={handleAddVehicle}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 text-xs text-slate-300"
          >
            <h3 className="font-bold text-sm text-white flex items-center space-x-1.5 pb-2 border-b border-slate-800">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Vehicle</span>
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">License Plate Number</label>
              <input
                type="text"
                required
                placeholder="e.g. KA-01-AB-1234"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 uppercase font-mono rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Make</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corolla"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Color (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Silver Grey"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>

            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isEv}
                onChange={(e) => setIsEv(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>This is an Electric Vehicle (EV)</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Register Vehicle</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
