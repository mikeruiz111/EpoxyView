export enum AppState {
  IDLE = 'IDLE',
  CAMERA = 'CAMERA',
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
    cssBackground: 'conic-gradient(from 45deg, #C19A6B, #4E3629, #FFFFFF, #000000, #C19A6B)'
  },
  {
    id: 'denim-mix',
    name: 'Denim Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in royal blue, grey, black, and white',
    cssBackground: 'conic-gradient(from 135deg, #2563EB, #9CA3AF, #FFFFFF, #000000, #2563EB)'
  },
  {
    id: 'graphite-mix',
    name: 'Graphite Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in dark grey, medium grey, and black',
    cssBackground: 'conic-gradient(from 90deg, #374151, #6B7280, #1F2937, #374151)'
  },
  {
    id: 'silver-mix',
    name: 'Silver Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in light grey, white, and black',
    cssBackground: 'conic-gradient(from 180deg, #E5E7EB, #FFFFFF, #000000, #9CA3AF, #E5E7EB)'
  },
  {
    id: 'domino-mix',
    name: 'Domino Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in high-contrast black, white, and grey',
    cssBackground: 'conic-gradient(from 0deg, #000000, #FFFFFF, #4B5563, #000000)'
  },
  {
    id: 'sandstone-mix',
    name: 'Sandstone Mix',
    promptDescription: 'a glossy epoxy garage floor with a dense flake texture in beige, cream, and light tan',
    cssBackground: 'conic-gradient(from 225deg, #D2B48C, #FEF3C7, #F3E5AB, #D2B48C)'
  }
];