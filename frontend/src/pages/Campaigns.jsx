import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [contactStats, setContactStats] = useState({ pending: 0, failed: 0 });

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const data = await api.get('/campaigns');
      setCampaigns(data);
      
      const statsData = await api.get('/contacts/count');
      if (statsData && statsData.breakdown) {
        setContactStats({
          pending: statsData.breakdown.pending || 0,
          failed: statsData.breakdown.failed || 0
        });
      }
    } catch (e) {
      console.error("Failed to load campaign data");
    }
  }

  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState(null);

  // Create campaign form
  const [campaignName, setCampaignName] = useState('');
  const [dailyLimit, setDailyLimit] = useState(50);
  const [dryRun, setDryRun] = useState(true);
  const [contactFilter, setContactFilter] = useState('pending');

  // Running campaign simulation
  const [progress, setProgress] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  async function startCampaign() {
    try {
      const camp = await api.post('/campaigns', {
        name: campaignName || 'New Outreach',
        daily_limit: dailyLimit,
        dry_run: dryRun,
        contact_filter: contactFilter
      });
      
      setRunningCampaign({ name: camp.name, dryRun: camp.dry_run });
      setTotalToSend(camp.total_contacts);
      setProgress(0);
      setLogs([]);
      setShowCreate(false);

      // Start SSE stream via fetch
      const response = await fetch(`${api.baseUrl}/campaigns/${camp.id}/run`, {
        headers: { 'Authorization': `Bearer ${api.getToken()}` }
      });
      
      if (!response.ok) {
        let errMsg = `Stream failed: HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const event = JSON.parse(dataStr);
              if (event.done) {
                loadCampaigns();
                break;
              } else {
                setLogs(prev => [...prev, {
                  time: new Date().toLocaleTimeString(),
                  type: event.status === 'success' ? 'success' : 'error',
                  message: event.status === 'success'
                    ? `${event.dry_run ? '[DRY RUN] ' : ''}Sent to ${event.contact} (${event.email})`
                    : `Failed: ${event.contact} (${event.email}) — ${event.message}`,
                }]);
                setProgress(event.index);
              }
            } catch (err) {} // ignore partial json
          }
        }
      }
    } catch (err) {
      alert("Failed to start campaign: " + err.message);
    }
  }

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Preview email samples
  const [sampleEmails, setSampleEmails] = useState([]);

  useEffect(() => {
    if (showPreview) {
      api.get('/dashboard/stats').then(data => {
        if (data && data.recent_activity) {
          setSampleEmails(data.recent_activity.slice(0, 2).map(a => ({
            to: a.to_email,
            subject: a.subject,
            body: a.body
          })));
        }
      });
    }
  }, [showPreview]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Outreach</h1>
            <p className="page-subtitle">Create, preview, and run email outreach</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={() => setShowPreview(!showPreview)}>
              👁️ Preview Emails
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
              ✨ New Outreach
            </button>
          </div>
        </div>
      </div>

      {/* ── Create Outreach Panel ────────────── */}
      {showCreate && (
        <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            Create Campaign
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="grid-2">
              <div className="input-group">
                <label>Outreach Name</label>
                <input
                  type="text"
                  placeholder="e.g. AI Startups Batch 1"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Daily Limit</label>
                <input type="number" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} min={1} max={200} />
              </div>
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label>Contact Selection</label>
                <select value={contactFilter} onChange={e => setContactFilter(e.target.value)}>
                  <option value="pending">All Pending Contacts ({contactStats.pending})</option>
                  <option value="failed">Retry Failed Contacts ({contactStats.failed})</option>
                </select>
              </div>
              <div className="input-group">
                <label>Mode</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: dryRun ? 600 : 400,
                    color: dryRun ? 'var(--warning)' : 'var(--text-tertiary)',
                  }}>
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={e => setDryRun(e.target.checked)}
                      style={{ accentColor: 'var(--warning)' }}
                    />
                    🧪 Dry Run {dryRun ? '(No emails sent)' : ''}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={startCampaign}>
                🚀 {dryRun ? 'Start Dry Run' : 'Start Sending'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Preview Panel ──────────────── */}
      {showPreview && (
        <div className="animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            📧 Sample Emails (AI-generated preview)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            {sampleEmails.map((email, i) => (
              <div className="email-preview" key={i}>
                <div className="email-preview-header">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>To:</span>
                  <span style={{ fontSize: '0.85rem' }}>{email.to}</span>
                </div>
                <div className="email-preview-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Subject:</span>
                  <span className="email-preview-subject" style={{ fontSize: '0.88rem' }}>{email.subject}</span>
                </div>
                <div className="email-preview-body" style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {email.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Running Outreach Progress ────────── */}
      {runningCampaign && (
        <div className="campaign-progress animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {runningCampaign.dryRun ? '🧪' : '🚀'} {runningCampaign.name}
              {runningCampaign.dryRun && <span className="badge badge-warning" style={{ marginLeft: '8px' }}>DRY RUN</span>}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {progress} / {totalToSend} emails
            </span>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${totalToSend > 0 ? (progress / totalToSend) * 100 : 0}%` }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: 'var(--space-md)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--success)' }}>✅ {logs.filter(l => l.type === 'success').length} sent</span>
            <span style={{ color: 'var(--error)' }}>❌ {logs.filter(l => l.type === 'error').length} failed</span>
            {progress >= totalToSend && totalToSend > 0 && (
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>COMPLETED</span>
            )}
          </div>

          <div className="campaign-log" ref={logRef}>
            {logs.map((log, i) => (
              <div className={`log-entry ${log.type}`} key={i}>
                <span className="log-time">{log.time}</span>
                <span className="log-msg">{log.message}</span>
              </div>
            ))}
            {progress < totalToSend && (
              <div className="log-entry" style={{ color: 'var(--text-tertiary)' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> Generating next email...
              </div>
            )}
          </div>

          {progress >= totalToSend && totalToSend > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRunningCampaign(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Outreach History ─────────────────── */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Outreach History</h3>
        </div>
        {campaigns.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Outreach</th>
                <th>Contacts</th>
                <th>Sent</th>
                <th>Failed</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                  <td>{c.total_contacts}</td>
                  <td style={{ color: 'var(--success)' }}>{c.sent_count}</td>
                  <td style={{ color: c.failed_count > 0 ? 'var(--error)' : 'var(--text-tertiary)' }}>{c.failed_count}</td>
                  <td>
                    {c.dry_run ? (
                      <span className="badge badge-warning">Dry Run</span>
                    ) : (
                      <span className="badge badge-success">Live</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="table-empty">
            <div className="empty-icon">🚀</div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No outreach yet</p>
            <p style={{ fontSize: '0.85rem' }}>Create your first outreach to start sending emails</p>
          </div>
        )}
      </div>
    </div>
  );
}
