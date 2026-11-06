import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Stethoscope
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const roleLabelMap = {
    patient: { label: 'Patient Portal', icon: UserIcon },
    doctor: { label: 'Clinical Practice', icon: Stethoscope },
    admin: { label: 'Administration', icon: ShieldCheck }
  };

  const currentRole = user?.role ? roleLabelMap[user.role] : null;

  return (
    <header className="sticky top-0 z-40 bg-ivory-100/95 backdrop-blur-sm border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-6">
            <Link 
              to={user ? (user.role === 'doctor' ? '/doctor' : user.role === 'admin' ? '/admin' : '/dashboard') : '/'} 
              className="group flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-forest-800 rounded-sm"
              aria-label="MediCare Home"
            >
              <span className="w-8 h-8 rounded-md bg-forest-800 text-ivory-100 flex items-center justify-center font-serif text-lg font-bold shadow-subtle group-hover:bg-forest-700 transition">
                M
              </span>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-semibold tracking-tight text-forest-900 leading-tight">
                  MediCare
                </span>
                <span className="text-[10px] tracking-wider uppercase font-medium text-charcoal-500 -mt-0.5">
                  Health Records
                </span>
              </div>
            </Link>

            {/* Role indicator pill (when authenticated) */}
            {currentRole && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-sage-200 text-forest-900 border border-sage-300">
                <currentRole.icon size={13} aria-hidden="true" />
                <span>{currentRole.label}</span>
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {user.role === 'patient' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                        isActive('/dashboard')
                          ? 'bg-forest-800 text-ivory-100'
                          : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100'
                      }`}
                    >
                      Appointments
                    </Link>
                    <Link
                      to="/records"
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                        isActive('/records')
                          ? 'bg-forest-800 text-ivory-100'
                          : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100'
                      }`}
                    >
                      Medical Records
                    </Link>
                  </>
                )}

                {user.role === 'doctor' && (
                  <Link
                    to="/doctor"
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      isActive('/doctor')
                        ? 'bg-forest-800 text-ivory-100'
                        : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100'
                    }`}
                  >
                    Clinical Queue
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      isActive('/admin')
                        ? 'bg-forest-800 text-ivory-100'
                        : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100'
                    }`}
                  >
                    System Directory
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    isActive('/') ? 'text-forest-900 font-semibold' : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100'
                  }`}
                >
                  Overview
                </Link>
                <a
                  href="/#how-it-works"
                  className="px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:text-forest-900 hover:bg-sand-100 rounded-md transition"
                >
                  Care Model
                </a>
                <a
                  href="/#privacy"
                  className="px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:text-forest-900 hover:bg-sand-100 rounded-md transition"
                >
                  Confidentiality
                </a>
              </>
            )}
          </nav>

          {/* User Status / Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-sand-200">
                <div className="text-right">
                  <span className="block text-sm font-semibold text-charcoal-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[11px] text-charcoal-500 font-mono">
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-charcoal-600 hover:text-terracotta-700 hover:bg-terracotta-50 rounded-md transition border border-transparent hover:border-terracotta-200"
                  title="Sign out of your session"
                  aria-label="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-charcoal-700 hover:text-forest-900 hover:bg-sand-100 rounded-md transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium text-ivory-100 bg-forest-800 hover:bg-forest-700 rounded-md shadow-subtle transition"
                >
                  Patient Registration
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-charcoal-700 hover:text-forest-900 hover:bg-sand-100 transition"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-sand-200 bg-ivory-100 space-y-3">
            {user ? (
              <div className="space-y-2">
                <div className="p-3 bg-sand-100 rounded-md mb-3">
                  <div className="font-medium text-charcoal-900">{user.name}</div>
                  <div className="text-xs text-charcoal-600 font-mono">{user.email}</div>
                  {currentRole && (
                    <span className="inline-flex mt-2 items-center gap-1 px-2 py-0.5 text-xs rounded bg-sage-200 text-forest-900">
                      <currentRole.icon size={11} />
                      {currentRole.label}
                    </span>
                  )}
                </div>

                {user.role === 'patient' && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard') ? 'bg-forest-800 text-ivory-100' : 'text-charcoal-800 hover:bg-sand-100'
                      }`}
                    >
                      Appointments
                    </Link>
                    <Link
                      to="/records"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/records') ? 'bg-forest-800 text-ivory-100' : 'text-charcoal-800 hover:bg-sand-100'
                      }`}
                    >
                      Medical Records
                    </Link>
                  </>
                )}

                {user.role === 'doctor' && (
                  <Link
                    to="/doctor"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/doctor') ? 'bg-forest-800 text-ivory-100' : 'text-charcoal-800 hover:bg-sand-100'
                    }`}
                  >
                    Clinical Queue
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/admin') ? 'bg-forest-800 text-ivory-100' : 'text-charcoal-800 hover:bg-sand-100'
                    }`}
                  >
                    System Directory
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 flex items-center gap-2 pt-2 border-t border-sand-200 mt-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-charcoal-800 hover:bg-sand-100"
                >
                  Overview
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-charcoal-800 hover:bg-sand-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium bg-forest-800 text-ivory-100 text-center"
                >
                  Patient Registration
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
