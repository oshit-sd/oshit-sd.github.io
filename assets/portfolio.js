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

    // Archive Modal + Filter
    const archiveModal = document.getElementById('archive-modal');
    const openArchiveBtn = document.getElementById('open-archive-btn');
    const closeArchiveBtn = document.getElementById('close-archive-btn');

    if (openArchiveBtn && archiveModal) {
        openArchiveBtn.addEventListener('click', () => archiveModal.classList.add('open'));
    }
    if (closeArchiveBtn && archiveModal) {
        closeArchiveBtn.addEventListener('click', () => archiveModal.classList.remove('open'));
    }
    if (archiveModal) {
        archiveModal.addEventListener('click', (e) => {
            if (e.target === archiveModal) archiveModal.classList.remove('open');
        });
    }

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
            gsap.set(nextPanel, { yPercent: 0, scale: 1, autoAlpha: 1, zIndex: 10 });
            isAnimating = false;
            return;
        }

        gsap.set(currentPanel, { zIndex: 5 });
        gsap.set(nextPanel, {
            zIndex: 10,
            autoAlpha: 1,
            scale: 1,
            yPercent: direction > 0 ? 100 : -100,
        });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(currentPanel, { autoAlpha: 0, zIndex: 1, scale: 1, yPercent: 0 });
                // Small cooldown prevents trackpad inertia from triggering a second jump
                setTimeout(() => {
                    isAnimating = false;
                }, 140);
            },
        });

        tl.to(currentPanel, {
            yPercent: direction > 0 ? -12 : 12,
            scale: 0.96,
            autoAlpha: 0.25,
            duration: 0.72,
            ease: 'power3.inOut',
        }).to(
            nextPanel,
            {
                yPercent: 0,
                duration: 0.72,
                ease: 'power3.inOut',
            },
            '<'
        );

        if (nextItems.length) {
            tl.fromTo(
                nextItems,
                { y: direction > 0 ? 22 : -22, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.48,
                    stagger: 0.055,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity',
                },
                '-=0.35'
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
        if (archiveModal && archiveModal.classList.contains('open')) {
            if (e.key === 'Escape') archiveModal.classList.remove('open');
            return;
        }
        if (!isDesktopDeck) return;

        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            goToPanel(currentIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            goToPanel(currentIndex - 1);
        }
    });

    // Hero entrance on load
    if (!prefersReducedMotion) {
        gsap.from('.hero-stagger', {
            y: 18,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power3.out',
        });
        gsap.from('.hero-visual', {
            y: 22,
            opacity: 0,
            duration: 0.7,
            delay: 0.12,
            ease: 'power3.out',
        });
    }

    // Desktop: One-section-at-a-time GSAP Observer (prevents fast scroll skipping)
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
        isDesktopDeck = true;
        document.body.classList.add('deck-locked');

        panels.forEach((panel, i) => {
            gsap.set(panel, {
                autoAlpha: i === 0 ? 1 : 0,
                yPercent: 0,
                scale: 1,
                zIndex: i === 0 ? 10 : 1,
            });
        });
        updateActiveUI(0);

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
                if (archiveModal && archiveModal.classList.contains('open')) return;
                const now = Date.now();
                if (isAnimating || now - lastWheelTime < 450) return;
                const activePanel = panels[currentIndex];
                if (canPanelScrollInternally(activePanel, 1)) return;
                lastWheelTime = now;
                goToPanel(currentIndex + 1);
            },
            onDown: () => {
                if (archiveModal && archiveModal.classList.contains('open')) return;
                const now = Date.now();
                if (isAnimating || now - lastWheelTime < 450) return;
                const activePanel = panels[currentIndex];
                if (canPanelScrollInternally(activePanel, -1)) return;
                lastWheelTime = now;
                goToPanel(currentIndex - 1);
            },
        });

        return () => {
            isDesktopDeck = false;
            document.body.classList.remove('deck-locked');
            observer.kill();
            panels.forEach((p) => gsap.set(p, { clearProps: 'all' }));
        };
    });

    // Mobile fallback: natural vertical scroll with ScrollTrigger tracking
    mm.add('(max-width: 899px)', () => {
        isDesktopDeck = false;
        document.body.classList.remove('deck-locked');

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
    });
})();
