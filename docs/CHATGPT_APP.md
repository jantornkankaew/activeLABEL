# ใช้ LabelCraft ภายใน ChatGPT

แอปนี้เปิด editor ในบทสนทนา ChatGPT และให้โมเดลของ ChatGPT เรียกเครื่องมือ MCP เพื่อเสนอการแก้ฉลาก ไม่ต้องติดตั้ง Codex หรือตัวเชื่อม Windows/macOS และไม่ต้องใส่ OpenAI API key ในแอป

**ยังต้อง deploy MCP server บน HTTPS และเพิ่มแอปในบัญชี ChatGPT ก่อน** GitHub Pages อย่างเดียวทำไม่ได้ เพราะรัน backend ไม่ได้ โค้ดและ deployment configuration พร้อมแล้ว แต่ไม่มีบัญชีโฮสต์หรือ URL MCP ที่ยืนยันว่า deploy สำเร็จจากแชทนี้

## 1. Deploy server จาก GitHub

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jantornkankaew/activeLABEL)

1. กด **Deploy to Render** ด้านบน แล้วเลือกล็อกอิน Render ด้วย **GitHub** (ต้องสร้าง/ยืนยันบัญชี Render ถ้ายังไม่มี)
2. ตรวจ blueprint `labelcraft-chatgpt` ที่ใช้ `Dockerfile.chatgpt` และเลือกแผนที่ต้องการ configuration ตั้งต้นขอแผน `free` แต่ราคา/โควตา/สิทธิ์สมัครให้ตรวจจาก Render ก่อนยืนยัน
3. กด Deploy แล้วรอ service เป็น **Live**
4. คัดลอก URL HTTPS จริงที่ Render ให้ เช่น service domain ของคุณ แล้วเติม `/mcp` ท้าย URL ห้ามใช้ชื่อ service ตัวอย่างเป็น URL จริง
5. เปิด `/healthz` ของ service เพื่อตรวจสถานะ ก่อนเพิ่มใน ChatGPT

Render ส่ง `RENDER_EXTERNAL_URL` ให้ process เพื่อจำกัด Host ของ endpoint โดยอัตโนมัติ ไม่ต้องใส่ API key หรือ OAuth credentials แผนฟรีอาจพักเครื่องเมื่อไม่มีคนใช้และเริ่มต้นช้าครั้งแรก หากใช้โฮสต์อื่น ให้ตั้ง `MCP_PUBLIC_URL` เป็น URL HTTPS root ที่โฮสต์ให้และ `PORT` ตาม platform

โฮสต์ให้ HTTPS ที่เชื่อถือได้ ห้ามปิด TLS verification หรือ browser security เพื่อเชื่อมต่อ อิมเมจรันด้วยผู้ใช้ `node` ที่ไม่ใช่ root

## 2. เพิ่มแอปใน ChatGPT

บัญชี/แพ็กเกจ/นโยบาย workspace ต้องรองรับ Developer mode และ custom MCP apps ก่อน ชื่อเมนูอาจเป็น **Apps** หรือ **Connectors** ตามเวอร์ชัน UI

1. เปิด ChatGPT ใน Chrome และล็อกอินบัญชีที่คุณสมัครอยู่
2. ไป **Settings → Apps/Connectors → Advanced settings** แล้วเปิด **Developer mode** หากมีให้ใช้
3. เลือก **Create app / เพิ่มแอป** ชื่อ `LabelCraft` และใส่ **URL จริงจากข้อ 1 ที่ลงท้าย `/mcp`**
4. Authentication เลือก **No authentication**: server นี้ทำเฉพาะการตรวจ/คำนวณฉลากแบบ stateless ไม่อ่านบัญชี ไม่เก็บฉลาก และไม่อ่าน credentials ของ ChatGPT
5. บันทึก จากนั้นเปิดบทสนทนาใหม่และเลือก LabelCraft จากเมนูแอป/เครื่องมือ
6. ลองพิมพ์: `เปิด LabelCraft สร้างฉลากว่างขนาด 50 × 30 mm ชื่อฉลากสินค้าของฉัน`

หากไม่พบ Developer mode หรือ Create app ต้องตรวจสิทธิ์แพ็กเกจหรือผู้ดูแล workspace ก่อน ยังไม่ถือว่า app เชื่อมต่อสำเร็จ การเพิ่ม custom app เพื่อทดสอบไม่ได้ทำให้เผยแพร่ใน app directory ให้ทุกคนโดยอัตโนมัติ

## 3. ใช้งาน

- ออกแบบด้วย Text, Line, Box, Layers, Inspector หรือพิมพ์คำขอในช่อง **ส่งให้ ChatGPT**
- ระบุข้อมูลจริงให้ชัด เช่น `เพิ่มข้อความ น้ำหนัก 500 กรัม ที่ x=3 y=3 และเพิ่ม Code 128 ข้อมูล SKU001234` ไม่สร้างราคาหรือ payload บาร์โค้ดขึ้นเอง
- ChatGPT เรียก `labelcraft_propose_edit` ซึ่งตรวจคำสั่งด้วย engine เดียวกับการแก้มือ แล้วแสดง preview **ยังไม่ได้เปลี่ยนฉลากจริง**
- ตรวจข้อเสนอแล้วกด **ใช้การแก้ไข** หรือ **ไม่ใช้** การเปลี่ยน payload ของบาร์โค้ดเดิมต้องยืนยันเพิ่มเติม
- ใช้ Undo/Redo ได้ โดย revision เพิ่มขึ้นเสมอ ข้อเสนอที่ revision เก่าจะใช้ไม่ได้
- ใช้ File menu และแถบแท็บเพื่อสร้าง/เปิดหลายไฟล์งาน; Fit to page ขยายฉลากเต็มพื้นที่ตรงกลาง; Grid/Snap เลือกเปิดปิดได้
- เปลี่ยนประเภทบาร์โค้ดอัตโนมัติเมื่อข้อมูลถูกต้อง หากผิดให้แก้จากข้อความ error หรือกดปุ่มตัวอย่าง/check digit การเปลี่ยน payload ไม่เกิดขึ้นเงียบ ๆ
- กด Print เพื่อเปิดเว็บ LabelCraft พร้อมฉลากและหน้าพิมพ์ แล้วเลือก local printer ใน Chrome ดู [คู่มือ](LOCAL_PRINTING.md)
- ดาวน์โหลด JSON หรือ SVG เพื่อเก็บงาน สถานะปัจจุบันอยู่ใน widget state ของ ChatGPT; undo history อยู่ใน widget ที่เปิดอยู่ ไม่มีฐานข้อมูลฉลากบน MCP server

เวอร์ชันนี้ของ embedded app รองรับ text, barcodes, lines และ boxes ยังไม่รองรับการอัปโหลด image, การเข้าถึงเครื่องพิมพ์โดยตรงจาก sandbox, billing หรือ shared account storage การใช้งานเหล่านี้ใน standalone editor ไม่ได้หมายความว่ามีใน ChatGPT app

## ค่าใช้จ่ายและบัญชี

โมเดลมาจากบทสนทนา ChatGPT จึงอยู่ภายใต้สิทธิ์และโควตาของบัญชี ChatGPT ของคุณ แอปไม่เรียก OpenAI API และไม่มีค่า inference API ที่แอปหักเพิ่มเอง โฮสต์ MCP เป็นบริการแยก ต้องตรวจเงื่อนไขและราคาของโฮสต์ ไม่รับประกันสิทธิ์ free plan หรือ unlimited usage

การเพิ่มแอปนี้ไม่ใช่ปุ่ม OAuth login ของเว็บภายนอก ไม่ส่งรหัสผ่าน, cookie หรือ ChatGPT/Codex access token ไปที่ LabelCraft server

## Development

ต้องใช้ Node.js 24 และ Go 1.25+ (Go MCP SDK requirement)

```sh
npm ci
npm test
npm run build:chatgpt
go test ./...
go run ./cmd/chatgpt
```

Server localhost port 8787 ใช้ตรวจภายในเท่านั้น ไม่ใช่ URL ที่เพิ่มใน ChatGPT ได้ ถ้าจะ deploy เอง: `docker build -f Dockerfile.chatgpt -t labelcraft-chatgpt .`; ตั้ง `MCP_PUBLIC_URL` และวางหลัง trusted HTTPS reverse proxy

`GET /healthz` ตรวจ readiness; `POST /mcp` เป็น streamable HTTP ผ่าน official Go MCP SDK รองรับ initialization, tools/list, tools/call และ resources/list/read Widget bundle เป็น inline HTML/JS/CSS ไม่มี external resource หรือ browser network fetch โดยแอป การขอโมเดลใช้ host `sendFollowUpMessage`

MCP tools มี JSON Schema ตรวจ inputs, Node worker คงที่ใช้ shared TypeScript transaction engine, bounded concurrency, timeouts และ body limits ไม่รัน JavaScript/SQL/printer commands จากโมเดล ไม่มี shared server-side state จึงไม่ใช้ OAuth สำหรับบัญชีภายนอก หากเพิ่มการเก็บข้อมูล/บัญชีในอนาคตต้องออกแบบ authorization ใหม่ก่อน

## Verification limits

ต้องแยกผลการทดสอบ shared-engine/MCP/browser host mocks ออกจากการเพิ่มแอปใน ChatGPT จริง การ deploy/public HTTPS และการเชื่อมบัญชี ChatGPT ยังต้องตรวจหลังผู้ใช้สร้าง service และลงทะเบียน app ไม่มีการใช้ API key หรือส่งงานพิมพ์จริงระหว่างพัฒนา

อ้างอิง: [Official Apps SDK examples](https://github.com/openai/openai-apps-sdk-examples), [Apps SDK](https://developers.openai.com/apps-sdk), [Official Go MCP SDK](https://github.com/modelcontextprotocol/go-sdk)
