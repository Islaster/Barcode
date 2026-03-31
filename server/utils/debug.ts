const DEBUG =
  process.env.NODE_ENV !== "production" || process.env.DEBUG === "true";

const labels: Record<string, string> = {
  server: "🖥️  SERVER",
  api: "📡 API",
  fatsecret: "🔑 FATSECRET",
  error: "❌ ERROR",
};

export const debug = {
  log(module: string, message: string, data?: unknown) {
    if (!DEBUG) return;
    const label = labels[module] || module.toUpperCase();
    console.log(`[${label}] ${message}`);
    if (data !== undefined) console.log(JSON.stringify(data, null, 2));
  },

  error(module: string, message: string, err?: unknown) {
    // Always log errors, even in production
    const label = labels[module] || module.toUpperCase();
    console.error(`[${label} ERROR] ${message}`);
    if (err instanceof Error) {
      console.error(`  Message: ${err.message}`);
      console.error(`  Stack: ${err.stack}`);
    } else if (err !== undefined) {
      console.error(JSON.stringify(err, null, 2));
    }
  },

  request(req: { method: string; url: string; headers: Record<string, any> }) {
    if (!DEBUG) return;
    console.log(`[📡 API] ${req.method} ${req.url}`);
    console.log(`  Origin: ${req.headers.origin || "none"}`);
    console.log(`  User-Agent: ${req.headers["user-agent"]?.substring(0, 50)}`);
  },
};
