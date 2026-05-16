'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, Download, MoreVertical, Lock, Unlock,
  Shield, ShieldOff, UserX, ChevronDown, Eye, Pencil,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  plan: string;
  is_admin: boolean;
  is_locked: boolean;
  lock_reason: string | null;
  last_active_at: string | null;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: '#64748b', bg: '#1e293b' },
  pro:        { label: 'Pro',        color: '#a78bfa', bg: 'rgba(139,92,246,0.15)' },
  enterprise: { label: 'Enterprise', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
};
const AVATAR_COLORS = ['#7c3aed','#0369a1','#059669','#d97706','#dc2626','#0891b2'];

const DEMO_USERS: AdminUser[] = [
  { user_id:'u1', email:'muhammadubs@gmail.com', full_name:'Muhammad', plan:'enterprise', is_admin:true,  is_locked:false, lock_reason:null, last_active_at:new Date().toISOString(), created_at:'2024-01-01T00:00:00Z' },
  { user_id:'u2', email:'john.doe@example.com',  full_name:'John Doe',     plan:'pro',        is_admin:false, is_locked:false, lock_reason:null, last_active_at:new Date(Date.now()-3600000).toISOString(),  created_at:'2024-05-19T10:00:00Z' },
  { user_id:'u3', email:'sarah.wilson@example.com',full_name:'Sarah Wilson',plan:'free',    is_admin:false, is_locked:false, lock_reason:null, last_active_at:new Date(Date.now()-7200000).toISOString(),  created_at:'2024-05-19T09:00:00Z' },
  { user_id:'u4', email:'mike.brown@example.com', full_name:'Mike Brown',  plan:'enterprise', is_admin:false, is_locked:false, lock_reason:null, last_active_at:new Date(Date.now()-86400000).toISOString(), created_at:'2024-05-18T14:00:00Z' },
  { user_id:'u5', email:'emily.johnson@example.com',full_name:'Emily Johnson',plan:'pro',    is_admin:false, is_locked:true,  lock_reason:'Spam', last_active_at:new Date(Date.now()-86400000).toISOString(),created_at:'2024-05-18T11:00:00Z' },
  { user_id:'u6', email:'david.lee@example.com',  full_name:'David Lee',   plan:'free',       is_admin:false, is_locked:false, lock_reason:null, last_active_at:new Date(Date.now()-172800000).toISOString(),created_at:'2024-05-17T09:00:00Z' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return email.slice(0,2).toUpperCase();
}
function avatarColor(s: string) { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))&0xffffffff; return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; }
function dateStr(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function timeAgo(iso: string|null) {
  if (!iso) return 'Never';
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if (m<1) return 'Just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// ── Lock Modal ────────────────────────────────────────────────────────────────

function LockModal({ user, onConfirm, onClose }: { user: AdminUser; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#12131e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,width:420,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
        <h3 style={{ fontWeight:700,fontSize:16,color:'#f1f5f9',margin:'0 0 8px' }}>Lock Account</h3>
        <p style={{ fontSize:13,color:'#64748b',margin:'0 0 20px' }}>Locking <strong style={{ color:'#e2e8f0' }}>{user.email}</strong> will prevent them from logging in.</p>
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason (e.g. spam activity, abuse report)..." autoFocus style={{ width:'100%',boxSizing:'border-box',padding:'10px 14px',background:'#0d0e1a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#e2e8f0',fontSize:13,outline:'none',marginBottom:20 }} />
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px 0',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#64748b',fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{ if(reason.trim()) onConfirm(reason); }} disabled={!reason.trim()} style={{ flex:1,padding:'10px 0',background:reason.trim()?'#ef4444':'#1e293b',color:reason.trim()?'#fff':'#334155',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:reason.trim()?'pointer':'default' }}>Lock Account</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ user, onConfirm, onClose }: { user: AdminUser; onConfirm: () => void; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#12131e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,width:440,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
        <h3 style={{ fontWeight:700,fontSize:16,color:'#ef4444',margin:'0 0 8px' }}>Delete Account</h3>
        <p style={{ fontSize:13,color:'#64748b',margin:'0 0 8px' }}>This will permanently delete <strong style={{ color:'#e2e8f0' }}>{user.email}</strong> and all their data. This cannot be undone.</p>
        <p style={{ fontSize:13,color:'#64748b',margin:'0 0 16px' }}>Type <strong style={{ color:'#e2e8f0' }}>DELETE</strong> to confirm:</p>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="DELETE" autoFocus style={{ width:'100%',boxSizing:'border-box',padding:'10px 14px',background:'#0d0e1a',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#e2e8f0',fontSize:13,outline:'none',marginBottom:20,fontFamily:'monospace',letterSpacing:'0.1em' }} />
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px 0',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#64748b',fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{ if(text==='DELETE') onConfirm(); }} disabled={text!=='DELETE'} style={{ flex:1,padding:'10px 0',background:text==='DELETE'?'#ef4444':'#1e293b',color:text==='DELETE'?'#fff':'#334155',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:text==='DELETE'?'pointer':'default' }}>Permanently Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Actions dropdown ──────────────────────────────────────────────────────────

function ActionsMenu({ user, onAction }: { user: AdminUser; onAction: (action: string, user: AdminUser, val?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setPlanOpen(false); } }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const menuItem = (label: string, act: string, color = '#e2e8f0', val?: string) => (
    <button key={label} onClick={() => { onAction(act, user, val); setOpen(false); setPlanOpen(false); }}
      style={{ display:'flex',alignItems:'center',width:'100%',padding:'9px 14px',background:'none',border:'none',cursor:'pointer',fontSize:13,color,textAlign:'left' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.04)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='none';}}
    >{label}</button>
  );

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'none',border:'none',cursor:'pointer',color:'#64748b',padding:4,borderRadius:4,display:'flex' }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position:'absolute',right:0,top:24,background:'#12131e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:50,minWidth:180,overflow:'hidden' }}>
          <Link href={`/admin/users/${user.user_id}`} style={{ textDecoration:'none',display:'block' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'9px 14px',fontSize:13,color:'#e2e8f0',cursor:'pointer' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.04)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='none';}}
            ><Eye size={13}/> View Details</div>
          </Link>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',position:'relative' }}
            onMouseEnter={()=>setPlanOpen(true)} onMouseLeave={()=>setPlanOpen(false)}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',fontSize:13,color:'#e2e8f0',cursor:'pointer',background:planOpen?'rgba(255,255,255,0.04)':'none' }}>
              <span style={{ display:'flex',alignItems:'center',gap:8 }}><Pencil size={13}/> Change Plan</span>
              <ChevronDown size={12} style={{ transform:planOpen?'rotate(-90deg)':'rotate(0)',transition:'transform 0.15s' }} />
            </div>
            {planOpen && (
              <div style={{ position:'absolute',right:'100%',top:0,background:'#12131e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.4)',width:140,overflow:'hidden' }}>
                {menuItem('→ Free',       'change_plan','#64748b','free')}
                {menuItem('→ Pro',        'change_plan','#a78bfa','pro')}
                {menuItem('→ Enterprise', 'change_plan','#fbbf24','enterprise')}
              </div>
            )}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {user.is_locked
              ? menuItem('Unlock Account', 'unlock', '#22c55e')
              : menuItem('Lock Account',   'lock',   '#f59e0b')
            }
            {!user.is_admin
              ? menuItem('Make Admin', 'make_admin', '#a78bfa')
              : menuItem('Remove Admin', 'remove_admin', '#64748b')
            }
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {menuItem('Delete Account', 'delete', '#ef4444')}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [lockTarget, setLockTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ search, plan, status, sort, limit: '100' });
      const res = await fetch(`/api/admin/users?${p}`);
      const json = await res.json();
      const list = json.users?.length ? json.users : DEMO_USERS;
      setUsers(list);
      setTotal(list.length);
    } catch {
      setUsers(DEMO_USERS);
      setTotal(DEMO_USERS.length);
    } finally { setLoading(false); }
  }, [search, plan, status, sort]);

  useEffect(() => { load(); }, [plan, status, sort]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  async function handleAction(action: string, user: AdminUser, val?: string) {
    if (action === 'lock')   { setLockTarget(user); return; }
    if (action === 'delete') { setDeleteTarget(user); return; }

    setActionLoading(true);
    const body: Record<string, unknown> = { id: user.user_id, action };
    if (action === 'change_plan')  body.value = val;
    if (action === 'make_admin')   body.action = 'set_admin'; body.value = 'true';
    if (action === 'remove_admin') { body.action = 'set_admin'; body.value = 'false'; }
    if (action === 'unlock')       body.action = 'unlock';

    try {
      const res = await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.user) setUsers(prev => prev.map(u => u.user_id === user.user_id ? json.user : u));
      else {
        setUsers(prev => prev.map(u => {
          if (u.user_id !== user.user_id) return u;
          if (action === 'change_plan')  return {...u, plan: val ?? u.plan};
          if (action === 'make_admin')   return {...u, is_admin: true};
          if (action === 'remove_admin') return {...u, is_admin: false};
          if (action === 'unlock')       return {...u, is_locked: false, lock_reason: null};
          return u;
        }));
      }
    } catch {}
    setActionLoading(false);
  }

  async function confirmLock(reason: string) {
    if (!lockTarget) return;
    await handleAction('_do_lock', lockTarget, reason);
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: lockTarget.user_id, action:'lock', reason }) });
      const json = await res.json();
      if (json.user) setUsers(prev => prev.map(u => u.user_id === lockTarget.user_id ? json.user : u));
      else setUsers(prev => prev.map(u => u.user_id === lockTarget.user_id ? {...u, is_locked:true, lock_reason: reason} : u));
    } catch {}
    setActionLoading(false);
    setLockTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${deleteTarget.user_id}`, { method:'DELETE' });
      setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
      setTotal(t => t - 1);
    } catch {}
    setActionLoading(false);
    setDeleteTarget(null);
  }

  function exportCSV() {
    const rows = [['Email','Name','Plan','Status','Joined','Last Active']].concat(
      users.map(u => [u.email, u.full_name||'', u.plan, u.is_locked?'Locked':'Active', dateStr(u.created_at), timeAgo(u.last_active_at)])
    );
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='users.csv'; a.click();
  }

  return (
    <div style={{ padding: '28px 28px' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h1 style={{ fontWeight:800,fontSize:22,color:'#f1f5f9',margin:0 }}>Users</h1>
          <p style={{ fontSize:13,color:'#334155',margin:'4px 0 0' }}>{total.toLocaleString()} total users</p>
        </div>
        <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 16px',background:'#12131e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:13,color:'#94a3b8',cursor:'pointer' }}>
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
        <div style={{ position:'relative',flex:1,minWidth:220 }}>
          <Search size={14} color="#334155" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..."
            style={{ width:'100%',boxSizing:'border-box',padding:'9px 12px 9px 34px',background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,color:'#e2e8f0',fontSize:13,outline:'none' }} />
        </div>
        {[
          { val: plan, set: setPlan, opts: [{v:'all',l:'All Plans'},{v:'free',l:'Free'},{v:'pro',l:'Pro'},{v:'enterprise',l:'Enterprise'}] },
          { val: status, set: setStatus, opts: [{v:'all',l:'All Status'},{v:'locked',l:'Locked'},{v:'admin',l:'Admin'}] },
          { val: sort, set: setSort, opts: [{v:'newest',l:'Newest'},{v:'oldest',l:'Oldest'},{v:'name',l:'Name'}] },
        ].map((f, i) => (
          <div key={i} style={{ position:'relative' }}>
            <select value={f.val} onChange={e=>f.set(e.target.value)}
              style={{ appearance:'none',padding:'9px 30px 9px 12px',background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,color:'#94a3b8',fontSize:13,cursor:'pointer',outline:'none' }}>
              {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <ChevronDown size={12} color="#334155" style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} />
          </div>
        ))}
        <button onClick={load} style={{ padding:'9px 12px',background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',color:'#64748b' }}>
          <RefreshCw size={14} style={loading?{animation:'spin 1s linear infinite'}:{}} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {['User','Plan','Status','Joined','Last Active','Actions'].map(h=>(
                <th key={h} style={{ padding:'14px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:40,textAlign:'center',color:'#334155' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:40,textAlign:'center',color:'#334155' }}>No users found</td></tr>
            ) : users.map(user => {
              const pm = PLAN_META[user.plan] ?? PLAN_META.free;
              return (
                <tr key={user.user_id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)',opacity:actionLoading?0.7:1 }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLTableRowElement).style.background='rgba(255,255,255,0.02)';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background='none';}}>
                  {/* User cell */}
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:36,height:36,borderRadius:'50%',background:user.is_locked?'#1e1b1b':avatarColor(user.email),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:user.is_locked?'#ef4444':'#fff',flexShrink:0 }}>
                        {user.is_locked?<Lock size={14}/>:initials(user.full_name,user.email)}
                      </div>
                      <div>
                        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                          <Link href={`/admin/users/${user.user_id}`} style={{ fontWeight:600,color:'#e2e8f0',textDecoration:'none',fontSize:13 }}>{user.full_name || user.email}</Link>
                          {user.is_admin && <Shield size={12} color="#a78bfa"/>}
                        </div>
                        <div style={{ fontSize:11,color:'#334155' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Plan */}
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,background:pm.bg,color:pm.color }}>{pm.label}</span>
                  </td>
                  {/* Status */}
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,
                      background:user.is_locked?'rgba(239,68,68,0.12)':'rgba(34,197,94,0.1)',
                      color:user.is_locked?'#ef4444':'#22c55e' }}>
                      {user.is_locked?'Locked':'Active'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px',color:'#64748b',fontSize:12 }}>{dateStr(user.created_at)}</td>
                  <td style={{ padding:'12px 16px',color:'#64748b',fontSize:12 }}>{timeAgo(user.last_active_at)}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <ActionsMenu user={user} onAction={handleAction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lockTarget   && <LockModal   user={lockTarget}   onConfirm={confirmLock}   onClose={()=>setLockTarget(null)} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onConfirm={confirmDelete} onClose={()=>setDeleteTarget(null)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
