(() => {
  const navWrap = document.querySelector('nav .wrap');
  const desktopLinks = navWrap?.querySelector('.navlinks');
  const desktopCta = navWrap?.querySelector('.nav-cta');

  if (navWrap && desktopLinks) {
    const mobileNavId = 'privacyai-mobile-nav';
    const mobileToggle = document.createElement('button');
    const mobilePanel = document.createElement('div');
    const mobileStyle = document.createElement('style');

    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.type = 'button';
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-controls', mobileNavId);
    mobileToggle.setAttribute('aria-label', 'Open navigation menu');
    mobileToggle.innerHTML = '<span></span><span></span><span></span>';

    mobilePanel.className = 'mobile-nav-panel';
    mobilePanel.id = mobileNavId;
    mobilePanel.setAttribute('aria-hidden', 'true');
    desktopLinks.querySelectorAll('a').forEach((link) => {
      mobilePanel.appendChild(link.cloneNode(true));
    });
    if (desktopCta) {
      const mobileCta = desktopCta.cloneNode(true);
      mobileCta.classList.add('mobile-nav-panel__cta');
      mobilePanel.appendChild(mobileCta);
    }

    mobileStyle.textContent = `
      .mobile-nav-toggle,.mobile-nav-panel{display:none}
      @media(max-width:640px){
        nav .wrap{position:relative;align-items:center!important}
        .mobile-nav-toggle{
          display:inline-flex;margin-left:auto;width:44px;height:44px;padding:10px;
          border:1px solid var(--rule,#d8d4c8);border-radius:4px;background:#fff;
          align-items:center;justify-content:center;flex-direction:column;gap:5px;
          color:var(--ink,#1c1b18);cursor:pointer;flex:0 0 auto
        }
        .mobile-nav-toggle span{
          display:block;width:20px;height:2px;background:currentColor;border-radius:2px;
          transition:transform .18s ease,opacity .18s ease
        }
        .mobile-nav-toggle[aria-expanded="true"] span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .mobile-nav-toggle[aria-expanded="true"] span:nth-child(2){opacity:0}
        .mobile-nav-toggle[aria-expanded="true"] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .mobile-nav-panel{
          position:absolute;z-index:50;top:calc(100% + 10px);left:0;right:0;
          padding:10px;background:#fff;border:1px solid var(--rule,#d8d4c8);border-radius:8px;
          box-shadow:0 18px 40px rgba(28,27,24,.16);flex-direction:column;gap:2px
        }
        .mobile-nav-panel.is-open{display:flex}
        .mobile-nav-panel a{
          display:block;padding:11px 12px;border-radius:5px;font-size:15px;font-weight:600;
          color:var(--ink,#1c1b18)
        }
        .mobile-nav-panel a:hover,.mobile-nav-panel a:focus-visible{background:var(--paper,#f6f4ef)}
        .mobile-nav-panel .mobile-nav-panel__cta{
          margin-top:6px;background:var(--redact,#141414);color:var(--paper,#f6f4ef);
          text-align:center
        }
      }`;

    document.head.appendChild(mobileStyle);
    navWrap.appendChild(mobileToggle);
    navWrap.appendChild(mobilePanel);

    const closeMobileNav = () => {
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Open navigation menu');
      mobilePanel.classList.remove('is-open');
      mobilePanel.setAttribute('aria-hidden', 'true');
    };

    mobileToggle.addEventListener('click', () => {
      const willOpen = mobileToggle.getAttribute('aria-expanded') !== 'true';
      mobileToggle.setAttribute('aria-expanded', String(willOpen));
      mobileToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
      mobilePanel.classList.toggle('is-open', willOpen);
      mobilePanel.setAttribute('aria-hidden', String(!willOpen));
    });
    mobilePanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMobileNav();
    });
    document.addEventListener('click', (event) => {
      if (!navWrap.contains(event.target)) closeMobileNav();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileNav();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 640) closeMobileNav();
    });
  }
})();
