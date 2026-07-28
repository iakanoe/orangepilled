import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

// Authenticated shell. Middleware already gates access; this is a second
// guard + provides the app chrome (bottom nav, max-width container).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
