"use client";

import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null,
  );

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = async () => {
    setLoading(true);
    resolver?.(true);
    setLoading(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setIsOpen(false);
  };

  const ConfirmDialog = () => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={options?.title || ""}
      message={options?.message || ""}
      confirmText={options?.confirmText}
      cancelText={options?.cancelText}
      variant={options?.variant}
      loading={loading}
    />
  );

  return { confirm, ConfirmDialog };
}
