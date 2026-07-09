'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function CursorShadowText(props) {
  const {
    text = 'Your Intelligent Second Brain.',
    textColor = '#ffffff',
    shadowColor1 = 'rgba(255, 255, 255, 0.4)',
    shadowColor2 = 'rgba(255, 255, 255, 0.2)',
    shadowColor3 = 'rgba(255, 255, 255, 0.1)',
    shadowColor4 = 'transparent',
    shadowColor5 = 'transparent',
    shadowCount = 3,
    shadowDistance = 4,
    sensitivity = 0.15,
    font = {},
    shadowEffect = 'blur',
    blurAmount = 4,
    noiseIntensity = 10,
    glowIntensity = 8,
    style,
    className
  } = props;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [elementCenter, setElementCenter] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Create active shadow colors using individual color props
  const activeShadowColors = useMemo(() => {
    const individualColors = [shadowColor1, shadowColor2, shadowColor3, shadowColor4, shadowColor5];
    const colors = [];
    for (let i = 0; i < shadowCount; i++) {
      colors.push(individualColors[i]);
    }
    return colors;
  }, [shadowColor1, shadowColor2, shadowColor3, shadowColor4, shadowColor5, shadowCount]);

  // Memoized mouse move handler
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Setup mouse tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove]);

  // Update element center position when ref changes or window resizes
  const updateCenter = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setElementCenter(prev => {
        const newX = rect.left + rect.width / 2;
        const newY = rect.top + rect.height / 2;
        if (prev.x === newX && prev.y === newY) return prev;
        return { x: newX, y: newY };
      });
    }
  }, []);

  useEffect(() => {
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, [updateCenter, text]);

  // Memoized shadow positions calculation
  const shadowPositions = useMemo(() => {
    const deltaX = (mousePosition.x - elementCenter.x) * sensitivity;
    const deltaY = (mousePosition.y - elementCenter.y) * sensitivity;
    
    // Reverse the clamp so shadows go opposite to mouse for a cooler effect
    const clampedX = Math.max(-shadowDistance * 3, Math.min(shadowDistance * 3, -deltaX));
    const clampedY = Math.max(-shadowDistance * 3, Math.min(shadowDistance * 3, -deltaY));

    return activeShadowColors.map((color, index) => {
      const multiplier = index + 1;
      return {
        x: (mousePosition.x === 0 && mousePosition.y === 0) ? shadowDistance * multiplier : clampedX * multiplier,
        y: (mousePosition.x === 0 && mousePosition.y === 0) ? shadowDistance * multiplier : clampedY * multiplier,
        color
      };
    });
  }, [mousePosition, elementCenter, sensitivity, shadowDistance, activeShadowColors]);

  // Generate noise filter if needed
  const noiseFilter = useMemo(() => {
    if (shadowEffect !== 'noise') return null;
    return (
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency={noiseIntensity / 100} numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={noiseIntensity} />
        </filter>
      </svg>
    );
  }, [shadowEffect, noiseIntensity]);

  // Get effect styles for shadows
  const getEffectStyles = (effect, shadowColor) => {
    switch (effect) {
      case 'blur':
        return { filter: `blur(${blurAmount}px)` };
      case 'noise':
        return { filter: 'url(#noise)' };
      case 'glow':
        return { filter: `blur(${glowIntensity}px)` };
      case 'solid':
      default:
        return {};
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {noiseFilter}
      {shadowPositions.map((shadow, index) => (
        <motion.div
          key={index}
          style={{
            position: 'absolute',
            color: shadow.color,
            margin: 0,
            userSelect: 'none',
            zIndex: shadowPositions.length - index,
            ...font,
            ...getEffectStyles(shadowEffect, shadow.color)
          }}
          animate={{ x: shadow.x, y: shadow.y }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          aria-hidden="true"
        >
          {text}
        </motion.div>
      ))}
      <motion.div
        style={{
          position: 'relative',
          color: textColor,
          margin: 0,
          userSelect: 'none',
          zIndex: shadowPositions.length + 1,
          ...font
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}
