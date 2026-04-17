export const TOKEN_KEYS = {
  ACCESS: "accessToken",
  REFRESH: "refreshToken",
} as const;

export const NOTIFICATION_POLL_INTERVAL_MS = 15_000;

export const GRADE_OPTIONS = ["A", "B", "C", "D", "F"] as const;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;
