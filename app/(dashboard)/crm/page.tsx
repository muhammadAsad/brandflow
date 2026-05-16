'use client';

import { useState, useEffect, useCallback, useRef, useMemo, ChangeEvent } from 'react';
import {
  Plus, Search, X, Copy, Check, Mail, Phone, Building2,
  Tag, MessageSquare, FileText, Activity, Edit2, Trash2,
  ChevronDown, Upload, Download, LayoutGrid, List,
  ExternalLink, Globe, UserPlus, Filter,
} from 'lucide-react';
import type { FC } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
type FilterTab = 'all' | ContactStatus;
type SortOption = 'newest' | 'name' | 'company';
type ViewMode = 'list' | 'kanban';
type DetailTab = 'overview' | 'conversations' | 'notes' | 'activity';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  status: ContactStatus;
  source: string;
  tags: string[];
  notes: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  created_at: string;
  last_activity_at: string;
}

interface NoteEntry {
  id: string;
  text: string;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<ContactStatus, { label: string; color: string; bg: string }> = {
  lead:     { label: 'Lead',     color: '#7c3aed', bg: '#f5f3ff' },
  prospect: { label: 'Prospect', color: '#0ea5e9', bg: '#f0f9ff' },
  customer: { label: 'Customer', color: '#059669', bg: '#ecfdf5' },
  churned:  { label: 'Churned',  color: '#dc2626', bg: '#fef2f2' },
};

const AVATAR_COLORS = ['#7c3aed','#0ea5e9','#059669','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const SOURCE_OPTIONS = ['Manual', 'Instagram', 'LinkedIn', 'Website', 'Referral', 'Cold Email', 'Event'];

const DEMO_CONTACTS: Contact[] = [
  { id:'d1', name:'Sarah Johnson',    email:'sarah@techcorp.com',   phone:'+1 555-0101', company:'TechCorp',      job_title:'Head of Marketing', status:'customer', source:'LinkedIn',   tags:['VIP','Enterprise'],   notes:'Interested in premium plan. Met at SaaStr 2024.',          linkedin:'sarahjohnson',   instagram:'sarah_j',      twitter:'sarahjohnson',  created_at:'2024-01-15T10:00:00Z', last_activity_at:'2024-05-10T14:30:00Z' },
  { id:'d2', name:'Michael Chen',     email:'mchen@startup.io',     phone:'+1 555-0102', company:'StartupIO',     job_title:'CEO',               status:'prospect', source:'Instagram',  tags:['Warm Lead'],          notes:'Replied to IG story. Follow up next week.',                linkedin:'michaelchen',    instagram:'mchen_io',     twitter:'mchen',         created_at:'2024-02-20T09:00:00Z', last_activity_at:'2024-05-08T11:00:00Z' },
  { id:'d3', name:'Emma Williams',    email:'emma@designco.com',    phone:'+1 555-0103', company:'DesignCo',      job_title:'Creative Director', status:'lead',     source:'Website',    tags:['Design','Agency'],    notes:'Downloaded whitepaper. Opened 3 emails.',                  linkedin:'emmawilliams',   instagram:'emma_design',  twitter:'emmawilliams',  created_at:'2024-03-05T08:00:00Z', last_activity_at:'2024-05-07T16:45:00Z' },
  { id:'d4', name:'James Brown',      email:'jbrown@agency.net',    phone:'+1 555-0104', company:'Agency Net',    job_title:'Partner',           status:'customer', source:'Referral',   tags:['Pro Plan','Agency'],  notes:'Referred by Sarah Johnson. Uses for 3 clients.',           linkedin:'jamesbrown',     instagram:'jbrown_net',   twitter:'jbrown',        created_at:'2024-01-28T11:00:00Z', last_activity_at:'2024-05-11T09:20:00Z' },
  { id:'d5', name:'Priya Patel',      email:'priya@growthlab.co',   phone:'+1 555-0105', company:'GrowthLab',     job_title:'Growth Manager',    status:'prospect', source:'LinkedIn',   tags:['B2B','Growth'],       notes:'Engaged with LinkedIn post. Scheduled demo for Friday.',   linkedin:'priyapatel',     instagram:'priya_growth', twitter:'priyapatel',    created_at:'2024-04-01T13:00:00Z', last_activity_at:'2024-05-09T10:15:00Z' },
  { id:'d6', name:'Carlos Mendez',    email:'carlos@brandboost.mx', phone:'+1 555-0106', company:'BrandBoost',    job_title:'Founder',           status:'churned',  source:'Cold Email', tags:['Churned','SMB'],      notes:'Cancelled after 3 months. Budget constraints.',            linkedin:'carlosmendez',   instagram:'carlosm_bb',   twitter:'carlosmendez',  created_at:'2023-11-10T08:30:00Z', last_activity_at:'2024-02-28T17:00:00Z' },
  { id:'d7', name:'Aisha Thompson',   email:'aisha@socialwave.co',  phone:'+1 555-0107', company:'SocialWave',    job_title:'Social Media Mgr',  status:'lead',     source:'Instagram',  tags:['New','SMM'],          notes:'Commented on ad. Sent intro DM.',                          linkedin:'aishathompson',  instagram:'aisha_sw',     twitter:'aishathompson', created_at:'2024-05-01T10:00:00Z', last_activity_at:'2024-05-11T08:00:00Z' },
  { id:'d8', name:'David Park',       email:'david@mediapeak.com',  phone:'+1 555-0108', company:'MediaPeak',     job_title:'CMO',               status:'customer', source:'LinkedIn',   tags:['Enterprise','VIP'],   notes:'Long-term client. Upgraded to Enterprise plan last month.', linkedin:'davidpark',      instagram:'david_mp',     twitter:'davidpark',     created_at:'2023-10-05T09:00:00Z', last_activity_at:'2024-05-10T12:00:00Z' },
];

const DEMO_CONVERSATIONS: Record<string, { platform: string; last_msg: string; date: string }[]> = {
  d1: [{ platform:'LinkedIn', last_msg:'Thanks for the quick response! Looking forward to the call.', date:'2024-05-10T14:30:00Z' }],
  d2: [{ platform:'Instagram', last_msg:'Loved the post about analytics! Can we chat?', date:'2024-05-08T11:00:00Z' }],
  d5: [{ platform:'LinkedIn', last_msg:'Would love a demo of the scheduling features.', date:'2024-05-09T10:15:00Z' }],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar: FC<{ name: string; size?: number }> = ({ name, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: getAvatarColor(name), color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    letterSpacing: '0.02em',
  }}>
    {getInitials(name)}
  </div>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge: FC<{ status: ContactStatus; sm?: boolean }> = ({ status, sm }) => {
  const m = STATUS_META[status];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 4,
      padding: sm ? '2px 7px' : '3px 10px',
      borderRadius: 999, fontSize: sm ? 11 : 12, fontWeight: 600,
      color: m.color, background: m.bg,
    }}>
      <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius:'50%', background: m.color, display:'inline-block' }} />
      {m.label}
    </span>
  );
};

// ── TagPill ───────────────────────────────────────────────────────────────────

const TagPill: FC<{ tag: string; onRemove?: () => void }> = ({ tag, onRemove }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap: 4,
    padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    background: '#f5f3ff', color: '#7c3aed',
  }}>
    {tag}
    {onRemove && (
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'#7c3aed', opacity:0.6 }}>
        <X size={11} />
      </button>
    )}
  </span>
);

// ── CopyButton ────────────────────────────────────────────────────────────────

const CopyButton: FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color: copied ? '#059669' : '#9ca3af', padding: 2 }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

// ── Platform icon inline ──────────────────────────────────────────────────────

const PlatformDot: FC<{ platform: string }> = ({ platform }) => {
  const colors: Record<string,string> = { LinkedIn:'#0077b5', Instagram:'#e1306c', Twitter:'#000', Facebook:'#1877f2' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 4,
      fontSize: 12, fontWeight: 500, color: colors[platform] ?? '#6b7280',
    }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background: colors[platform] ?? '#6b7280' }} />
      {platform}
    </span>
  );
};

// ── Add Contact Modal ─────────────────────────────────────────────────────────

interface AddContactModalProps {
  onClose: () => void;
  onAdd: (c: Contact) => void;
}

function AddContactModal({ onClose, onAdd }: AddContactModalProps) {
  const [form, setForm] = useState({
    name:'', email:'', phone:'', company:'', job_title:'',
    status:'lead' as ContactStatus, source:'Manual',
    notes:'', linkedin:'', instagram:'', twitter:'',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags(t => [...t, tagInput.trim()]);
      setTagInput('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      const { contact } = await res.json();
      onAdd(contact);
      onClose();
    } catch {
      const newContact: Contact = {
        id: genId(), ...form, tags,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };
      onAdd(newContact);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:8,
    border:'1.5px solid #e5e7eb', fontSize:14, outline:'none',
    background:'#fff', boxSizing:'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 };
  const rowStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:16, width:580, maxHeight:'92vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Add Contact</h2>
            <p style={{ fontSize:13, color:'#6b7280', margin:'4px 0 0' }}>Add a new contact to your CRM</p>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', padding:8 }}>
            <X size={16} color="#6b7280" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px' }}>
          {err && <div style={{ background:'#fef2f2', color:'#dc2626', fontSize:13, padding:'9px 12px', borderRadius:8, marginBottom:16 }}>{err}</div>}

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="Jane Cooper" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="jane@company.com" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="+1 555-0100" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input style={inputStyle} placeholder="Acme Corp" value={form.company} onChange={set('company')} />
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Job Title</label>
                <input style={inputStyle} placeholder="Head of Marketing" value={form.job_title} onChange={set('job_title')} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status} onChange={set('status') as React.ChangeEventHandler<HTMLSelectElement>}>
                  {(Object.keys(STATUS_META) as ContactStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Source</label>
              <select style={inputStyle} value={form.source} onChange={set('source') as React.ChangeEventHandler<HTMLSelectElement>}>
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tags</label>
              <input
                style={inputStyle} placeholder="Type a tag and press Enter…"
                value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                  {tags.map(t => <TagPill key={t} tag={t} onRemove={() => setTags(tg => tg.filter(x => x !== t))} />)}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, resize:'vertical', minHeight:80, fontFamily:'inherit' }}
                placeholder="Add any notes about this contact…" value={form.notes} onChange={set('notes')} />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom:10 }}>Social Profiles</label>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { key:'linkedin',  label:'LinkedIn URL',        placeholder:'linkedin.com/in/username' },
                  { key:'instagram', label:'Instagram Username',  placeholder:'@username' },
                  { key:'twitter',   label:'Twitter / X Handle',  placeholder:'@handle' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#6b7280', width:130, flexShrink:0 }}>{label}</span>
                    <input style={{ ...inputStyle, flex:1 }} placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={set(key)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding:'9px 18px', borderRadius:8, border:'1.5px solid #e5e7eb',
              background:'#fff', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding:'9px 22px', borderRadius:8, border:'none',
              background: saving ? '#a78bfa' : '#7c3aed', color:'#fff',
              fontSize:14, fontWeight:600, cursor:'pointer',
            }}>
              {saving ? 'Adding…' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Import CSV Modal ──────────────────────────────────────────────────────────

interface ImportCSVModalProps {
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
}

function ImportCSVModal({ onClose, onImport }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [step, setStep] = useState<1|2>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const FIELDS = ['name','email','phone','company','job_title','status','source','tags','notes','linkedin','instagram','twitter'];

  function parseCSV(text: string) {
    const lines = text.trim().split('\n');
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
    const data = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g,'')));
    setHeaders(hdrs);
    setRows(data);
    const auto: Record<string,string> = {};
    FIELDS.forEach(f => {
      const match = hdrs.find(h => h.toLowerCase().replace(/[^a-z]/g,'') === f.toLowerCase());
      if (match) auto[f] = match;
    });
    setMapping(auto);
    setStep(2);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => parseCSV(ev.target?.result as string);
    reader.readAsText(f);
  }

  function doImport() {
    const contacts: Contact[] = rows.slice(0, 500).map((row, i) => {
      const get = (field: string) => {
        const col = mapping[field];
        if (!col) return '';
        const idx = headers.indexOf(col);
        return idx >= 0 ? row[idx] ?? '' : '';
      };
      const tagsRaw = get('tags');
      return {
        id: `import-${i}-${genId()}`,
        name: get('name') || `Imported ${i+1}`,
        email: get('email'), phone: get('phone'),
        company: get('company'), job_title: get('job_title'),
        status: (['lead','prospect','customer','churned'].includes(get('status')) ? get('status') : 'lead') as ContactStatus,
        source: get('source') || 'Import',
        tags: tagsRaw ? tagsRaw.split(';').map(t => t.trim()) : [],
        notes: get('notes'), linkedin: get('linkedin'),
        instagram: get('instagram'), twitter: get('twitter'),
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };
    });
    onImport(contacts);
    onClose();
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:16, width:560, maxHeight:'85vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Import Contacts</h2>
            <p style={{ fontSize:13, color:'#6b7280', margin:'4px 0 0' }}>
              {step === 1 ? 'Upload a CSV file to import contacts' : `${rows.length} rows found — map your columns`}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', padding:8 }}>
            <X size={16} color="#6b7280" />
          </button>
        </div>

        <div style={{ padding:'20px 24px 24px' }}>
          {step === 1 && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border:'2px dashed #d8b4fe', borderRadius:12, padding:'40px 24px',
                  textAlign:'center', cursor:'pointer', background:'#faf5ff',
                }}
              >
                <Upload size={32} color="#7c3aed" style={{ margin:'0 auto 12px' }} />
                <p style={{ fontWeight:600, color:'#374151', marginBottom:4 }}>Drop CSV file here or click to browse</p>
                <p style={{ fontSize:13, color:'#9ca3af' }}>Supports .csv files up to 500 rows</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:'none' }} />
              <div style={{ marginTop:16, padding:'12px 16px', background:'#f9fafb', borderRadius:8, fontSize:13, color:'#6b7280' }}>
                <strong style={{ color:'#374151' }}>Expected columns:</strong> name, email, phone, company, job_title, status, source, tags (semicolon-separated), notes, linkedin, instagram, twitter
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:340, overflowY:'auto' }}>
                {FIELDS.map(field => (
                  <div key={field} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151', width:110, flexShrink:0, textTransform:'capitalize' }}>
                      {field.replace('_',' ')}
                    </span>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                      style={{ flex:1, padding:'7px 10px', borderRadius:7, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none' }}
                    >
                      <option value="">— skip —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, fontSize:13, color:'#6b7280', background:'#f9fafb', padding:'10px 14px', borderRadius:8 }}>
                Importing <strong style={{ color:'#374151' }}>{rows.length}</strong> contacts from <em>{file?.name}</em>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer' }}>
              Cancel
            </button>
            {step === 2 && (
              <button onClick={doImport} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Import {rows.length} Contacts
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ contact, onConfirm, onCancel }: { contact: Contact; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'28px 28px 24px', width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>Delete Contact</h3>
        <p style={{ fontSize:14, color:'#6b7280', margin:'0 0 24px', lineHeight:1.6 }}>
          Are you sure you want to delete <strong>{contact.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Delete Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  contact: Contact;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function DetailPanel({ contact, onUpdate, onDelete, onClose }: DetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...contact });
  const [tagInput, setTagInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => { setForm({ ...contact }); setEditing(false); }, [contact.id]);

  function saveEdit() {
    onUpdate(contact.id, form);
    setEditing(false);
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...form.tags, tagInput.trim()];
      setForm(f => ({ ...f, tags: newTags }));
      onUpdate(contact.id, { tags: newTags });
      setTagInput('');
    }
  }

  function removeTag(t: string) {
    const newTags = form.tags.filter(x => x !== t);
    setForm(f => ({ ...f, tags: newTags }));
    onUpdate(contact.id, { tags: newTags });
  }

  function saveNote() {
    if (!noteInput.trim()) return;
    setNotes(n => [{ id: genId(), text: noteInput.trim(), created_at: new Date().toISOString() }, ...n]);
    onUpdate(contact.id, { notes: noteInput.trim() });
    setNoteInput('');
  }

  const conversations = DEMO_CONVERSATIONS[contact.id] ?? [];

  const activityItems = [
    { icon:'📋', text:`Added as ${STATUS_META[contact.status].label}`, date: contact.created_at },
    ...(contact.tags.length ? [{ icon:'🏷️', text:`Tags added: ${contact.tags.join(', ')}`, date: contact.created_at }] : []),
    ...(conversations.length ? [{ icon:'💬', text:`Conversation started via ${conversations[0].platform}`, date: conversations[0].date }] : []),
    { icon:'✅', text:'Last activity recorded', date: contact.last_activity_at },
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'8px 11px', borderRadius:7,
    border:'1.5px solid #e5e7eb', fontSize:13, outline:'none',
    background:'#fff', boxSizing:'border-box',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px 0', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
          <Avatar name={contact.name} size={56} />
          <div style={{ flex:1, minWidth:0 }}>
            {editing ? (
              <input style={{ ...inputStyle, fontSize:16, fontWeight:700, marginBottom:6 }}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            ) : (
              <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {contact.name}
              </h2>
            )}
            {editing ? (
              <input style={{ ...inputStyle, marginBottom:6 }}
                placeholder="Job title" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
            ) : (
              <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 6px' }}>
                {contact.job_title}{contact.company ? ` · ${contact.company}` : ''}
              </p>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ position:'relative' }}>
                <button
                  onClick={() => setStatusOpen(o => !o)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4 }}
                >
                  <StatusBadge status={form.status} />
                  <ChevronDown size={13} color="#6b7280" />
                </button>
                {statusOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'#fff', borderRadius:10, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', border:'1px solid #e5e7eb', zIndex:50, minWidth:140, overflow:'hidden' }}>
                    {(Object.keys(STATUS_META) as ContactStatus[]).map(s => (
                      <button key={s} onClick={() => { setForm(f => ({ ...f, status: s })); onUpdate(contact.id, { status: s }); setStatusOpen(false); }}
                        style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', background: s === form.status ? '#f5f3ff' : '#fff', border:'none', cursor:'pointer', fontSize:13 }}>
                        <StatusBadge status={s} sm />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize:12, color:'#9ca3af' }}>via {contact.source}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {editing ? (
              <>
                <button onClick={saveEdit} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                <button onClick={() => { setForm({ ...contact }); setEditing(false); }} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} style={{ padding:'7px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', gap:5, alignItems:'center', fontSize:13, fontWeight:500, color:'#374151' }}>
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={onClose} style={{ padding:8, borderRadius:8, background:'#f3f4f6', border:'none', cursor:'pointer' }}>
                  <X size={14} color="#6b7280" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0 }}>
          {(['overview','conversations','notes','activity'] as DetailTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'9px 16px', background:'none', border:'none', cursor:'pointer',
              fontSize:13, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? '#7c3aed' : '#6b7280',
              borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
              textTransform:'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Contact info */}
            <section>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 12px' }}>Contact Info</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { icon:<Mail size={15} color="#7c3aed" />, label:'Email', val: form.email, key:'email', type:'email' },
                  { icon:<Phone size={15} color="#7c3aed" />, label:'Phone', val: form.phone, key:'phone', type:'tel' },
                  { icon:<Building2 size={15} color="#7c3aed" />, label:'Company', val: form.company, key:'company', type:'text' },
                ].map(({ icon, label, val, key, type }) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:28, display:'flex', justifyContent:'center' }}>{icon}</span>
                    <span style={{ fontSize:12, color:'#9ca3af', width:55 }}>{label}</span>
                    {editing ? (
                      <input style={{ ...inputStyle, flex:1 }} type={type} value={form[key as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                        <span style={{ fontSize:14, color:'#111827' }}>{val || '—'}</span>
                        {val && <CopyButton text={val} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Tags */}
            <section>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>Tags</h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                {form.tags.map(t => <TagPill key={t} tag={t} onRemove={() => removeTag(t)} />)}
                <input
                  value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                  placeholder="Add tag…"
                  style={{ fontSize:12, border:'1.5px dashed #d8b4fe', borderRadius:999, padding:'3px 10px', outline:'none', background:'transparent', color:'#7c3aed', width:90 }}
                />
              </div>
            </section>

            {/* Social profiles */}
            {(form.linkedin || form.instagram || form.twitter || editing) && (
              <section>
                <h4 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>Social Profiles</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { key:'linkedin',  label:'LinkedIn',  url: form.linkedin ? `https://linkedin.com/in/${form.linkedin}` : '', color:'#0077b5' },
                    { key:'instagram', label:'Instagram', url: form.instagram ? `https://instagram.com/${form.instagram.replace('@','')}` : '', color:'#e1306c' },
                    { key:'twitter',   label:'Twitter/X', url: form.twitter ? `https://twitter.com/${form.twitter.replace('@','')}` : '', color:'#000' },
                  ].map(({ key, label, url, color }) => (
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:'#9ca3af', width:75 }}>{label}</span>
                      {editing ? (
                        <input style={{ ...inputStyle, flex:1 }} placeholder={`@username`}
                          value={form[key as keyof typeof form] as string}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                      ) : (
                        url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:13, color, display:'flex', alignItems:'center', gap:5, textDecoration:'none' }}>
                            {form[key as keyof typeof form] as string} <ExternalLink size={11} />
                          </a>
                        ) : <span style={{ fontSize:13, color:'#d1d5db' }}>Not set</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notes preview */}
            {contact.notes && (
              <section>
                <h4 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Notes Preview</h4>
                <p style={{ fontSize:13, color:'#374151', background:'#f9fafb', padding:'10px 14px', borderRadius:8, margin:0, lineHeight:1.6 }}>
                  {contact.notes.slice(0,120)}{contact.notes.length > 120 ? '…' : ''}
                </p>
              </section>
            )}

            {/* Add to conversation */}
            <button style={{
              padding:'10px 16px', borderRadius:10, border:'1.5px solid #7c3aed',
              background:'#7c3aed', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              <MessageSquare size={16} /> Add to Conversation
            </button>
          </div>
        )}

        {/* ── Conversations ── */}
        {tab === 'conversations' && (
          <div>
            {conversations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <MessageSquare size={36} color="#d1d5db" style={{ margin:'0 auto 12px' }} />
                <p style={{ color:'#9ca3af', fontSize:14 }}>No conversations yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {conversations.map((c, i) => (
                  <div key={i} style={{ padding:'14px 16px', borderRadius:10, border:'1px solid #f3f4f6', background:'#fff', cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#e9d5ff')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#f3f4f6')}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <PlatformDot platform={c.platform} />
                      <span style={{ fontSize:12, color:'#9ca3af' }}>{timeAgo(c.date)}</span>
                    </div>
                    <p style={{ fontSize:13, color:'#374151', margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {c.last_msg}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div>
            <div style={{ marginBottom:20 }}>
              <textarea
                value={noteInput} onChange={e => setNoteInput(e.target.value)}
                placeholder="Write a note about this contact…"
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', resize:'vertical', minHeight:100, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              />
              <button onClick={saveNote} disabled={!noteInput.trim()} style={{
                marginTop:8, padding:'8px 18px', borderRadius:8, border:'none',
                background: noteInput.trim() ? '#7c3aed' : '#e5e7eb',
                color: noteInput.trim() ? '#fff' : '#9ca3af',
                fontSize:13, fontWeight:600, cursor: noteInput.trim() ? 'pointer' : 'default',
              }}>
                Save Note
              </button>
            </div>
            {notes.length === 0 && !contact.notes ? (
              <div style={{ textAlign:'center', padding:'24px' }}>
                <FileText size={32} color="#d1d5db" style={{ margin:'0 auto 10px' }} />
                <p style={{ color:'#9ca3af', fontSize:14 }}>No notes yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding:'12px 14px', borderRadius:10, background:'#f9fafb', borderLeft:'3px solid #7c3aed' }}>
                    <p style={{ fontSize:13, color:'#374151', margin:'0 0 6px', lineHeight:1.6 }}>{n.text}</p>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>{fmtDate(n.created_at)}</span>
                  </div>
                ))}
                {contact.notes && (
                  <div style={{ padding:'12px 14px', borderRadius:10, background:'#f9fafb', borderLeft:'3px solid #d8b4fe' }}>
                    <p style={{ fontSize:13, color:'#374151', margin:'0 0 6px', lineHeight:1.6 }}>{contact.notes}</p>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>Original note · {fmtDate(contact.created_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Activity ── */}
        {tab === 'activity' && (
          <div style={{ position:'relative', paddingLeft:20 }}>
            <div style={{ position:'absolute', left:7, top:0, bottom:0, width:2, background:'#f3f4f6' }} />
            {activityItems.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:14, marginBottom:20, position:'relative' }}>
                <div style={{ position:'absolute', left:-20, top:2, width:16, height:16, borderRadius:'50%', background:'#fff', border:'2px solid #e9d5ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize:13, color:'#374151', margin:'0 0 3px' }}>{item.text}</p>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{fmtDate(item.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding:'12px 24px', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'flex-end' }}>
        <button
          onClick={() => onDelete(contact.id)}
          style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #fee2e2', background:'#fff', color:'#dc2626', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
        >
          <Trash2 size={14} /> Delete Contact
        </button>
      </div>
    </div>
  );
}

// ── Kanban View ───────────────────────────────────────────────────────────────

interface KanbanViewProps {
  contacts: Contact[];
  onSelect: (c: Contact) => void;
  selected: Contact | null;
}

function KanbanView({ contacts, onSelect, selected }: KanbanViewProps) {
  const columns = (Object.keys(STATUS_META) as ContactStatus[]).map(status => ({
    status,
    contacts: contacts.filter(c => c.status === status),
  }));

  return (
    <div style={{ display:'flex', gap:16, padding:'0 20px 20px', overflowX:'auto', flex:1 }}>
      {columns.map(({ status, contacts: col }) => {
        const meta = STATUS_META[status];
        return (
          <div key={status} style={{ minWidth:260, flex:'0 0 260px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background: meta.color, display:'inline-block' }} />
              <span style={{ fontSize:13, fontWeight:700, color:'#374151', textTransform:'capitalize' }}>{meta.label}</span>
              <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto', background:'#f3f4f6', borderRadius:999, padding:'1px 8px' }}>{col.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:100 }}>
              {col.map(c => (
                <div
                  key={c.id} onClick={() => onSelect(c)}
                  style={{
                    background:'#fff', borderRadius:12, padding:'14px 16px', cursor:'pointer',
                    border: selected?.id === c.id ? `2px solid ${meta.color}` : '1.5px solid #e5e7eb',
                    boxShadow: selected?.id === c.id ? `0 0 0 3px ${meta.bg}` : '0 1px 4px rgba(0,0,0,0.06)',
                    transition:'box-shadow 0.15s',
                  }}
                >
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                    <Avatar name={c.name} size={32} />
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{c.name}</p>
                      <p style={{ fontSize:12, color:'#6b7280', margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{c.company || c.email}</p>
                    </div>
                  </div>
                  {c.tags.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {c.tags.slice(0,2).map(t => <TagPill key={t} tag={t} />)}
                      {c.tags.length > 2 && <span style={{ fontSize:11, color:'#9ca3af', alignSelf:'center' }}>+{c.tags.length-2}</span>}
                    </div>
                  )}
                  <div style={{ marginTop:8, fontSize:11, color:'#9ca3af' }}>{timeAgo(c.last_activity_at)}</div>
                </div>
              ))}
              {col.length === 0 && (
                <div style={{ border:'2px dashed #f3f4f6', borderRadius:12, padding:'24px 16px', textAlign:'center' }}>
                  <p style={{ fontSize:12, color:'#d1d5db', margin:0 }}>No {meta.label.toLowerCase()}s</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, status: filter, sort });
      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      setContacts(json.contacts?.length ? json.contacts : DEMO_CONTACTS);
    } catch {
      setContacts(DEMO_CONTACTS);
    } finally {
      setLoading(false);
    }
  }, [search, filter, sort]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    }
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (sort === 'name') list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    else if (sort === 'company') list = [...list].sort((a,b) => a.company.localeCompare(b.company));
    else list = [...list].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [contacts, search, filter, sort]);

  const counts = useMemo(() => ({
    all: contacts.length,
    lead: contacts.filter(c => c.status === 'lead').length,
    prospect: contacts.filter(c => c.status === 'prospect').length,
    customer: contacts.filter(c => c.status === 'customer').length,
    churned: contacts.filter(c => c.status === 'churned').length,
  }), [contacts]);

  function handleAdd(c: Contact) {
    setContacts(prev => [c, ...prev]);
    setSelected(c);
  }

  function handleImport(imported: Contact[]) {
    setContacts(prev => [...imported, ...prev]);
  }

  function handleUpdate(id: string, updates: Partial<Contact>) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setSelected(prev => prev?.id === id ? { ...prev, ...updates } as Contact : prev);
    fetch('/api/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  }

  function handleDeleteClick(id: string) {
    const c = contacts.find(x => x.id === id);
    if (c) setDeleteTarget(c);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/contacts?id=${deleteTarget.id}`, { method: 'DELETE' });
    } catch {}
    setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
  }

  function exportCSV() {
    const cols = ['name','email','phone','company','job_title','status','source','tags','notes','linkedin','instagram','twitter','created_at'];
    const header = cols.join(',');
    const rows = contacts.map(c =>
      cols.map(k => {
        const val = k === 'tags' ? (c.tags ?? []).join(';') : String((c as unknown as Record<string,string>)[k] ?? '');
        return `"${val.replace(/"/g,'""')}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const SORT_LABELS: Record<SortOption, string> = { newest:'Newest', name:'Name A–Z', company:'Company' };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key:'all',      label:'All'       },
    { key:'lead',     label:'Leads'     },
    { key:'prospect', label:'Prospects' },
    { key:'customer', label:'Customers' },
    { key:'churned',  label:'Churned'   },
  ];

  return (
    <div style={{ display:'flex', height:'calc(100vh - 104px)', background:'#f4f5ff', gap:0, overflow:'hidden' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: selected ? 380 : 420, flexShrink:0,
        background:'#fff', borderRight:'1px solid #e5e7eb',
        display:'flex', flexDirection:'column', overflow:'hidden',
        transition:'width 0.2s ease',
      }}>
        {/* Toolbar */}
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <h1 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0, flex:1 }}>CRM</h1>
            <button onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')}
              title={viewMode === 'list' ? 'Kanban view' : 'List view'}
              style={{ padding:7, borderRadius:8, border:'1.5px solid #e5e7eb', background: viewMode === 'kanban' ? '#f5f3ff' : '#fff', cursor:'pointer', display:'flex' }}>
              {viewMode === 'list' ? <LayoutGrid size={16} color="#7c3aed" /> : <List size={16} color="#7c3aed" />}
            </button>
            <button onClick={exportCSV} title="Export CSV"
              style={{ padding:7, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex' }}>
              <Download size={16} color="#6b7280" />
            </button>
            <button onClick={() => setShowImport(true)} title="Import CSV"
              style={{ padding:7, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex' }}>
              <Upload size={16} color="#6b7280" />
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ padding:'7px 12px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Search */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <Search size={15} color="#9ca3af" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts…"
              style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', background:'#f9fafb', boxSizing:'border-box' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex' }}>
                <X size={13} color="#9ca3af" />
              </button>
            )}
          </div>

          {/* Filter pills + sort */}
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:2, overflowX:'auto' }}>
            <div style={{ display:'flex', gap:4, flex:1 }}>
              {filterTabs.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding:'5px 10px', borderRadius:999, fontSize:12, fontWeight: filter === key ? 700 : 500,
                  background: filter === key ? '#7c3aed' : 'transparent',
                  color: filter === key ? '#fff' : '#6b7280',
                  border:'none', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                }}>
                  {label}
                  <span style={{ marginLeft:4, opacity:0.75, fontSize:11 }}>
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>
            <div ref={sortRef} style={{ position:'relative', marginLeft:4 }}>
              <button onClick={() => setSortOpen(o => !o)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, color:'#6b7280', cursor:'pointer', whiteSpace:'nowrap' }}>
                <Filter size={11} /> {SORT_LABELS[sort]} <ChevronDown size={11} />
              </button>
              {sortOpen && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'#fff', borderRadius:10, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', border:'1px solid #e5e7eb', zIndex:50, minWidth:130, overflow:'hidden' }}>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
                    <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', fontSize:13, color: sort === s ? '#7c3aed' : '#374151', fontWeight: sort === s ? 700 : 400, background: sort === s ? '#f5f3ff' : '#fff', border:'none', cursor:'pointer' }}>
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact list */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 8px 12px' }}>
          {loading ? (
            Array.from({ length:5 }).map((_, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'12px', margin:'2px 0', borderRadius:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#f3f4f6' }} />
                <div style={{ flex:1 }}>
                  <div style={{ height:13, background:'#f3f4f6', borderRadius:4, marginBottom:6, width:'60%' }} />
                  <div style={{ height:11, background:'#f3f4f6', borderRadius:4, width:'40%' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <UserPlus size={36} color="#d1d5db" style={{ margin:'0 auto 12px' }} />
              <p style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:4 }}>No contacts found</p>
              <p style={{ fontSize:13, color:'#9ca3af' }}>Try adjusting your filters or add a new contact</p>
            </div>
          ) : (
            filtered.map(c => {
              const isActive = selected?.id === c.id;
              return (
                <div
                  key={c.id} onClick={() => setSelected(isActive ? null : c)}
                  style={{
                    display:'flex', gap:10, padding:'11px 12px', borderRadius:10,
                    cursor:'pointer', margin:'1px 0',
                    background: isActive ? '#faf5ff' : '#fff',
                    borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                    transition:'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff'; }}
                >
                  <Avatar name={c.name} size={36} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#111827', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', flex:1 }}>{c.name}</span>
                      <StatusBadge status={c.status} sm />
                    </div>
                    <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 3px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {c.company || c.email}
                    </p>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>{timeAgo(c.last_activity_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats footer */}
        <div style={{ padding:'10px 16px', borderTop:'1px solid #f3f4f6', display:'flex', gap:16 }}>
          {[
            { label:'Total', val: counts.all, color:'#374151' },
            { label:'Customers', val: counts.customer, color:'#059669' },
            { label:'Leads', val: counts.lead, color:'#7c3aed' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color }}>{val}</div>
              <div style={{ fontSize:11, color:'#9ca3af' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {viewMode === 'kanban' ? (
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Kanban Board</h2>
            </div>
            <div style={{ flex:1, overflow:'auto', display:'flex', alignItems:'flex-start' }}>
              <KanbanView contacts={filtered} onSelect={setSelected} selected={selected} />
            </div>
          </div>
        ) : selected ? (
          <DetailPanel
            contact={selected}
            onUpdate={handleUpdate}
            onDelete={handleDeleteClick}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Globe size={32} color="#7c3aed" />
            </div>
            <div style={{ textAlign:'center' }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>Select a contact</h3>
              <p style={{ fontSize:14, color:'#6b7280', margin:'0 0 20px' }}>Click any contact from the list to view details</p>
              <button onClick={() => setShowAdd(true)} style={{
                padding:'10px 22px', borderRadius:10, border:'none', background:'#7c3aed', color:'#fff',
                fontSize:14, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
              }}>
                <Plus size={16} /> Add Contact
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd    && <AddContactModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {showImport && <ImportCSVModal onClose={() => setShowImport(false)} onImport={handleImport} />}
      {deleteTarget && (
        <DeleteConfirmModal
          contact={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
