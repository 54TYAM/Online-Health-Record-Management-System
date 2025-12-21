import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Clock, Users, ChevronRight, Activity } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-slate-900/50">
        <div className="flex items-center gap-2 text-blue-500">
          <Activity size={32} />
          <span className="text-2xl font-bold tracking-tight text-white">MediCare</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 text-slate-400 font-medium hover:text-white transition">
            Log In
          </Link>
          <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <div className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 mb-2">
            🚀 The Future of Healthcare
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight">
            Healthcare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Reimagined</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
            Experience the future of medical management. Seamless appointments, secure records, and instant doctor connection—all in one premium platform.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition flex items-center gap-2">
              Book Appointment <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="px-8 py-4 border border-slate-700 text-slate-300 rounded-full font-bold hover:border-white hover:text-white transition">
              Doctor Login
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 blur-3xl transform translate-x-10 translate-y-10"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-teal-500 rounded-3xl blur opacity-30"></div>
          <img 
            src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Doctor with patient" 
            className="relative rounded-3xl shadow-2xl z-10 aspect-[4/3] object-cover ring-1 ring-white/10"
          />
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-slate-900 py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose MediCare?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We prioritize your health with cutting-edge technology and human-centric design.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Clock className="w-8 h-8 text-blue-400" />, 
                title: "Instant Booking", 
                desc: "Schedule appointments with top specialists in seconds. No waiting on hold." 
              },
              { 
                icon: <Shield className="w-8 h-8 text-emerald-400" />, 
                title: "Secure Records", 
                desc: "Your medical history involves sensitive data. We encrypt it with military-grade security." 
              },
              { 
                icon: <Users className="w-8 h-8 text-purple-400" />, 
                title: "Top Specialists", 
                desc: "Access a curated network of experienced doctors across various specializations." 
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-950 p-8 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition group">
                <div className="bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>&copy; 2025 MediCare Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-400 transition">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition">Terms of Service</a>
            <a href="#" className="hover:text-blue-400 transition">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
