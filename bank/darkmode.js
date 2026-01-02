// dark-mode.js
  document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.getElementById("themeSwitch");

  // Apply saved preference
  const isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDark);

  if (!themeSwitch) return;

  themeSwitch.checked = isDark;

  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("darkMode", themeSwitch.checked);
  });
});
