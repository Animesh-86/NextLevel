import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();

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
            <a href="#workflow">Workflow</a>
            <a href="#dashboard">Command Center</a>
          </div>

          <div className="landing-nav-actions">
            {session ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Go to Dashboard
              </Link>
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
          The All-In-One Productivity Platform
        </div>

        <h1 className="landing-headline">
          Your Ultimate Digital<br />
          <span className="landing-headline-accent">Command Center.</span>
        </h1>

        <p className="landing-subtext">
          Track roadmaps, manage job applications, capture rapid notes, <br className="landing-br" />
          and simulate exams — everything unified in one sleek dashboard.
        </p>

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

        {/* Dashboard Mockup */}
        <div className="landing-mockup" id="dashboard">
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
                <MockStat label="Active Tasks" value="24" />
                <MockStat label="Job Applications" value="18" />
                <MockStat label="Global Streak" value="32 days" />
                <MockStat label="Exam Accuracy" value="89%" />
              </div>
              <div className="landing-mockup-charts">
                <div className="landing-mockup-chart">
                  <div className="landing-chart-title">Activity Heatmap</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', marginTop: '1rem', opacity: 0.6 }}>
                    {Array.from({ length: 48 }).map((_, i) => {
                      const isActive = (i % 3) === 0;
                      return (
                        <div
                          key={i}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '2px',
                            background: isActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                            opacity: isActive ? 1 : 0.5,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="landing-mockup-chart">
                  <div className="landing-chart-title">Productivity Flow</div>
                  <svg viewBox="0 0 200 100" className="landing-line-chart">
                    <polyline points="10,80 40,50 70,70 100,20 130,40 160,10 190,25" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10,80 40,50 70,70 100,20 130,40 160,10 190,25" fill="url(#lineGrad)" stroke="none" />
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
          <span className="landing-label">The Ecosystem</span>
          <h2 className="landing-section-title">Everything Connected.</h2>
          <p className="landing-section-sub">A powerful suite of tools designed to replace your scattered apps.</p>
        </div>

        <div className="landing-features-grid">
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            title="Interactive Roadmaps"
            desc="Plan your entire learning journey. Track milestones visually and conquer technical interviews systematically."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
            title="Career Pipeline"
            desc="A dedicated Kanban board for job tracking. Manage interviews, assessments, and offers with ease."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
            title="Capture Hub"
            desc="Instantly save fleeting thoughts, urgent tasks, or screenshots. Smart categorization keeps the noise organized."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            title="Daily Planner"
            desc="Schedule your tasks alongside your exams and job interviews. A centralized calendar for maximum productivity."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
            title="Vault Storage"
            desc="Upload PDFs, Code files, and System Design docs. Access your critical knowledge base directly from the dashboard."
          />
          <FeatureCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            title="Exam Simulator"
            desc="AI-powered test generation, adaptive scoring, and spaced repetition to master any certification."
          />
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing-section" id="workflow">
        <div className="landing-section-header">
          <span className="landing-label">Workflow</span>
          <h2 className="landing-section-title">The Engineering Approach</h2>
        </div>

        <div className="landing-steps">
          <StepCard num="01" title="Capture & Organize" desc="Save links, notes, and files into the Vault and Capture Hub so you never lose context." />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard num="02" title="Plan & Execute" desc="Set up Roadmaps and daily Planner tasks. Move job applications through the pipeline." />
          <div className="landing-step-connector">
            <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          </div>
          <StepCard num="03" title="Analyze Growth" desc="Watch your global activity heatmap populate as you complete exams, tasks, and interviews." />
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="landing-section" style={{ marginTop: '4rem' }}>
        <div className="landing-cta-banner">
          <h2 className="landing-cta-title">Take Control of Your Time</h2>
          <p className="landing-cta-sub">Join NextLevel and experience true digital productivity.</p>
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
            <Link href="/login">Sign In</Link>
            <Link href="/login?mode=register">Sign Up</Link>
          </div>
          <p className="landing-footer-copy">© 2026 NextLevel. Designed for elite productivity.</p>
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
