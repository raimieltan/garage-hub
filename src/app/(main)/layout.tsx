import type { ReactNode } from "react";
import { LeftRail } from "@/components/nav/left-rail";
import { RightRail } from "@/components/nav/right-rail";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-3 py-6 sm:px-5 xl:px-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[248px_minmax(0,1fr)_320px] xl:gap-8">
        {/* Left rail — pit lane */}
        <aside className="hidden lg:block">
          <div className="sticky top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar pr-1">
            <LeftRail />
          </div>
        </aside>

        {/* Center feed column */}
        <div className="min-w-0">{children}</div>

        {/* Right rail — paddock telemetry */}
        <aside className="hidden md:block">
          <div className="sticky top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar pl-1">
            <RightRail />
          </div>
        </aside>
      </div>
    </div>
  );
}
