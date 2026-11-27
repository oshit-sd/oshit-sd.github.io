/* ==========================================================================
   Oshit Sutra Dar — Right-to-Left GSAP Section Deck + Infinite Card Slider
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

    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const panels = Array.from(document.querySelectorAll('.deck-panel'));
    const navLinks = Array.from(document.querySelectorAll('nav a.nav-link'));
    const railItems = Array.from(document.querySelectorAll('.rail-item'));
    const hudCurrent = document.getElementById('hud-current');
    const hudTitle = document.getElementById('hud-title');
    const hudPrev = document.getElementById('hud-prev');
    const hudNext = document.getElementById('hud-next');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentIndex = 0;
    let isDesktopDeck = false;

    // ── GSAP horizontalLoop Helper (sub-pixel precision, snap: false) ──────
    function horizontalLoop(items, config) {
        items = gsap.utils.toArray(items);
        config = config || {};
        let onChange = config.onChange,
            lastIndex = 0,
            tl = gsap.timeline({
                repeat: config.repeat,
                onUpdate:
                    onChange &&
                    function () {
                        const i = tl.closestIndex();
                        if (lastIndex !== i) {
                            lastIndex = i;
                            onChange(items[i], i);
                        }
                    },
                paused: config.paused,
                defaults: { ease: 'none', force3D: true },
                onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
            }),
            length = items.length,
            startX = items[0].offsetLeft,
            times = [],
            widths = [],
            spaceBefore = [],
            xPercents = [],
            curIndex = 0,
            indexIsDirty = false,
            center = config.center,
            pixelsPerSecond = (config.speed || 1) * 100,
            snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
            timeOffset = 0,
            container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
            totalWidth,
            getTotalWidth = () =>
                items[length - 1].offsetLeft +
                (xPercents[length - 1] / 100) * widths[length - 1] -
                startX +
                spaceBefore[0] +
                items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], 'scaleX') +
                (parseFloat(config.paddingRight) || 0),
            populateWidths = () => {
                let b1 = container.getBoundingClientRect(),
                    b2;
                items.forEach((el, i) => {
                    widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px'));
                    xPercents[i] = snap((parseFloat(gsap.getProperty(el, 'x', 'px')) / widths[i]) * 100 + gsap.getProperty(el, 'xPercent'));
                    b2 = el.getBoundingClientRect();
                    spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
                    b1 = b2;
                });
                gsap.set(items, { xPercent: (i) => xPercents[i] });
                totalWidth = getTotalWidth();
            },
            timeWrap,
            populateOffsets = () => {
                timeOffset = center ? (tl.duration() * (container.offsetWidth / 2)) / totalWidth : 0;
                center &&
                    times.forEach((t, i) => {
                        times[i] = timeWrap(tl.labels['label' + i] + (tl.duration() * widths[i]) / 2 / totalWidth - timeOffset);
                    });
            },
            getClosest = (values, value, wrap) => {
                let i = values.length,
                    closest = 1e10,
                    index = 0,
                    d;
                while (i--) {
                    d = Math.abs(values[i] - value);
                    if (d > wrap / 2) d = wrap - d;
                    if (d < closest) {
                        closest = d;
                        index = i;
                    }
                }
                return index;
            },
            populateTimeline = () => {
                let i, item, curX, distanceToStart, distanceToLoop;
                tl.clear();
                for (i = 0; i < length; i++) {
                    item = items[i];
                    curX = (xPercents[i] / 100) * widths[i];
                    distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
                    distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, 'scaleX');
                    tl.to(item, { xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
                        .fromTo(
                            item,
                            { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
                            { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false },
                            distanceToLoop / pixelsPerSecond
                        )
                        .add('label' + i, distanceToStart / pixelsPerSecond);
                    times[i] = distanceToStart / pixelsPerSecond;
                }
                timeWrap = gsap.utils.wrap(0, tl.duration());
            },
            refresh = (deep) => {
                let progress = tl.progress();
                tl.progress(0, true);
                populateWidths();
                deep && populateTimeline();
                populateOffsets();
                deep && tl.time(times[curIndex], true);
                if (!deep) tl.progress(progress, true);
            };

        gsap.set(items, { x: 0 });
        populateWidths();
        populateTimeline();
        populateOffsets();
        window.addEventListener('resize', () => refresh(true));

        tl.closestIndex = (setCurrent) => {
            let index = getClosest(times, tl.time(), tl.duration());
            if (setCurrent) {
                curIndex = index;
                indexIsDirty = false;
            }
            return index;
        };
        tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
        tl.times = times;
        tl.progress(1, true).progress(0, true);
        tl.closestIndex(true);
        lastIndex = curIndex;
        onChange && onChange(items[curIndex], curIndex);
        return tl;
    }

    // ── Project Slider State ──────────────────────────────────────────────
    const projectsSection = document.getElementById('projects');
    const sliderViewport = document.querySelector('.slider-viewport');
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');
    const sliderCurrent = document.getElementById('slider-current');
    const sliderTotal = document.getElementById('slider-total');
    const sliderProgressFill = document.getElementById('slider-progress-fill');
    const sliderActiveTitle = document.getElementById('slider-active-title');
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const allCards = Array.from(document.querySelectorAll('#project-slider-track .slider-card'));

    let activeLoop = null;
    let visibleCards = [];
    let currentCardIndex = 0;
    let isGridView = false;
    let sliderSpan = 4.2;

    // Master desktop ScrollTrigger & section scroll positions
    let masterST = null;
    let masterTl = null;
    let sectionTimes = {};
    let projectsStartTime = 2;
    let projectsEndTime = 6.2;
    let mobileProjectsST = null;

    function buildInnerSectionTimeline(panel) {
        if (prefersReducedMotion) return null;
        const header = panel.querySelector('.panel-header');
        const items = panel.querySelectorAll('.panel-item');
        const tl = gsap.timeline({ paused: true });

        if (header) {
            tl.fromTo(
                header,
                { x: 48, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' }
            );
        }

        if (items.length) {
            tl.fromTo(
                items,
                { x: 56, scale: 0.96, opacity: 0 },
                { x: 0, scale: 1, opacity: 1, duration: 0.48, stagger: 0.065, ease: 'power3.out', clearProps: 'transform,opacity' },
                header ? '-=0.32' : 0
            );
        }

        if (panel.id === 'services') {
            const icons = panel.querySelectorAll('h3 i');
            const chips = panel.querySelectorAll('.panel-item .font-mono');
            if (icons.length) {
                tl.fromTo(icons, { scale: 0.4, rotation: -25, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.38, stagger: 0.04, ease: 'back.out(1.8)', clearProps: 'transform,opacity' }, '-=0.4');
            }
            if (chips.length) {
                tl.fromTo(chips, { y: 10, scale: 0.88, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.34, stagger: 0.015, ease: 'back.out(1.5)', clearProps: 'transform,opacity' }, '-=0.35');
            }
        } else if (panel.id === 'experience') {
            const bullets = panel.querySelectorAll('ul li');
            if (bullets.length) {
                tl.fromTo(bullets, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.36, stagger: 0.032, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.28');
            }
        } else if (panel.id === 'about') {
            const bioParas = panel.querySelectorAll('.space-y-4 p');
            const quickRows = panel.querySelectorAll('.space-y-3 > div');
            if (bioParas.length) {
                tl.fromTo(bioParas, { x: 32, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.38');
            }
            if (quickRows.length) {
                tl.fromTo(quickRows, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.36, stagger: 0.055, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.32');
            }
        } else if (panel.id === 'contact') {
            const ctas = panel.querySelectorAll('.btn-primary, .btn-secondary, button[data-jump]');
            if (ctas.length) {
                tl.fromTo(ctas, { y: 16, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.38, stagger: 0.06, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }, '-=0.22');
            }
        }

        return tl;
    }

    const innerTimelines = {};
    const innerPlayed = {};
    panels.forEach((p) => {
        if (p.id !== 'home' && p.id !== 'projects') {
            innerTimelines[p.id] = buildInnerSectionTimeline(p);
            innerPlayed[p.id] = false;
        }
    });

    function triggerInnerForIndex(idx) {
        const panel = panels[idx];
        if (!panel) return;
        const tl = innerTimelines[panel.id];
        if (tl && !innerPlayed[panel.id]) {
            innerPlayed[panel.id] = true;
            tl.play(0);
        }
    }

    function updateActiveUI(index) {
        if (currentIndex !== index) {
            currentIndex = index;
            triggerInnerForIndex(index);
        }
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
    }

    function initSliderCards(filter = 'all') {
        if (activeLoop) {
            activeLoop.kill();
            activeLoop = null;
        }

        allCards.forEach((card) => {
            card.classList.remove('is-active');
            gsap.set(card, { clearProps: 'x,xPercent,y,scale,opacity,transform' });
            const match = filter === 'all' || card.getAttribute('data-category') === filter;
            card.style.display = match ? '' : 'none';
        });

        visibleCards = allCards.filter((c) => c.style.display !== 'none');
        currentCardIndex = 0;
        if (sliderTotal) sliderTotal.textContent = String(visibleCards.length).padStart(2, '0');
        if (sliderCurrent) sliderCurrent.textContent = visibleCards.length ? '01' : '00';
        if (sliderProgressFill) gsap.set(sliderProgressFill, { scaleX: 0 });
        if (sliderActiveTitle && visibleCards[0]) {
            const titleEl = visibleCards[0].querySelector('h3');
            if (titleEl) sliderActiveTitle.textContent = titleEl.textContent.trim();
        }

        if (!visibleCards.length || isGridView) {
            if (isGridView && !prefersReducedMotion && visibleCards.length) {
                gsap.fromTo(
                    visibleCards,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
                );
            }
            return;
        }

        activeLoop = horizontalLoop(visibleCards, {
            paused: true,
            center: true,
            snap: false,
            paddingRight: 20,
            repeat: -1,
            onChange: (element, index) => {
                currentCardIndex = index;
                visibleCards.forEach((c) => {
                    const active = c === element;
                    c.classList.toggle('is-active', active);
                    if (!prefersReducedMotion) {
                        gsap.to(c, { scale: active ? 1 : 0.94, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
                    }
                });
                if (sliderCurrent) sliderCurrent.textContent = String(index + 1).padStart(2, '0');
                if (sliderActiveTitle && element) {
                    const titleEl = element.querySelector('h3');
                    if (titleEl) sliderActiveTitle.textContent = titleEl.textContent.trim();
                }
            },
        });

        visibleCards.forEach((card, idx) => {
            card.onclick = (e) => {
                if (e.target.closest('a')) return;
                scrollToCardIndex(idx);
            };
        });
    }

    function scrollToCardIndex(index) {
        if (!visibleCards.length || isGridView) return;
        const clamped = Math.max(0, Math.min(visibleCards.length - 1, index));
        const ratio = visibleCards.length > 1 ? clamped / (visibleCards.length - 1) : 0;

        if (isDesktopDeck && masterST && masterTl) {
            const targetTime = gsap.utils.interpolate(projectsStartTime, projectsEndTime, ratio);
            const targetY = masterST.start + (masterST.end - masterST.start) * (targetTime / masterTl.duration());
            gsap.to(window, { scrollTo: { y: targetY, autoKill: false }, duration: 0.7, ease: 'power3.out' });
        } else if (mobileProjectsST) {
            const targetY = mobileProjectsST.start + (mobileProjectsST.end - mobileProjectsST.start) * ratio;
            gsap.to(window, { scrollTo: { y: targetY, autoKill: false }, duration: 0.7, ease: 'power3.out' });
        }
    }

    function jumpToSection(sectionId) {
        closeMobileMenu();
        const targetIndex = panels.findIndex((p) => p.getAttribute('data-section') === sectionId);
        if (targetIndex === -1) return;

        if (isDesktopDeck && masterST && masterTl && sectionTimes[sectionId] !== undefined) {
            const targetTime = sectionTimes[sectionId];
            const targetY = masterST.start + (masterST.end - masterST.start) * (targetTime / masterTl.duration());
            gsap.to(window, { duration: 0.9, scrollTo: { y: targetY, autoKill: false }, ease: 'power3.inOut' });
        } else {
            const targetEl = panels[targetIndex];
            const yTarget = sectionId === 'home' ? 0 : sectionId === 'projects' && mobileProjectsST ? mobileProjectsST.start : targetEl;
            gsap.to(window, { duration: 0.9, scrollTo: { y: yTarget, autoKill: false }, ease: 'power3.inOut' });
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
            const prev = Math.max(0, currentIndex - 1);
            jumpToSection(panels[prev].getAttribute('data-section'));
        });
    }
    if (hudNext) {
        hudNext.addEventListener('click', () => {
            const next = Math.min(panels.length - 1, currentIndex + 1);
            jumpToSection(panels[next].getAttribute('data-section'));
        });
    }

    window.addEventListener('keydown', (e) => {
        if (currentIndex === 2 && visibleCards.length && !isGridView) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollToCardIndex(currentCardIndex + 1);
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollToCardIndex(currentCardIndex - 1);
                return;
            }
        }
        if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            const target = e.key === 'ArrowDown' ? Math.min(panels.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
            jumpToSection(panels[target].getAttribute('data-section'));
        }
    });

    if (sliderPrev) sliderPrev.addEventListener('click', () => scrollToCardIndex(currentCardIndex - 1));
    if (sliderNext) sliderNext.addEventListener('click', () => scrollToCardIndex(currentCardIndex + 1));

    // Horizontal drag inside slider maps smoothly to scroll position
    if (sliderViewport) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartScroll = 0;

        sliderViewport.addEventListener('pointerdown', (e) => {
            if (isGridView || e.target.closest('a, button')) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartScroll = window.scrollY;
            sliderViewport.setPointerCapture(e.pointerId);
        });
        sliderViewport.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            window.scrollTo(0, dragStartScroll - dx * 1.35);
        });
        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            try { sliderViewport.releasePointerCapture(e.pointerId); } catch (_) {}
        };
        sliderViewport.addEventListener('pointerup', stopDrag);
        sliderViewport.addEventListener('pointercancel', stopDrag);
    }

    // ── Responsive GSAP Setup (Desktop Right-to-Left Deck vs Mobile) ──────
    const mm = gsap.matchMedia();
    let rebuildDesktopDeck = null;
    let rebuildMobileSlider = null;

    mm.add('(min-width: 900px)', () => {
        isDesktopDeck = true;

        const buildDeck = (filter = 'all') => {
            if (masterST) masterST.kill();
            if (masterTl) masterTl.kill();
            masterST = null;
            masterTl = null;

            initSliderCards(filter);

            // Reset panel transforms: explicit x: 0 avoids CSS matrix double-offset
            panels.forEach((panel, i) => {
                gsap.set(panel, {
                    x: 0,
                    xPercent: i === 0 ? 0 : 100,
                    y: 0,
                    yPercent: 0,
                    scale: 1,
                    opacity: 1,
                    zIndex: i + 1,
                });
                panel.scrollTop = 0;
            });

            sliderSpan = isGridView ? 0 : Math.max(1.2, (visibleCards.length - 1) * 0.28);
            const startOffset = activeLoop ? activeLoop.times[0] || 0 : 0;
            const endOffset = activeLoop
                ? startOffset + activeLoop.duration() * ((visibleCards.length - 1) / Math.max(1, visibleCards.length))
                : 0;

            sectionTimes = {};
            masterTl = gsap.timeline({ defaults: { ease: 'none' } });

            // 0 -> 1: Home -> Services (right-to-left)
            sectionTimes.home = 0;
            masterTl
                .to(panels[0], { xPercent: -18, scale: 0.95, opacity: 0.25, duration: 1 }, 0)
                .to(panels[1], { xPercent: 0, duration: 1 }, 0);
            sectionTimes.services = 1;

            // 1 -> 2: Services -> Projects (right-to-left)
            masterTl
                .to(panels[1], { xPercent: -18, scale: 0.95, opacity: 0.25, duration: 1 }, 1)
                .to(panels[2], { xPercent: 0, duration: 1 }, 1);
            sectionTimes.projects = 2;
            projectsStartTime = 2;

            // 2 -> 2 + sliderSpan: Projects horizontal infinite slider scrub
            const sliderObj = { progress: 0 };
            if (!isGridView && sliderSpan > 0 && activeLoop) {
                masterTl.to(
                    sliderObj,
                    {
                        progress: 1,
                        duration: sliderSpan,
                        ease: 'none',
                        onUpdate: () => {
                            if (!activeLoop) return;
                            const targetTime = gsap.utils.interpolate(startOffset, endOffset, sliderObj.progress);
                            activeLoop.totalTime(targetTime);
                            if (sliderProgressFill) gsap.set(sliderProgressFill, { scaleX: sliderObj.progress });
                        },
                    },
                    projectsStartTime
                );
            }
            projectsEndTime = projectsStartTime + sliderSpan;

            // Remaining sections: Experience, About, Contact (each slides right-to-left)
            const tExp = projectsEndTime;
            masterTl
                .to(panels[2], { xPercent: -18, scale: 0.95, opacity: 0.25, duration: 1 }, tExp)
                .to(panels[3], { xPercent: 0, duration: 1 }, tExp);
            sectionTimes.experience = tExp + 1;

            const tAbout = tExp + 1;
            masterTl
                .to(panels[3], { xPercent: -18, scale: 0.95, opacity: 0.25, duration: 1 }, tAbout)
                .to(panels[4], { xPercent: 0, duration: 1 }, tAbout);
            sectionTimes.about = tAbout + 1;

            const tContact = tAbout + 1;
            masterTl
                .to(panels[4], { xPercent: -18, scale: 0.95, opacity: 0.25, duration: 1 }, tContact)
                .to(panels[5], { xPercent: 0, duration: 1 }, tContact);
            sectionTimes.contact = tContact + 1;

            const totalDur = masterTl.duration();
            const sectionStops = [
                0,
                sectionTimes.services,
                sectionTimes.projects,
                sectionTimes.experience,
                sectionTimes.about,
                sectionTimes.contact,
            ];

            masterST = ScrollTrigger.create({
                trigger: '#deck-stage',
                pin: true,
                scrub: 0.75,
                anticipatePin: 1,
                start: 'top top',
                end: () => `+=${totalDur * window.innerHeight * 0.9}`,
                animation: masterTl,
                snap: {
                    snapTo: (value) => {
                        const t = value * totalDur;
                        if (!isGridView && t >= projectsStartTime && t <= projectsEndTime && visibleCards.length > 1) {
                            const localP = (t - projectsStartTime) / (projectsEndTime - projectsStartTime);
                            const snappedCard = Math.round(localP * (visibleCards.length - 1)) / (visibleCards.length - 1);
                            return (projectsStartTime + snappedCard * (projectsEndTime - projectsStartTime)) / totalDur;
                        }
                        let closest = sectionStops[0];
                        let minD = Infinity;
                        sectionStops.forEach((s) => {
                            const d = Math.abs(t - s);
                            if (d < minD) {
                                minD = d;
                                closest = s;
                            }
                        });
                        return closest / totalDur;
                    },
                    duration: { min: 0.2, max: 0.48 },
                    delay: 0.12,
                    ease: 'power2.out',
                },
                onUpdate: (self) => {
                    gsap.set('#scroll-progress', { scaleX: self.progress });
                    const curTime = masterTl.time();
                    let activeIdx = 0;
                    if (curTime >= sectionTimes.contact - 0.35) activeIdx = 5;
                    else if (curTime >= sectionTimes.about - 0.35) activeIdx = 4;
                    else if (curTime >= sectionTimes.experience - 0.35) activeIdx = 3;
                    else if (curTime >= sectionTimes.projects - 0.35) activeIdx = 2;
                    else if (curTime >= sectionTimes.services - 0.35) activeIdx = 1;
                    updateActiveUI(activeIdx);
                },
            });

            ScrollTrigger.refresh();
        };

        rebuildDesktopDeck = buildDeck;
        buildDeck('all');

        return () => {
            isDesktopDeck = false;
            rebuildDesktopDeck = null;
            if (masterST) masterST.kill();
            if (masterTl) masterTl.kill();
            masterST = null;
            masterTl = null;
            panels.forEach((p) => gsap.set(p, { clearProps: 'all' }));
        };
    });

    mm.add('(max-width: 899px)', () => {
        isDesktopDeck = false;

        const buildMobile = (filter = 'all') => {
            if (mobileProjectsST) mobileProjectsST.kill();
            mobileProjectsST = null;
            initSliderCards(filter);

            if (!isGridView && activeLoop && visibleCards.length) {
                const startOffset = activeLoop.times[0] || 0;
                const endOffset = startOffset + activeLoop.duration() * ((visibleCards.length - 1) / Math.max(1, visibleCards.length));
                mobileProjectsST = ScrollTrigger.create({
                    trigger: projectsSection,
                    pin: true,
                    pinSpacing: true,
                    scrub: 0.8,
                    start: 'top top',
                    end: () => `+=${Math.max(700, (visibleCards.length - 1) * 180)}`,
                    onUpdate: (self) => {
                        if (!activeLoop) return;
                        activeLoop.totalTime(gsap.utils.interpolate(startOffset, endOffset, self.progress));
                        if (sliderProgressFill) gsap.set(sliderProgressFill, { scaleX: self.progress });
                    },
                });
            }
            ScrollTrigger.refresh();
        };

        rebuildMobileSlider = buildMobile;
        buildMobile('all');

        const panelTriggers = panels.map((panel, idx) =>
            ScrollTrigger.create({
                trigger: panel,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => updateActiveUI(idx),
                onEnterBack: () => updateActiveUI(idx),
            })
        );

        const progTween = gsap.to('#scroll-progress', {
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
            rebuildMobileSlider = null;
            if (mobileProjectsST) mobileProjectsST.kill();
            panelTriggers.forEach((st) => st.kill());
            if (progTween.scrollTrigger) progTween.scrollTrigger.kill();
        };
    });

    // Filter Pills + Grid/Slider View Toggle
    const filterPills = document.querySelectorAll('.filter-pill');
    const applyFilter = (filter) => {
        if (isDesktopDeck && rebuildDesktopDeck) {
            const wasAtProjects = currentIndex === 2;
            rebuildDesktopDeck(filter);
            if (wasAtProjects && masterST && masterTl) {
                const targetY = masterST.start + (masterST.end - masterST.start) * (sectionTimes.projects / masterTl.duration());
                window.scrollTo(0, targetY);
            }
        } else if (rebuildMobileSlider) {
            rebuildMobileSlider(filter);
        }
    };

    filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const filter = pill.getAttribute('data-filter');
            filterPills.forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            applyFilter(filter);
        });
    });

    if (toggleViewBtn && sliderViewport && projectsSection) {
        toggleViewBtn.addEventListener('click', () => {
            isGridView = !isGridView;
            sliderViewport.classList.toggle('is-grid-view', isGridView);
            projectsSection.classList.toggle('is-grid-expanded', isGridView);
            if (sliderPrev) sliderPrev.style.display = isGridView ? 'none' : '';
            if (sliderNext) sliderNext.style.display = isGridView ? 'none' : '';
            if (sliderProgressFill && sliderProgressFill.parentElement) {
                sliderProgressFill.parentElement.style.display = isGridView ? 'none' : '';
            }
            const icon = toggleViewBtn.querySelector('i');
            const label = toggleViewBtn.querySelector('span');
            if (icon) {
                icon.classList.toggle('fa-grip', !isGridView);
                icon.classList.toggle('fa-sliders', isGridView);
            }
            if (label) label.textContent = isGridView ? 'Slider View' : 'Grid View';

            const activeFilter = document.querySelector('.filter-pill.active')?.getAttribute('data-filter') || 'all';
            applyFilter(activeFilter);
        });
    }

    // ── Hero Name SplitText & Interactive Micro-Animations ────────────────
    if (!prefersReducedMotion) {
        const heroNameWrap = document.getElementById('hero-name');
        const heroNameText = document.getElementById('hero-name-text');
        let heroChars = [];

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
            gsap.fromTo(
                heroChars,
                { yPercent: 115, rotateZ: 6, opacity: 0 },
                { yPercent: 0, rotateZ: 0, opacity: 1, duration: 0.85, stagger: 0.032, ease: 'power4.out' }
            );

            heroChars.forEach((ch, idx) => {
                ch.addEventListener('mouseenter', () => {
                    gsap.to(ch, { y: -8, scale: 1.14, color: '#60a5fa', duration: 0.22, ease: 'power2.out' });
                    [heroChars[idx - 1], heroChars[idx + 1]].forEach((n) => {
                        if (n) gsap.to(n, { y: -3, duration: 0.22, ease: 'power2.out' });
                    });
                });
                ch.addEventListener('mouseleave', () => {
                    gsap.to(ch, { y: 0, scale: 1, color: '#ffffff', duration: 0.4, ease: 'elastic.out(1, 0.45)' });
                    [heroChars[idx - 1], heroChars[idx + 1]].forEach((n) => {
                        if (n) gsap.to(n, { y: 0, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
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

        gsap.from('.hero-stagger', { y: 18, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out' });
        gsap.from('.hero-visual', { x: 26, opacity: 0, duration: 0.7, delay: 0.12, ease: 'power3.out' });

        // Ambient SVG shapes float + mouse parallax
        const shapes = Array.from(document.querySelectorAll('.gsap-shape'));
        shapes.forEach((shape, i) => {
            gsap.to(shape, {
                y: i % 2 === 0 ? -12 : 12,
                rotation: i % 2 === 0 ? 25 : -25,
                duration: 3.6 + i * 0.6,
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
                const depth = Number(shape.getAttribute('data-depth')) || 14;
                shapeQuickX[i](normX * depth);
            });
        });

        // Interactive card spotlight & subtle 3D tilt (non-slider cards)
        document.querySelectorAll('.arch-card').forEach((card) => {
            if (card.classList.contains('slider-card')) return;
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

        document.querySelectorAll('#services .font-mono').forEach((badge) => {
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
})();
