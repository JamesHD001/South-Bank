// dark-mode.js
document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.getElementById('themeSwitch');

  // Apply saved preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    if (themeSwitch) themeSwitch.checked = true;
  }

  // Toggle dark mode
  if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('darkMode', themeSwitch.checked);
    });
  }
});
