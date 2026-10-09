export const colors = {
  primary: "#D9480F",
  primarySoft: "#FDEBDD",
  accent: "#F59E0B",
  accentSoft: "#FFF3D6",
  success: "#15803D",
  successSoft: "#E3F6EA",
  warning: "#9A5B00",
  warningSoft: "#FFF1CC",
  danger: "#C62828",
  dangerSoft: "#FDE8E8",
  info: "#1565C0",
  infoSoft: "#E3F0FC",
  background: "#FBF7F2",
  surface: "#FFFFFF",
  text: "#16110E",
  textMuted: "#6B5B50",
  border: "#EADFD3",
  white: "#FFFFFF",
} as const;

export const gradients = {
  header: ["#E0520C", "#A8380A", "#1C130E"],
  hero: ["#16110E", "#5C230A", "#C2410C"],
  primary: ["#E8590C", "#BF3D08"],
  accent: ["#E8590C", "#B8360A"],
  success: ["#2E9E5B", "#15803D"],
  danger: ["#E0384B", "#B3182B"],
  info: ["#2A93E8", "#1565C0"],
  muted: ["#8F837B", "#5F554E"],
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 28, pill: 999 } as const;

export const font = { sm: 13, md: 15, lg: 17, xl: 22, xxl: 30 } as const;

export const shadows = {
  card: { boxShadow: "0 4px 18px rgba(60, 30, 10, 0.10)" },
  button: { boxShadow: "0 6px 16px rgba(217, 72, 15, 0.35)" },
  tabBar: { boxShadow: "0 -4px 18px rgba(60, 30, 10, 0.12)" },
} as const;