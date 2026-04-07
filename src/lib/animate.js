/**
 * animate.js — Walaup Animation System
 * SSR-safe: all functions guard typeof window.
 * Exports:
 *   initScrollAnimations()   — IntersectionObserver for [data-animate] + [data-stagger]
 *   initTiltCards()          — 3D tilt on .card--tilt
 *   initMagneticButtons()    — Magnetic pull on .btn-magnetic
 *   initCursorGlow()         — Cursor radial glow (desktop only)
 *   initScrollProgress()     — Top scroll progress bar
 *   animateCounter()         — Animated number counter
 *   typewriter()             — Typewriter text effect
 *   ParticleSystem           — Canvas particle system class
 */

/* ── 1. SCROLL REVEAL ─────────────────────────────────────── */
/**
 * Observes all [data-animate] and [data-stagger] elements
 * and adds 'animate-in' class when they enter the viewport.
 * Safe to call multiple times — re-observes new elements only.
 */
let _scrollObserver = null

export function initScrollAnimations() {
  if (typeof window === 'undefined') return

  // Disconnect existing observer before re-init
  if (_scrollObserver) _scrollObserver.disconnect()

  _scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
          _scrollObserver.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    }
  )

  document
    .querySelectorAll('[data-animate]:not(.animate-in), [data-stagger]:not(.animate-in)')
    .forEach((el) => _scrollObserver.observe(el))
}

/* ── 2. CARD SPOTLIGHT + TILT + MOBILE SCROLL ACTIVATION ─── */
/**
 * Desktop : mouse-tracking spotlight (radial glow + inner depth)
 * Mobile  : IntersectionObserver active le spotlight au scroll
 *           descente → active, remontée → désactive
 */
const _cardListeners = new WeakMap()
let   _lastScrollY   = 0
let   _mobileObserver = null

export function initTiltCards() {
  if (typeof window === 'undefined') return

  const isFine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const isMobile = !isFine

  /* ── Desktop : mouse-tracking ── */
  if (isFine) {
    document.querySelectorAll('.card').forEach((card) => {
      if (_cardListeners.has(card)) return

      const onMove = (e) => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        card.style.setProperty('--mx', x + 'px')
        card.style.setProperty('--my', y + 'px')
        card.classList.add('_spotlight-active')

        if (card.classList.contains('card--tilt')) {
          const dx = (x - rect.width  / 2) / (rect.width  / 2)
          const dy = (y - rect.height / 2) / (rect.height / 2)
          card.style.transform =
            `perspective(900px) rotateX(${dy * -6}deg) rotateY(${dx * 6}deg) translateZ(6px)`
        }
      }

      const onLeave = () => {
        card.classList.remove('_spotlight-active')
        if (card.classList.contains('card--tilt')) card.style.transform = ''
      }

      card.addEventListener('mousemove', onMove, { passive: true })
      card.addEventListener('mouseleave', onLeave)
      _cardListeners.set(card, { onMove, onLeave })
    })
    return
  }

  /* ── Mobile : IntersectionObserver + direction scroll ── */
  if (_mobileObserver) _mobileObserver.disconnect()

  // Mettre le centre du spotlight au centre de chaque carte
  document.querySelectorAll('.card').forEach((card) => {
    card.style.setProperty('--mx', '50%')
    card.style.setProperty('--my', '50%')
  })

  _mobileObserver = new IntersectionObserver(
    (entries) => {
      const scrollingDown = window.scrollY >= _lastScrollY

      entries.forEach((entry) => {
        const card = entry.target
        if (entry.isIntersecting && scrollingDown) {
          // Carte entre dans le viewport en descendant → activer
          card.classList.add('_spotlight-active')
        } else if (!entry.isIntersecting && !scrollingDown) {
          // Carte sort du viewport en remontant → désactiver
          card.classList.remove('_spotlight-active')
        } else if (!entry.isIntersecting) {
          card.classList.remove('_spotlight-active')
        }
      })

      _lastScrollY = window.scrollY
    },
    {
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px',
    }
  )

  document.querySelectorAll('.card').forEach((card) => {
    _mobileObserver.observe(card)
  })

  // Tracker la direction du scroll
  window.addEventListener('scroll', () => {
    _lastScrollY = window.scrollY
  }, { passive: true })
}

/* ── 3. MAGNETIC BUTTONS ──────────────────────────────────── */
/**
 * Applies a magnetic pull effect to .btn-magnetic elements.
 * The button moves slightly toward the cursor.
 */
const _magneticListeners = new WeakMap()

export function initMagneticButtons() {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  document.querySelectorAll('.btn-magnetic').forEach((btn) => {
    if (_magneticListeners.has(btn)) return

    const onMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      btn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`
    }

    const onLeave = () => {
      btn.style.transform = ''
    }

    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    _magneticListeners.set(btn, { onMove, onLeave })
  })
}

/* ── 4. CURSOR GLOW ───────────────────────────────────────── */
/**
 * Moves the #cursor-glow element with the cursor.
 * CSS handles visibility (only on hover-capable devices).
 */
let _cursorGlowInit = false

export function initCursorGlow() {
  if (typeof window === 'undefined') return
  if (_cursorGlowInit) return
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const glow = document.getElementById('cursor-glow')
  if (!glow) return

  _cursorGlowInit = true

  let rafId = null
  let mouseX = 0, mouseY = 0
  let glowX = 0, glowY = 0

  const lerp = (a, b, t) => a + (b - a) * t

  const animate = () => {
    glowX = lerp(glowX, mouseX, 0.08)
    glowY = lerp(glowY, mouseY, 0.08)
    glow.style.left = glowX + 'px'
    glow.style.top = glowY + 'px'
    rafId = requestAnimationFrame(animate)
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  }, { passive: true })

  rafId = requestAnimationFrame(animate)

  // Cleanup on page unload (edge case)
  window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId), { once: true })
}

/* ── 5. SCROLL PROGRESS BAR ───────────────────────────────── */
let _scrollProgressInit = false

export function initScrollProgress() {
  if (typeof window === 'undefined') return
  if (_scrollProgressInit) return

  const bar = document.getElementById('scroll-progress')
  if (!bar) return

  _scrollProgressInit = true

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const progress = scrollTop / (scrollHeight - clientHeight)
    bar.style.transform = `scaleX(${isNaN(progress) ? 0 : progress})`
  }

  window.addEventListener('scroll', update, { passive: true })
  update()
}

/* ── 6. ANIMATED COUNTER ──────────────────────────────────── */
/**
 * Animates a number from its current value to a target.
 * @param {HTMLElement} el      — Element whose text content is updated
 * @param {number} target       — Target number
 * @param {number} [duration]   — Animation duration in ms (default 2000)
 * @param {string} [prefix]     — Prefix string (e.g. '+')
 * @param {string} [suffix]     — Suffix string (e.g. ' DT', '%')
 * @param {number} [decimals]   — Decimal places (default: auto based on target)
 */
export function animateCounter(el, target, duration = 2000, prefix = '', suffix = '', decimals = -1) {
  if (!el || typeof window === 'undefined') return

  const start = performance.now()
  const initial = parseFloat(el.dataset.counterFrom ?? el.textContent) || 0
  const isInteger = decimals === -1 ? Number.isInteger(target) : decimals === 0
  const dec = decimals === -1 ? (isInteger ? 0 : 1) : decimals

  const format = (v) =>
    prefix + (isInteger ? Math.round(v).toLocaleString('fr-TN') : v.toFixed(dec)) + suffix

  const update = (now) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // Ease out quart
    const eased = 1 - Math.pow(1 - progress, 4)
    const value = initial + (target - initial) * eased
    el.textContent = format(value)
    if (progress < 1) requestAnimationFrame(update)
  }

  requestAnimationFrame(update)
}

/**
 * Observes all [data-counter] elements and animates them on scroll into view.
 * Usage: <span data-counter="50" data-suffix="+" data-prefix="">50+</span>
 */
export function initCounters() {
  if (typeof window === 'undefined') return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const target = parseFloat(el.dataset.counter)
        const prefix = el.dataset.prefix ?? ''
        const suffix = el.dataset.suffix ?? ''
        const duration = parseInt(el.dataset.duration ?? '2000', 10)
        const decimals = parseInt(el.dataset.decimals ?? '-1', 10)
        if (!isNaN(target)) {
          animateCounter(el, target, duration, prefix, suffix, decimals)
        }
        observer.unobserve(el)
      })
    },
    { threshold: 0.4 }
  )

  document.querySelectorAll('[data-counter]').forEach((el) => observer.observe(el))
}

/* ── 7. TYPEWRITER ────────────────────────────────────────── */
/**
 * Types text into an element character by character.
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} [speed]   — ms per character
 * @param {number} [delay]   — initial delay in ms
 * @returns {Function}       — cancel function
 */
export function typewriter(el, text, speed = 45, delay = 0) {
  if (!el) return () => {}

  el.textContent = ''
  let i = 0
  let timeoutId = null
  let intervalId = null

  timeoutId = setTimeout(() => {
    intervalId = setInterval(() => {
      el.textContent += text[i++]
      if (i >= text.length) clearInterval(intervalId)
    }, speed)
  }, delay)

  return () => {
    clearTimeout(timeoutId)
    clearInterval(intervalId)
  }
}

/**
 * Cycles through multiple texts with typewriter + erase effect.
 * @param {HTMLElement} el
 * @param {string[]} texts
 * @param {Object} [opts]
 */
export function typewriterCycle(el, texts, opts = {}) {
  if (!el || !texts.length) return () => {}

  const {
    typeSpeed = 60,
    eraseSpeed = 35,
    pauseTyped = 2200,
    pauseErased = 400,
  } = opts

  let current = 0
  let charIndex = 0
  let isErasing = false
  let rafId = null
  let lastTime = 0

  const step = (timestamp) => {
    const elapsed = timestamp - lastTime
    const speed = isErasing ? eraseSpeed : typeSpeed

    if (elapsed < speed) {
      rafId = requestAnimationFrame(step)
      return
    }

    lastTime = timestamp
    const text = texts[current]

    if (!isErasing) {
      el.textContent = text.slice(0, ++charIndex)
      if (charIndex >= text.length) {
        isErasing = true
        lastTime = timestamp + pauseTyped
      }
    } else {
      el.textContent = text.slice(0, --charIndex)
      if (charIndex === 0) {
        isErasing = false
        current = (current + 1) % texts.length
        lastTime = timestamp + pauseErased
      }
    }

    rafId = requestAnimationFrame(step)
  }

  rafId = requestAnimationFrame(step)
  return () => cancelAnimationFrame(rafId)
}

/* ── 8. PARTICLE SYSTEM ───────────────────────────────────── */
/**
 * Canvas-based ambient particle system with mouse repel.
 * Usage:
 *   const canvas = document.getElementById('particles-canvas')
 *   const ps = new ParticleSystem(canvas, { count: 50 })
 *   // ps.destroy() to clean up
 */
export class ParticleSystem {
  constructor(canvas, options = {}) {
    if (!canvas || typeof window === 'undefined') return

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    this.mouse = { x: -9999, y: -9999 }
    this.animId = null

    this.options = {
      count: options.count ?? 55,
      color: options.color ?? 'rgba(99, 102, 241, 0.5)',
      maxSpeed: options.maxSpeed ?? 0.4,
      connectionDistance: options.connectionDistance ?? 130,
      mouseRepelDistance: options.mouseRepelDistance ?? 90,
      sizeMin: options.sizeMin ?? 0.8,
      sizeMax: options.sizeMax ?? 2.2,
    }

    this._onResize = this._resize.bind(this)
    this._onMouse = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY }
    this._onLeave = () => { this.mouse.x = -9999; this.mouse.y = -9999 }

    window.addEventListener('resize', this._onResize, { passive: true })
    window.addEventListener('mousemove', this._onMouse, { passive: true })
    document.addEventListener('mouseleave', this._onLeave)

    this._resize()
    this._init()
    this._animate()
  }

  _resize() {
    if (!this.canvas) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  _init() {
    const { count, maxSpeed, sizeMin, sizeMax } = this.options
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * maxSpeed,
      vy: (Math.random() - 0.5) * maxSpeed,
      size: Math.random() * (sizeMax - sizeMin) + sizeMin,
      opacity: Math.random() * 0.45 + 0.15,
    }))
  }

  _animate() {
    if (!this.ctx) return

    const { width, height } = this.canvas
    const { color, mouseRepelDistance, connectionDistance } = this.options

    this.ctx.clearRect(0, 0, width, height)

    this.particles.forEach((p, i) => {
      // Mouse repel
      const dx = p.x - this.mouse.x
      const dy = p.y - this.mouse.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < mouseRepelDistance) {
        const force = (mouseRepelDistance - dist) / mouseRepelDistance
        p.vx += (dx / dist) * force * 0.6
        p.vy += (dy / dist) * force * 0.6
      }

      // Damping
      p.vx *= 0.988
      p.vy *= 0.988

      // Move
      p.x += p.vx
      p.y += p.vy

      // Wrap edges
      if (p.x < 0) p.x = width
      if (p.x > width) p.x = 0
      if (p.y < 0) p.y = height
      if (p.y > height) p.y = 0

      // Draw particle
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fillStyle = color
      this.ctx.globalAlpha = p.opacity
      this.ctx.fill()

      // Draw connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j]
        const cdx = p.x - p2.x
        const cdy = p.y - p2.y
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy)
        if (cdist < connectionDistance) {
          const alpha = (1 - cdist / connectionDistance) * 0.12
          this.ctx.beginPath()
          this.ctx.moveTo(p.x, p.y)
          this.ctx.lineTo(p2.x, p2.y)
          this.ctx.strokeStyle = color
          this.ctx.globalAlpha = alpha
          this.ctx.lineWidth = 0.6
          this.ctx.stroke()
        }
      }
    })

    this.ctx.globalAlpha = 1
    this.animId = requestAnimationFrame(() => this._animate())
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('mousemove', this._onMouse)
    document.removeEventListener('mouseleave', this._onLeave)
  }
}

/* ── 9. TOAST SYSTEM ──────────────────────────────────────── */
/**
 * Lightweight toast notification system.
 * Does not depend on React — works with the DOM directly.
 */
const TOAST_ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
}

function showToast(message, type = 'info', duration = 4500) {
  if (typeof window === 'undefined') return

  const container = document.getElementById('toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.setAttribute('role', 'alert')
  toast.style.setProperty('--toast-duration', duration + 'ms')
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Fermer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `

  const remove = () => {
    toast.classList.add('removing')
    toast.addEventListener('animationend', () => toast.remove(), { once: true })
  }

  toast.querySelector('.toast-close').addEventListener('click', remove)
  const timer = setTimeout(remove, duration)

  // Cancel auto-remove on hover
  toast.addEventListener('mouseenter', () => clearTimeout(timer))

  container.appendChild(toast)
  return { remove }
}

export const Toast = {
  success: (msg, d) => showToast(msg, 'success', d),
  error:   (msg, d) => showToast(msg, 'error', d),
  warning: (msg, d) => showToast(msg, 'warning', d),
  info:    (msg, d) => showToast(msg, 'info', d),
}

// Register on window for non-module access
if (typeof window !== 'undefined') {
  window.WalaupToast = Toast
}
