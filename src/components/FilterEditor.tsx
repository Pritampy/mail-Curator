import React, { useState, useEffect } from 'react';
import { Filter, FilterCondition, FilterAction } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface FilterEditorProps {
  filter?: Filter | null;
  onSave: (filter: Partial<Filter>) => void;
  onClose: () => void;
}

export const FilterEditor: React.FC<FilterEditorProps> = ({ filter, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { field: 'sender', operator: 'contains', value: '' }
  ]);
  const [action, setAction] = useState<FilterAction>('auto-delete');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (filter) {
      setName(filter.name);
      setConditions(filter.conditions);
      setAction(filter.action);
      setCategory(filter.category || '');
    }
  }, [filter]);

  const addCondition = () => {
    setConditions([...conditions, { field: 'sender', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index: number, field: keyof FilterCondition, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Filter name is required';
    if (conditions.some(c => !c.value.trim())) newErrors.conditions = 'All conditions must have values';
    if (action === 'categorize' && !category.trim()) newErrors.category = 'Category is required for categorize action';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name,
      conditions,
      action,
      category: action === 'categorize' ? category : undefined,
      enabled: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-high rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="font-headline text-xl font-bold">
            {filter ? 'Edit Filter' : 'Create Filter'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Filter Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Archive newsletters"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">
                Conditions
              </label>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-1 text-primary text-xs font-bold"
              >
                <Plus size={14} /> Add Condition
              </button>
            </div>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="sender">Sender</option>
                    <option value="subject">Subject</option>
                    <option value="label">Label</option>
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="startsWith">starts with</option>
                    <option value="regex">regex</option>
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-2 hover:bg-surface-container rounded-lg text-error"
                    disabled={conditions.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {errors.conditions && <p className="text-error text-xs mt-1">{errors.conditions}</p>}
          </div>

          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as FilterAction)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            >
              <option value="auto-delete">Auto-delete</option>
              <option value="auto-archive">Auto-archive</option>
              <option value="auto-skip">Auto-skip</option>
              <option value="categorize">Categorize</option>
            </select>
          </div>

          {action === 'categorize' && (
            <div>
              <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Newsletters, Social"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
              {errors.category && <p className="text-error text-xs mt-1">{errors.category}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full font-headline font-bold text-on-surface-variant border border-outline-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 editorial-gradient py-3 rounded-full font-headline font-bold text-on-primary-fixed"
            >
              Save Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
