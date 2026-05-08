import React, { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
};

export function Modal({ 
  open, 
  title, 
  description,
  size = "md", 
  actions, 
  children, 
  onClose,
  closeOnBackdrop = true,
  showCloseButton = true
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: "modal-shell-sm",
    md: "modal-shell-md",
    lg: "modal-shell-lg",
    xl: "modal-shell-xl",
    full: "modal-shell-full",
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div 
          className={`modal-shell ${sizeClasses[size]}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-header-content">
              <h3 className="modal-title">{title}</h3>
              {description && <p className="modal-description">{description}</p>}
            </div>
            {showCloseButton && (
              <button 
                className="modal-close-btn" 
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          <div className="modal-body">
            {children}
          </div>
          
          {actions && (
            <div className="modal-actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
}