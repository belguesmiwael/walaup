/**
 * pwa.js — PWA Install System
 * Handles beforeinstallprompt, iOS Safari hint, and banner display.
 * SSR-safe.
 */

import { WalaupSound } from './sound'

const STORAGE_KEY = 'walaup_install_dismissed'
const BANNER_DELAY_MS = 3500

let _deferredPrompt = null

export function initPWA() {
  if (typeof window === 'undefined') return

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }, { once: true })
  }

  // Capture install prompt (Android/Desktop Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferredPrompt = e

    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      setTimeout(showInstallBanner, BANNER_DELAY_MS)
    }
  })

  // Wire install button (if any in nav)
  const installBtn = document.getElementById('pwa-install-btn')
  if (installBtn) {
    installBtn.hidden = false
    installBtn.addEventListener('click', triggerInstall)
  }

  // Wire banner buttons
  const bannerConfirm = document.getElementById('install-banner-confirm')
  const bannerDismiss = document.getElementById('install-banner-dismiss')

  if (bannerConfirm) bannerConfirm.addEventListener('click', triggerInstall)
  if (bannerDismiss) bannerDismiss.addEventListener('click', dismissBanner)

  // iOS Safari hint
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isStandalone = window.navigator.standalone === true

  if (isIOS && isSafari && !isStandalone) {
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      setTimeout(showIOSHint, BANNER_DELAY_MS + 500)
    }
  }

  // Hide banner when app is installed
  window.addEventListener('appinstalled', () => {
    hideBanner()
    WalaupSound.install()
    if (window.WalaupToast) window.WalaupToast.success('Application installée avec succès !')
  })
}

/* ── Banner ───────────────────────────────────────────────── */
function showInstallBanner() {
  const banner = document.getElementById('install-banner')
  if (banner) banner.hidden = false
}

function hideBanner() {
  const banner = document.getElementById('install-banner')
  if (banner) {
    banner.style.animation = 'banner-out 0.3s ease-in forwards'
    banner.addEventListener('animationend', () => { banner.hidden = true }, { once: true })
  }
}

function dismissBanner() {
  WalaupSound.click()
  sessionStorage.setItem(STORAGE_KEY, '1')
  hideBanner()
}

async function triggerInstall() {
  if (!_deferredPrompt) return

  WalaupSound.click()
  hideBanner()

  try {
    await _deferredPrompt.prompt()
    const choice = await _deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      WalaupSound.install()
    }
  } catch {}

  _deferredPrompt = null
}

/* ── iOS Hint ─────────────────────────────────────────────── */
function showIOSHint() {
  // Create a dismissible iOS-specific hint
  const existing = document.getElementById('ios-install-hint')
  if (existing) return

  const hint = document.createElement('div')
  hint.id = 'ios-install-hint'
  hint.style.cssText = `
    position: fixed;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    left: 16px;
    right: 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-accent);
    border-radius: 20px;
    padding: 16px;
    z-index: 50;
    font-family: var(--font-body);
    box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    animation: banner-in 0.4s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) forwards;
    display: flex;
    align-items: center;
    gap: 12px;
  `

  hint.innerHTML = `
    <div style="flex:1;font-size:0.875rem;color:var(--tx-2);line-height:1.5">
      <strong style="color:var(--tx);display:block;margin-bottom:4px">Installer Walaup</strong>
      Appuyez sur <strong style="color:var(--ac)">Partager</strong>
      puis <strong style="color:var(--ac)">"Sur l'écran d'accueil"</strong>
    </div>
    <button id="ios-hint-close" style="
      width:32px;height:32px;border-radius:50%;
      background:var(--bg-hover);border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      color:var(--tx-3);flex-shrink:0;font-size:18px;
    ">×</button>
  `

  document.body.appendChild(hint)

  document.getElementById('ios-hint-close')?.addEventListener('click', () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    hint.style.opacity = '0'
    hint.style.transform = 'translateY(20px)'
    hint.style.transition = 'all 0.25s ease-in'
    setTimeout(() => hint.remove(), 300)
  })
}
