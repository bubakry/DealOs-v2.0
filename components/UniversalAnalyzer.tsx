import React, { useState } from 'react';
import { Deal, DealStage } from '../types';
import { Card, Button, Input, Label, Badge } from './ui/BaseComponents';
import { AssignmentAnalyzer, SellerFinanceAnalyzer, SubToAnalyzer } from './Analyzers';
import { Calculator, Save, RefreshCcw, Home, MapPin, DollarSign, TrendingUp, Info } from 'lucide-react';

interface UniversalAnalyzerProps {
    onSaveToInventory: (deal: Deal) => void;
}

export const UniversalAnalyzer: React.FC<UniversalAnalyzerProps> = ({ onSaveToInventory }) => {
    const [address, setAddress] = useState('');
    const [price, setPrice] = useState<number>(0);
    const [strategy, setStrategy] = useState<'assignment' | 'sellerfin' | 'subto'>('assignment');
    
    // Create a mock deal object for the analyzers to work with
    const mockDeal: Deal = {
        id: 'temp',
        address: address || 'Draft Property',
        price: price || 0,
        city: 'Draft City',
        state: 'ST',
        zip: '00000',
        beds: 3,
        baths: 2,
        sqft: 1500,
        dom: 0,
        listDate: new Date().toISOString(),
        status: 'Draft',
        agentName: '',
        agentPhone: '',
        agentEmail: '',
        url: '',
        remarks: '',
        stage: DealStage.New,
        isFavorite: false,
        notes: '',
        followUpDate: null,
        buyerTags: []
    };

    const [analyzedDeal, setAnalyzedDeal] = useState<Deal>(mockDeal);

    const handleUpdate = (updated: Deal) => {
        setAnalyzedDeal(updated);
    };

    const handleReset = () => {
        setAddress('');
        setPrice(0);
        setAnalyzedDeal({ ...mockDeal, address: '', price: 0 });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Deal Scratchpad</h1>
                    <p className="text-slate-500 font-medium">Analyze any property instantly without importing it first.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset} className="rounded-2xl h-12">
                        <RefreshCcw size={16} className="mr-2" /> Reset
                    </Button>
                    <Button 
                        disabled={!address || price <= 0}
                        onClick={() => onSaveToInventory(analyzedDeal)} 
                        className="rounded-2xl h-12"
                    >
                        <Save size={16} className="mr-2" /> Save to Inventory
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Inputs Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Home size={14} /> Basic Economics
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Property Address</Label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input 
                                        className="pl-12" 
                                        placeholder="123 Main St..." 
                                        value={address}
                                        onChange={(e) => {
                                            setAddress(e.target.value);
                                            setAnalyzedDeal({ ...analyzedDeal, address: e.target.value });
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Asking / Purchase Price</Label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input 
                                        type="number" 
                                        className="pl-12 font-black text-slate-900" 
                                        placeholder="0.00" 
                                        value={price || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setPrice(val);
                                            setAnalyzedDeal({ ...analyzedDeal, price: val });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 bg-brand-900 text-white overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-300 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} /> Strategy Impact
                         </h3>
                         <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-brand-100 font-medium">Assignment Spread</span>
                                <span className="font-black text-brand-400">${(analyzedDeal.analysisAssignment?.spread || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-brand-100 font-medium">SubTo Cashflow</span>
                                <span className="font-black text-brand-400">${(analyzedDeal.analysisSubTo?.cashflow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-brand-100 font-medium">Seller Fin DSCR</span>
                                <span className="font-black text-brand-400">{(analyzedDeal.analysisSellerFinance?.dscr || 0).toFixed(2)}</span>
                            </div>
                         </div>
                    </Card>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3">
                         <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                             <Info size={18} />
                         </div>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Numbers are calculated based on market standards. Ensure you verify tax and insurance rates for specific locales.
                         </p>
                    </div>
                </div>

                {/* Analyzer Section */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex bg-white p-2 rounded-[2rem] shadow-lg shadow-slate-100 ring-1 ring-slate-200">
                        {(['assignment', 'sellerfin', 'subto'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStrategy(s)}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${strategy === s ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                {s === 'sellerfin' ? 'Seller Finance' : s === 'subto' ? 'Subject-To' : 'Assignment'}
                            </button>
                        ))}
                    </div>

                    <Card className="p-10 border-none shadow-2xl shadow-slate-200 ring-1 ring-slate-200">
                        {strategy === 'assignment' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                                        <Calculator size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">Wholesale Assignment</h2>
                                </div>
                                <AssignmentAnalyzer deal={analyzedDeal} onUpdate={handleUpdate} />
                            </div>
                        )}
                        {strategy === 'sellerfin' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                        <Calculator size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">Seller Finance (Owner Will Carry)</h2>
                                </div>
                                <SellerFinanceAnalyzer deal={analyzedDeal} onUpdate={handleUpdate} />
                            </div>
                        )}
                        {strategy === 'subto' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                        <Calculator size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">Subject-To (Existing Loan)</h2>
                                </div>
                                <SubToAnalyzer deal={analyzedDeal} onUpdate={handleUpdate} />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};