import React, { useEffect } from 'react';
import { Play } from 'lucide-react';

const Splash = ({ onComplete }) => {
  useEffect(() => {
    // Show splash screen for 2.5 seconds before calling onComplete
    const timer = setTimeout(onComplete, 2500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50 opacity-80"></div>
      
      {/* Icon with Animation */}
      <div className="relative mb-8 z-10 animate-bounce-slow">
        <div className="relative bg-gradient-to-br from-indigo-600 to-teal-500 w-24 h-24 rounded-3xl flex items-center justify-center transform rotate-6 shadow-2xl shadow-indigo-200">
          <Play className="text-white fill-current w-12 h-12" />
        </div>
      </div>
      
      {/* Title */}
      <h1 className="relative z-10 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-teal-500 to-indigo-600 mb-4 tracking-tighter drop-shadow-sm">
        Viralyst
      </h1>
      
      {/* Tagline */}
      <p className="relative z-10 text-slate-500 text-sm tracking-[0.3em] uppercase font-medium">Speed. Creativity. Impact.</p>
    </div>
  );
};

export default Splash;
