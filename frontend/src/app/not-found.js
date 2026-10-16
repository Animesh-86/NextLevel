'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import InteractiveGhost from '@/components/InteractiveGhost';

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        color: '#f4f4f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'hidden',
        zIndex: 99999
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Interactive Ghost Component */}
      <div style={{ width: '380px', height: '360px', position: 'relative', zIndex: 10 }}>
        <InteractiveGhost
          mood="neutral"
          colorTop="#eaff5e"
          colorMiddle="#a3e635"
          colorBottom="#16a34a"
          colorBackTop="#65a30d"
          colorBackBottom="#14532d"
          showGlow={true}
          glowColor="#a3e635"
          interactiveEyes={true}
          enableChat={true}
          quotes={[
            "404: Lost in cyberspace! 👻",
            "There's nothing here but me!",
            "Did I scare you?",
            "Click 'Dashboard' to go back home!"
          ]}
          chatBgColor="#ffffff"
          chatTextColor="#09090b"
        />
      </div>

      {/* Error Copy & Status */}
      <div style={{ textAlign: 'center', maxWidth: '480px', marginTop: '1rem', zIndex: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#a3e635',
            marginBottom: '1rem'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a3e635' }} />
          Error 404 • Lost in Void
        </div>

        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fafafa',
            margin: '0 0 0.75rem 0',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)'
          }}
        >
          Coordinates Not Found
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#a1a1ad',
            lineHeight: 1.6,
            margin: '0 0 2rem 0'
          }}
        >
          The page or resource you requested has drifted into deep space. Move your cursor to play with our friendly ghost, or return to base.
        </p>

        {/* Action Buttons following strict Color Theory: Primary Action = White #FAFAFA */}
        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard"
            style={{
              padding: '0.75rem 1.6rem',
              borderRadius: '10px',
              backgroundColor: '#fafafa',
              color: '#09090b',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
              transition: 'transform 0.15s ease, opacity 0.15s ease'
            }}
          >
            <Home size={16} /> Return to Dashboard
          </Link>

          <button
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.35rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#d4d4d8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
