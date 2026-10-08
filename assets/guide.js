// Section search, complete-workflow chapters, and the remembered language choice.
(function () {
  const guide = window.GUIDE;
  const store = {
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };

  // Remember an explicit language choice (the English page follows the browser until there is one).
  document.querySelectorAll('.languages a').forEach((link) => {
    link.addEventListener('click', () => store.set('annotate-docs-lang', link.dataset.lang));
  });

  // Search: filter the navigation by label, summary and keywords (including the English keywords).
  const input = document.getElementById('guide-search');
  const nav = document.querySelector('.nav');
  const count = nav.querySelector('.nav-count');
  const details = document.querySelector('.nav-details');
  const links = [...nav.querySelectorAll('a[data-search]')];
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    nav.classList.toggle('searching', !!query);
    let shown = 0;
    links.forEach((link) => {
      const match = !query || link.dataset.search.includes(query);
      link.hidden = !match;
      if (match) shown += 1;
    });
    nav.querySelectorAll('.nav-group').forEach((group) => { group.hidden = !!query && !group.querySelector('a:not([hidden])'); });
    count.hidden = !query;
    count.textContent = shown ? guide.counts[Math.min(shown, guide.counts.length - 1)] : guide.noResults;
    if (query) details.open = true;
  });
  // On narrow screens the section list starts collapsed and closes after a choice.
  const narrow = window.matchMedia('(max-width: 1000px)');
  if (narrow.matches) details.open = false;
  links.forEach((link) => link.addEventListener('click', () => { if (narrow.matches) details.open = false; }));

  // Chapters of the complete-workflow video.
  const video = document.getElementById('workflow-video');
  const buttons = [...document.querySelectorAll('.chapters button')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    video.currentTime = Number(button.dataset.t);
    video.play().catch(() => {});
  }));
  video.addEventListener('timeupdate', () => {
    let current = null;
    buttons.forEach((button) => { if (video.currentTime + 0.25 >= Number(button.dataset.t)) current = button; });
    buttons.forEach((button) => { if (button === current) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
  });

  // Only one video plays at a time.
  document.addEventListener('play', (event) => {
    document.querySelectorAll('video').forEach((other) => { if (other !== event.target) other.pause(); });
  }, true);
})();
