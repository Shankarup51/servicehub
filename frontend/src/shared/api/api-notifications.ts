
import { toast } from "sonner";

type ApiMessage = string | string[] | undefined;

export function showApiSuccess(message: ApiMessage) {
  if (!message) return;

  const text = Array.isArray(message)
    ? message.join(", ")
    : message;

  toast.success(text);
}

export function showApiError(message: ApiMessage) {
  if (!message) {
    toast.error("Something went wrong. Please try again.");
    return;
  }

  const text = Array.isArray(message)
    ? message.join(", ")
    : message;

  toast.error(text);
}
