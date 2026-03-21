export const Colors = {
  // Primary - Orange
  orange: "#E77603",
  orangeLight: "#FF9500",
  orangeSoft: "#FFF8F0",
  orangeDark: "#C96300",

  // Secondary - Teal
  teal: "#3E9C99",
  tealLight: "#4DB6B3",
  tealSoft: "#F0FAFA",
  tealDark: "#2D7A77",

  // Backgrounds
  white: "#FFFFFF",
  background: "#FAFBFC",
  backgroundWarm: "#FFFCF9",
  surface: "#FFFFFF",

  // Text - Softer blacks
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  textMuted: "#D1D5DB",

  // Grays
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",

  // Status
  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  error: "#EF4444",
  errorSoft: "#FEF2F2",
  info: "#3B82F6",
  infoSoft: "#EFF6FF",

  // Gradients
  gradientOrange: ["#FF9500", "#E77603"],
  gradientOrangeLight: ["#FFB347", "#FF9500"],
  gradientTeal: ["#4DB6B3", "#3E9C99"],
  gradientTealLight: ["#5CC9C6", "#4DB6B3"],
  gradientBackground: ["#FFFFFF", "#FAFBFC"],
  gradientWarm: ["#FFFFFF", "#FFFCF9"],
};

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  orange: {
    shadowColor: "#E77603",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  teal: {
    shadowColor: "#3E9C99",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
};

// Typography scale
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
};
