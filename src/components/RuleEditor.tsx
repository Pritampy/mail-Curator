import React, { useState, useEffect } from 'react';
import { Rule, FilterCondition, RuleSchedule } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface RuleEditorProps {
  rule?: Rule | null;
  onSave: (rule: Partial<Rule>) => void;
  onClose: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { field: 'sender', operator: 'contains', value: '' }
  ]);
  const [action, setAction] = useState<Rule['action']>('delete');
  const [label, setLabel] = useState('');
  const [scheduleType, setScheduleType] = useState<RuleSchedule['type']>('daily');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setConditions(rule.conditions);
      setAction(rule.action);
      setLabel(rule.label || '');
      setScheduleType(rule.schedule.type);
      setScheduleTime(rule.schedule.time || '09:00');
      setDayOfWeek(rule.schedule.dayOfWeek ?? 1);
      setDayOfMonth(rule.schedule.dayOfMonth ?? 1);
      setEnabled(rule.enabled);
    }
  }, [rule]);

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
    if (!name.trim()) newErrors.name = 'Rule name is required';
    if (conditions.some(c => !c.value.trim())) newErrors.conditions = 'All conditions must have values';
    if (action === 'label' && !label.trim()) newErrors.label = 'Label is required for label action';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const schedule: RuleSchedule = {
      type: scheduleType,
      time: scheduleTime,
      ...(scheduleType === 'weekly' && { dayOfWeek }),
      ...(scheduleType === 'monthly' && { dayOfMonth })
    };

    onSave({
      name,
      conditions,
      action,
      label: action === 'label' ? label : undefined,
      schedule,
      enabled
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-high rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="font-headline text-xl font-bold">
            {rule ? 'Edit Rule' : 'Create Rule'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly newsletter cleanup"
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
              onChange={(e) => setAction(e.target.value as Rule['action'])}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            >
              <option value="delete">Delete</option>
              <option value="archive">Archive</option>
              <option value="skip">Skip</option>
              <option value="label">Apply label</option>
            </select>
          </div>

          {action === 'label' && (
            <div>
              <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
                Label Name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., To Review"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
              {errors.label && <p className="text-error text-xs mt-1">{errors.label}</p>}
            </div>
          )}

          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Schedule
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as RuleSchedule['type'])}
                className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {scheduleType === 'weekly' && (
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="mt-3 w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            )}
            {scheduleType === 'monthly' && (
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                placeholder="Day of month (1-31)"
                className="mt-3 w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Enabled</label>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

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
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
