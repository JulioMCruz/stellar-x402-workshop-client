import { copyFileSync, existsSync } from "node:fs";

const target = ".env.local";

if (existsSync(target)) {
  console.log(`[setup] ${target} already exists; nothing was overwritten.`);
} else {
  copyFileSync(".env.example", target);
  console.log(`[setup] Created ${target} from .env.example.`);
  console.log("[setup] Browser testing is ready; add STELLAR_PRIVATE_KEY only for the agent flow.");
}
