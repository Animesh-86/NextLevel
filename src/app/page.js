import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ─── Background ─── */}
      <div className="landing-bg">
        <div className="landing-grid" />
        <div className="landing-glow landing-glow-1" />
        <div className="landing-glow landing-glow-2" />
      </div>

      {/* ─── Navbar ─── */}
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
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="landing-nav-actions">
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Log In</Link>
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-beacon" />
          Now with AI-Powered Explanations
        </div>

        <h1 className="landing-headline">
          Master Any Certification.<br />
          <span className="landing-headline-accent">One Exam at a Time.</span>
        </h1>

        <p className="landing-subtext">
          Smart practice with spaced repetition, real-time analytics,<br className="landing-br" />
          and intelligent question tracking — all in one platform.
        </p>

        <div className="landing-hero-actions">
          <Link href="/login" className="btn btn-primary landing-btn-lg">
            Start Free Practice
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
          <a href="#how-it-works" className="btn btn-secondary landing-btn-lg">
            See How It Works
          </a>
        </div>

        {/* Dashboard Mockup */}
        <div className="landing-mockup">
          <div className="landing-mockup-inner">
            <div className="landing-mockup-header">
              <div className="landing-mockup-dots">
                <span /><span /><span />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>NextLevel Dashboard</span>
              <div />
            </div>
            <div className="landing-mockup-body">
              <div className="landing-mockup-stats">
                <MockStat label="Tests Taken" value="142" />
                <MockStat label="Accuracy" value="87%" />
                <MockStat label="Streak" value="14 days" />
                <MockStat label="Study Hours" value="63h" />
              </div>
              <div className="landing-mockup-charts">
                <div className="landing-mockup-chart">
                  <div className="landing-chart-title">Skill Proficiency</div>
                  <svg viewBox="0 0 200 200" className="landing-radar">
                    <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <polygon points="100,50 150,75 150,125 100,150 50,125 50,75" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                    <polygon points="100,45 160,72 155,135 100,165 45,130 48,68" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="landing-mockup-chart">
                  <div className="landing-chart-title">Weekly Progress</div>
                  <svg viewBox="0 0 200 100" className="landing-line-chart">
                    <polyline points="10,80 40,60 70,70 100,30 130,50 160,20 190,35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10,80 40,60 70,70 100,30 130,50 160,20 190,35" fill="url(#lineGrad)" stroke="none" />
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="landing-section" id="features">
        <div className="landing-section-header">
          <span className="landing-label">Features</span>
          <h2 className="landing-section-title">Everything You Need to Succeed</h2>
          <p className="landing-section-sub">Built for serious learners who want measurable results.</p>
        </div>

        <div className="landing-features-grid">
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            title="Adaptive Testing"
            desc="Countdown timer, MCQ/MSQ support, flag questions for review. Simulation mode mirrors real exam conditions."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>}
            title="Smart Analytics"
            desc="Radar charts, module breakdowns, progress tracking. Know exactly where you stand and what to study next."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
            title="Import Anywhere"
            desc="Upload PDF, Word docs, or CSV files to instantly build question banks. Parse, preview, and save."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
            title="Spaced Repetition"
            desc="SRS algorithm surfaces your weak areas automatically. Study smarter, not harder."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
            title="Achievement System"
            desc="Streaks, daily goals, achievement badges — gamified progression that keeps you coming back."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
            title="Instant Results"
            desc="Question-by-question review with correct answers, explanations, and module-level performance breakdowns."
          />
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-section-header">
          <span className="landing-label">How It Works</span>
          <h2 className="landing-section-title">Three Steps to Mastery</h2>
        </div>

        <div className="landing-steps">
          <StepCard num="01" title="Create or Import" desc="Build question banks manually or upload PDF, Word, CSV files. Organize by exam and module." />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard num="02" title="Practice & Test" desc="Take timed simulation exams or study with SRS-powered sessions. Flag, review, and learn." />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard num="03" title="Track & Improve" desc="Analyze results with detailed breakdowns. Watch your radar chart expand as you level up." />
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="landing-section">
        <div className="landing-proof">
          <div className="landing-proof-avatars">
            {[...'ABCDE'].map((l, i) => (
              <div key={i} className="landing-proof-avatar" style={{ zIndex: 5 - i, marginLeft: i > 0 ? '-10px' : 0 }}>{l}</div>
            ))}
          </div>
          <div>
            <div className="landing-proof-stars">★★★★★</div>
            <p className="landing-proof-text">Trusted by <strong>10,000+</strong> students preparing for certifications</p>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="landing-section">
        <div className="landing-cta-banner">
          <h2 className="landing-cta-title">Ready to level up?</h2>
          <p className="landing-cta-sub">Join thousands of students mastering their exams with NextLevel.</p>
          <Link href="/login" className="btn btn-primary landing-btn-lg">
            Get Started Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
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
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Sign In</Link>
          </div>
          <p className="landing-footer-copy">© 2026 NextLevel. Built with ♥ for learners everywhere.</p>
        </div>
      </footer>
    </div>
  );
}

function MockStat({ label, value }) {
  return (
    <div className="landing-mock-stat">
      <div className="landing-mock-stat-value">{value}</div>
      <div className="landing-mock-stat-label">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">{icon}</div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="landing-step-card">
      <div className="landing-step-num">{num}</div>
      <h3 className="landing-step-title">{title}</h3>
      <p className="landing-step-desc">{desc}</p>
    </div>
  );
}
