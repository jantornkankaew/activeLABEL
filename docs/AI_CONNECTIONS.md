# LabelCraft: API หรือ ChatGPT ผ่าน Codex

> Legacy local-connector documentation. The preferred ChatGPT integration is now [LabelCraft inside ChatGPT](CHATGPT_APP.md), which requires no local Codex installation. The website no longer offers the local Codex option. The API section remains applicable.

LabelCraft มี 3 โหมด: ทดลองคำสั่งออฟไลน์, API, และ ChatGPT ผ่าน Codex CLI ทางการบนเครื่องของคุณ การใช้ ChatGPT ขึ้นอยู่กับสิทธิ์ Codex และโควตาของแพ็กเกจ ไม่ใช่ API credit และไม่รับประกันว่าใช้ได้ไม่จำกัด

## ChatGPT — Windows และ macOS

ตัวเว็บเปิดใน Chrome ได้ตามเดิม ตัวเชื่อมทำงานบนคอมพิวเตอร์เครื่องเดียวกับ Chrome และเก็บการล็อกอินไว้ใน Codex ไม่ส่งรหัสผ่านหรือ OAuth token ไปที่ GitHub Pages

### 1. ติดตั้งครั้งแรก

- ติดตั้ง Node.js LTS จาก <https://nodejs.org/> ถ้ายังไม่มี
- ติดตั้ง Codex ทางการใน macOS Terminal: `npm install -g @openai/codex@0.162.1`; Windows PowerShell: `npm.cmd install -g @openai/codex@0.162.1`
- ติดตั้ง mkcert สำหรับ certificate ของ localhost ตามคำแนะนำทางการ: <https://github.com/FiloSottile/mkcert#installation> บน macOS ที่มี Homebrew ใช้ `brew install mkcert`; บน Windows ใช้ `choco install mkcert` ถ้ามี Chocolatey หรือดาวน์โหลด binary ตามคู่มือทางการ และให้คำสั่ง `mkcert` อยู่ใน PATH

ตัวช่วยเริ่มระบบจะรัน `mkcert -install` เพื่อเพิ่ม local certificate authority ใน trust store ของเครื่อง (ระบบอาจขอสิทธิ์ administrator) Certificate และ private key อยู่ในโฟลเดอร์ส่วนตัวของผู้ใช้ ไม่ใช่ใน GitHub ห้ามเผยแพร่ private key หรือกดข้ามคำเตือน certificate ของ Chrome

### 2. ดาวน์โหลดตัวเชื่อม

เปิด <https://github.com/jantornkankaew/labelcraft/actions/workflows/connectors.yml> เลือก run ที่สำเร็จและตรงกับ commit ล่าสุด แล้วดาวน์โหลด artifact **LabelCraft-AI-Connectors** (GitHub อาจให้ล็อกอินก่อนดาวน์โหลด)

แตก ZIP แล้วเลือก ZIP ภายในให้ตรงเครื่อง:

| เครื่อง | ZIP |
|---|---|
| Windows Intel/AMD 64-bit | `labelcraft-windows-amd64.zip` |
| Windows ARM64 | `labelcraft-windows-arm64.zip` |
| Mac Apple Silicon (M1/M2/…) | `labelcraft-darwin-arm64.zip` |
| Mac Intel | `labelcraft-darwin-amd64.zip` |

แตก ZIP ของเครื่องคุณ เก็บไฟล์ทั้งหมดไว้ในโฟลเดอร์เดียวกัน Binary ยังไม่ได้ลงนามหรือตรวจ native execution บนเครื่องจริง หากระบบไม่อนุญาตให้เปิด อย่าปิดระบบรักษาความปลอดภัยหรือข้ามคำเตือน ให้ตรวจ provenance/build ตามนโยบายของเครื่อง หรือ build จาก source ด้วย Go 1.22+ (`go build -o labelcraft-connector ./cmd/api`; Windows ใช้ชื่อ `.exe`)

### 3. เริ่มระบบและล็อกอิน

**macOS:** เปิด Terminal ในโฟลเดอร์ที่แตกไฟล์แล้วรัน:

```sh
chmod +x labelcraft-connector
bash start-chatgpt-macos.sh
```

**Windows:** เปิด PowerShell ในโฟลเดอร์ที่แตกไฟล์แล้วรัน:

```powershell
.\start-chatgpt-windows.ps1
```

ใช้ execution policy ขององค์กร/เครื่องตามปกติ ไม่ปิดหรือ bypass ถ้า script ไม่ได้รับอนุญาต ให้ใช้ขั้นตอน manual ด้านล่างหรือขออนุมัติตามนโยบายของเครื่อง

Codex จะเปิดขั้นตอนล็อกอินทางการใน browser เลือกบัญชี ChatGPT ของคุณ เปิด Terminal/PowerShell นี้ค้างไว้ระหว่างใช้งาน ตัวเชื่อมไม่ได้มี OAuth client ของ LabelCraft และไม่ได้ดึง cookie จาก ChatGPT

### 4. จับคู่กับเว็บ

เปิด <https://jantornkankaew.github.io/labelcraft/> ใน Chrome → **Settings** หรือ **เปลี่ยน** ข้างโหมด AI:

1. เลือก **ChatGPT · ผ่าน Codex บนเครื่องคุณ**
2. Local connector URL: `https://localhost:28172`
3. เปิดไฟล์ `pairing-token.txt` บนเครื่องคุณ แล้วใส่ค่าจากไฟล์ในช่อง Pairing token **อย่าส่ง token ในแชทหรือ commit ลง GitHub**
   - Windows: `%APPDATA%\LabelCraft\pairing-token.txt`
   - macOS: `~/Library/Application Support/LabelCraft/pairing-token.txt`
4. กด **ตรวจสอบการเชื่อมต่อ** แล้ว **ใช้ตัวเลือกนี้**
5. หาก Chrome ขอสิทธิ์ Local network access ให้อนุญาตเฉพาะเว็บ LabelCraft ที่คุณตั้งใจเชื่อม ตัวเชื่อมอนุญาต Origin `https://jantornkankaew.github.io` (Origin ไม่มี path)

ถ้าพบ certificate error, login error, quota limit หรือไม่พบ Codex ระบบจะแสดงข้อผิดพลาดและไม่แก้ฉลาก ไม่สลับไปคิดค่า API อัตโนมัติ Pairing token เก็บในหน่วยความจำของหน้าเว็บเท่านั้น ต้องใส่ใหม่หลัง reload ส่วน OAuth credentials ให้ Codex จัดการบนเครื่อง

หากต้องการออกจากบัญชี รัน `codex logout` บนเครื่องนั้น ปิด Terminal เพื่อหยุดตัวเชื่อม การลบ `pairing-token.txt` หลังหยุดบริการจะให้ระบบสร้าง token ใหม่เมื่อเริ่มอีกครั้ง

### Manual startup

ตัวเชื่อมต้องใช้ native Codex executable (Windows ต้องเป็น `codex.exe` ไม่ใช่ `codex.cmd`) หา path ของ binary ที่ติดตั้งด้วย npm โดยรัน `node resolve-codex.mjs` ตามด้วย path ที่ได้จาก `npm root -g` ตั้งค่านั้นเป็น `LABELCRAFT_CODEX_BIN` และล็อกอินผ่าน executable นั้นด้วยคำสั่ง `login`

รัน `mkcert -install` และสร้าง certificate `mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1` ในโฟลเดอร์ส่วนตัวที่สิทธิ์จำกัด ตั้ง `API_TLS_CERT` และ `API_TLS_KEY` เป็น path ของไฟล์ทั้งสอง จากนั้นรัน `labelcraft-connector -local` (`.\labelcraft-connector.exe -local` บน Windows) จำกัด ACL ของโฟลเดอร์ certificate และ `%APPDATA%\LabelCraft` ให้เฉพาะผู้ใช้ปัจจุบันบน Windows; บน macOS ใช้ permission 700 สำหรับโฟลเดอร์และ 600 สำหรับ private key

## API

ตั้งค่า Go API server ด้วย `LABELCRAFT_API_TOKEN` (24+ ตัวอักษร), `LLM_API_KEY`, `LLM_MODEL`, optional `LLM_URL` และ exact `LABELCRAFT_ALLOWED_ORIGINS` ตาม README ค่า model API key อยู่บน server เท่านั้น

ในเว็บเลือก **API · ใช้ API key บน server** ใส่ HTTPS URL และ **API access token ของ LabelCraft server** (ไม่ใช่ model API key) ตรวจสอบแล้วใช้ตัวเลือกนี้ Server ต้องรองรับ `GET /v1/providers` และ `POST /v1/design` ของเวอร์ชันนี้ ค่าใช้บริการโมเดลเป็นของบัญชี API แยกจาก ChatGPT

## Development / verified limits

- `POST /v1/design` รับ `provider: "api" | "codex"`; ไม่ระบุใช้ API เพื่อรองรับ clients เดิม ทั้งสอง provider ผ่าน shared response checks และ client transaction/revision engine
- Codex เปิดเฉพาะ `-local` หรือ `LABELCRAFT_CODEX_ENABLED=1` และต้อง bind loopback ไม่อนุญาตให้เผยแพร่ credential ของผู้ใช้ผ่าน public server
- Hosted HTTPS origins ต้องใช้ TLS ที่เชื่อถือได้ ระบบไม่ปิด TLS/browser security
- CLI ส่ง prompt ผ่าน stdin ใช้ temporary working directory, read-only sandbox, ephemeral session, schema output และปิด shell/agent/browser extensions ไม่เปิด model tools จาก user config
- ทดสอบ protocol/validation/auth ด้วย mocks, frontend interaction และ cross-compilation บน Linux การล็อกอินจริง, quota, browser private-network behavior จาก GitHub Pages และ native Windows/macOS ยังต้องทดสอบด้วยบัญชีและเครื่องจริง การ cross-compile ไม่ยืนยันสิ่งเหล่านี้
- ไม่มีการพิมพ์หรือเรียก model จริงในการทดสอบอัตโนมัติ การพิมพ์ใช้ bridge แยกตาม README

อ้างอิง: [Codex authentication](https://developers.openai.com/codex/auth), [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive), [Official SDK](https://github.com/openai/codex/tree/main/sdk/typescript), [mkcert](https://github.com/FiloSottile/mkcert)
