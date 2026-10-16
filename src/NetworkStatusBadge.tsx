import {useState,useRef,useEffect} from 'react';
import {Wifi,WifiOff,RefreshCw,Check,AlertCircle,Cloud} from 'lucide-react';
import type {SyncState} from './syncEngine';

export function NetworkStatusBadge({
  online,
  syncState,
  pendingCount,
  lastSyncTime,
  onManualSync,
}: {
  online: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncTime: number | null;
  onManualSync?: () => Promise<boolean>;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popoverOpen]);

  async function handleSyncClick() {
    if (!onManualSync || syncingManual) return;
    setSyncingManual(true);
    try {
      await onManualSync();
    } finally {
      setSyncingManual(false);
    }
  }

  const formattedTime = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    : null;

  let badgeClass = 'online';
  let badgeLabel = 'Online';
  let Icon = Wifi;

  if (!online || syncState === 'offline') {
    badgeClass = 'offline';
    badgeLabel = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
    Icon = WifiOff;
  } else if (syncState === 'syncing' || syncingManual) {
    badgeClass = 'syncing';
    badgeLabel = 'Syncing…';
    Icon = RefreshCw;
  } else if (syncState === 'synced') {
    badgeClass = 'synced';
    badgeLabel = 'Synced';
    Icon = Check;
  } else if (syncState === 'error') {
    badgeClass = 'error';
    badgeLabel = 'Sync error';
    Icon = AlertCircle;
  } else if (syncState === 'pending') {
    badgeClass = 'pending';
    badgeLabel = `รอ Sync (${pendingCount})`;
    Icon = Cloud;
  }

  return (
    <div ref={rootRef} className="network-status-wrapper">
      <button
        type="button"
        className={`network-status-btn ${badgeClass}`}
        aria-label={`Network status: ${badgeLabel}`}
        title={`สถานะการเชื่อมต่อ: ${badgeLabel} (คลิกดูรายละเอียด)`}
        onClick={() => setPopoverOpen(prev => !prev)}
      >
        <span className={`network-status-dot ${badgeClass}`} />
        <Icon size={12} className={badgeClass === 'syncing' ? 'spin-anim' : ''} />
        <span className="network-status-text">{badgeLabel}</span>
      </button>

      {popoverOpen && (
        <div className="network-status-popover" role="dialog" aria-label="สถานะการเชื่อมต่อและซิงค์ข้อมูล">
          <div className="net-popover-header">
            <h4>สถานะระบบ</h4>
            <span className={`net-pill ${badgeClass}`}>{badgeLabel}</span>
          </div>

          <div className="net-popover-content">
            <div className="net-info-row">
              <span className="net-info-label">การเชื่อมต่อ:</span>
              <strong className={online ? 'text-green' : 'text-amber'}>
                {online ? '🟢 ออนไลน์ (เชื่อมต่อแล้ว)' : '🟠 ออฟไลน์ (ไม่มีอินเทอร์เน็ต)'}
              </strong>
            </div>

            <div className="net-info-row">
              <span className="net-info-label">พื้นที่เก็บข้อมูล:</span>
              <span>บันทึกในเครื่องอัตโนมัติ (Local Storage)</span>
            </div>

            {pendingCount > 0 && (
              <div className="net-info-row">
                <span className="net-info-label">รอซิงค์กับคลาวด์:</span>
                <span className="text-amber">
                  {pendingCount} โปรเจค (จะซิงค์ให้อัตโนมัติเมื่อออนไลน์)
                </span>
              </div>
            )}

            {formattedTime && (
              <div className="net-info-row">
                <span className="net-info-label">ซิงค์ล่าสุด:</span>
                <span>{formattedTime} น.</span>
              </div>
            )}

            <p className="net-helper-text">
              {!online
                ? 'ระบบทำงานแบบ Offline ได้เต็มรูปแบบ คุณสามารถออกแบบและแก้ไขฉลากได้ตามปกติ เมื่อเชื่อมต่ออินเทอร์เน็ตระบบจะซิงค์ข้อมูลกลับให้อัตโนมัติ'
                : 'ข้อมูลของคุณได้รับการปกป้องและพร้อมซิงค์แบบเรียลไทม์'}
            </p>

            {online && onManualSync && (
              <button
                type="button"
                className="btn-manual-sync"
                disabled={syncingManual || syncState === 'syncing'}
                onClick={handleSyncClick}
              >
                <RefreshCw size={13} className={syncingManual ? 'spin-anim' : ''} />
                {syncingManual ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
