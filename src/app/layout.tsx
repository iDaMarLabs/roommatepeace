import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roommate Peace — Stop arguing about chores and bills",
  description: "Shared home accountability without the awkwardness.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
