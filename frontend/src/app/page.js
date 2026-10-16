import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import CursorShadowText from '@/components/CursorShadowText';
import DotGridBackground from '@/components/DotGridBackground';
import LandingDemo from '@/components/LandingDemo';
import { 
  Users, Swords, Mic, Target, Zap, FolderOpen, 
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Flame, BookOpen 
} from 'lucide-react';

export default async function LandingPage() {
  const result = await requireAuth();
  const session = result.user ? { user: result.user } : null;

  return (
    <div className="landing">
      {/* ─── Background (kept exactly as original) ─── */}
      <div className="landing-bg">
        <DotGridBackground 
          dotColor="rgba(255, 255, 255, 0.15)"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
        <div className="landing-glow landing-glow-1" />
        <div className="landing-glow landing-glow-2" />
      </div>

      {/* ─── Navbar (kept exactly as original) ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
            <span>NextLevel</span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#dashboard">Command Center</a>
          </div>

          <div className="landing-nav-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {session ? (
              <>
                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Dashboard
                </Link>
                <SignOutButton className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                  Sign Out
                </SignOutButton>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Log In</Link>
                <Link href="/login?mode=register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-beacon" />
          <span>NEW: Multiplayer Study Rooms &amp; AI Mock Interviews</span>
        </div>

        <h1 className="landing-headline">
          Your Intelligent<br />
          <CursorShadowText 
            text="Career Accelerator." 
            textColor="var(--text-secondary)" 
            className="landing-headline-accent"
            shadowColor1="rgba(245, 166, 35, 0.45)"
            shadowColor2="rgba(245, 166, 35, 0.2)"
            shadowCount={2}
            shadowDistance={2}
            sensitivity={0.1}
          />
        </h1>

        <div className="landing-hero-actions">
          {session ? (
            <Link href="/dashboard" className="btn btn-primary landing-btn-lg">
              Open {session.user?.name ? `${session.user.name.split(' ')[0]}'s ` : ''}Workspace
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          ) : (
            <Link href="/login?mode=register" className="btn btn-primary landing-btn-lg">
              Create Free Account
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          )}
          <a href="#features" className="btn btn-secondary landing-btn-lg">
            Explore Features
          </a>
        </div>

        {/* Interactive Feature Demo Showcase */}
        <LandingDemo />
      </section>

      {/* ─── Features (The Powerhouse Ecosystem) ─── */}
      <section className="landing-section" id="features">
        <div className="landing-section-header">
          <span className="landing-label">The Ecosystem</span>
          <h2 className="landing-section-title">Engineered for Elite Mastery.</h2>
          <p className="landing-section-sub">A cohesive suite designed to replace scattered study tools and accelerate your career.</p>
        </div>

        <div className="landing-features-grid">
          <FeatureCard
            icon={<Users size={22} style={{ color: 'var(--amber)' }} />}
            badge="LIVE MULTIPLAYER"
            title="Collaborative Study Rooms"
            desc="Deep-work focus spaces with live peer co-working. Features Google Meet-style presence, synchronized 25m Pomodoro timers, and curated ambient soundscapes."
          />
          <FeatureCard
            icon={<Swords size={22} style={{ color: 'var(--amber)' }} />}
            badge="ARENA SPRINTS"
            title="OA Blitz Sprint Arena"
            desc="Turn exam prep into competitive multiplayer action. Raid O(2^N) Bosses with correct answers, survive sudden death, or battle Alpha vs. Beta teams."
          />
          <FeatureCard
            icon={<Mic size={22} style={{ color: 'var(--amber)' }} />}
            badge="AI POWERED"
            title="AI Technical Mock Interviews"
            desc="Practice real-time technical & system design rounds with an AI Staff Engineer. Get dynamic follow-up probes and instant hire scorecards with actionable feedback."
          />
          <FeatureCard
            icon={<Target size={22} style={{ color: 'var(--amber)' }} />}
            badge="SUPERMEMO SM-2"
            title="Adaptive Practice Assessments"
            desc="Multi-document ingestion directly from your Vault. AI generates spaced repetition MCQ, MSQ, and scenario questions with instant review mode."
          />
          <FeatureCard
            icon={<Zap size={22} style={{ color: 'var(--amber)' }} />}
            badge="MINIMAL MONOCHROME"
            title="Unified Command Center"
            desc="Daily briefing digest, deep-work focus progress ring, global streak counter, and keyboard jump-to navigation for ultra-fast productivity."
          />
          <FeatureCard
            icon={<FolderOpen size={22} style={{ color: 'var(--amber)' }} />}
            badge="INTELLIGENT STORAGE"
            title="File Vault &amp; Capture Hub"
            desc="Instantly store technical PDFs, system architecture notes, and code snippets. Smart ingestion synthesizes documents into actionable quizzes."
          />
        </div>
      </section>

      {/* ─── How It Works (Workflow) ─── */}
      <section className="landing-section" id="workflow">
        <div className="landing-section-header">
          <span className="landing-label">Workflow</span>
          <h2 className="landing-section-title">The Engineering Approach</h2>
          <p className="landing-section-sub">How candidates use NextLevel from day one to the offer letter.</p>
        </div>

        <div className="landing-steps">
          <StepCard 
            num="01" 
            title="Capture &amp; Ingest" 
            desc="Upload problem sets, lecture PDFs, and notes into your File Vault. AI parses documents into interactive flashcards and exams." 
          />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard 
            num="02" 
            title="Sprint &amp; Simulate" 
            desc="Lock in with peers in Study Rooms for Pomodoro sessions, conquer OA Blitz raids, and run high-concurrency AI mock interviews." 
          />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard 
            num="03" 
            title="Level Up &amp; Get Hired" 
            desc="Review granular scorecards, track global heatmap activity, and advance through your Roadmap directly to target tech offers." 
          />
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="landing-section" style={{ marginTop: '4rem' }}>
        <div className="landing-cta-banner" style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
          <h2 className="landing-cta-title">Accelerate Your Engineering Career</h2>
          <p className="landing-cta-sub">Join candidates mastering technical interviews and deep-work habits on NextLevel.</p>
          {session ? (
            <Link href="/dashboard" className="btn btn-primary landing-btn-lg">
              Go to Dashboard
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          ) : (
            <Link href="/login?mode=register" className="btn btn-primary landing-btn-lg">
              Create Your Workspace
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
            <span>NextLevel</span>
          </div>
          <div className="landing-footer-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            {session ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <SignOutButton style={{ background: 'none', border: 'none', color: 'var(--text-muted)', font: 'inherit', padding: 0, cursor: 'pointer' }}>Sign Out</SignOutButton>
              </>
            ) : (
              <>
                <Link href="/login">Sign In</Link>
                <Link href="/login?mode=register">Sign Up</Link>
              </>
            )}
          </div>
          <p className="landing-footer-copy">NextLevel. Designed for elite productivity and career acceleration.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, badge, title, desc }) {
  return (
    <div className="landing-feature-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="landing-feature-icon" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {icon}
        </div>
        {badge && (
          <span style={{ 
            fontSize: '0.62rem', 
            fontWeight: 800, 
            letterSpacing: '0.06em', 
            background: 'var(--amber-tint)', 
            border: '1px solid var(--amber-border)', 
            color: 'var(--amber)', 
            padding: '2px 7px', 
            borderRadius: '4px' 
          }}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="landing-feature-title" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="landing-feature-desc" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="landing-step-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="landing-step-num" style={{ color: 'var(--amber)', opacity: 0.85 }}>{num}</div>
      <h3 className="landing-step-title" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="landing-step-desc" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}
