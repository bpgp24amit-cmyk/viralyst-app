import React, { useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, ImageIcon, Settings, Check, Sparkles, Loader2, Edit3, Users, UploadCloud } from 'lucide-react';
import { uploadExcelForClustering } from '../services/api';

export default function Sidebar({ 
  inputMode, setInputMode, inputText, setInputText, 
  handleFileChange, userImage, setUserImage,
  platforms, togglePlatform, contentTypes, toggleContentType,
  typeLengths, setTypeLength, additionalPrompt, setAdditionalPrompt,
  handleGenerate, isGenerating, statusMessage,
  personas, setPersonas, activePersona, setActivePersona
}) {
  const supportImageInputRef = useRef(null);

  const handleExcelUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // You might want to add a loading state here specifically for clustering
      const result = await uploadExcelForClustering(file);
      if (result.success && result.personas) {
          setPersonas(result.personas);
          setActivePersona(result.personas[0]);
      } else {
          alert("Clustering failed: " + (result.error || "Unknown error"));
      }
  };

  return (
    <section className="lg:col-span-4 border-r border-slate-200 bg-white flex flex-col min-h-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div> Input Hub
            </h2>
            <div className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {['text', 'link', 'persona'].map(m => (
                        <button key={m} onClick={() => setInputMode(m)} className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all ${inputMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            {m === 'text' && <FileText className="w-3 h-3" />}
                            {m === 'link' && <LinkIcon className="w-3 h-3" />}
                            {m === 'persona' && <Users className="w-3 h-3" />}
                            <span className="capitalize">{m}</span>
                        </button>
                    ))}
                </div>
                
                {inputMode === 'text' && <textarea className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-teal-500 outline-none resize-none" placeholder="Paste content here..." value={inputText} onChange={(e) => setInputText(e.target.value)} />}
                
                {inputMode === 'link' && (
                  <div className='space-y-2'>
                    <input type="url" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-teal-500 outline-none" placeholder="[https://news.com/article](https://news.com/article)..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                    <p className="text-[10px] text-slate-400">We will scrape this URL to ensure accuracy.</p>
                  </div>
                )}
                
                {inputMode === 'persona' && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-teal-700 hover:bg-teal-50 transition-colors">
                            <input type="file" accept=".xlsx" onChange={handleExcelUpload} className="hidden" id="excel-upload"/>
                            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center w-full">
                                <UploadCloud className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">Upload Customer Data (.xlsx)</span>
                            </label>
                        </div>
                        {personas.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Segment</label>
                                <select className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-teal-500" onChange={(e) => setActivePersona(personas.find(p => p.id === parseInt(e.target.value)))}>
                                    {personas.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.pct}%)</option>
                                    ))}
                                </select>
                                <div className="mt-2 p-2 bg-slate-100 rounded text-[10px] text-slate-500 italic border border-slate-200">
                                    <strong>AI Context:</strong> "{activePersona?.description?.substring(0, 100)}..."
                                </div>
                                <div className="mt-4">
                                     <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Content Source</label>
                                     <textarea className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-teal-500 outline-none resize-none" placeholder="What are we selling/announcing to them?" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Supporting Visual</label>
                    <div onClick={() => supportImageInputRef.current?.click()} className="flex items-center gap-3 p-2 rounded-xl border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all group">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                            {userImage ? <img src={userImage} className="w-full h-full object-cover" alt="Support" /> : <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">{userImage ? "Change Image" : "Upload Image"}</p>
                        </div>
                        <input type="file" ref={supportImageInputRef} className="hidden" accept="image/*" onChange={(e) => {
                           const file = e.target.files[0];
                           if (file) { const reader = new FileReader(); reader.onloadend = () => setUserImage(reader.result); reader.readAsDataURL(file); }
                        }} />
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 flex-1">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-slate-400" /> Director's Studio</h2>
            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Platforms</label>
                    <div className="flex gap-2">
                         {Object.keys(platforms).map(p => (
                            <button key={p} onClick={() => togglePlatform(p)} className={`flex-1 p-2 rounded text-xs font-bold capitalize border ${platforms[p] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {p}
                            </button>
                         ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Strategy</label>
                    <div className="space-y-2">
                        {Object.keys(contentTypes).map(t => (
                            <div key={t} className={`flex items-center justify-between p-2 rounded border ${contentTypes[t] ? 'border-teal-200 bg-teal-50' : 'border-slate-100'}`} onClick={() => toggleContentType(t)}>
                                <span className="text-xs font-bold capitalize">{t}</span>
                                {contentTypes[t] && <Check className="w-3 h-3 text-teal-600"/>}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2"><Edit3 className="w-3 h-3" /> Key Instructions</label>
                    <textarea className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-teal-500 outline-none resize-none placeholder:text-slate-400" placeholder="E.g., Be satirical..." value={additionalPrompt} onChange={(e) => setAdditionalPrompt(e.target.value)} />
                </div>
                <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {isGenerating ? statusMessage : "Generate"}
                </button>
            </div>
        </div>
    </section>
  );
}
