export enum AppState {
  IDLE = 'IDLE',
  CROP = 'CROP',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface EpoxyStyle {
  id: string;
  name: string;
  promptDescription: string;
  cssBackground: string;
}

export const EPOXY_STYLES: EpoxyStyle[] = [
  {
    id: 'desert-mix',
    name: 'Desert Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in tan, brown, black, and white',
    cssBackground: 'conic-gradient(from 30deg, #d2b48c 0deg 70deg, #5c4033 70deg 140deg, #ffffff 140deg 200deg, #000000 200deg 250deg, #d2b48c 250deg 360deg)'
  },
  {
    id: 'denim-mix',
    name: 'Denim Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in royal blue, grey, black, and white',
    cssBackground: 'conic-gradient(from 120deg, #1e3a8a 0deg 90deg, #9ca3af 90deg 180deg, #ffffff 180deg 240deg, #000000 240deg 360deg)'
  },
  {
    id: 'graphite-mix',
    name: 'Graphite Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in dark grey, medium grey, and black',
    cssBackground: 'conic-gradient(from 90deg, #374151 0deg 120deg, #6b7280 120deg 240deg, #111827 240deg 360deg)'
  },
  {
    id: 'silver-mix',
    name: 'Silver Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in light grey, white, and black',
    cssBackground: 'conic-gradient(from 180deg, #e5e7eb 0deg 150deg, #ffffff 150deg 280deg, #000000 280deg 360deg)'
  },
  {
    id: 'domino-mix',
    name: 'Domino Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in high-contrast black, white, and grey',
    cssBackground: 'conic-gradient(from 45deg, #000000 0deg 120deg, #ffffff 120deg 240deg, #4b5563 240deg 360deg)'
  },
  {
    id: 'sandstone-mix',
    name: 'Sandstone Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in beige, cream, and light tan',
    cssBackground: 'conic-gradient(from 200deg, #e3d0b9 0deg 100deg, #fef3c7 100deg 230deg, #d6c0a0 230deg 360deg)'
  },
  {
    id: 'midnight-mix',
    name: 'Midnight',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in deep navy, black, and slate blue',
    cssBackground: 'conic-gradient(from 15deg, #0f172a 0deg 130deg, #1e293b 130deg 260deg, #334155 260deg 360deg)'
  },
  {
    id: 'sedona-mix',
    name: 'Sedona',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in terracotta red, rust, grey, and tan',
    cssBackground: 'conic-gradient(from 160deg, #9a3412 0deg 90deg, #ea580c 90deg 160deg, #9ca3af 160deg 260deg, #d6c0a0 260deg 360deg)'
  }
];