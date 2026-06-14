import { useState, useEffect } from 'react';
import api from '../api/client';

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

export default function Profile() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [yearsExp, setYearsExp] = useState(1);
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState([]);
  const [bio, setBio] = useState('');
  const [projects, setProjects] = useState([]);
  const [targetRoles, setTargetRoles] = useState([]);
  const [interests, setInterests] = useState([]);

  // Communication style
  const [tone, setTone] = useState('direct');
  const [focusAreas, setFocusAreas] = useState('');
  const [highlightProject, setHighlightProject] = useState('');
  const [avoidPhrases, setAvoidPhrases] = useState([]);
  const [emphasize, setEmphasize] = useState([]);

  // Resume
  const [resumeFile, setResumeFile] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.get('/profile');
        setName(data.name || '');
        setTitle(data.title || '');
        setYearsExp(data.years_of_experience || 0);
        setLocation(data.location || '');
        setLinkedin(data.linkedin || '');
        setGithub(data.github || '');
        setPortfolio(data.portfolio || '');
        setSkills(data.skills || []);
        setBio(data.bio || '');
        setProjects(data.notable_projects || []);
        setTargetRoles(data.target_roles || []);
        setInterests(data.interests || []);
        setTone(data.tone || 'direct');
        setFocusAreas(data.focus_areas || '');
        setHighlightProject(data.highlight_project || '');
        setAvoidPhrases(data.avoid_phrases || []);
        setEmphasize(data.emphasize || []);
        setResumeFile(data.resume_filename || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

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

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/profile', {
        title, years_of_experience: parseInt(yearsExp), location, linkedin,
        github, portfolio, skills, bio, notable_projects: projects,
        target_roles: targetRoles, interests, tone, focus_areas: focusAreas,
        highlight_project: highlightProject, avoid_phrases: avoidPhrases,
        emphasize
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeUpload(file) {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/profile/resume', formData);
      setResumeFile(res.filename);
    } catch (err) {
      alert("Failed to upload resume: " + err.message);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Profile & Resume</h1>
            <p className="page-subtitle">This is your AI's brain — everything here shapes your cold emails</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving...</> : saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <div className="profile-editor-layout">
        {/* ── Left: Editor Form ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Personal Info */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              👤 Personal Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="grid-2">
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Title / Target Role</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Years of Experience</label>
                  <input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value)} min={0} />
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>LinkedIn</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>GitHub</label>
                  <input type="url" value={github} onChange={e => setGithub(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Portfolio</label>
                <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Skills</label>
                <TagsInput value={skills} onChange={setSkills} placeholder="Add a skill..." />
              </div>
            </div>
          </div>

          {/* Bio & Projects */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              📖 Your Story
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Bio</label>
                <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Write like a builder, not a resume. This is injected into every email prompt.
                </span>
              </div>

              <div className="input-group">
                <label>Notable Projects</label>
                {projects.map((p, i) => (
                  <div className="project-card-editable" key={i}>
                    <div className="project-card-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Project {i + 1}</span>
                      {projects.length > 1 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => removeProject(i)} type="button">🗑️</button>
                      )}
                    </div>
                    <input type="text" placeholder="Project name" value={p.name} onChange={e => updateProject(i, 'name', e.target.value)} />
                    <textarea rows={2} placeholder="Description..." value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} />
                  </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={addProject} type="button">+ Add Project</button>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Target Roles</label>
                  <TagsInput value={targetRoles} onChange={setTargetRoles} placeholder="Add role..." />
                </div>
                <div className="input-group">
                  <label>Interests</label>
                  <TagsInput value={interests} onChange={setInterests} placeholder="Add interest..." />
                </div>
              </div>
            </div>
          </div>

          {/* Communication Style */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              ✍️ Email Personality
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)}>
                  <option value="direct">Direct & Bold</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Focus Areas</label>
                  <input type="text" value={focusAreas} onChange={e => setFocusAreas(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Highlight Project</label>
                  <input type="text" value={highlightProject} onChange={e => setHighlightProject(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Emphasize</label>
                <TagsInput value={emphasize} onChange={setEmphasize} placeholder="Add quality..." />
              </div>
              <div className="input-group">
                <label>Avoid Phrases</label>
                <TagsInput value={avoidPhrases} onChange={setAvoidPhrases} placeholder="Add phrase..." />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              📄 Resume
            </h3>
            <div
              className="dropzone"
              style={{ padding: 'var(--space-xl)' }}
              onClick={() => document.getElementById('resume-upload')?.click()}
            >
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleResumeUpload(e.target.files[0]);
                  }
                }}
              />
              {resumeFile ? (
                <div>
                  <div className="drop-icon">📄</div>
                  <div className="drop-title">{resumeFile}</div>
                  <div className="drop-subtitle">Click to replace</div>
                </div>
              ) : (
                <div>
                  <div className="drop-icon">📤</div>
                  <div className="drop-title">Upload your resume (PDF)</div>
                  <div className="drop-subtitle">This will be attached to every email</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Live Preview ─────────────────── */}
        <div className="profile-preview-panel">
          <div className="card" style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--text-tertiary)' }}>
              🧠 AI SEES THIS CONTEXT
            </h4>
            <div style={{ fontSize: '0.82rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
              <p><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {name || '—'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Role:</strong> {title || '—'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Experience:</strong> {yearsExp} year(s)</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Skills:</strong> {skills.join(', ') || '—'}</p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />

              <p><strong style={{ color: 'var(--text-primary)' }}>Bio:</strong></p>
              <p style={{ fontStyle: 'italic' }}>{bio ? bio.slice(0, 200) + (bio.length > 200 ? '...' : '') : '—'}</p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />

              <p><strong style={{ color: 'var(--text-primary)' }}>Projects:</strong></p>
              {projects.filter(p => p.name).map((p, i) => (
                <p key={i}>• {p.name}</p>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />

              <p><strong style={{ color: 'var(--text-primary)' }}>Tone:</strong> {tone}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Focus:</strong> {focusAreas || '—'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Highlight:</strong> {highlightProject || '—'}</p>

              {resumeFile && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />
                  <p>📎 <strong style={{ color: 'var(--text-primary)' }}>Resume:</strong> {resumeFile}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
