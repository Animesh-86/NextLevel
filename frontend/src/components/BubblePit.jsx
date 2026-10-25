'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { TECH_ICONS } from './bubble-pit/techIcons';
import { createGlassyTexture, addBubble } from './bubble-pit/textureBaker';
import BubblePitControls from './bubble-pit/BubblePitControls';

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
      Matter.Bodies.rectangle(dimensions.width / 2, dimensions.height + wallThickness / 2, dimensions.width * 2, wallThickness, {
        isStatic: true,
        render: { visible: false }
      }),
      Matter.Bodies.rectangle(-wallThickness / 2, dimensions.height / 2, wallThickness, dimensions.height * 2, {
        isStatic: true,
        render: { visible: false }
      }),
      Matter.Bodies.rectangle(dimensions.width + wallThickness / 2, dimensions.height / 2, wallThickness, dimensions.height * 2, {
        isStatic: true,
        render: { visible: false }
      }),
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
      <BubblePitControls
        activeBubbleCount={activeBubbleCount}
        maxBubbles={MAX_BUBBLES}
        gravityMode={gravityMode}
        setGravityMode={setGravityMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onSpawnBatch={handleSpawnBatch}
        onClearBubbles={handleClearBubbles}
      />

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
