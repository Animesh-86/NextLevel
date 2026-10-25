'use client';

import React from 'react';
import { Zap, Users, Shield, Flag } from 'lucide-react';

export default function RoomArenaModePicker({
  gameMode,
  setGameMode,
  negativeMarking,
  setNegativeMarking
}) {
  return (
    <>
      {/* ARENA Header */}
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#9ca3af',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.85rem'
        }}
      >
        ARENA
      </div>

      {/* 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {[
          { id: 'STANDARD', label: 'OA Blitz', desc: 'Free-for-all. Speed and accuracy set the ranking.', badge: 'Solo OK', badgeColor: '#f59e0b', icon: Zap },
          { id: 'BOSS', label: 'Co-op Boss', desc: "Everyone's correct answers drain one boss HP bar.", badge: 'Needs 2+ peers', badgeColor: '#9ca3af', icon: Users },
          { id: 'SURVIVAL', label: 'Survival', desc: "One wrong answer and you're out. Last one standing wins.", badge: 'Needs 2+ peers', badgeColor: '#9ca3af', icon: Shield },
          { id: 'TEAMS', label: 'Squad Battle', desc: 'Two teams, combined score. Teams are auto-balanced.', badge: 'Needs 4+ peers', badgeColor: '#9ca3af', icon: Flag }
        ].map(m => {
          const ModeIcon = m.icon;
          const isSelected = gameMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setGameMode(m.id)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'left',
                border: isSelected ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.07)',
                background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                boxShadow: isSelected ? '0 0 16px -4px rgba(245, 158, 11, 0.25)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '112px',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#f59e0b' : '#9ca3af'
                  }}
                >
                  <ModeIcon size={17} />
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: m.badgeColor,
                    background:
                      isSelected && m.badgeColor === '#f59e0b'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {m.badge}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginBottom: '3px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#9ca3af', lineHeight: 1.35 }}>
                  {m.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Negative Marking Toggle Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          marginTop: '10px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
            Negative marking
          </div>
          <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '2px' }}>
            Deduct 25 points for each wrong answer
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={negativeMarking}
          onClick={() => setNegativeMarking(!negativeMarking)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: negativeMarking ? '#d97706' : 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            padding: '2px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ffffff',
              transform: negativeMarking ? 'translateX(20px)' : 'translateX(0px)',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          />
        </button>
      </div>
    </>
  );
}
