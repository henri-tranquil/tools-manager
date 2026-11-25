/** Entier aléatoire dans [0, maxExclusive). Injectable pour rendre les tests déterministes. */
export type RandomInt = (maxExclusive: number) => number;

/** Tirage cryptographique sans biais de modulo (crypto.getRandomValues). */
export const cryptoRandomInt: RandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x100000000) {
    throw new RangeError(`Borne invalide : ${maxExclusive}`);
  }
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maxExclusive;
};
