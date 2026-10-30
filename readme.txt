
UNIMARKET — คู่มือเริ่มต้น

ไฟล์ในโปรเจกต์
- index.html
- style.css
- config.js
- app.js
- supabase-schema.sql
- README-เริ่มต้น.txt

ขั้นตอนที่ 1: สร้าง Supabase
1. เข้า https://supabase.com
2. สมัครหรือเข้าสู่ระบบ
3. กด New project
4. ตั้งชื่อ unimarket
5. เลือก Region Singapore หากมี
6. สร้างโปรเจกต์

ขั้นตอนที่ 2: สร้างฐานข้อมูล
1. เข้าโปรเจกต์ Supabase
2. เปิด SQL Editor
3. กด New query
4. เปิดไฟล์ supabase-schema.sql
5. คัดลอกโค้ดทั้งหมดไปวาง
6. กด Run

ขั้นตอนที่ 3: เชื่อมเว็บไซต์
1. เปิด Project Settings > API
2. คัดลอก Project URL
3. คัดลอก Publishable key
4. เปิด config.js
5. ใส่ค่าจริงแทนข้อความตัวอย่าง

ห้ามใช้ Secret key หรือ service_role key ในเว็บไซต์

ขั้นตอนที่ 4: ทดลองเว็บไซต์
1. เปิดโฟลเดอร์ด้วย VS Code
2. ติดตั้งส่วนขยาย Live Server
3. คลิกขวา index.html
4. เลือก Open with Live Server

ขั้นตอนที่ 5: เผยแพร่บน GitHub
1. สร้าง Repository ชื่อ unimarket
2. อัปโหลดไฟล์ทั้งหมด
3. เข้า Settings > Pages
4. เลือก Deploy from a branch
5. เลือก main และ /(root)
6. กด Save
7. รอ GitHub แสดง URL เว็บไซต์

หมายเหตุ:
- หากยังไม่เชื่อม Supabase เว็บไซต์จะแสดงสินค้า DEMO
- ยังไม่มีระบบชำระเงิน ตะกร้าสินค้า แชต หรือจัดส่ง
- ผู้ซื้อและผู้ขายติดต่อกันเองผ่านช่องทางที่ผู้ขายระบุ
