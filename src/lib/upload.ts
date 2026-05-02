export const MAX_COVER_BYTES = 5 * 1024 * 1024;        // 5 MB
export const MAX_LESSON_BYTES = 100 * 1024 * 1024;     // 100 MB
export const MAX_SUBMISSION_BYTES = 25 * 1024 * 1024;  // 25 MB

export function fmtMb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function checkSize(file: File, max: number): string | null {
  if (file.size > max) {
    return `File is ${fmtMb(file.size)}. Maximum allowed is ${fmtMb(max)}.`;
  }
  return null;
}
