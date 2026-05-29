/* ============================================================
   AX 강사 소개 페이지 — 인터랙션 스크립트
   ============================================================ */

(function () {
    'use strict';

    /* ------------------------------------------------------------
       1. 모바일 햄버거 메뉴
       ------------------------------------------------------------ */
    function setupMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isOpen));
            menu.classList.toggle('is-open');
        });

        // 메뉴 항목 클릭 시 메뉴 닫기
        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('is-open');
            });
        });
    }

    /* ------------------------------------------------------------
       2. 커리큘럼 모달 (열기 / 닫기 / 포커스 트랩)
       ------------------------------------------------------------ */
    function setupCurriculumModal() {
        const modal = document.getElementById('curriculum-modal');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const closeBtn = modal?.querySelector('.modal-close');
        const inquiryBtn = document.getElementById('modal-inquiry-btn');
        if (!modal || !titleEl || !bodyEl || !closeBtn || !inquiryBtn) return;

        let currentCourseName = '';
        let lastTrigger = null;

        // 카드별 "자세히 보기" 버튼 → 모달 열기 + template 내용 주입
        document.querySelectorAll('.curriculum-detail-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.curriculum-card');
                if (!card) return;

                const courseName = card.querySelector('.curriculum-card-title')?.innerText.trim() || '강의 상세';
                const template = card.querySelector('.curriculum-detail-template');

                titleEl.innerText = courseName;
                bodyEl.innerHTML = template ? template.innerHTML : '<p>상세 내용 준비 중입니다.</p>';

                currentCourseName = courseName;
                lastTrigger = btn;
                openModal();
            });
        });

        function openModal() {
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            // 첫 포커서블 요소(닫기 버튼)로 포커스 이동
            requestAnimationFrame(() => closeBtn.focus());
        }

        function closeModal() {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            // 트리거 버튼으로 포커스 복귀
            if (lastTrigger) lastTrigger.focus();
        }

        // 닫기: X 버튼 / 배경 클릭 / ESC
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) closeModal();
            // 포커스 트랩
            if (e.key === 'Tab' && !modal.hidden) trapFocus(e);
        });

        function trapFocus(e) {
            const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        // "이 강의 문의하기" → 폼 채우고 문의로 이동
        inquiryBtn.addEventListener('click', () => {
            const courseInput = document.getElementById('contact-course');
            if (courseInput) courseInput.value = currentCourseName.replace(/\s+/g, ' ');

            closeModal();

            const formToggle = document.querySelector('.contact-form-toggle');
            if (formToggle && !formToggle.open) formToggle.open = true;

            const contact = document.getElementById('section-contact');
            if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    /* ------------------------------------------------------------
       3. Hero 숫자 카운트업 애니메이션
       ------------------------------------------------------------ */
    function setupHeroCountUp() {
        const stats = document.querySelectorAll('.hero-stat-number');
        if (!stats.length || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    if (el.dataset.animated) return;
                    el.dataset.animated = 'true';

                    // <small> 단위(년, 연구원, 분야) 분리
                    const small = el.querySelector('small');
                    const smallText = small ? small.outerHTML : '';
                    // 첫 textNode (숫자 또는 '책임'/'現')
                    const mainText = (el.firstChild?.textContent || '').trim();
                    const target = parseInt(mainText, 10);

                    // 숫자인 경우에만 카운트업, 아니면(現, 책임) 그대로 둠
                    if (!isNaN(target) && String(target) === mainText) {
                        animateNumber(el, target, smallText, 1200);
                    }
                });
            },
            { threshold: 0.4 }
        );

        stats.forEach((s) => observer.observe(s));
    }

    function animateNumber(element, target, suffix, duration) {
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.floor(eased * target);
            element.innerHTML = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                element.innerHTML = target + suffix;
            }
        }

        requestAnimationFrame(tick);
    }

    /* ------------------------------------------------------------
       4. 문의 폼 제출 (mailto 방식)
       ------------------------------------------------------------ */
    function setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const data = new FormData(form);
            const name = (data.get('name') || '').trim();
            const affiliation = (data.get('affiliation') || '').trim();
            const email = (data.get('email') || '').trim();
            const type = (data.get('type') || '').trim();
            const course = (data.get('course') || '').trim();
            const message = (data.get('message') || '').trim();

            const subject = `[강의 문의] ${name}${affiliation ? ' / ' + affiliation : ''}`;
            const body = [
                `이름: ${name}`,
                `소속: ${affiliation}`,
                `이메일: ${email}`,
                `문의 유형: ${type}`,
                `관심 강의: ${course}`,
                ``,
                `─── 메시지 ───`,
                message,
            ].join('\n');

            const mailto =
                'mailto:kamon00@naver.com?subject=' +
                encodeURIComponent(subject) +
                '&body=' +
                encodeURIComponent(body);

            window.location.href = mailto;

            showFormSuccess(form);
        });
    }

    function showFormSuccess(form) {
        const existing = form.querySelector('.form-success');
        if (existing) existing.remove();

        const msg = document.createElement('div');
        msg.className = 'form-success';
        msg.textContent = '✓ 메일 앱이 열렸습니다. 발송 버튼을 눌러 문의를 마무리해 주세요.';
        form.appendChild(msg);

        setTimeout(() => msg.remove(), 6000);
    }

    /* ------------------------------------------------------------
       초기화
       ------------------------------------------------------------ */
    function init() {
        setupMobileMenu();
        setupCurriculumModal();
        setupHeroCountUp();
        setupContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
