import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

gsap.registerPlugin(ScrollTrigger);

// Immediately hide UI elements so the page is empty behind the loader mask
gsap.set('.tf-logo-link, .tf-theme-wrapper, .tf-mobile-menu-wrapper, .hero-title, .hero-subtitle', { opacity: 0, scale: 0.8 });
gsap.set('.tf-nav-btn', { y: 40, opacity: 0 });

// --- 1. Lenis Smooth Scrolling ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', (e) => {
  ScrollTrigger.update(e);
  
  // Prevent chat widget from overlapping footer
  const footer = document.getElementById('main-footer');
  const chatWidget = document.getElementById('tf-chat-widget');
  if (footer && chatWidget) {
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    if (footerRect.top < windowHeight) {
      const overlap = windowHeight - footerRect.top;
      chatWidget.style.transform = `translateY(-${overlap}px)`;
    } else {
      chatWidget.style.transform = `translateY(0px)`;
    }
  }
});

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// --- 2. Wave & Superman Page Transition ---
let isTransitioning = false;

function playPageTransition(targetSelector = null, isInitial = false) {
  if (isTransitioning) return;
  isTransitioning = true;

  const mask = document.getElementById('transition-mask');
  if (mask) mask.style.display = 'flex';

  const tl = gsap.timeline({
    onComplete: () => {
      if (mask) mask.style.display = 'none';
      isTransitioning = false;
      if (isInitial) {
        initAnimations();
      } else if (targetSelector) {
        updateActiveNav(targetSelector);
        const targetEl = document.querySelector(targetSelector);
        if (targetEl) {
          const content = targetEl.querySelector('.content');
          if (content) {
            gsap.fromTo(content, 
              { y: 40, opacity: 0 }, 
              { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
            );
          }
        }
        
        if (targetSelector === '#home') {
          initAnimations();
        }
      }
    }
  });

  const maskBlocks = Array.from(document.querySelectorAll('.tf-mask-block')).filter(
    (el) => window.getComputedStyle(el).display !== 'none'
  );
  const activeBlocks = maskBlocks.length > 0 ? maskBlocks : '.tf-mask-block';
  const staggerVal = maskBlocks.length <= 4 ? 0.1 : 0.06;

  // Reset positions for elements inside mask
  tl.set(activeBlocks, { transformOrigin: 'bottom center', scaleY: 0 })
    .set('#superman-loader', { opacity: 0, scale: 0.9, y: 0 })
    .set('.tf-mask-loader', { opacity: 1, y: 0 })
    .set('.tf-pill-item', { y: 15, opacity: 0 })
    .set('.tf-pill-bg', { scaleX: 0 })
    .set('.tf-pill-text', { color: '#ffffff' });

  // 1. Wave blocks rise up (Wave Before)
  tl.to(activeBlocks, {
    scaleY: 1,
    duration: 0.85,
    stagger: staggerVal,
    ease: 'power3.inOut'
  })
  // 2. While screen is fully covered by wave, switch the page and active nav instantly
  .add(() => {
    if (targetSelector) {
      const targetEl = document.querySelector(targetSelector);
      if (targetEl) {
        // Hide all panels
        document.querySelectorAll('.panel').forEach(panel => {
          panel.style.display = 'none';
        });
        // Show target panel
        targetEl.style.display = 'flex';
        
        lenis.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        updateActiveNav(targetSelector);
      }
      if (targetSelector === '#home') {
        if (typeof laptopAnimationAction !== 'undefined' && laptopAnimationAction) {
          laptopAnimationAction.stop();
        }
        // Reset UI immediately behind the mask so it can animate in again
        gsap.set('.tf-logo-link, .tf-theme-wrapper, .tf-mobile-menu-wrapper, .hero-title, .hero-subtitle', { opacity: 0, scale: 0.8 });
        gsap.set('.tf-nav-btn', { y: 40, opacity: 0 });
        if (typeof globalLaptopGroup !== 'undefined' && globalLaptopGroup) {
          globalLaptopGroup.scale.set(0.001, 0.001, 0.001);
        }
      }
    }
  })
  // 3. Superman Loading Animation appears & flies
  .to('#superman-loader', {
    opacity: 1,
    scale: 1,
    duration: 0.45,
    ease: 'power2.out'
  }, '-=0.25')
  // 4. Reveal pill badges container
  .to('.tf-pill-item', {
    y: 0,
    opacity: 1,
    duration: 0.3,
    stagger: 0.08,
    ease: 'power2.out'
  }, '-=0.15')
  // 5. Sequential Pill Fill & Float Up:
  // --- Pill 1: LOADING ---
  .to('#pill-loading .tf-pill-bg', {
    scaleX: 1,
    duration: 0.32,
    ease: 'power2.inOut'
  })
  .to('#pill-loading .tf-pill-text', {
    color: '#0d0d0e',
    duration: 0.15
  }, '<+=0.1')
  .to('#pill-loading', {
    y: -8,
    duration: 0.25,
    ease: 'back.out(1.5)'
  }, '-=0.15')
  // --- Pill 2: PLEASE ---
  .to('#pill-please .tf-pill-bg', {
    scaleX: 1,
    duration: 0.32,
    ease: 'power2.inOut'
  }, '+=0.05')
  .to('#pill-please .tf-pill-text', {
    color: '#0d0d0e',
    duration: 0.15
  }, '<+=0.1')
  .to('#pill-please', {
    y: -8,
    duration: 0.25,
    ease: 'back.out(1.5)'
  }, '-=0.15')
  // --- Pill 3: WAIT ---
  .to('#pill-wait .tf-pill-bg', {
    scaleX: 1,
    duration: 0.32,
    ease: 'power2.inOut'
  }, '+=0.05')
  .to('#pill-wait .tf-pill-text', {
    color: '#0d0d0e',
    duration: 0.15
  }, '<+=0.1')
  .to('#pill-wait', {
    y: -8,
    duration: 0.25,
    ease: 'back.out(1.5)'
  }, '-=0.15')
  // 6. Brief pause with all filled
  .to({}, { duration: 0.55 })
  // 7. Superman & pills fade out smoothly
  .to(['#superman-loader', '.tf-mask-loader'], {
    opacity: 0,
    y: -20,
    duration: 0.4,
    ease: 'power2.in'
  })
  // 8. Wave blocks retreat back down to bottom
  .set(activeBlocks, { transformOrigin: 'bottom center' })
  .to(activeBlocks, {
    scaleY: 0,
    duration: 0.9,
    stagger: staggerVal,
    ease: 'power3.inOut'
  });
}

// Initial Page Load Preloader
window.addEventListener('load', () => {
  playPageTransition(null, true);
});

// Page Navigation Click Handler (Trigger loading transition before navigating)
// --- 3. Active Nav State Management ---
function updateActiveNav(targetId) {
  document.querySelectorAll('.tf-nav-btn').forEach((btn) => {
    if (btn.getAttribute('href') === targetId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

let menuTimeline = null;

function animateMobileMenuEntrance() {
  const items = document.querySelectorAll('.tf-overlay-menu li');
  if (!items || items.length < 4) return;

  if (menuTimeline) {
    menuTimeline.kill();
  }

  // Calculate dynamic slot distance between items
  const item0 = items[0];
  const item1 = items[1];
  const stepY = (item1 && item0 && item1.offsetTop > item0.offsetTop) 
    ? (item1.offsetTop - item0.offsetTop) 
    : 64;

  const [proj, exp, test, cont] = items;
  const boxes = [
    proj.querySelector('.tf-overlay-btn-box'),
    exp.querySelector('.tf-overlay-btn-box'),
    test.querySelector('.tf-overlay-btn-box'),
    cont.querySelector('.tf-overlay-btn-box')
  ];

  const themeWrap = document.querySelector('.tf-overlay-theme-wrap');
  const themeBtn = themeWrap ? themeWrap.querySelector('.tf-overlay-theme-btn') : null;

  menuTimeline = gsap.timeline();

  // Initial states:
  menuTimeline
    .set([proj, exp, test, cont], { opacity: 0 })
    .set(boxes, { scaleX: 0.65, scaleY: 0.65, transformOrigin: 'center center' })
    .set(proj, { y: stepY })
    .set(exp, { y: stepY })
    .set(test, { y: stepY })
    .set(cont, { y: stepY });

  if (themeWrap) {
    menuTimeline
      .set(themeWrap, { opacity: 0, y: stepY })
      .set(themeBtn || themeWrap, { scaleX: 0.6, scaleY: 0.6, transformOrigin: 'center center' });
  }

  // 1. Projects and Experience first pop in with bouncy spring
  menuTimeline
    .to([proj, exp], { opacity: 1, duration: 0.06, ease: 'power1.out' })
    .to([boxes[0], boxes[1]], {
      scaleX: 1,
      scaleY: 1,
      duration: 0.24,
      stagger: 0.03,
      ease: 'elastic.out(1.2, 0.4)'
    }, '<')

  // 2. Projects bounces up (leaves gap with Experience) + settles down
  .to(proj, {
    keyframes: [
      { y: -8, duration: 0.18, ease: 'power2.out' },
      { y: 0, duration: 0.12, ease: 'sine.inOut' }
    ]
  }, '+=0.03')
  .fromTo(boxes[0], 
    { scaleY: 1.18, scaleX: 0.86 }, 
    { scaleY: 1, scaleX: 1, duration: 0.32, ease: 'elastic.out(1.25, 0.4)' }, 
    '<+=0.02'
  )

  // 3. Testimonials pops in with bouncy spring
  .to(test, { opacity: 1, duration: 0.06, ease: 'power1.out' }, '-=0.14')
  .to(boxes[2], {
    scaleX: 1,
    scaleY: 1,
    duration: 0.22,
    ease: 'elastic.out(1.2, 0.4)'
  }, '<')

  // 4. Experience bounces up under Projects + settles down
  .to(exp, {
    keyframes: [
      { y: -8, duration: 0.18, ease: 'power2.out' },
      { y: 0, duration: 0.12, ease: 'sine.inOut' }
    ]
  }, '+=0.03')
  .fromTo(boxes[1], 
    { scaleY: 1.18, scaleX: 0.86 }, 
    { scaleY: 1, scaleX: 1, duration: 0.32, ease: 'elastic.out(1.25, 0.4)' }, 
    '<+=0.02'
  )

  // 5. Contact pops in with bouncy spring
  .to(cont, { opacity: 1, duration: 0.06, ease: 'power1.out' }, '-=0.14')
  .to(boxes[3], {
    scaleX: 1,
    scaleY: 1,
    duration: 0.22,
    ease: 'elastic.out(1.2, 0.4)'
  }, '<')

  // 6. Testimonials bounces up under Experience + settles down
  .to(test, {
    keyframes: [
      { y: -8, duration: 0.18, ease: 'power2.out' },
      { y: 0, duration: 0.12, ease: 'sine.inOut' }
    ]
  }, '+=0.03')
  .fromTo(boxes[2], 
    { scaleY: 1.18, scaleX: 0.86 }, 
    { scaleY: 1, scaleX: 1, duration: 0.32, ease: 'elastic.out(1.25, 0.4)' }, 
    '<+=0.02'
  )

  // 7. Contact bounces up under Testimonials + settles down
  .to(cont, {
    keyframes: [
      { y: -8, duration: 0.18, ease: 'power2.out' },
      { y: 0, duration: 0.12, ease: 'sine.inOut' }
    ]
  }, '+=0.03')
  .fromTo(boxes[3], 
    { scaleY: 1.18, scaleX: 0.86 }, 
    { scaleY: 1, scaleX: 1, duration: 0.32, ease: 'elastic.out(1.25, 0.4)' }, 
    '<+=0.02'
  );

  // 8. Theme Toggle Button pops in, bounces up and settles down
  if (themeWrap) {
    menuTimeline
      .to(themeWrap, { opacity: 1, duration: 0.06, ease: 'power1.out' }, '-=0.12')
      .to(themeWrap, {
        keyframes: [
          { y: -6, duration: 0.18, ease: 'power2.out' },
          { y: 0, duration: 0.12, ease: 'sine.inOut' }
        ]
      }, '<')
      .fromTo(themeBtn || themeWrap,
        { scaleY: 1.25, scaleX: 0.8 },
        { scaleY: 1, scaleX: 1, duration: 0.32, ease: 'elastic.out(1.3, 0.4)' },
        '<+=0.02'
      );
  }
}

function toggleMobileOverlay() {
  const overlay = document.getElementById('tf-mobile-overlay');
  if (overlay && overlay.classList.contains('open')) {
    closeMobileOverlay();
  } else {
    openMobileOverlay();
  }
}

function closeMobileOverlay() {
  const overlay = document.getElementById('tf-mobile-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  document.body.classList.remove('menu-open');
  if (menuTimeline) {
    menuTimeline.kill();
  }
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.remove('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }
}

function openMobileOverlay() {
  const overlay = document.getElementById('tf-mobile-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  document.body.classList.add('menu-open');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      animateMobileMenuEntrance();
    });
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.add('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Links & Transitions (Desktop + Mobile Overlay)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        e.preventDefault();
        closeMobileOverlay();
        playPageTransition(targetId, false);
      }
    });
  });

  // Mobile Menu Toggle Button
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileOverlay();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileOverlay();
    }
  });

  // Nav Button Shape Morphing: When any button is hovered, ALL nav buttons toggle their shape together
  const navBtns = document.querySelectorAll('.tf-nav-btn, .tf-overlay-btn');
  navBtns.forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      navBtns.forEach((otherBtn) => {
        if (otherBtn.classList.contains('shape-rect')) {
          otherBtn.classList.remove('shape-rect');
          otherBtn.classList.add('shape-pill');
        } else {
          otherBtn.classList.remove('shape-pill');
          otherBtn.classList.add('shape-rect');
        }
      });
    });
  });
});

// --- 4. Theme Toggle Logic & Keyboard Shortcut (P) ---
const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.className = savedTheme;
}

function toggleTheme() {
  if (body.classList.contains('dark-mode')) {
    body.classList.replace('dark-mode', 'light-mode');
    localStorage.setItem('theme', 'light-mode');
  } else {
    body.classList.replace('light-mode', 'dark-mode');
    localStorage.setItem('theme', 'dark-mode');
  }
}

themeToggleBtns.forEach((btn) => {
  btn.addEventListener('click', toggleTheme);
});

window.addEventListener('keydown', (e) => {
  // If user is focused on an input/textarea/editable element, don't trigger
  const activeEl = document.activeElement;
  if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) {
    return;
  }

  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    toggleTheme();
  }
});

// --- 5. GSAP Animations ---
let isLoaderFinished = false;
let laptopAnimationAction = null;
let globalLaptopGroup = null;
let globalTargetScale = 1;

function initAnimations() {
  isLoaderFinished = true;
  
  if (globalLaptopGroup) {
    gsap.fromTo(globalLaptopGroup.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: globalTargetScale, y: globalTargetScale, z: globalTargetScale, duration: 1.4, ease: 'elastic.out(1, 0.75)' }
    );
  }

  if (laptopAnimationAction) {
    setTimeout(() => {
      laptopAnimationAction.play();
    }, 3000);
  }

  // Logo and Theme toggle zoom in
  gsap.to('.tf-logo-link, .tf-theme-wrapper, .tf-mobile-menu-wrapper', { 
    scale: 1, opacity: 1, duration: 1, delay: 0.5, ease: 'power3.out' 
  });

  // Nav links stagger up sequentially
  gsap.to('.tf-nav-btn', {
    y: 0, opacity: 1, duration: 0.8, delay: 0.6, stagger: 0.1, ease: 'back.out(1.5)'
  });

  // Hero texts zoom in
  gsap.to('.hero-title, .hero-subtitle', {
    scale: 1, opacity: 1, duration: 1, delay: 0.5, stagger: 0.1, ease: 'power3.out'
  });
  
  // Section scroll entrance animations (No automatic nav highlighting on scroll)
  const panels = document.querySelectorAll('.panel');
  panels.forEach((panel) => {
    if (panel.id !== 'home') {
      const content = panel.querySelector('.content');
      if (content) {
        gsap.from(content, {
          scrollTrigger: {
            trigger: panel,
            start: 'top 80%',
          },
          y: 50,
          opacity: 0,
          duration: 1,
          ease: 'power3.out'
        });
      }
    }
  });
}

// --- 6. Chat with Patrick Interactive Widget ---
function initChatWidget() {
  const triggerBtn = document.getElementById('tf-chat-trigger');
  const chatModal = document.getElementById('tf-chat-modal');
  const closeBtn = document.getElementById('tf-chat-close-btn');
  const bottomCloseBtn = document.getElementById('tf-chat-bottom-close');
  const expandBtn = document.getElementById('tf-chat-expand-btn');
  const chatForm = document.getElementById('tf-chat-form');
  const chatInput = document.getElementById('tf-chat-input');
  const chatMessages = document.getElementById('tf-chat-messages');
  const promptChips = document.querySelectorAll('.tf-prompt-chip');

  const chatWidget = document.getElementById('tf-chat-widget');

  if (!triggerBtn || !chatModal) return;

  function openChat() {
    if (chatWidget) chatWidget.classList.add('is-open');
    chatModal.classList.add('open');
    chatModal.setAttribute('aria-hidden', 'false');
    triggerBtn.style.display = 'none';
    if (bottomCloseBtn) bottomCloseBtn.style.display = 'inline-flex';
    if (chatInput) chatInput.focus();
  }

  function closeChat() {
    if (chatWidget) chatWidget.classList.remove('is-open');
    chatModal.classList.remove('open');
    chatModal.classList.remove('expanded');
    chatModal.setAttribute('aria-hidden', 'true');
    triggerBtn.style.display = 'inline-flex';
    if (bottomCloseBtn) bottomCloseBtn.style.display = 'none';
  }

  function toggleExpand() {
    chatModal.classList.toggle('expanded');
  }

  triggerBtn.addEventListener('click', openChat);
  if (closeBtn) closeBtn.addEventListener('click', closeChat);
  if (bottomCloseBtn) bottomCloseBtn.addEventListener('click', closeChat);
  if (expandBtn) expandBtn.addEventListener('click', toggleExpand);

  // Close chat on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatModal.classList.contains('open')) {
      closeChat();
    }
  });

  const responseMap = {
    tech: "I specialize in JavaScript/TypeScript, React, Vite, GSAP animation physics, Lenis smooth scrolling, CSS architecture, and creative interactive web applications.",
    bg: "I'm Patrick John, a creative developer focused on crafting tactile web experiences, interactive 3D/2D animation systems, and high-performance frontend interfaces.",
    site: "This portfolio was built with Vite, GSAP for spring & step physics, Lenis for momentum scrolling, and custom pixel typography inspired by ToyFight's iconic design language.",
    collab: "I'm always open to new projects! Send me an email at patrick80361@gmail.com, or reach out on LinkedIn (patrickjohn01) or Instagram (@mr.faaj)."
  };

  function getBotResponse(userText) {
    const text = userText.toLowerCase();
    if (text.includes('tech') || text.includes('stack') || text.includes('tool')) {
      return responseMap.tech;
    }
    if (text.includes('background') || text.includes('who') || text.includes('experience') || text.includes('about')) {
      return responseMap.bg;
    }
    if (text.includes('site') || text.includes('built') || text.includes('made') || text.includes('how')) {
      return responseMap.site;
    }
    if (text.includes('contact') || text.includes('collab') || text.includes('email') || text.includes('hire') || text.includes('touch')) {
      return responseMap.collab;
    }
    return `Thanks for asking! I'm Patrick John, creative frontend developer. Feel free to explore my projects or reach out directly at patrick80361@gmail.com!`;
  }

  function appendMessage(text, sender = 'user') {
    if (!chatMessages) return;
    const msg = document.createElement('div');
    msg.className = `tf-msg ${sender}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);

    const chatBody = document.getElementById('tf-chat-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function showTypingAndReply(replyText) {
    if (!chatMessages) return;
    const typing = document.createElement('div');
    typing.className = 'tf-msg bot tf-typing-indicator';
    typing.innerHTML = '<span class="tf-typing-dot"></span><span class="tf-typing-dot"></span><span class="tf-typing-dot"></span>';
    chatMessages.appendChild(typing);

    const chatBody = document.getElementById('tf-chat-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    setTimeout(() => {
      if (typing.parentNode) typing.remove();
      appendMessage(replyText, 'bot');
    }, 650);
  }

  function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage(trimmed, 'user');
    const reply = getBotResponse(trimmed);
    showTypingAndReply(reply);
  }

  promptChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt') || chip.textContent;
      handleSend(promptText);
    });
  });

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!chatInput) return;
      const val = chatInput.value;
      chatInput.value = '';
      handleSend(val);
    });
  }
}

// --- 7. Interactive 3D Laptop in Homepage Hero Section ---
function initHero3D() {
  const canvas = document.getElementById('hero-webgl-canvas');
  const container = document.getElementById('hero-3d-container');
  const heroSection = document.getElementById('home');

  if (!canvas || !container || !heroSection) return;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 4.4);

  // High quality WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Studio Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
  keyLight.position.set(4, 5, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x99ccff, 1.2);
  fillLight.position.set(-4, 2, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
  rimLight.position.set(0, 4, -4);
  scene.add(rimLight);

  const frontLight = new THREE.PointLight(0xffffff, 1.2, 10);
  frontLight.position.set(0, 1, 3);
  scene.add(frontLight);

  // Laptop Group
  const laptopGroup = new THREE.Group();
  scene.add(laptopGroup);

  const loader = new GLTFLoader();
  let laptopModel = null;
  let mixer = null;

  loader.load(
    '/laptopanimation.glb',
    (gltf) => {
      laptopModel = gltf.scene;

      // Center geometry around origin
      const box = new THREE.Box3().setFromObject(laptopModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      laptopModel.position.x -= center.x;
      laptopModel.position.y -= center.y;
      laptopModel.position.z -= center.z;

      // Auto-scale to fit hero viewport perfectly (responsive on mobile)
      const maxDim = Math.max(size.x, size.y, size.z);
      window.laptopMaxDim = maxDim;
      const isMobile = window.innerWidth <= 768;
      // Increased desktop base dimension by 25%
      const baseDim = isMobile ? 1.4 : 2.4375;
      const targetScale = (maxDim > 0 ? baseDim / maxDim : 1) * 0.75;
      
      globalLaptopGroup = laptopGroup;
      globalTargetScale = targetScale;
      
      if (!isLoaderFinished) {
        laptopGroup.scale.set(0.001, 0.001, 0.001);
      } else {
        laptopGroup.scale.set(targetScale, targetScale, targetScale);
        gsap.fromTo(laptopGroup.scale,
          { x: 0.001, y: 0.001, z: 0.001 },
          { x: targetScale, y: targetScale, z: targetScale, duration: 1.4, ease: 'elastic.out(1, 0.75)' }
        );
      }

      // Centered angle so mouse tracking is symmetrical
      laptopGroup.rotation.x = 0;
      laptopGroup.rotation.y = 0;
      laptopGroup.position.set(0, -0.28, 0);

      laptopModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness || 0.4, 0.6);
            child.material.metalness = Math.max(child.material.metalness || 0.2, 0.4);
            
            // Fix common GLTF exporter issues with alpha blend causing sorting bugs
            child.material.transparent = false;
            child.material.depthWrite = true;

            child.material.needsUpdate = true;
          }
        }
      });

      laptopGroup.add(laptopModel);

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(laptopModel);
        laptopAnimationAction = mixer.clipAction(gltf.animations[0]);
        laptopAnimationAction.setLoop(THREE.LoopOnce);
        laptopAnimationAction.clampWhenFinished = true;
        
        if (isLoaderFinished) {
          setTimeout(() => {
            laptopAnimationAction.play();
          }, 3000);
        }
      }

      // Intro elastic pop is now handled by initAnimations or loader completion
    },
    undefined,
    (err) => {
      console.error('Error loading laptop.glb:', err);
    }
  );

  // Mouse Parallax
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Scroll parallax disabled so laptop doesn't shrink when scrolling down

  // IntersectionObserver to pause rendering loop when outside hero section
  let isHeroVisible = true;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isHeroVisible = entry.isIntersecting;
    });
  }, { threshold: 0.01 });
  observer.observe(heroSection);

  // Resize handler
  let baselineH = null;
  function handleResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    
    if (baselineH === null) baselineH = h;
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (typeof globalLaptopGroup !== 'undefined' && globalLaptopGroup && window.laptopMaxDim) {
      const isMobile = window.innerWidth <= 768;
      const baseDim = isMobile ? 1.4 : 2.4375;
      let targetScale = (window.laptopMaxDim > 0 ? baseDim / window.laptopMaxDim : 1) * 0.75;
      
      if (isMobile && h > 0) {
         // Counteract Three.js vertical FOV expansion on mobile scroll (address bar hiding)
         targetScale *= (baselineH / h);
      }
      
      globalLaptopGroup.scale.set(targetScale, targetScale, targetScale);
    }
  }
  window.addEventListener('resize', handleResize);

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!isHeroVisible) return;

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (mixer) {
      mixer.update(delta);
    }

    // Damping mouse position
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    const isMobile = window.innerWidth <= 768;

    if (laptopGroup && laptopModel) {
      // Gentle floating physics
      const floatY = Math.sin(elapsedTime * 1.5) * 0.07;
      const floatRotZ = Math.sin(elapsedTime * 1.2) * 0.025;

      laptopGroup.position.y = -0.28 + floatY;
      
      if (isMobile) {
        // Auto-pan side to side every 10 seconds on mobile
        laptopGroup.rotation.x = 0;
        laptopGroup.rotation.y = Math.sin(elapsedTime * (Math.PI * 2 / 10)) * 0.6;
      } else {
        // Laptop screen looks towards the mouse symmetrically from the center
        laptopGroup.rotation.x = mouse.y * 0.35;
        laptopGroup.rotation.y = mouse.x * 0.6 + Math.sin(elapsedTime * 0.5) * 0.04;
      }
      laptopGroup.rotation.z = floatRotZ;
    }

    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', () => {
  initChatWidget();
  initHero3D();
});
