import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-ivory-100 text-charcoal-800 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 bg-sand-200 text-forest-800 rounded-xl flex items-center justify-center mb-6 border border-sand-300 shadow-subtle">
        <FileQuestion size={32} />
      </div>
      <span className="text-xs font-mono font-semibold text-forest-800 uppercase tracking-widest mb-1">Error 404</span>
      <h1 className="font-serif font-editorial text-3xl sm:text-4xl font-semibold text-forest-900 mb-3 tracking-tight">
        Document Not Found
      </h1>
      <p className="text-charcoal-600 max-w-md text-sm leading-relaxed mb-8">
        The clinical record, appointment queue, or resource you requested is unavailable or has been relocated within the directory.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-800 hover:bg-forest-700 text-ivory-100 font-medium text-sm rounded-md shadow-subtle transition"
      >
        <ArrowLeft size={16} /> Return to System Overview
      </Link>
    </div>
  );
};

export default NotFound;
