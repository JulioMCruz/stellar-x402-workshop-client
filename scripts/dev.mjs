import { spawn } from "node:child_process";
import path from "node:path";

const green = process.env.NO_COLOR ? "" : "\u001b[38;5;154m";
const cyan = process.env.NO_COLOR ? "" : "\u001b[36m";
const dim = process.env.NO_COLOR ? "" : "\u001b[2m";
const reset = process.env.NO_COLOR ? "" : "\u001b[0m";

console.log(`${green}
╔══════════════════════════════════════════════════════════════╗
║             STELLAR x402 WORKSHOP · CLIENT                  ║
╚══════════════════════════════════════════════════════════════╝${reset}
${cyan}Role${reset}        Browser client and Freighter payment signer
${cyan}URL${reset}         http://localhost:3001
${cyan}API${reset}         http://localhost:3000
${cyan}Network${reset}     Stellar Testnet
${cyan}Payment${reset}     $0.001 USDC per protected request

${dim}Connect wallet → inspect HTTP 402 → authorize payment → receive resource${reset}
${dim}Sensitive keys, signatures and encoded payment headers are never logged.${reset}
`);

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", "3001", ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
