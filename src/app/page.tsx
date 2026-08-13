import { PaidApiDemo } from "@/components/PaidApiDemo";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">STELLAR · OPENZEPPELIN · X402 V2</p>
      <h1>Un agente compra una respuesta de API.</h1>
      <p className="lead">Sin cuenta, suscripción ni checkout: la petición HTTP lleva la negociación del pago.</p>
      <PaidApiDemo />
      <ol>
        <li>La API responde <strong>402 Payment Required</strong>.</li>
        <li>Freighter firma una autorización limitada de USDC.</li>
        <li>OpenZeppelin verifica y liquida el pago en Stellar.</li>
        <li>La API entrega el recurso solicitado.</li>
      </ol>
    </main>
  );
}
