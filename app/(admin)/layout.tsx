import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The layout itself reads no request data, so the frame prerenders into the
  // static shell. The session is read inside the Suspense boundary below.
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <AdminSidebar />
      </Suspense>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">Admin panel</span>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function AdminSidebar() {
  const user = await requireUser();
  return <AppSidebar username={user.username} role={user.role} />;
}

function SidebarSkeleton() {
  return (
    <div className="hidden w-64 shrink-0 flex-col gap-3 border-r p-3 md:flex">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
