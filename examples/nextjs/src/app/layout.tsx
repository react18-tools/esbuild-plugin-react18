import "./styles.css";
import "react18-loaders/dist/index.css";
import { ThemeSwitcher } from "nextjs-themes";
import { Layout } from "@repo/shared/dist/server";
import { GlobalLoader, Header } from "@repo/shared";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

/** Root layout. */
export default function RootLayout({ children }: { children: React.ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeSwitcher />
        <Layout>
          <Header />
          {children}
        </Layout>
        <GlobalLoader />
      </body>
    </html>
  );
}
