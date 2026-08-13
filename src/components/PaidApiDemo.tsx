"use client";

import { useState } from "react";
import { clientConfig } from "@/lib/config";
import { shortRequestId, workshopLog } from "@/lib/workshop-logger";

type State = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export function PaidApiDemo() {
  const [{ apiUrl, network }] = useState(() => clientConfig());
  const [address, setAddress] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function connect() {
    const requestId = shortRequestId();
    void workshopLog(requestId, "1 · WALLET CONNECTION REQUESTED", { network });
    setState({ kind: "loading", message: "Conectando Freighter…" });
    try {
      const freighter = await import("@stellar/freighter-api");
      const connected = await freighter.isConnected();
      if (!connected.isConnected) throw new Error("Instala la extensión Freighter para continuar.");
      const access = await freighter.requestAccess();
      if (access.error || !access.address) throw new Error(access.error || "Conexión rechazada.");
      setAddress(access.address);
      void workshopLog(requestId, "2 · WALLET CONNECTED", {
        wallet: `${access.address.slice(0, 6)}…${access.address.slice(-4)}`,
        network,
      });
      setState({ kind: "idle" });
    } catch (error) {
      void workshopLog(requestId, "CLIENT FLOW ERROR", { status: "wallet connection failed" });
      setState({ kind: "error", message: error instanceof Error ? error.message : "No se pudo conectar." });
    }
  }

  async function inspectPaywall() {
    const requestId = shortRequestId();
    void workshopLog(requestId, "1 · UNPAID API REQUEST SENT", { api: apiUrl });
    setState({ kind: "loading", message: "Solicitando sin pago…" });
    try {
      const response = await fetch(`${apiUrl}/api/premium-insight`);
      const required = response.headers.get("PAYMENT-REQUIRED");
      if (response.status === 402 && required) {
        void workshopLog(requestId, "2 · HTTP 402 · PAYMENT REQUIRED RECEIVED", {
          status: response.status,
          price: "$0.001 USDC",
        });
      }
      setState({
        kind: response.status === 402 && required ? "success" : "error",
        message: response.status === 402 && required
          ? `402 recibido. PAYMENT-REQUIRED contiene ${required.length} caracteres.`
          : `Respuesta inesperada: ${response.status}`,
      });
    } catch (error) {
      void workshopLog(requestId, "CLIENT FLOW ERROR", { status: "unpaid request failed" });
      setState({ kind: "error", message: error instanceof Error ? error.message : "Falló la petición." });
    }
  }

  async function pay() {
    if (!address) return setState({ kind: "error", message: "Conecta Freighter primero." });
    const requestId = shortRequestId();
    void workshopLog(requestId, "1 · X402 PAYMENT FLOW STARTED", {
      price: "$0.001 USDC",
      network,
    });
    setState({ kind: "loading", message: "Autorizando el pago en USDC…" });
    try {
      const freighter = await import("@stellar/freighter-api");
      const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
      const { ExactStellarScheme } = await import("@x402/stellar/exact/client");
      const signer = {
        address,
        signAuthEntry: async (entry: string, options?: { networkPassphrase?: string; address?: string }) => {
          void workshopLog(requestId, "2 · WALLET AUTHORIZATION REQUESTED", {
            wallet: `${address.slice(0, 6)}…${address.slice(-4)}`,
          });
          const signed = await freighter.signAuthEntry(entry, options);
          if (signed.error || !signed.signedAuthEntry) throw new Error(signed.error || "Firma rechazada.");
          void workshopLog(requestId, "3 · WALLET AUTHORIZATION APPROVED", {
            wallet: `${address.slice(0, 6)}…${address.slice(-4)}`,
          });
          return { signedAuthEntry: signed.signedAuthEntry, signerAddress: signed.signerAddress };
        },
      };
      const client = new x402Client().register(network, new ExactStellarScheme(signer));
      const response = await wrapFetchWithPayment(fetch, client)(`${apiUrl}/api/premium-insight`);
      const body = await response.json();
      if (!response.ok) throw new Error(`La API respondió ${response.status}: ${JSON.stringify(body)}`);
      const settlement = response.headers.get("PAYMENT-RESPONSE");
      void workshopLog(requestId, "4 · PAYMENT RESPONSE RECEIVED", {
        status: response.status,
        facilitator: "OpenZeppelin",
      });
      setState({ kind: "success", message: `${JSON.stringify(body, null, 2)}\n\nPAYMENT-RESPONSE: ${settlement ? "recibido" : "no visible"}` });
    } catch (error) {
      void workshopLog(requestId, "CLIENT FLOW ERROR", { status: "payment failed" });
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
