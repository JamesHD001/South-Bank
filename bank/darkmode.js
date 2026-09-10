// darkmode.js

document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.getElementById("themeSwitch");

  // Apply saved preference
  const isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDark);

  if (themeSwitch) {
    themeSwitch.checked = isDark;

    themeSwitch.addEventListener("change", () => {
      document.body.classList.toggle("dark", themeSwitch.checked);
      localStorage.setItem("darkMode", themeSwitch.checked);
    });
  }

  initializeTransactionLock();
});

/* =========================
   FRONTEND TRANSACTION LOCK
========================= */

function initializeTransactionLock() {
  // The lock applies to financial/action controls on the dashboard.
  // It intentionally does not block Settings, Logout, or normal navigation.
  const actionLinks = document.querySelectorAll(".action-buttons a");
  const serviceCards = document.querySelectorAll(".service-card");

  if (!actionLinks.length && !serviceCards.length) return;

  createTransactionLockModal();

  actionLinks.forEach((link) => {
    link.addEventListener("click", handleLockedActionClick);
  });

  serviceCards.forEach((card) => {
    card.addEventListener("click", handleLockedActionClick);
  });
}

function handleLockedActionClick(event) {
  event.preventDefault();
  event.stopPropagation();
  showTransactionLockModal();
}

function createTransactionLockModal() {
  if (document.getElementById("transactionLockModal")) return;

  const modal = document.createElement("div");
  modal.id = "transactionLockModal";
  modal.className = "transaction-lock-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "transactionLockTitle");

  modal.innerHTML = `
    <div class="transaction-lock-modal">
      <button
        type="button"
        class="transaction-lock-close"
        id="transactionLockClose"
        aria-label="Close notification"
      >&times;</button>

      <div class="transaction-lock-icon" aria-hidden="true">🔒</div>

      <h2 id="transactionLockTitle">Transactions Locked</h2>

      <p class="transaction-lock-message">
        Withdrawals and other account transactions are currently locked
        for your account.
      </p>

      <p class="transaction-lock-instruction">
        Kindly visit the bank with your credentials and valid identification
        documents to complete verification and unfreeze your account.
      </p>

      <div class="transaction-lock-actions">
        <button type="button" class="transaction-lock-secondary" id="transactionLockCancel">
          Cancel
        </button>
        <button type="button" class="transaction-lock-primary" id="transactionLockVerify">
          View Verification Details
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("transactionLockClose").addEventListener("click", hideTransactionLockModal);
  document.getElementById("transactionLockCancel").addEventListener("click", hideTransactionLockModal);
  document.getElementById("transactionLockVerify").addEventListener("click", () => {
    window.location.href = "verification.html";
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideTransactionLockModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTransactionLockModal();
    }
  });
}

function showTransactionLockModal() {
  const modal = document.getElementById("transactionLockModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.classList.add("modal-open");

  const closeButton = document.getElementById("transactionLockClose");
  if (closeButton) closeButton.focus();
}

function hideTransactionLockModal() {
  const modal = document.getElementById("transactionLockModal");
  if (!modal) return;

  modal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

/* =========================
   TRANSACTION LOCK STYLES
========================= */

const transactionLockStyles = document.createElement("style");
transactionLockStyles.textContent = `
  body.modal-open {
    overflow: hidden;
  }

  .transaction-lock-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(10, 20, 15, 0.62);
    backdrop-filter: blur(5px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  }

  .transaction-lock-overlay.active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .transaction-lock-modal {
    position: relative;
    width: min(100%, 500px);
    padding: 36px 32px 30px;
    border-radius: 20px;
    background: #ffffff;
    color: #1a1a1a;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    transform: translateY(15px) scale(0.98);
    transition: transform 0.25s ease;
  }

  .transaction-lock-overlay.active .transaction-lock-modal {
    transform: translateY(0) scale(1);
  }

  .transaction-lock-close {
    position: absolute;
    top: 12px;
    right: 14px;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 50%;
    background: #f1f5f3;
    color: #555;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
  }

  .transaction-lock-close:hover {
    background: #e3ebe7;
  }

  .transaction-lock-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 68px;
    margin: 0 auto 18px;
    border-radius: 50%;
    background: #e9f6f0;
    font-size: 30px;
  }

  .transaction-lock-modal h2 {
    margin: 0 0 12px;
    color: #1e4d3a;
    font-size: 1.45rem;
  }

  .transaction-lock-message,
  .transaction-lock-instruction {
    margin: 0 auto;
    max-width: 420px;
    line-height: 1.6;
    color: #555;
  }

  .transaction-lock-instruction {
    margin-top: 12px;
    font-size: 0.92rem;
    color: #6b7280;
  }

  .transaction-lock-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 25px;
  }

  .transaction-lock-actions button {
    border: 0;
    border-radius: 10px;
    padding: 11px 16px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .transaction-lock-actions button:hover {
    transform: translateY(-1px);
  }

  .transaction-lock-secondary {
    background: #eef2f0;
    color: #374151;
  }

  .transaction-lock-secondary:hover {
    background: #e1e8e4;
  }

  .transaction-lock-primary {
    background: #2fa37b;
    color: #ffffff;
  }

  .transaction-lock-primary:hover {
    background: #1e4d3a;
  }

  body.dark .transaction-lock-modal {
    background: #1e1e1e;
    color: #e0e0e0;
    border: 1px solid #444;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
  }

  body.dark .transaction-lock-close {
    background: #2a2a2a;
    color: #d1d5db;
  }

  body.dark .transaction-lock-close:hover {
    background: #333;
  }

  body.dark .transaction-lock-icon {
    background: #183629;
  }

  body.dark .transaction-lock-modal h2 {
    color: #4cd9a0;
  }

  body.dark .transaction-lock-message,
  body.dark .transaction-lock-instruction {
    color: #c7c7c7;
  }

  body.dark .transaction-lock-secondary {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  body.dark .transaction-lock-secondary:hover {
    background: #333;
  }

  @media (max-width: 600px) {
    .transaction-lock-modal {
      padding: 32px 20px 24px;
      border-radius: 18px;
    }

    .transaction-lock-actions {
      flex-direction: column-reverse;
    }

    .transaction-lock-actions button {
      width: 100%;
    }
  }
`;

document.head.appendChild(transactionLockStyles);
