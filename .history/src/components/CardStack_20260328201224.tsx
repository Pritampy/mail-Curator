import React, { useState, useCallback, useRef } from 'react';
import { Email } from '../types';
import { Trash2, SkipForward } from 'lucide-react';

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 500;
const MAX_ROTATION = 15;

interface CardStackProps {
  emails: Email[];
  onSwipeLeft: (email: Email) => void;
  onSwipeRight: (email: Email) => void;
}

export const CardStack: React.FC<CardStackProps> = ({
  emails,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const exitDirRef = useRef<1 | -1>(1);
  const emailSnapshotRef = useRef<Email | null>(null);

  const currentEmail = emails[0] ?? null;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isExiting || !currentEmail) return;
      startXRef.current = e.clientX;
      currentOffsetRef.current = 0;
      setIsDragging(true);
      setOffsetX(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isExiting, currentEmail]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || isExiting) return;
      const diff = e.clientX - startXRef.current;
      currentOffsetRef.current = diff;
      setOffsetX(diff);
    },
    [isDragging, isExiting]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isExiting || !currentEmail) return;
    setIsDragging(false);

    const offset = currentOffsetRef.current;

    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      // Swipe detected — capture email and animate off-screen
      emailSnapshotRef.current = currentEmail;
      const dir = offset > 0 ? 1 : -1;
      exitDirRef.current = dir as 1 | -1;
      setOffsetX(dir * EXIT_DISTANCE);
      setIsExiting(true);
    } else {
      // Below threshold — snap back
      setOffsetX(0);
    }
  }, [isDragging, isExiting, currentEmail]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      // Only react to the transform transition (not opacity) to avoid double-fire
      if (e.propertyName !== 'transform') return;
      if (!isExiting || !emailSnapshotRef.current) return;

      const email = emailSnapshotRef.current;
      const dir = exitDirRef.current;
      emailSnapshotRef.current = null;

      // Fire the action callback — this removes the email from the parent array
      if (dir > 0) {
        onSwipeRight(email);
      } else {
        onSwipeLeft(email);
      }

      // Reset for next card (batched with parent state update)
      setOffsetX(0);
      setIsExiting(false);
    },
    [isExiting, onSwipeRight, onSwipeLeft]
  );

  // Derived visual values
  const rotation =
    isDragging || isExiting ? (offsetX / EXIT_DISTANCE) * MAX_ROTATION : 0;
  const deleteProgress = Math.min(Math.max(offsetX / SWIPE_THRESHOLD, 0), 1);
  const skipProgress = Math.min(Math.max(-offsetX / SWIPE_THRESHOLD, 0), 1);

  if (emails.length === 0 && !isExiting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-primary">
            celebration
          </span>
        </div>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">
          Inbox Zero
        </h2>
        <p className="text-on-surface-variant mt-2 max-w-xs">
          You've successfully curated your digital workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Background Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none opacity-30 -z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
            <SkipForward className="w-6 h-6 text-on-surface-variant" />
          </div>
          <span className="text-[10px] font-label font-bold tracking-[0.15em] uppercase text-on-surface-variant">
            Skip
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-error" />
          </div>
          <span className="text-[10px] font-label font-bold tracking-[0.15em] uppercase text-error">
            Delete
          </span>
        </div>
      </div>

      {/* Card area */}
      <div className="w-full h-[380px] relative">
        {/* Next card peek (static behind active card) */}
        {emails.length > 1 && (
          <div className="absolute inset-0 glass-card p-8 rounded-3xl flex flex-col justify-between scale-[0.96] opacity-50 pointer-events-none">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-1">
                  <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
                    Email
                  </span>
                  <h3 className="font-headline text-lg font-extrabold text-white leading-tight truncate max-w-[180px]">
                    {emails[1].from.split('<')[0].trim()}
                  </h3>
                </div>
              </div>
              <h4 className="font-headline text-2xl font-bold text-primary mb-4 leading-[1.2] tracking-tight line-clamp-2">
                {emails[1].subject}
              </h4>
            </div>
          </div>
        )}

        {/* Active card */}
        {currentEmail && (
          <div
            className="absolute inset-0 glass-card vibrant-glow rounded-3xl cursor-grab active:cursor-grabbing select-none overflow-hidden"
            style={{
              transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
              opacity: isExiting ? 0 : 1,
              transition: isDragging
                ? 'none'
                : 'transform 0.3s ease-out, opacity 0.3s ease-out',
              touchAction: 'none',
              willChange: isDragging ? 'transform' : 'auto',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Delete overlay (right swipe - purple) */}
            <div
              className="absolute inset-0 rounded-3xl bg-purple-600 pointer-events-none z-10"
              style={{ opacity: deleteProgress * 0.5 }}
            />
            {/* Skip overlay (left swipe - gray) */}
            <div
              className="absolute inset-0 rounded-3xl bg-gray-500 pointer-events-none z-10"
              style={{ opacity: skipProgress * 0.5 }}
            />

            {/* Swipe direction badge — Delete (right) */}
            <div
              className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-purple-600/80 px-3 py-1.5"
              style={{
                opacity: deleteProgress,
                transform: `scale(${0.6 + deleteProgress * 0.4})`,
              }}
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Delete
              </span>
            </div>
            {/* Swipe direction badge — Skip (left) */}
            <div
              className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-gray-500/80 px-3 py-1.5"
              style={{
                opacity: skipProgress,
                transform: `scale(${0.6 + skipProgress * 0.4})`,
              }}
            >
              <SkipForward className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Skip
              </span>
            </div>

            {/* Card content */}
            <div className="p-8 flex flex-col justify-between h-full relative z-0">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
                      Email
                    </span>
                    <h3 className="font-headline text-lg font-extrabold text-white leading-tight truncate max-w-[180px]">
                      {currentEmail.from.split('<')[0].trim()}
                    </h3>
                  </div>
                  <span className="text-on-surface-variant text-[11px] font-label font-medium bg-surface-container px-2 py-1 rounded">
                    {new Date(currentEmail.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="font-headline text-2xl font-bold text-primary mb-4 leading-[1.2] tracking-tight line-clamp-2">
                  {currentEmail.subject}
                </h4>

                <p className="text-on-surface-variant text-[15px] leading-relaxed line-clamp-4">
                  {currentEmail.snippet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] border-2 border-[#1a1a1a] font-bold">
                      {currentEmail.from.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary/40">
                  keyboard_double_arrow_right
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="mt-4 text-center text-xs text-on-surface-variant">
        Swipe right to delete &bull; Swipe left to skip
      </p>
    </div>
  );
};
