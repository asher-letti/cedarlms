import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/auth";
import InstructorSidebar, { InstructorMobileNav } from "@/components/InstructorSidebar";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");
  if (profile?.role !== "instructor" && profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="-mx-6 -my-12 lg:flex min-h-[calc(100vh-128px)]">
      <InstructorSidebar instructorName={profile?.full_name} />
      <div className="flex-1 min-w-0">
        <InstructorMobileNav />
        <div className="px-6 py-10 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
