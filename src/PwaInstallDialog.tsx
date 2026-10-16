import {Laptop, X, Download} from 'lucide-react';

export function PwaInstallDialog({
  hasPrompt,
  onInstall,
  onClose,
}: {
  hasPrompt: boolean;
  onInstall: () => Promise<boolean>;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal pwa-install-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <div className="pwa-install-header">
          <div className="pwa-install-brand">
            <div className="pwa-install-icon">
              <Laptop size={22} />
            </div>
            <div>
              <h3 id="pwa-install-title">ติดตั้ง LabelCraft ลงบนคอมพิวเตอร์</h3>
              <p>ใช้งานเหมือนแอป Desktop ทำงานรวดเร็วและออฟไลน์ 100%</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pwa-install-body">
          <div className="pwa-benefits-grid">
            <div className="pwa-benefit-item">
              <span className="pwa-benefit-check">✓</span>
              <span>เปิดใช้งานได้จากหน้า Desktop หรือ Applications</span>
            </div>
            <div className="pwa-benefit-item">
              <span className="pwa-benefit-check">✓</span>
              <span>ทำงานในหน้าต่างแยกอิสระ ไม่มีแท็บเบราว์เซอร์กวนใจ</span>
            </div>
            <div className="pwa-benefit-item">
              <span className="pwa-benefit-check">✓</span>
              <span>ใช้งานแบบออฟไลน์ได้เต็มประสิทธิภาพแม้ไม่มีอินเทอร์เน็ต</span>
            </div>
          </div>

          {hasPrompt ? (
            <div className="pwa-prompt-action">
              <button
                type="button"
                className="primary pwa-btn-install"
                onClick={async () => {
                  const success = await onInstall();
                  if (success) onClose();
                }}
              >
                <Download size={16} />
                <span>คลิกเพื่อติดตั้งลงเครื่องทันที (Install Now)</span>
              </button>
            </div>
          ) : (
            <div className="pwa-chrome-steps">
              <h4>วิธีติดตั้งผ่าน Google Chrome:</h4>
              <ol className="pwa-steps-list">
                <li>
                  <strong>วิธีที่ 1 (แนะนำ):</strong> มองหาไอคอน <strong>🖥️ ติดตั้ง (Install LabelCraft)</strong> บนแถบ URL ด้านขวาของ Chrome แล้วกดคลิก
                </li>
                <li>
                  <strong>วิธีที่ 2:</strong> กดปุ่มเมนู <strong>⋮ (3 จุด)</strong> ที่มุมขวาบนของ Chrome → เลือก <strong>"บันทึกและแชร์" (Save and share)</strong> → เลือก <strong>"ติดตั้ง LabelCraft..."</strong>
                </li>
              </ol>
            </div>
          )}
        </div>

        <div className="pwa-install-footer">
          <button type="button" className="secondary" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
