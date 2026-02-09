import React, { useMemo, useState } from 'react';
import { Card, Input, Label, Select, Badge } from './ui/BaseComponents';
import { Calculator, Download } from 'lucide-react';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

const toNumber = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const AS_IS_SCALE = [
  { max: 150000, exitPct: 0.6, fee: 20000, label: 'Under $150k' },
  { max: 200000, exitPct: 0.65, fee: 20000, label: '$150k-$200k' },
  { max: 300000, exitPct: 0.7, fee: 25000, label: '$200k-$300k' },
  { max: 400000, exitPct: 0.75, fee: 35000, label: '$300k-$400k' },
  { max: 500000, exitPct: 0.8, fee: 45000, label: '$400k-$500k' },
];

const CONDITION_RATES: Record<string, number> = {
  light: 10,
  average: 25,
  heavy: 50,
};

export const QuickAnalysisCalculator: React.FC = () => {
  const [address, setAddress] = useState('');
  const [sqft, setSqft] = useState('');

  const [zillow, setZillow] = useState('');
  const [realtor, setRealtor] = useState('');
  const [redfin, setRedfin] = useState('');
  const [other, setOther] = useState('');

  const [customExitPct, setCustomExitPct] = useState('0.8');
  const [customFee, setCustomFee] = useState('50000');

  const [arv, setArv] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [condition, setCondition] = useState<'light' | 'average' | 'heavy'>('average');
  const [arvExitPct, setArvExitPct] = useState('0.75');
  const [arvFee, setArvFee] = useState('35000');

  const asIsStats = useMemo(() => {
    const values = [zillow, realtor, redfin, other]
      .map(toNumber)
      .filter((v) => v > 0);

    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    let exitPct = 0;
    let fee = 0;
    let label = 'No data';

    if (avg > 0) {
      const scale = AS_IS_SCALE.find((r) => avg <= r.max);
      if (scale) {
        exitPct = scale.exitPct;
        fee = scale.fee;
        label = scale.label;
      } else {
        exitPct = toNumber(customExitPct) || 0.8;
        fee = toNumber(customFee) || 0;
        label = 'Custom ($500k+)';
      }
    }

    const exitPrice = avg * exitPct;
    const maxBuy = exitPrice - fee;
    const maxBuyPct = avg > 0 ? maxBuy / avg : 0;

    return { avg, exitPct, fee, exitPrice, maxBuy, maxBuyPct, label };
  }, [zillow, realtor, redfin, other, customExitPct, customFee]);

  const arvStats = useMemo(() => {
    const arvValue = toNumber(arv);
    const sqftValue = toNumber(sqft);
    const manualRepairs = toNumber(repairCost);
    const conditionRate = CONDITION_RATES[condition] ?? 0;
    const estimatedRepairs = sqftValue > 0 ? sqftValue * conditionRate : 0;
    const repairs = manualRepairs > 0 ? manualRepairs : estimatedRepairs;

    const exitPct = toNumber(arvExitPct) || 0;
    const fee = toNumber(arvFee) || 0;

    const exitPrice = arvValue > 0 ? arvValue * exitPct - repairs : 0;
    const maxBuy = exitPrice - fee;
    const maxBuyPct = arvValue > 0 ? maxBuy / arvValue : 0;

    return { arvValue, repairs, exitPct, fee, exitPrice, maxBuy, maxBuyPct, estimatedRepairs };
  }, [arv, sqft, repairCost, condition, arvExitPct, arvFee]);

  const recommendedOffer = useMemo(() => {
    const offers = [asIsStats.maxBuy, arvStats.maxBuy].filter((v) => v > 0);
    if (!offers.length) return 0;
    return Math.min(...offers);
  }, [asIsStats.maxBuy, arvStats.maxBuy]);

  const renderValue = (value: number) => (value > 0 ? currency.format(value) : '—');

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Quick Analysis Calculator</h2>
            <p className="text-sm text-slate-500">Estimate max offer using As‑Is and ARV methods.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Property Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>
          <div>
            <Label>Sqft</Label>
            <Input value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="2200" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">As‑Is Method</h3>
            <Badge variant="info">{asIsStats.label}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Zillow</Label>
              <Input value={zillow} onChange={(e) => setZillow(e.target.value)} placeholder="395000" />
            </div>
            <div>
              <Label>Realtor</Label>
              <Input value={realtor} onChange={(e) => setRealtor(e.target.value)} placeholder="403000" />
            </div>
            <div>
              <Label>Redfin</Label>
              <Input value={redfin} onChange={(e) => setRedfin(e.target.value)} placeholder="392000" />
            </div>
            <div>
              <Label>Other</Label>
              <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Custom Exit % (only > $500k)</Label>
              <Input value={customExitPct} onChange={(e) => setCustomExitPct(e.target.value)} placeholder="0.8" />
            </div>
            <div>
              <Label>Custom Fee (only > $500k)</Label>
              <Input value={customFee} onChange={(e) => setCustomFee(e.target.value)} placeholder="50000" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">As‑Is Avg</div>
              <div className="text-xl font-extrabold text-slate-900">{renderValue(asIsStats.avg)}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exit %</div>
              <div className="text-xl font-extrabold text-slate-900">{asIsStats.exitPct ? percent(asIsStats.exitPct) : '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wholesale Fee</div>
              <div className="text-xl font-extrabold text-slate-900">{renderValue(asIsStats.fee)}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exit Price</div>
              <div className="text-xl font-extrabold text-slate-900">{renderValue(asIsStats.exitPrice)}</div>
            </div>
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Max Buy</div>
              <div className="text-xl font-extrabold text-brand-700">{renderValue(asIsStats.maxBuy)}</div>
            </div>
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Max Buy %</div>
              <div className="text-xl font-extrabold text-brand-700">{asIsStats.maxBuyPct ? percent(asIsStats.maxBuyPct) : '—'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">ARV – Repairs Method</h3>
            <Badge variant="warning">Repairs Based</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ARV</Label>
              <Input value={arv} onChange={(e) => setArv(e.target.value)} placeholder="480000" />
            </div>
            <div>
              <Label>Repair Cost (optional override)</Label>
              <Input value={repairCost} onChange={(e) => setRepairCost(e.target.value)} placeholder="62000" />
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={condition} onChange={(e) => setCondition(e.target.value as 'light' | 'average' | 'heavy')}>
                <option value="light">Light ($10/sqft)</option>
                <option value="average">Average ($25/sqft)</option>
                <option value="heavy">Heavy ($50/sqft)</option>
              </Select>
            </div>
            <div>
              <Label>Exit %</Label>
              <Input value={arvExitPct} onChange={(e) => setArvExitPct(e.target.value)} placeholder="0.75" />
            </div>
            <div>
              <Label>Wholesale Fee</Label>
              <Input value={arvFee} onChange={(e) => setArvFee(e.target.value)} placeholder="35000" />
            </div>
            <div>
              <Label>Estimated Repairs (if blank)</Label>
              <Input value={arvStats.estimatedRepairs ? String(Math.round(arvStats.estimatedRepairs)) : ''} disabled />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Repairs Used</div>
              <div className="text-xl font-extrabold text-slate-900">{renderValue(arvStats.repairs)}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exit Price</div>
              <div className="text-xl font-extrabold text-slate-900">{renderValue(arvStats.exitPrice)}</div>
            </div>
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Max Buy</div>
              <div className="text-xl font-extrabold text-brand-700">{renderValue(arvStats.maxBuy)}</div>
            </div>
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Max Buy %</div>
              <div className="text-xl font-extrabold text-brand-700">{arvStats.maxBuyPct ? percent(arvStats.maxBuyPct) : '—'}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recommended Offer</div>
          <div className="text-2xl font-extrabold text-slate-900">{renderValue(recommendedOffer)}</div>
          <div className="text-xs text-slate-500 mt-1">Lower of As‑Is and ARV max buy values when both are available.</div>
        </div>
        <a
          href="/1page_offer_calculator.xlsx"
          download
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-all"
        >
          <Download size={16} /> Download Spreadsheet
        </a>
      </Card>
    </div>
  );
};
