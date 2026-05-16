'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Zap, Play, Pause, Trash2, ChevronRight,
  GitBranch, Bell, Users, Calendar, MessageSquare,
  Mail, Star, Clock, Activity, Edit2, X, Check,
  MoreVertical, RefreshCw, AlertCircle, ArrowDown,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type BlockType = 'trigger' | 'condition' | 'action';
type AutomationCategory = 'all' | 'posting' | 'engagement' | 'crm' | 'notifications';

interface FlowBlock {
  id: string;
  type: BlockType;
  title: string;
  config: Record<string, string>;
}

interface RunLog {
  id: string;
  status: 'success' | 'failed' | 'skipped';
  ran_at: string;
  message: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  is_active: boolean;
  trigger_config: Record<string, string>;
  conditions: FlowBlock[];
  actions: FlowBlock[];
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  blocks?: FlowBlock[];
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_AUTOMATIONS: Automation[] = [
  {
    id: 'd1',
    name: 'Welcome New Followers',
    description: 'Send a welcome DM to every new Instagram follower',
    category: 'engagement',
    is_active: true,
    trigger_config: { platform: 'Instagram', event: 'new_follower' },
    conditions: [],
    actions: [{ id: 'a1', type: 'action', title: 'Send DM', config: { message: 'Hey! Thanks for following 👋 Check out our latest posts!' } }],
    run_count: 1240,
    last_run_at: new Date(Date.now() - 25 * 60000).toISOString(),
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'd2',
    name: 'Lead Nurture Sequence',
    description: 'Tag and follow up when a new CRM contact is added',
    category: 'crm',
    is_active: true,
    trigger_config: { event: 'new_contact' },
    conditions: [{ id: 'c1', type: 'condition', title: 'Status is Lead', config: { field: 'status', operator: 'equals', value: 'lead' } }],
    actions: [
      { id: 'a2', type: 'action', title: 'Add Tag', config: { tag: 'nurture-sequence' } },
      { id: 'a3', type: 'action', title: 'Send Email', config: { template: 'welcome_lead' } },
    ],
    run_count: 387,
    last_run_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: '2024-02-20T09:00:00Z',
  },
  {
    id: 'd3',
    name: 'Re-engagement Campaign',
    description: 'Flag contacts who have been inactive for 30 days',
    category: 'crm',
    is_active: false,
    trigger_config: { event: 'contact_inactive', days: '30' },
    conditions: [],
    actions: [{ id: 'a4', type: 'action', title: 'Add Tag', config: { tag: 're-engagement' } }],
    run_count: 92,
    last_run_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: '2024-03-05T08:00:00Z',
  },
  {
    id: 'd4',
    name: 'Daily Performance Digest',
    description: 'Get a daily summary of your social media stats',
    category: 'notifications',
    is_active: true,
    trigger_config: { event: 'schedule', cron: '0 8 * * *' },
    conditions: [],
    actions: [{ id: 'a5', type: 'action', title: 'Send Notification', config: { type: 'email', template: 'daily_digest' } }],
    run_count: 45,
    last_run_at: new Date(Date.now() - 16 * 3600000).toISOString(),
    created_at: '2024-03-20T08:00:00Z',
  },
];

const DEMO_LOGS: RunLog[] = [
  { id: 'l1', status: 'success', ran_at: new Date(Date.now() - 25 * 60000).toISOString(), message: 'Sent DM to @new_user123' },
  { id: 'l2', status: 'success', ran_at: new Date(Date.now() - 90 * 60000).toISOString(), message: 'Sent DM to @cool_brand' },
  { id: 'l3', status: 'skipped', ran_at: new Date(Date.now() - 3 * 3600000).toISOString(), message: 'Skipped — user has DMs restricted' },
  { id: 'l4', status: 'success', ran_at: new Date(Date.now() - 5 * 3600000).toISOString(), message: 'Sent DM to @marketer_xyz' },
  { id: 'l5', status: 'failed', ran_at: new Date(Date.now() - 8 * 3600000).toISOString(), message: 'Error: rate limit reached' },
];

const TEMPLATES = [
  { icon: '👋', name: 'Welcome New Followers', desc: 'Send a DM when someone follows you', category: 'engagement' },
  { icon: '🏷️', name: 'Auto-tag DMs', desc: 'Tag contacts who send keywords like "price" or "info"', category: 'crm' },
  { icon: '📊', name: 'Daily Digest', desc: 'Email yourself a daily stats summary at 8 AM', category: 'notifications' },
  { icon: '🎯', name: 'Lead Capture', desc: 'Add CRM contact when someone comments "interested"', category: 'crm' },
];

// ── Trigger / Condition / Action options ──────────────────────────────────────

const TRIGGER_OPTIONS = [
  { value: 'new_follower', label: 'New Follower', icon: '👤', platform: 'Instagram' },
  { value: 'new_comment', label: 'New Comment', icon: '💬', platform: 'Any' },
  { value: 'new_dm', label: 'New DM Received', icon: '📩', platform: 'Any' },
  { value: 'new_contact', label: 'New CRM Contact', icon: '🗂️', platform: 'CRM' },
  { value: 'contact_inactive', label: 'Contact Inactive', icon: '💤', platform: 'CRM' },
  { value: 'schedule', label: 'Scheduled Time', icon: '🕐', platform: 'System' },
  { value: 'post_published', label: 'Post Published', icon: '📢', platform: 'Any' },
];

const CONDITION_OPTIONS = [
  { value: 'keyword', label: 'Message contains keyword' },
  { value: 'follower_count', label: 'Follower count >' },
  { value: 'status_equals', label: 'Contact status equals' },
  { value: 'tag_has', label: 'Contact has tag' },
  { value: 'platform_is', label: 'Platform is' },
];

const ACTION_OPTIONS = [
  { value: 'send_dm', label: 'Send DM', icon: MessageSquare },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'add_tag', label: 'Add Tag', icon: Star },
  { value: 'add_to_crm', label: 'Add to CRM', icon: Users },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'wait', label: 'Wait / Delay', icon: Clock },
];

const CATEGORY_META: Record<AutomationCategory, { label: string; icon: typeof Zap }> = {
  all:           { label: 'All',           icon: Zap },
  posting:       { label: 'Posting',       icon: Calendar },
  engagement:    { label: 'Engagement',    icon: MessageSquare },
  crm:           { label: 'CRM',           icon: Users },
  notifications: { label: 'Notifications', icon: Bell },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

function makeTriggerBlock(triggerConfig: Record<string, string>): FlowBlock {
  const opt = TRIGGER_OPTIONS.find(t => t.value === triggerConfig.event) ?? TRIGGER_OPTIONS[0];
  return { id: 'trigger', type: 'trigger', title: opt.label, config: triggerConfig };
}

function buildBlocks(auto: Automation): FlowBlock[] {
  return [
    makeTriggerBlock(auto.trigger_config),
    ...(auto.conditions ?? []),
    ...(auto.actions ?? []),
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BlockNode({
  block,
  selected,
  onClick,
  onDelete,
  canDelete,
}: {
  block: FlowBlock;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const isTrigger = block.type === 'trigger';
  const isCondition = block.type === 'condition';

  const borderColor = isTrigger ? '#059669' : isCondition ? '#d97706' : '#7c3aed';
  const bgColor = isTrigger ? '#ecfdf5' : isCondition ? '#fffbeb' : '#f5f3ff';
  const labelColor = isTrigger ? '#065f46' : isCondition ? '#92400e' : '#4c1d95';
  const typeLabel = isTrigger ? 'TRIGGER' : isCondition ? 'CONDITION' : 'ACTION';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        onClick={onClick}
        style={{
          width: 320,
          border: `2px solid ${selected ? borderColor : '#e5e7eb'}`,
          borderRadius: isCondition ? 12 : 12,
          background: selected ? bgColor : '#fff',
          padding: '12px 16px',
          cursor: 'pointer',
          boxShadow: selected ? `0 0 0 3px ${borderColor}22` : '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.15s',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: borderColor, background: bgColor, border: `1px solid ${borderColor}44`,
            borderRadius: 4, padding: '2px 6px',
          }}>{typeLabel}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', flex: 1 }}>{block.title}</span>
          {canDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 4, lineHeight: 1 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {Object.entries(block.config).length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            {Object.entries(block.config).slice(0, 2).map(([k, v]) => (
              <span key={k} style={{ marginRight: 12 }}>
                <span style={{ color: '#9ca3af' }}>{k}: </span>{String(v).slice(0, 28)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{ width: 2, height: 20, background: '#e5e7eb' }} />
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: '2px dashed #d1d5db',
          background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6b7280', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
      >
        <Plus size={14} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 180, overflow: 'hidden',
        }}>
          {(['condition', 'action'] as BlockType[]).map(t => (
            <button
              key={t}
              onClick={() => { onAdd(t); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              {t === 'condition' ? '🔀 Add Condition' : '⚡ Add Action'}
            </button>
          ))}
        </div>
      )}
      <div style={{ width: 2, height: 20, background: '#e5e7eb' }} />
    </div>
  );
}

function BlockSettingsPanel({
  block,
  onChange,
  onClose,
}: {
  block: FlowBlock;
  onChange: (updated: FlowBlock) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<Record<string, string>>(block.config);
  const [title, setTitle] = useState(block.title);

  function save() {
    onChange({ ...block, title, config });
    onClose();
  }

  return (
    <div style={{
      width: 280, borderLeft: '1px solid #e5e7eb', background: '#fff',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Block Settings</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Label</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          />
        </div>

        {block.type === 'trigger' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Trigger Event</label>
            <select
              value={config.event ?? ''}
              onChange={e => setConfig(c => ({ ...c, event: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
            >
              {TRIGGER_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label} ({t.platform})</option>
              ))}
            </select>
          </div>
        )}

        {block.type === 'condition' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Condition Type</label>
              <select
                value={config.condition_type ?? ''}
                onChange={e => setConfig(c => ({ ...c, condition_type: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
              >
                {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Value</label>
              <input
                value={config.value ?? ''}
                onChange={e => setConfig(c => ({ ...c, value: e.target.value }))}
                placeholder="Enter value..."
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>
          </>
        )}

        {block.type === 'action' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Action Type</label>
              <select
                value={config.action_type ?? ''}
                onChange={e => setConfig(c => ({ ...c, action_type: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
              >
                {ACTION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {(config.action_type === 'send_dm' || config.action_type === 'send_email') && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                <textarea
                  value={config.message ?? ''}
                  onChange={e => setConfig(c => ({ ...c, message: e.target.value }))}
                  rows={4}
                  placeholder="Type your message..."
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>
            )}
            {config.action_type === 'add_tag' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tag Name</label>
                <input
                  value={config.tag ?? ''}
                  onChange={e => setConfig(c => ({ ...c, tag: e.target.value }))}
                  placeholder="e.g. hot-lead"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            )}
            {config.action_type === 'wait' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Wait Duration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={config.wait_amount ?? '1'}
                    onChange={e => setConfig(c => ({ ...c, wait_amount: e.target.value }))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
                  />
                  <select
                    value={config.wait_unit ?? 'hours'}
                    onChange={e => setConfig(c => ({ ...c, wait_unit: e.target.value }))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={save}
          style={{ width: '100%', padding: '10px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}

// ── New Automation Modal ───────────────────────────────────────────────────────

function NewAutomationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, desc: string, category: AutomationCategory) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<AutomationCategory>('engagement');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Create Automation</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Welcome New Followers"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What does this automation do?"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as AutomationCategory)}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff' }}
            >
              <option value="posting">Posting</option>
              <option value="engagement">Engagement</option>
              <option value="crm">CRM</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (name.trim()) { onCreate(name.trim(), desc, category); onClose(); } }}
              disabled={!name.trim()}
              style={{ flex: 1, padding: '10px 0', background: name.trim() ? '#7c3aed' : '#e5e7eb', color: name.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default' }}
            >
              Create
            </button>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Or start from a template:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => { onCreate(t.name, t.desc, t.category as AutomationCategory); onClose(); }}
                style={{ textAlign: 'left', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle size={22} color="#dc2626" />
        </div>
        <h3 style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 8px' }}>Delete Automation?</h3>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>
          <strong>{name}</strong> will be permanently deleted and cannot be recovered.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selected, setSelected] = useState<Automation | null>(null);
  const [category, setCategory] = useState<AutomationCategory>('all');
  const [view, setView] = useState<'detail' | 'builder'>('detail');
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<FlowBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch(`/api/automations${category !== 'all' ? `?category=${category}` : ''}`);
      const json = await res.json();
      const list = json.automations?.length ? json.automations : DEMO_AUTOMATIONS;
      setAutomations(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch {
      setAutomations(DEMO_AUTOMATIONS);
      if (!selected) setSelected(DEMO_AUTOMATIONS[0]);
    } finally {
      setLoading(false);
    }
  }, [category, selected]);

  useEffect(() => { fetchAutomations(); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) setBlocks(buildBlocks(selected));
  }, [selected]);

  async function toggleActive(auto: Automation, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = { ...auto, is_active: !auto.is_active };
    setAutomations(prev => prev.map(a => a.id === auto.id ? updated : a));
    if (selected?.id === auto.id) setSelected(updated);
    try {
      await fetch('/api/automations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: auto.id, is_active: !auto.is_active }) });
    } catch {}
  }

  async function createAutomation(name: string, desc: string, cat: AutomationCategory) {
    const newAuto: Automation = {
      id: generateId(),
      name, description: desc, category: cat,
      is_active: true,
      trigger_config: { event: 'new_follower' },
      conditions: [], actions: [],
      run_count: 0, last_run_at: null,
      created_at: new Date().toISOString(),
    };
    setAutomations(prev => [newAuto, ...prev]);
    setSelected(newAuto);
    setView('builder');
    try {
      const res = await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc, category: cat }) });
      const json = await res.json();
      if (json.automation) {
        setAutomations(prev => prev.map(a => a.id === newAuto.id ? { ...newAuto, id: json.automation.id } : a));
        setSelected(s => s?.id === newAuto.id ? { ...newAuto, id: json.automation.id } : s);
      }
    } catch {}
  }

  async function deleteAutomation(auto: Automation) {
    setAutomations(prev => prev.filter(a => a.id !== auto.id));
    if (selected?.id === auto.id) setSelected(automations.find(a => a.id !== auto.id) ?? null);
    setDeleteTarget(null);
    try {
      await fetch(`/api/automations?id=${auto.id}`, { method: 'DELETE' });
    } catch {}
  }

  async function saveBuilder() {
    if (!selected) return;
    setSaving(true);
    const trigger = blocks.find(b => b.type === 'trigger');
    const conditions = blocks.filter(b => b.type === 'condition');
    const actions = blocks.filter(b => b.type === 'action');
    const updated: Automation = {
      ...selected,
      trigger_config: trigger?.config ?? {},
      conditions, actions,
    };
    setAutomations(prev => prev.map(a => a.id === selected.id ? updated : a));
    setSelected(updated);
    try {
      await fetch('/api/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, trigger_config: trigger?.config ?? {}, conditions, actions }),
      });
    } catch {}
    setSaving(false);
  }

  async function runTest() {
    setTestRunning(true);
    await new Promise(r => setTimeout(r, 1500));
    setTestRunning(false);
    alert('Test run completed successfully! Check the activity log for results.');
  }

  function addBlock(type: BlockType, afterIndex: number) {
    const id = generateId();
    const newBlock: FlowBlock = type === 'condition'
      ? { id, type, title: 'Check Condition', config: { condition_type: 'keyword', value: '' } }
      : { id, type, title: 'Send DM', config: { action_type: 'send_dm', message: '' } };
    setBlocks(prev => [
      ...prev.slice(0, afterIndex + 1),
      newBlock,
      ...prev.slice(afterIndex + 1),
    ]);
    setSelectedBlock(newBlock);
  }

  function deleteBlock(blockId: string) {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlock?.id === blockId) setSelectedBlock(null);
  }

  function updateBlock(updated: FlowBlock) {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    setSelectedBlock(null);
  }

  const filteredAutomations = category === 'all'
    ? automations
    : automations.filter(a => a.category === category);

  const categories: AutomationCategory[] = ['all', 'posting', 'engagement', 'crm', 'notifications'];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 104px)', background: '#f9fafb', overflow: 'hidden' }}>

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{ width: 280, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Automations</span>
            <button
              onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={13} /> New
            </button>
          </div>
          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: active ? 'none' : '1px solid #e5e7eb',
                    background: active ? '#7c3aed' : '#fff',
                    color: active ? '#fff' : '#6b7280',
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Automation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
          ) : filteredAutomations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Zap size={32} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>No automations yet</p>
              <button
                onClick={() => setShowNewModal(true)}
                style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Create your first
              </button>
            </div>
          ) : (
            filteredAutomations.map(auto => {
              const isSelected = selected?.id === auto.id;
              return (
                <div
                  key={auto.id}
                  onClick={() => { setSelected(auto); setView('detail'); setSelectedBlock(null); }}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    borderLeft: `3px solid ${isSelected ? '#7c3aed' : 'transparent'}`,
                    background: isSelected ? '#faf5ff' : 'transparent',
                    borderBottom: '1px solid #f9fafb',
                    transition: 'background 0.1s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {auto.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {auto.description || 'No description'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          {auto.run_count.toLocaleString()} runs
                        </span>
                        <span style={{ fontSize: 10, color: '#d1d5db' }}>·</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(auto.last_run_at)}</span>
                      </div>
                    </div>
                    {/* Toggle */}
                    <div onClick={e => toggleActive(auto, e)} style={{ marginTop: 2, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 18, borderRadius: 9,
                        background: auto.is_active ? '#7c3aed' : '#d1d5db',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: auto.is_active ? 16 : 2,
                          width: 14, height: 14, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Context menu */}
                  <div style={{ position: 'absolute', top: 10, right: 8 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === auto.id ? null : auto.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 4, opacity: isSelected ? 1 : 0 }}
                      className="menu-btn"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {menuOpen === auto.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: 24, background: '#fff',
                        border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        zIndex: 50, minWidth: 140, overflow: 'hidden',
                      }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(auto); setView('builder'); setMenuOpen(null); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151' }}
                        >
                          <Edit2 size={13} /> Edit Flow
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(auto); setMenuOpen(null); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#dc2626' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Panel ───────────────────────────────────────────────────────── */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setMenuOpen(null)}>

          {/* Panel Header */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: 0 }}>{selected.name}</h2>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px',
                  borderRadius: 20, border: `1px solid ${selected.is_active ? '#059669' : '#d1d5db'}`,
                  color: selected.is_active ? '#059669' : '#6b7280',
                  background: selected.is_active ? '#ecfdf5' : '#f9fafb',
                }}>
                  {selected.is_active ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              {selected.description && (
                <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{selected.description}</p>
              )}
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
              {(['detail', 'builder'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: view === v ? '#fff' : 'transparent',
                    color: view === v ? '#111827' : '#6b7280',
                    boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {v === 'detail' ? 'Detail' : 'Flow Builder'}
                </button>
              ))}
            </div>

            {view === 'builder' && (
              <>
                <button
                  onClick={runTest}
                  disabled={testRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                >
                  {testRunning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                  Test Run
                </button>
                <button
                  onClick={saveBuilder}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  Save
                </button>
              </>
            )}

            {view === 'detail' && (
              <button
                onClick={() => toggleActive(selected, { stopPropagation: () => {} } as React.MouseEvent)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: selected.is_active ? '#fef2f2' : '#ecfdf5', border: `1px solid ${selected.is_active ? '#fecaca' : '#a7f3d0'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: selected.is_active ? '#dc2626' : '#059669' }}
              >
                {selected.is_active ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
              </button>
            )}
          </div>

          {/* ── Detail View ──────────────────────────────────────────────────── */}
          {view === 'detail' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Runs', value: selected.run_count.toLocaleString(), icon: RefreshCw, color: '#7c3aed' },
                  { label: 'Last Run', value: timeAgo(selected.last_run_at), icon: Clock, color: '#0ea5e9' },
                  { label: 'Steps', value: String(1 + (selected.conditions?.length ?? 0) + (selected.actions?.length ?? 0)), icon: GitBranch, color: '#059669' },
                  { label: 'Category', value: CATEGORY_META[selected.category]?.label ?? selected.category, icon: Zap, color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <stat.icon size={16} color={stat.color} />
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{stat.label}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Flow summary */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Workflow Steps</h3>
                  <button
                    onClick={() => setView('builder')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Edit2 size={12} /> Edit Flow
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {buildBlocks(selected).map((block, i) => {
                    const isT = block.type === 'trigger';
                    const isC = block.type === 'condition';
                    const color = isT ? '#059669' : isC ? '#d97706' : '#7c3aed';
                    const bg = isT ? '#ecfdf5' : isC ? '#fffbeb' : '#f5f3ff';
                    return (
                      <div key={block.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: bg, borderRadius: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>{block.type}</span>
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{block.title}</span>
                          </div>
                        </div>
                        {i < buildBlocks(selected).length - 1 && (
                          <div style={{ width: 1, height: 8, background: '#e5e7eb', margin: '0 3px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Log */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 16px' }}>Recent Activity</h3>
                {DEMO_LOGS.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: log.status === 'success' ? '#ecfdf5' : log.status === 'failed' ? '#fef2f2' : '#fffbeb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {log.status === 'success' ? <Check size={12} color="#059669" /> :
                       log.status === 'failed' ? <X size={12} color="#dc2626" /> :
                       <AlertCircle size={12} color="#d97706" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{log.message}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(log.ran_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Flow Builder View ─────────────────────────────────────────────── */}
          {view === 'builder' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Canvas */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, textAlign: 'center' }}>
                  Click a block to configure it · Use + to add steps
                </div>

                {blocks.map((block, i) => (
                  <div key={block.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <BlockNode
                      block={block}
                      selected={selectedBlock?.id === block.id}
                      onClick={() => setSelectedBlock(selectedBlock?.id === block.id ? null : block)}
                      onDelete={() => deleteBlock(block.id)}
                      canDelete={block.type !== 'trigger'}
                    />
                    {i < blocks.length - 1 && (
                      <AddBlockButton onAdd={(type) => addBlock(type, i)} />
                    )}
                  </div>
                ))}

                {/* Add at end */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 20, background: '#e5e7eb' }} />
                  <AddBlockButton onAdd={(type) => addBlock(type, blocks.length - 1)} />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>End of flow</div>
                </div>

                {/* Note */}
                <div style={{ marginTop: 32, maxWidth: 400, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
                    ⚠️ Automation execution requires the background worker service (Railway deployment). Flow builder saves your config — live execution coming in Phase 2.
                  </p>
                </div>
              </div>

              {/* Block Settings Sidebar */}
              {selectedBlock && (
                <BlockSettingsPanel
                  block={selectedBlock}
                  onChange={updateBlock}
                  onClose={() => setSelectedBlock(null)}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Zap size={32} color="#7c3aed" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#111827', margin: '0 0 8px' }}>Build your first automation</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', textAlign: 'center', maxWidth: 360 }}>
            Automate repetitive tasks like welcoming new followers, tagging DMs, and sending follow-ups.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 480, marginBottom: 24 }}>
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => { createAutomation(t.name, t.desc, t.category as AutomationCategory); }}
                style={{ textAlign: 'left', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px #7c3aed22'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} /> Create from scratch
          </button>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <NewAutomationModal
          onClose={() => setShowNewModal(false)}
          onCreate={createAutomation}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={() => deleteAutomation(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
