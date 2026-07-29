(() => {
  const bookingUrl = 'https://link.sellflows.com/widget/booking/PBpJVegRgUST8xPAbuOj';
  const bookingLinks = document.querySelectorAll(`a[href="${bookingUrl}"]`);
  if (!bookingLinks.length) return;

  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="booking-modal__backdrop" data-booking-close></div>
    <div class="booking-modal__dialog" role="dialog" aria-modal="true" aria-label="Book a call with PrivacyAI">
      <button class="booking-modal__close" type="button" aria-label="Close booking calendar" data-booking-close>&times;</button>
      <iframe class="booking-modal__frame" title="PrivacyAI booking calendar" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>`;
  document.body.appendChild(modal);

  const frame = modal.querySelector('.booking-modal__frame');
  const closeButton = modal.querySelector('.booking-modal__close');
  let returnFocus = null;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('booking-modal-open');
    if (returnFocus) returnFocus.focus();
  };

  bookingLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    returnFocus = link;
    if (!frame.src) frame.src = bookingUrl;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('booking-modal-open');
    window.setTimeout(() => closeButton.focus(), 220);
  }));

  modal.querySelectorAll('[data-booking-close]').forEach((control) => control.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
