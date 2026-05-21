export const tokens = {
  colors: {
    primary: "#00C8FF",
    secondary: "#8B5CF6",
    background: "#08090C",
    surface: "#0D1017",
    success: "#22C55E",
    danger: "#EF4444",
    textPrimary: "#E8EDF5",
    textSecondary: "#4B5563",

    // Chart-specific cyan gradient shades (heatmap)
    heatLow: "#006090",
    heatMid: "#0088C0",
    heatHigh: "#00A8E0",
  },
} as const

export type TokenColor = keyof typeof tokens.colors
