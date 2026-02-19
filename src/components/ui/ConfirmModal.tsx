"use client";

import { AlertTriangle, Trash2, CheckCircle, Info, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: Props) {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: <Trash2 className="w-6 h-6" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: <Info className="w-6 h-6" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
      icon: <CheckCircle className="w-6 h-6" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      buttonBg: "bg-green-600 hover:bg-green-700",
    },
  }[variant];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full ${variantConfig.iconBg} flex items-center justify-center ${variantConfig.iconColor} mx-auto mb-4`}
          >
            {variantConfig.icon}
          </div>

          {/* Content */}
          <h2 className="text-xl font-display font-bold text-neutral-900 text-center mb-2">
            {title}
          </h2>
          <p className="text-neutral-600 text-center mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg ${variantConfig.buttonBg} text-white font-semibold transition-colors disabled:opacity-50`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
