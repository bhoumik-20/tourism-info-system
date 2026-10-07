import { useState } from "react";
import { Modal, ErrorMessage } from "./UI";
export default function DeleteDialog({ title, text, onClose, onDelete }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function remove() {
    setPending(true);
    setError("");
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title={title} onClose={() => !pending && onClose()}>
      <p className="muted">{text}</p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="modal-actions">
        <button
          className="button secondary"
          disabled={pending}
          onClick={onClose}
        >
          Keep it
        </button>
        <button className="button danger" disabled={pending} onClick={remove}>
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
