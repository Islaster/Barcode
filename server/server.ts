import { app } from "./app.ts";
import { env } from "./config/env.ts";

console.log("Booting server...");
console.log("PORT =", env.port);

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Server running on port ${env.port}`);
});
