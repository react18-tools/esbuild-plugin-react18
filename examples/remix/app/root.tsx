import type { MetaFunction, LinksFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import styles from "./styles.css";
import { Layout } from "@repo/shared/dist/server";
import { ReactNode } from "react";

/** Page metadata */
export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "Blog | Kitchen Sink",
    viewport: "width=device-width,initial-scale=1",
  },
];

/** Add links to head */
export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

/** Remix app root */
export default function App(): ReactNode {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Analytics />
      </body>
    </html>
  );
}
