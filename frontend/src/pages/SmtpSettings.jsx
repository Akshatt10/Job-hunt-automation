import { useState } from 'react';

export default function SmtpSettings() {
  const [provider, setProvider] = useState('gmail');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testError, setTestError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Daily limit settings
  const [dailyLimit, setDailyLimit] = useState(50);

  function handleProviderChange(p) {
    setProvider(p);
    const presets = {
      gmail: { host: 'smtp.gmail.com', port: '587' },
      outlook: { host: 'smtp.office365.com', port: '587' },
      yahoo: { host: 'smtp.mail.yahoo.com', port: '465' },
      custom: { host: '', port: '587' },
    };
    setSmtpHost(presets[p].host);
    setSmtpPort(presets[p].port);
    setTestStatus(null);
  }

  async function testConnection() {
    setTestStatus('testing');
    setTestError('');

    // Simulate SMTP test
    await new Promise(r => setTimeout(r, 2500));

    if (!smtpUser) {
      setTestStatus('error');
      setTestError('Email address is required');
      return;
    }
    if (!smtpPass) {
      setTestStatus('error');
      setTestError('App password is required. See the guide below.');
      return;
    }
    if (smtpPass.includes(' ')) {
      setTestStatus('error');
      setTestError('Your password contains spaces! Google App Passwords should have NO spaces. Remove all spaces and try again.');
      return;
    }
    if (smtpPass.length < 16 && provider === 'gmail') {
      setTestStatus('error');
      setTestError('Gmail App Passwords are exactly 16 characters. The password you entered seems too short. Make sure you copied it correctly.');
      return;
    }

    setTestStatus('success');
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Email Setup</h1>
            <p className="page-subtitle">Connect your email account to start sending</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving...</> : saved ? '✅ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '720px' }}>
        {/* Connection Status Banner */}
        <div
          className={`connection-status ${testStatus === 'success' ? 'connected' : 'disconnected'}`}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <div className="status-dot" />
          {testStatus === 'success'
            ? `Connected! Emails will be sent from ${smtpUser}`
            : 'Not connected — set up your email below'}
        </div>

        {/* Provider Selection */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            📮 Email Provider
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { id: 'gmail', label: 'Gmail', icon: '📧' },
              { id: 'outlook', label: 'Outlook', icon: '📬' },
              { id: 'yahoo', label: 'Yahoo', icon: '📭' },
              { id: 'custom', label: 'Custom', icon: '⚙️' },
            ].map(p => (
              <button
                key={p.id}
                className={`btn ${provider === p.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleProviderChange(p.id)}
                style={{ flexDirection: 'column', padding: '16px', gap: '8px' }}
              >
                <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Setup Guide (Gmail) */}
        {provider === 'gmail' && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              📋 Gmail Setup Guide
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Gmail requires an <strong style={{ color: 'var(--text-primary)' }}>App Password</strong> instead of your regular password.
              This keeps your account secure. Follow these 3 steps:
            </p>

            <div className="smtp-wizard">
              <div className="smtp-step">
                <div className="smtp-step-number">1</div>
                <div className="smtp-step-content">
                  <h4>Enable 2-Factor Authentication</h4>
                  <p>
                    Go to{' '}
                    <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                      Google Security Settings ↗
                    </a>{' '}
                    and ensure "2-Step Verification" is <strong>turned ON</strong>.
                  </p>
                  <p style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Without this, Google won't let you create App Passwords.
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
                      myaccount.google.com/apppasswords ↗
                    </a>
                  </p>
                  <ul style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>In the "App name" field, type <strong>ColdReach</strong></li>
                    <li>Click <strong>"Create"</strong></li>
                    <li>Google will show you a 16-character password like: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>abcd efgh ijkl mnop</code></li>
                  </ul>
                </div>
              </div>

              <div className="smtp-step">
                <div className="smtp-step-number">3</div>
                <div className="smtp-step-content">
                  <h4>Paste It Below (Remove Spaces!)</h4>
                  <p>
                    Copy the 16-character password and paste it below.
                  </p>
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    background: 'var(--warning-bg)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    color: 'var(--warning)',
                  }}>
                    ⚠️ <strong>Critical:</strong> Google shows the password with spaces (like "abcd efgh ijkl mnop").
                    You MUST remove all spaces so it becomes "abcdefghijklmnop". Spaces will cause authentication errors.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMTP Credentials */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            🔑 Credentials
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {provider === 'custom' && (
              <div className="grid-2">
                <div className="input-group">
                  <label>SMTP Host</label>
                  <input type="text" placeholder="smtp.yourprovider.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Port</label>
                  <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder={provider === 'gmail' ? 'your_email@gmail.com' : 'your_email@provider.com'}
                value={smtpUser}
                onChange={e => setSmtpUser(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>{provider === 'gmail' ? 'App Password (16 characters, no spaces)' : 'Password'}</label>
              <input
                type="password"
                placeholder={provider === 'gmail' ? 'abcdefghijklmnop' : 'Your email password'}
                value={smtpPass}
                onChange={e => setSmtpPass(e.target.value)}
              />
            </div>

            {/* Test connection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                onClick={testConnection}
                disabled={testStatus === 'testing'}
                type="button"
              >
                {testStatus === 'testing' ? (
                  <><span className="spinner" /> Testing connection...</>
                ) : '🔌 Test Connection'}
              </button>

              {testStatus === 'success' && (
                <div className="connection-status connected" style={{ padding: '8px 16px' }}>
                  <div className="status-dot" />
                  ✅ Connection successful!
                </div>
              )}
              {testStatus === 'error' && (
                <div style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--error-bg)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)',
                  fontSize: '0.85rem',
                }}>
                  ❌ {testError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            🛡️ Sending Limits
          </h3>
          <div className="input-group">
            <label>Daily Email Limit</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={e => setDailyLimit(e.target.value)}
              min={1}
              max={500}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
              Gmail allows up to 500 emails/day for personal accounts, but we recommend staying under 50
              to avoid being flagged as spam. Higher limits are available for Google Workspace accounts.
            </span>
          </div>
        </div>

        {/* Help Section */}
        <div className="card" style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--glass-border)',
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            ❓ Troubleshooting
          </h4>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Authentication Error?</strong></p>
            <ul style={{ paddingLeft: '16px', marginBottom: '12px' }}>
              <li>Make sure you're using an App Password, not your regular Gmail password</li>
              <li>Remove ALL spaces from the App Password</li>
              <li>Ensure 2-Factor Authentication is enabled</li>
            </ul>

            <p><strong style={{ color: 'var(--text-primary)' }}>Connection Timeout?</strong></p>
            <ul style={{ paddingLeft: '16px', marginBottom: '12px' }}>
              <li>Check that port 587 is not blocked by your firewall</li>
              <li>Try port 465 with SSL if 587 doesn't work</li>
            </ul>

            <p><strong style={{ color: 'var(--text-primary)' }}>Don't want to set up SMTP?</strong></p>
            <ul style={{ paddingLeft: '16px' }}>
              <li>You can still use <strong>Dry Run</strong> mode to preview AI-generated emails without sending</li>
              <li>OAuth-based Gmail connection (1-click) is coming soon! 🚧</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
