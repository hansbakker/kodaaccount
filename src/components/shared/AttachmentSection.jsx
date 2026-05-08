import React, { useState } from 'react';
import { Paperclip, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { useAttachments } from '../../hooks/useAttachments';

// Detect Google Drive URL and return a clean display label
const getDriveInfo = (url) => {
  try {
    const u = new URL(url);
    const isDrive =
      u.hostname === 'drive.google.com' ||
      u.hostname === 'docs.google.com' ||
      u.hostname === 'sheets.google.com' ||
      u.hostname === 'slides.google.com';
    return { isDrive, hostname: u.hostname };
  } catch {
    return { isDrive: false, hostname: '' };
  }
};

const DriveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5L6.6 66.85z" fill="#0066DA"/>
    <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0c-1.55 0-3.1.4-4.5 1.2L6.6 11.15 27.5 53l16.15-28z" fill="#00AC47"/>
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#EA4335"/>
    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25z" fill="#00832D"/>
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2L59.8 53z" fill="#2684FC"/>
    <path d="M73.4 26.5L59.7 3.2C58.9 1.8 57.75.7 56.4 0l-13.75 25L59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#FFBA00"/>
  </svg>
);

const AttachmentSection = ({ entityType, entityId, readOnly = false }) => {
  const { attachments, addAttachment, deleteAttachment } = useAttachments(entityType, entityId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', label: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!form.url.trim()) {
      setError('Please enter a URL.');
      return;
    }
    try {
      new URL(form.url.trim());
    } catch {
      setError('Please enter a valid URL (starting with https://).');
      return;
    }

    setSaving(true);
    try {
      await addAttachment({ url: form.url, label: form.label });
      setForm({ url: '', label: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setShowForm(false);
    setForm({ url: '', label: '' });
    setError('');
  };

  return (
    <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Paperclip size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Attachments {attachments.length > 0 && `(${attachments.length})`}
          </span>
        </div>
        {!readOnly && !showForm && (
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={13} /> Add Drive Link
          </button>
        )}
      </div>

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: showForm ? 'var(--space-3)' : 0 }}>
          {attachments.map(att => {
            const { isDrive } = getDriveInfo(att.url);
            const displayLabel = att.label || att.url;
            return (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-main)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}
              >
                {isDrive ? <DriveIcon /> : <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={att.url}
                >
                  {displayLabel}
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => deleteAttachment(att.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', flexShrink: 0 }}
                    title="Remove attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <input
            className="input"
            style={{ fontSize: '0.85rem' }}
            placeholder="Google Drive URL (https://drive.google.com/...)"
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
            autoFocus
          />
          <input
            className="input"
            style={{ fontSize: '0.85rem' }}
            placeholder="Label (optional, e.g. 'Invoice 2026-01')"
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
          />
          {error && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{error}</span>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Attach'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {attachments.length === 0 && !showForm && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No attachments yet.</p>
      )}
    </div>
  );
};

export default AttachmentSection;
