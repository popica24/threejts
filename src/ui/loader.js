// Full-screen loader: "Ridicăm panourile… NN%", then fades out.

export function createLoader(el) {
  const label = el.querySelector('.loader__label') ?? el;
  let shown = 0;

  return {
    setProgress(v) {
      shown = Math.max(shown, Math.round(Math.min(Math.max(v, 0), 1) * 100));
      label.textContent = `Ridicăm panourile… ${shown}%`;
      el.style.setProperty('--p', `${shown}%`);
    },
    done() {
      this.setProgress(1);
      el.classList.add('is-done');
      return new Promise((resolve) => setTimeout(() => { el.remove(); resolve(); }, 900));
    },
  };
}
