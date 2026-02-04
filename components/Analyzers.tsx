import React, { useState, useEffect } from 'react';
import { Deal, AssignmentAnalysis, SellerFinanceAnalysis, SubToAnalysis } from '../types';
import { Input, Label, Button, Badge } from './ui/BaseComponents';
import { Calculator, Save, DollarSign, Percent, RefreshCw, Zap, Target } from 'lucide-react';

interface AnalyzerProps {
  deal: Deal;
  onUpdate: (deal: Deal) => void;
}

export const AssignmentAnalyzer: React.FC<AnalyzerProps> = ({ deal, onUpdate }) => {
  const [logicMode, setLogicMode] = useState<'standard' | 'aggressive' | 'conservative'>('standard');
  
  // Rules for logic modes
  const logicRules = {
    standard: { multiplier: 0.70, fee: 10000 },
    aggressive: { multiplier: 0.80, fee: 5000 },
    conservative: { multiplier: 0.65, fee: 15000 },
  };

  const calculateSuggestedArv = () => {
    const priceBase = deal.price * 1.2;
    const sizePremium = (deal.sqft || 1500) * 25;
    return Math.round(priceBase + sizePremium);
  };

  const suggestedArv = calculateSuggestedArv();
  const [arv, setArv] = useState<number>(deal.analysisAssignment?.arv || suggestedArv);
  const [repairs, setRepairs] = useState<number>(deal.analysisAssignment?.repairs || 30000);
  const [fee, setFee] = useState<number>(deal.analysisAssignment?.assignmentFee || logicRules[logicMode].fee);
  
  // Reset fee when logic mode changes to provide quick guidance
  useEffect(() => {
    setFee(logicRules[logicMode].fee);
  }, [logicMode]);

  const mao = (arv * logicRules[logicMode].multiplier) - repairs - fee;
  const spread = arv - repairs - mao;
  const spreadPct = spread > 0 ? (spread / arv) * 100 : 0;
  
  let confidence: 'Low' | 'Med' | 'High' = 'Low';
  if (spreadPct > 30) confidence = 'High';
  else if (spreadPct > 15) confidence = 'Med';

  const handleSave = () => {
    const analysis: AssignmentAnalysis = { arv, repairs, assignmentFee: fee, mao, spread, confidence };
    onUpdate({ ...deal, analysisAssignment: analysis });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 mb-2">
        {(['standard', 'aggressive', 'conservative'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setLogicMode(mode)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${logicMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {mode} Logic
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>After Repair Value (ARV)</Label>
            <button 
              onClick={() => setArv(suggestedArv)}
              className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:text-brand-700 flex items-center gap-1"
            >
              <RefreshCw size={10} /> Suggested
            </button>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="number" className="pl-10 font-bold" value={arv} onChange={e => setArv(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estimated Repairs</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="number" className="pl-10 font-bold" value={repairs} onChange={e => setRepairs(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Desired Assignment Fee</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="number" 
              className="pl-10 font-bold text-brand-600" 
              value={fee} 
              onChange={e => setFee(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-[1.5rem] p-6 text-white shadow-xl shadow-indigo-900/10 border border-indigo-800">
        <div className="flex items-center justify-between mb-6">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                <Target size={14} /> Buy Box Strategy: {logicMode}
            </h4>
           <Badge className="bg-indigo-800 text-indigo-300 border-none">{Math.round(logicRules[logicMode].multiplier * 100)}% Rule</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Max Allowable Offer</div>
              <div className="text-4xl font-black text-white">${Math.round(mao).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Locked Profit</div>
              <div className="text-xl font-bold text-emerald-400">${Math.round(fee).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-indigo-800 flex justify-between items-center">
              <span className="text-[11px] text-indigo-300 font-medium">Yielding {Math.round(spreadPct)}% Margin</span>
              <div className="flex gap-1">
                  {[1,2,3].map(i => (
                      <div key={i} className={`h-1.5 w-6 rounded-full ${i <= (confidence === 'High' ? 3 : confidence === 'Med' ? 2 : 1) ? 'bg-emerald-400' : 'bg-indigo-800'}`}></div>
                  ))}
              </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full h-14 rounded-2xl">
        <Save className="mr-2 h-5 w-5" /> Lock Analysis
      </Button>
    </div>
  );
};

export const SellerFinanceAnalyzer: React.FC<AnalyzerProps> = ({ deal, onUpdate }) => {
  const [price, setPrice] = useState(deal.analysisSellerFinance?.purchasePrice || deal.price);
  const [down, setDown] = useState(deal.analysisSellerFinance?.downPayment || deal.price * 0.10);
  const [rate, setRate] = useState(deal.analysisSellerFinance?.interestRate || 4.5);
  const [term, setTerm] = useState(deal.analysisSellerFinance?.termYears || 30);
  const [taxIns, setTaxIns] = useState(deal.analysisSellerFinance?.taxesInsurance || 350);
  const [rent, setRent] = useState(deal.analysisSellerFinance?.rentEstimate || deal.price * 0.008);

  const loanAmount = price - down;
  const monthlyRate = rate / 100 / 12;
  const numPayments = term * 12;
  const pi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPayment = pi + taxIns;
  const reserves = rent * 0.05;
  const cashflow = rent - totalPayment - reserves;
  const dscr = totalPayment > 0 ? rent / totalPayment : 0;
  
  let viability: 'Pass' | 'Maybe' | 'No' = 'No';
  if (cashflow >= 200 && dscr >= 1.15) viability = 'Pass';
  else if (cashflow >= 100 && dscr >= 1.0) viability = 'Maybe';

  const handleSave = () => {
     onUpdate({
         ...deal,
         analysisSellerFinance: {
             purchasePrice: price, downPayment: down, interestRate: rate, termYears: term,
             taxesInsurance: taxIns, rentEstimate: rent, monthlyPayment: totalPayment,
             cashflow, dscr, viability
         }
     })
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purchase Price</Label>
          <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <Label>Down Payment ($)</Label>
          <Input type="number" value={down} onChange={e => setDown(Number(e.target.value))} />
        </div>
        <div>
          <Label>Interest Rate (%)</Label>
          <Input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
        </div>
        <div>
          <Label>Amortization (Years)</Label>
          <Input type="number" value={term} onChange={e => setTerm(Number(e.target.value))} />
        </div>
        <div>
          <Label>Monthly Rent (Est)</Label>
          <Input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} />
        </div>
        <div>
          <Label>Taxes + Ins / Mo</Label>
          <Input type="number" value={taxIns} onChange={e => setTaxIns(Number(e.target.value))} />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px]">Monthly PITI</div>
                  <div className="text-lg font-black text-slate-900">${Math.round(totalPayment).toLocaleString()}</div>
              </div>
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px]">Net Cashflow</div>
                  <div className={`text-lg font-black ${cashflow > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>${Math.round(cashflow).toLocaleString()}</div>
              </div>
          </div>
           <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
             <div className="text-sm text-slate-600">DSCR: <span className="font-mono font-bold text-slate-900">{dscr.toFixed(2)}</span></div>
             <Badge variant={viability === 'Pass' ? 'success' : viability === 'Maybe' ? 'warning' : 'destructive'}>
                {viability} Status
            </Badge>
          </div>
      </div>
      <Button onClick={handleSave} className="w-full">
        <Save className="mr-2 h-4 w-4" /> Save Strategy
      </Button>
    </div>
  );
};

export const SubToAnalyzer: React.FC<AnalyzerProps> = ({ deal, onUpdate }) => {
    const [loanBal, setLoanBal] = useState(deal.analysisSubTo?.loanBalance || deal.price * 0.85);
    const [rate, setRate] = useState(deal.analysisSubTo?.interestRate || 3.25);
    const [pi, setPi] = useState(deal.analysisSubTo?.monthlyPI || 0);
    const [taxIns, setTaxIns] = useState(deal.analysisSubTo?.taxesInsurance || 350);
    const [arrears, setArrears] = useState(deal.analysisSubTo?.arrears || 0);
    const [rent, setRent] = useState(deal.analysisSubTo?.rentEstimate || deal.price * 0.009);

    useEffect(() => {
        if (pi === 0 && loanBal > 0) {
             const monthlyRate = rate / 100 / 12;
             const estPi = (loanBal * monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1);
             setPi(Math.round(estPi));
        }
    }, [loanBal, rate]);

    const totalPayment = pi + taxIns;
    const reserves = rent * 0.05;
    const cashflow = rent - totalPayment - reserves;
    const entryCost = arrears + 3000;

    let viability: 'Pass' | 'Maybe' | 'No' = 'No';
    if (cashflow >= 250 && entryCost < 15000) viability = 'Pass';
    else if (cashflow >= 100) viability = 'Maybe';

    const handleSave = () => {
        onUpdate({
            ...deal,
            analysisSubTo: {
                loanBalance: loanBal, interestRate: rate, monthlyPI: pi,
                taxesInsurance: taxIns, arrears, rentEstimate: rent,
                totalPayment, entryCost, cashflow, viability
            }
        })
    };

    return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Loan Balance</Label>
                <Input type="number" value={loanBal} onChange={e => setLoanBal(Number(e.target.value))} />
            </div>
            <div>
                <Label>Rate (%)</Label>
                <Input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
            </div>
            <div>
                <Label>P&I</Label>
                <Input type="number" value={pi} onChange={e => setPi(Number(e.target.value))} />
            </div>
            <div>
                <Label>Taxes + Ins</Label>
                <Input type="number" value={taxIns} onChange={e => setTaxIns(Number(e.target.value))} />
            </div>
            <div>
                <Label>Arrears</Label>
                <Input type="number" value={arrears} onChange={e => setArrears(Number(e.target.value))} />
            </div>
             <div>
                <Label>Rent</Label>
                <Input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} />
            </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px]">Est Entry Cost</span>
                <span className="text-lg font-black text-indigo-600">${Math.round(entryCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px]">Total Payment</span>
                <span className="font-bold text-slate-700">${Math.round(totalPayment).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                 <span className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px]">Net Cashflow</span>
                 <span className={`text-xl font-black ${cashflow > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>${Math.round(cashflow).toLocaleString()}</span>
            </div>
             <div className="mt-3 text-center">
                 <Badge variant={viability === 'Pass' ? 'success' : viability === 'Maybe' ? 'warning' : 'destructive'}>
                    SubTo: {viability}
                </Badge>
             </div>
        </div>
        <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save SubTo Analysis
        </Button>
    </div>
    );
}
