import React, { useState, useEffect, useMemo } from 'react';
import { Deal, DealStage } from './types';
import { getDeals, saveDeals, mergeDeals, generateId } from './services/storage';
import { Button, Input, Select, Badge } from './components/ui/BaseComponents';
import { DealDrawer } from './components/DealDrawer';
import { UploadModal } from './components/UploadModal';
import { BoardView } from './components/BoardView';
import { UniversalAnalyzer } from './components/UniversalAnalyzer';
import { QuickAnalysisCalculator } from './components/QuickAnalysisCalculator';
import { DealFormModal } from './components/DealFormModal';
import { 
  Download, Search, Flame, BarChart3, Plus, Star, 
  LayoutGrid, List, MapPin, Bed, Bath, Maximize, Clock, ChevronRight,
  Kanban, Calculator, Database, FileText
} from 'lucide-react';

type MetricFilter = 'none' | 'pipeline' | 'hot' | 'deepEquity';

interface StatsCardProps {
  title: string;
  value: number;
  sub: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, sub, color, icon: Icon, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-5 flex-1 min-w-[200px] shadow-sm overflow-hidden relative group text-left rounded-[2rem] border transition-all ${
      isActive
        ? 'border-brand-300 ring-2 ring-brand-200 bg-brand-50/40'
        : 'border-transparent ring-1 ring-slate-200/60 bg-white hover:ring-slate-300'
    }`}
  >
    <div className={`absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
      <Icon size={80} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
        <div className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
          {sub}
        </div>
      </div>
      <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100 ${color.replace('text-', 'text-')}`}>
        <Icon size={20} />
      </div>
    </div>
  </button>
);

const DealGridCard: React.FC<{ deal: Deal, onClick: () => void }> = ({ deal, onClick }) => {
  const isHot = deal.dom >= 90;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 deal-card-hover cursor-pointer flex flex-col h-full group"
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant={deal.status === 'Active' ? 'success' : 'outline'} className="rounded-md px-2 py-0.5 text-[10px]">
          {deal.status}
        </Badge>
        {deal.isFavorite && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight mb-1 truncate">
          {deal.address}
        </h3>
        <div className="flex items-center text-xs text-slate-500 gap-1">
          <MapPin size={12} />
          {deal.city}, {deal.state}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Price</div>
          <div className="font-extrabold text-slate-900 text-lg">${deal.price.toLocaleString()}</div>
        </div>
        <div className={`text-right px-2 py-1 rounded-lg ${isHot ? 'bg-red-50' : 'bg-slate-50'}`}>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">DOM</div>
          <div className={`font-bold text-sm ${isHot ? 'text-red-600' : 'text-slate-700'}`}>{deal.dom}d</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-slate-600 mt-auto">
        <div className="flex items-center gap-1.5">
          <Bed size={14} className="text-slate-400" />
          <span className="text-xs font-semibold">{deal.beds}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bath size={14} className="text-slate-400" />
          <span className="text-xs font-semibold">{deal.baths}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Maximize size={14} className="text-slate-400" />
          <span className="text-xs font-semibold">{deal.sqft.toLocaleString()} sqft</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDealFormOpen, setIsDealFormOpen] = useState(false);
  const [dealFormMode, setDealFormMode] = useState<'add' | 'edit'>('add');
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'board'>('grid');
  const [mainTab, setMainTab] = useState<'inventory' | 'analyzer' | 'quick'>('inventory');
  const [search, setSearch] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState<MetricFilter>('none');
  
  // Filters
  const [domMin, setDomMin] = useState<number | ''>('');
  const [domMax, setDomMax] = useState<number | ''>('');
  const [filterStage, setFilterStage] = useState('All');

  useEffect(() => {
    const loaded = getDeals();
    setDeals(loaded);
  }, []);

  useEffect(() => {
    let res = deals;
    if (search) {
      const lower = search.toLowerCase();
      res = res.filter(d => 
        d.address.toLowerCase().includes(lower) || 
        d.city?.toLowerCase().includes(lower) || 
        d.zip?.includes(lower)
      );
    }
    if (typeof domMin === 'number') res = res.filter(d => d.dom >= domMin);
    if (typeof domMax === 'number') res = res.filter(d => d.dom <= domMax);
    if (filterStage !== 'All') res = res.filter(d => d.stage === filterStage);
    if (activeMetricFilter === 'pipeline') {
      res = res.filter(d => d.stage !== DealStage.New && d.stage !== DealStage.Dead);
    }
    if (activeMetricFilter === 'hot') {
      res = res.filter(d => d.dom >= 90);
    }
    if (activeMetricFilter === 'deepEquity') {
      res = res.filter(d => (d.analysisAssignment?.spread || 0) > 20000);
    }
    setFilteredDeals(res);
  }, [deals, search, domMin, domMax, filterStage, activeMetricFilter]);

  const handleDealUpdate = (updated: Deal) => {
    const newDeals = deals.map(d => d.id === updated.id ? updated : d);
    setDeals(newDeals);
    saveDeals(newDeals);
    if(selectedDeal && selectedDeal.id === updated.id) setSelectedDeal(updated);
  };

  const handleDealDelete = (dealId: string) => {
    const remainingDeals = deals.filter(d => d.id !== dealId);
    setDeals(remainingDeals);
    saveDeals(remainingDeals);
    if (selectedDeal?.id === dealId) {
      setSelectedDeal(null);
    }
  };

  const handleUpload = (newDeals: Deal[]) => {
    const merged = mergeDeals(newDeals);
    setDeals(merged);
  };

  const openAddDealModal = () => {
    setDealFormMode('add');
    setEditingDeal(null);
    setIsDealFormOpen(true);
  };

  const openEditDealModal = (dealToEdit: Deal) => {
    setDealFormMode('edit');
    setEditingDeal(dealToEdit);
    setSelectedDeal(null);
    setIsDealFormOpen(true);
  };

  const handleCloseDealModal = () => {
    setIsDealFormOpen(false);
    setEditingDeal(null);
  };

  const handleSaveDealFromModal = (savedDeal: Deal) => {
    let updatedDeals: Deal[];
    if (dealFormMode === 'edit') {
      const exists = deals.some(d => d.id === savedDeal.id);
      updatedDeals = exists
        ? deals.map(d => d.id === savedDeal.id ? savedDeal : d)
        : [savedDeal, ...deals];
    } else {
      updatedDeals = [savedDeal, ...deals];
    }

    setDeals(updatedDeals);
    saveDeals(updatedDeals);
    setSelectedDeal(savedDeal);
    handleCloseDealModal();
  };

  const handleSaveAnalyzerDeal = (deal: Deal) => {
      const updatedDeals = [...deals, { ...deal, id: generateId() }];
      setDeals(updatedDeals);
      saveDeals(updatedDeals);
      setMainTab('inventory');
  };

  const handleDomPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') { setDomMin(''); setDomMax(''); }
    else if (val === 'stale') { setDomMin(45); setDomMax(120); }
    else if (val === 'hot') { setDomMin(90); setDomMax(''); }
    else if (val === 'warm') { setDomMin(60); setDomMax(89); }
    else if (val === 'watch') { setDomMin(45); setDomMax(59); }
  };

  const currentPreset = useMemo(() => {
    if (domMin === '' && domMax === '') return 'all';
    if (domMin === 45 && domMax === 120) return 'stale';
    if (domMin === 90 && domMax === '') return 'hot';
    if (domMin === 60 && domMax === 89) return 'warm';
    if (domMin === 45 && domMax === 59) return 'watch';
    return 'custom';
  }, [domMin, domMax]);

  const stats = useMemo(() => {
    const hot = deals.filter(d => d.dom >= 90).length;
    const pipeline = deals.filter(d => d.stage !== DealStage.New && d.stage !== DealStage.Dead).length;
    const potential = deals.filter(d => (d.analysisAssignment?.spread || 0) > 20000).length;
    return { hot, pipeline, potential };
  }, [deals]);

  return (
    <div className="min-h-screen pb-20 selection:bg-brand-100 selection:text-brand-900">
      {/* Header */}
      <nav className="glass border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-900 rounded-xl p-2 shadow-lg shadow-slate-200">
                <Flame className="h-5 w-5 text-brand-500 fill-brand-500" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">DealOS</span>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Intelligence Engine</div>
              </div>
            </div>

            {/* Main Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
              <button 
                onClick={() => setMainTab('inventory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'inventory' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Database size={16} /> Inventory
              </button>
              <button 
                onClick={() => setMainTab('analyzer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'analyzer' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Calculator size={16} /> Analyzer
              </button>
              <button 
                onClick={() => setMainTab('quick')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'quick' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FileText size={16} /> Quick Analysis
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hidden lg:flex text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button variant="outline" onClick={openAddDealModal} className="rounded-xl px-5 h-10 lg:h-12">
                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Add Listing</span>
              </Button>
              <Button onClick={() => setIsUploadOpen(true)} className="rounded-xl px-5 shadow-md shadow-brand-100/50 h-10 lg:h-12">
                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Import</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mainTab === 'inventory' ? (
          <>
            {/* Key Metrics */}
            <div className="flex gap-6 mb-10 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <StatsCard
                title="Pipeline"
                value={stats.pipeline}
                sub="Active outreach"
                color="text-brand-600"
                icon={BarChart3}
                isActive={activeMetricFilter === 'pipeline'}
                onClick={() => setActiveMetricFilter(prev => (prev === 'pipeline' ? 'none' : 'pipeline'))}
              />
              <StatsCard
                title="Hot Leads"
                value={stats.hot}
                sub="High motivation"
                color="text-rose-500"
                icon={Flame}
                isActive={activeMetricFilter === 'hot'}
                onClick={() => setActiveMetricFilter(prev => (prev === 'hot' ? 'none' : 'hot'))}
              />
              <StatsCard
                title="Deep Equity"
                value={stats.potential}
                sub="> $20k spread"
                color="text-indigo-600"
                icon={Star}
                isActive={activeMetricFilter === 'deepEquity'}
                onClick={() => setActiveMetricFilter(prev => (prev === 'deepEquity' ? 'none' : 'deepEquity'))}
              />
              <StatsCard
                title="Inventory"
                value={deals.length}
                sub="Unique listings"
                color="text-slate-700"
                icon={Clock}
                isActive={activeMetricFilter === 'none'}
                onClick={() => setActiveMetricFilter('none')}
              />
            </div>

            {/* Dynamic Filter Engine */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 mb-8 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    placeholder="Search address, city, or zip..." 
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-sm font-medium transition-all"
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                  <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Kanban size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Market Duration</span>
                  <Select value={currentPreset} onChange={handleDomPresetChange} className="w-44 h-9 text-xs border-none bg-slate-50 font-bold text-slate-700">
                    <option value="all">Unfiltered DOM</option>
                    <option value="stale">Stale Only (45-120)</option>
                    <option value="hot">Highly Motivated (90+)</option>
                    <option value="warm">Warm (60-89)</option>
                    <option value="watch">Watchlist (45-59)</option>
                    <option value="custom">Custom Range</option>
                  </Select>
                  <div className="flex items-center gap-2 px-3 border-l border-slate-100">
                    <Input 
                      type="number" 
                      className="w-16 h-8 text-xs text-center bg-slate-50 border-none font-bold"
                      value={domMin}
                      placeholder="Min"
                      onChange={e => setDomMin(e.target.value ? Number(e.target.value) : '')}
                    />
                    <span className="text-slate-300 font-bold text-xs">-</span>
                    <Input 
                      type="number" 
                      className="w-16 h-8 text-xs text-center bg-slate-50 border-none font-bold"
                      value={domMax}
                      placeholder="Max"
                      onChange={e => setDomMax(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Pipeline State</span>
                  <Select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="w-44 h-9 text-xs border-none bg-slate-50 font-bold text-slate-700">
                    <option value="All">Full Pipeline</option>
                    {Object.values(DealStage).map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            {/* Main Viewport */}
            {filteredDeals.length === 0 ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center animate-in fade-in duration-700">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No listings match your criteria</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                  Adjust your filters or import a new batch of real estate data to begin analysis.
                </p>
                <div className="flex justify-center gap-3">
                  <Button size="lg" variant="outline" onClick={openAddDealModal} className="rounded-2xl">
                    Add Listing
                  </Button>
                  <Button size="lg" onClick={() => setIsUploadOpen(true)} className="rounded-2xl">
                    Import CSV Batch
                  </Button>
                </div>
              </div>
            ) : viewMode === 'board' ? (
              <BoardView deals={filteredDeals} onUpdateDeal={handleDealUpdate} onSelectDeal={setSelectedDeal} />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredDeals.map(deal => (
                  <DealGridCard key={deal.id} deal={deal} onClick={() => setSelectedDeal(deal)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm animate-in fade-in duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Property Details</th>
                        <th className="px-6 py-5">Price Point</th>
                        <th className="px-6 py-5">Duration</th>
                        <th className="px-6 py-5">Structure</th>
                        <th className="px-6 py-5">Pipeline</th>
                        <th className="px-8 py-5 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredDeals.map((deal) => (
                        <tr 
                          key={deal.id} 
                          className="hover:bg-brand-50/30 transition-colors cursor-pointer group" 
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border ${deal.isFavorite ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                <MapPin size={16} className={deal.isFavorite ? 'text-amber-500' : 'text-slate-400'} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{deal.address}</div>
                                <div className="text-xs text-slate-400 font-medium">{deal.city}, {deal.state}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-extrabold text-slate-800">${deal.price.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{deal.status}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              deal.dom >= 90 ? 'bg-rose-50 text-rose-600' : 
                              deal.dom >= 60 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {deal.dom} Days
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-3">
                              <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Bed size={12}/>{deal.beds}</span>
                              <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Bath size={12}/>{deal.baths}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant={deal.stage === 'New' ? 'outline' : 'info'} className="text-[10px] rounded-md px-2 py-0.5">
                              {deal.stage}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : mainTab === 'analyzer' ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <UniversalAnalyzer onSaveToInventory={handleSaveAnalyzerDeal} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <QuickAnalysisCalculator />
          </div>
        )}
      </main>

      {isUploadOpen && <UploadModal onUpload={handleUpload} onClose={() => setIsUploadOpen(false)} />}
      {isDealFormOpen && (
        <DealFormModal
          mode={dealFormMode}
          deal={editingDeal}
          existingDeals={deals}
          onClose={handleCloseDealModal}
          onSave={handleSaveDealFromModal}
        />
      )}
      <DealDrawer 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onUpdateDeal={handleDealUpdate}
        onDeleteDeal={handleDealDelete}
        onEditDeal={openEditDealModal}
      />
    </div>
  );
}
