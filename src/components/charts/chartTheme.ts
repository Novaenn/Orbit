/**
 * Chart colours from the Material palette: 600–700 tones on light surfaces,
 * desaturated 200 tones on dark surfaces.
 */
export interface ChartTheme {
  grid: string
  axis: string
  cursor: string
  volume: string
  volumeCurrent: string
  volumeSelected: string
  average: string
  fitness: string
  fatigue: string
  form: string
  /** Trend charts: individual runs and their rolling average. */
  dot: string
  rolling: string
  vdot: string
  threshold: string
  cadence: string
  /** Heart-rate zones 1–7, cool to warm. */
  hr: string[]
  zones: { transition: string; fresh: string; neutral: string; productive: string; risk: string }
}

export function chartTheme(dark: boolean): ChartTheme {
  return dark
    ? {
        grid: 'rgba(255,255,255,0.12)',
        axis: 'rgba(255,255,255,0.6)',
        cursor: 'rgba(255,255,255,0.08)',
        volume: '#9fa8da', // Indigo 200
        volumeCurrent: 'rgba(159,168,218,0.45)',
        volumeSelected: '#c5cae9', // Indigo 100
        average: 'rgba(255,255,255,0.6)',
        fitness: '#81d4fa', // Light Blue 200
        fatigue: '#f48fb1', // Pink 200
        form: '#ffe082', // Amber 200
        dot: '#9fa8da', // Indigo 200
        rolling: '#ffab91', // Deep Orange 200
        vdot: '#a5d6a7', // Green 200
        threshold: '#ce93d8', // Purple 200
        cadence: '#80deea', // Cyan 200
        hr: ['#4fc3f7', '#4db6ac', '#81c784', '#ffd54f', '#ff8a65', '#e57373', '#ce93d8'],
        zones: {
          transition: 'rgba(129,212,250,0.10)',
          fresh: 'rgba(165,214,167,0.12)',
          neutral: 'rgba(255,255,255,0.05)',
          productive: 'rgba(255,224,130,0.10)',
          risk: 'rgba(239,154,154,0.12)',
        },
      }
    : {
        grid: 'rgba(0,0,0,0.12)',
        axis: 'rgba(0,0,0,0.6)',
        cursor: 'rgba(0,0,0,0.06)',
        volume: '#3f51b5', // Indigo 500
        volumeCurrent: 'rgba(63,81,181,0.4)',
        volumeSelected: '#283593', // Indigo 800
        average: 'rgba(0,0,0,0.6)',
        fitness: '#0288d1', // Light Blue 700
        fatigue: '#d81b60', // Pink 600
        form: '#ff8f00', // Amber 800
        dot: '#3f51b5', // Indigo 500
        rolling: '#f4511e', // Deep Orange 600
        vdot: '#2e7d32', // Green 800
        threshold: '#6a1b9a', // Purple 800
        cadence: '#00838f', // Cyan 800
        hr: ['#29b6f6', '#26a69a', '#66bb6a', '#ffca28', '#ff7043', '#e53935', '#8e24aa'],
        zones: {
          transition: 'rgba(2,136,209,0.08)',
          fresh: 'rgba(56,142,60,0.10)',
          neutral: 'rgba(0,0,0,0.04)',
          productive: 'rgba(255,143,0,0.10)',
          risk: 'rgba(211,47,47,0.10)',
        },
      }
}
