'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  Award, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles,
  TrendingUp, MessageSquare, ShieldCheck, HelpCircle,
  Briefcase, Clock, FileText, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import { stopAllHardwareMedia } from '@/lib/hardwareMedia';

export default function InterviewScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const interviewId = params?.id;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    // Guarantee camera and mic are completely dark on scorecard page
    stopAllHardwareMedia();
  }, []);

  const loadScorecard = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/interviews/${interviewId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
      } else {
        toast.error('Failed to load scorecard data');
      }
    } catch (err) {
      console.error('Failed to load scorecard:', err);
      toast.error('Error loading scorecard');
    } finally {
      setLoading(false);
    }
  }, [interviewId, toast]);

  useEffect(() => {
    if (interviewId) {
      loadScorecard();
    }
  }, [interviewId, loadScorecard]);

  const toggleQuestion = (idx) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Sparkles size={36} style={{ color: 'var(--ai, #a78bfa)', marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f4f4f6' }}>Compiling Hiring Evaluation...</div>
      </div>
    );
  }

  if (!session || !session.scorecard) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Scorecard Not Found</h2>
        <p style={{ color: 'var(--text-muted, #a1a1ad)' }}>This session might still be in progress or was interrupted.</p>
        <button onClick={() => router.push('/interview')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Interviews
        </button>
      </div>
    );
  }

  const { scorecard } = session;
  const rawVerdict = scorecard.hiringVerdict || 'Hire';
  const isNotEvaluated = rawVerdict === 'Not Evaluated' || scorecard.overallScore === 0;

  // Single scale by score: red under 40, amber 40–70, green above 70
  const getScoreColor = (score) => {
    if (isNotEvaluated) return '#a1a1ad';
    if (score < 40) return '#f87171'; // red under 40
    if (score <= 70) return '#f5a623'; // amber 40-70
    return '#34d399'; // green above 70
  };

  const isStrongHire = !isNotEvaluated && rawVerdict.includes('Strong');
  const isHire = !isNotEvaluated && rawVerdict.includes('Hire') && !rawVerdict.includes('No');
  const isNoHire = !isNotEvaluated && rawVerdict.includes('No');
  const isPreliminary = !isNotEvaluated && (
    rawVerdict.toLowerCase().includes('preliminary') ||
    rawVerdict.toLowerCase().includes('incomplete') ||
    rawVerdict.toLowerCase().includes('early')
  );

  const verdictText = isNotEvaluated ? 'Not Evaluated' : rawVerdict;
  const verdictColor = isNotEvaluated
    ? '#a1a1ad'
    : isPreliminary
    ? '#f5a623'
    : isStrongHire
    ? '#34d399'
    : isHire
    ? '#34d399'
    : isNoHire
    ? '#f87171'
    : '#f5a623';

  const verdictBg = isNotEvaluated
    ? 'rgba(255, 255, 255, 0.04)'
    : isPreliminary
    ? 'rgba(245, 166, 35, 0.12)'
    : isStrongHire || isHire
    ? 'rgba(52, 211, 153, 0.10)'
    : isNoHire
    ? 'rgba(248, 113, 113, 0.10)'
    : 'rgba(245, 166, 35, 0.10)';

  const competencies = [
    { label: 'Technical Competence', score: scorecard.technicalScore || scorecard.overallScore },
    { label: 'Problem Solving & System Design', score: scorecard.problemSolvingScore || scorecard.overallScore },
    { label: 'Communication Clarity', score: scorecard.communicationScore || scorecard.overallScore },
    { label: 'Resume Credibility & Defense', score: scorecard.resumeCredibilityScore || scorecard.overallScore },
    { label: 'Confidence & Delivery', score: scorecard.confidenceScore || scorecard.overallScore },
  ];

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out', paddingBottom: '3.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => router.push('/interview')}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Interviews
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Export / Print Report
          </button>
          
          {/* Primary Action Button = Solid White #FAFAFA with black text */}
          <button
            onClick={() => router.push('/interview')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: '#fafafa',
              color: '#09090b',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)'
            }}
          >
            <RotateCcw size={15} /> Practice Another Role
          </button>
        </div>
      </div>

      {/* Hero Decision Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface-1, #101014)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{session.role}</span>
              <span className="badge" style={{ fontSize: '0.75rem', background: 'var(--accent-tint, rgba(245,166,35,0.1))', color: 'var(--accent, #f5a623)', border: '1px solid var(--accent-border, rgba(245,166,35,0.3))' }}>
                {session.experienceLevel}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #a1a1ad)' }}>• {session.durationMinutes} min session</span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: '#f4f4f6' }}>
              Hiring Decision Report
            </h1>
            <p style={{ color: 'var(--text-muted, #a1a1ad)', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.6, margin: '0 0 1rem' }}>
              {scorecard.feedbackSummary}
            </p>

            {/* Resume Project Verification & Proctoring Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {session.extractedProjects && session.extractedProjects.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #a1a1ad)', fontWeight: 600 }}>PROJECTS EVALUATED:</span>
                  {session.extractedProjects.map((p) => (
                    <span key={p} style={{ fontSize: '0.73rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'var(--ai-tint, rgba(167, 139, 250, 0.1))', color: 'var(--ai, #a78bfa)', border: '1px solid rgba(167, 139, 250, 0.25)', fontWeight: 600 }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.73rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: session.proctoringInfractions > 0 ? 'rgba(245, 166, 35, 0.1)' : 'rgba(52, 211, 153, 0.1)', color: session.proctoringInfractions > 0 ? 'var(--accent, #f5a623)' : 'var(--success, #34d399)', border: `1px solid ${session.proctoringInfractions > 0 ? 'rgba(245, 166, 35, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`, fontWeight: 600 }}>
                {session.proctoringInfractions > 0 ? `⚠ ${session.proctoringInfractions} Proctor Warnings Logged` : '✓ Verified Proctored Integrity'}
              </div>
            </div>
          </div>

          {/* Verdict Score Ring / Badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            background: verdictBg,
            border: `1px solid ${verdictColor}`,
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, color: verdictColor, lineHeight: 1 }}>
              {isNotEvaluated ? '—' : `${scorecard.overallScore}%`}
            </div>
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: verdictColor,
              marginTop: '0.5rem'
            }}>
              {verdictText}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #a1a1ad)', marginTop: '4px' }}>
              {isNotEvaluated ? 'No Answers Submitted' : isPreliminary ? 'Early Exit Assessment' : 'Hiring Committee Signal'}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Axis Competency Breakdown — Single score scale: Red < 40, Amber 40-70, Green > 70 */}
      <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem', background: 'var(--surface-1, #101014)', border: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f4f4f6' }}>
          <TrendingUp size={20} style={{ color: 'var(--text, #f4f4f6)' }} /> Core Competency Breakdown
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {competencies.map((comp) => {
            const barColor = getScoreColor(comp.score);
            return (
              <div key={comp.label} style={{ background: '#09090d', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f4f4f6' }}>{comp.label}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: barColor }}>
                    {isNotEvaluated ? '—' : `${comp.score}%`}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: isNotEvaluated ? '0%' : `${comp.score}%`,
                    background: barColor,
                    borderRadius: '999px',
                    transition: 'width 1s ease-out'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strengths & Improvements Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
        
        {/* Key Strengths */}
        <section className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--surface-1, #101014)', border: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success, #34d399)' }}>
            <CheckCircle2 size={18} /> What You Nailed
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {scorecard.keyStrengths?.map((str, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5, color: '#e4e4e7' }}>
                <span style={{ color: 'var(--success, #34d399)', marginTop: '2px' }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actionable Improvements */}
        <section className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--surface-1, #101014)', border: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent, #f5a623)' }}>
            <AlertTriangle size={18} /> High-Impact Improvements
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {scorecard.areasForImprovement?.map((imp, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5, color: '#e4e4e7' }}>
                <span style={{ color: 'var(--accent, #f5a623)', marginTop: '2px' }}>⚠</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Question-By-Question Autopsy */}
      {scorecard.questionEvaluations && scorecard.questionEvaluations.length > 0 && (
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--surface-1, #101014)', border: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f4f4f6' }}>
              Question-by-Question Deep Dive
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #a1a1ad)', margin: '0.25rem 0 0' }}>
              Inspect your exact responses, strengths, missed details, and Staff-Level Model Answers.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scorecard.questionEvaluations.map((evalItem, idx) => {
              const isOpen = expandedQuestions[idx] !== false;
              const evalColor = getScoreColor(evalItem.score);

              return (
                <div
                  key={idx}
                  style={{
                    background: '#09090d',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header Toggle */}
                  <div
                    onClick={() => toggleQuestion(idx)}
                    style={{
                      padding: '1.2rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, paddingRight: '1rem' }}>
                      <span className="badge" style={{ fontSize: '0.75rem', flexShrink: 0, background: 'rgba(255,255,255,0.06)', color: '#f4f4f6' }}>
                        Q{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f4f4f6' }}>
                        {evalItem.question}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: evalColor }}>
                        {evalItem.score}%
                      </span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Body Content */}
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      
                      {/* Candidate Answer Transcript */}
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #a1a1ad)', marginBottom: '0.35rem' }}>
                          Your Response
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#e4e4e7', background: '#101014', padding: '0.85rem', borderRadius: '8px', lineHeight: 1.5 }}>
                          {evalItem.candidateAnswer}
                        </div>
                      </div>

                      {/* Strengths & Weaknesses Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success, #34d399)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Strong Points
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#f4f4f6', lineHeight: 1.4 }}>
                            {evalItem.strength}
                          </div>
                        </div>

                        <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.2)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent, #f5a623)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Missed Details / Nuance
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#f4f4f6', lineHeight: 1.4 }}>
                            {evalItem.weakness}
                          </div>
                        </div>
                      </div>

                      {/* Staff Model Answer Blueprint */}
                      {evalItem.modelAnswer && (
                        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'var(--ai-tint, rgba(167, 139, 250, 0.08))', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ai, #a78bfa)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                            <Sparkles size={14} /> Staff Engineer Model Answer Blueprint
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#ede9fe', lineHeight: 1.5 }}>
                            {evalItem.modelAnswer}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
