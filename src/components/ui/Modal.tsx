import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  widthClass?: string;
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  widthClass = "w-[560px]",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md animate-fade-backdrop"
        />
        <Dialog.Content
          className={[
            "fixed left-1/2 top-1/2 z-50 max-w-[92vw] rounded-lg2",
            "bg-vsc-panel border border-vsc-border shadow-elev-4",
            "animate-scale-in overflow-hidden",
            widthClass,
          ].join(" ")}
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-vsc-borderHair bg-vsc-panelElev">
            <div className="min-w-0">
              <Dialog.Title className="text-vsc-heading font-semibold text-[16px] tracking-[-0.01em]">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-body2 text-vsc-textMuted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors ring-focus"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <div className="p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
