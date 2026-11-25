export interface TimerPreset {
  readonly id: string;
  readonly label: string;
  readonly seconds: number;
}

export const COOKING_PRESETS: readonly TimerPreset[] = [
  { id: 'coque', label: 'Œuf à la coque', seconds: 3 * 60 },
  { id: 'mollet', label: 'Œuf mollet', seconds: 6 * 60 },
  { id: 'dur', label: 'Œuf dur', seconds: 9 * 60 },
  { id: 'pates', label: 'Pâtes', seconds: 10 * 60 },
  { id: 'riz', label: 'Riz', seconds: 12 * 60 },
  { id: 'the', label: 'Thé noir', seconds: 4 * 60 },
];

export const DEFAULT_PRESET_ID = 'mollet';
