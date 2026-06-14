"use client";

import { ReactNode, useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div
        className={`my-8 w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } rounded-2xl bg-white shadow-xl dark:bg-gray-900`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
