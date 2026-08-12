# Education Web (Frontend)

ระบบสารสนเทศนักศึกษา (Student Information System) ฝั่ง Frontend สำหรับอาจารย์ที่ปรึกษาและเจ้าหน้าที่ ใช้จัดการข้อมูลนักศึกษา, ที่ปรึกษา, การ import ข้อมูล, การซิงค์ข้อมูล และการคำนวณเกรด

## เทคโนโลยีที่ใช้

- **Runtime:** React 19 + TypeScript
- **Build tool:** Vite 8
- **UI library:** Ant Design 6 (`antd`, `@ant-design/icons`, `@ant-design/plots`)
- **Routing:** React Router 7
- **HTTP client:** Axios (instance กลางที่ [src/config/axios.ts](src/config/axios.ts))
- **Date handling:** Day.js
- **แผนที่:** Leaflet / React Leaflet
- **Package manager:** npm (commit `package-lock.json`)

> ติดตั้ง `@tanstack/react-query`, `react-hook-form`, `zod` ไว้แล้วแต่ยังไม่ได้ใช้งานจริงในแอป อย่าเพิ่ม data/form pattern ใหม่เพียงเพราะมี package อยู่ ให้ใช้เมื่อมีงานที่ต้องใช้จริงเท่านั้น

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี

- Node.js และ npm
- Backend API ที่รันอยู่ (ดูตัวอย่าง endpoint ที่ [FE_API_ENDPOINTS.txt](FE_API_ENDPOINTS.txt))

### ติดตั้ง

```sh
npm install
```

### ตั้งค่า Environment

สร้างไฟล์ `.env.local` (หรือแก้ `.env`) แล้วกำหนดค่า:

```sh
VITE_API_URL=http://localhost:8000/api
```

Backend คาดหวัง response ในรูปแบบ `{ success, message, data }`

> ห้ามใส่ค่าลับ (secret) ใน `VITE_*` เพราะ environment variable ของ Vite จะถูก expose ออกไปยัง browser ทั้งหมด

### คำสั่งที่ใช้บ่อย

รันคำสั่งทั้งหมดจาก root ของ repository

```sh
npm run dev       # เริ่ม dev server พร้อม HMR
npm run lint      # ตรวจสอบโค้ดด้วย ESLint
npm run build     # type-check (tsc -b) แล้ว build production
npm run preview   # preview production build ที่ build แล้ว
```

ก่อนส่งงาน ให้รัน `npm run lint` และ `npm run build` ให้ผ่านเสมอ (ปัจจุบันยังไม่มี automated test framework)

## โครงสร้างโปรเจกต์

```
src/
├── pages/         # หน้าจอระดับ route และการ orchestrate
├── components/    # component ที่ใช้ซ้ำหรือเฉพาะ feature
│   └── custom/    # UI primitive ของแอป
├── features/      # โมดูลตาม feature (advisorAssignments, gradeCalculator, masterData, students)
├── layouts/       # page shell ที่ครอบ route ย่อย
├── context/       # React context ระดับแอป (ปัจจุบันมี AuthContext)
├── services/      # เรียก API และสร้าง request parameter
├── config/        # config เช่น axios instance เดียวของแอป
├── types/         # request/response type ที่ใช้ร่วมกัน
├── hooks/         # custom hooks
├── utils/         # ฟังก์ชันช่วยเหลือทั่วไป
├── assets/        # static asset ที่ import ใช้งาน
└── styles.css     # global style หลักที่ import ใน main.tsx
```

## Authentication & Authorization

- Auth state เก็บใน `AuthContext` และ persist ผ่าน localStorage: `auth_token`, `auth_user`, `current_role`
- Flow: `/auth/callback?token=...` รับ token แล้ว `/me` จะ hydrate ข้อมูลผู้ใช้และ role
- Role ที่รองรับ: `admin`, `teacher`
- กลุ่ม route ของนักศึกษา: `advisor` (teacher เท่านั้น), `department` และ `faculty` (teacher และ admin)
- การเข้าถึง route ถูกบังคับโดย `StudentRouteGuard` และ `ProtectedRoute` — เมนูที่ซ่อน/แสดงเป็นเพียงการแสดงผล ไม่ใช่การป้องกันสิทธิ์

## แนวทางการเขียนโค้ด

รายละเอียดเชิงลึก (convention, coding style, API pattern, การจัดการฟอร์ม ฯลฯ) ดูได้ที่ [AGENTS.md](AGENTS.md)
