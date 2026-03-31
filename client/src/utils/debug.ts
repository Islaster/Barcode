const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";

const colors = {
  scanner: "color: #22c55e; font-weight: bold;",
  context: "color: #3b82f6; font-weight: bold;",
  fetch: "color: #f59e0b; font-weight: bold;",
  storage: "color: #a855f7; font-weight: bold;",
  error: "color: #ef4444; font-weight: bold;",
  table: "color: #06b6d4; font-weight: bold;",
};

type Module = keyof typeof colors;

export const debug = {
  log(module: Module, message: string, data?: unknown) {
    if (!DEBUG) return;
    console.log(`%c[${module.toUpperCase()}] ${message}`, colors[module]);
    if (data !== undefined) console.log(data);
  },

  error(module: Module, message: string, err?: unknown) {
    if (!DEBUG) return;
    console.log(`%c[${module.toUpperCase()} ERROR] ${message}`, colors.error);
    if (err instanceof Error) {
      console.error(`  Message: ${err.message}`);
      console.error(`  Stack: ${err.stack}`);
    } else if (err !== undefined) {
      console.error(err);
    }
  },

  warn(module: Module, message: string, data?: unknown) {
    if (!DEBUG) return;
    console.warn(`[${module.toUpperCase()} WARN] ${message}`);
    if (data !== undefined) console.warn(data);
  },

  table(module: Module, message: string, data: unknown[]) {
    if (!DEBUG) return;
    console.log(`%c[${module.toUpperCase()}] ${message}`, colors[module]);
    console.table(data);
  },
};
