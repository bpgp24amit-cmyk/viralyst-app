import React from 'react';
import { Zap } from 'lucide-react';

const GenerationStatus = ({ progress, statusMessage }) => (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-900/10 border border-white flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-teal-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
            <Zap className="w-8 h-8 text-teal-600 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{statusMessage}</h3>
        
        <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden border border-slate-200 mt-4">
            <div 
                className="bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
        </div>
    </div>
);

export default GenerationStatus;
