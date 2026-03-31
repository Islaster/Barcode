import { app } from "./app.ts";
import { env } from "./config/env.ts";

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
