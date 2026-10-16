'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import BubblePit from '@/components/BubblePit';

export default function ArcadePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 75px)',
        maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 75px)',
        background: '#000000',
        padding: isFullscreen ? '1rem' : '0.85rem 1.25rem 1rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        color: '#f4f4f6',
        position: 'relative'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          zIndex: 10,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isFullscreen && (
            <Link
              href="/dashboard"
              className="icon-btn"
              title="Back to Dashboard"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f4f4f6',
                borderRadius: '8px',
                padding: '7px'
              }}
            >
              <ArrowLeft size={16} />
            </Link>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Tech Arcade • Bubble Pit
              </h1>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#a1a1ad', margin: '1px 0 0' }}>
              Hover cursor for air-pressure force • Click to burst-spawn tech icons
            </p>
          </div>
        </div>

        {/* Fullscreen Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f4f4f6',
              borderRadius: '8px',
              padding: '7px'
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Full-Height Physics Bubble Pit Sandbox */}
      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.9)'
        }}
      >
        <BubblePit
          bubbleCount={0}
          minRadius={32}
          maxRadius={56}
          restitution={0.88}
          airPressure={0.018}
          style={{ height: '100%', width: '100%', borderRadius: '14px' }}
        />
      </div>
    </div>
  );
}
