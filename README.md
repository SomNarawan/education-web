# Education Web (Frontend)

ระบบสารสนเทศนักศึกษา (Student Information System) ฝั่ง Frontend สำหรับผู้ดูแลระบบ
อาจารย์ที่ปรึกษา และนิสิต ใช้จัดการข้อมูลนักศึกษา/อาจารย์ที่ปรึกษา นำเข้าข้อมูล
ซิงค์ข้อมูล ดูผลการเรียน และคำนวณเกรด โดยใช้คู่กับ backend `education-api`

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

### รันแบบ Development แยก Staff และ Student

เปิด Terminal สองหน้าต่าง แล้วรันคำสั่งต่อไปนี้แยกกัน:

```sh
npm run dev:staff
```

```sh
npm run dev:student
```

- Staff (`admin`, `teacher`): http://localhost:3001
- Student (`student`): http://localhost:3002

พอร์ต Staff จะเปิดหน้า Mock Login ก่อนเข้าใช้งาน ส่วนพอร์ต Student
เข้าใช้งานผ่านหน้า Mock Login สำหรับนิสิต โดยเลือกรายชื่อนิสิตจำลอง

### รันด้วย Docker แยก Staff และ Student

```sh
npm run docker:up
```

- Staff (`admin`, `teacher`): http://localhost:3001
- Student (`student`, Mock Login): http://localhost:3002

พอร์ต Staff จะเปิดหน้า Mock Login สำหรับบุคลากร ส่วนพอร์ต Student
จะเปิดหน้า Mock Login ที่มีรายชื่อนิสิตจำลองให้เลือกก่อนเข้าใช้งาน

ทั้งสอง service ใช้ source code ชุดเดียวกัน แต่ build ด้วย `VITE_APP_MODE`
คนละค่า สามารถหยุดระบบด้วย `npm run docker:down` และกำหนด API URL ก่อนรันได้ด้วย
ตัวแปร `VITE_API_URL` (ค่าเริ่มต้นคือ `http://localhost:8000/api`)

### สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป และ npm
- Backend `education-api` ที่รันอยู่และเข้าถึงได้จาก browser

### ติดตั้ง

```sh
npm ci
```

### ตั้งค่า Environment

ไฟล์ `.env.staff` และ `.env.student` ที่อยู่ใน repository เป็นค่าเริ่มต้นสำหรับ
`npm run dev:staff` และ `npm run dev:student` ตามลำดับ หากต้อง override เฉพาะเครื่อง
ให้สร้าง `.env.staff.local` หรือ `.env.student.local` (ไฟล์ `*.local` ถูก ignore โดย Git)

```env
VITE_API_URL=http://localhost:8000/api
VITE_BASE_PATH=
VITE_MOCK_LOGIN_ENABLED=true
VITE_APP_MODE=staff
```

| ตัวแปร | หน้าที่ |
|---|---|
| `VITE_API_URL` | Base URL ของ backend API |
| `VITE_BASE_PATH` | Subpath ที่ deploy frontend; local ใช้ค่าว่าง |
| `VITE_MOCK_LOGIN_ENABLED` | เปิดหน้า Mock Login สำหรับ staff; ใช้เฉพาะ dev/staging |
| `VITE_APP_MODE` | เลือก bundle เป็น `staff` หรือ `student` |

Backend โดยทั่วไปตอบกลับในรูปแบบ `{ success, message, data }`

> ห้ามใส่ค่าลับ (secret) ใน `VITE_*` เพราะ environment variable ของ Vite จะถูก expose ออกไปยัง browser ทั้งหมด

### คำสั่งที่ใช้บ่อย

รันคำสั่งทั้งหมดจาก root ของ repository

```sh
npm run dev       # เริ่ม dev server พร้อม HMR
npm run dev:staff # staff app ที่ http://localhost:3001
npm run dev:student # student app ที่ http://localhost:3002
npm run lint      # ตรวจสอบโค้ดด้วย ESLint
npm run build     # type-check (tsc -b) แล้ว build production
npm run preview   # preview production build ที่ build แล้ว
npm run docker:up # build และเปิด staff/student ด้วย Docker
npm run docker:down # หยุด Docker services
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
- Role ที่รองรับ: `admin`, `teacher`, `student`
- กลุ่ม route ของนักศึกษา: `advisor` (teacher เท่านั้น), `department` และ `faculty` (teacher และ admin)
- งานมอบหมายอาจารย์ นำเข้าข้อมูล ซิงค์ข้อมูล และจัดการ master data จำกัดเฉพาะ `admin`
- การเข้าถึง route ถูกบังคับโดย `StudentRouteGuard` และ `ProtectedRoute` — เมนูที่ซ่อน/แสดงเป็นเพียงการแสดงผล ไม่ใช่การป้องกันสิทธิ์

Mock Login มีไว้สำหรับ local/dev เท่านั้น Production ต้องตั้ง
`VITE_MOCK_LOGIN_ENABLED=false` และใช้ token callback จากระบบ SSO จริง

## แนวทางการเขียนโค้ด

รายละเอียดเชิงลึก (convention, coding style, API pattern, การจัดการฟอร์ม ฯลฯ) ดูได้ที่ [AGENTS.md](AGENTS.md)
