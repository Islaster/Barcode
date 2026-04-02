export async function fetchProductBySearch(name: string): Promise<any> {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const trimmed = name.trim();
  try {
    const url = `${serverUrl}/api/food/search?name=${encodeURIComponent(
      trimmed
    )}`;
    console.log(`[FOOD SEARCH UI] Fetching: ${url}`);
    return await fetch(url);
  } catch (err) {
    console.error("[FOOD SEARCH UI] ❌ Network error:", err);
    return err;
  }
}
