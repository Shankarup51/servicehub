import { toast } from "sonner"

export interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const showSuccessToast = (
  message: string,
  options?: ToastOptions
) => {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    action: options?.action,
  })
}

export const showErrorToast = (
  message: string,
  options?: ToastOptions
) => {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration ?? 5000,
    action: options?.action,
  })
}

export const showWarningToast = (
  message: string,
  options?: ToastOptions
) => {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    action: options?.action,
  })
}

export const showInfoToast = (
  message: string,
  options?: ToastOptions
) => {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    action: options?.action,
  })
}

export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  }
) => {
  return toast.promise(promise, messages)
}

export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId)
}
