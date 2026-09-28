import { useCallback, useEffect, useRef, useState } from "react";

/** Coordinates captured from the device's Geolocation API. */
export interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GpsStatus = "idle" | "capturing" | "granted" | "denied" | "unavailable" | "error";

export interface GeolocationState {
  status: GpsStatus;
  coords: GpsCoords | null;
  /** Human-readable message describing the current status/error. */
  message: string;
  /** True while a capture is in flight. */
  isCapturing: boolean;
  /** Trigger a (re)capture. Returns the coords on success, or null on failure. */
  capture: () => Promise<GpsCoords | null>;
}

/**
 * Capture the device's GPS position via the browser Geolocation API.
 *
 * GPS is compulsory for a Field Visit, so this hook surfaces clear, actionable
 * status: `denied` when the user blocks the permission, `unavailable` when the
 * browser has no geolocation support, and `error`/`granted` otherwise. The
 * caller can gate submission on `status === "granted" && coords !== null`.
 *
 * `autoCapture` requests the location once on mount so the engineer usually
 * sees coordinates without an extra tap, while still allowing a manual retry.
 */
export function useGeolocation(options?: { autoCapture?: boolean }): GeolocationState {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [coords, setCoords] = useState<GpsCoords | null>(null);
  const [message, setMessage] = useState("");
  const requestedRef = useRef(false);

  const capture = useCallback(async (): Promise<GpsCoords | null> => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      setMessage("This device or browser does not support GPS location.");
      return null;
    }

    setStatus("capturing");
    setMessage("Capturing your GPS location...");

    return new Promise<GpsCoords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: GpsCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(next);
          setStatus("granted");
          setMessage("GPS location captured.");
          resolve(next);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setMessage(
              "Location permission was denied. Enable location access for this site and try again — GPS is required to submit.",
            );
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setStatus("error");
            setMessage("Your location could not be determined. Move to an open area and retry.");
          } else if (err.code === err.TIMEOUT) {
            setStatus("error");
            setMessage("Timed out while capturing GPS. Please retry.");
          } else {
            setStatus("error");
            setMessage("Failed to capture GPS location. Please retry.");
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, []);

  useEffect(() => {
    if (options?.autoCapture && !requestedRef.current) {
      requestedRef.current = true;
      void capture();
    }
  }, [options?.autoCapture, capture]);

  return { status, coords, message, isCapturing: status === "capturing", capture };
}
