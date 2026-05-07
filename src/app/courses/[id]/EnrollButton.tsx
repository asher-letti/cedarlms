"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import EnrollKeyModal from "./EnrollKeyModal";
import { track } from "@/lib/analytics";

type Props = {
  courseId: string;
  courseTitle: string;
  enrolled: boolean;
  requiresKey: boolean;
};

export default function EnrollButton({ courseId, courseTitle, enrolled, requiresKey }: Props) {
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [pending, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const router = useRouter();

  const directEnroll = () => start(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ course_id: courseId, user_id: user.id });
    if (!error) track("course_enrolled", { course_id: courseId, course_title: courseTitle });
    setIsEnrolled(true);
    router.refresh();
  });

  const submitKey = async (key: string) => {
    setKeyBusy(true);
    setKeyError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("enroll_with_key", {
      p_course_id: courseId,
      p_key: key,
    });
    setKeyBusy(false);
    if (error) {
      // Postgres P0001 raised by us = invalid key
      if (/invalid enrollment key/i.test(error.message)) {
        setKeyError("Incorrect enrollment key. Ask your instructor.");
      } else {
        setKeyError(error.message);
      }
      return;
    }
    setModalOpen(false);
    setIsEnrolled(true);
    track("course_enrolled", { course_id: courseId, course_title: courseTitle });
    router.refresh();
  };

  const unenroll = () => start(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("enrollments").delete()
      .eq("course_id", courseId).eq("user_id", user.id);
    setIsEnrolled(false);
    router.refresh();
  });

  const onClick = () => {
    if (isEnrolled) return unenroll();
    if (requiresKey) {
      setKeyError(null);
      setModalOpen(true);
      return;
    }
    directEnroll();
  };

  return (
    <>
      <button
        onClick={onClick}
        disabled={pending}
        className={`${isEnrolled ? "btn-secondary" : "btn-primary"} w-full`}
      >
        {pending ? "Working…" : isEnrolled ? "Unenroll" : requiresKey ? "Enroll with key" : "Enroll for free"}
      </button>

      <EnrollKeyModal
        open={modalOpen}
        busy={keyBusy}
        error={keyError}
        onClose={() => setModalOpen(false)}
        onSubmit={submitKey}
      />
    </>
  );
}
