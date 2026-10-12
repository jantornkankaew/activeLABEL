import {useState} from 'react';
import {Check} from 'lucide-react';
import {checkConnection, type AIConnections, type AIProvider} from './aiConnection';

export function AIConnectionSettings({provider, connections, onSave, onClose}: {
  provider: AIProvider; connections: AIConnections;
  onSave: (provider: AIProvider, connections: AIConnections) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(provider);
  const [draft, setDraft] = useState(connections);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('');
  const [verified, setVerified] = useState(false);
  function changeProvider(value: AIProvider) { setSelected(value); setStatus(''); setVerified(false); }
  function update(field: 'url' | 'token', value: string) {
    if (selected === 'demo') return;
    setDraft(previous => ({...previous, [selected]: {...previous[selected], [field]: value}}));
    setStatus(''); setVerified(false);
  }
  async function check() {
    if (selected === 'demo') return;
    setChecking(true); setStatus('กำลังตรวจสอบ…'); setVerified(false);
    try { setStatus(await checkConnection(selected, draft[selected])); setVerified(true); }
    catch (error) { setStatus((error as Error).message + ' หากเชื่อมไม่ได้ ตรวจว่าตัวเชื่อมเปิดอยู่, token ถูกต้อง และ Chrome อนุญาตการเข้าถึงเครือข่ายในเครื่อง'); }
    finally { setChecking(false); }
  }
  return <div className="modal-backdrop"><div className="modal ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
    <h2 id="ai-settings-title">AI connection</h2>
    <label>AI provider<select aria-label="AI provider" value={selected} disabled={checking} onChange={event => changeProvider(event.target.value as AIProvider)}>
      <option value="demo">โหมดทดลอง · ไม่ใช้ AI</option>
      <option value="api">API · ใช้ API key บน server</option>
      <option value="codex">ChatGPT · ผ่าน Codex บนเครื่องคุณ</option>
    </select></label>
    {selected === 'demo' ? <p>ทดลองคำสั่งที่รองรับโดยไม่เรียกโมเดลและไม่มีค่า API</p> : <>
      {selected === 'codex' ? <div className="connection-info"><p>ใช้บัญชี ChatGPT ที่มีสิทธิ์ Codex ตามโควตาของแพ็กเกจ รองรับตัวเชื่อม Windows และ macOS</p>
        <ol><li>เปิดตัวช่วยเริ่มระบบ LabelCraft บนเครื่องคุณ</li><li>ล็อกอินผ่าน Codex ทางการใน browser</li><li>ใส่ URL และ pairing token ของตัวเชื่อม แล้วตรวจสอบ</li></ol>
        <a href="https://github.com/jantornkankaew/labelcraft/blob/main/docs/AI_CONNECTIONS.md" target="_blank" rel="noreferrer">วิธีติดตั้งบน Windows / macOS</a>
      </div> : <p>ตั้งค่า model API key บน Go server ค่าใช้บริการ API แยกจากแพ็กเกจ ChatGPT อย่าใส่ model API key ในช่องนี้</p>}
      <label>{selected === 'codex' ? 'Local connector URL' : 'API server URL'}<input aria-label="AI server URL" value={draft[selected].url} disabled={checking} onChange={event => update('url', event.target.value)} /></label>
      <label>{selected === 'codex' ? 'Pairing token' : 'API access token'}<input aria-label="AI access token" type="password" autoComplete="off" value={draft[selected].token} disabled={checking} onChange={event => update('token', event.target.value)} /></label>
      <p>Token อยู่ในหน่วยความจำของหน้านี้ ไม่บันทึกลงฉลากหรือ browser storage เว็บที่เผยแพร่ต้องใช้ HTTPS ที่เชื่อถือได้</p>
      <button className="wide" disabled={checking} onClick={check}>{checking ? 'กำลังตรวจสอบ…' : 'ตรวจสอบการเชื่อมต่อ'}</button>
      {status && <p role="status" className="connection-status">{status}</p>}
    </>}
    <div className="modal-actions"><button disabled={checking} onClick={onClose}>Cancel</button><button className="primary" disabled={checking || (selected !== 'demo' && !verified)} onClick={() => onSave(selected, draft)}><Check size={16}/> ใช้ตัวเลือกนี้</button></div>
  </div></div>;
}
