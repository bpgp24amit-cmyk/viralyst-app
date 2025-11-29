import React from 'react';
import { Layout } from 'lucide-react';
import DetailCard from './DetailCard.jsx';
import GenerationStatus from './GenerationStatus.jsx';

export default function OutputGallery({ 
    results, isGenerating, progress, statusMessage, 
    activeTab, setActiveTab, activeSubType, setActiveSubType,
    platforms, contentTypes,
    updateCardInState, triggerImageGen 
}) {
  
  const currentPlatformCards = results ? results[activeTab] : [];
  // Find the active card based on the current platform and content type
  const activeCard = currentPlatformCards.find(c => c.type.includes(activeSubType) || (activeSubType === 'Official' && c.type.includes('Official')));

  const SubTypeTab = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}>
        {label}
    </button>
  );

  return (
    <section className="lg:col-span-8 bg-slate-50 flex flex-col min-h-0 relative">
        {/* Loading Overlay */}
        {isGenerating && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-start justify-center pt-20">
                <GenerationStatus progress={progress} statusMessage={statusMessage} />
            </div>
        )}

        {/* Empty State */}
        {!results ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Layout className="w-16 h-16 text-slate-300 mb-4" />
                <p className="font-medium">Ready to create.</p>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                {/* Level 1: Platform Tabs */}
                <div className="flex bg-white border-b border-slate-200 px-6 pt-2">
                    {['linkedin', 'twitter', 'instagram'].map(p => {
                        if (!platforms[p]) return null;
                        return (
                            <button key={p} onClick={() => setActiveTab(p)} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === p ? 'border-yellow-500 text-yellow-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                <span className="capitalize">{p}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Level 2: Content Type Tabs */}
                <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
                    {contentTypes.official && <SubTypeTab label="Official" active={activeSubType.includes('Official')} onClick={() => setActiveSubType('Official')} />}
                    {contentTypes.thoughtLeader && <SubTypeTab label="Thought Leader" active={activeSubType === 'Thought Leader'} onClick={() => setActiveSubType('Thought Leader')} />}
                    {contentTypes.meme && <SubTypeTab label="Viral Meme" active={activeSubType === 'Viral Meme'} onClick={() => setActiveSubType('Viral Meme')} />}
                </div>

                {/* Level 3: Detail View */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeCard ? (
                        <DetailCard 
                            data={activeCard} 
                            platform={activeTab}
                            onUpdateCard={(updates) => updateCardInState(activeTab, activeSubType, updates)}
                            onGenImage={(prompt) => triggerImageGen(activeTab, activeSubType, prompt || activeCard.image_prompt)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p>Content type not generated.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </section>
  );
}
