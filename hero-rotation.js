(() => {
  const word = document.querySelector('[data-rotating-niche]');
  if (!word || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const phrases = ['law firm', 'tax practice', 'accounting firm', 'healthcare practice'];
  let index = 0;

  window.setInterval(() => {
    word.classList.add('is-changing');
    window.setTimeout(() => {
      index = (index + 1) % phrases.length;
      word.textContent = phrases[index];
      word.classList.remove('is-changing');
    }, 180);
  }, 2600);
})();
