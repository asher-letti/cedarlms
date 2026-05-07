"use client";
import { useMaterialSession } from "@/lib/useMaterialSession";

type Props = {
  lessonId?: string;
  assignmentId?: string;
  userId: string | null;
  enabled?: boolean;
};

/**
 * Render-less wrapper that activates the material-session tracker
 * only while it is actually mounted. Mount when content is open, unmount
 * to flush + close the session.
 */
export default function MaterialSessionTracker({
  lessonId, assignmentId, userId, enabled = true,
}: Props) {
  useMaterialSession({
    lessonId,
    assignmentId,
    enabled: enabled && !!userId,
  });
  return null;
}
