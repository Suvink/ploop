// Light/dark toggle. Starts from the visitor's system setting; a click picks a theme and
// remembers it. Loaded in <head> so a saved theme applies before the page paints.
(function () {
  var KEY = 'ploop-theme';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try {
      var t = localStorage.getItem(KEY);
      return t === 'light' || t === 'dark' ? t : null;
    } catch (e) {
      return null;
    }
  }

  function current() {
    return saved() || (media.matches ? 'dark' : 'light');
  }

  function label(button) {
    var next = current() === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    button.setAttribute('title', 'Switch to ' + next + ' theme');
  }

  var t = saved();
  if (t) root.setAttribute('data-theme', t);

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    label(button);
    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {
        // private mode: the choice lasts until the page is closed
      }
      label(button);
    });
    media.addEventListener('change', function () {
      label(button);
    });
  });
})();
