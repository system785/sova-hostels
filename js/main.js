/* ==========================================================================
   СОВА — интерактив: появление при скролле, параллакс, меню, галереи, форма
   ========================================================================== */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Прогресс-бар чтения ---------- */
  const progress = $('.progress-bar');
  /* ---------- Шапка: состояние + «наверх» ---------- */
  const header = $('.header');
  const toTop = $('.to-top');

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (header) header.classList.toggle('solid', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 620);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
    );
  }

  /* ---------- Мобильное меню (drawer) ---------- */
  const burger = $('.burger');
  const drawer = $('.drawer');
  if (burger && drawer) {
    const toggle = (open) => {
      const isOpen = open !== undefined ? open : !drawer.classList.contains('open');
      drawer.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (isOpen) {
        // каскадное появление пунктов
        $$('.drawer-link, .drawer .btn', drawer).forEach((el, i) => {
          el.style.transitionDelay = (120 + i * 55) + 'ms';
        });
      } else {
        $$('.drawer-link, .drawer .btn', drawer).forEach((el) => (el.style.transitionDelay = ''));
      }
    };
    burger.addEventListener('click', () => toggle());
    $$('.drawer a', drawer).forEach((a) => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggle(false);
    });
  }

  /* ---------- Плавный скролл по якорям ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Появление при скролле (IntersectionObserver) ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    // автоматический каскад внутри сеток
    $$('[data-stagger]').forEach((group) => {
      $$('.reveal', group).forEach((el, i) => {
        if (!el.style.getPropertyValue('--d')) {
          el.style.setProperty('--d', (i * 85) + 'ms');
        }
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Разрезка заголовка на строки ---------- */
  $$('.split').forEach((el) => {
    const html = el.innerHTML.trim();
    if (!html.includes('|')) return;
    el.innerHTML = html
      .split('|')
      .map((line, i) => {
        const d = i * 110;
        return '<span class="split-line"><span style="--d:' + d + 'ms">' + line.trim() + '</span></span>';
      })
      .join('');
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting) { el.classList.add('in'); io2.disconnect(); }
        },
        { threshold: 0.2 }
      );
      io2.observe(el);
    } else {
      el.classList.add('in');
    }
  });

  /* ---------- Счётчики ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1500;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Параллакс героя ---------- */
  const heroBg = $('.hero-bg');
  if (heroBg && !prefersReduced) {
    let ticking = false;
    const move = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        heroBg.style.transform = 'scale(1.08) translate3d(0,' + y * 0.22 + 'px,0)';
      }
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } },
      { passive: true }
    );

    // лёгкий сдвиг от курсора
    const hero = $('.hero');
    if (hero && window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('mousemove', (e) => {
        const rx = (e.clientX / window.innerWidth - 0.5);
        const ry = (e.clientY / window.innerHeight - 0.5);
        const card = $('.hero-card');
        if (card) card.style.transform = 'perspective(900px) rotateY(' + rx * 5 + 'deg) rotateX(' + (-ry * 5) + 'deg)';
      });
      hero.addEventListener('mouseleave', () => {
        const card = $('.hero-card');
        if (card) card.style.transform = '';
      });
    }
  }

  /* ---------- Галереи ---------- */
  $$('.gallery').forEach((gal) => {
    const track = $('.gallery-track', gal);
    const slides = $$('.gallery-slide', gal);
    const dotsWrap = $('.gallery-dots', gal);
    const countEl = $('.gallery-count', gal);
    if (!track || slides.length < 2) return;

    let index = 0;
    const total = slides.length;

    // точки
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Слайд ' + (i + 1));
        b.addEventListener('click', () => go(i));
        dotsWrap.appendChild(b);
      });
    }

    function render() {
      track.style.transform = 'translateX(' + -index * 100 + '%)';
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === index));
      }
      if (countEl) countEl.textContent = (index + 1) + ' / ' + total;
    }

    function go(i) {
      index = (i + total) % total;
      render();
      restart();
    }

    const prev = $('.g-prev', gal);
    const next = $('.g-next', gal);
    if (prev) prev.addEventListener('click', () => go(index - 1));
    if (next) next.addEventListener('click', () => go(index + 1));

    // автопрокрутка
    let timer = null;
    function restart() {
      if (prefersReduced) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), 5200);
    }
    gal.addEventListener('mouseenter', () => clearInterval(timer));
    gal.addEventListener('mouseleave', restart);

    // свайп
    let sx = 0, dx = 0, dragging = false;
    gal.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; dx = 0; dragging = true; clearInterval(timer); }, { passive: true });
    gal.addEventListener('touchmove', (e) => { if (dragging) dx = e.touches[0].clientX - sx; }, { passive: true });
    gal.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      else restart();
    });

    render();
    restart();
  });

  /* ---------- Аккордеон: открыт только один ---------- */
  const accs = $$('.acc');
  accs.forEach((acc) => {
    const items = $$('details', acc);
    items.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (d.open) items.forEach((o) => { if (o !== d) o.open = false; });
      });
    });
  });

  /* ---------- Форма заявки ---------- */
  const form = $('#booking-form');
  if (form) {
    // минимальные даты = сегодня
    $$('input[type="date"]', form).forEach((inp) => {
      const t = new Date();
      inp.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    });

    // маска телефона
    const phone = $('#phone', form);
    if (phone) {
      phone.addEventListener('input', () => {
        let v = phone.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (!v.startsWith('7')) v = '7' + v;
        v = v.slice(0, 11);
        let out = '+7';
        if (v.length > 1) out += ' (' + v.slice(1, 4);
        if (v.length >= 4) out += ') ' + v.slice(4, 7);
        if (v.length >= 7) out += '-' + v.slice(7, 9);
        if (v.length >= 9) out += '-' + v.slice(9, 11);
        phone.value = out;
      });
    }

    const validate = () => {
      let ok = true;
      $$('[data-required]', form).forEach((inp) => {
        const field = inp.closest('.field');
        let valid = inp.value.trim() !== '';
        if (valid && inp.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim());
        if (valid && inp.type === 'tel') valid = inp.value.replace(/\D/g, '').length >= 11;
        field.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      return ok;
    };

    $$('input, select, textarea', form).forEach((inp) => {
      inp.addEventListener('input', () => {
        const f = inp.closest('.field');
        if (f && f.classList.contains('invalid')) validate();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        const bad = $('.field.invalid', form);
        if (bad) bad.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      const wrap = form.closest('.form-card');
      const success = $('.form-success', wrap);
      form.style.display = 'none';
      if (success) success.classList.add('show');
    });
  }

  /* ---------- Текущий год ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Ленивая загрузка картинок ---------- */
  if ('loading' in HTMLImageElement.prototype) {
    $$('img[data-src]').forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  }
})();
