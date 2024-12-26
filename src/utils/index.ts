export const DEFAULT_CHART_DATA = {
  A: 0,
  B: 0,
  C: 0,
  D: 0,
} as const;

export const DEFAULT_FIRST_RESPONDERS = {
  A: [] as string[],
  B: [] as string[],
  C: [] as string[],
  D: [] as string[],
};

export const VALID_OPTIONS = ["A", "B", "C", "D"] as const;

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

export const formatError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (isErrorWithMessage(error)) return error.message;
  return "An unknown error occurred";
};
