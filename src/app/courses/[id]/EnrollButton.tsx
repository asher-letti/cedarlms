"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [pending, start] = useTransition();
  const router = useRouter();

  const toggle = () => start(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (isEnrolled) {
      await supabase.from("enrollments").delete().eq("course_id", courseId).eq("user_id", user.id);
      setIsEnrolled(false);
    } else {
      await supabase.from("enrollments").insert({ course_id: courseId, user_id: user.id });
      setIsEnrolled(true);
    }
    router.refresh();
  });

  return (
    <button onClick={toggle} disabled={pending}
      className={`${isEnrolled ? "btn-secondary" : "btn-primary"} w-full`}>
      {pending ? "Working…" : isEnrolled ? "Unenroll" : "Enroll for free"}
    </button>
  );
}
