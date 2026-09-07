"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BREAKPOINTS,
  classifyDevice,
  readDeviceFromWindow,
  type DeviceInfo,
} from "@/lib/device";

const DeviceContext = createContext<DeviceInfo | null>(null);

/** Mobile-first default avoids laptop chrome flashing on phones before JS runs */
const SSR_DEFAULT: DeviceInfo = {
  ...classifyDevice(390, true),
  width: 390,
};

function applyDeviceAttributes(device: DeviceInfo) {
  const root = document.documentElement;
  root.dataset.device = device.type;
  root.dataset.compactUi = device.useCompactUi ? "true" : "false";
  root.dataset.touch = device.isTouch ? "true" : "false";
  root.style.setProperty("--device-width", `${device.width}px`);
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceInfo>(SSR_DEFAULT);

  const refresh = useCallback(() => {
    const next = readDeviceFromWindow();
    setDevice(next);
    applyDeviceAttributes(next);
  }, []);

  useEffect(() => {
    refresh();

    const mqMobile = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`);
    const mqTablet = window.matchMedia(
      `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
    );
    const mqTouch = window.matchMedia("(pointer: coarse)");

    const onChange = () => refresh();

    mqMobile.addEventListener("change", onChange);
    mqTablet.addEventListener("change", onChange);
    mqTouch.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      mqMobile.removeEventListener("change", onChange);
      mqTablet.removeEventListener("change", onChange);
      mqTouch.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, [refresh]);

  const value = useMemo(() => device, [device]);

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceInfo {
  const ctx = useContext(DeviceContext);
  if (!ctx) return SSR_DEFAULT;
  return ctx;
}
