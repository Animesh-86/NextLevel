'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Authentic Framer Preloader (Preloader-EOUP)
 * Source: https://framer.com/m/Preloader-EOUP.js@2WjAeiGYSE2ViOhEsSSk
 * 
 * Features:
 * - Pure jet-black background (#000000)
 * - Kinetic typography with light Inter font weight (300)
 * - 4-stage dynamic layout shift (Left -> Scale -> Right -> Center -> Curtain Exit)
 * - Engaging & humorous assessment loading messages
 */

const DEFAULT_TITLES = [
  'PREPARING YOUR TEST',
  'SHUFFLING SNEAKY QUESTIONS',
  'CALIBRATING COGNITIVE LOAD',
  'BREATHE IN, BREATHE OUT',
  'READY TO CRUSH IT',
];

// Spring physics matching Framer's exact spec
const springTransition = {
  type: 'spring',
  damping: 45,
  stiffness: 280,
  mass: 1,
};

export default function AssessmentPreloader({
  titles = DEFAULT_TITLES,
  onComplete,
  active = true
}) {
  // 0: Variant 1 (left-aligned)
  // 1: Variant 2 (scaled staggered)
  // 2: Variant 3 (right-aligned)
  // 3: Variant 4 (centered)
  // 4: Variant 5 (curtain exit)
  const [variantIndex, setVariantIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Timing sequence from Framer spec: 600ms -> 700ms -> 700ms -> 800ms -> Exit
    const timer1 = setTimeout(() => setVariantIndex(1), 600);
    const timer2 = setTimeout(() => setVariantIndex(2), 1300);
    const timer3 = setTimeout(() => setVariantIndex(3), 2000);
    const timer4 = setTimeout(() => {
      setVariantIndex(4);
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [active, onComplete]);

  if (!active) return null;

  // Determine text alignment for the container
  const alignment =
    variantIndex === 0
      ? 'flex-start'
      : variantIndex === 1
      ? 'flex-start'
      : variantIndex === 2
      ? 'flex-end'
      : 'center';

  // Determine font sizes per title based on the active variant
  const getFontSize = (index) => {
    if (variantIndex === 0) return 'clamp(1.75rem, 3.2vw, 2.5rem)';
    if (variantIndex === 1) {
      const sizes = ['clamp(2.5rem, 4.5vw, 4rem)', 'clamp(2.2rem, 4vw, 3.5rem)', 'clamp(1.9rem, 3.5vw, 3rem)', 'clamp(1.6rem, 3vw, 2.5rem)', 'clamp(1.4rem, 2.5vw, 2rem)'];
      return sizes[index] || '2rem';
    }
    if (variantIndex === 2) {
      const sizes = ['clamp(1.4rem, 2.5vw, 2rem)', 'clamp(1.6rem, 3vw, 2.5rem)', 'clamp(1.9rem, 3.5vw, 3rem)', 'clamp(2.2rem, 4vw, 3.5rem)', 'clamp(2.5rem, 4.5vw, 4rem)'];
      return sizes[index] || '2rem';
    }
    // Variant 4 (Centered): unified prominent size
    return 'clamp(2rem, 3.8vw, 3.2rem)';
  };

  // Determine opacity per row
  const getOpacity = (index) => {
    if (variantIndex === 3) return 1;
    if (variantIndex === 1) {
      return [1, 0.85, 0.7, 0.55, 0.4][index] || 0.8;
    }
    if (variantIndex === 2) {
      return [0.4, 0.55, 0.7, 0.85, 1][index] || 0.8;
    }
    return 0.85;
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="framer-eoup-preloader"
          initial={{ opacity: 1, y: 0 }}
          exit={{ y: '-100%', transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000', // Pure black only, as requested
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            userSelect: 'none',
            padding: '2rem',
          }}
        >
          {/* Kinetic Typography Stack */}
          <motion.div
            layout
            transition={springTransition}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: alignment,
              justifyContent: 'center',
              width: '100%',
              maxWidth: '1200px',
              gap: '0.35rem',
            }}
          >
            {titles.map((titleText, idx) => (
              <motion.div
                key={idx}
                layout
                transition={springTransition}
                style={{
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: 300, // Exact Inter-Light weight (300) from Framer Preloader-EOUP
                  fontSize: getFontSize(idx),
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                  opacity: getOpacity(idx),
                  whiteSpace: 'pre',
                  transition: 'opacity 0.3s ease, font-size 0.35s ease',
                  textTransform: 'uppercase',
                }}
              >
                {titleText}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
