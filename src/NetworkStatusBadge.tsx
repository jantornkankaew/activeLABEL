import {useState,useRef,useEffect} from 'react';
import {Wifi,WifiOff,RefreshCw,Check,AlertCircle,Cloud} from 'lucide-react';
import type {SyncState} from './syncEngine';

function formatClock(timestamp: number | null): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
}

function formatTimeAgo(timestamp: number | null, now: number): string {
  if (!timestamp) return '';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 5) return 'เมื่อสักครู่';
  if (diffSec < 60) return `${diffSec} วิที่แล้ว`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชม. ${diffMin % 60} น. ที่แล้ว`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} วันที่แล้ว`;
}

function formatElapsedShort(timestamp: number | null, now: number): string {
  if (!timestamp) return '';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h`;
}

export function NetworkStatusBadge({
  online,
  syncState,
  pendingCount,
  lastSyncTime,
  offlineSince,
  onManualSync,
}: {
  online: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncTime: number | null;
  offlineSince?: number | null;
  onManualSync?: () => Promise<boolean>;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 2000);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        clearInterval(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
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

  const isActuallyOffline = !online || syncState === 'offline';
  const effectiveOfflineSince = isActuallyOffline ? (offlineSince ?? now) : null;

  let badgeClass = 'online';
  let badgeLabel = 'Online';
  let Icon = Wifi;

  if (isActuallyOffline) {
    badgeClass = 'offline';
    const elapsed = effectiveOfflineSince ? formatElapsedShort(effectiveOfflineSince, now) : '';
    badgeLabel = pendingCount > 0 ? `Offline (${pendingCount})` : elapsed ? `Offline · ${elapsed}` : 'Offline';
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
        title={
          isActuallyOffline
            ? `สถานะ: ออฟไลน์ (${effectiveOfflineSince ? formatTimeAgo(effectiveOfflineSince, now) : ''}) · ซิงค์ล่าสุด ${formatClock(lastSyncTime)}`
            : `สถานะ: ออนไลน์ · ซิงค์ล่าสุด ${formatClock(lastSyncTime)} (คลิกดูรายละเอียด)`
        }
        onClick={() => setPopoverOpen(prev => !prev)}
      >
        <span className={`network-status-dot ${badgeClass}`} />
        <Icon size={12} className={badgeClass === 'syncing' ? 'spin-anim' : ''} />
        <span className="network-status-text">{badgeLabel}</span>
      </button>

      {popoverOpen && (
        <div className="network-status-popover net-popover-minimal" role="dialog" aria-label="สถานะการเชื่อมต่อ">
          {/* Minimal Header */}
          <div className="net-min-header">
            <div className={`net-min-indicator ${badgeClass}`}>
              <span className={`net-pulse-dot ${badgeClass}`} />
              <strong className="net-min-title">{isActuallyOffline ? 'ออฟไลน์ (Offline)' : 'ออนไลน์ (Online)'}</strong>
            </div>
            {isActuallyOffline && effectiveOfflineSince && (
              <span className="net-min-chip chip-amber">{formatElapsedShort(effectiveOfflineSince, now)}</span>
            )}
            {!isActuallyOffline && (
              <span className="net-min-chip chip-green">เชื่อมต่อแล้ว</span>
            )}
          </div>

          {/* Minimal Metric Rows */}
          <div className="net-min-rows">
            {isActuallyOffline && (
              <div className="net-min-row">
                <span className="net-min-label">ออฟไลน์ตั้งแต่</span>
                <div className="net-min-val-box">
                  <span className="net-min-val text-amber">{formatClock(effectiveOfflineSince)}</span>
                  <span className="net-min-sub">{formatTimeAgo(effectiveOfflineSince, now)}</span>
                </div>
              </div>
            )}

            <div className="net-min-row">
              <span className="net-min-label">ซิงค์ล่าสุด</span>
              <div className="net-min-val-box">
                <span className={`net-min-val ${lastSyncTime ? 'text-primary' : 'text-muted'}`}>
                  {lastSyncTime ? formatClock(lastSyncTime) : 'ยังไม่เคยซิงค์'}
                </span>
                {lastSyncTime && (
                  <span className="net-min-sub">{formatTimeAgo(lastSyncTime, now)}</span>
                )}
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="net-min-row">
                <span className="net-min-label">รอซิงค์</span>
                <div className="net-min-val-box">
                  <span className="net-min-val text-amber">{pendingCount} รายการ</span>
                  <span className="net-min-sub">จะซิงค์ให้อัตโนมัติเมื่อออนไลน์</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions & Footer */}
          {!isActuallyOffline && onManualSync && (
            <button
              type="button"
              className="btn-min-sync"
              disabled={syncingManual || syncState === 'syncing'}
              onClick={handleSyncClick}
            >
              <RefreshCw size={12} className={syncingManual ? 'spin-anim' : ''} />
              <span>{syncingManual ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลตอนนี้ (Sync Now)'}</span>
            </button>
          )}

          <div className="net-min-footer">
            <span>💾 บันทึกในเครื่องอัตโนมัติ (Local Storage)</span>
          </div>
        </div>
      )}
    </div>
  );
}
