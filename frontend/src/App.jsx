import React, { useState, useEffect } from 'react';
import { Play, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import OutputGallery from './components/OutputGallery.jsx';
import Splash from './components/Splash.jsx';
import { callGemini, callImagen, scrapeWebPage } from './services/api';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const [inputMode, setInputMode] = useState('text'); 
  const [inputText, setInputText] = useState('');
  const [userImage, setUserImage] = useState(null); 
  
  // Persona State
  const [personas, setPersonas] = useState([]);
  const [activePersona, setActivePersona] = useState(null);

  const [platforms, setPlatforms] = useState({ linkedin: true, twitter: true, instagram: true });
  const [additionalPrompt, setAdditionalPrompt] = useState(''); 
  const [contentTypes, setContentTypes] = useState({ official: true, thoughtLeader: true, meme: true });
  const [typeLengths, setTypeLengths] = useState({ official: '100', thoughtLeader: '100', meme: '30' });

  const [results, setResults] = useState(null); 
  const [activeTab, setActiveTab] = useState('linkedin');
  const [activeSubType, setActiveSubType] = useState('Official');

  const handleSplashComplete = () => setLoading(false);

  const togglePlatform = (p) => setPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleContentType = (t) => setContentTypes(prev => ({ ...prev, [t]: !prev[t] }));
  const setTypeLength = (type, length) => setTypeLengths(prev => ({...prev, [type]: length}));

  useEffect(() => {
    let interval;
    if (isGenerating) {
      setProgress(5);
      setStatusMessage("Initializing...");
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 8));
      }, 800);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    let sourceContent = "";
    setIsGenerating(true);
    setResults(null); 
    
    // --- 1. CONTENT ACQUISITION ---
    if (inputMode === 'link') {
        setStatusMessage("Scraping webpage...");
        const scraped = await scrapeWebPage(inputText);
        if (!scraped) { alert("Scrape failed."); setIsGenerating(false); return; }
        sourceContent = scraped; // Use full scraped text
    } else {
        // Covers 'text' and 'persona' modes (where content is manually entered)
        sourceContent = inputText;
    }
    
    // --- CRITICAL FIX: VALIDATION AND TRUNCATION ---
    const MAX_CONTEXT_LENGTH = 8000;
    
    if (!sourceContent.trim()) { 
        alert("Please provide source content."); 
        setIsGenerating(false); 
        return; 
    }

    if (sourceContent.length > MAX_CONTEXT_LENGTH) {
        setStatusMessage("Content size exceeded, truncating source text to 8,000 characters...");
        // Truncate the content to prevent API Error 400
        sourceContent = sourceContent.substring(0, MAX_CONTEXT_LENGTH);
    }
    // --- END OF CRITICAL FIX ---


    // 2. CONSTRUCT PROMPT
    setStatusMessage("Designing Content Strategy...");
    const reqs = [];
    if (contentTypes.official) reqs.push(`- "Official": ${typeLengths.official} words.`);
    if (contentTypes.thoughtLeader) reqs.push(`- "Thought Leader": ${typeLengths.thoughtLeader} words.`);
    if (contentTypes.meme) reqs.push(`- "Viral Meme": Short caption.`);

    let personaContext = "";
    if (inputMode === 'persona' && activePersona) {
        personaContext = `TARGET AUDIENCE: This content MUST be written specifically for: "${activePersona.description}". Adopt the vocabulary, values, and tone that appeals to this specific demographic cluster.`;
    }

    const sysInstruction = `You are Viralyst. Create viral social posts. Output JSON: { "linkedin": [], "twitter": [], "instagram": [] }. Card: { "type": "String", "text": "String", "meme_overlay_text": "String", "image_prompt": "String" }. ${reqs.join("\n")}. PRESERVE FACTS.`;
    const userPrompt = `SOURCE: ${sourceContent}\n${personaContext}\nNOTES: ${additionalPrompt}\nPLATFORMS: ${Object.keys(platforms).filter(k => platforms[k]).join(', ')}`;

    const result = await callGemini(userPrompt, sysInstruction);

    if (result.success) {
        const data = result.data;
        const normalized = {};
        ['linkedin', 'twitter', 'instagram'].forEach(p => { 
             normalized[p] = (data[p] || []).map(card => {
                const isMeme = card.type === 'Viral Meme';
                if (!isMeme && userImage) return { ...card, imageUrl: userImage, isImageLoading: false, source: 'user' };
                return { ...card, isImageLoading: true, source: 'ai' };
             });
        });

        setResults(normalized);
        setIsGenerating(false);

        // Image Generation Loop
        ['linkedin', 'twitter', 'instagram'].forEach(p => {
            if(normalized[p]) {
                normalized[p].forEach(async (card, index) => {
                    if (card.isImageLoading) {
                        const base64 = await callImagen(card.image_prompt);
                        setResults(prev => {
                            if (!prev) return prev;
                            const newState = { ...prev };
                            if(newState[p] && newState[p][index]) {
                                const newArr = [...newState[p]];
                                newArr[index] = { ...newArr[index], imageUrl: base64, isImageLoading: false };
                                newState[p] = newArr;
                            }
                            return newState;
                        });
                    }
                });
            }
        });
    } else {
        alert(result.error);
        setIsGenerating(false);
    }
  };

  const updateCardInState = (platform, cardType, updates) => {
      setResults(prev => {
          if (!prev) return prev;
          const newState = { ...prev };
          const index = newState[platform].findIndex(c => c.type.includes(cardType) || (cardType === 'Official' && c.type.includes('Official')));
          if (index !== -1) {
              const newArr = [...newState[platform]];
              newArr[index] = { ...newArr[index], ...updates };
              newState[platform] = newArr;
          }
          return newState;
      });
  };

  const triggerImageGen = async (platform, cardType, prompt) => {
      updateCardInState(platform, cardType, { isImageLoading: true });
      const base64 = await callImagen(prompt);
      updateCardInState(platform, cardType, { imageUrl: base64, isImageLoading: false });
  };

  if (loading) return <Splash onComplete={handleSplashComplete} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-xl flex items-center justify-center transform rotate-3 shadow-md">
            <Play className="text-white fill-current w-4 h-4" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">Viralyst</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 border border-indigo-100 font-medium text-xs">
             <Sparkles className="w-3 h-3" /> Beta
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <Sidebar 
            inputMode={inputMode} setInputMode={setInputMode}
            inputText={inputText} setInputText={setInputText}
            userImage={userImage} setUserImage={setUserImage}
            platforms={platforms} togglePlatform={togglePlatform}
            contentTypes={contentTypes} toggleContentType={toggleContentType}
            typeLengths={typeLengths} setTypeLength={setTypeLength}
            additionalPrompt={additionalPrompt} setAdditionalPrompt={setAdditionalPrompt}
            handleGenerate={handleGenerate} isGenerating={isGenerating} statusMessage={statusMessage}
            personas={personas} setPersonas={setPersonas} activePersona={activePersona} setActivePersona={setActivePersona}
        />
        <OutputGallery 
            results={results} isGenerating={isGenerating} progress={progress} statusMessage={statusMessage}
            activeTab={activeTab} setActiveTab={setActiveTab}
            activeSubType={activeSubType} setActiveSubType={setActiveSubType}
            platforms={platforms} contentTypes={contentTypes}
            updateCardInState={updateCardInState} triggerImageGen={triggerImageGen}
        />
      </main>
    </div>
  );
}
