'use client';

import { useEffect, useRef } from 'react';

export default function SpiralLoader({
  totalDots = 600,
  dotRadius = 2,
  duration = 3,
  dotColor = '#FFFFFF',
  backgroundColor = '#000000',
  margin = 2,
  minOpacity = 0.3,
  maxOpacity = 1,
  minScale = 0.5,
  maxScale = 1.5,
  message = 'Initializing AI Interview Engine...',
  subtext = 'Calibrating neural speech synthesis & proctoring sensors'
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const SIZE = 400;
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const CENTER = SIZE / 2;
    const MAX_RADIUS = CENTER - margin - dotRadius;

    // Clear existing content
    svg.innerHTML = '';

    // Generate dots
    for (let i = 0; i < totalDots; i++) {
      const idx = i + 0.5;
      const frac = idx / totalDots;
      const r = Math.sqrt(frac) * MAX_RADIUS;
      const theta = idx * GOLDEN_ANGLE;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', dotRadius.toString());
      circle.setAttribute('fill', dotColor);
      circle.setAttribute('opacity', '0');

      // Radius pulse animation
      const animR = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animR.setAttribute('attributeName', 'r');
      animR.setAttribute('values', `${dotRadius * minScale};${dotRadius * maxScale};${dotRadius * minScale}`);
      animR.setAttribute('dur', `${duration}s`);
      animR.setAttribute('begin', `${frac * duration}s`);
      animR.setAttribute('repeatCount', 'indefinite');
      animR.setAttribute('calcMode', 'spline');
      animR.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
      circle.appendChild(animR);

      // Opacity pulse animation
      const animO = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animO.setAttribute('attributeName', 'opacity');
      animO.setAttribute('values', `${minOpacity};${maxOpacity};${minOpacity}`);
      animO.setAttribute('dur', `${duration}s`);
      animO.setAttribute('begin', `${frac * duration}s`);
      animO.setAttribute('repeatCount', 'indefinite');
      animO.setAttribute('calcMode', 'spline');
      animO.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
      circle.appendChild(animO);

      svg.appendChild(circle);
    }
  }, [totalDots, dotRadius, duration, dotColor, margin, minOpacity, maxOpacity, minScale, maxScale]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'relative', width: 340, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          ref={svgRef}
          width="340"
          height="340"
          viewBox="0 0 400 400"
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
        />
      </div>

      {message && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem', zIndex: 10 }}>
          <div
            style={{
              color: '#FAFAFA',
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textTransform: 'uppercase'
            }}
          >
            {message}
          </div>
          {subtext && (
            <div
              style={{
                color: '#71717a',
                fontSize: '0.82rem',
                marginTop: '0.35rem',
                letterSpacing: '0.02em'
              }}
            >
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
