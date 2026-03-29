import React, { useState, useEffect } from 'react';
import { Filter } from '../types';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Filter as FilterIcon } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

interface FilterListProps {
  onEditFilter: (filter: Filter) => void;
  onDeleteFilter: (id: string) => void;
  onToggleFilter: (id: string, enabled: boolean) => void;
}

export const FilterList: React.FC<FilterListProps> = ({ onEditFilter, onDeleteFilter, onToggleFilter }) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/filters')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch filters');
        return res.json();
      })
      .then(data => {
        setFilters(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getConditionSummary = (conditions: Filter['conditions']) => {
    return conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ');
  };

  const getActionLabel = (action: Filter['action']) => {
    switch (action) {
      case 'auto-delete': return 'Auto-delete';
      case 'auto-archive': return 'Auto-archive';
      case 'auto-skip': return 'Auto-skip';
      case 'categorize': return 'Categorize';
    }
  };

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-on-surface-variant">Loading filters...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-label text-[10px] font-medium tracking-widest uppercase text-primary mb-2">Automation</p>
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none">Smart Filters</h2>
          </div>
        </div>
        <div className="h-1 w-12 editorial-gradient rounded-full"></div>
      </section>

      {filters.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <FilterIcon className="text-on-surface-variant" size={32} />
          </div>
          <h3 className="font-headline text-lg font-bold mb-2">No filters yet</h3>
          <p className="text-on-surface-variant text-sm mb-4">Create your first filter to automatically process emails</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map(filter => (
            <div 
              key={filter._id}
              className={`bg-surface-container rounded-xl p-5 transition-opacity ${!filter.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-headline text-sm font-bold">{filter.name}</h4>
                  <p className="text-on-surface-variant text-xs mt-1">
                    {getConditionSummary(filter.conditions)}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {getActionLabel(filter.action)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFilter(filter._id, !filter.enabled)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title={filter.enabled ? 'Disable filter' : 'Enable filter'}
                  >
                    {filter.enabled ? (
                      <ToggleRight className="text-primary" size={20} />
                    ) : (
                      <ToggleLeft className="text-on-surface-variant" size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => onEditFilter(filter)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title="Edit filter"
                  >
                    <Edit2 className="text-on-surface-variant" size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteFilter(filter._id)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title="Delete filter"
                  >
                    <Trash2 className="text-error" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
