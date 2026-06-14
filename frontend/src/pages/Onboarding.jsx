import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const STEPS = [
  { id: 1, label: 'About You' },
  { id: 2, label: 'Your Story' },
  { id: 3, label: 'Email Style' },
  { id: 4, label: 'Connect Email' },
];

function TagsInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('');

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(tag) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div className="tags-input">
      {value.map(tag => (
        <span className="tag" key={tag}>
          {tag}
          <button onClick={() => remove(tag)} type="button">×</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : 'Add more...'}
      />
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  // Step 1: About You
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState([]);

  // Step 2: Your Story
  const [bio, setBio] = useState('');
  const [projects, setProjects] = useState([{ name: '', description: '' }]);
  const [targetRoles, setTargetRoles] = useState([]);
  const [interests, setInterests] = useState([]);

  // Step 3: Email Style
  const [tone, setTone] = useState('direct');
  const [avoidPhrases, setAvoidPhrases] = useState([
    'passionate', 'quick learner', 'eager', 'excited to'
  ]);
  const [emphasize, setEmphasize] = useState([
    'things shipped', 'problems solved', 'speed of execution'
  ]);
  const [focusAreas, setFocusAreas] = useState('');
  const [highlightProject, setHighlightProject] = useState('');

  // Step 4: Email Setup
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'

  function addProject() {
    setProjects([...projects, { name: '', description: '' }]);
  }

  function removeProject(idx) {
    setProjects(projects.filter((_, i) => i !== idx));
  }

  function updateProject(idx, field, value) {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    setProjects(updated);
  }

  async function testSmtp() {
    setTestStatus('testing');
    try {
      if (!smtpUser || !smtpPass) {
        setTestStatus('error');
        return;
      }
      await api.post('/smtp/verify', {
        provider: smtpHost.includes('gmail') ? 'gmail' : smtpHost.includes('office365') ? 'outlook' : smtpHost.includes('yahoo') ? 'yahoo' : 'custom',
        host: smtpHost,
        port: parseInt(smtpPort),
        user: smtpUser,
        password: smtpPass
      });
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
    }
  }

  async function handleFinish() {
    try {
      await api.put('/profile', {
        name, title, location, linkedin, github, portfolio,
        skills, bio, notable_projects: projects, target_roles: targetRoles,
        interests, tone, focus_areas: focusAreas, highlight_project: highlightProject,
        avoid_phrases: avoidPhrases, emphasize
      });

      if (smtpUser && smtpPass && testStatus === 'success') {
        await api.post('/smtp/save', {
          provider: smtpHost.includes('gmail') ? 'gmail' : smtpHost.includes('office365') ? 'outlook' : smtpHost.includes('yahoo') ? 'yahoo' : 'custom',
          host: smtpHost,
          port: parseInt(smtpPort),
          user: smtpUser,
          password: smtpPass
        });
      }

      updateUser({ onboarded: true });
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to save onboarding data: " + err.message);
    }
  }

  function canNext() {
    if (step === 1) return name.trim() && title.trim();
    if (step === 2) return bio.trim();
    if (step === 3) return true;
    return true; // Step 4 is optional
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-root)',
      padding: 'var(--space-2xl) var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <div className="sidebar-logo" style={{ width: 40, height: 40 }}>⚡</div>
        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>ColdReach Setup</span>
      </div>

      {/* Wizard Progress */}
      <div className="wizard">
        <div className="wizard-progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className="wizard-step-indicator" style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${step > s.id ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: About You ──────────────────── */}
        {step === 1 && (
          <div className="animate-in">
            <h2 className="wizard-title">Tell us about yourself</h2>
            <p className="wizard-subtitle">This is what AI uses to personalize your emails</p>

            <div className="wizard-body">
              <div className="grid-2">
                <div className="input-group">
                  <label>Full Name *</label>
                  <input type="text" placeholder="Akshat Tyagi" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Target Role *</label>
                  <input type="text" placeholder="Backend Engineer" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Location</label>
                <input type="text" placeholder="India (Open to Remote)" value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>LinkedIn URL</label>
                  <input type="url" placeholder="https://linkedin.com/in/..." value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>GitHub URL</label>
                  <input type="url" placeholder="https://github.com/..." value={github} onChange={e => setGithub(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Portfolio Website</label>
                <input type="url" placeholder="https://yourwebsite.com" value={portfolio} onChange={e => setPortfolio(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Skills (press Enter to add)</label>
                <TagsInput value={skills} onChange={setSkills} placeholder="Python, FastAPI, Docker..." />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Your Story ──────────────────── */}
        {step === 2 && (
          <div className="animate-in">
            <h2 className="wizard-title">Your Story</h2>
            <p className="wizard-subtitle">The AI brain — write this like a builder, not a resume</p>

            <div className="wizard-body">
              <div className="input-group">
                <label>Bio / About You *</label>
                <textarea
                  rows={5}
                  placeholder="I build things that work and ship them. In the last year I've gone from zero to running production backend systems, RAG pipelines, and automation workflows..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Tip: Write like you're pitching to a CTO, not applying on a job board.
                </span>
              </div>

              <div className="input-group">
                <label>Notable Projects</label>
                {projects.map((p, i) => (
                  <div className="project-card-editable" key={i}>
                    <div className="project-card-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Project {i + 1}</span>
                      {projects.length > 1 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => removeProject(i)} type="button">
                          🗑️
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Project name"
                      value={p.name}
                      onChange={e => updateProject(i, 'name', e.target.value)}
                    />
                    <textarea
                      rows={2}
                      placeholder="What it does, what tech you used, what problem it solves..."
                      value={p.description}
                      onChange={e => updateProject(i, 'description', e.target.value)}
                    />
                  </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={addProject} type="button">
                  + Add Project
                </button>
              </div>

              <div className="input-group">
                <label>Target Roles (press Enter to add)</label>
                <TagsInput value={targetRoles} onChange={setTargetRoles} placeholder="Backend Engineer, AI/ML Engineer..." />
              </div>

              <div className="input-group">
                <label>Interests</label>
                <TagsInput value={interests} onChange={setInterests} placeholder="AI Infrastructure, Developer Tools..." />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Email Style ──────────────────── */}
        {step === 3 && (
          <div className="animate-in">
            <h2 className="wizard-title">Email Personality</h2>
            <p className="wizard-subtitle">Control how AI writes on your behalf</p>

            <div className="wizard-body">
              <div className="input-group">
                <label>Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)}>
                  <option value="direct">Direct & Bold — like a founder pitching</option>
                  <option value="professional">Professional — polished and confident</option>
                  <option value="casual">Casual — friendly and approachable</option>
                  <option value="technical">Technical — engineer-to-engineer</option>
                </select>
              </div>

              <div className="input-group">
                <label>Focus Areas</label>
                <input
                  type="text"
                  placeholder="backend systems engineering, applied AI"
                  value={focusAreas}
                  onChange={e => setFocusAreas(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  What should the AI emphasize in every email?
                </span>
              </div>

              <div className="input-group">
                <label>Highlight This Project</label>
                <input
                  type="text"
                  placeholder="My AI Knowledge Vault (RAG System)"
                  value={highlightProject}
                  onChange={e => setHighlightProject(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Emphasize These Qualities (press Enter)</label>
                <TagsInput value={emphasize} onChange={setEmphasize} placeholder="Add quality..." />
              </div>

              <div className="input-group">
                <label>Avoid These Phrases (press Enter)</label>
                <TagsInput value={avoidPhrases} onChange={setAvoidPhrases} placeholder="Add phrase to avoid..." />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Connect Email ───────────────── */}
        {step === 4 && (
          <div className="animate-in">
            <h2 className="wizard-title">Connect Your Email</h2>
            <p className="wizard-subtitle">Set up your SMTP to start sending — or skip and use dry-run mode</p>

            <div className="wizard-body">
              {/* Guided steps */}
              <div className="smtp-wizard">
                <div className="smtp-step">
                  <div className="smtp-step-number">1</div>
                  <div className="smtp-step-content">
                    <h4>Enable 2-Factor Authentication</h4>
                    <p>
                      Go to your{' '}
                      <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                        Google Security Settings
                      </a>{' '}
                      and make sure 2-Step Verification is turned ON.
                    </p>
                  </div>
                </div>

                <div className="smtp-step">
                  <div className="smtp-step-number">2</div>
                  <div className="smtp-step-content">
                    <h4>Generate an App Password</h4>
                    <p>
                      Visit{' '}
                      <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                        myaccount.google.com/apppasswords
                      </a>{' '}
                      → Select app "Mail" → Click "Generate" → Copy the 16-character password.
                    </p>
                    <p style={{ marginTop: '8px', color: 'var(--warning)' }}>
                      ⚠️ Important: Remove all spaces from the password before pasting!
                    </p>
                  </div>
                </div>

                <div className="smtp-step">
                  <div className="smtp-step-number">3</div>
                  <div className="smtp-step-content">
                    <h4>Enter Your Credentials Below</h4>
                    <p>We'll test the connection instantly to make sure it works.</p>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>SMTP Host</label>
                  <select value={smtpHost} onChange={e => setSmtpHost(e.target.value)}>
                    <option value="smtp.gmail.com">Gmail (smtp.gmail.com)</option>
                    <option value="smtp.office365.com">Outlook (smtp.office365.com)</option>
                    <option value="smtp.mail.yahoo.com">Yahoo (smtp.mail.yahoo.com)</option>
                    <option value="custom">Custom SMTP</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Port</label>
                  <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your_email@gmail.com"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>App Password</label>
                <input
                  type="password"
                  placeholder="Paste your 16-character app password"
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                />
              </div>

              {/* Test Connection Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  className="btn btn-outline"
                  onClick={testSmtp}
                  disabled={testStatus === 'testing'}
                  type="button"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <span className="spinner" /> Testing...
                    </>
                  ) : '🔌 Test Connection'}
                </button>

                {testStatus === 'success' && (
                  <div className="connection-status connected">
                    <div className="status-dot" />
                    Connected! SMTP is working.
                  </div>
                )}
                {testStatus === 'error' && (
                  <div className="connection-status disconnected">
                    <div className="status-dot" />
                    Connection failed. Check credentials.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Nav Buttons ─────────────────────────── */}
        <div className="wizard-actions">
          <button
            className="btn btn-ghost"
            onClick={() => step > 1 ? setStep(step - 1) : null}
            disabled={step === 1}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {step === 4 && (
              <button className="btn btn-ghost" onClick={handleFinish}>
                Skip — Use Dry Run
              </button>
            )}
            {step < 4 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
              >
                Next →
              </button>
            ) : (
              <button className="btn btn-accent" onClick={handleFinish}>
                🚀 Finish Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
