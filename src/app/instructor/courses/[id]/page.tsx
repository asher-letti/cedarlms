import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ManageCourseClient from "./ManageCourseClient";

export const dynamic = "force-dynamic";

export default async function ManageCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!course || course.instructor_id !== user.id) notFound();

  const { data: lessons } = await supabase
    .from("lessons").select("*").eq("course_id", id).order("position");

  const { data: assignments } = await supabase
    .from("assignments").select("*").eq("course_id", id).order("created_at");

  return (
    <ManageCourseClient
      course={course}
      initialLessons={lessons ?? []}
      initialAssignments={assignments ?? []}
    />
  );
}
