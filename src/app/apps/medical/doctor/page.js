'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, Settings,
  LogOut, ChevronLeft, ChevronRight, Bell, Plus, Search,
  Clock, CheckCircle2, XCircle, AlertCircle, Activity,
  UserPlus, Stethoscope, Video, Lock, TrendingUp, RefreshCw,
  Phone, ChevronRight as Arrow, Moon, Sun, Menu, X, BarChart2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MedicalCalendar from '@/components/features/apps/medical/MedicalCalendar'
import ProfileModal from '@/components/features/apps/medical/ProfileModal'

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  /* ── Root ── */
  .md-root {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    background: var(--bg-base);
    overflow: hidden;
  }

  /* ── Layout body ── */
  .md-body {
    flex: 1; display: flex; overflow: hidden;
  }

  /* ── Topbar ── */
  .md-topbar {
    height: 56px; flex-shrink: 0;
    display: flex; align-items: center;
    padding: 0 16px; gap: 12px;
    border-bottom: 1px solid var(--border);
    background: rgba(8,11,20,.92);
    backdrop-filter: blur(20px);
    z-index: 200;
  }
  .md-topbar-logo {
    font-family: var(--font-display);
    font-weight: 800; font-size: 1rem;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }
  .md-topbar-sep { flex: 1; }
  .md-topbar-badge {
    padding: 2px 10px; border-radius: 20px; font-size: .7rem;
    font-weight: 700; letter-spacing: .04em;
    background: var(--ac-muted); color: var(--ac);
    border: 1px solid var(--border-accent);
  }
  .md-topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    display: flex; align-items: center; justify-content: center;
    font-size: .75rem; font-weight: 700; color: white;
    cursor: pointer; flex-shrink: 0;
  }
  .md-icon-btn {
    width: 34px; height: 34px; display: flex;
    align-items: center; justify-content: center;
    border: 1px solid var(--border); border-radius: 8px;
    background: transparent; color: var(--tx-2); cursor: pointer;
    transition: all .16s;
  }
  .md-icon-btn:hover { background: var(--bg-hover); color: var(--tx); }

  /* ── Sidebar (desktop) ── */
  .md-sidebar {
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    background: rgba(8,11,20,.72);
    backdrop-filter: blur(24px);
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: width .26s cubic-bezier(.16,1,.3,1);
    z-index: 100;
  }
  .md-sidebar--open   { width: 220px; }
  .md-sidebar--closed { width: 60px; }

  .md-sb-logo {
    height: 56px; display: flex; align-items: center;
    padding: 0 12px; gap: 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .md-sb-logo-text {
    font-family: var(--font-display); font-size: .9rem; font-weight: 800;
    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; white-space: nowrap; overflow: hidden;
    flex: 1; opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(.16,1,.3,1);
  }
  .md-sidebar--open .md-sb-logo-text { opacity: 1; max-width: 140px; }

  .md-sb-toggle {
    width: 28px; height: 28px; min-width: 28px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border); border-radius: 8px;
    background: rgba(14,165,233,.08); color: #0EA5E9;
    cursor: pointer; transition: all .18s; margin-left: auto;
  }
  .md-sb-toggle:hover { background: rgba(14,165,233,.18); }
  .md-sidebar--closed .md-sb-toggle { margin-left: 0; }

  .md-sb-nav {
    flex: 1; padding: 10px 8px;
    display: flex; flex-direction: column; gap: 2px;
    overflow: hidden;
  }
  .md-sb-item {
    display: flex; align-items: center; gap: 10px;
    padding: 0 10px; height: 40px; border-radius: 10px;
    cursor: pointer; transition: all .18s;
    color: var(--tx-2); font-size: .85rem; font-weight: 500;
    white-space: nowrap; overflow: hidden;
    border: 1px solid transparent;
    position: relative;
  }
  .md-sb-item:hover { background: var(--bg-hover); color: var(--tx); }
  .md-sb-item.active {
    background: rgba(14,165,233,.12);
    color: #0EA5E9;
    border-color: rgba(14,165,233,.25);
  }
  .md-sb-item svg { flex-shrink: 0; }
  .md-sb-label {
    overflow: hidden; opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(.16,1,.3,1);
  }
  .md-sidebar--open .md-sb-label { opacity: 1; max-width: 140px; }
  .md-sb-badge {
    margin-left: auto; min-width: 18px; height: 18px;
    padding: 0 5px; border-radius: 9px;
    background: #DC2626; color: white; font-size: .65rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; max-width: 0; overflow: hidden;
    transition: opacity .18s, max-width .26s;
  }
  .md-sidebar--open .md-sb-badge { opacity: 1; max-width: 40px; }

  .md-sb-footer {
    padding: 10px 8px; border-top: 1px solid var(--border); flex-shrink: 0;
  }
  .md-sb-logout {
    display: flex; align-items: center; gap: 10px;
    padding: 0 10px; height: 40px; border-radius: 10px;
    cursor: pointer; transition: all .18s;
    color: var(--tx-3); font-size: .85rem; font-weight: 500;
    white-space: nowrap; overflow: hidden; width: 100%;
    border: none; background: transparent;
  }
  .md-sb-logout:hover { background: rgba(248,113,113,.08); color: var(--red); }

  /* ── Content area ── */
  .md-content {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 24px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }

  /* ── Bottom nav (mobile) ── */
  .md-bottom-nav {
    display: none;
    height: 64px; flex-shrink: 0;
    border-top: 1px solid var(--border);
    background: rgba(8,11,20,.95);
    backdrop-filter: blur(20px);
  }
  .md-bn-inner {
    display: flex; height: 100%; align-items: center;
  }
  .md-bn-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px;
    cursor: pointer; padding: 6px 0;
    color: var(--tx-3); font-size: .6rem; font-weight: 600;
    letter-spacing: .03em; text-transform: uppercase;
    transition: color .15s; border: none; background: none;
    position: relative;
  }
  .md-bn-item.active { color: #0EA5E9; }
  .md-bn-item svg { width: 20px; height: 20px; }
  .md-bn-dot {
    position: absolute; top: 6px; right: 50%; transform: translateX(10px);
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--red); border: 2px solid var(--bg-base);
  }

  @media (max-width: 767px) {
    .md-sidebar   { display: none; }
    .md-bottom-nav { display: flex; }
    .md-topbar-logo { display: none; }
    .md-content   { padding: 16px; }
  }

  /* ── Section header ── */
  .md-section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .md-section-title {
    font-family: var(--font-display); font-size: 1.25rem;
    font-weight: 700; color: var(--tx);
  }
  .md-section-sub {
    font-size: .8rem; color: var(--tx-2); margin-top: 2px;
  }

  /* ── KPI Cards ── */
  .md-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px; margin-bottom: 28px;
  }
  .md-kpi-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 18px;
    transition: all .2s;
    position: relative; overflow: hidden;
  }
  .md-kpi-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
  }
  .md-kpi-card.blue::before  { background: linear-gradient(90deg, #0EA5E9, #38BDF8); }
  .md-kpi-card.green::before { background: linear-gradient(90deg, var(--green), #34D399); }
  .md-kpi-card.violet::before{ background: linear-gradient(90deg, var(--ac), var(--ac-2)); }
  .md-kpi-card.gold::before  { background: linear-gradient(90deg, var(--gold), var(--gold-light)); }
  .md-kpi-card:hover { border-color: var(--border-strong); transform: translateY(-1px); }
  .md-kpi-label {
    font-size: .72rem; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; color: var(--tx-2); margin-bottom: 8px;
  }
  .md-kpi-value {
    font-family: var(--font-display); font-size: 2rem;
    font-weight: 800; color: var(--tx); line-height: 1;
    margin-bottom: 4px;
  }
  .md-kpi-icon {
    position: absolute; bottom: 12px; right: 14px;
    opacity: .12;
  }
  .md-kpi-sub {
    font-size: .72rem; color: var(--tx-3);
  }

  /* ── File d'attente ── */
  .md-queue {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    margin-bottom: 24px;
  }
  .md-queue-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .md-queue-title {
    font-weight: 700; font-size: .9rem; color: var(--tx);
    display: flex; align-items: center; gap: 8px;
  }
  .md-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px rgba(16,185,129,.6);
    animation: pulse-live 2s infinite;
  }
  @keyframes pulse-live {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: .6; transform: scale(.85); }
  }
  .md-queue-empty {
    padding: 40px 20px; text-align: center;
    color: var(--tx-3); font-size: .85rem;
  }
  .md-queue-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    transition: background .15s;
  }
  .md-queue-item:last-child { border-bottom: none; }
  .md-queue-item:hover { background: var(--bg-hover); }
  .md-queue-num {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: .75rem; font-weight: 800;
    background: rgba(14,165,233,.12); color: #0EA5E9;
    flex-shrink: 0;
  }
  .md-queue-info { flex: 1; min-width: 0; }
  .md-queue-name {
    font-weight: 600; font-size: .87rem; color: var(--tx);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .md-queue-time {
    font-size: .73rem; color: var(--tx-3); margin-top: 2px;
  }
  .md-status-badge {
    padding: 3px 10px; border-radius: 20px;
    font-size: .68rem; font-weight: 700;
    white-space: nowrap; flex-shrink: 0;
  }
  .md-status-pending   { background: rgba(251,191,36,.1);  color: var(--yellow);  border: 1px solid rgba(251,191,36,.25); }
  .md-status-confirmed { background: rgba(14,165,233,.1);  color: #0EA5E9;        border: 1px solid rgba(14,165,233,.25); }
  .md-status-done      { background: rgba(16,185,129,.1);  color: var(--green);   border: 1px solid rgba(16,185,129,.25); }
  .md-status-cancelled { background: rgba(248,113,113,.1); color: var(--red);     border: 1px solid rgba(248,113,113,.25); }

  .md-queue-actions {
    display: flex; gap: 6px; flex-shrink: 0;
  }
  .md-qa-btn {
    padding: 5px 12px; border-radius: 8px; font-size: .73rem;
    font-weight: 600; cursor: pointer; transition: all .16s;
    border: 1px solid var(--border); background: transparent;
    color: var(--tx-2);
  }
  .md-qa-btn:hover { background: var(--bg-hover); color: var(--tx); }
  .md-qa-btn.primary {
    background: rgba(14,165,233,.12); color: #0EA5E9;
    border-color: rgba(14,165,233,.3);
  }
  .md-qa-btn.primary:hover { background: rgba(14,165,233,.22); }
  .md-qa-btn.danger {
    background: rgba(248,113,113,.08); color: var(--red);
    border-color: rgba(248,113,113,.25);
  }
  .md-qa-btn.danger:hover { background: rgba(248,113,113,.16); }

  /* ── Allergy alert ── */
  .md-allergy-alert {
    display: flex; align-items: center; gap: 8px;
    margin-top: 4px; padding: 2px 0;
  }
  .md-allergy-crit {
    font-size: .68rem; font-weight: 700;
    background: rgba(220,38,38,.15); color: #DC2626;
    border: 1px solid rgba(220,38,38,.3);
    padding: 1px 7px; border-radius: 20px;
  }

  /* ── Quick actions ── */
  .md-quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 24px;
  }
  .md-quick-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 18px 12px; border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--bg-surface);
    cursor: pointer; transition: all .2s;
    color: var(--tx-2); font-size: .78rem; font-weight: 600;
    text-align: center;
  }
  .md-quick-btn:hover {
    border-color: rgba(14,165,233,.4);
    background: rgba(14,165,233,.06);
    color: #0EA5E9; transform: translateY(-2px);
  }
  .md-quick-btn.premium {
    border-style: dashed;
    border-color: rgba(99,102,241,.3);
    color: var(--tx-3);
  }
  .md-quick-btn.premium:hover {
    border-color: var(--ac); background: rgba(99,102,241,.06);
    color: var(--ac);
  }
  .md-quick-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .md-quick-icon.blue   { background: rgba(14,165,233,.12); color: #0EA5E9; }
  .md-quick-icon.green  { background: rgba(16,185,129,.12);  color: var(--green); }
  .md-quick-icon.violet { background: rgba(99,102,241,.12);  color: var(--ac); }
  .md-quick-icon.gold   { background: rgba(245,158,11,.12);  color: var(--gold); }

  /* ── Patients tab ── */
  .md-search-bar {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 0 14px; height: 44px;
    margin-bottom: 16px;
  }
  .md-search-bar input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--tx); font-size: .875rem;
  }
  .md-search-bar input::placeholder { color: var(--tx-3); }

  .md-patient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
  .md-patient-card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; cursor: pointer;
    transition: all .2s;
  }
  .md-patient-card:hover {
    border-color: rgba(14,165,233,.35);
    transform: translateY(-1px); box-shadow: var(--shadow-md);
  }
  .md-patient-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
  }
  .md-patient-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: .85rem; color: white; flex-shrink: 0;
    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
  }
  .md-patient-name { font-weight: 700; font-size: .9rem; color: var(--tx); }
  .md-patient-meta { font-size: .73rem; color: var(--tx-3); margin-top: 2px; }
  .md-patient-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .md-tag {
    padding: 2px 8px; border-radius: 20px;
    font-size: .65rem; font-weight: 700;
  }
  .md-tag.allergy-crit { background: rgba(220,38,38,.12); color: #DC2626; border: 1px solid rgba(220,38,38,.25); }
  .md-tag.allergy-mod  { background: rgba(251,191,36,.1);  color: var(--yellow); border: 1px solid rgba(251,191,36,.2); }
  .md-tag.chronic      { background: rgba(99,102,241,.1);  color: var(--ac); border: 1px solid rgba(99,102,241,.2); }

  /* ── Modal ── */
  .md-modal-bg {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: fadeIn .18s;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .md-modal {
    background: var(--bg-elevated); border: 1px solid var(--border-strong);
    border-radius: 20px; padding: 28px;
    width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-modal);
    animation: slideUp .22s cubic-bezier(.16,1,.3,1);
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .md-modal-title {
    font-family: var(--font-display); font-size: 1.1rem;
    font-weight: 700; color: var(--tx); margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .md-form-group { margin-bottom: 14px; }
  .md-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .md-label {
    display: block; font-size: .75rem; font-weight: 600;
    color: var(--tx-2); margin-bottom: 6px; letter-spacing: .03em;
  }
  .md-input {
    width: 100%; padding: 9px 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--bg-surface);
    color: var(--tx); font-size: .875rem; outline: none;
    transition: border-color .15s; box-sizing: border-box;
  }
  .md-input:focus { border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,.12); }
  .md-select {
    width: 100%; padding: 9px 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--bg-surface);
    color: var(--tx); font-size: .875rem; outline: none;
    cursor: pointer; transition: border-color .15s; box-sizing: border-box;
  }
  .md-select:focus { border-color: #0EA5E9; }
  .md-modal-actions {
    display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;
  }
  .md-btn {
    padding: 9px 20px; border-radius: 10px; font-size: .85rem;
    font-weight: 600; cursor: pointer; transition: all .18s; border: none;
  }
  .md-btn.ghost { background: var(--bg-surface); color: var(--tx-2); border: 1px solid var(--border); }
  .md-btn.ghost:hover { color: var(--tx); }
  .md-btn.primary { background: #0EA5E9; color: white; }
  .md-btn.primary:hover { background: #0284C7; }
  .md-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Toast ── */
  .md-toast {
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    padding: 10px 20px; border-radius: 10px; font-size: .85rem;
    font-weight: 600; z-index: 9999; animation: slideUp .22s;
    white-space: nowrap;
  }
  .md-toast.success { background: var(--green); color: white; }
  .md-toast.error   { background: var(--red);   color: white; }
  @media (min-width: 768px) { .md-toast { bottom: 20px; } }

  /* ── Loading skeleton ── */
  .md-skeleton {
    background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-hover) 50%, var(--bg-surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite; border-radius: 8px;
  }
  @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }

  /* ── Premium lock card ── */
  .md-premium-card {
    background: var(--bg-surface); border: 1px dashed rgba(99,102,241,.4);
    border-radius: 14px; padding: 24px; text-align: center;
    margin-bottom: 24px;
  }
  .md-premium-icon {
    width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 12px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(99,102,241,.1); color: var(--ac);
  }
  .md-premium-title { font-weight: 700; color: var(--tx); margin-bottom: 6px; }
  .md-premium-desc  { font-size: .8rem; color: var(--tx-2); margin-bottom: 16px; }
  .md-btn.upgrade { background: linear-gradient(135deg, var(--ac), var(--ac-2)); color: white; }
  .md-btn.upgrade:hover { opacity: .9; }
`

/* ─── Nav config ──────────────────────────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { id: 'patients',  icon: Users,           label: 'Patients'         },
  { id: 'agenda',    icon: CalendarDays,    label: 'Agenda'           },
  { id: 'creneaux',  icon: CalendarDays,    label: 'Créneaux'         },
  { id: 'messages',  icon: MessageSquare,   label: 'Messages', isLink: '/apps/medical/messagerie' },
  { id: 'analytics', icon: TrendingUp,      label: 'Analytics', isLink: '/apps/medical/analytics' },
  { id: 'ia',        icon: Activity,         label: 'IA', isLink: '/apps/medical/ai' },
  { id: 'parametres',icon: Settings,        label: 'Paramètres'       },
]

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}
function initials(fn, ln) {
  return `${(fn||'')[0]||''}${(ln||'')[0]||''}`.toUpperCase()
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function DoctorDashboard() {
  const router = useRouter()

  // Auth
  const [user,      setUser]      = useState(null)
  const [doctor,    setDoctor]    = useState(null)
  const [loading,   setLoading]   = useState(true)

  // UI
  const [tab,       setTab]       = useState('dashboard')
  const [sideOpen,  setSideOpen]  = useState(true)
  const [dark,      setDark]      = useState(true)
  const [toast,     setToast]     = useState(null)
  const toastRef = useRef(null)

  // Data
  const [stats,     setStats]     = useState(null)
  const [queue,     setQueue]     = useState([])
  const [patients,  setPatients]  = useState([])
  const [agendaAppts, setAgendaAppts] = useState([])
  const [loadingQueue,    setLoadingQueue]    = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [searchQuery,     setSearchQuery]     = useState('')

  // Modal
  const [showNewPatient,  setShowNewPatient]  = useState(false)
  const [showProfile,     setShowProfile]     = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [accountForm,     setAccountForm]     = useState({ email:'', phone:'', password:'', first_name:'', last_name:'' })
  const [showNewAppt,     setShowNewAppt]     = useState(false)
  const [patientsForModal, setPatientsForModal] = useState([])
  const [saving,          setSaving]          = useState(false)

  // Forms
  const [ptForm,  setPtForm]  = useState({ first_name:'', last_name:'', birth_date:'', gender:'', blood_type:'', phone:'', email:'', city:'Tunis' })
  const [apptForm, setApptForm] = useState({ patient_id:'', scheduled_at:'', duration_min:30, type:'presentiel', reason:'' })

  /* ── Toast helper ── */
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3200)
  }

  /* ── Auth guard ── */
  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }

        const { data: userData } = await supabase
          .from('users')
          .select('role, tenant_id, app_type')
          .eq('id', u.id)
          .maybeSingle()

        if (!userData || userData.role !== 'tenant_admin' || userData.app_type !== 'medical') {
          router.push('/apps/medical/login'); return
        }

        setUser({ ...u, ...userData })

        // Charger le profil tenant
        const { data: tenantData } = await supabase
          .from('med_tenants')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .maybeSingle()

        setDoctor(tenantData)
      } catch {
        router.push('/apps/medical/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  /* ── Charger les stats du jour ── */
  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [apptRes, ptRes] = await Promise.all([
        supabase.from('med_appointments')
          .select('id, status, type')
          .gte('scheduled_at', `${today}T00:00:00`)
          .lte('scheduled_at', `${today}T23:59:59`),
        supabase.from('med_patients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
      ])
      const list = apptRes.data || []
      setStats({
        total_today:  list.length,
        confirmed:    list.filter(a => a.status === 'confirmed').length,
        done:         list.filter(a => a.status === 'done').length,
        new_patients: ptRes.count || 0,
      })
    } catch { /* silencieux */ }
  }, [])

  /* ── Charger la file d'attente ── */
  const loadQueue = useCallback(async () => {
    setLoadingQueue(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('med_appointments')
        .select(`
          id, scheduled_at, duration_min, type, status, reason,
          patient:med_patients(id, first_name, last_name, phone, allergies)
        `)
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at', { ascending: true })
      setQueue(data || [])
    } catch { /* silencieux */ }
    setLoadingQueue(false)
  }, [])

  /* ── Charger patients ── */
  const loadPatients = useCallback(async (search = '') => {
    setLoadingPatients(true)
    try {
      let q = supabase.from('med_patients')
        .select('id, first_name, last_name, birth_date, gender, blood_type, phone, allergies, chronic_cond, last_visit')
        .order('last_name', { ascending: true })
        .limit(40)
      if (search.trim()) {
        q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
      }
      const { data } = await q
      setPatients(data || [])
    } catch { /* silencieux */ }
    setLoadingPatients(false)
  }, [])

  /* ── Charger agenda semaine ── */
  const loadAgenda = useCallback(async () => {
    try {
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); start.setHours(0,0,0,0)
      const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59)
      const { data } = await supabase
        .from('med_appointments')
        .select(`id, scheduled_at, duration_min, type, status, reason, patient:med_patients(id, first_name, last_name)`)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true })
      setAgendaAppts(data || [])
    } catch { /* silencieux */ }
  }, [])

  /* ── Data loading par tab ── */
  useEffect(() => {
    if (!user) return
    if (tab === 'dashboard') { loadStats(); loadQueue() }
    if (tab === 'patients')  { loadPatients(searchQuery) }
    if (tab === 'agenda')    { loadAgenda() }
  }, [tab, user, loadStats, loadQueue, loadPatients, loadAgenda, searchQuery])

  /* ── Ouvrir modal RDV + charger patients ── */
  async function openNewAppt() {
    setShowNewAppt(true)
    if (patientsForModal.length === 0) {
      try {
        const { data } = await supabase.from('med_patients')
          .select('id, first_name, last_name')
          .order('last_name', { ascending: true })
          .limit(100)
        setPatientsForModal(data || [])
      } catch { /* silencieux */ }
    }
  }

  /* ── Mettre à jour statut RDV ── */
  async function updateStatus(apptId, status) {
    try {
      await supabase.from('med_appointments')
        .update({ status }).eq('id', apptId)
      setQueue(q => q.map(a => a.id === apptId ? { ...a, status } : a))
      showToast(status === 'done' ? 'Consultation terminée' : 'Statut mis à jour')
      loadStats()
    } catch {
      showToast('Erreur de mise à jour', 'error')
    }
  }

  /* ── Créer patient ── */
  async function handleCreatePatient(e) {
    e.preventDefault()
    if (!ptForm.first_name.trim() || !ptForm.last_name.trim()) {
      showToast('Prénom et nom requis', 'error'); return
    }
    setSaving(true)
    try {
      await supabase.from('med_patients').insert({
        ...ptForm,
        tenant_id:   user.tenant_id,
        created_by:  user.id,
        allergies:   [],
        chronic_cond:[],
        current_meds:[],
      })
      showToast('Patient créé avec succès')
      setShowNewPatient(false)
      setPtForm({ first_name:'', last_name:'', birth_date:'', gender:'', blood_type:'', phone:'', email:'', city:'Tunis' })
      loadPatients(searchQuery)
    } catch {
      showToast('Erreur lors de la création', 'error')
    }
    setSaving(false)
  }

  /* ── Créer RDV ── */
  async function handleCreateAppt(e) {
    e.preventDefault()
    if (!apptForm.patient_id || !apptForm.scheduled_at) {
      showToast('Patient et date/heure requis', 'error'); return
    }
    setSaving(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      await supabase.from('med_appointments').insert({
        ...apptForm,
        tenant_id:  user.tenant_id,
        status:     'pending',
        created_by: user.id,
      })
      showToast('Rendez-vous créé')
      setShowNewAppt(false)
      setApptForm({ patient_id:'', scheduled_at:'', duration_min:30, type:'presentiel', reason:'' })
      if (tab === 'dashboard') { loadQueue(); loadStats() }
      if (tab === 'agenda')    { loadAgenda() }
    } catch {
      showToast('Erreur lors de la création', 'error')
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/apps/medical/login')
  }

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="md-skeleton" style={{ width:180, height:8, borderRadius:4, margin:'0 auto 12px' }} />
        <div className="md-skeleton" style={{ width:120, height:8, borderRadius:4, margin:'0 auto' }} />
      </div>
    </div>
  )

  const doctorName = doctor?.doctor_name || user?.email || 'Médecin'
  const isPremium  = true // Toutes features débloquées pour tous les médecins

  /* ── RENDER ── */
  return (
    <>
      <style>{CSS}</style>

      <div className="md-root">
        {/* ── Topbar ── */}
        <div className="md-topbar">
          <button className="md-icon-btn" style={{ display:'none' }} onClick={() => setSideOpen(o => !o)}>
            <Menu size={18} />
          </button>
          <span className="md-topbar-logo">MediLink OS</span>
          <span className="md-topbar-badge">{doctor?.specialty || 'Médecine générale'}</span>
          <span className="md-topbar-sep" />
          <button className="md-icon-btn" onClick={toggleDark} title="Mode sombre">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="md-icon-btn" title="Notifications">
            <Bell size={16} />
          </button>
          <div className="md-topbar-avatar" title={doctorName} onClick={() => setShowProfile(true)} style={{ cursor:'pointer' }}>
            {doctorName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="md-body">
          {/* ── Sidebar ── */}
          <div className={`md-sidebar ${sideOpen ? 'md-sidebar--open' : 'md-sidebar--closed'}`}>
            <div className="md-sb-logo">
              <span className="md-sb-logo-text">MediLink OS</span>
              <button className="md-sb-toggle" onClick={() => setSideOpen(o => !o)}>
                {sideOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            <nav className="md-sb-nav">
              {NAV.map(item => (
                <div
                  key={item.id}
                  className={`md-sb-item ${tab === item.id ? 'active' : ''}`}
                  onClick={() => item.isLink ? router.push(item.isLink) : setTab(item.id)}
                  title={item.label}
                >
                  <item.icon size={17} />
                  <span className="md-sb-label">{item.label}</span>
                  {item.badge > 0 && <span className="md-sb-badge">{item.badge}</span>}
                </div>
              ))}
            </nav>

            <div className="md-sb-footer">
              <button className="md-sb-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="md-sb-label">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <main className="md-content">

            {/* ══ TAB : DASHBOARD ══ */}
            {tab === 'dashboard' && (
              <>
                <div className="md-section-header">
                  <div>
                    <div className="md-section-title">
                      Bonjour, Dr {doctorName.split(' ').pop()} 👋
                    </div>
                    <div className="md-section-sub">
                      {new Date().toLocaleDateString('fr-TN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                    </div>
                  </div>
                  <button className="md-icon-btn" onClick={() => { loadStats(); loadQueue() }} title="Rafraîchir">
                    <RefreshCw size={15} />
                  </button>
                </div>

                {/* KPIs */}
                <div className="md-kpi-grid">
                  <div className="md-kpi-card blue">
                    <div className="md-kpi-label">RDV aujourd'hui</div>
                    <div className="md-kpi-value">{stats?.total_today ?? '—'}</div>
                    <div className="md-kpi-sub">{stats?.confirmed ?? 0} confirmés · {stats?.done ?? 0} terminés</div>
                    <div className="md-kpi-icon"><CalendarDays size={40} color="#0EA5E9" /></div>
                  </div>
                  <div className="md-kpi-card green">
                    <div className="md-kpi-label">Consultations</div>
                    <div className="md-kpi-value">{stats?.done ?? '—'}</div>
                    <div className="md-kpi-sub">Terminées ce jour</div>
                    <div className="md-kpi-icon"><CheckCircle2 size={40} color="#10B981" /></div>
                  </div>
                  <div className="md-kpi-card gold">
                    <div className="md-kpi-label">Nouveaux patients</div>
                    <div className="md-kpi-value">{stats?.new_patients ?? '—'}</div>
                    <div className="md-kpi-sub">Enregistrés aujourd'hui</div>
                    <div className="md-kpi-icon"><UserPlus size={40} color="#F59E0B" /></div>
                  </div>
                  <div className="md-kpi-card violet">
                    <div className="md-kpi-label">Téléconsultations</div>
                    <div className="md-kpi-value">{isPremium ? '0' : '—'}</div>
                    <div className="md-kpi-sub">{isPremium ? 'Ce mois' : 'Premium requis'}</div>
                    <div className="md-kpi-icon"><Video size={40} color="#6366F1" /></div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="md-section-header">
                  <div className="md-section-title" style={{ fontSize:'1rem' }}>Actions rapides</div>
                </div>
                <div className="md-quick-grid" style={{ marginBottom: 28 }}>
                  <button className="md-quick-btn" onClick={() => setShowNewPatient(true)}>
                    <div className="md-quick-icon blue"><UserPlus size={20} /></div>
                    Nouveau patient
                  </button>
                  <button className="md-quick-btn" onClick={() => { openNewAppt() }}>
                    <div className="md-quick-icon green"><CalendarDays size={20} /></div>
                    Prendre RDV
                  </button>
                  <button className="md-quick-btn" onClick={() => setTab('patients')}>
                    <div className="md-quick-icon gold"><Stethoscope size={20} /></div>
                    Consultation
                  </button>
                  <button className="md-quick-btn" onClick={() => router.push('/apps/medical/telemedicine')}>
                    <div className="md-quick-icon violet"><Video size={20}/></div>
                    Télémédecine
                  </button>
                </div>

                {/* File d'attente */}
                <div className="md-queue">
                  <div className="md-queue-header">
                    <div className="md-queue-title">
                      <div className="md-live-dot" />
                      File d'attente — Aujourd'hui
                    </div>
                    <button className="md-icon-btn" onClick={loadQueue} title="Rafraîchir">
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {loadingQueue ? (
                    <div style={{ padding: '20px' }}>
                      {[1,2,3].map(i => (
                        <div key={i} className="md-skeleton" style={{ height:56, marginBottom:8, borderRadius:10 }} />
                      ))}
                    </div>
                  ) : queue.length === 0 ? (
                    <div className="md-queue-empty">
                      <CalendarDays size={32} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }} />
                      Aucun rendez-vous aujourd'hui
                    </div>
                  ) : (
                    queue.map((appt, idx) => {
                      const p = appt.patient || {}
                      const critAllergies = (p.allergies || []).filter(a => a.severity === 'CRITIQUE')
                      return (
                        <div key={appt.id} className="md-queue-item">
                          <div className="md-queue-num">{idx + 1}</div>
                          <div className="md-queue-info">
                            <div className="md-queue-name">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="md-queue-time">
                              <Clock size={11} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />
                              {formatTime(appt.scheduled_at)} · {appt.duration_min} min
                              {appt.type === 'telemedicine' && (
                                <span style={{ marginLeft:6, color:'var(--ac)', fontSize:'.65rem', fontWeight:700 }}>
                                  · Vidéo
                                </span>
                              )}
                            </div>
                            {critAllergies.length > 0 && (
                              <div className="md-allergy-alert">
                                <AlertCircle size={11} color="#DC2626" />
                                {critAllergies.map(a => (
                                  <span key={a.name} className="md-allergy-crit">⚠ {a.name}</span>
                                ))}
                              </div>
                            )}
                            {appt.reason && (
                              <div style={{ fontSize:'.72rem', color:'var(--tx-3)', marginTop:2 }}>
                                {appt.reason}
                              </div>
                            )}
                          </div>
                          <span className={`md-status-badge md-status-${appt.status}`}>
                            {appt.status === 'pending'   ? 'En attente'  :
                             appt.status === 'confirmed' ? 'Confirmé'    :
                             appt.status === 'done'      ? 'Terminé'     : 'Annulé'}
                          </span>
                          <div className="md-queue-actions">
                            {appt.status === 'pending' && (
                              <button className="md-qa-btn primary"
                                onClick={() => updateStatus(appt.id, 'confirmed')}>
                                Confirmer
                              </button>
                            )}
                            {appt.status === 'confirmed' && (
                              <button className="md-qa-btn primary"
                                onClick={() => updateStatus(appt.id, 'done')}>
                                Terminer
                              </button>
                            )}
                            {['pending','confirmed'].includes(appt.status) && (
                              <button className="md-qa-btn danger"
                                onClick={() => updateStatus(appt.id, 'cancelled')}>
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {/* ══ TAB : PATIENTS ══ */}
            {tab === 'patients' && (
              <>
                <div className="md-section-header">
                  <div>
                    <div className="md-section-title">Patients</div>
                    <div className="md-section-sub">{patients.length} patient(s) chargé(s)</div>
                  </div>
                  <button className="md-btn primary" onClick={() => setShowNewPatient(true)}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Plus size={15} /> Nouveau patient
                  </button>
                </div>

                <div className="md-search-bar">
                  <Search size={16} color="var(--tx-3)" />
                  <input
                    placeholder="Rechercher par nom, prénom…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); loadPatients(e.target.value) }}
                  />
                </div>

                {loadingPatients ? (
                  <div className="md-patient-grid">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="md-skeleton" style={{ height:110, borderRadius:12 }} />
                    ))}
                  </div>
                ) : patients.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--tx-3)' }}>
                    <Users size={40} style={{ margin:'0 auto 12px', display:'block', opacity:.3 }} />
                    {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
                  </div>
                ) : (
                  <div className="md-patient-grid">
                    {patients.map(pt => {
                      const age = calcAge(pt.birth_date)
                      const critAllergies = (pt.allergies||[]).filter(a=>a.severity==='CRITIQUE')
                      const modAllergies  = (pt.allergies||[]).filter(a=>a.severity==='MODERE')
                      return (
                        <div key={pt.id} className="md-patient-card" onClick={() => router.push(`/apps/medical/patient-detail?id=${pt.id}`)} style={{ cursor:"pointer" }}>
                          <div className="md-patient-header">
                            <div className="md-patient-avatar">
                              {initials(pt.first_name, pt.last_name)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="md-patient-name">{pt.first_name} {pt.last_name}</div>
                              <div className="md-patient-meta">
                                {age ? `${age} ans` : ''}
                                {age && pt.blood_type ? ' · ' : ''}
                                {pt.blood_type && <span style={{ color:'#DC2626', fontWeight:700 }}>{pt.blood_type}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="md-patient-tags">
                            {critAllergies.map(a => (
                              <span key={a.name} className="md-tag allergy-crit">⚠ {a.name}</span>
                            ))}
                            {modAllergies.map(a => (
                              <span key={a.name} className="md-tag allergy-mod">{a.name}</span>
                            ))}
                            {(pt.chronic_cond||[]).slice(0,2).map(c => (
                              <span key={c} className="md-tag chronic">{c}</span>
                            ))}
                          </div>
                          {pt.last_visit && (
                            <div style={{ fontSize:'.7rem', color:'var(--tx-3)', marginTop:8 }}>
                              Dernière visite : {formatDate(pt.last_visit)}
                            </div>
                          )}
                          {pt.phone && (
                            <div style={{ fontSize:'.72rem', color:'var(--tx-3)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                              <Phone size={11} /> {pt.phone}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ══ TAB : AGENDA ══ */}
            {tab === 'agenda' && (
              <>
                <div className="md-section-header">
                  <div>
                    <div className="md-section-title">Agenda</div>
                    <div className="md-section-sub">Semaine du {
                      (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()+1); return formatDate(d.toISOString()) })()
                    }</div>
                  </div>
                  <button className="md-btn primary" onClick={() => { openNewAppt() }}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Plus size={15} /> Nouveau RDV
                  </button>
                </div>
                <div className="md-queue">
                  <div className="md-queue-header">
                    <div className="md-queue-title">Rendez-vous de la semaine</div>
                    <button className="md-icon-btn" onClick={loadAgenda}><RefreshCw size={14} /></button>
                  </div>
                  {agendaAppts.length === 0 ? (
                    <div className="md-queue-empty">
                      <CalendarDays size={32} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }} />
                      Aucun rendez-vous cette semaine
                    </div>
                  ) : agendaAppts.map((appt, idx) => {
                    const p = appt.patient || {}
                    return (
                      <div key={appt.id} className="md-queue-item">
                        <div className="md-queue-num">{idx+1}</div>
                        <div className="md-queue-info">
                          <div className="md-queue-name">{p.first_name} {p.last_name}</div>
                          <div className="md-queue-time">
                            {new Date(appt.scheduled_at).toLocaleDateString('fr-TN',{weekday:'short',day:'numeric',month:'short'})}
                            {' à '}{formatTime(appt.scheduled_at)} · {appt.duration_min}min
                            {appt.type==='telemedicine' && <span style={{color:'var(--ac)',marginLeft:6,fontWeight:700}}>· Vidéo</span>}
                          </div>
                          {appt.reason && <div style={{fontSize:'.72rem',color:'var(--tx-3)',marginTop:2}}>{appt.reason}</div>}
                        </div>
                        <span className={`md-status-badge md-status-${appt.status}`}>
                          {appt.status==='pending'?'En attente':appt.status==='confirmed'?'Confirmé':appt.status==='done'?'Terminé':'Annulé'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ══ TAB : MESSAGES ══ */}
            {tab === 'messages' && (
              <>
                <div className="md-section-header">
                  <div className="md-section-title">Messagerie</div>
                </div>
                <div className="md-queue">
                  <div className="md-queue-header">
                    <div className="md-queue-title">Messages internes</div>
                  </div>
                  <div className="md-queue-empty">
                    <MessageSquare size={32} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }} />
                    Module messagerie — Prochainement
                  </div>
                </div>
              </>
            )}

            {/* ══ TAB : PARAMÈTRES ══ */}
            {tab === 'parametres' && (
              <>
                <div className="md-section-header">
                  <div className="md-section-title">Paramètres</div>
                </div>

                {/* Profil */}
                <div className="md-queue" style={{ marginBottom: 20 }}>
                  <div className="md-queue-header">
                    <div className="md-queue-title">Profil médecin</div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div className="md-form-row">
                      <div className="md-form-group">
                        <label className="md-label">Nom complet</label>
                        <input className="md-input" defaultValue={doctor?.doctor_name || ''} />
                      </div>
                      <div className="md-form-group">
                        <label className="md-label">Spécialité</label>
                        <input className="md-input" defaultValue={doctor?.specialty || ''} />
                      </div>
                    </div>
                    <div className="md-form-group">
                      <label className="md-label">Téléphone cabinet</label>
                      <input className="md-input" defaultValue={doctor?.phone || ''} type="tel" />
                    </div>
                    <div className="md-form-group">
                      <label className="md-label">Adresse</label>
                      <input className="md-input" defaultValue={doctor?.address || ''} />
                    </div>
                  </div>
                </div>

                {/* Abonnement */}
                <div className={`md-${isPremium ? 'queue' : 'premium-card'}`} style={{ marginBottom: 20 }}>
                  {!isPremium ? (
                    <>
                      <div className="md-premium-icon"><Lock size={22} /></div>
                      <div className="md-premium-title">Abonnement Support Mensuel</div>
                      <div className="md-premium-desc">
                        Débloquez la télémédecine, l'assistant IA, l'analyse d'images et les analytics avancés.
                      </div>
                      <button className="md-btn upgrade"
                        onClick={() => showToast('Contactez BizFlow TN pour activer le support mensuel')}>
                        Activer le support mensuel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="md-queue-header">
                        <div className="md-queue-title">Abonnement actif ✓</div>
                      </div>
                      <div style={{ padding:'16px 20px', fontSize:'.85rem', color:'var(--tx-2)' }}>
                        Support mensuel actif · Toutes les fonctionnalités premium débloquées
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            {/* ══ TAB : CRÉNEAUX ══ */}
            {tab === 'creneaux' && user && (
              <>
                <div className="md-section-header">
                  <div>
                    <div className="md-section-title">Créneaux & Agenda</div>
                    <div className="md-section-sub">Cliquez sur un créneau libre pour réserver</div>
                  </div>
                </div>
                <MedicalCalendar
                  tenantId={user.tenant_id}
                  userId={user.id}
                  userRole={user.role}
                  readOnly={false}
                />
              </>
            )}
          </main>
        </div>

        {/* ── Bottom Nav (mobile) ── */}
        <div className="md-bottom-nav">
          <nav className="md-bn-inner">
            {NAV.map(item => (
              <button key={item.id} className={`md-bn-item ${tab===item.id?'active':''}`}
                onClick={() => item.isLink ? router.push(item.isLink) : setTab(item.id)}>
                <item.icon />
                {item.label.split(' ')[0]}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Modal Nouveau Patient ── */}
      {showNewPatient && (
        <div className="md-modal-bg" onClick={e => e.target===e.currentTarget && setShowNewPatient(false)}>
          <div className="md-modal">
            <div className="md-modal-title">
              <UserPlus size={20} color="#0EA5E9" />
              Nouveau patient
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="md-form-row">
                <div className="md-form-group">
                  <label className="md-label">Prénom *</label>
                  <input className="md-input" required maxLength={100}
                    value={ptForm.first_name}
                    onChange={e => setPtForm(f=>({...f, first_name:e.target.value}))} />
                </div>
                <div className="md-form-group">
                  <label className="md-label">Nom *</label>
                  <input className="md-input" required maxLength={100}
                    value={ptForm.last_name}
                    onChange={e => setPtForm(f=>({...f, last_name:e.target.value}))} />
                </div>
              </div>
              <div className="md-form-row">
                <div className="md-form-group">
                  <label className="md-label">Date de naissance</label>
                  <input className="md-input" type="date"
                    value={ptForm.birth_date}
                    onChange={e => setPtForm(f=>({...f, birth_date:e.target.value}))} />
                </div>
                <div className="md-form-group">
                  <label className="md-label">Sexe</label>
                  <select className="md-select"
                    value={ptForm.gender}
                    onChange={e => setPtForm(f=>({...f, gender:e.target.value}))}>
                    <option value="">— Sélectionner —</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              <div className="md-form-row">
                <div className="md-form-group">
                  <label className="md-label">Téléphone</label>
                  <input className="md-input" type="tel" maxLength={20}
                    value={ptForm.phone}
                    onChange={e => setPtForm(f=>({...f, phone:e.target.value}))} />
                </div>
                <div className="md-form-group">
                  <label className="md-label">Groupe sanguin</label>
                  <select className="md-select"
                    value={ptForm.blood_type}
                    onChange={e => setPtForm(f=>({...f, blood_type:e.target.value}))}>
                    <option value="">— Sélectionner —</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md-form-group">
                <label className="md-label">Email</label>
                <input className="md-input" type="email" maxLength={254}
                  value={ptForm.email}
                  onChange={e => setPtForm(f=>({...f, email:e.target.value}))} />
              </div>
              <div className="md-form-group">
                <label className="md-label">Ville</label>
                <input className="md-input" maxLength={100}
                  value={ptForm.city}
                  onChange={e => setPtForm(f=>({...f, city:e.target.value}))} />
              </div>
              <div className="md-modal-actions">
                <button type="button" className="md-btn ghost" onClick={() => setShowNewPatient(false)}>
                  Annuler
                </button>
                <button type="submit" className="md-btn primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Créer le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Nouveau RDV ── */}
      {showNewAppt && (
        <div className="md-modal-bg" onClick={e => e.target===e.currentTarget && setShowNewAppt(false)}>
          <div className="md-modal">
            <div className="md-modal-title">
              <CalendarDays size={20} color="#0EA5E9" />
              Nouveau rendez-vous
            </div>
            <form onSubmit={handleCreateAppt}>
              <div className="md-form-group">
                <label className="md-label">Patient *</label>
                <select className="md-select" required
                  value={apptForm.patient_id}
                  onChange={e => setApptForm(f=>({...f, patient_id:e.target.value}))}>
                  <option value="">— Sélectionner un patient —</option>
                  {(patientsForModal.length > 0 ? patientsForModal : patients).map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="md-form-group">
                <label className="md-label">Date et heure *</label>
                <input className="md-input" type="datetime-local" required
                  value={apptForm.scheduled_at}
                  onChange={e => setApptForm(f=>({...f, scheduled_at:e.target.value}))} />
              </div>
              <div className="md-form-row">
                <div className="md-form-group">
                  <label className="md-label">Durée (min)</label>
                  <select className="md-select"
                    value={apptForm.duration_min}
                    onChange={e => setApptForm(f=>({...f, duration_min:+e.target.value}))}>
                    {[15,20,30,45,60,90].map(d=>(
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div className="md-form-group">
                  <label className="md-label">Type</label>
                  <select className="md-select"
                    value={apptForm.type}
                    onChange={e => setApptForm(f=>({...f, type:e.target.value}))}>
                    <option value="presentiel">Présentiel</option>
                    <option value="telemedicine" disabled={!isPremium}>
                      Télémédecine {!isPremium ? '(Premium)' : ''}
                    </option>
                  </select>
                </div>
              </div>
              <div className="md-form-group">
                <label className="md-label">Motif</label>
                <input className="md-input" maxLength={500}
                  placeholder="Motif de la consultation…"
                  value={apptForm.reason}
                  onChange={e => setApptForm(f=>({...f, reason:e.target.value}))} />
              </div>
              <div className="md-modal-actions">
                <button type="button" className="md-btn ghost" onClick={() => setShowNewAppt(false)}>
                  Annuler
                </button>
                <button type="submit" className="md-btn primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Créer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ProfileModal ── */}
      {showProfile && user && (
        <ProfileModal
          user={{ ...user, full_name: doctorName }}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`md-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  )
}
