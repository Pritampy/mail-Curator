import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Calendar } from 'lucide-react';
import { SnoozeDuration } from '../types';

interface SnoozeButtonProps {
  onSnooze: (duration: SnoozeDuration, customDate?: Date) => void;
  onCancel?: () => void;
}

export const SnoozeButton: React.FC<SnoozeButtonProps> = ({ onSnooze, onCancel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateSnoozeDate = (duration: SnoozeDuration): Date => {
    const now = new Date();
    switch (duration) {
      case 'later_today': {
        const later = new Date(now);
        later.setHours(now.getHours() + 2);
        return later;
      }
      case 'tomorrow': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
      }
      case 'next_week': {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0);
        return nextWeek;
      }
      default:
        return now;
    }
  };

  const handleSelect = (duration: SnoozeDuration) => {
    if (duration === 'custom') {
      setShowCustom(true);
      return;
    }
    const snoozeDate = calculateSnoozeDate(duration);
    onSnooze(duration, snoozeDate);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (!customDate) return;
    const [year, month, day] = customDate.split('-').map(Number);
    const [hours, minutes] = customTime.split(':').map(Number);
    const custom = new Date(year, month - 1, day, hours, minutes);
    onSnooze('custom', custom);
    setIsOpen(false);
    setShowCustom(false);
  };

  const getLabel = (duration: SnoozeDuration): string => {
    switch (duration) {
      case 'later_today': return 'Later today';
      case 'tomorrow': return 'Tomorrow';
      case 'next_week': return 'Next week';
      case 'custom': return 'Pick date & time';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
        title="Snooze"
      >
        <Clock size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-high rounded-xl shadow-xl border border-outline-variant z-50 overflow-hidden">
          {!showCustom ? (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                Snooze until
              </p>
              {(['later_today', 'tomorrow', 'next_week', 'custom'] as SnoozeDuration[]).map((duration) => (
                <button
                  key={duration}
                  onClick={() => handleSelect(duration)}
                  className="w-full px-4 py-3 text-left hover:bg-surface-container-low transition-colors flex items-center gap-3"
                >
                  {duration === 'custom' ? <Calendar size={18} /> : <Clock size={18} />}
                  <span>{getLabel(duration)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <p className="text-sm font-medium">Pick date & time</p>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 py-2 text-sm border border-outline-variant rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customDate}
                  className="flex-1 py-2 text-sm bg-primary text-on-primary rounded-lg disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
