/* Slate — Website controller (vanilla SPA)
   Recreates the React UI-kit click-through with real DOM. */
(function () {
  'use strict';

  const PRODUCTS = [
    { id: 1, brand: 'SLATE',  name: '메리노 립 니트',   price: '₩128,000', badge: 'New In',   color: '#D8CDBE' },
    { id: 2, brand: 'SLATE',  name: '울 트렌치 코트',   price: '₩189,000', originalPrice: '₩289,000', badge: 'Sale', sale: true, color: '#B8BAC0' },
    { id: 3, brand: 'SLATE',  name: '실크 블라우스',     price: '₩98,000',  color: '#E4DDD4' },
    { id: 4, brand: 'SLATE',  name: '카시미어 스카프',   price: '₩158,000', badge: 'New In',   color: '#C8C4BC' },
    { id: 5, brand: 'OBJECT', name: '세라믹 화병 소',   price: '₩68,000',  color: '#D5DDD8' },
    { id: 6, brand: 'OBJECT', name: '린넨 쿠션 커버',   price: '₩45,000',  badge: 'New In',   color: '#E0DBD4' },
    { id: 7, brand: 'SLATE',  name: '울 팬츠',          price: '₩148,000', color: '#B4B8BE' },
    { id: 8, brand: 'OBJECT', name: '오크 트레이',      price: '₩52,000',  badge: 'Sold Out', sale: true, color: '#C8BEA8' },
  ];

  const NAV = ['Women', 'Men', 'Home', 'Sale'];
  const TABS = ['All', 'Women', 'Men', 'Home'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const SOLD_OUT = ['XS', 'XL'];

  const state = { page: 'home', wishlist: [2], cart: [], product: null, tab: { home: 'All', plp: 'All' } };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const heartSVG = (filled) =>
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="${filled ? '#1E1E1E' : 'none'}" stroke="#1E1E1E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  function filterFor(tab) {
    if (tab === 'All') return PRODUCTS;
    if (tab === 'Home') return PRODUCTS.filter(p => p.brand === 'OBJECT');
    return PRODUCTS.filter(p => p.brand === 'SLATE').slice(0, 4);
  }

  function cardHTML(p) {
    const tag = p.badge
      ? `<span class="tag ${p.sale ? 'tag--sale' : ''} card__tag">${p.badge}</span>` : '';
    const orig = p.originalPrice ? `<span class="u-price-orig">${p.originalPrice}</span>` : '';
    return `<div class="card" data-product="${p.id}">
      <div class="card__img">
        <div class="card__img-fill" style="background:${p.color}"></div>
        ${tag}
        <button class="wish-btn" data-wish="${p.id}">${heartSVG(state.wishlist.includes(p.id))}</button>
      </div>
      <span class="card__brand">${p.brand}</span>
      <span class="card__name">${p.name}</span>
      <div class="card__price-row">
        <span class="u-price ${p.sale ? 'u-price--sale' : ''}">${p.price}</span>${orig}
      </div>
    </div>`;
  }

  function renderTabs(which) {
    const wrap = $(`[data-tabs="${which}"]`);
    wrap.innerHTML = TABS.map(t =>
      `<button class="grid-tab ${state.tab[which] === t ? 'is-active' : ''}" data-tab="${which}:${t}">${t}</button>`
    ).join('');
  }

  function renderGrid(which) {
    $(`[data-grid="${which}"]`).innerHTML = filterFor(state.tab[which]).map(cardHTML).join('');
  }

  function renderNav() {
    $('#siteNav').innerHTML = NAV.map(item =>
      `<button class="site-nav__item ${isNavActive(item) ? 'is-active' : ''}" data-nav="${item.toLowerCase()}">${item}</button>`
    ).join('');
  }
  function isNavActive(item) {
    const k = item.toLowerCase();
    if (state.page === 'plp') return state.plpKey === k;
    return false;
  }

  function renderFooter() {
    const cols = {
      Shop: ['Women', 'Men', 'Home', 'Sale', 'New In'],
      Company: ['About', 'Stores', 'Careers', 'Press'],
      Support: ['고객센터', '배송 안내', '반품 정책', '사이즈 가이드'],
    };
    const colHTML = Object.entries(cols).map(([title, items]) =>
      `<div><div class="site-footer__col-title">${title}</div>
        <ul class="site-footer__col-list">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`
    ).join('');
    $('#siteFooter').innerHTML = `
      <div class="site-footer__grid">
        <div>
          <div class="site-footer__brand">SLATE</div>
          <p class="site-footer__tagline">불필요한 것을 걷어낸 쇼핑 경험. 엄선된 의류, 소품, 인테리어 오브제.</p>
        </div>${colHTML}
      </div>
      <div class="site-footer__bottom">
        <span class="site-footer__copy">© 2026 Slate. All rights reserved.</span>
        <div class="site-footer__legal"><span>이용약관</span><span>개인정보처리방침</span><span>사업자 정보</span></div>
      </div>`;
  }

  function renderPDP() {
    const p = state.product;
    if (!p) return;
    const orig = p.originalPrice ? `<span class="u-price-orig">${p.originalPrice}</span>` : '';
    const sizes = SIZES.map(sz => {
      const so = SOLD_OUT.includes(sz);
      return `<button class="size-btn ${so ? 'is-soldout' : ''}" data-size="${sz}" ${so ? 'disabled' : ''}>${sz}</button>`;
    }).join('');
    const wished = state.wishlist.includes(p.id);
    $('[data-page="pdp"]').innerHTML = `
      <div class="pdp">
        <div class="pdp__img" style="background:${p.color}">
          <button class="pdp__back" data-nav="home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            목록으로
          </button>
          <div class="pdp__img-ph"><span>Product Image</span></div>
        </div>
        <div class="pdp__info">
          <div class="pdp__brand">${p.brand}</div>
          <div class="pdp__name">${p.name}</div>
          <div class="pdp__price-row"><span class="u-price ${p.sale ? 'u-price--sale' : ''}">${p.price}</span>${orig}</div>
          <hr class="pdp__divider">
          <div class="section-label">사이즈 선택</div>
          <div class="size-grid" id="pdpSizes">${sizes}</div>
          <div class="pdp__cta-row">
            <button class="btn pdp__add is-disabled" id="pdpAdd">사이즈를 선택하세요</button>
            <button class="pdp__wish" data-wish="${p.id}">${heartSVG(wished)}</button>
          </div>
          <p class="pdp__desc">유연하고 따뜻한 메리노 울로 완성된 립 니트. 타이트한 립 패턴이 실루엣을 정돈하며, 계절이 바뀌어도 꺼내 입게 되는 기본기를 갖췄습니다.</p>
          <hr class="pdp__divider">
          <div class="pdp__detail">소재: 울 100% &nbsp;·&nbsp; 원산지: 이탈리아<br>드라이클리닝 권장 &nbsp;·&nbsp; 모델 착용: S 사이즈</div>
        </div>
      </div>`;
    state.selectedSize = null;
  }

  function setPage(page) {
    state.page = page;
    $$('[data-page]').forEach(el => el.classList.toggle('is-shown', el.dataset.page === page));
    renderNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goCategory(key) {
    state.plpKey = key;
    state.tab.plp = 'All';
    const labels = { women: ['Women', '우먼'], men: ['Men', '맨'], sale: ['Sale', '세일'], home: ['Home', '홈'] };
    const [eyebrow, title] = labels[key] || ['Shop', '전체'];
    $('[data-plp-eyebrow]').textContent = eyebrow;
    $('[data-plp-title]').textContent = title;
    renderTabs('plp');
    renderGrid('plp');
    setPage('plp');
  }

  function updateCartBadge() {
    const b = $('#cartBadge');
    if (state.cart.length > 0) { b.hidden = false; b.textContent = state.cart.length; }
    else b.hidden = true;
  }

  // Event delegation
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      const dest = navEl.dataset.nav;
      if (dest === 'home') setPage('home');
      else goCategory(dest);
      return;
    }

    const wishEl = e.target.closest('[data-wish]');
    if (wishEl) {
      e.stopPropagation();
      const id = Number(wishEl.dataset.wish);
      state.wishlist = state.wishlist.includes(id)
        ? state.wishlist.filter(x => x !== id) : [...state.wishlist, id];
      // re-render affected views
      renderGrid('home'); renderGrid('plp');
      if (state.page === 'pdp') {
        const btn = $(`.pdp__wish[data-wish="${id}"]`);
        if (btn) btn.innerHTML = heartSVG(state.wishlist.includes(id));
      }
      return;
    }

    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) {
      const [which, t] = tabEl.dataset.tab.split(':');
      state.tab[which] = t;
      renderTabs(which); renderGrid(which);
      return;
    }

    const sizeEl = e.target.closest('[data-size]');
    if (sizeEl && !sizeEl.disabled) {
      state.selectedSize = sizeEl.dataset.size;
      $$('#pdpSizes .size-btn').forEach(b => b.classList.toggle('is-active', b === sizeEl));
      const add = $('#pdpAdd');
      add.classList.remove('is-disabled');
      add.textContent = '장바구니 담기';
      return;
    }

    if (e.target.closest('#pdpAdd')) {
      const add = $('#pdpAdd');
      if (!state.selectedSize) return;
      state.cart.push(state.product);
      updateCartBadge();
      add.classList.add('is-success');
      add.textContent = '담겼습니다 ✓';
      setTimeout(() => { add.classList.remove('is-success'); add.textContent = '장바구니 담기'; }, 2000);
      return;
    }

    const cardEl = e.target.closest('[data-product]');
    if (cardEl) {
      state.product = PRODUCTS.find(p => p.id === Number(cardEl.dataset.product));
      renderPDP();
      setPage('pdp');
      return;
    }
  });

  $('#searchToggle').addEventListener('click', function () {
    const bar = $('#searchBar');
    bar.hidden = !bar.hidden;
    if (!bar.hidden) $('input', bar).focus();
  });

  // init
  renderNav();
  renderTabs('home');
  renderGrid('home');
  renderFooter();
  updateCartBadge();
})();
