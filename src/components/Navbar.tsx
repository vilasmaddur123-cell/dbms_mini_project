'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Sparkles,
  Calendar,
  Clock,
  Award,
  BarChart3,
  MessageSquare,
  ShieldAlert,
  Bell,
  LogOut,
  User,
  Car,
  Sliders,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchAuth();
    fetchNotifications();
  }, [pathname]);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navLinks = [
    { href: '/map', label: 'Map & Route', icon: Compass },
    { href: '/recommendations', label: 'Smart Slots', icon: Sparkles },
    { href: '/predictions', label: 'Forecast', icon: Clock },
    { href: '/reservations', label: 'My Bookings', icon: Calendar },
    { href: '/waitlist', label: 'Waitlist', icon: Clock },
    { href: '/rewards', label: 'Rewards', icon: Award },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  if (currentUser?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin Hub', icon: ShieldAlert });
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-indigo-400 hover:text-indigo-300">
              <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Car className="w-5 h-5" />
              </span>
              <span>ParkWise</span>
            </a>
            <span className="hidden sm:inline-block text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono font-medium">
              DBMS Level 3
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* Right Action Icons & User */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Box */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                        <span className="font-semibold text-sm">Notifications</span>
                        <span className="text-xs text-slate-400">{notifications.length} total</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                        {notifications.length === 0 ? (
                          <p className="text-slate-400 text-center py-4">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-lg border ${
                                n.is_read
                                  ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                                  : 'bg-indigo-950/40 border-indigo-800/60 text-slate-200'
                              }`}
                            >
                              <div className="font-semibold text-indigo-300 mb-0.5">{n.title}</div>
                              <div>{n.message}</div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile quick links */}
                <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-800">
                  <a
                    href="/preferences"
                    title="Slot Preferences"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  >
                    <Sliders className="w-4 h-4" />
                  </a>
                  <a
                    href="/vehicles"
                    title="My Vehicles"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  >
                    <Car className="w-4 h-4" />
                  </a>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-indigo-400 font-mono font-medium">{currentUser.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <a
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-md"
                >
                  Log In
                </a>
                <a
                  href="/register"
                  className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
                >
                  Register
                </a>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-slate-800 space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 text-indigo-400" />
                <span>{item.label}</span>
              </a>
            ))}
            {currentUser && (
              <div className="pt-2 border-t border-slate-800 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/40 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out ({currentUser.name})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
