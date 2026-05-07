import { useEffect } from "react";
import type { PropsWithChildren, ReactNode } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onClose: () => void;
}>;

export function Modal({ open, title, subtitle, actions, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Workspace action</p>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="ghost-button modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions ? <div className="modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
