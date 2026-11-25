const PREFIX = 'etabli:';

/**
 * Stockage local des réglages d'un outil. Rien ne quitte l'appareil.
 * Renvoie `fallback` si le stockage est indisponible (navigation privée, quota…).
 */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage indisponible : la valeur reste en mémoire pour la session.
  }
}
