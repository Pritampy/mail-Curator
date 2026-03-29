import React, { useState, useEffect } from 'react';
import { Rule } from '../types';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Play, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

interface RulesListProps {
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, enabled: boolean) => void;
  onRunRule: (id: string) => void;
}

export const RulesList: React.FC<RulesListProps> = ({ onEditRule, onDeleteRule, onToggleRule, onRunRule }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/rules')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch rules');
        return res.json();
      })
      .then(data => {
        setRules(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getScheduleSummary = (schedule: Rule['schedule']) => {
    const time = schedule.time || '09:00';
    switch (schedule.type) {
      case 'daily': return `Daily at ${time}`;
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = schedule.dayOfWeek !== undefined ? days[schedule.dayOfWeek] : 'Monday';
        return `Weekly on ${day} at ${time}`;
      }
      case 'monthly': {
        const day = schedule.dayOfMonth || 1;
        return `Monthly on day ${day} at ${time}`;
      }
    }
  };

  const getActionLabel = (action: Rule['action']) => {
    switch (action) {
      case 'delete': return 'Delete';
      case 'archive': return 'Archive';
      case 'skip': return 'Skip';
      case 'label': return 'Apply label';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-on-surface-variant">Loading rules...</div>
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
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none">Scheduled Rules</h2>
          </div>
        </div>
        <div className="h-1 w-12 editorial-gradient rounded-full"></div>
      </section>

      {rules.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-on-surface-variant" size={32} />
          </div>
          <h3 className="font-headline text-lg font-bold mb-2">No rules yet</h3>
          <p className="text-on-surface-variant text-sm mb-4">Create a scheduled rule to automatically clean your inbox</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div 
              key={rule._id}
              className={`bg-surface-container rounded-xl p-5 transition-opacity ${!rule.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-headline text-sm font-bold">{rule.name}</h4>
                  <p className="text-on-surface-variant text-xs mt-1">
                    {getScheduleSummary(rule.schedule)}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {getActionLabel(rule.action)}
                  </span>
                  {rule.nextRun && (
                    <p className="text-on-surface-variant text-xs mt-2 flex items-center gap-1">
                      <Clock size={12} /> Next run: {formatDate(rule.nextRun)}
                    </p>
                  )}
                  {rule.lastRun && (
                    <p className="text-on-surface-variant text-xs mt-1 flex items-center gap-1">
                      Last run: {formatDate(rule.lastRun)}
                      {rule.executionHistory && rule.executionHistory.length > 0 && (
                        <span className={rule.executionHistory[rule.executionHistory.length - 1].success ? 'text-green-500' : 'text-error'}>
                          {rule.executionHistory[rule.executionHistory.length - 1].success ? ' ✓' : ' ✗'}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRunRule(rule._id)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title="Run now"
                  >
                    <Play className="text-primary" size={18} />
                  </button>
                  <button
                    onClick={() => onToggleRule(rule._id, !rule.enabled)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="text-primary" size={20} />
                    ) : (
                      <ToggleLeft className="text-on-surface-variant" size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => onEditRule(rule)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title="Edit rule"
                  >
                    <Edit2 className="text-on-surface-variant" size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule._id)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                    title="Delete rule"
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
