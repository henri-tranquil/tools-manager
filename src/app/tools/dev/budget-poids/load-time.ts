export interface NetworkProfile {
  readonly id: string;
  readonly label: string;
  /** Débit descendant, en kilobits par seconde. */
  readonly downKbps: number;
  /** Aller-retour réseau, en millisecondes. */
  readonly rttMs: number;
}

/** Profils réseau indicatifs (proches des préréglages de throttling des navigateurs). */
export const NETWORKS: readonly NetworkProfile[] = [
  { id: '3g-lente', label: '3G lente', downKbps: 400, rttMs: 400 },
  { id: '3g', label: '3G', downKbps: 1600, rttMs: 300 },
  { id: '4g', label: '4G', downKbps: 9000, rttMs: 170 },
  { id: 'adsl', label: 'ADSL', downKbps: 8000, rttMs: 40 },
  { id: 'fibre', label: 'Fibre', downKbps: 100_000, rttMs: 10 },
];

/** Requêtes téléchargées en parallèle par connexion HTTP/1.1 (et ordre de grandeur pour HTTP/2). */
const PARALLEL_REQUESTS = 6;
/** DNS + TCP + TLS avant le premier octet : environ trois allers-retours. */
const SETUP_ROUND_TRIPS = 3;

/** Temps de chargement estimé, en secondes : connexion + allers-retours des requêtes + transfert. */
export function estimateLoadSeconds(
  sizeKb: number,
  requests: number,
  network: NetworkProfile,
): number {
  const roundTrips = SETUP_ROUND_TRIPS + Math.ceil(Math.max(1, requests) / PARALLEL_REQUESTS);
  const latency = (roundTrips * network.rttMs) / 1000;
  const transfer = (sizeKb * 8) / network.downKbps;
  return latency + transfer;
}

/** Poids maximal (Ko) pour tenir un temps cible sur un réseau donné. 0 si la latence seule le dépasse. */
export function maxWeightKb(
  targetSeconds: number,
  requests: number,
  network: NetworkProfile,
): number {
  const latency = estimateLoadSeconds(0, requests, network);
  return Math.max(0, ((targetSeconds - latency) * network.downKbps) / 8);
}
