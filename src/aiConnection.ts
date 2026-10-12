export type AIProvider = 'demo' | 'api' | 'codex';
export type AIConnection = {url: string; token: string};
export type AIConnections = {api: AIConnection; codex: AIConnection};

export function connectionURL(provider: Exclude<AIProvider, 'demo'>, value: string, protocol: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw Error('ใส่ URL ของตัวเชื่อมให้ถูกต้อง'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw Error('ใช้ URL แบบ HTTP/HTTPS โดยไม่มีรหัสผ่านหรือ query');
  }
  if (protocol === 'https:' && url.protocol !== 'https:') {
    throw Error('เว็บ HTTPS ต้องใช้ตัวเชื่อม HTTPS ที่มี certificate เชื่อถือได้');
  }
  if (provider === 'codex' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw Error('ChatGPT ผ่าน Codex ต้องเชื่อมตัวเชื่อมบนเครื่องนี้เท่านั้น');
  }
  return url.toString().replace(/\/$/, '');
}

export async function checkConnection(provider: Exclude<AIProvider, 'demo'>, connection: AIConnection): Promise<string> {
  if (connection.token.length < 24) throw Error('ใส่ access/pairing token ของตัวเชื่อม อย่างน้อย 24 ตัวอักษร');
  const url = connectionURL(provider, connection.url, window.location.protocol);
  const response = await fetch(url + '/v1/providers', {
    headers: {Authorization: 'Bearer ' + connection.token}, signal: AbortSignal.timeout(15000),
  });
  const status = await response.json();
  if (!response.ok) throw Error(status.error || 'ตรวจสอบการเชื่อมต่อไม่สำเร็จ');
  if (status[provider]?.ready !== true) throw Error(status[provider]?.message || 'ยังไม่ได้ตั้งค่า API key และ model บน server');
  return provider === 'codex' ? 'ตรวจสอบแล้ว: Codex ล็อกอินด้วย ChatGPT บนเครื่องนี้' : 'ตรวจสอบแล้ว: server ตั้งค่า API provider พร้อมแล้ว';
}
