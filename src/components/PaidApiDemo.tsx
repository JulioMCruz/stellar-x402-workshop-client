"use client";

import { useState } from "react";
import { clientConfig } from "@/lib/config";

type State = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export function PaidApiDemo() {
  const [{ apiUrl, network }] = useState(() => clientConfig());
  const [address, setAddress] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function connect() {
    setState({ kind: "loading", message: "Conectando Freighter…" });
    try {
      const freighter = await import("@stellar/freighter-api");
      const connected = await freighter.isConnected();
      if (!connected.isConnected) throw new Error("Instala la extensión Freighter para continuar.");
      const access = await freighter.requestAccess();
      if (access.error || !access.address) throw new Error(access.error || "Conexión rechazada.");
      setAddress(access.address);
      setState({ kind: "idle" });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "No se pudo conectar." });
    }
  }

  async function inspectPaywall() {
    setState({ kind: "loading", message: "Solicitando sin pago…" });
    try {
      const response = await fetch(`${apiUrl}/api/premium-insight`);
      const required = response.headers.get("PAYMENT-REQUIRED");
      setState({
        kind: response.status === 402 && required ? "success" : "error",
        message: response.status === 402 && required
          ? `402 recibido. PAYMENT-REQUIRED contiene ${required.length} caracteres.`
          : `Respuesta inesperada: ${response.status}`,
      });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Falló la petición." });
    }
  }

  async function pay() {
    if (!address) return setState({ kind: "error", message: "Conecta Freighter primero." });
    setState({ kind: "loading", message: "Autorizando el pago en USDC…" });
    try {
      const freighter = await import("@stellar/freighter-api");
      const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
      const { ExactStellarScheme } = await import("@x402/stellar/exact/client");
      const signer = {
        address,
        signAuthEntry: async (entry: string, options?: { networkPassphrase?: string; address?: string }) => {
          const signed = await freighter.signAuthEntry(entry, options);
          if (signed.error || !signed.signedAuthEntry) throw new Error(signed.error || "Firma rechazada.");
          return { signedAuthEntry: signed.signedAuthEntry, signerAddress: signed.signerAddress };
        },
      };
      const client = new x402Client().register(network, new ExactStellarScheme(signer));
      const response = await wrapFetchWithPayment(fetch, client)(`${apiUrl}/api/premium-insight`);
      const body = await response.json();
      if (!response.ok) throw new Error(`La API respondió ${response.status}: ${JSON.stringify(body)}`);
      const settlement = response.headers.get("PAYMENT-RESPONSE");
      setState({ kind: "success", message: `${JSON.stringify(body, null, 2)}\n\nPAYMENT-RESPONSE: ${settlement ? "recibido" : "no visible"}` });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Falló el pago." });
    }
  }

  return (
    <section className="demo">
      <div className="status"><span>Red</span><strong>{network}</strong></div>
      <div className="status"><span>API</span><strong>{apiUrl}</strong></div>
      <div className="actions">
        <button onClick={connect}>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "1. Conectar Freighter"}</button>
        <button onClick={inspectPaywall}>2. Ver respuesta 402</button>
        <button className="primary" onClick={pay}>3. Pagar $0.001 USDC</button>
      </div>
      <pre className={state.kind}>{state.message || "Listo para comenzar."}</pre>
    </section>
  );
}
