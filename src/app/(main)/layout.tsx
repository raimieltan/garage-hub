import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
  );
}
