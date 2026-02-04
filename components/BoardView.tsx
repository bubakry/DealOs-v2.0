import React, { useState } from 'react';
import { Deal, DealStage } from '../types';
import { Card } from './ui/BaseComponents';
import { 
  MoreHorizontal, Plus, Star, MapPin, 
  ChevronRight, AlertTriangle 
} from 'lucide-react';

interface BoardViewProps {
  deals: Deal[];
  onUpdateDeal: (deal: Deal) => void;
  onSelectDeal: (deal: Deal) => void;
}

interface BoardCardProps {
  deal: Deal;
  onClick: () => void;
  onMove: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onDragEnd: () => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ deal, onClick, onMove, onDragStart, onDragEnd }) => {
  const isStale = deal.dom > 100;
  
  return (
    <Card 
      className="p-3 bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-brand-500/30 cursor-pointer transition-all group mb-3 last:mb-0"
      onClick={onClick}
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
          #{deal.id.slice(-4).toUpperCase()}
        </span>
        <div className="flex gap-1.5">
            {isStale && <AlertTriangle size={12} className="text-rose-500" />}
            {deal.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400" />}
        </div>
      </div>
      
      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 line-clamp-2 leading-snug mb-2">
        {deal.address}
      </h4>
      
      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-3">
        <MapPin size={10} className="text-slate-300" />
        {deal.city}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="font-black text-[11px] text-slate-900">
          ${deal.price.toLocaleString()}
        </div>
        <button 
          onClick={onMove}
          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title="Advance Stage"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </Card>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({ deals, onUpdateDeal, onSelectDeal }) => {
  const stages = Object.values(DealStage);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dragTargetStage, setDragTargetStage] = useState<DealStage | null>(null);

  const moveDealNext = (e: React.MouseEvent, deal: Deal) => {
    e.stopPropagation();
    const currentIndex = stages.indexOf(deal.stage);
    if (currentIndex < stages.length - 1) {
      onUpdateDeal({ ...deal, stage: stages[currentIndex + 1] });
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggingDealId(deal.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragEnd = () => {
    setDraggingDealId(null);
    setDragTargetStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggingDealId;
    if (!dealId) {
      handleDragEnd();
      return;
    }

    const draggedDeal = deals.find(d => d.id === dealId);
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      handleDragEnd();
      return;
    }

    onUpdateDeal({ ...draggedDeal, stage: targetStage });
    handleDragEnd();
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 min-h-[600px] animate-in fade-in duration-500">
      {stages.map((stage) => {
        const stageDeals = deals.filter(d => d.stage === stage);
        const columnColor = 
            stage === DealStage.Dead ? 'bg-slate-100' :
            stage === DealStage.UnderContract ? 'bg-emerald-50' :
            stage === DealStage.Negotiating ? 'bg-brand-50' : 'bg-slate-50/50';

        return (
          <div key={stage} className="flex-shrink-0 w-72 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stage}</h3>
                <div className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {stageDeals.length}
                </div>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>
            
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragTargetStage(stage);
              }}
              onDragLeave={() => {
                if (dragTargetStage === stage) setDragTargetStage(null);
              }}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex-1 rounded-[1.5rem] p-3 border transition-colors ${
                dragTargetStage === stage ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200/40'
              } ${columnColor}`}
            >
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <BoardCard 
                    key={deal.id} 
                    deal={deal} 
                    onClick={() => onSelectDeal(deal)} 
                    onMove={(e) => moveDealNext(e, deal)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
                
                {stageDeals.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                      Empty Column
                    </div>
                  </div>
                )}
                
                <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-brand-300 hover:text-brand-600 hover:bg-white transition-all flex items-center justify-center gap-2">
                  <Plus size={12} /> Add to Stage
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
