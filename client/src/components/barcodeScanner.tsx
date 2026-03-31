import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from "html5-qrcode";
import { useNutritionContext } from "../contexts/NutrititonContext";
import { fields } from "../constants/nutritionData";
import { debug } from "../utils/debug";

export default function BarcodeScanner() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
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
    debug.log("scanner", "Component mounted");
    debug.log("scanner", `VITE_SERVER_URL: ${serverUrl}`);

    if (!serverUrl) {
      debug.error(
        "scanner",
        "VITE_SERVER_URL is undefined! API calls will fail."
      );
    } else if (!serverUrl.startsWith("http")) {
      debug.error(
        "scanner",
        `VITE_SERVER_URL missing protocol: "${serverUrl}"`
      );
    }

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

  async function fetchProductByBarcode(barcode: string): Promise<any> {
    const url = `${serverUrl}/api/barcodes/${barcode}`;
    debug.log("fetch", `Fetching: ${url}`);
    debug.log("fetch", `Fields: ${fields.join(",")}`);

    try {
      const res = await fetch(url);

      debug.log("fetch", `Response status: ${res.status} ${res.statusText}`);
      debug.log("fetch", `Response headers:`, {
        contentType: res.headers.get("content-type"),
        cors: res.headers.get("access-control-allow-origin"),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        debug.error("fetch", `Server responded with ${res.status}`, errorBody);
        throw new Error(
          `Failed to fetch product: ${res.status} — ${errorBody}`
        );
      }

      const data = await res.json();
      debug.log("fetch", "Parsed response data:", data);

      // Validate expected structure
      if (!data?.data) {
        debug.error("fetch", "Response missing 'data' property", data);
      } else if (!data.data.food) {
        debug.error(
          "fetch",
          "Response missing 'data.food' property",
          data.data
        );
      } else if (!data.data.food.servings?.serving?.[0]) {
        debug.error("fetch", "Response missing serving data", data.data.food);
      } else {
        debug.log("fetch", "Response structure validated ✅", {
          name: data.data.food.food_name,
          protein: data.data.food.servings.serving[0].protein,
          calories: data.data.food.servings.serving[0].calories,
        });
      }

      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        debug.error(
          "fetch",
          "Network error — server may be down or CORS blocked",
          {
            url,
            serverUrl,
            hint: "Check if Railway server is running and CORS is configured",
          }
        );
      } else {
        debug.error("fetch", "Fetch failed", err);
      }
      throw err;
    }
  }

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
