import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCProvider } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Constituent Response",
  description:
    "A comprehensive platform for managing constituent requests and complaints.",
};

// This app requires a database and Redis at runtime (auth, tRPC, queues), so it
// is rendered dynamically rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
