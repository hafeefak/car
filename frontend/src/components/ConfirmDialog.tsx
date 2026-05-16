import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      size="sm"
      onClose={busy ? () => undefined : onCancel}
      closeOnBackdrop={!busy}
      actions={
        <>
          <button className="ghost-button" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className="ghost-button danger" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-copy">{message}</p>
    </Modal>
  );
}
