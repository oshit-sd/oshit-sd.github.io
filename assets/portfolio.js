/* ==========================================================================
   Oshit Sutra Dar — GSAP Observer One-by-One Section Transitions & Jump Logic
   ========================================================================== */

(function () {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile menu
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMobileMenu = () => {
        if (!mobileMenu || !menuBtn) return;
        mobileMenu.classList.remove('open');
        const icon = menuBtn.querySelector('i');
        if (icon) icon.classList.replace('fa-times', 'fa-bars');
    };

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            const icon = menuBtn.querySelector('i');
            if (!icon) return;
            if (mobileMenu.classList.contains('open')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }

    // Jump inside #projects to the highlighted 13 shipped projects showcase
    const projectsPanel = document.getElementById('projects');
    const jumpShippedBtn = document.getElementById('jump-shipped-btn');
    const shippedShowcase = document.getElementById('shipped-showcase');

    if (jumpShippedBtn && shippedShowcase && projectsPanel) {
        jumpShippedBtn.addEventListener('click', () => {
            if (isDesktopDeck) {
                gsap.to(projectsPanel, {
                    scrollTo: { y: shippedShowcase, offsetY: 88 },
                    duration: 0.75,
                    ease: 'power3.inOut',
                });
            } else {
                gsap.to(window, {
                    scrollTo: { y: shippedShowcase, offsetY: 76 },
                    duration: 0.75,
                    ease: 'power3.inOut',
                });
            }
        });
    }

    // Filter 13 Shipped Projects + refresh GSAP ScrollTrigger
    const filterPills = document.querySelectorAll('.filter-pill');
    const archiveItems = document.querySelectorAll('.archive-item');
    filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const filter = pill.getAttribute('data-filter');
            filterPills.forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            archiveItems.forEach((item) => {
                const match = filter === 'all' || item.getAttribute('data-category') === filter;
                item.style.display = match ? '' : 'none';
            });
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        });
    });

    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(Observer, ScrollTrigger, ScrollToPlugin);

    const panels = Array.from(document.querySelectorAll('.deck-panel'));
    const navLinks = Array.from(document.querySelectorAll('nav a.nav-link'));
    const railItems = Array.from(document.querySelectorAll('.rail-item'));
    const hudCurrent = document.getElementById('hud-current');
    const hudTitle = document.getElementById('hud-title');
    const hudPrev = document.getElementById('hud-prev');
    const hudNext = document.getElementById('hud-next');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentIndex = 0;
    let isAnimating = false;
    let isDesktopDeck = false;
    let lastWheelTime = 0;

    function updateActiveUI(index) {
        currentIndex = index;
        const activePanel = panels[index];
        if (!activePanel) return;
        const id = activePanel.getAttribute('data-section');
        const label = activePanel.getAttribute('data-label') || '';

        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        railItems.forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-jump') === id);
        });
        if (hudCurrent) hudCurrent.textContent = String(index + 1).padStart(2, '0');
        if (hudTitle) hudTitle.textContent = label;

        gsap.to('#scroll-progress', {
            scaleX: panels.length > 1 ? index / (panels.length - 1) : 1,
            duration: 0.45,
            ease: 'power2.out',
        });
    }

    function goToPanel(targetIndex) {
        if (targetIndex < 0 || targetIndex >= panels.length) return;
        if (targetIndex === currentIndex || isAnimating) return;

        const direction = targetIndex > currentIndex ? 1 : -1;
        const currentPanel = panels[currentIndex];
        const nextPanel = panels[targetIndex];
        const nextItems = nextPanel.querySelectorAll('.panel-header, .panel-item');

        isAnimating = true;
        updateActiveUI(targetIndex);
        nextPanel.scrollTop = 0;

        if (prefersReducedMotion) {
            gsap.set(currentPanel, { autoAlpha: 0, zIndex: 1 });
            gsap.set(nextPanel, { xPercent: 0, yPercent: 0, scale: 1, autoAlpha: 1, zIndex: 10 });
            isAnimating = false;
            return;
        }

        gsap.to('.gsap-shape', {
            rotation: `+=${direction * 35}`,
            duration: 0.85,
            ease: 'power2.out',
            overwrite: 'auto',
        });

        gsap.set(currentPanel, { zIndex: 5 });
        gsap.set(nextPanel, {
            zIndex: 10,
            autoAlpha: 1,
            scale: 1,
            xPercent: direction > 0 ? 100 : -100,
            yPercent: 0,
        });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(currentPanel, { autoAlpha: 0, zIndex: 1, scale: 1, xPercent: 0, yPercent: 0 });
                if (nextPanel.id === 'projects') {
                    ScrollTrigger.refresh();
                }
                setTimeout(() => {
                    isAnimating = false;
                }, 130);
            },
        });

        tl.to(currentPanel, {
            xPercent: direction > 0 ? -24 : 24,
            scale: 0.95,
            autoAlpha: 0.2,
            duration: 0.78,
            ease: 'power3.inOut',
        }).to(
            nextPanel,
            {
                xPercent: 0,
                duration: 0.78,
                ease: 'power3.inOut',
            },
            '<'
        );

        if (nextItems.length) {
            tl.fromTo(
                nextItems,
                { x: direction > 0 ? 34 : -34, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity',
                },
                '-=0.38'
            );
        }
    }

    function jumpToSection(sectionId) {
        closeMobileMenu();
        const targetIndex = panels.findIndex((p) => p.getAttribute('data-section') === sectionId);
        if (targetIndex === -1) return;

        if (isDesktopDeck) {
            goToPanel(targetIndex);
        } else {
            const targetEl = panels[targetIndex];
            gsap.to(window, {
                duration: 0.75,
                scrollTo: { y: targetEl, offsetY: targetIndex === 0 ? 0 : 64 },
                ease: 'power3.inOut',
            });
        }
    }

    document.querySelectorAll('[data-jump]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            const targetId = trigger.getAttribute('data-jump');
            if (!targetId) return;
            e.preventDefault();
            jumpToSection(targetId.replace('#', ''));
        });
    });

    if (hudPrev) {
        hudPrev.addEventListener('click', () => {
            if (isDesktopDeck) goToPanel(currentIndex - 1);
            else jumpToSection(panels[Math.max(0, currentIndex - 1)].getAttribute('data-section'));
        });
    }
    if (hudNext) {
        hudNext.addEventListener('click', () => {
            if (isDesktopDeck) goToPanel(currentIndex + 1);
            else jumpToSection(panels[Math.min(panels.length - 1, currentIndex + 1)].getAttribute('data-section'));
        });
    }

    window.addEventListener('keydown', (e) => {
        if (!isDesktopDeck) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            goToPanel(currentIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            goToPanel(currentIndex - 1);
        }
    });

    // Hero entrance on load
    // ── Interactive GSAP Micro-Animations (All Sections) ──────────────────
    if (!prefersReducedMotion) {
        // 1. Split Hero Name into masked words & characters (GSAP.com SplitText style)
        const heroNameWrap = document.getElementById('hero-name');
        const heroNameText = document.getElementById('hero-name-text');
        let heroChars = [];

        const playNameReveal = () => {
            if (!heroChars.length) return;
            gsap.fromTo(
                heroChars,
                { yPercent: 115, rotateZ: 6, opacity: 0 },
                {
                    yPercent: 0,
                    rotateZ: 0,
                    opacity: 1,
                    duration: 0.85,
                    stagger: 0.032,
                    ease: 'power4.out',
                    overwrite: 'auto',
                }
            );
        };

        if (heroNameText) {
            const words = heroNameText.textContent.trim().split(/\s+/);
            heroNameText.innerHTML = words
                .map((word) => {
                    const charsHtml = word
                        .split('')
                        .map((ch) => `<span class="hero-char">${ch}</span>`)
                        .join('');
                    return `<span class="hero-word-mask">${charsHtml}</span>`;
                })
                .join('<span class="hero-char">&nbsp;</span>');

            heroChars = Array.from(heroNameText.querySelectorAll('.hero-char'));
            playNameReveal();

            // Interactive per-letter wave on hover + click replay wave
            heroChars.forEach((ch, idx) => {
                ch.addEventListener('mouseenter', () => {
                    gsap.to(ch, {
                        y: -8,
                        scale: 1.14,
                        color: '#60a5fa',
                        duration: 0.22,
                        ease: 'power2.out',
                    });
                    [heroChars[idx - 1], heroChars[idx + 1]].forEach((neighbor) => {
                        if (!neighbor) return;
                        gsap.to(neighbor, { y: -3, duration: 0.22, ease: 'power2.out' });
                    });
                });
                ch.addEventListener('mouseleave', () => {
                    gsap.to(ch, {
                        y: 0,
                        scale: 1,
                        color: '#ffffff',
                        duration: 0.4,
                        ease: 'elastic.out(1, 0.45)',
                    });
                    [heroChars[idx - 1], heroChars[idx + 1]].forEach((neighbor) => {
                        if (!neighbor) return;
                        gsap.to(neighbor, { y: 0, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
                    });
                });
            });

            if (heroNameWrap) {
                heroNameWrap.addEventListener('click', () => {
                    gsap.fromTo(
                        heroChars,
                        { y: 0, color: '#ffffff' },
                        {
                            y: -10,
                            color: '#60a5fa',
                            duration: 0.24,
                            stagger: { each: 0.025, from: 'start', yoyo: true, repeat: 1 },
                            ease: 'power2.out',
                        }
                    );
                });
            }
        }

        // Hero entrance
        gsap.from('.hero-stagger', {
            y: 18,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power3.out',
        });
        gsap.from('.hero-visual', {
            x: 26,
            opacity: 0,
            duration: 0.7,
            delay: 0.12,
            ease: 'power3.out',
        });

        // Continuous ambient float on SVG shapes + mouse-reactive parallax
        const shapes = Array.from(document.querySelectorAll('.gsap-shape'));
        shapes.forEach((shape, i) => {
            gsap.to(shape, {
                y: i % 2 === 0 ? -12 : 12,
                duration: 3.2 + i * 0.6,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });

        const shapeQuickX = shapes.map((s) => gsap.quickTo(s, 'x', { duration: 0.6, ease: 'power2.out' }));
        window.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 900) return;
            const normX = e.clientX / window.innerWidth - 0.5;
            shapes.forEach((shape, i) => {
                const depth = Number(shape.getAttribute('data-depth')) || 12;
                shapeQuickX[i](normX * depth);
            });
        });

        // 2. Interactive spotlight + subtle 3D tilt on all section cards
        document.querySelectorAll('.arch-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mx', `${x}px`);
                card.style.setProperty('--my', `${y}px`);
                const rx = ((y / rect.height) - 0.5) * -4;
                const ry = ((x / rect.width) - 0.5) * 4;
                gsap.to(card, { y: -3, rotateX: rx, rotateY: ry, duration: 0.22, ease: 'power2.out' });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { y: 0, rotateX: 0, rotateY: 0, duration: 0.35, ease: 'power2.out' });
            });
        });

        // 3. Interactive spring pop on skill & tech badges
        document.querySelectorAll('#services .font-mono, #projects .font-mono').forEach((badge) => {
            if (badge.closest('button, a')) return;
            badge.classList.add('skill-chip');
            badge.addEventListener('mouseenter', () => {
                gsap.to(badge, { y: -2, scale: 1.06, duration: 0.18, ease: 'back.out(2)' });
            });
            badge.addEventListener('mouseleave', () => {
                gsap.to(badge, { y: 0, scale: 1, duration: 0.22, ease: 'power2.out' });
            });
        });

        document.querySelectorAll('.btn-primary, .btn-secondary').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
                const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.12;
                gsap.to(btn, { x: dx, y: dy, duration: 0.2, ease: 'power2.out' });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
            });
        });
    }

    // Desktop: Horizontal Observer + Row-by-Row ScrollTrigger inside #projects
    const mm = gsap.matchMedia();

    const setupProjectRowScroll = (scrollerTarget) => {
        if (prefersReducedMotion) return [];
        const cards = Array.from(document.querySelectorAll('.project-scroll-card'));
        const triggers = [];

        cards.forEach((card, idx) => {
            const isLeftCol = idx % 2 === 0;
            const tween = gsap.fromTo(
                card,
                {
                    y: 36,
                    x: isLeftCol ? -14 : 14,
                    scale: 0.96,
                    opacity: 0,
                },
                {
                    y: 0,
                    x: 0,
                    scale: 1,
                    opacity: 1,
                    duration: 0.55,
                    ease: 'power3.out',
                    paused: true,
                }
            );

            const st = ScrollTrigger.create({
                trigger: card,
                scroller: scrollerTarget,
                start: 'top 90%',
                end: 'bottom 10%',
                onEnter: () => tween.play(),
                onLeave: () => tween.reverse(),
                onEnterBack: () => tween.play(),
                onLeaveBack: () => tween.reverse(),
            });
            triggers.push(st);
        });

        return triggers;
    };

    mm.add('(min-width: 900px)', () => {
        isDesktopDeck = true;
        document.body.classList.add('deck-locked');

        panels.forEach((panel, i) => {
            gsap.set(panel, {
                autoAlpha: i === 0 ? 1 : 0,
                xPercent: 0,
                yPercent: 0,
                scale: 1,
                zIndex: i === 0 ? 10 : 1,
            });
        });
        updateActiveUI(0);

        const projectTriggers = setupProjectRowScroll(projectsPanel);
        let lastInternalScrollTime = 0;

        const onPanelScroll = () => {
            lastInternalScrollTime = Date.now();
        };
        if (projectsPanel) {
            projectsPanel.addEventListener('scroll', onPanelScroll, { passive: true });
        }

        const canPanelScrollInternally = (panel, dir) => {
            const overflow = panel.scrollHeight - panel.clientHeight;
            if (overflow <= 4) return false;
            if (dir > 0) return panel.scrollTop + panel.clientHeight < panel.scrollHeight - 4;
            return panel.scrollTop > 4;
        };

        const observer = Observer.create({
            target: window,
            type: 'wheel,touch',
            wheelSpeed: -1,
            tolerance: 18,
            preventDefault: false,
            onUp: () => {
                const now = Date.now();
                if (isAnimating || now - lastWheelTime < 450) return;
                const activePanel = panels[currentIndex];
                if (canPanelScrollInternally(activePanel, 1) || now - lastInternalScrollTime < 280) return;
                lastWheelTime = now;
                goToPanel(currentIndex + 1);
            },
            onDown: () => {
                const now = Date.now();
                if (isAnimating || now - lastWheelTime < 450) return;
                const activePanel = panels[currentIndex];
                if (canPanelScrollInternally(activePanel, -1) || now - lastInternalScrollTime < 280) return;
                lastWheelTime = now;
                goToPanel(currentIndex - 1);
            },
            onLeft: () => {
                if (!isAnimating) goToPanel(currentIndex + 1);
            },
            onRight: () => {
                if (!isAnimating) goToPanel(currentIndex - 1);
            },
        });

        return () => {
            isDesktopDeck = false;
            document.body.classList.remove('deck-locked');
            observer.kill();
            projectTriggers.forEach((st) => st.kill());
            if (projectsPanel) projectsPanel.removeEventListener('scroll', onPanelScroll);
            panels.forEach((p) => gsap.set(p, { clearProps: 'all' }));
        };
    });

    // Mobile fallback: natural vertical scroll with ScrollTrigger tracking
    mm.add('(max-width: 899px)', () => {
        isDesktopDeck = false;
        document.body.classList.remove('deck-locked');

        const mobileProjectTriggers = setupProjectRowScroll(window);

        panels.forEach((panel, idx) => {
            ScrollTrigger.create({
                trigger: panel,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => updateActiveUI(idx),
                onEnterBack: () => updateActiveUI(idx),
            });
        });

        gsap.to('#scroll-progress', {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.2,
            },
        });

        return () => {
            mobileProjectTriggers.forEach((st) => st.kill());
        };
    });
})();
