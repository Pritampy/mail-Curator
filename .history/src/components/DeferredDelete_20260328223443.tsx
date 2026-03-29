import React from 'react';
import { Email } from '../types';
import { Trash2, X, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { cn } from '../lib/utils';
import { Zap, SkipForward } from 'lucide-react';

interface DeferredDeleteQueueProps {
  selectedEmails: Email[];
  onRemove: (emailId: string) => void;
  onClearAll: () => void;
  onFinalDelete: () => void;
}

export const DeferredDeleteQueue: React.FC<DeferredDeleteQueueProps> = ({
  selectedEmails,
  onRemove,
  onClearAll,
  onFinalDelete
}) => {
  if (selectedEmails.length === 0) return null;

  return (
    <div className="mt-6 w-full">
      <div className="bg-surface-container-high rounded-2xl shadow-2xl border border-error/30 overflow-hidden">
        {/* Header */}
        <div className="bg-error/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-error" />
            <span className="font-headline text-sm font-bold text-error">
              {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} queued
            </span>
          </div>
          <button
            onClick={onClearAll}
            className="text-xs text-on-surface-variant hover:text-white"
          >
            Clear all
          </button>
        </div>

        {/* Email List Preview */}
        <div className="max-h-28 overflow-y-auto px-3 py-1.5">
          {selectedEmails.map(email => (
            <div
              key={email.id}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Mail className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                <span className="text-xs truncate">{email.from.split('<')[0].trim()}</span>
                <span className="text-[10px] text-on-surface-variant truncate hidden sm:inline">
                  — {email.subject}
                </span>
              </div>
              <button
                onClick={() => onRemove(email.id)}
                className="p-1 hover:bg-surface-container rounded flex-shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-2.5 flex gap-2">
          <button
            onClick={onClearAll}
            className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onFinalDelete}
            className="flex-1 py-2 rounded-lg bg-error text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All ({selectedEmails.length})
          </button>
        </div>
      </div>
    </div>
  );
};

interface CardStackWithSelectionProps {
  emails: Email[];
  selectedForDelete: Email[];
  onToggleSelect: (email: Email) => void;
  onSwipeLeft: (email: Email) => void;
  onSwipeRight: (email: Email) => void;
}

export const CardStackWithSelection: React.FC<CardStackWithSelectionProps> = ({
  emails,
  selectedForDelete,
  onToggleSelect,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const activeEmail = emails[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!activeEmail || isSwiping) return;
    setIsSwiping(true);
    
    if (direction === 'left') {
      onSwipeLeft(activeEmail);
    } else {
      onSwipeRight(activeEmail);
    }
    
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsSwiping(false), 300);
  };

  if (!activeEmail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-primary">celebration</span>
        </div>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">Inbox Zero</h2>
        <p className="text-on-surface-variant mt-2 max-w-xs">You've successfully curated your digital workspace. Go enjoy the void.</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[440px] w-full">
      {/* Background Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none opacity-30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
            <SkipForward className="w-6 h-6 text-on-surface-variant" />
          </div>
          <span className="text-[10px] font-label font-bold tracking-[0.15em] uppercase text-on-surface-variant">Skip</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-error" />
          </div>
          <span className="text-[10px] font-label font-bold tracking-[0.15em] uppercase text-error">Delete</span>
        </div>
      </div>

      {/* The Stack */}
      <div className="relative w-full h-[380px]">
        <AnimatePresence mode="popLayout">
          {emails.slice(currentIndex, currentIndex + 3).reverse().map((email, index, array) => {
            const isTop = index === array.length - 1;
            const isSelected = selectedForDelete.some(e => e.id === email.id);
            return (
              <EmailCardWithSelection
                key={email.id}
                email={email}
                isTop={isTop}
                isSelected={isSelected}
                onSwipe={handleSwipe}
                onTap={() => onToggleSelect(email)}
                stackIndex={array.length - 1 - index}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-xs text-on-surface-variant">
        Tap card to select for batch deletion • Swipe to process immediately
      </div>
    </div>
  );
};

interface EmailCardWithSelectionProps {
  email: Email;
  isTop: boolean;
  isSelected: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap: () => void;
  stackIndex: number;
}

const EmailCardWithSelection: React.FC<EmailCardWithSelectionProps> = ({
  email,
  isTop,
  isSelected,
  onSwipe,
  onTap,
  stackIndex
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    const SWIPE_THRESHOLD = 150;
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: 20 - stackIndex }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onClick={isTop ? onTap : undefined}
      initial={{ scale: 0.9, y: stackIndex * 12, opacity: 0 }}
      animate={{ 
        scale: 1 - stackIndex * 0.05, 
        y: stackIndex * 12, 
        opacity: 1 - stackIndex * 0.3
      }}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
      className={cn(
        "absolute inset-0 glass-card vibrant-glow p-8 rounded-3xl flex flex-col justify-between cursor-grab active:cursor-grabbing transition-colors",
        !isTop && "pointer-events-none",
        isSelected && "ring-2 ring-error"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-error rounded-full flex items-center justify-center z-10">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Email</span>
            <h3 className="font-headline text-lg font-extrabold text-white leading-tight truncate max-w-[180px]">
              {email.from.split('<')[0].trim()}
            </h3>
          </div>
          <span className="text-on-surface-variant text-[11px] font-label font-medium bg-surface-container px-2 py-1 rounded">
            {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <h4 className="font-headline text-2xl font-bold text-primary mb-4 leading-[1.2] tracking-tight line-clamp-2">
          {email.subject}
        </h4>
        
        <p className="text-on-surface-variant text-[15px] leading-relaxed line-clamp-4">
          {email.snippet}
        </p>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] border-2 border-[#1a1a1a] font-bold">
              {email.from.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <span className="material-symbols-outlined text-primary/40">keyboard_double_arrow_right</span>
      </div>
    </motion.div>
  );
};
