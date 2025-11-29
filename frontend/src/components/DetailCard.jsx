import React, { useState, useRef } from 'react';
import { Copy, RefreshCw, Download, Camera, SlidersHorizontal, Loader2, Minus, Plus, Zap, Hash, Repeat, Sparkles, ImageIcon, Edit3, X as XIcon } from 'lucide-react';
import { callGeminiText, callImagen } from '../services/api';

const DetailCard = ({ data, platform, onUpdateCard, onGenImage }) => {
    const [promptEditor, setPromptEditor] = useState(false);
    // Initialize customPrompt with the generated image_prompt
    const [customPrompt, setCustomPrompt] = useState(data.image_prompt);
    
    // Refine Feature States
    const [showRefine, setShowRefine] = useState(false);
    const [refinePrompt, setRefinePrompt] = useState("");
    const [isRefining, setIsRefining] = useState(false);

    // Update customPrompt if data changes (e.g., switching tabs)
    React.useEffect(() => {
      setCustomPrompt(data.image_prompt);
    }, [data.image_prompt]);

    // File Upload Handler
    const fileInputRef = useRef(null);
    const handleUploadClick = () => fileInputRef.current?.click();
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Update the state in the parent App.jsx
                onUpdateCard({ imageUrl: reader.result, isImageLoading: false });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRefineText = async (instruction) => {
        // Simple call to refine the text based on a short instruction
        const prompt = `Refine this text: "${data.text}". Instruction: ${instruction}. Return only the rewritten text.`;
        const newText = await callGeminiText(prompt);
        if (newText) onUpdateCard({ text: newText });
    };

    const handleRefine = async () => {
        if (!refinePrompt) return;
        setIsRefining(true);
        const prompt = `Rewrite this social media post: "${data.text}". \n\nUser Instruction: "${refinePrompt}". \n\nOutput only the rewritten text.`;
        const newText = await callGeminiText(prompt);
        if (newText) {
            onUpdateCard({ text: newText });
            setShowRefine(false);
            setRefinePrompt("");
        }
        setIsRefining(false);
    };

    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = data.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row h-full max-h-[800px]">
            
            {/* LEFT: VISUALS */}
            <div className="lg:w-1/2 bg-slate-100 border-r border-slate-200 relative group p-8 flex flex-col justify-center">
                <div className="relative w-full aspect-square lg:aspect-auto lg:h-full max-h-[500px] rounded-xl overflow-hidden shadow-sm bg-slate-200">
                    {data.isImageLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                            <span className="text-xs font-bold text-indigo-600">CREATING VISUAL...</span>
                        </div>
                    ) : data.imageUrl ? (
                        <>
                            <img src={data.imageUrl} className="w-full h-full object-cover" />
                            {/* Meme Text Overlay */}
                            {data.type === 'Viral Meme' && data.meme_overlay_text && (
                                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                                    <p className="text-white font-black text-2xl uppercase text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000' }}>
                                        {data.meme_overlay_text}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">No visual generated</p>
                        </div>
                    )}

                    {/* Toolbar Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setPromptEditor(true)} className="p-2 text-white hover:bg-white/20 rounded-full" title="Edit Prompt"><SlidersHorizontal className="w-4 h-4" /></button>
                        <button onClick={() => onGenImage(customPrompt)} className="p-2 text-white hover:bg-white/20 rounded-full" title="Regenerate AI"><RefreshCw className="w-4 h-4" /></button>
                        
                        {/* Upload Button */}
                        <button onClick={handleUploadClick} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center gap-2 text-xs font-bold transition-colors">
                            <Camera className="w-4 h-4" /> Upload
                        </button>
                        
                        {data.imageUrl && (
                            <a href={data.imageUrl} download={`viralyst-${platform}.png`} className="p-2 text-white hover:bg-white/20 rounded-full" title="Download"><Download className="w-4 h-4" /></a>
                        )}
                        {/* Hidden Input */}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                </div>

                {promptEditor && (
                    <div className="absolute inset-x-4 bottom-4 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 z-20 animate-in slide-in-from-bottom-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Image Prompt</label>
                        <textarea 
                            className="w-full bg-slate-50 p-2 text-xs rounded-lg border border-slate-200 mb-2 resize-none"
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setPromptEditor(false)} className="px-3 py-1 text-xs font-bold text-slate-500">Cancel</button>
                            <button onClick={() => { onGenImage(customPrompt); setPromptEditor(false); }} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">Generate</button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: TEXT & CONTROLS */}
            <div className="lg:w-1/2 p-8 flex flex-col bg-white">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wide">{data.type}</span>
                    <div className="flex gap-1">
                        <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <textarea 
                    className="flex-1 w-full bg-transparent text-sm text-slate-700 leading-relaxed resize-none outline-none font-medium"
                    value={data.text}
                    onChange={(e) => onUpdateCard({ text: e.target.value })}
                />

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => handleRefineText("Make it shorter")}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            <Minus className="w-3 h-3" /> Shorten
                        </button>
                        <button 
                            onClick={() => handleRefineText("Make it longer and more detailed")}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Lengthen
                        </button>
                        <button 
                            onClick={() => handleRefineText("Make it punchier and more engaging")}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            <Zap className="w-3 h-3" /> Punch Up
                        </button>
                        <button 
                            onClick={() => handleRefineText("Add 5 more relevant trending hashtags")}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            <Hash className="w-3 h-3" /> More Hashtags
                        </button>
                    </div>
                    
                    {/* Custom Regenerate Option */}
                    {!showRefine ? (
                        <button 
                            onClick={() => { setShowRefine(true); setRefinePrompt(""); }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                        >
                            <Repeat className="w-3 h-3" /> Regenerate with Instructions
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-indigo-100">
                            <span className="text-xs font-bold text-slate-500">Custom Instructions:</span>
                            <textarea 
                                className="w-full bg-white border border-slate-200 text-sm text-slate-700 p-2 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                placeholder="E.g., 'Make it sound like a pirate' or 'Focus on the Q3 stats'"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowRefine(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                                <button 
                                    onClick={() => handleRefine()} // Uses the prompt in state
                                    disabled={isRefining}
                                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg flex items-center gap-1 hover:bg-indigo-700"
                                >
                                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Generate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailCard;
