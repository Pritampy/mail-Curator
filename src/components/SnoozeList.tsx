import React, { useState, useEffect } from 'react';
import { SnoozedEmail, SnoozeDuration } from '../types';
import { Clock, Play, Calendar, Trash2, Mail } from 'lucide-react';

interface SnoozeListProps {
  onUnsnooze: (id: string) => void;
  onExtend: (id: string, newDate: Date) => void;
}

export const SnoozeList: React.FC<SnoozeListProps> = ({ onUnsnooze, onExtend }) => {
  const [snoozedEmails, setSnoozedEmails] = useState<SnoozedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/snooze', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch snoozed emails');
        return res.json();
      })
      .then(data => {
        setSnoozedEmails(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatSnoozeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isPast = date <= now;
    
    if (isPast) {
      return { text: 'Ready to return', isReady: true };
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return { text: `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, isReady: false };
    }
    
    return { 
      text: date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isReady: false 
    };
  };

  const handleExtend = (email: SnoozedEmail) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    onExtend(email._id, tomorrow);
  };

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-on-surface-variant">Loading snoozed emails...</div>
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
            <p className="font-label text-[10px] font-medium tracking-widest uppercase text-primary mb-2">Temporarily Hidden</p>
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none">Snoozed</h2>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {snoozedEmails.length}
          </span>
        </div>
        <div className="h-1 w-12 editorial-gradient rounded-full"></div>
      </section>

      {snoozedEmails.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-on-surface-variant" size={32} />
          </div>
          <h3 className="font-headline text-lg font-bold mb-2">No snoozed emails</h3>
          <p className="text-on-surface-variant text-sm">Snooze emails to temporarily hide them from your inbox</p>
        </div>
      ) : (
        <div className="space-y-3">
          {snoozedEmails.map(email => {
            const { text: snoozeText, isReady } = formatSnoozeDate(email.snoozedUntil);
            
            return (
              <div 
                key={email._id}
                className={`bg-surface-container rounded-xl p-4 transition-opacity ${isReady ? 'border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={14} className="text-on-surface-variant flex-shrink-0" />
                      <span className="text-xs text-on-surface-variant truncate">
                        {email.sender || 'Unknown sender'}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm truncate">{email.subject || 'No subject'}</h4>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${isReady ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                      <Clock size={12} />
                      <span>{snoozeText}</span>
                      {isReady && <span className="ml-1">(Return now)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleExtend(email)}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                      title="Snooze longer"
                    >
                      <Calendar size={16} className="text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => onUnsnooze(email._id)}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                      title="Return to inbox"
                    >
                      <Play size={16} className="text-primary" />
                    </button>
                    <button
                      onClick={() => onUnsnooze(email._id)}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-error" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
