import React from "react";

type MessageBoxType = "confirm" | "info" | "success" | "warning" | "error";

type MessageBoxProps = {
  open: boolean;
  type?: MessageBoxType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const typeStyles: Record<
  MessageBoxType,
  { title: string; color: string; border: string; bg: string }
> = {
  confirm: {
    title: "تأیید",
    color: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  info: {
    title: "اطلاع",
    color: "text-blue-700",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  success: {
    title: "موفق",
    color: "text-emerald-700",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  warning: {
    title: "هشدار",
    color: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  error: {
    title: "خطا",
    color: "text-red-700",
    border: "border-red-200",
    bg: "bg-red-50",
  },
};

export default function MessageBox({
  open,
  type = "info",
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: MessageBoxProps) {
  if (!open) return null;
  const style = typeStyles[type];
  const showCancel = type === "confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border bg-white p-5 shadow-lg">
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-sm ${style.border} ${style.bg} ${style.color}`}
        >
          {title ?? style.title}
        </div>
        <div className="text-sm text-gray-700 leading-7">{message}</div>

        <div className="mt-6 flex justify-end gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              {cancelText ?? "انصراف"}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm text-white ${
              type === "error"
                ? "bg-red-600 hover:bg-red-700"
                : type === "warning" || type === "confirm"
                ? "bg-amber-600 hover:bg-amber-700"
                : type === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmText ?? "تأیید"}
          </button>
        </div>
      </div>
    </div>
  );
}
