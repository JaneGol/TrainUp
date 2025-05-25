import { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur p-4 md:p-6 shadow">
      {children}
    </div>
  );
}