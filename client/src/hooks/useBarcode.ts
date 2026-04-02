import { fields } from "../constants/nutritionData";
import { debug } from "../utils/debug";

export async function fetchProductByBarcode(barcode: string): Promise<any> {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
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
      throw new Error(`Failed to fetch product: ${res.status} — ${errorBody}`);
    }

    const data = await res.json();
    debug.log("fetch", "Parsed response data:", data);

    // Validate expected structure
    if (!data?.data) {
      debug.error("fetch", "Response missing 'data' property", data);
    } else if (!data.data.food) {
      debug.error("fetch", "Response missing 'data.food' property", data.data);
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
