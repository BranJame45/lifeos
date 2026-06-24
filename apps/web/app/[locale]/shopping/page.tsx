'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { ShoppingCart, Check } from 'lucide-react';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  purchased: boolean;
}

interface ShoppingList {
  id: string;
  weekStart: string;
  items: ShoppingItem[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  fruits: '🍎',
  vegetables: '🥦',
  meat: '🥩',
  dairy: '🥛',
  grains: '🌾',
  other: '🛒',
};

export default function ShoppingPage() {
  const t = useTranslations('shopping');
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItem, setPendingItem] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    try {
      const data = await api.get<ShoppingList | null>('/shopping-list/current');
      setList(data);
    } catch {}
    setLoading(false);
  }

  const flipItem = (id: string) =>
    setList((prev) =>
      prev ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)) } : prev,
    );

  async function toggleItem(id: string) {
    if (pendingItem.has(id)) return; // ignora doble-click en vuelo
    flipItem(id); // optimista: instantáneo
    setPendingItem((p) => new Set(p).add(id));
    try {
      await api.patch(`/shopping-list/item/${id}`, {});
    } catch {
      flipItem(id); // revierte si falla
    } finally {
      setPendingItem((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
    }
  }

  const groupedItems: Record<string, ShoppingItem[]> = {};
  for (const item of list?.items || []) {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  }

  const categoryLabel: Record<string, string> = {
    fruits: t('categories.fruits'),
    vegetables: t('categories.vegetables'),
    meat: t('categories.meat'),
    dairy: t('categories.dairy'),
    grains: t('categories.grains'),
    other: t('categories.other'),
  };

  const purchasedCount = list?.items.filter((i) => i.purchased).length ?? 0;
  const totalCount = list?.items.length ?? 0;

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-200" />)}</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {list && (
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {purchasedCount}/{totalCount} {t('purchasedCount')}
          </span>
        )}
      </div>

      {!list ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-gray-300" />
          </div>
          <p className="text-sm">{t('noList')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => {
            const purchasedInCategory = items.filter((i) => i.purchased).length;
            return (
              <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_EMOJI[category] || '🛒'}</span>
                    <span className="text-sm font-semibold text-gray-700">{categoryLabel[category] || category}</span>
                  </div>
                  <span className="text-xs text-gray-400">{purchasedInCategory}/{items.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        item.purchased ? 'bg-green-50' : ''
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}
                      >
                        {item.purchased && <Check size={12} className="text-white" />}
                      </div>
                      <span className={`text-sm ${item.purchased ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.name}
                      </span>
                      {item.purchased && (
                        <span className="ml-auto text-xs text-emerald-600 font-medium">{t('purchased')}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
