export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type DeviceType = "mobile" | "tablet" | "laptop";

export interface DeviceInfo {
  /** Viewport classification */
  type: DeviceType;
  /** Shorthand: phones / small devices (< 768px) */
  isMobile: boolean;
  /** Mid-size tablets (768-1023px) */
  isTablet: boolean;
  /** Laptops & desktops (>= 1024px) */
  isLaptop: boolean;
  /** Primary input is coarse (finger) - phones, many tablets */
  isTouch: boolean;
  /** Use compact chrome (hamburger nav, stacked actions) */
  useCompactUi: boolean;
  width: number;
}

export function classifyDevice(
  width: number,
  isTouch = false
): Omit<DeviceInfo, "width"> {
  let type: DeviceType;
  if (width < BREAKPOINTS.md) {
    type = "mobile";
  } else if (width < BREAKPOINTS.lg) {
    type = "tablet";
  } else {
    type = "laptop";
  }

  return {
    type,
    isMobile: type === "mobile",
    isTablet: type === "tablet",
    isLaptop: type === "laptop",
    isTouch,
    // Compact UI for phones; tablets/laptops get the fuller chrome
    useCompactUi: type === "mobile",
  };
}

export function readDeviceFromWindow(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      type: "laptop",
      isMobile: false,
      isTablet: false,
      isLaptop: true,
      isTouch: false,
      useCompactUi: false,
      width: BREAKPOINTS.lg,
    };
  }

  const width = window.innerWidth;
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints ?? 0) > 0;

  return {
    ...classifyDevice(width, isTouch),
    width,
  };
}
