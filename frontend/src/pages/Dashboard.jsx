import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalSent: 0,
    pending: 0,
    failed: 0,
    sentToday: 0,
    dailyLimit: 50,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get('/dashboard/stats');
        setStats({
          totalSent: data.contacts.sent,
          pending: data.contacts.pending,
          failed: data.contacts.failed,
          sentToday: data.today.sent,
          dailyLimit: data.today.daily_limit,
        });
        setRecentActivity(data.recent_activity || []);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const gaugeCircumference = 2 * Math.PI * 48;
  const gaugeProgress = stats.sentToday / stats.dailyLimit;
  const gaugeDashoffset = gaugeCircumference * (1 - gaugeProgress);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className="page-subtitle">Here's what's happening with your outreach</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ animation: 'fadeInUp 0.4s var(--ease-out) 0.1s both' }}>
        <div className="stat-card">
          <div className="stat-icon purple">📨</div>
          <div>
            <div className="stat-value">{stats.totalSent}</div>
            <div className="stat-label">Total Sent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">❌</div>
          <div>
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="gauge-container">
              <div className="gauge">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                  </defs>
                  <circle className="gauge-track" cx="60" cy="60" r="48" />
                  <circle
                    className="gauge-fill"
                    cx="60" cy="60" r="48"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashoffset}
                  />
                </svg>
                <div className="gauge-value">
                  <span className="gauge-number">{stats.sentToday}</span>
                  <span className="gauge-label">/ {stats.dailyLimit} today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(--space-2xl)', animation: 'fadeInUp 0.4s var(--ease-out) 0.2s both' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/contacts')}>
            <div className="quick-action-icon" style={{ background: 'var(--primary-glow)' }}>📋</div>
            <div>
              <div className="quick-action-label">Upload Contacts</div>
              <div className="quick-action-desc">Import a new CSV of leads</div>
            </div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/campaigns')}>
            <div className="quick-action-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>🚀</div>
            <div>
              <div className="quick-action-label">Start Outreach</div>
              <div className="quick-action-desc">Launch a new email sequence</div>
            </div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/campaigns')}>
            <div className="quick-action-icon" style={{ background: 'var(--info-bg)' }}>👁️</div>
            <div>
              <div className="quick-action-label">Preview Emails</div>
              <div className="quick-action-desc">See what AI will generate</div>
            </div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/profile')}>
            <div className="quick-action-icon" style={{ background: 'var(--warning-bg)' }}>📝</div>
            <div>
              <div className="quick-action-label">Edit Profile</div>
              <div className="quick-action-desc">Update your AI context</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Email Preview side-by-side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-xl)',
        animation: 'fadeInUp 0.4s var(--ease-out) 0.3s both',
      }}>
        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            Recent Activity
          </h3>
          <div className="timeline">
            {recentActivity.length === 0 && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No recent activity.</div>
            )}
            {recentActivity.map(a => (
              <div className="timeline-item" key={a.id}>
                <div className="timeline-dot" style={{
                  background: a.status === 'sent' ? 'var(--success-bg)' :
                    a.status === 'failed' ? 'var(--error-bg)' : 'var(--info-bg)'
                }}>
                  {a.status === 'sent' ? '✉️' : a.status === 'failed' ? '❌' : '📥'}
                </div>
                <div className="timeline-content">
                  <div className="timeline-text">
                    {a.status === 'sent' && <>Sent email to <strong>{a.to_email}</strong></>}
                    {a.status === 'failed' && <>Failed to send to <strong>{a.to_email}</strong></>}
                    {a.status !== 'sent' && a.status !== 'failed' && <>Activity: <strong>{a.status}</strong> for {a.to_email}</>}
                  </div>
                  <div className="timeline-time">{a.created_at ? new Date(a.created_at).toLocaleString() : 'Just now'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Email Preview */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Latest Email Preview</h3>
            {recentActivity.length > 0 && <span className="badge badge-success">{recentActivity[0].status}</span>}
          </div>
          {recentActivity.length > 0 ? (
            <div className="email-preview" style={{ border: 'none', borderRadius: 0 }}>
              <div className="email-preview-header">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>To:</span>
                <span style={{ fontSize: '0.88rem' }}>{recentActivity[0].to_email}</span>
              </div>
              <div className="email-preview-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Subject:</span>
                <span className="email-preview-subject">{recentActivity[0].subject}</span>
              </div>
              <div className="email-preview-body" style={{ whiteSpace: 'pre-wrap' }}>
                {recentActivity[0].body}
              </div>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-lg)', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              <div className="empty-icon">✉️</div>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                No emails generated yet. Upload contacts and start an outreach!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
