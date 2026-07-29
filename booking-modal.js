(() => {
  const bookingUrl = 'https://link.sellflows.com/widget/booking/PBpJVegRgUST8xPAbuOj';
  const formUrl = 'https://link.sellflows.com/widget/form/1FQfrmu2PW0arcnSk0aJ';
  const experiences = {
    [bookingUrl]: {
      dialogLabel: 'Book a call with PrivacyAI',
      frameTitle: 'PrivacyAI booking calendar',
      closeLabel: 'Close booking calendar',
      form: false
    },
    [formUrl]: {
      dialogLabel: 'Get started with PrivacyAI',
      frameTitle: 'PrivacyAI early access form',
      closeLabel: 'Close early access form',
      form: true
    }
  };
  const modalLinks = [...document.querySelectorAll('a')].filter((link) => experiences[link.href]);
  if (!modalLinks.length) return;

  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="booking-modal__backdrop" data-modal-close></div>
    <div class="booking-modal__dialog" role="dialog" aria-modal="true" aria-label="Book a call with PrivacyAI">
      <button class="booking-modal__close" type="button" aria-label="Close booking calendar" data-modal-close>&times;</button>
      <iframe class="booking-modal__frame" title="PrivacyAI booking calendar" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>`;
  document.body.appendChild(modal);

  const dialog = modal.querySelector('.booking-modal__dialog');
  const frame = modal.querySelector('.booking-modal__frame');
  const closeButton = modal.querySelector('.booking-modal__close');
  let returnFocus = null;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('booking-modal-open');
    if (returnFocus) returnFocus.focus();
  };

  modalLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    const experience = experiences[link.href];
    returnFocus = link;
    if (frame.src !== link.href) frame.src = link.href;
    dialog.setAttribute('aria-label', experience.dialogLabel);
    dialog.classList.toggle('booking-modal__dialog--form', experience.form);
    frame.title = experience.frameTitle;
    closeButton.setAttribute('aria-label', experience.closeLabel);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('booking-modal-open');
    window.setTimeout(() => closeButton.focus(), 220);
  }));

  modal.querySelectorAll('[data-modal-close]').forEach((control) => control.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
