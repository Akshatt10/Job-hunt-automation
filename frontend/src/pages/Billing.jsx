import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const tierLimits = {
    free: 50,
    pro: 1000
  };

  const currentLimit = tierLimits[user?.subscription_tier] || 50;
  const usagePercentage = Math.min((user?.emails_sent_this_month / currentLimit) * 100, 100);

  async function handleUpgrade(tier) {
    // In a real application, this would redirect to Stripe Checkout
    alert(`Redirecting to Stripe to upgrade to ${tier.toUpperCase()}...`);
  }

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Usage</h1>
          <p className="page-subtitle">Manage your subscription and track your monthly email limits</p>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="glass-card" style={{ marginBottom: '40px', padding: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Current Usage</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {user?.emails_sent_this_month || 0}
            </span>
            <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              / {currentLimit} emails sent this month
            </span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
            {user?.subscription_tier?.toUpperCase() || 'FREE'} PLAN
          </div>
        </div>

        <div style={{
          width: '100%',
          height: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${usagePercentage}%`,
            background: usagePercentage > 90 ? 'var(--error)' : 'var(--accent)',
            transition: 'width 0.5s ease-out'
          }}></div>
        </div>

        {usagePercentage > 90 && (
          <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '12px', fontWeight: 600 }}>
            ⚠️ You are approaching your monthly limit. Upgrade your plan to continue sending.
          </p>
        )}
      </div>

      {/* Pricing Tiers */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Available Plans</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Free Tier */}
        <div className="glass-card" style={{ border: user?.subscription_tier === 'free' ? '2px solid var(--border-default)' : '1px solid var(--border-subtle)', opacity: user?.subscription_tier === 'free' ? 1 : 0.7 }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Free Trial</h3>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '24px' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/mo</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '12px' }}>✓ 50 automated emails total</li>
            <li style={{ marginBottom: '12px' }}>✓ Basic AI Generation</li>
            <li style={{ marginBottom: '12px' }}>✓ Automatic resume attachments</li>
          </ul>
          <button className="btn btn-outline w-full" disabled>
            {user?.subscription_tier === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="glass-card" style={{ border: user?.subscription_tier === 'pro' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)', position: 'relative' }}>
          {user?.subscription_tier !== 'pro' && (
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              RECOMMENDED
            </div>
          )}
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Pro Job Seeker</h3>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '24px' }}>$10 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/mo</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '12px' }}>✓ 1,000 automated emails/mo</li>
            <li style={{ marginBottom: '12px' }}>✓ Priority Email Delivery</li>
            <li style={{ marginBottom: '12px' }}>✓ Advanced Outreach Analytics</li>
          </ul>
          <button
            className="btn btn-primary w-full"
            onClick={() => handleUpgrade('pro')}
            disabled={user?.subscription_tier === 'pro'}
          >
            {user?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

      </div>
    </div>
  );
}
