// This script runs before React hydration to prevent theme flash
(function () {
  const getTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  };

  const theme = getTheme();
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Save to localStorage if not already saved
  if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", theme);
  }
})();
