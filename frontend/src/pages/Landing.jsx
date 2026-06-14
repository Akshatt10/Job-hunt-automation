import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page" style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="landing-nav" style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
          <div className="logo-mark" style={{ background: 'var(--primary)', color: 'white' }}>CR</div>
          <span className="logo-text" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>ColdReach</span>
        </div>
        <div className="landing-nav-links">
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Dashboard →
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>
                Sign in
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ fontWeight: 600 }}>
                Start Free Trial
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────── */}
      <section className="hero-section" style={{ padding: '160px 24px 100px', background: 'var(--bg-secondary)' }}>
        <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="hero-badge" style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
            padding: '8px 16px',
            marginBottom: '32px'
          }}>
            The Ultimate Cold Email Automation Platform
          </div>

          <h1 className="hero-title" style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: '24px'
          }}>
            Land more interviews.<br />
            <span style={{ color: 'var(--accent-dark)' }}>On autopilot.</span>
          </h1>

          <p className="hero-description" style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 48px',
            lineHeight: 1.6
          }}>
            Upload your contacts, set your professional profile, and let our AI generate hyper-personalized cold emails. The smartest networking tool for modern job seekers.
          </p>

          <div className="hero-cta" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '16px 32px' }} onClick={() => navigate('/register')}>
              Start for Free
            </button>
            <button className="btn btn-outline btn-lg" style={{ fontSize: '1.1rem', padding: '16px 32px' }} onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </button>
          </div>

          {/* Social Proof */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '64px',
            marginTop: '80px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '40px',
            animation: 'fadeInUp 0.5s var(--ease-out) 0.5s both'
          }}>
            {[
              { value: 'AI', label: 'Hyper-Personalization' },
              { value: '50', label: 'Free Emails' },
              { value: '100%', label: 'Automated Delivery' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: '4px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how-it-works" className="features-section" style={{ padding: '120px 24px', background: 'var(--bg-root)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-dark)', marginBottom: '16px', fontSize: '0.85rem' }}>
              Simple Setup
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Networking, streamlined.
            </h2>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {/* Step 1 */}
            <div style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-dark)', marginBottom: '16px' }}>01</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Upload Contacts</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Export a CSV of recruiters and hiring managers from Apollo.io or LinkedIn. Drop it directly into our platform.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-dark)', marginBottom: '16px' }}>02</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Configure Profile</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Add your resume, skills, and target roles. Our AI engine uses this context to perfectly pitch your background.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-dark)', marginBottom: '16px' }}>03</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Automate Outreach</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Click start. ColdReach generates tailored emails, attaches your resume, and sends them out safely every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEO Core Features ──────────────────────────────── */}
      <section className="features-section" style={{ padding: '120px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '80px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
              Everything you need to automate your job search.
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Our cold email automation software is built strictly for high-deliverability and incredible response rates. Stop applying to black-hole portals and start networking directly.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {[
              {
                title: 'AI Email Generation',
                desc: 'Powered by Gemini & GPT models. Each email is uniquely written based on the recipient’s company context and your resume.',
              },
              {
                title: 'Automatic Resume Attachments',
                desc: 'Upload your PDF once. Every automated email is sent with your professional resume attached, guaranteeing they see your credentials.',
              },
              {
                title: 'Smart Rate Limiting',
                desc: 'Protect your email reputation. We enforce strict daily limits and randomized delays to keep your account safe from spam filters.',
              },
              {
                title: 'Comprehensive Dashboard',
                desc: 'Track sent, pending, and failed campaigns in real-time. Full transparency into your automated outreach metrics.',
              },
            ].map(f => (
              <div key={f.title} style={{ padding: '32px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────── */}
      <section className="pricing-section" style={{ padding: '120px 24px', background: 'var(--bg-root)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-dark)', marginBottom: '16px', fontSize: '0.85rem' }}>
              Simple Pricing
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Invest in your career.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>

            {/* Free Tier */}
            <div className="glass-card" style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Free Trial</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)' }}>
                <li style={{ marginBottom: '12px' }}>✓ 50 automated emails total</li>
                <li style={{ marginBottom: '12px' }}>✓ Basic AI Generation</li>
                <li style={{ marginBottom: '12px' }}>✓ Automatic resume attachments</li>
              </ul>
              <button className="btn btn-outline w-full" onClick={() => navigate('/register')}>
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="glass-card" style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '2px solid var(--accent)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Pro Job Seeker</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>$10 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)' }}>
                <li style={{ marginBottom: '12px' }}>✓ 1,000 automated emails/mo</li>
                <li style={{ marginBottom: '12px' }}>✓ Priority Email Delivery</li>
                <li style={{ marginBottom: '12px' }}>✓ Advanced Outreach Analytics</li>
              </ul>
              <button className="btn btn-primary w-full" onClick={() => navigate('/register')}>
                Upgrade to Pro
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────── */}
      <section style={{
        padding: '120px 24px 160px',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>
            Ready to get hired?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '48px' }}>
            Join smart job seekers using cold email automation to bypass the resume pile.
          </p>
          <button className="btn btn-primary btn-lg" style={{ fontSize: '1.2rem', padding: '18px 40px', borderRadius: 'var(--radius-full)' }} onClick={() => navigate('/register')}>
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>ColdReach</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} ColdReach. Automated Cold Email Outreach for Job Seekers.
          </p>
        </div>
      </footer>
    </div>
  );
}
