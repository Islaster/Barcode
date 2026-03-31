import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from "html5-qrcode";
import { useNutritionContext } from "../contexts/NutrititonContext";
import { fields } from "../constants/nutritionData";

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

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }

      (async () => {
        if (isRunning) return;

        try {
          const scanner = new Html5Qrcode("reader", {
            verbose: true,
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
            {
              fps: 10,
              qrbox: { width: 280, height: 140 },
            },
            async (decodedText, decodedResult: Html5QrcodeResult) => {
              const format = decodedResult.result.format?.format;
              if (format === undefined) {
                console.log("No barcode format found in result");
                return;
              }

              if (!allowedFormats.has(format)) {
                console.log("Unsupported barcode format");
                return;
              }
              // stop after first successful scan
              if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
              }

              setIsRunning(false);
              handleDetected(decodedText);
            },
            () => {
              // ignore scan misses
            }
          );

          setIsRunning(true);
        } catch (err) {
          console.error(
            err instanceof Error ? err.message : "Failed to start scanner"
          );
        }
      })();
    };
  }, []);

  async function fetchProductByBarcode(barcode: string): Promise<any> {
    fields.join(",");

    const res = await fetch(`http://localhost:3001/api/barcodes/${barcode}`);

    if (!res.ok) {
      throw new Error("Failed to fetch product");
    }

    return res.json();
  }

  const handleDetected = async (detectedBarcode: string) => {
    setBarcode(detectedBarcode);
    setLoading(true);
    try {
      const data = await fetchProductByBarcode(detectedBarcode);
      console.log(data.data.food.servings.serving[0].protein);
      setProductData(data);
      setScannerOn(false);
      setTableOn(true);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Unknown error");
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
