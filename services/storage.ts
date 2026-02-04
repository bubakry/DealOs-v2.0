import { Deal, DealStage } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Assumption: Using uuid or random string generator

const STORAGE_KEY = 'dealos_deals';

export const saveDeals = (deals: Deal[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch (e) {
    console.error("Failed to save deals", e);
  }
};

export const getDeals = (): Deal[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load deals", e);
    return [];
  }
};

export const updateDeal = (updatedDeal: Deal) => {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === updatedDeal.id);
  if (index !== -1) {
    deals[index] = updatedDeal;
    saveDeals(deals);
  }
  return deals;
};

// Simple ID generator since we don't have uuid lib installed in this context usually
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const mergeDeals = (newDeals: Deal[]) => {
  const existing = getDeals();
  const existingMap = new Map(existing.map(d => [d.url || d.address, d]));
  
  newDeals.forEach(d => {
    // Dedupe key: URL is best, fallback to Address
    const key = d.url || d.address;
    if (!existingMap.has(key)) {
      existingMap.set(key, d);
    } else {
      // Update existing record with fresh market data, keep workflow data
      const old = existingMap.get(key)!;
      existingMap.set(key, {
        ...old,
        price: d.price,
        dom: d.dom,
        status: d.status,
        // Keep notes, stage, analysis
      });
    }
  });
  
  const merged = Array.from(existingMap.values());
  saveDeals(merged);
  return merged;
};