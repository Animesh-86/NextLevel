'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Sparkles, RefreshCw, Plus, Wind, Compass, Volume2, VolumeX } from 'lucide-react';

// ─── 14 Rich Tech Stack SVG Data URIs ─────────────────────────────────────────
const TECH_ICONS = [
  // 1. React
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#0d1117"/>
      <circle cx="50" cy="50" r="7" fill="#61dafb"/>
      <g stroke="#61dafb" stroke-width="2.5" fill="none">
        <ellipse cx="50" cy="50" rx="34" ry="13"/>
        <ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)"/>
        <ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)"/>
      </g>
    </svg>
  `)}`,
  // 2. TypeScript
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#3178c6"/>
      <text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="-1">TS</text>
    </svg>
  `)}`,
  // 3. JavaScript
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#f7df1e"/>
      <text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#000000" text-anchor="middle" letter-spacing="-1">JS</text>
    </svg>
  `)}`,
  // 4. Python
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e293b"/>
      <path d="M50 20 c-12 0 -20 5 -20 15 l0 8 l20 0 l0 3 l-28 0 c-10 0 -15 8 -15 20 c0 12 7 20 18 20 l6 0 l0 -9 c0 -11 9 -19 20 -19 l19 0 c9 0 16 -7 16 -16 l0 -6 c0 -10 -7 -16 -16 -16 z" fill="#387eb8"/>
      <circle cx="42" cy="28" r="3" fill="#ffffff"/>
      <path d="M50 80 c12 0 20 -5 20 -15 l0 -8 l-20 0 l0 -3 l28 0 c10 0 15 -8 15 -20 c0 -12 -7 -20 -18 -20 l-6 0 l0 9 c0 11 -9 19 -20 19 l-19 0 c-9 0 -16 7 -16 16 l0 6 c0 10 7 16 16 16 z" fill="#ffe052"/>
      <circle cx="58" cy="72" r="3" fill="#ffffff"/>
    </svg>
  `)}`,
  // 5. Next.js
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="#333333" stroke-width="2"/>
      <path d="M36 28 L36 72 M36 28 L68 70 M68 28 L68 72" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none"/>
    </svg>
  `)}`,
  // 6. Node.js
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#14532d"/>
      <polygon points="50,18 80,34 80,66 50,82 20,66 20,34" fill="#22c55e"/>
      <text x="50" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">node</text>
    </svg>
  `)}`,
  // 7. Docker
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#0284c7"/>
      <rect x="22" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="32" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="42" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="32" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="42" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="52" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="52" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <path d="M80 48c-2-5-8-8-13-7-3-7-13-10-20-7-1 0-1 0-2 1v15H24c-5 0-9 4-9 9 0 11 9 20 20 20 16 0 32-11 36-23 4-1 7-4 11-7z" fill="#ffffff"/>
    </svg>
  `)}`,
  // 8. Java
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e3a5f"/>
      <path d="M35 50 c15 5 25 -5 32 4 c0 0 -4 4 -12 6 c-15 4 -28 -5 -20 -10 z" fill="#f97316"/>
      <path d="M30 62 c18 6 35 -4 45 4 c0 0 -5 5 -15 7 c-20 4 -38 -6 -30 -11 z" fill="#f97316"/>
      <path d="M48 24 c5 8 -2 15 -2 15 c0 0 8 -7 4 -15 z" fill="#ea580c"/>
    </svg>
  `)}`,
  // 9. Git
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#f05032"/>
      <g transform="rotate(45 50 50)" fill="#ffffff">
        <rect x="46" y="24" width="8" height="52" rx="4"/>
        <circle cx="50" cy="28" r="8"/>
        <circle cx="50" cy="72" r="8"/>
        <circle cx="68" cy="50" r="8"/>
        <path d="M50 48 Q 50 50 68 50" stroke="#ffffff" stroke-width="8" fill="none"/>
      </g>
    </svg>
  `)}`,
  // 10. PostgreSQL
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e3a8a"/>
      <text x="50" y="65" font-family="system-ui, sans-serif" font-weight="900" font-size="38" fill="#ffffff" text-anchor="middle">SQL</text>
    </svg>
  `)}`,
  // 11. AWS
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#090d16"/>
      <text x="50" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">AWS</text>
      <path d="M28 64 Q50 78 72 64" stroke="#ff9900" stroke-width="5" stroke-linecap="round" fill="none"/>
      <polygon points="72,64 67,58 65,65" fill="#ff9900"/>
    </svg>
  `)}`,
  // 12. Rust
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#9a3412"/>
      <circle cx="50" cy="50" r="44" stroke="#ffffff" stroke-width="3" stroke-dasharray="8 4" fill="none"/>
      <text x="50" y="67" font-family="Georgia, serif" font-weight="bold" font-size="48" fill="#ffffff" text-anchor="middle">R</text>
    </svg>
  `)}`,
  // 13. GraphQL
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#831843"/>
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="#f43f5e" stroke-width="4" fill="none"/>
      <circle cx="50" cy="18" r="5" fill="#ffffff"/>
      <circle cx="78" cy="34" r="5" fill="#ffffff"/>
      <circle cx="78" cy="66" r="5" fill="#ffffff"/>
      <circle cx="50" cy="82" r="5" fill="#ffffff"/>
      <circle cx="22" cy="66" r="5" fill="#ffffff"/>
      <circle cx="22" cy="34" r="5" fill="#ffffff"/>
      <polygon points="50,28 70,62 30,62" stroke="#ffffff" stroke-width="3" fill="none"/>
    </svg>
  `)}`,
  // 14. Linux
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#18181b"/>
      <ellipse cx="50" cy="55" rx="22" ry="28" fill="#ffffff"/>
      <ellipse cx="50" cy="55" rx="18" ry="24" fill="#000000"/>
      <circle cx="50" cy="30" r="14" fill="#ffffff"/>
      <circle cx="50" cy="30" r="12" fill="#000000"/>
      <circle cx="46" cy="28" r="2.5" fill="#ffffff"/>
      <circle cx="54" cy="28" r="2.5" fill="#ffffff"/>
      <polygon points="46,33 54,33 50,40" fill="#f59e0b"/>
      <ellipse cx="38" cy="80" rx="10" ry="5" fill="#f59e0b"/>
      <ellipse cx="62" cy="80" rx="10" ry="5" fill="#f59e0b"/>
    </svg>
  `)}`
];

// ─── Framer BubblePit Texture Baker ───────────────────────────────────────────
const textureCache = new Map();

const createGlassyTexture = (url, size) => {
  const key = `${url}__${size}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(url);

      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 1;

      // 1. Clip circle & draw scaled graphic
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      const warpScale = 1.18;
      const wo = (size * (warpScale - 1)) / 2;
      ctx.drawImage(img, -wo, -wo, size * warpScale, size * warpScale);

      // 2. Rim gradient for volumetric depth
      const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
      rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(0.3, 'rgba(0,0,0,0.08)');
      rimGrad.addColorStop(0.62, 'rgba(0,0,0,0.32)');
      rimGrad.addColorStop(0.85, 'rgba(0,0,0,0.62)');
      rimGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 3. Specular glass stroke border
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - Math.max(size * 0.015, 1), 0, Math.PI * 2);
      const ringGrad = ctx.createLinearGradient(cx - r * 0.8, cy - r * 0.8, cx + r * 0.55, cy + r * 0.55);
      ringGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
      ringGrad.addColorStop(0.15, 'rgba(225,240,255,0.48)');
      ringGrad.addColorStop(0.35, 'rgba(180,215,255,0.14)');
      ringGrad.addColorStop(0.55, 'rgba(120,170,230,0.04)');
      ringGrad.addColorStop(0.75, 'rgba(160,200,255,0.08)');
      ringGrad.addColorStop(1, 'rgba(210,235,255,0.26)');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = Math.max(size * 0.018, 1.2);
      ctx.stroke();
      ctx.restore();

      // 4. Primary upper highlight ellipse
      ctx.save();
      const hlX = cx - r * 0.2;
      const hlY = cy - r * 0.35;
      const hlRx = r * 0.45;
      const hlRy = r * 0.24;
      const primaryHL = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlRx);
      primaryHL.addColorStop(0, 'rgba(255,255,255,0.45)');
      primaryHL.addColorStop(0.3, 'rgba(255,255,255,0.22)');
      primaryHL.addColorStop(0.6, 'rgba(255,255,255,0.05)');
      primaryHL.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(hlX, hlY, hlRx, hlRy, -Math.PI * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = primaryHL;
      ctx.fill();
      ctx.restore();

      // 5. Intense pinpoint highlight dot
      ctx.save();
      const dotX = cx - r * 0.33;
      const dotY = cy - r * 0.46;
      const dotR = r * 0.065;
      const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR);
      dotGrad.addColorStop(0, 'rgba(255,255,255,1.0)');
      dotGrad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
      dotGrad.addColorStop(0.75, 'rgba(255,255,255,0.15)');
      dotGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = dotGrad;
      ctx.fill();
      ctx.restore();

      // 6. Secondary bottom bounce specular reflection
      ctx.save();
      const secX = cx + r * 0.36;
      const secY = cy + r * 0.42;
      const secGrad = ctx.createRadialGradient(secX, secY, 0, secX, secY, r * 0.2);
      secGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
      secGrad.addColorStop(0.6, 'rgba(255,255,255,0.06)');
      secGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(secX, secY, r * 0.2, r * 0.11, Math.PI * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = secGrad;
      ctx.fill();
      ctx.restore();

      resolve(canvas.toDataURL());
    };

    img.onerror = () => resolve(url);
  });

  textureCache.set(key, p);
  return p;
};

// ─── Add a single physics bubble ──────────────────────────────────────────────
function addBubble(engine, texture, opts) {
  const bubble = Matter.Bodies.circle(opts.x, opts.y, opts.radius, {
    restitution: opts.restitution || 0.85,
    friction: 0.03,
    frictionAir: 0.005,
    render: {
      sprite: {
        texture,
        xScale: 1,
        yScale: 1
      }
    }
  });

  Matter.Body.setVelocity(bubble, {
    x: (Math.random() - 0.5) * 12,
    y: opts.velocityY || 0
  });

  Matter.Composite.add(engine.world, bubble);
}

/**
 * BubblePit Component
 * Real-time physics tech-stack bubble sandbox inspired by Framer Bubblepit.
 * Ensures pure black screen (#000000) and glassy tech spheres reacting to cursor air pressure.
 */
// Maximum dynamic physics spheres allowed simultaneously to protect browser memory and performance
const MAX_BUBBLES = 50;

export default function BubblePit({
  bubbleCount = 0,
  minRadius = 34,
  maxRadius = 54,
  restitution = 0.85,
  airPressure = 0.016,
  className = '',
  style = {}
}) {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const timersRef = useRef([]);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeBubbleCount, setActiveBubbleCount] = useState(0);
  const [gravityMode, setGravityMode] = useState('down'); // 'down' | 'zero' | 'up'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const audioCtxRef = useRef(null);
  const lastSoundTimeRef = useRef(0);

  // Play satisfying glassy marble pop on collision
  const playCollisionSound = useCallback((intensity = 1) => {
    if (!soundEnabledRef.current) return;
    const now = performance.now();
    if (now - lastSoundTimeRef.current < 45) return;
    lastSoundTimeRef.current = now;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 440 + Math.random() * 320;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, ctx.currentTime + 0.045);

      const volumeLevel = Math.min(0.18, 0.035 + intensity * 0.03);
      gain.gain.setValueAtTime(volumeLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.055);
    } catch (err) {}
  }, []);

  // Update container dimensions
  useEffect(() => {
    const update = () => {
      if (sceneRef.current) {
        setDimensions({
          width: sceneRef.current.clientWidth,
          height: sceneRef.current.clientHeight
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (sceneRef.current) ro.observe(sceneRef.current);
    return () => ro.disconnect();
  }, []);

  // Initialize Matter.js Physics Engine
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || !sceneRef.current) return;

    const gravityY = gravityMode === 'down' ? 0.95 : gravityMode === 'up' ? -0.7 : 0;
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: gravityY }
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width: dimensions.width,
        height: dimensions.height,
        wireframes: false,
        background: 'transparent'
      }
    });
    renderRef.current = render;

    render.canvas.style.position = 'absolute';
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.width = '100%';
    render.canvas.style.height = '100%';
    render.canvas.style.cursor = 'grab';

    // Bounding Box Walls (bottom, left, right, top)
    const wallThickness = 120;
    const walls = [
      // Floor
      Matter.Bodies.rectangle(dimensions.width / 2, dimensions.height + wallThickness / 2, dimensions.width * 2, wallThickness, {
        isStatic: true,
        render: { visible: false }
      }),
      // Left Wall
      Matter.Bodies.rectangle(-wallThickness / 2, dimensions.height / 2, wallThickness, dimensions.height * 2, {
        isStatic: true,
        render: { visible: false }
      }),
      // Right Wall
      Matter.Bodies.rectangle(dimensions.width + wallThickness / 2, dimensions.height / 2, wallThickness, dimensions.height * 2, {
        isStatic: true,
        render: { visible: false }
      }),
      // Ceiling (stops bubbles escaping when gravity is inverted)
      Matter.Bodies.rectangle(dimensions.width / 2, -wallThickness / 2, dimensions.width * 2, wallThickness, {
        isStatic: true,
        render: { visible: false }
      })
    ];
    Matter.Composite.add(engine.world, walls);

    // Mouse Drag Constraint
    const mouse = Matter.Mouse.create(render.canvas);
    const mc = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.25, render: { visible: false } }
    });
    Matter.Composite.add(engine.world, mc);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Click to spawn tech bubble (with safety ceiling to protect memory)
    const handleClick = (e) => {
      const rect = render.canvas.getBoundingClientRect();
      const clickX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const clickY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      if (!engineRef.current) return;
      const currentBodies = Matter.Composite.allBodies(engineRef.current.world).filter((b) => !b.isStatic);
      if (currentBodies.length >= MAX_BUBBLES) {
        // Prune oldest bubbles to prevent memory overflow
        const excess = currentBodies.slice(0, 2);
        Matter.Composite.remove(engineRef.current.world, excess);
      }

      for (let i = 0; i < 2; i++) {
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const iconSvg = TECH_ICONS[Math.floor(Math.random() * TECH_ICONS.length)];
        createGlassyTexture(iconSvg, Math.round(radius * 2)).then((tex) => {
          if (!engineRef.current) return;
          addBubble(engineRef.current, tex, {
            x: clickX + (Math.random() - 0.5) * 30,
            y: clickY + (Math.random() - 0.5) * 30,
            radius,
            restitution,
            velocityY: -(Math.random() * 12 + 6)
          });
          setActiveBubbleCount((prev) => Math.min(prev + 1, MAX_BUBBLES));
        });
      }
    };

    // Cursor Air-Pressure Fluid Push (Hover reaction)
    const handleMouseMove = (e) => {
      const rect = render.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const bodies = Matter.Composite.allBodies(engine.world).filter((b) => !b.isStatic);
      for (const body of bodies) {
        const dx = body.position.x - mx;
        const dy = body.position.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bodyRadius = Math.sqrt(body.area / Math.PI);
        const influence = bodyRadius * 3.0;

        if (dist < influence && dist > 1) {
          const proximity = 1 - dist / influence;
          const smooth = proximity * proximity;
          const nx = dx / dist;
          const ny = dy / dist;
          const strength = smooth * airPressure * body.mass;
          Matter.Body.applyForce(body, body.position, {
            x: nx * strength,
            y: ny * strength
          });
        }
      }
    };

    render.canvas.addEventListener('mousedown', handleClick);
    render.canvas.addEventListener('mousemove', handleMouseMove);

    // Collision sound listener
    const handleCollision = (event) => {
      const pairs = event.pairs;
      if (!pairs || pairs.length === 0) return;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const speedA = pair.bodyA.speed || 0;
        const speedB = pair.bodyB.speed || 0;
        const relativeSpeed = Math.abs(speedA - speedB) + Math.max(speedA, speedB);
        if (relativeSpeed > 1.1) {
          playCollisionSound(Math.min(relativeSpeed, 4));
          break;
        }
      }
    };
    Matter.Events.on(engine, 'collisionStart', handleCollision);

    // Initial Staggered Spawn of Tech Bubbles (only if bubbleCount > 0)
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (bubbleCount > 0) {
      const stagger = 3200 / bubbleCount;
      for (let i = 0; i < bubbleCount; i++) {
        const t = setTimeout(() => {
          if (!engineRef.current) return;
          const radius = minRadius + Math.random() * (maxRadius - minRadius);
          const iconSvg = TECH_ICONS[i % TECH_ICONS.length];
          createGlassyTexture(iconSvg, Math.round(radius * 2)).then((tex) => {
            if (!engineRef.current) return;
            addBubble(engineRef.current, tex, {
              x: Math.random() * (dimensions.width - radius * 2) + radius,
              y: -radius * 2,
              radius,
              restitution,
              velocityY: Math.random() * 3 + 2
            });
            setActiveBubbleCount((prev) => prev + 1);
          });
        }, i * stagger);
        timersRef.current.push(t);
      }
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      Matter.Events.off(engine, 'collisionStart', handleCollision);
      render.canvas.removeEventListener('mousedown', handleClick);
      render.canvas.removeEventListener('mousemove', handleMouseMove);
      Matter.Runner.stop(runner);
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
    // gravityMode is decoupled to allow dynamic in-place updates without engine re-instantiation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, bubbleCount, minRadius, maxRadius, restitution, airPressure, playCollisionSound]);

  // Dynamically update gravity without rebuilding engine or duplicating bubbles
  useEffect(() => {
    if (!engineRef.current) return;
    const gravityY = gravityMode === 'down' ? 0.95 : gravityMode === 'up' ? -0.7 : 0;
    engineRef.current.gravity.y = gravityY;
  }, [gravityMode]);

  // Keep active bubble count accurately synced with physics world
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world).filter((b) => !b.isStatic);
        setActiveBubbleCount(bodies.length);
      }
    }, 800);
    return () => clearInterval(syncInterval);
  }, []);

  // Action: Spawn 3 random tech bubbles
  const handleSpawnBatch = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!engineRef.current || dimensions.width === 0) return;
    
    // Prune excess bubbles before batch spawning to enforce memory limit
    const currentBodies = Matter.Composite.allBodies(engineRef.current.world).filter((b) => !b.isStatic);
    if (currentBodies.length >= MAX_BUBBLES) {
      const toPrune = currentBodies.slice(0, 3);
      Matter.Composite.remove(engineRef.current.world, toPrune);
    }

    for (let i = 0; i < 3; i++) {
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const iconSvg = TECH_ICONS[Math.floor(Math.random() * TECH_ICONS.length)];
      createGlassyTexture(iconSvg, Math.round(radius * 2)).then((tex) => {
        if (!engineRef.current) return;
        addBubble(engineRef.current, tex, {
          x: Math.random() * (dimensions.width - 100) + 50,
          y: -radius * 2,
          radius,
          restitution,
          velocityY: Math.random() * 5 + 4
        });
        const currentCount = Matter.Composite.allBodies(engineRef.current.world).filter((b) => !b.isStatic).length;
        setActiveBubbleCount(currentCount);
      });
    }
  }, [dimensions.width, minRadius, maxRadius, restitution]);

  // Action: Clear all dynamic bubbles
  const handleClearBubbles = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!engineRef.current) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const nonStatic = Matter.Composite.allBodies(engineRef.current.world).filter((b) => !b.isStatic);
    Matter.Composite.remove(engineRef.current.world, nonStatic);
    setActiveBubbleCount(0);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '380px',
        background: '#000000',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
        ...style
      }}
      className={className}
    >
      {/* Physics Canvas Mount */}
      <div
        ref={sceneRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          overflow: 'hidden'
        }}
      />

      {/* Ambient Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0, 0, 0, 0.7) 100%)'
        }}
      />

      {/* Top Floating Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          right: '1rem',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#34d399'
            }}
          >
            <Sparkles size={12} /> Tech Bubble Pit
          </span>

          <span
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '20px',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            {activeBubbleCount}/{MAX_BUBBLES} Spheres
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gravity Cycle */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setGravityMode((prev) => (prev === 'down' ? 'zero' : prev === 'zero' ? 'up' : 'down'));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#f4f4f6',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
            title="Cycle Gravity (Normal / Zero-G / Inverted)"
          >
            <Compass size={12} /> {gravityMode === 'down' ? '1G Normal' : gravityMode === 'zero' ? '0G Space' : 'Anti-G'}
          </button>

          {/* Sound On / Muted Toggle */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled((prev) => !prev);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: soundEnabled ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              border: soundEnabled ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: soundEnabled ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
            title={soundEnabled ? 'Collision sound enabled (Click to mute)' : 'Collision sound muted (Click to unmute)'}
          >
            {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Spawn +3 */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleSpawnBatch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
            title="Spawn more tech bubbles"
          >
            <Plus size={12} /> Spawn
          </button>

          {/* Reset / Clear */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleClearBubbles}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
            title="Clear all bubbles"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.85rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          fontSize: '0.72rem',
          color: 'rgba(255, 255, 255, 0.35)',
          letterSpacing: '0.04em'
        }}
      >
        ✦ Move cursor to push bubbles with air pressure • Click to burst-spawn tech icons
      </div>
    </div>
  );
}
