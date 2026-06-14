import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const data = await api.get('/contacts?limit=500');
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    sent: contacts.filter(c => c.status === 'sent').length,
    failed: contacts.filter(c => c.status === 'failed').length,
  };

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  }

  function handleFileSelect(e) {
    if (e.target.files.length > 0) processFile(e.target.files[0]);
  }

  async function processFile(file) {
    if (!file.name.endsWith('.csv')) {
      setUploadResult({ type: 'error', message: 'Please upload a .csv file' });
      return;
    }
    setUploadResult({ type: 'loading', message: 'Processing CSV...' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.post('/contacts/upload-csv', formData);
      
      setUploadResult({
        type: 'success',
        message: `Imported ${data.filename}: ${data.saved} saved, ${data.duplicates_skipped} duplicates, ${data.no_email_skipped} skipped`,
      });
      loadContacts();
    } catch (error) {
      setUploadResult({ type: 'error', message: error.message || 'Upload failed' });
    }
  }

  async function deleteContact(id) {
    try {
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete contact");
    }
  }

  async function retryFailed() {
    try {
      await api.post('/contacts/retry-failed');
      loadContacts();
    } catch (err) {
      alert("Failed to retry contacts");
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Contacts</h1>
            <p className="page-subtitle">Manage your outreach leads — upload CSV, filter, and track</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {statusCounts.failed > 0 && (
              <button className="btn btn-outline btn-sm" onClick={retryFailed}>
                🔄 Retry Failed ({statusCounts.failed})
              </button>
            )}
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              📤 Upload CSV
            </button>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <div className="drop-icon">📁</div>
        <div className="drop-title">
          {isDragOver ? 'Drop your CSV here!' : 'Drag & Drop your Apollo CSV here'}
        </div>
        <div className="drop-subtitle" style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>✨ Apollo.io CSVs are highly recommended</p>
          <p>They contain the perfect column formatting for our automation to work perfectly.</p>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)', 
            textAlign: 'left', 
            display: 'inline-block',
            border: '1px solid var(--border-subtle)'
          }}>
            <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Using a custom CSV? Ensure these exact columns exist:
            </p>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              columnGap: '24px', 
              rowGap: '4px', 
              fontSize: '0.85rem' 
            }}>
              <li><code className="text-mono">Email</code> (Required)</li>
              <li><code className="text-mono">First Name</code></li>
              <li><code className="text-mono">Last Name</code></li>
              <li><code className="text-mono">Company Name</code> (or <code className="text-mono">Company</code>)</li>
              <li><code className="text-mono">Title</code></li>
              <li><code className="text-mono">Person Linkedin Url</code></li>
              <li><code className="text-mono">Keywords</code> (or <code className="text-mono">Industry</code>)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload result toast */}
      {uploadResult && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: uploadResult.type === 'success' ? 'var(--success-bg)' :
            uploadResult.type === 'error' ? 'var(--error-bg)' : 'var(--info-bg)',
          color: uploadResult.type === 'success' ? 'var(--success)' :
            uploadResult.type === 'error' ? 'var(--error)' : 'var(--info)',
          border: `1px solid ${uploadResult.type === 'success' ? 'rgba(16,185,129,0.2)' :
            uploadResult.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
          animation: 'fadeInUp 0.3s var(--ease-out)',
        }}>
          {uploadResult.type === 'loading' && <span className="spinner" />}
          {uploadResult.type === 'success' && '✅'}
          {uploadResult.type === 'error' && '❌'}
          {uploadResult.message}
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => setUploadResult(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Contacts Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="table-filters">
            {['all', 'pending', 'sent', 'failed'].map(status => (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span style={{
                  marginLeft: '4px',
                  fontSize: '0.75rem',
                  opacity: 0.7,
                }}>
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Title</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.company}</td>
                  <td>{c.title}</td>
                  <td>
                    <span className={`badge ${
                      c.status === 'sent' ? 'badge-success' :
                      c.status === 'pending' ? 'badge-warning' : 'badge-error'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{c.created_at}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => deleteContact(c.id)}
                      title="Delete contact"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="table-empty">
            <div className="empty-icon">📭</div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {search ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Upload an Apollo CSV to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
