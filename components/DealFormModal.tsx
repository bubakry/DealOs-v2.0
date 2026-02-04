import React, { useEffect, useMemo, useState } from 'react';
import { Deal, DealStage, DealStatus } from '../types';
import { generateId } from '../services/storage';
import { Button, Card, Input, Label, Select } from './ui/BaseComponents';
import { AlertCircle, PencilLine, Plus } from 'lucide-react';

interface DealFormModalProps {
  mode: 'add' | 'edit';
  deal?: Deal | null;
  existingDeals: Deal[];
  onClose: () => void;
  onSave: (deal: Deal) => void;
}

interface DealFormState {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  dom: string;
  listDate: string;
  status: string;
  stage: DealStage;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  url: string;
  remarks: string;
}

type DealFormErrors = Partial<Record<keyof DealFormState | 'general', string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;

const todayIso = () => new Date().toISOString().slice(0, 10);

const toDateInput = (value: string) => {
  if (!value) return todayIso();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return todayIso();
  return parsed.toISOString().slice(0, 10);
};

const makeInitialState = (deal?: Deal | null): DealFormState => ({
  address: deal?.address || '',
  city: deal?.city || '',
  state: deal?.state || '',
  zip: deal?.zip || '',
  price: deal ? String(deal.price) : '',
  beds: deal ? String(deal.beds) : '',
  baths: deal ? String(deal.baths) : '',
  sqft: deal ? String(deal.sqft) : '',
  dom: deal ? String(deal.dom) : '0',
  listDate: toDateInput(deal?.listDate || ''),
  status: deal?.status || DealStatus.Active,
  stage: deal?.stage || DealStage.New,
  agentName: deal?.agentName || '',
  agentPhone: deal?.agentPhone || '',
  agentEmail: deal?.agentEmail || '',
  url: deal?.url || '',
  remarks: deal?.remarks || '',
});

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
      <AlertCircle size={12} /> {message}
    </p>
  );
};

export const DealFormModal: React.FC<DealFormModalProps> = ({ mode, deal, existingDeals, onClose, onSave }) => {
  const [form, setForm] = useState<DealFormState>(makeInitialState(deal));
  const [errors, setErrors] = useState<DealFormErrors>({});

  useEffect(() => {
    setForm(makeInitialState(deal));
    setErrors({});
  }, [deal?.id, mode]);

  const title = useMemo(() => (mode === 'add' ? 'Add Listing' : 'Edit Listing'), [mode]);

  const setField = <K extends keyof DealFormState>(key: K, value: DealFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): DealFormErrors => {
    const nextErrors: DealFormErrors = {};

    const address = form.address.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const zip = form.zip.trim();
    const agentEmail = form.agentEmail.trim();
    const url = normalizeUrl(form.url);

    const price = Number(form.price);
    const beds = Number(form.beds);
    const baths = Number(form.baths);
    const sqft = Number(form.sqft);
    const dom = Number(form.dom);

    if (!address) nextErrors.address = 'Address is required.';
    if (!city) nextErrors.city = 'City is required.';
    if (!state) nextErrors.state = 'State is required.';
    if (!zip) nextErrors.zip = 'ZIP code is required.';
    else if (!ZIP_REGEX.test(zip)) nextErrors.zip = 'Use ZIP format 12345 or 12345-6789.';

    if (!form.price.trim() || Number.isNaN(price) || price <= 0) nextErrors.price = 'Price must be greater than 0.';
    if (!form.beds.trim() || Number.isNaN(beds) || beds < 0) nextErrors.beds = 'Beds must be 0 or greater.';
    if (!form.baths.trim() || Number.isNaN(baths) || baths < 0) nextErrors.baths = 'Baths must be 0 or greater.';
    if (!form.sqft.trim() || Number.isNaN(sqft) || sqft <= 0) nextErrors.sqft = 'Sqft must be greater than 0.';
    if (!form.dom.trim() || Number.isNaN(dom) || dom < 0) nextErrors.dom = 'DOM must be 0 or greater.';

    if (!form.listDate.trim()) nextErrors.listDate = 'List date is required.';
    else if (Number.isNaN(new Date(form.listDate).getTime())) nextErrors.listDate = 'List date is invalid.';

    if (agentEmail && !EMAIL_REGEX.test(agentEmail)) nextErrors.agentEmail = 'Enter a valid email.';

    if (url) {
      try {
        new URL(url);
      } catch {
        nextErrors.url = 'Enter a valid URL.';
      }
    }

    const normalizedAddress = address.toLowerCase();
    const normalizedZip = zip.toLowerCase();
    const normalizedUrl = url.toLowerCase();

    const duplicate = existingDeals.some((existing) => {
      if (existing.id === deal?.id) return false;
      const sameAddress = existing.address.trim().toLowerCase() === normalizedAddress && existing.zip.trim().toLowerCase() === normalizedZip;
      const sameUrl = Boolean(normalizedUrl) && existing.url.trim().toLowerCase() === normalizedUrl;
      return sameAddress || sameUrl;
    });

    if (duplicate) {
      nextErrors.general = 'A listing with this address/ZIP or URL already exists.';
    }

    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const normalizedUrl = normalizeUrl(form.url);
    const payload: Deal = {
      ...(deal || {
        id: generateId(),
        isFavorite: false,
        notes: '',
        followUpDate: null,
        buyerTags: [],
      }),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      price: Number(form.price),
      beds: Number(form.beds),
      baths: Number(form.baths),
      sqft: Number(form.sqft),
      dom: Number(form.dom),
      listDate: form.listDate,
      status: form.status,
      stage: form.stage,
      agentName: form.agentName.trim(),
      agentPhone: form.agentPhone.trim(),
      agentEmail: form.agentEmail.trim(),
      url: normalizedUrl,
      remarks: form.remarks.trim(),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {mode === 'add' ? <Plus className="h-5 w-5 text-brand-600" /> : <PencilLine className="h-5 w-5 text-brand-600" />}
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form id="deal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-semibold">
              {errors.general}
            </div>
          )}

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Property</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Address *</Label>
                <Input value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="123 Main St" />
                <FieldError message={errors.address} />
              </div>
              <div>
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="Phoenix" />
                <FieldError message={errors.city} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>State *</Label>
                  <Input value={form.state} onChange={(e) => setField('state', e.target.value)} placeholder="AZ" />
                  <FieldError message={errors.state} />
                </div>
                <div>
                  <Label>ZIP *</Label>
                  <Input value={form.zip} onChange={(e) => setField('zip', e.target.value)} placeholder="85001" />
                  <FieldError message={errors.zip} />
                </div>
              </div>
              <div>
                <Label>Price *</Label>
                <Input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="265000" />
                <FieldError message={errors.price} />
              </div>
              <div>
                <Label>Sqft *</Label>
                <Input type="number" min="0" value={form.sqft} onChange={(e) => setField('sqft', e.target.value)} placeholder="1200" />
                <FieldError message={errors.sqft} />
              </div>
              <div>
                <Label>Beds *</Label>
                <Input type="number" min="0" step="1" value={form.beds} onChange={(e) => setField('beds', e.target.value)} placeholder="3" />
                <FieldError message={errors.beds} />
              </div>
              <div>
                <Label>Baths *</Label>
                <Input type="number" min="0" step="0.5" value={form.baths} onChange={(e) => setField('baths', e.target.value)} placeholder="2" />
                <FieldError message={errors.baths} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Listing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onChange={(e) => setField('status', e.target.value)} className="h-12">
                  {Object.values(DealStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onChange={(e) => setField('stage', e.target.value as DealStage)} className="h-12">
                  {Object.values(DealStage).map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Days on Market *</Label>
                <Input type="number" min="0" value={form.dom} onChange={(e) => setField('dom', e.target.value)} placeholder="45" />
                <FieldError message={errors.dom} />
              </div>
              <div>
                <Label>List Date *</Label>
                <Input type="date" value={form.listDate} onChange={(e) => setField('listDate', e.target.value)} />
                <FieldError message={errors.listDate} />
              </div>
              <div className="md:col-span-2">
                <Label>Listing URL</Label>
                <Input value={form.url} onChange={(e) => setField('url', e.target.value)} placeholder="https://example.com/listing" />
                <FieldError message={errors.url} />
              </div>
              <div className="md:col-span-2">
                <Label>Remarks</Label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                  placeholder="Internal notes or listing summary..."
                  className="w-full min-h-[100px] p-4 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Agent</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.agentName} onChange={(e) => setField('agentName', e.target.value)} placeholder="Agent name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.agentPhone} onChange={(e) => setField('agentPhone', e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.agentEmail} onChange={(e) => setField('agentEmail', e.target.value)} placeholder="agent@email.com" />
                <FieldError message={errors.agentEmail} />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="deal-form" className="rounded-xl px-6">
            {mode === 'add' ? 'Create Listing' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
