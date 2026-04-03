import { useEffect, useMemo, useRef, useState } from "react";
import { useZxing } from "react-zxing";
import { BarcodeFormat, DecodeHintType, type Result } from "@zxing/library";
import { useNutritionContext } from "../../contexts/NutrititonContext";
import { fetchProductByBarcode } from "../../hooks/useBarcode";
import { debug } from "../../utils/debug";

export default function BarcodeScanner() {
  const isHandlingRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const { setBarcode, setLoading, setProductData, setScannerOn, setTableOn } =
    useNutritionContext();

  const allowedFormats = useMemo(
    () =>
      new Set<BarcodeFormat>([
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.EAN_8,
        BarcodeFormat.EAN_13,
      ]),
    []
  );

  const hints = useMemo(
    () =>
      new Map([
        [
          DecodeHintType.POSSIBLE_FORMATS,
          [
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.EAN_8,
            BarcodeFormat.EAN_13,
          ],
        ],
      ]),
    []
  );

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
      isHandlingRef.current = false;
    }
  };

  const { ref } = useZxing({
    paused: !isRunning,
    hints,
    timeBetweenDecodingAttempts: 100,
    constraints: {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    },
    onDecodeResult(result: Result) {
      if (isHandlingRef.current) return;

      const format = result.getBarcodeFormat();
      const decodedText = result.getText();

      debug.log(
        "scanner",
        `Scan result — format: ${String(format)}, text: ${decodedText}`
      );

      if (format === undefined) {
        debug.warn("scanner", "No barcode format found in result");
        return;
      }

      if (!allowedFormats.has(format)) {
        debug.warn("scanner", `Unsupported format: ${String(format)}`);
        return;
      }

      isHandlingRef.current = true;
      setIsRunning(false);
      debug.log("scanner", "Scanner stopped after successful scan");

      void handleDetected(decodedText);
    },
    onDecodeError() {},
    onError(error) {
      debug.error("scanner", "Failed to start scanner", error);

      if (error instanceof Error && error.message.includes("Permission")) {
        debug.error(
          "scanner",
          "Camera permission denied — user must allow camera access"
        );
      }
    },
  });

  useEffect(() => {
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

    debug.log("scanner", "Starting scanner...");
    setIsRunning(true);
    debug.log("scanner", "Scanner started successfully ✅");

    return () => {
      debug.log("scanner", "Component unmounting — stopping scanner");
      setIsRunning(false);
    };
  }, []);

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
          height: 320,
          border: "1px solid #ccc",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <video
          ref={ref}
          style={{
            width: "100%",
            height: "320px",
            objectFit: "cover",
            display: "block",
          }}
          muted
          playsInline
        />
      </div>
    </div>
  );
}
