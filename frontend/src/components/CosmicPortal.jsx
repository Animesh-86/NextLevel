'use client';

import React, { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Gauge, Sparkles } from 'lucide-react';

const COLOR_SCHEMES = [
  { portal: '#8855FF', nebula: '#AA66FF', stardust: '#FF66FF', name: 'Deep Violet' },
  { portal: '#6666FF', nebula: '#8888FF', stardust: '#AA88FF', name: 'Electric Purple' },
  { portal: '#4488FF', nebula: '#66AAFF', stardust: '#88CCFF', name: 'Cosmic Blue' },
  { portal: '#00AAFF', nebula: '#00CCFF', stardust: '#00FFFF', name: 'Blazing Cyan' },
  { portal: '#00FFCC', nebula: '#00FFAA', stardust: '#66FFCC', name: 'Neon Teal' }
];

const SPEED_PRESETS = [
  { label: '0.25x Zen', rot: 0.1, pulse: 0.25 },
  { label: '0.5x Slow', rot: 0.22, pulse: 0.5 },
  { label: '1.0x Cosmic', rot: 0.48, pulse: 0.85 },
  { label: '1.8x Warp', rot: 0.9, pulse: 1.3 }
];

/**
 * CosmicPortal Component
 * Real-time canvas animation with slow, meditative nebula storms, stardust flows,
 * dimensional fracture rings, click shockwave explosions, and speed control.
 */
export default function CosmicPortal({
  particleCount = 110,
  glowIntensity = 0.85,
  explosionIntensity = 1,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1); // Default: 0.5x Slow
  const [explosions, setExplosions] = useState([]);
  const [electricWaves, setElectricWaves] = useState([]);

  const mouseX = useMotionValue(400);
  const mouseY = useMotionValue(300);
  const springX = useSpring(mouseX, { stiffness: 45, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 22 });

  const currentScheme = COLOR_SCHEMES[colorSchemeIndex];
  const currentSpeed = SPEED_PRESETS[speedIndex];
  const particlesRef = useRef([]);

  // Initialize stardust particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 3 + 1,
      life: Math.random() * 100,
      maxLife: 100,
      hue: Math.random() * 60 + 180,
      exploding: false,
      explosionVx: 0,
      explosionVy: 0
    }));
  }, [particleCount, dimensions]);

  // Click to trigger dimensional fracture & explosion
  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Cycle color scheme
    startTransition(() => {
      setColorSchemeIndex((prev) => (prev + 1) % COLOR_SCHEMES.length);
    });

    const explosionId = Date.now() + Math.random();
    startTransition(() => {
      setExplosions((prev) => [...prev, { x: clickX, y: clickY, time: 0, id: explosionId }]);
    });

    const waveId = Date.now() + Math.random() + 0.5;
    startTransition(() => {
      setElectricWaves((prev) => [...prev, { x: clickX, y: clickY, time: 0, id: waveId }]);
    });

    // Scatter nearby particles outward
    particlesRef.current.forEach((particle) => {
      const dx = particle.x - clickX;
      const dy = particle.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const range = 200 * explosionIntensity;
      if (dist < range) {
        const force = ((range - dist) / range) * 15;
        const angle = Math.atan2(dy, dx);
        particle.exploding = true;
        particle.explosionVx = Math.cos(angle) * force;
        particle.explosionVy = Math.sin(angle) * force;
      }
    });

    // Cleanup effects after animation completes
    setTimeout(() => {
      startTransition(() => {
        setExplosions((prev) => prev.filter((exp) => exp.id !== explosionId));
        setElectricWaves((prev) => prev.filter((wave) => wave.id !== waveId));
      });
    }, 2000);
  }, [explosionIntensity]);

  // Animation Loop with slow speeds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId;
    let time = 0;
    const rotationSpeed = currentSpeed.rot;
    const pulseSpeed = currentSpeed.pulse;

    const animate = () => {
      time += 0.01 * pulseSpeed;

      // Dark trail clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      const mouseDistX = springX.get() - centerX;
      const mouseDistY = springY.get() - centerY;
      const mouseDist = Math.sqrt(mouseDistX * mouseDistX + mouseDistY * mouseDistY);
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      const influence = isActive ? Math.max(0, 1 - mouseDist / maxDist) : 0;

      // 1. Electric Shock Waves
      electricWaves.forEach((wave) => {
        wave.time += 1;
        const waveRadius = wave.time * 7;
        const waveAlpha = Math.max(0, 1 - wave.time / 60);

        ctx.save();
        ctx.strokeStyle = `${currentScheme.nebula}${Math.floor(waveAlpha * 180).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -wave.time * 2;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, waveRadius);
        gradient.addColorStop(0, `${currentScheme.portal}${Math.floor(waveAlpha * 60).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.restore();
      });

      // 2. Click Explosions
      explosions.forEach((explosion) => {
        explosion.time += 1;
        const explosionRadius = explosion.time * 5;
        const explosionAlpha = Math.max(0, 1 - explosion.time / 40);

        for (let i = 0; i < 3; i++) {
          const ringRadius = explosionRadius - i * 20;
          if (ringRadius > 0) {
            const gradient = ctx.createRadialGradient(explosion.x, explosion.y, ringRadius * 0.5, explosion.x, explosion.y, ringRadius);
            gradient.addColorStop(0, `${currentScheme.stardust}${Math.floor(explosionAlpha * 100).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          }
        }
      });

      // 3. Portal Core & Ambient Halo (Slow Breathing)
      const pulseScale = 1 + Math.sin(time * 2) * 0.08 * influence;
      const portalRadius = 80 * pulseScale;

      for (let i = 5; i > 0; i--) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, portalRadius * (1 + i * 0.3));
        gradient.addColorStop(0, `${currentScheme.portal}${Math.floor((glowIntensity * 50) / i).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // 4. Rotating Dimensional Rings (Slow, graceful rotation)
      ctx.save();
      ctx.translate(centerX, centerY);
      for (let ring = 0; ring < 3; ring++) {
        ctx.save();
        ctx.rotate(time * rotationSpeed * (ring % 2 === 0 ? 1 : -1) + (ring * Math.PI) / 3);
        ctx.strokeStyle = `${currentScheme.nebula}${Math.floor(100 - ring * 20).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2 + influence * 2.5;
        const ringRadius = portalRadius + ring * 40;

        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const nextAngle = ((i + 0.7) / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, angle, nextAngle);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();

      // 5. Stardust Particles (Slow, fluid spiral)
      particlesRef.current.forEach((particle) => {
        if (particle.exploding) {
          particle.vx += particle.explosionVx;
          particle.vy += particle.explosionVy;
          particle.explosionVx *= 0.92;
          particle.explosionVy *= 0.92;
          if (Math.abs(particle.explosionVx) < 0.1 && Math.abs(particle.explosionVy) < 0.1) {
            particle.exploding = false;
          }
        }

        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (isActive && dist < 300 && !particle.exploding) {
          const force = ((300 - dist) / 300) * influence * 0.4;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force;
          particle.vy += Math.sin(angle) * force;
        }

        if (!particle.exploding) {
          const spiralAngle = Math.atan2(particle.y - centerY, particle.x - centerX);
          particle.vx += Math.cos(spiralAngle + Math.PI / 2) * 0.08 * rotationSpeed;
          particle.vy += Math.sin(spiralAngle + Math.PI / 2) * 0.08 * rotationSpeed;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        particle.life += 1;
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = centerX + (Math.random() - 0.5) * 100;
          particle.y = centerY + (Math.random() - 0.5) * 100;
        }

        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;

        const alpha = 1 - particle.life / particle.maxLife;
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
        gradient.addColorStop(0, `${currentScheme.stardust}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Nebula Storm When Active
      if (isActive && influence > 0.3) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
          const angle = time * 2.2 + (i * Math.PI * 2) / 5;
          const x = centerX + Math.cos(angle) * 140 * influence;
          const y = centerY + Math.sin(angle) * 140 * influence;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 75);
          gradient.addColorStop(0, `${currentScheme.nebula}40`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [dimensions, isActive, springX, springY, glowIntensity, currentSpeed, currentScheme, explosions, electricWaves]);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    startTransition(() => setIsActive(true));
  }, []);

  const handleMouseLeave = useCallback(() => {
    startTransition(() => setIsActive(false));
  }, []);

  // Update canvas sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        setDimensions({
          width: canvasRef.current.parentElement.clientWidth,
          height: canvasRef.current.parentElement.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        cursor: 'pointer',
        ...style
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Top Floating Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dimension Spectrum Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.75)',
            border: `1px solid ${currentScheme.portal}40`,
            backdropFilter: 'blur(8px)',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: currentScheme.portal
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: currentScheme.portal, display: 'inline-block' }} />
          {currentScheme.name}
        </span>

        {/* Speed Changer Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSpeedIndex((prev) => (prev + 1) % SPEED_PRESETS.length);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#f4f4f6',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
          title="Toggle rotation & pulse speed"
        >
          <Gauge size={12} color="#34d399" /> {currentSpeed.label}
        </button>
      </div>

      {/* Bottom Instructions (Replaced the below dimension text) */}
      <div
        style={{
          position: 'absolute',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          padding: '8px 20px',
          borderRadius: '30px',
          color: 'rgba(255, 255, 255, 0.82)',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
          zIndex: 5
        }}
      >
        ✦ Move cursor to warp gravitational stardust • Click anywhere to fracture dimensions & shift colors
      </div>
    </div>
  );
}
