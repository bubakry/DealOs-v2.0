import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button, Select, Label, Card } from './ui/BaseComponents';
import { CsvMapping, Deal, DealStage } from '../types';
import { Upload, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { v4 } from 'uuid'; // Actually we need a polyfill or custom fn since we can't depend on uninstalled packages. Using storage.ts helper.
import { generateId } from '../services/storage';

interface UploadModalProps {
  onUpload: (deals: Deal[]) => void;
  onClose: () => void;
}

const REQUIRED_FIELDS = ['address', 'price', 'status'];

export const UploadModal: React.FC<UploadModalProps> = ({ onUpload, onClose }) => {
  const [step, setStep] = useState<'upload' | 'map'>('upload');
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setFileData(results.data);
          
          // Auto-guess mapping
          const initialMap: Record<string, string> = {};
          const lowerHeaders = results.meta.fields.map(h => h.toLowerCase());
          
          const findHeader = (keywords: string[]) => {
            const idx = lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));
            return idx !== -1 ? results.meta.fields![idx] : '';
          };

          initialMap['address'] = findHeader(['address', 'street', 'location']);
          initialMap['city'] = findHeader(['city']);
          initialMap['state'] = findHeader(['state']);
          initialMap['zip'] = findHeader(['zip', 'postal']);
          initialMap['price'] = findHeader(['price', 'list price', 'cost']);
          initialMap['beds'] = findHeader(['bed']);
          initialMap['baths'] = findHeader(['bath']);
          initialMap['sqft'] = findHeader(['sqft', 'square feet', 'size']);
          initialMap['dom'] = findHeader(['dom', 'days on', 'time on']);
          initialMap['listDate'] = findHeader(['list date', 'date listed']);
          initialMap['status'] = findHeader(['status']);
          initialMap['url'] = findHeader(['url', 'link', 'href']);
          initialMap['agentName'] = findHeader(['agent name', 'listing agent']);
          initialMap['agentPhone'] = findHeader(['agent phone', 'phone']);
          initialMap['agentEmail'] = findHeader(['agent email', 'email']);
          initialMap['remarks'] = findHeader(['remark', 'description', 'notes']);

          setMapping(initialMap);
          setStep('map');
        } else {
            setError("Could not detect headers.");
        }
      },
      error: (err) => {
        setError(`Parsing error: ${err.message}`);
      }
    });
  };

  const processDeals = () => {
      // Validate
      const missing = REQUIRED_FIELDS.filter(field => !mapping[field]);
      if(missing.length > 0) {
          setError(`Please map required fields: ${missing.join(', ')}`);
          return;
      }

      const deals: Deal[] = fileData.map((row) => {
          // Helper to safely parse numbers
          const num = (field: string) => {
              const val = row[mapping[field]];
              return val ? parseFloat(val.replace(/[^0-9.]/g, '')) || 0 : 0;
          };
          const str = (field: string) => row[mapping[field]] || '';

          // DOM logic
          let dom = num('dom');
          const listDateRaw = str('listDate');
          if (dom === 0 && listDateRaw) {
              const date = new Date(listDateRaw);
              if (!isNaN(date.getTime())) {
                  const diff = new Date().getTime() - date.getTime();
                  dom = Math.floor(diff / (1000 * 3600 * 24));
              }
          }

          return {
              id: generateId(),
              address: str('address'),
              city: str('city'),
              state: str('state'),
              zip: str('zip'),
              price: num('price'),
              beds: num('beds'),
              baths: num('baths'),
              sqft: num('sqft'),
              dom: dom > 0 ? dom : 0,
              listDate: str('listDate'),
              status: str('status') || 'Active',
              agentName: str('agentName'),
              agentPhone: str('agentPhone'),
              agentEmail: str('agentEmail'),
              url: str('url'),
              remarks: str('remarks'),
              stage: DealStage.New,
              isFavorite: false,
              notes: '',
              followUpDate: null,
              buyerTags: [],
          };
      });

      // Simple Filter for valid deals (e.g. must have price and address)
      const validDeals = deals.filter(d => d.address && d.price > 0);
      onUpload(validDeals);
      onClose();
  };

  const fields = [
    { key: 'address', label: 'Address', req: true },
    { key: 'city', label: 'City', req: false },
    { key: 'state', label: 'State', req: false },
    { key: 'zip', label: 'Zip Code', req: false },
    { key: 'price', label: 'List Price', req: true },
    { key: 'beds', label: 'Beds', req: false },
    { key: 'baths', label: 'Baths', req: false },
    { key: 'sqft', label: 'Sqft', req: false },
    { key: 'dom', label: 'Days on Market', req: false },
    { key: 'listDate', label: 'List Date', req: false },
    { key: 'status', label: 'Status', req: true },
    { key: 'url', label: 'Listing URL', req: false },
    { key: 'agentName', label: 'Agent Name', req: false },
    { key: 'agentPhone', label: 'Agent Phone', req: false },
    { key: 'agentEmail', label: 'Agent Email', req: false },
    { key: 'remarks', label: 'Description', req: false },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Upload className="h-5 w-5 text-brand-600" />
               Import Deals
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            {step === 'upload' ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Upload className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-lg font-medium text-slate-700 mb-2">Drag and drop your CSV here</p>
                    <p className="text-sm text-slate-500 mb-6">or click to browse files</p>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Button>Select File</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 mb-4">Map the columns from your CSV to DealOS fields.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field.key}>
                                <Label className="mb-1 block">
                                    {field.label} {field.req && <span className="text-red-500">*</span>}
                                </Label>
                                <Select 
                                    value={mapping[field.key] || ''} 
                                    onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                                >
                                    <option value="">-- Select Column --</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             {step === 'map' && (
                 <>
                    <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
                    <Button onClick={processDeals}>
                        Import Deals <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 </>
             )}
        </div>
      </Card>
    </div>
  );
};
