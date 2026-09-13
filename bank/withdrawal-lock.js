(() => {
  const LOCK_MESSAGE = 'Withdrawals are locked for your account. Kindly visit the bank with your credentials to unfreeze your account!';

  const isLocked = () => sessionStorage.getItem('withdrawalLocked') === 'true';

  const isRestrictedAction = (element) => {
    if (!element) return false;

    if (element.closest('.service-card')) return true;

    const actionLink = element.closest('.action-buttons a');
    if (!actionLink) return false;

    const href = actionLink.getAttribute('href') || '';
    return !['receive-form.html', 'deposit-form.html'].includes(href);
  };

  const createLockModal = () => {
    if (document.getElementById('withdrawalLockModal')) return;

    const modal = document.createElement('div');
    modal.id = 'withdrawalLockModal';
    modal.innerHTML = `
      <div class="withdrawal-lock-backdrop" role="presentation">
        <div class="withdrawal-lock-dialog" role="alertdialog" aria-modal="true" aria-labelledby="withdrawalLockTitle">
          <div class="withdrawal-lock-icon" aria-hidden="true">!</div>
          <h2 id="withdrawalLockTitle">Account Restricted</h2>
          <p>${LOCK_MESSAGE}</p>
          <button type="button" data-close-withdrawal-lock>Close</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .withdrawal-lock-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(8, 20, 14, 0.68);
        backdrop-filter: blur(3px);
      }

      .withdrawal-lock-dialog {
        width: min(460px, 100%);
        padding: 30px;
        border-radius: 20px;
        background: #fff;
        color: #1a1a1a;
        text-align: center;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
      }

      .withdrawal-lock-icon {
        width: 52px;
        height: 52px;
        margin: 0 auto 16px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #fee2e2;
        color: #b91c1c;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .withdrawal-lock-dialog h2 {
        margin: 0 0 10px;
        color: #1e4d3a;
      }

      .withdrawal-lock-dialog p {
        margin: 0;
        color: #5b6470;
        line-height: 1.6;
      }

      .withdrawal-lock-dialog button {
        margin-top: 24px;
        border: 0;
        border-radius: 10px;
        padding: 11px 22px;
        background: #2fa37b;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }

      .withdrawal-lock-dialog button:hover {
        background: #1e4d3a;
      }

      body.dark .withdrawal-lock-dialog {
        background: #1e1e1e;
        color: #f5f5f5;
      }

      body.dark .withdrawal-lock-dialog p {
        color: #c7c7c7;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('[data-close-withdrawal-lock]').addEventListener('click', closeModal);
    modal.querySelector('.withdrawal-lock-backdrop').addEventListener('click', (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
  };

  const showLockMessage = () => {
    createLockModal();
  };

  document.addEventListener('click', (event) => {
    if (!isLocked() || !isRestrictedAction(event.target)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showLockMessage();
  }, true);
})();
