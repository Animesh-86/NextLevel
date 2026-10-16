'use client';

import { useEffect, useMemo, useState, useRef } from 'react';

const MOOD_STATES = {
  neutral: { lEyeRot: 0, rEyeRot: 0, eyeScale: 1, mouthW: 10, mouthY: 118, mouthCurveT: 0, mouthCurveB: 0, mouthOp: 0, browY: 86, browAngle: 0, browCurve: 0, browOp: 0 },
  happy: { lEyeRot: 0, rEyeRot: 0, eyeScale: 1, mouthW: 22, mouthY: 116, mouthCurveT: 2, mouthCurveB: 14, mouthOp: 1, browY: 78, browAngle: -5, browCurve: -4, browOp: 1 },
  sad: { lEyeRot: -12, rEyeRot: 12, eyeScale: 0.9, mouthW: 16, mouthY: 122, mouthCurveT: -6, mouthCurveB: -2, mouthOp: 1, browY: 84, browAngle: -12, browCurve: -2, browOp: 1 },
  excited: { lEyeRot: 0, rEyeRot: 0, eyeScale: 1.15, mouthW: 14, mouthY: 120, mouthCurveT: -10, mouthCurveB: 14, mouthOp: 1, browY: 74, browAngle: 0, browCurve: -6, browOp: 1 },
  angry: { lEyeRot: 18, rEyeRot: -18, eyeScale: 0.95, mouthW: 14, mouthY: 118, mouthCurveT: -3, mouthCurveB: 1, mouthOp: 1, browY: 88, browAngle: 18, browCurve: 2, browOp: 1 },
  anxious: { lEyeRot: 0, rEyeRot: 0, eyeScale: 0.8, mouthW: 12, mouthY: 120, mouthCurveT: -2, mouthCurveB: 2, mouthOp: 1, browY: 80, browAngle: -4, browCurve: -1, browOp: 1 }
};

export default function InteractiveGhost({
  animationStyle = 'smooth',
  mood = 'neutral',
  colorTop = '#eaff5e',
  colorMiddle = '#a3e635',
  colorBottom = '#16a34a',
  colorBackTop = '#65a30d',
  colorBackBottom = '#14532d',
  showGlow = true,
  glowColor = '#eaff5e',
  bodyHeight = 170,
  characterScale = 1,
  floatingSpeed = 1,
  animatingSpeed = 1,
  interactiveEyes = true,
  enableChat = true,
  quotes = ["404: Lost in cyberspace! 👻", "I'm a friendly ghost!", "Page not found...", "Click me again!"],
  chatBgColor = '#ffffff',
  chatTextColor = '#000000',
  style
}) {
  const [time, setTime] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // State values for rendering (avoids reading refs during render)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentFace, setCurrentFace] = useState({ ...MOOD_STATES.neutral });

  // Internal physics refs
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const physMouseRef = useRef({ x: 0, y: 0 });
  const physFaceRef = useRef({ ...MOOD_STATES.neutral });
  const containerRef = useRef(null);
  const moodRef = useRef(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  // Main animation & physics loop
  useEffect(() => {
    let animationFrameId;
    const start = Date.now();

    const renderLoop = () => {
      const elapsed = Date.now() - start;
      setTime(elapsed);

      const dx = targetMouseRef.current.x - physMouseRef.current.x;
      const dy = targetMouseRef.current.y - physMouseRef.current.y;
      physMouseRef.current.x += dx * 0.08;
      physMouseRef.current.y += dy * 0.08;

      const velocity = Math.sqrt(dx * dx + dy * dy);
      const mouthReaction = Math.min(velocity * 15, 5);

      const baseTarget = MOOD_STATES[moodRef.current] || MOOD_STATES.neutral;
      const targetFace = { ...baseTarget };

      if (baseTarget.mouthOp > 0) {
        targetFace.mouthCurveT -= mouthReaction * 0.5;
        targetFace.mouthCurveB += mouthReaction;
      } else if (mouthReaction > 0.5) {
        targetFace.mouthOp = Math.min(0.6, mouthReaction * 0.2);
        targetFace.mouthW = 8;
        targetFace.mouthCurveT = -mouthReaction * 0.5;
        targetFace.mouthCurveB = mouthReaction;
      }

      const activeFace = physFaceRef.current;
      for (const key in targetFace) {
        activeFace[key] += (targetFace[key] - activeFace[key]) * 0.12;
      }

      setMousePos({ x: physMouseRef.current.x, y: physMouseRef.current.y });
      setCurrentFace({ ...activeFace });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e) => {
    if (!interactiveEyes || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetMouseRef.current = { x: x * 2, y: y * 2 };
  };

  const handleMouseLeave = () => {
    if (interactiveEyes) {
      targetMouseRef.current = { x: 0, y: 0 };
    }
  };

  const handleGhostClick = () => {
    if (!enableChat || quotes.length === 0) return;
    if (!chatOpen) {
      setChatOpen(true);
    } else {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }
  };

  const cx = 100;
  const R = 70;
  const baseY = bodyHeight;

  const { frontPath, backPath } = useMemo(() => {
    if (animationStyle === 'classic') {
      const amp = 14;
      const numWaves = 3;
      const speed = 0.003 * animatingSpeed;
      let fPath = `M ${cx - R} 100 A ${R} ${R} 0 0 1 ${cx + R} 100 `;
      for (let i = 0; i <= 50; i++) {
        const theta = (i / 50) * Math.PI;
        const x = cx + R * Math.cos(theta);
        const y = baseY + Math.sin(theta * numWaves - time * speed) * amp;
        fPath += `L ${x} ${y} `;
      }
      fPath += `Z`;
      let bPath = `M ${cx - R} 100 L ${cx + R} 100 `;
      for (let i = 0; i <= 50; i++) {
        const theta = 2 * Math.PI - (i / 50) * Math.PI;
        const x = cx + R * Math.cos(theta);
        const y = baseY + Math.sin(theta * numWaves - time * speed) * amp;
        bPath += `L ${x} ${y} `;
      }
      bPath += `Z`;
      return { frontPath: fPath, backPath: bPath };
    } else {
      const numPoints = 60;
      const wind = time * 0.002 * animatingSpeed;
      const getWaveY = (x, isBack) => {
        const nx = (x - cx) / R;
        const drape = Math.cos(nx * Math.PI * 0.5) * 12;
        const offset = isBack ? Math.PI * 0.8 : 0;
        const wave1 = Math.sin(nx * 3.14 - wind + offset) * 8;
        const wave2 = Math.sin(nx * 6.28 - wind * 1.5 + offset) * 3;
        const flutter = Math.sin(nx * 12 - wind * 3) * (Math.abs(nx) * 2);
        return baseY + (isBack ? -drape * 0.5 : drape) + wave1 + wave2 + flutter;
      };

      let fPath = `M ${cx - R} 100 A ${R} ${R} 0 0 1 ${cx + R} 100 `;
      for (let i = 0; i <= numPoints; i++) {
        const x = cx + R - (i / numPoints) * (2 * R);
        fPath += `L ${x} ${getWaveY(x, false)} `;
      }
      fPath += `Z`;

      let bPath = `M ${cx - R} 100 L ${cx + R} 100 `;
      for (let i = 0; i <= numPoints; i++) {
        const x = cx - R + (i / numPoints) * (2 * R);
        bPath += `L ${x} ${getWaveY(x, true)} `;
      }
      bPath += `Z`;

      return { frontPath: fPath, backPath: bPath };
    }
  }, [time, baseY, animatingSpeed, animationStyle]);

  let blinkScale = 1;
  const blinkCycle = time % 4000;
  if (blinkCycle < 150) {
    blinkScale = Math.max(0.1, 1 - Math.sin((blinkCycle / 150) * Math.PI));
  }

  const fs = currentFace;
  const mX = mousePos.x;
  const mY = mousePos.y;
  const eyeOffsetX = interactiveEyes ? mX * 16 : 0;
  const eyeOffsetY = interactiveEyes ? mY * 16 : 0;

  const isClassic = animationStyle === 'classic';
  const swayX = isClassic ? 0 : Math.cos(time * 0.0015 * floatingSpeed) * 8;
  const floatY = Math.sin(time * 0.002 * floatingSpeed) * (isClassic ? 8 : 12);
  const bodyRotation = isClassic ? 0 : (interactiveEyes ? mX * 8 : 0) + Math.sin(time * 0.001 * floatingSpeed) * 3;

  const mouthPath = `M ${100 - fs.mouthW / 2} ${fs.mouthY} Q 100 ${fs.mouthY + fs.mouthCurveT} ${100 + fs.mouthW / 2} ${fs.mouthY} Q 100 ${fs.mouthY + fs.mouthCurveB} ${100 - fs.mouthW / 2} ${fs.mouthY} Z`;
  const lBrowPath = `M 70 ${fs.browY} Q 80 ${fs.browY + fs.browCurve} 90 ${fs.browY}`;
  const rBrowPath = `M 110 ${fs.browY} Q 120 ${fs.browY + fs.browCurve} 130 ${fs.browY}`;
  const vbHeight = Math.max(240, bodyHeight + 60);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleGhostClick}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: enableChat ? 'pointer' : 'default',
        ...style
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${characterScale})`,
          transformOrigin: 'center center'
        }}
      >
        <svg
          viewBox={`-150 -80 500 ${vbHeight + 120}`}
          style={{ width: '100%', height: '100%', maxHeight: '420px', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="ghostFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorTop} />
              <stop offset="40%" stopColor={colorMiddle} />
              <stop offset="100%" stopColor={colorBottom} />
            </linearGradient>
            <linearGradient id="ghostBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorBackTop} />
              <stop offset="100%" stopColor={colorBackBottom} />
            </linearGradient>
            <filter id="ghostGlow1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
            <filter id="ghostGlow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
          </defs>

          <g transform={`translate(${swayX}, ${floatY}) rotate(${bodyRotation} 100 ${vbHeight / 2})`}>
            {showGlow && (
              <g>
                <ellipse cx="100" cy={vbHeight / 2} rx="90" ry="110" fill={glowColor} opacity="0.3" filter="url(#ghostGlow1)" />
                <ellipse cx="100" cy={vbHeight / 2} rx="130" ry="150" fill={glowColor} opacity="0.18" filter="url(#ghostGlow2)" />
              </g>
            )}

            <path d={backPath} fill="url(#ghostBackGrad)" />
            <path d={frontPath} fill="url(#ghostFrontGrad)" />

            <g style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }}>
              <g opacity={fs.browOp}>
                <path
                  d={lBrowPath}
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{ transformOrigin: `80px ${fs.browY}px`, transform: `rotate(${fs.browAngle}deg)` }}
                />
                <path
                  d={rBrowPath}
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{ transformOrigin: `120px ${fs.browY}px`, transform: `rotate(${-fs.browAngle}deg)` }}
                />
              </g>

              <ellipse
                cx={80}
                cy={100}
                rx={8 * fs.eyeScale}
                ry={16 * fs.eyeScale}
                fill="#000"
                style={{ transformOrigin: '80px 100px', transform: `rotate(${fs.lEyeRot}deg) scaleY(${blinkScale})` }}
              />
              <ellipse
                cx={120}
                cy={100}
                rx={8 * fs.eyeScale}
                ry={16 * fs.eyeScale}
                fill="#000"
                style={{ transformOrigin: '120px 100px', transform: `rotate(${fs.rEyeRot}deg) scaleY(${blinkScale})` }}
              />

              <path d={mouthPath} fill="#000" opacity={fs.mouthOp} />
            </g>

            {enableChat && quotes.length > 0 && (
              <foreignObject x="130" y="-40" width="220" height="180" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <div
                  style={{
                    display: 'inline-block',
                    transform: `scale(${chatOpen ? 1 : 0.5})`,
                    transformOrigin: 'bottom left',
                    opacity: chatOpen ? 1 : 0,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    backgroundColor: chatBgColor,
                    color: chatTextColor,
                    padding: '10px 16px',
                    borderRadius: '20px 24px 24px 6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
                    maxWidth: '180px',
                    wordWrap: 'break-word',
                    lineHeight: 1.35,
                    marginTop: '20px',
                    userSelect: 'none'
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    style={{ position: 'absolute', bottom: '-10px', left: '6px', transform: 'rotate(-10deg)' }}
                  >
                    <path d="M 0 0 L 24 0 Q 12 12 0 24 Q 6 12 0 0 Z" fill={chatBgColor} />
                  </svg>
                  {quotes[quoteIndex]}
                </div>
              </foreignObject>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
