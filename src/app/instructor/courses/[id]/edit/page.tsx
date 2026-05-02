import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditCourseClient from "./EditCourseClient";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!course || course.instructor_id !== user.id) notFound();

  return <EditCourseClient course={course} />;
}
