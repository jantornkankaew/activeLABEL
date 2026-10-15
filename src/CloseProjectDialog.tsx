import {useEffect, useRef} from 'react';
import {XCircle} from 'lucide-react';
import type {LabelDocument} from './core';
import './close-project.css';

export function CloseProjectDialog({
  doc,
  isOnlyDocument,
  onCancel,
  onConfirm,
}: {
  doc: LabelDocument;
  isOnlyDocument?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) {
      node.showModal();
      cancel.current?.focus();
    }
    return () => {
      if (node?.open) node.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="close-project-dialog"
      aria-labelledby="close-project-title"
      aria-describedby="close-project-description"
      onCancel={e => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="close-project-icon">
        <XCircle size={26} />
      </div>
      <h2 id="close-project-title">ปิดโปรเจคนี้?</h2>
      <p id="close-project-description">
        คุณต้องการปิด <strong>"{doc.title || 'Untitled label'}"</strong> หรือไม่?
        <br />
        <span>
          {isOnlyDocument
            ? 'ระบบจะสร้างโปรเจคว่างใหม่ขึ้นมาแทน'
            : 'สามารถเปิดกลับมาได้หากมีไฟล์ JSON สำรองไว้'}
        </span>
      </p>
      <div className="close-project-actions">
        <button ref={cancel} type="button" onClick={onCancel}>
          ยกเลิก
        </button>
        <button
          type="button"
          className="close-project-confirm"
          onClick={onConfirm}
        >
          ปิดโปรเจค
        </button>
      </div>
    </dialog>
  );
}
