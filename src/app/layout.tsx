import "./globals.css";

export const metadata = { title: "Stellar x402 Workshop Client" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
