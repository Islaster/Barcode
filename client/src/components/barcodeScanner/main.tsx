import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from "html5-qrcode";
import { useNutritionContext } from "../../contexts/NutrititonContext";
import { fetchProductByBarcode } from "../../hooks/useBarcode";
import { debug } from "../../utils/debug";

type ExtendedMediaTrackConstraintSet = MediaTrackConstraintSet & {
  focusMode?: ConstrainDOMString;
  focusDistance?: ConstrainDouble;
  zoom?: ConstrainDouble;
  torch?: ConstrainBoolean;
};

type ExtendedMediaTrackConstraints = MediaTrackConstraints & {
  advanced?: ExtendedMediaTrackConstraintSet[];
};

type ExtendedMediaTrackCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  focusDistance?: { min: number; max: number; step?: number };
  torch?: boolean;
  zoom?: { min: number; max: number; step?: number };
};

type ExtendedMediaTrackSettings = MediaTrackSettings & {
  focusMode?: string;
  focusDistance?: number;
  torch?: boolean;
  zoom?: number;
};

export default function BarcodeScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { setBarcode, setLoading, setProductData, setScannerOn, setTableOn } =
    useNutritionContext();
  const allowedFormats = new Set([
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.EAN_13,
  ]);

  // Validate environment on mount
  useEffect(() => {
    // Guard against double mount from React Strict Mode
    if (scannerRef.current) {
      debug.warn(
        "scanner",
        "Scanner already initialized — skipping duplicate mount"
      );
      return;
    }
    debug.log("scanner", "Component mounted");

    const readerEl = document.getElementById("reader");
    if (!readerEl) {
      debug.error("scanner", "DOM element #reader not found on mount");
    } else {
      debug.log("scanner", "#reader element found", {
        width: readerEl.offsetWidth,
        height: readerEl.offsetHeight,
      });
    }
    (async () => {
      if (isRunning) {
        debug.warn("scanner", "startScanner called but already running");
        return;
      }

      debug.log("scanner", "Starting scanner...");

      try {
        const scanner = new Html5Qrcode("reader", {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 140 } },

          async (decodedText, decodedResult: Html5QrcodeResult) => {
            const format = decodedResult.result.format?.format;
            debug.log(
              "scanner",
              `Scan result — format: ${format}, text: ${decodedText}`
            );

            if (format === undefined) {
              debug.warn("scanner", "No barcode format found in result");
              return;
            }
            if (!allowedFormats.has(format)) {
              debug.warn("scanner", `Unsupported format: ${format}`);
              return;
            }

            if (scannerRef.current?.isScanning) {
              await scannerRef.current.stop();
              debug.log("scanner", "Scanner stopped after successful scan");
            }

            setIsRunning(false);
            handleDetected(decodedText);
          },
          () => {}
        );

        const settings =
          scanner.getRunningTrackSettings() as ExtendedMediaTrackSettings;
        const caps =
          scanner.getRunningTrackCapabilities() as ExtendedMediaTrackCapabilities;
        console.log("settings: ", settings);
        console.log("caps: ", caps);

        if (caps.zoom) {
          await scanner.applyVideoConstraints({
            advanced: [
              {
                zoom: Math.min(2, caps.zoom.max),
              } as ExtendedMediaTrackConstraintSet,
            ],
          } as ExtendedMediaTrackConstraints);
        }
        console.log("settings after focus change: ", settings);
        setIsRunning(true);
        debug.log("scanner", "Scanner started successfully ✅");
      } catch (err) {
        debug.error("scanner", "Failed to start scanner", err);
        if (err instanceof Error && err.message.includes("Permission")) {
          debug.error(
            "scanner",
            "Camera permission denied — user must allow camera access"
          );
        }
      }
    })();

    return () => {
      debug.log("scanner", "Component unmounting — stopping scanner");
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch((err) => {
          debug.error("scanner", "Failed to stop scanner on unmount", err);
        });
      }
    };
  }, []);

  const handleDetected = async (detectedBarcode: string) => {
    debug.log("scanner", `Barcode detected: ${detectedBarcode}`);
    setBarcode(detectedBarcode);
    setLoading(true);

    try {
      const data = await fetchProductByBarcode(detectedBarcode);
      debug.log("scanner", "Setting productData and switching to table view");
      setProductData(data);
      setScannerOn(false);
      setTableOn(true);
    } catch (err) {
      debug.error("scanner", "handleDetected failed", err);
      setProductData(undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        id="reader"
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: 320,
          border: "1px solid #ccc",
          borderRadius: 12,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
