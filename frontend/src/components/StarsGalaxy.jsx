'use client';

import React, { useEffect, useRef } from 'react';

/**
 * StarsGalaxy Component
 * High-density 3D cosmic starfield canvas with slow meditative drift.
 */
export default function StarsGalaxy({
  stars = 1400,
  speed = 0.35, // Slow meditative flow
  twinkle = 0.4,
  background = '#000000',
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const starsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;

    const createStar = (randomZ = true) => ({
      x: (Math.random() - 0.5) * 2.0,
      y: (Math.random() - 0.5) * 2.0,
      z: randomZ ? Math.random() * 0.95 + 0.05 : 1.0,
      tw: Math.random() * Math.PI * 2,
      baseSize: Math.random() * 1.8 + 0.7,
      color: Math.random() > 0.8
        ? (Math.random() > 0.5 ? 'rgba(165, 180, 252, ' : 'rgba(110, 231, 183, ')
        : 'rgba(255, 255, 255, '
    });

    const resize = () => {
      const parent = canvas.parentElement || canvas;
      const rect = parent.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    starsRef.current = Array.from({ length: stars }, () => createStar(true));

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouse.current.x = (e.clientX - rect.left) / rect.width;
        mouse.current.y = (e.clientY - rect.top) / rect.height;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    let raf = 0;
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Dark clear with light trail
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5 + (mouse.current.x - 0.5) * 40;
      const cy = h * 0.5 + (mouse.current.y - 0.5) * 40;
      const moveDelta = speed * 0.0018;

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];

        // Move towards viewer
        s.z -= moveDelta;
        if (s.z <= 0.04) {
          starsRef.current[i] = createStar(false);
          continue;
        }

        const depth = s.z;
        const px = cx + (s.x / depth) * (w * 0.5);
        const py = cy + (s.y / depth) * (h * 0.5);

        // Wrap if out of screen bounds
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) {
          starsRef.current[i] = createStar(false);
          continue;
        }

        s.tw += 0.03;
        const twinkleFactor = 1 + Math.sin(s.tw) * twinkle;
        const alpha = Math.min(1, Math.max(0.12, (1 - s.z) * 1.3));
        const radius = Math.max(0.6, s.baseSize * (1.8 - s.z) * twinkleFactor);

        ctx.fillStyle = `${s.color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [stars, speed, twinkle, background]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        background,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
}
