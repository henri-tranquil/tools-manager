/** Bips courts générés localement (aucun fichier son à charger). Sans effet si l'audio est indisponible. */
export function ring(times = 3, frequency = 880): void {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < times; i += 1) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.35;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    }
    setTimeout(() => void ctx.close(), times * 350 + 800);
  } catch {
    // Pas d'audio disponible : l'affichage suffit.
  }
}
