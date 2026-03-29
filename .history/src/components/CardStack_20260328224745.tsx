import React, { useCallback, useRef, useEffect, memo } from 'react';
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

/**
 * Peek card behind the active card — pure display, fully memoized.
 */
const PeekCard = memo(({ email }: { email: Email }) => (
  <div className="absolute inset-0 glass-card p-8 rounded-3xl flex flex-col justify-between scale-[0.96] opacity-50 pointer-events-none">
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            Email
          </span>
          <h3 className="font-headline text-lg font-extrabold text-white leading-tight truncate max-w-[180px]">
            {email.from.split('<')[0].trim()}
          </h3>
        </div>
      </div>
      <h4 className="font-headline text-2xl font-bold text-primary mb-4 leading-[1.2] tracking-tight line-clamp-2">
        {email.subject}
      </h4>
    </div>
  </div>
));
PeekCard.displayName = 'PeekCard';

/**
 * Static card content — memoized so it never re-renders during drag.
 */
const CardContent = memo(({ email }: { email: Email }) => (
  <div className="p-8 flex flex-col justify-between h-full relative z-0">
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            Email
          </span>
          <h3 className="font-headline text-lg font-extrabold text-white leading-tight truncate max-w-[180px]">
            {email.from.split('<')[0].trim()}
          </h3>
        </div>
        <span className="text-on-surface-variant text-[11px] font-label font-medium bg-surface-container px-2 py-1 rounded">
          {new Date(email.date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
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
      <span className="material-symbols-outlined text-primary/40">
        keyboard_double_arrow_right
      </span>
    </div>
  </div>
));
CardContent.displayName = 'CardContent';

/**
 * CardStack — zero React re-renders during drag.
 *
 * All drag visuals (transform, overlays, badges) are applied via direct
 * DOM refs. React only re-renders when the emails array changes (i.e.
 * after a swipe action completes and the parent removes the email).
 */
export const CardStack: React.FC<CardStackProps> = memo(({
  emails,
  onSwipeLeft,
  onSwipeRight,
}) => {
  // DOM refs for direct manipulation (no state, no re-renders)
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteOverlayRef = useRef<HTMLDivElement>(null);
  const skipOverlayRef = useRef<HTMLDivElement>(null);
  const deleteBadgeRef = useRef<HTMLDivElement>(null);
  const skipBadgeRef = useRef<HTMLDivElement>(null);

  // Drag state lives entirely in refs
  const isDraggingRef = useRef(false);
  const isExitingRef = useRef(false);
  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const exitDirRef = useRef<1 | -1>(1);
  const emailSnapshotRef = useRef<Email | null>(null);

  const currentEmail = emails[0] ?? null;

  /**
   * Apply visual state to DOM nodes directly — called on every pointermove
   * and on pointer-up (for snap-back or exit). No React state involved.
   */
  const applyVisuals = useCallback((offset: number, transitioning: boolean) => {
    const card = cardRef.current;
    if (!card) return;

    const rotation = (offset / EXIT_DISTANCE) * MAX_ROTATION;
    const isExit = Math.abs(offset) >= EXIT_DISTANCE * 0.8;

    card.style.transition = transitioning
      ? 'transform 0.3s ease-out, opacity 0.3s ease-out'
      : 'none';
    card.style.transform = `translateX(${offset}px) rotate(${rotation}deg)`;
    card.style.opacity = isExit ? '0' : '1';

    const deleteProg = Math.min(Math.max(offset / SWIPE_THRESHOLD, 0), 1);
    const skipProg = Math.min(Math.max(-offset / SWIPE_THRESHOLD, 0), 1);

    if (deleteOverlayRef.current) {
      deleteOverlayRef.current.style.opacity = String(deleteProg * 0.5);
    }
    if (skipOverlayRef.current) {
      skipOverlayRef.current.style.opacity = String(skipProg * 0.5);
    }
    if (deleteBadgeRef.current) {
      deleteBadgeRef.current.style.opacity = String(deleteProg);
      deleteBadgeRef.current.style.transform = `scale(${0.6 + deleteProg * 0.4})`;
    }
    if (skipBadgeRef.current) {
      skipBadgeRef.current.style.opacity = String(skipProg);
      skipBadgeRef.current.style.transform = `scale(${0.6 + skipProg * 0.4})`;
    }
  }, []);

  /**
   * When the emails array changes (card removed by parent), make sure
   * the new top card starts from a clean visual state.
   */
  useEffect(() => {
    isExitingRef.current = false;
    isDraggingRef.current = false;
    currentOffsetRef.current = 0;
    emailSnapshotRef.current = null;
    // Reset card DOM to origin without transition
    requestAnimationFrame(() => applyVisuals(0, false));
  }, [currentEmail?.id, applyVisuals]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isExitingRef.current || !currentEmail) return;
      startXRef.current = e.clientX;
      currentOffsetRef.current = 0;
      isDraggingRef.current = true;
      applyVisuals(0, false);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [currentEmail, applyVisuals]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || isExitingRef.current) return;
      const diff = e.clientX - startXRef.current;
      currentOffsetRef.current = diff;
      applyVisuals(diff, false);
    },
    [applyVisuals]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current || isExitingRef.current || !currentEmail) return;
    isDraggingRef.current = false;

    const offset = currentOffsetRef.current;

    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      const dir = offset > 0 ? 1 : -1;
      emailSnapshotRef.current = currentEmail;
      exitDirRef.current = dir as 1 | -1;
      isExitingRef.current = true;
      applyVisuals(dir * EXIT_DISTANCE, true);
    } else {
      applyVisuals(0, true);
    }
  }, [currentEmail, applyVisuals]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      if (!isExitingRef.current || !emailSnapshotRef.current) return;

      const email = emailSnapshotRef.current;
      const dir = exitDirRef.current;
      emailSnapshotRef.current = null;
      isExitingRef.current = false;

      if (dir > 0) {
        onSwipeRight(email);
      } else {
        onSwipeLeft(email);
      }
    },
    [onSwipeRight, onSwipeLeft]
  );

  if (emails.length === 0 && !isExitingRef.current) {
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
        {/* Next card peek */}
        {emails.length > 1 && <PeekCard email={emails[1]} />}

        {/* Active card — DOM-manipulated, no React state during drag */}
        {currentEmail && (
          <div
            ref={cardRef}
            className="absolute inset-0 glass-card vibrant-glow rounded-3xl cursor-grab active:cursor-grabbing select-none overflow-hidden"
            style={{ touchAction: 'none', willChange: 'transform, opacity' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Delete overlay (right swipe - purple) */}
            <div
              ref={deleteOverlayRef}
              className="absolute inset-0 rounded-3xl bg-purple-600 pointer-events-none z-10"
              style={{ opacity: 0 }}
            />
            {/* Skip overlay (left swipe - gray) */}
            <div
              ref={skipOverlayRef}
              className="absolute inset-0 rounded-3xl bg-gray-500 pointer-events-none z-10"
              style={{ opacity: 0 }}
            />

            {/* Delete badge */}
            <div
              ref={deleteBadgeRef}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-purple-600/80 px-3 py-1.5"
              style={{ opacity: 0, transform: 'scale(0.6)' }}
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Delete
              </span>
            </div>
            {/* Skip badge */}
            <div
              ref={skipBadgeRef}
              className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-gray-500/80 px-3 py-1.5"
              style={{ opacity: 0, transform: 'scale(0.6)' }}
            >
              <SkipForward className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Skip
              </span>
            </div>

            <CardContent email={currentEmail} />
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="mt-4 text-center text-xs text-on-surface-variant">
        Swipe right to delete &bull; Swipe left to skip
      </p>
    </div>
  );
});
CardStack.displayName = 'CardStack';
