'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, ShieldOff, Lock, Unlock, RefreshCw, Check, X,
  Calendar, Clock, Activity, Flag, History, User,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  user_id: string; email: string; full_name: string | null; plan: string;
  is_admin: boolean; is_locked: boolean; lock_reason: string | null;
  admin_notes: string | null; last_active_at: string | null; created_at: string;
}
interface Post      { id: string; created_at: string; status: string; platform: string; }
interface Campaign  { id: string; name: string; created_at: string; status: string; }
interface AdminLog  { id: string; admin_email: string; action: string; details: object; created_at: string; }
interface Override  { id: string; feature_key: string; is_enabled: boolean; reason: string | null; }

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: '#64748b', bg: '#1e293b' },
  pro:        { label: 'Pro',        color: '#a78bfa', bg: 'rgba(139,92,246,0.15)' },
  enterprise: { label: 'Enterprise', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
};

const ALL_FLAGS = ['social_planner','ai_insights','automation','crm_contacts','analytics_advanced','conversations','api_access','white_label'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string|null) {
  if (!iso) return 'Never';
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if (m<1) return 'Just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({ label, value, editable, onChange }: { label: string; value: string; editable?: boolean; onChange?: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:'block',fontSize:11,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>{label}</label>
      {editing && editable && onChange ? (
        <div style={{ display:'flex',gap:8 }}>
          <input value={val} onChange={e=>setVal(e.target.value)} autoFocus style={{ flex:1,padding:'8px 12px',background:'#0d0e1a',border:'1px solid rgba(139,92,246,0.4)',borderRadius:7,color:'#e2e8f0',fontSize:13,outline:'none' }} />
          <button onClick={()=>{onChange(val);setEditing(false);}} style={{ padding:'8px 12px',background:'#8b5cf6',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center' }}><Check size={13}/></button>
          <button onClick={()=>{setVal(value);setEditing(false);}} style={{ padding:'8px 12px',background:'#1e293b',border:'none',borderRadius:7,cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}><X size={13}/></button>
        </div>
      ) : (
        <div onClick={()=>editable&&setEditing(true)} style={{ padding:'9px 12px',background:'#0d0e1a',border:'1px solid rgba(255,255,255,0.06)',borderRadius:7,color:value?'#e2e8f0':'#334155',fontSize:13,cursor:editable?'text':'default',minHeight:38 }}>
          {value || <span style={{ fontStyle:'italic',color:'#334155' }}>Not set</span>}
          {editable && <span style={{ float:'right',fontSize:11,color:'#334155' }}>click to edit</span>}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [tab, setTab] = useState<'profile'|'subscription'|'features'|'activity'|'history'>('profile');
  const [profile, setProfile] = useState<Profile|null>(null);
  const [activity, setActivity] = useState<{ posts: Post[]; campaigns: Campaign[] }>({ posts:[], campaigns:[] });
  const [adminHistory, setAdminHistory] = useState<AdminLog[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showLockInput, setShowLockInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (json.profile) {
        setProfile(json.profile);
        setNotes(json.profile.admin_notes ?? '');
        setActivity(json.activity ?? { posts:[], campaigns:[] });
        setAdminHistory(json.adminHistory ?? []);
        setOverrides(json.featureOverrides ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [userId]);

  async function patchProfile(updates: Partial<Profile>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updates) });
      const json = await res.json();
      if (json.profile) setProfile(json.profile);
      else setProfile(p => p ? {...p, ...updates} : p);
    } catch {}
    setSaving(false);
  }

  async function doLock() {
    if (!lockReason.trim()) return;
    await patchProfile({ is_locked: true, lock_reason: lockReason });
    setShowLockInput(false);
    setLockReason('');
  }

  async function doUnlock() { await patchProfile({ is_locked: false, lock_reason: null }); }

  async function saveNotes() {
    await patchProfile({ admin_notes: notes });
    setEditingNotes(false);
  }

  async function toggleOverride(key: string, current: Override|undefined) {
    if (current) {
      await fetch(`/api/admin/feature-flags/${key}/overrides`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user_id:userId}) });
      setOverrides(prev => prev.filter(o => o.feature_key !== key));
    } else {
      const res = await fetch(`/api/admin/feature-flags/${key}/overrides`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user_id:userId, is_enabled:true, reason:'Admin override'}) });
      const json = await res.json();
      if (json.override) setOverrides(prev => [...prev, json.override]);
    }
  }

  const TABS = [
    { id:'profile',      label:'Profile',      icon:User },
    { id:'subscription', label:'Subscription', icon:Calendar },
    { id:'features',     label:'Feature Access',icon:Flag },
    { id:'activity',     label:'Activity',     icon:Activity },
    { id:'history',      label:'Admin History',icon:History },
  ] as const;

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#334155' }}>
      <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{ padding:40,textAlign:'center' }}>
      <p style={{ color:'#64748b',fontSize:14,marginBottom:16 }}>User not found.</p>
      <Link href="/admin/users" style={{ color:'#8b5cf6',textDecoration:'none',fontSize:13 }}>← Back to users</Link>
    </div>
  );

  const pm = PLAN_META[profile.plan] ?? PLAN_META.free;

  return (
    <div style={{ padding:'28px 28px', maxWidth:900 }}>
      {/* Back */}
      <Link href="/admin/users" style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:'#334155',textDecoration:'none',marginBottom:20 }}>
        <ArrowLeft size={14}/> All Users
      </Link>

      {/* User header */}
      <div style={{ background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'24px 28px',marginBottom:20 }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:18,marginBottom:20 }}>
          <div style={{ width:56,height:56,borderRadius:'50%',background:profile.is_locked?'rgba(239,68,68,0.15)':'rgba(139,92,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:profile.is_locked?'#ef4444':'#a78bfa',flexShrink:0 }}>
            {profile.full_name?.slice(0,2)?.toUpperCase() ?? profile.email.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
              <h2 style={{ fontWeight:800,fontSize:20,color:'#f1f5f9',margin:0 }}>{profile.full_name || profile.email}</h2>
              <span style={{ fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,background:pm.bg,color:pm.color }}>{pm.label}</span>
              {profile.is_admin  && <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(139,92,246,0.12)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.2)' }}>ADMIN</span>}
              {profile.is_locked && <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(239,68,68,0.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)' }}>LOCKED</span>}
            </div>
            <div style={{ fontSize:13,color:'#64748b',marginBottom:8 }}>{profile.email}</div>
            <div style={{ display:'flex',gap:20,fontSize:12,color:'#334155' }}>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><Calendar size={11}/> Joined {timeAgo(profile.created_at)}</span>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><Clock size={11}/> Active {timeAgo(profile.last_active_at)}</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
          {profile.is_locked ? (
            <button onClick={doUnlock} disabled={saving} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,color:'#22c55e',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              <Unlock size={13}/> Unlock Account
            </button>
          ) : (
            !showLockInput ? (
              <button onClick={()=>setShowLockInput(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#ef4444',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                <Lock size={13}/> Lock Account
              </button>
            ) : (
              <div style={{ display:'flex',gap:8,alignItems:'center',flex:'0 0 100%' }}>
                <input value={lockReason} onChange={e=>setLockReason(e.target.value)} placeholder="Lock reason..." autoFocus style={{ flex:1,padding:'8px 12px',background:'#0d0e1a',border:'1px solid rgba(239,68,68,0.3)',borderRadius:7,color:'#e2e8f0',fontSize:13,outline:'none' }} />
                <button onClick={doLock} style={{ padding:'8px 12px',background:'#ef4444',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center' }}><Check size={13}/></button>
                <button onClick={()=>setShowLockInput(false)} style={{ padding:'8px 12px',background:'#1e293b',border:'none',borderRadius:7,cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}><X size={13}/></button>
              </div>
            )
          )}
          {!profile.is_admin ? (
            <button onClick={()=>patchProfile({is_admin:true})} disabled={saving} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:8,color:'#a78bfa',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              <Shield size={13}/> Make Admin
            </button>
          ) : (
            <button onClick={()=>patchProfile({is_admin:false})} disabled={saving} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,color:'#64748b',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              <ShieldOff size={13}/> Remove Admin
            </button>
          )}
          {(['free','pro','enterprise'] as const).filter(p=>p!==profile.plan).map(p=>(
            <button key={p} onClick={()=>patchProfile({plan:p})} disabled={saving} style={{ padding:'8px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,color:'#64748b',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              → {PLAN_META[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:0,marginBottom:0,borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:'flex',alignItems:'center',gap:7,padding:'11px 18px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?'#a78bfa':'#334155',borderBottom:`2px solid ${tab===t.id?'#8b5cf6':'transparent'}`,marginBottom:-1,transition:'color 0.12s' }}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background:'#12131e',border:'1px solid rgba(255,255,255,0.06)',borderTop:'none',borderRadius:'0 0 14px 14px',padding:'24px 28px' }}>

        {/* PROFILE TAB */}
        {tab==='profile' && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            <Field label="Full Name" value={profile.full_name??''} editable onChange={v=>patchProfile({full_name:v})} />
            <Field label="Email" value={profile.email} />
            <Field label="Plan" value={profile.plan} />
            <Field label="User ID" value={profile.user_id} />
            <Field label="Created" value={new Date(profile.created_at).toLocaleString()} />
            <Field label="Last Active" value={timeAgo(profile.last_active_at)} />
            {profile.lock_reason && <Field label="Lock Reason" value={profile.lock_reason} />}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>Admin Notes (internal)</label>
              {editingNotes ? (
                <div>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} autoFocus
                    style={{ width:'100%',boxSizing:'border-box',padding:'10px 12px',background:'#0d0e1a',border:'1px solid rgba(139,92,246,0.4)',borderRadius:7,color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',marginBottom:8 }} />
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={saveNotes} style={{ padding:'8px 16px',background:'#8b5cf6',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:600 }}>Save Notes</button>
                    <button onClick={()=>{setEditingNotes(false);setNotes(profile.admin_notes??'');}} style={{ padding:'8px 16px',background:'#1e293b',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:'#64748b' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div onClick={()=>setEditingNotes(true)} style={{ padding:'10px 12px',background:'#0d0e1a',border:'1px solid rgba(255,255,255,0.06)',borderRadius:7,color:profile.admin_notes?'#e2e8f0':'#334155',fontSize:13,cursor:'text',minHeight:80,fontStyle:profile.admin_notes?'normal':'italic',lineHeight:1.6 }}>
                  {profile.admin_notes||'Click to add notes... (not visible to user)'}
                  <span style={{ float:'right',fontSize:11,color:'#334155',fontStyle:'normal' }}>click to edit</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {tab==='subscription' && (
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24 }}>
              {[
                ['Current Plan', PLAN_META[profile.plan]?.label ?? profile.plan],
                ['Status', profile.is_locked ? 'Locked' : 'Active'],
                ['Billing Cycle', 'Monthly'],
                ['MRR', profile.plan==='pro' ? '$29/mo' : profile.plan==='enterprise' ? '$99/mo' : '$0'],
              ].map(([l,v])=>(
                <div key={l} style={{ background:'#0d0e1a',borderRadius:10,padding:'16px 18px' }}>
                  <div style={{ fontSize:11,color:'#334155',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>{l}</div>
                  <div style={{ fontSize:16,fontWeight:700,color:'#f1f5f9' }}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:13,color:'#334155',fontStyle:'italic' }}>Full Stripe subscription details available when Stripe integration is configured.</p>
          </div>
        )}

        {/* FEATURES TAB */}
        {tab==='features' && (
          <div>
            <p style={{ fontSize:13,color:'#64748b',marginBottom:20 }}>Manage per-user feature access. Overrides take precedence over plan-based access.</p>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {ALL_FLAGS.map(key=>{
                const override = overrides.find(o=>o.feature_key===key);
                return (
                  <div key={key} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#0d0e1a',borderRadius:10,border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <code style={{ fontSize:13,fontWeight:700,color:'#e2e8f0',fontFamily:'monospace' }}>{key}</code>
                      {override && (
                        <span style={{ marginLeft:8,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,
                          background:override.is_enabled?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
                          color:override.is_enabled?'#22c55e':'#ef4444',
                          border:`1px solid ${override.is_enabled?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`}}>
                          {override.is_enabled?'OVERRIDE: ON':'OVERRIDE: OFF'}
                        </span>
                      )}
                    </div>
                    <button onClick={()=>toggleOverride(key,override)} style={{ padding:'7px 14px',background:override?'rgba(239,68,68,0.1)':'rgba(139,92,246,0.1)',border:`1px solid ${override?'rgba(239,68,68,0.2)':'rgba(139,92,246,0.2)'}`,borderRadius:7,color:override?'#ef4444':'#a78bfa',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                      {override?'Remove Override':'Add Override'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {tab==='activity' && (
          <div>
            <h4 style={{ fontWeight:700,fontSize:14,color:'#94a3b8',margin:'0 0 16px' }}>Recent Posts</h4>
            {activity.posts.length===0 ? <p style={{ color:'#334155',fontSize:13 }}>No posts yet.</p> : (
              <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:24 }}>
                {activity.posts.map(p=>(
                  <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#0d0e1a',borderRadius:8 }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(139,92,246,0.1)',color:'#a78bfa' }}>{p.platform}</span>
                    <span style={{ fontSize:12,color:'#64748b',flex:1 }}>{p.status}</span>
                    <span style={{ fontSize:11,color:'#334155' }}>{timeAgo(p.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
            <h4 style={{ fontWeight:700,fontSize:14,color:'#94a3b8',margin:'0 0 16px' }}>Campaigns</h4>
            {activity.campaigns.length===0 ? <p style={{ color:'#334155',fontSize:13 }}>No campaigns yet.</p> : (
              activity.campaigns.map(c=>(
                <div key={c.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#0d0e1a',borderRadius:8,marginBottom:6 }}>
                  <span style={{ fontSize:13,color:'#e2e8f0',flex:1 }}>{c.name}</span>
                  <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e' }}>{c.status}</span>
                  <span style={{ fontSize:11,color:'#334155' }}>{timeAgo(c.created_at)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab==='history' && (
          <div>
            {adminHistory.length===0 ? <p style={{ color:'#334155',fontSize:13 }}>No admin actions recorded for this user yet.</p> : (
              adminHistory.map(log=>(
                <div key={log.id} style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(139,92,246,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                    <History size={13} color="#a78bfa"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,color:'#e2e8f0',fontWeight:500,marginBottom:2 }}>{log.action}</div>
                    <div style={{ fontSize:11,color:'#334155' }}>by {log.admin_email}</div>
                  </div>
                  <span style={{ fontSize:11,color:'#334155',flexShrink:0 }}>{timeAgo(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
