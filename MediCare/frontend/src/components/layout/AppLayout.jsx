import React from 'react';
import Navbar from '../navigation/Navbar';
import { ShieldCheck } from 'lucide-react';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 text-charcoal-800 font-sans selection:bg-sage-200 selection:text-forest-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {children}
      </main>

      <footer className="mt-auto border-t border-sand-200 bg-ivory-50 text-charcoal-600 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-charcoal-700">
            <ShieldCheck size={16} className="text-forest-700" />
            <span className="font-medium text-forest-900">MediCare System</span>
            <span className="text-sand-400">•</span>
            <span>Role-Based Access Control & Clinical Record Management</span>
          </div>
          <div className="text-charcoal-500">
            Records and consultations are restricted to verified patients, assigned practitioners, and designated administrators.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
