(() => {
  "use strict";

  // ---------- Scroll-reveal (shared across non-app pages) ----------
  const revealEls = document.querySelectorAll(".reveal");
  const revealAll = () => revealEls.forEach((el) => el.classList.add("is-visible"));

  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // Safety net: content must never stay invisible if the observer never
    // fires (e.g. full-page screenshot/print tools that render without a
    // real scroll). Force it in after a short delay regardless.
    window.addEventListener("load", () => setTimeout(revealAll, 2000));
    window.addEventListener("beforeprint", revealAll);
  } else {
    revealAll();
  }

  // ---------- Hero signature: animated wavy line ----------
  const wave = document.querySelector(".assoc-hero__wave");
  if (wave && "IntersectionObserver" in window) {
    const waveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            wave.classList.add("is-visible");
            waveObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    waveObserver.observe(wave);
  } else if (wave) {
    wave.classList.add("is-visible");
  }

  // ---------- PWA: service worker ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a nice-to-have, not critical */
      });
    });
  }
})();
