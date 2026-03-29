import React, { useState, useCallback, useRef } from 'react';
import { Email } from '../types';
import { Trash2, SkipForward } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from 'motion/react';

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;
const EXIT_DISTANCE = 400;

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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const processedIdRef = useRef<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const deleteOverlayOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.6]);
  const skipOverlayOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.6, 0]);

  const currentEmail = emails[0] ?? null;

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimatingOut || !currentEmail) return;

      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;

      const swipedRight =
        offsetX > SWIPE_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD;
      const swipedLeft =
        offsetX < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (swipedRight) {
        processedIdRef.current = currentEmail.id;
        setExitDirection('right');
        setIsAnimatingOut(true);
      } else if (swipedLeft) {
        processedIdRef.current = currentEmail.id;
        setExitDirection('left');
        setIsAnimatingOut(true);
      }
      // If neither threshold met, motion will spring back automatically
    },
    [currentEmail, isAnimatingOut]
  );

  const handleExitComplete = useCallback(() => {
    if (!exitDirection || !processedIdRef.current) return;

    const emailToProcess = emails.find(
      (e) => e.id === processedIdRef.current
    );

    if (emailToProcess) {
      if (exitDirection === 'left') {
        onSwipeLeft(emailToProcess);
      } else {
        onSwipeRight(emailToProcess);
      }
    }

    processedIdRef.current = null;
    setExitDirection(null);
    setIsAnimatingOut(false);
    x.set(0);
  }, [exitDirection, emails, onSwipeLeft, onSwipeRight, x]);

  if (emails.length === 0 && !isAnimatingOut) {
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

        {/* Active card with drag */}
        <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
          {currentEmail && (
            <motion.div
              key={currentEmail.id}
              className="absolute inset-0 glass-card vibrant-glow rounded-3xl cursor-grab active:cursor-grabbing select-none overflow-hidden"
              style={{
                x,
                rotate,
                touchAction: 'none',
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: exitDirection === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE,
                rotate: exitDirection === 'right' ? 20 : -20,
                opacity: 0,
                transition: { duration: 0.3, ease: 'easeIn' },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Delete overlay (right swipe - purple) */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-purple-600/40 pointer-events-none z-10"
                style={{ opacity: deleteOverlayOpacity }}
              />
              {/* Skip overlay (left swipe - gray) */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gray-500/40 pointer-events-none z-10"
                style={{ opacity: skipOverlayOpacity }}
              />

              {/* Swipe direction indicators on card */}
              <motion.div
                className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-purple-600/80 px-3 py-1.5"
                style={{ opacity: deleteOverlayOpacity }}
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Delete
                </span>
              </motion.div>
              <motion.div
                className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-gray-500/80 px-3 py-1.5"
                style={{ opacity: skipOverlayOpacity }}
              >
                <SkipForward className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Skip
                </span>
              </motion.div>

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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <p className="mt-4 text-center text-xs text-on-surface-variant">
        Swipe right to delete &bull; Swipe left to skip
      </p>
    </div>
  );
};
