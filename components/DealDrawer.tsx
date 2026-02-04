import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Deal, DealStage } from '../types';
import { X, ExternalLink, Copy, Phone, Mail, Star, Calendar, MessageSquare, Info, ShieldCheck, Zap, Sparkles, Wand2, AlertCircle, Trash2, Bed, Bath, Pencil } from 'lucide-react';
import { Button, Select, Badge, Label, Card, Input } from './ui/BaseComponents';
import { AssignmentAnalyzer, SellerFinanceAnalyzer, SubToAnalyzer } from './Analyzers';
import { analyzeListingMotivation, generateAgentScript, generateCashBuyerScript } from '../services/ai';

interface DealDrawerProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onEditDeal: (deal: Deal) => void;
}

export const DealDrawer: React.FC<DealDrawerProps> = ({ deal, isOpen, onClose, onUpdateDeal, onDeleteDeal, onEditDeal }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'analyze' | 'intelligence'>('details');
  const [analyzeStrategy, setAnalyzeStrategy] = useState<'assignment' | 'sellerfin' | 'subto'>('assignment');
  const [noteInput, setNoteInput] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [outreachScript, setOutreachScript] = useState<string | null>(null);
  const [scriptAudience, setScriptAudience] = useState<'agent' | 'cashBuyer'>('agent');
  const [agentScenario, setAgentScenario] = useState<'Cold Call' | 'Follow-Up' | 'Price Drop' | 'Offer Push'>('Cold Call');
  const [buyerScenario, setBuyerScenario] = useState<'New Deal Alert' | 'Price Update' | 'Final Call' | 'Portfolio Fit'>('New Deal Alert');
  const [cashBuyerName, setCashBuyerName] = useState('');
  const [cashBuyerBuyBox, setCashBuyerBuyBox] = useState('');
  const [cashBuyerBudget, setCashBuyerBudget] = useState('');
  const [cashBuyerTimeline, setCashBuyerTimeline] = useState('');
  const [cashBuyerPof, setCashBuyerPof] = useState('');
  const [agentNameInput, setAgentNameInput] = useState('');
  const [agentPhoneInput, setAgentPhoneInput] = useState('');
  const [agentEmailInput, setAgentEmailInput] = useState('');

  useEffect(() => {
    setAgentNameInput(deal?.agentName || '');
    setAgentPhoneInput(deal?.agentPhone || '');
    setAgentEmailInput(deal?.agentEmail || '');
  }, [deal?.id, deal?.agentName, deal?.agentPhone, deal?.agentEmail]);

  useEffect(() => {
    setOutreachScript(null);
    setAiError(null);
    setAiAnalysis(null);
    setScriptAudience('agent');
    setAgentScenario('Cold Call');
    setBuyerScenario('New Deal Alert');
    setCashBuyerName('');
    setCashBuyerBuyBox('');
    setCashBuyerBudget('');
    setCashBuyerTimeline('');
    setCashBuyerPof('');
  }, [deal?.id]);

  if (!deal) return null;

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    const result = await analyzeListingMotivation(deal);
    if (!result) {
      setAiAnalysis(null);
      setAiError('AI analysis failed. Confirm your Gemini API key and model access, then try again.');
    } else {
      setAiAnalysis(result);
    }
    setIsAnalyzing(false);
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    let script: string;

    if (scriptAudience === 'agent') {
      script = await generateAgentScript(deal, `${analyzeStrategy} | ${agentScenario}`);
    } else {
      script = await generateCashBuyerScript(deal, {
        scenario: buyerScenario,
        buyerName: cashBuyerName,
        buyBox: cashBuyerBuyBox,
        budget: cashBuyerBudget,
        closingTimeline: cashBuyerTimeline,
        proofOfFunds: cashBuyerPof,
      });
    }

    setOutreachScript(script);
    setIsGeneratingScript(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateDeal({ ...deal, stage: e.target.value as DealStage });
  };

  const handleAddNote = () => {
      if(!noteInput.trim()) return;
      const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newNote = `[${timestamp}] ${noteInput}\n${deal.notes || ''}`;
      onUpdateDeal({ ...deal, notes: newNote });
      setNoteInput('');
  };

  const logEntries = (deal.notes || '')
    .split('\n')
    .map(note => note.trim())
    .filter(Boolean)
    .map((note, index) => {
      const match = note.match(/^\[([^\]]+)\]\s*(.*)$/);
      return {
        id: `${deal.id}-log-${index}`,
        timestamp: match?.[1] || 'Update',
        message: match?.[2] || note,
      };
    });

  const handleSaveAgentDetails = () => {
    onUpdateDeal({
      ...deal,
      agentName: agentNameInput.trim(),
      agentPhone: agentPhoneInput.trim(),
      agentEmail: agentEmailInput.trim(),
    });
  };

  const handleDeleteDeal = () => {
    const confirmed = window.confirm(`Delete listing at ${deal.address}? This cannot be undone.`);
    if (!confirmed) return;
    onDeleteDeal(deal.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 z-40 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header Area */}
            <div className="px-8 py-8 flex justify-between items-start bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        deal.dom >= 90 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-brand-600 bg-brand-50 border-brand-100'
                    }`}>
                        {deal.dom} Days Marketed
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deal.status} Listing</div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 leading-[1.1] mb-2">{deal.address}</h2>
                <div className="flex items-center text-slate-500 font-medium text-sm">
                   {deal.city}, {deal.state} {deal.zip}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateDeal({...deal, isFavorite: !deal.isFavorite})}
                  className={`p-3 rounded-2xl transition-all border ${deal.isFavorite ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                    <Star className={`h-5 w-5 ${deal.isFavorite ? 'fill-amber-500' : ''}`} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header / Quick Control */}
            <div className="px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage</span>
                    <Select value={deal.stage} onChange={handleStageChange} className="w-40 text-xs h-9 rounded-xl border-slate-200 bg-slate-50 font-bold">
                        {Object.values(DealStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                 </div>
                 <div className="flex gap-4">
                    <a href={deal.url} target="_blank" rel="noreferrer" className="flex items-center text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-2 rounded-xl border border-brand-100">
                        <ExternalLink size={14} className="mr-2" /> Open Listing
                    </a>
                    <Button variant="outline" size="sm" onClick={() => onEditDeal(deal)} className="rounded-xl px-3 h-9">
                      <Pencil size={14} className="mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteDeal} className="rounded-xl px-3 h-9">
                      <Trash2 size={14} className="mr-2" /> Delete
                    </Button>
                 </div>
            </div>

            {/* Modern Tabs */}
            <div className="flex bg-slate-50/50 p-2 mx-8 my-6 rounded-2xl border border-slate-100">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Info size={16} /> Summary
              </button>
              <button
                onClick={() => setActiveTab('analyze')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'analyze' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Zap size={16} /> Exit
              </button>
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'intelligence' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Sparkles size={16} /> Intelligence
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-8 pb-12">
              {activeTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Visual Stats Row */}
                   <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">List Price</div>
                            <div className="font-black text-2xl text-slate-900">${deal.price.toLocaleString()}</div>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Config</div>
                            <div className="flex items-center gap-6 text-slate-700">
                              <span className="inline-flex items-center gap-1.5 text-lg font-bold">
                                <Bed size={16} className="text-slate-400" />
                                {deal.beds}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-lg font-bold">
                                <Bath size={16} className="text-slate-400" />
                                {deal.baths}
                              </span>
                            </div>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Size</div>
                            <div className="font-black text-2xl text-slate-900">{deal.sqft.toLocaleString()} sqft</div>
                        </div>
                   </div>

                   {/* Agent Details */}
                   <div className="bg-slate-50/60 p-6 rounded-[1.5rem] border border-slate-100">
                       <div className="flex items-center justify-between gap-3 mb-4">
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Agent Details</h3>
                           <Button size="sm" onClick={handleSaveAgentDetails} className="rounded-xl h-9 px-4">
                               Save Agent
                           </Button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           <div>
                               <Label className="text-slate-400">Name</Label>
                               <Input
                                 value={agentNameInput}
                                 onChange={(e) => setAgentNameInput(e.target.value)}
                                 placeholder="Agent name"
                                 className="h-10 rounded-xl"
                               />
                           </div>
                           <div>
                               <Label className="text-slate-400">Phone</Label>
                               <Input
                                 value={agentPhoneInput}
                                 onChange={(e) => setAgentPhoneInput(e.target.value)}
                                 placeholder="Agent phone"
                                 className="h-10 rounded-xl"
                               />
                           </div>
                           <div>
                               <Label className="text-slate-400">Email</Label>
                               <Input
                                 value={agentEmailInput}
                                 onChange={(e) => setAgentEmailInput(e.target.value)}
                                 placeholder="Agent email"
                                 className="h-10 rounded-xl"
                               />
                           </div>
                       </div>
                       <div className="flex flex-wrap gap-3 mt-4">
                           {deal.agentPhone && (
                             <a
                               href={`tel:${deal.agentPhone}`}
                               className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg"
                             >
                               <Phone size={12} /> Call Agent
                             </a>
                           )}
                           {deal.agentEmail && (
                             <a
                               href={`mailto:${deal.agentEmail}`}
                               className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg"
                             >
                               <Mail size={12} /> Email Agent
                             </a>
                           )}
                       </div>
                   </div>

                   {/* Internal Log */}
                    <div className="bg-slate-950 rounded-[2rem] p-8 text-white border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                <MessageSquare size={16} /> Internal Log
                            </h3>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {logEntries.length} Entries
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            New Update
                          </div>
                          <textarea
                              className="w-full h-24 p-4 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 placeholder:text-slate-500 font-medium text-slate-100 resize-none"
                              placeholder="Add a new activity update..."
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-[10px] text-slate-500 font-bold tracking-wide">
                              {noteInput.trim().length} chars
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleAddNote}
                              disabled={!noteInput.trim()}
                              className="bg-brand-500 hover:bg-brand-400 text-brand-950 font-black rounded-xl px-6 h-10 border-none shadow-lg shadow-brand-950/20"
                            >
                              Add Entry
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                            {logEntries.length === 0 ? (
                              <div className="text-center py-10 px-4 text-slate-500 text-xs font-bold uppercase tracking-widest bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl">
                                No activity yet
                              </div>
                            ) : (
                              logEntries.map((entry) => (
                                <div key={entry.id} className="relative pl-5">
                                  <div className="absolute left-0 top-2.5 h-2.5 w-2.5 rounded-full bg-brand-400 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                                  <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-2">
                                      <Calendar size={12} /> {entry.timestamp}
                                    </div>
                                    <div className="text-xs leading-relaxed text-slate-100">
                                      {entry.message}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'analyze' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                        {(['assignment', 'sellerfin', 'subto'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setAnalyzeStrategy(s)}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${analyzeStrategy === s ? 'bg-white text-slate-950 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {s === 'sellerfin' ? 'Seller Finance' : s === 'subto' ? 'Subject-To' : 'Assignment'}
                            </button>
                        ))}
                    </div>
                    
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                        {analyzeStrategy === 'assignment' && <AssignmentAnalyzer deal={deal} onUpdate={onUpdateDeal} />}
                        {analyzeStrategy === 'sellerfin' && <SellerFinanceAnalyzer deal={deal} onUpdate={onUpdateDeal} />}
                        {analyzeStrategy === 'subto' && <SubToAnalyzer deal={deal} onUpdate={onUpdateDeal} />}
                    </div>
                </div>
              )}

              {activeTab === 'intelligence' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Card className="p-8 border-none shadow-xl shadow-indigo-100 ring-1 ring-indigo-200 bg-gradient-to-br from-indigo-50/30 to-white">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="text-indigo-500" /> AI Market Intelligence
                            </h3>
                            {!aiAnalysis && (
                                <Button size="sm" onClick={handleAiAnalysis} isLoading={isAnalyzing} className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-200 rounded-xl px-6">
                                    Analyze Remarks
                                </Button>
                            )}
                        </div>

                        {aiError && (
                            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700">
                                {aiError}
                            </div>
                        )}

                        {aiAnalysis ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                        <div className="text-[10px] font-black uppercase opacity-60">Motivation</div>
                                        <div className="text-2xl font-black">{aiAnalysis.motivationScore}/10</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2">
                                            {aiAnalysis.triggers?.map((t: string) => (
                                                <Badge key={t} variant="info" className="bg-indigo-100 text-indigo-700 border-indigo-200">{t}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                                    <Label className="text-indigo-400">Suggested Agent Approach</Label>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                                        "{aiAnalysis.suggestedApproach}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-rose-400">Potential Red Flags</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {aiAnalysis.riskFactors?.map((r: string) => (
                                            <div key={r} className="flex items-center gap-2 text-[11px] font-bold text-rose-600">
                                                <AlertCircle size={14} /> {r}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <Wand2 className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest italic">Ready for Deep Scanning</p>
                            </div>
                        )}
                    </Card>

                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Outreach Scripts</h3>
                                <Button
                                  size="sm"
                                  onClick={handleGenerateScript}
                                  isLoading={isGeneratingScript}
                                  className="bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl px-4 h-9 text-[10px]"
                                >
                                  <Sparkles size={12} className="mr-1" />
                                  {scriptAudience === 'agent' ? 'Generate Agent Script' : 'Generate Buyer Script'}
                                </Button>
                            </div>

                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                              <button
                                onClick={() => setScriptAudience('agent')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                  scriptAudience === 'agent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Listing Agent
                              </button>
                              <button
                                onClick={() => setScriptAudience('cashBuyer')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                  scriptAudience === 'cashBuyer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Cash Buyer
                              </button>
                            </div>

                            {scriptAudience === 'agent' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Scenario</Label>
                                  <Select
                                    value={agentScenario}
                                    onChange={(e) => setAgentScenario(e.target.value as 'Cold Call' | 'Follow-Up' | 'Price Drop' | 'Offer Push')}
                                    className="h-10 rounded-xl text-xs bg-slate-50 border-slate-200"
                                  >
                                    <option value="Cold Call">Cold Call</option>
                                    <option value="Follow-Up">Follow-Up</option>
                                    <option value="Price Drop">Price Drop</option>
                                    <option value="Offer Push">Offer Push</option>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Strategy Context</Label>
                                  <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-xs font-bold text-slate-700">
                                    {analyzeStrategy === 'sellerfin' ? 'Seller Finance' : analyzeStrategy === 'subto' ? 'Subject-To' : 'Assignment'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Scenario</Label>
                                  <Select
                                    value={buyerScenario}
                                    onChange={(e) => setBuyerScenario(e.target.value as 'New Deal Alert' | 'Price Update' | 'Final Call' | 'Portfolio Fit')}
                                    className="h-10 rounded-xl text-xs bg-slate-50 border-slate-200"
                                  >
                                    <option value="New Deal Alert">New Deal Alert</option>
                                    <option value="Price Update">Price Update</option>
                                    <option value="Final Call">Final Call</option>
                                    <option value="Portfolio Fit">Portfolio Fit</option>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Buyer Name</Label>
                                  <Input value={cashBuyerName} onChange={(e) => setCashBuyerName(e.target.value)} placeholder="Buyer contact" className="h-10 rounded-xl" />
                                </div>
                                <div>
                                  <Label>Buy Box</Label>
                                  <Input value={cashBuyerBuyBox} onChange={(e) => setCashBuyerBuyBox(e.target.value)} placeholder="e.g. 3/2, 1200+ sqft, Phoenix" className="h-10 rounded-xl" />
                                </div>
                                <div>
                                  <Label>Budget</Label>
                                  <Input value={cashBuyerBudget} onChange={(e) => setCashBuyerBudget(e.target.value)} placeholder="e.g. $200k-$350k" className="h-10 rounded-xl" />
                                </div>
                                <div>
                                  <Label>Close Timeline</Label>
                                  <Input value={cashBuyerTimeline} onChange={(e) => setCashBuyerTimeline(e.target.value)} placeholder="e.g. 7-14 days" className="h-10 rounded-xl" />
                                </div>
                                <div>
                                  <Label>Proof of Funds</Label>
                                  <Input value={cashBuyerPof} onChange={(e) => setCashBuyerPof(e.target.value)} placeholder="Available / Pending" className="h-10 rounded-xl" />
                                </div>
                              </div>
                            )}
                        </div>
                        
                        {outreachScript ? (
                            <div className="bg-slate-900 rounded-3xl p-8 relative group">
                                <button 
                                    onClick={() => copyToClipboard(outreachScript)}
                                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                                    title="Copy Script"
                                >
                                    <Copy size={16} />
                                </button>
                                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                    {outreachScript}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                  {scriptAudience === 'agent' ? 'No Agent Script Generated' : 'No Cash Buyer Script Generated'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
