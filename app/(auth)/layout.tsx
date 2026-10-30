import { LandmarkIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Same gradient as the "Village Banking" hero on the LTS Ventures site.
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-[linear-gradient(135deg,var(--gradient-top),var(--gradient-bottom))] p-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
      </div>
      <div className="flex items-center gap-2 text-2xl font-bold text-white">
        <LandmarkIcon className="size-6" aria-hidden />
        Village Bank
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
