# Education Web

Frontend ของระบบสารสนเทศนิสิต ใช้งานร่วมกับ backend `education-api` สำหรับผู้ดูแลระบบ อาจารย์ และนิสิต โดย source code ชุดเดียวกันสามารถ build เป็นแอป 2 โหมดได้:

- `staff` สำหรับ role `admin` และ `teacher`
- `student` สำหรับ role `student`

ระบบครอบคลุมการค้นหาและจัดการข้อมูลนิสิต การมอบหมายอาจารย์ที่ปรึกษา การนำเข้าข้อมูล/ผลการเรียน การซิงค์ข้อมูล การดูผลการเรียนและโครงสร้างหลักสูตร ตลอดจนการจำลองผลการเรียน

## เทคโนโลยีหลัก

- React 19 และ TypeScript 6
- Vite 8
- Ant Design 6, Ant Design Icons และ Ant Design Plots
- React Router 7
- Axios ผ่าน instance กลางที่ `src/config/axios.ts`
- Day.js
- Leaflet และ React Leaflet
- npm และ `package-lock.json`

โปรเจกต์ติดตั้ง TanStack Query, React Hook Form และ Zod ไว้แล้ว แต่โค้ดปัจจุบันยังใช้ React hooks และ Ant Design Form เป็นหลัก จึงไม่ควรเพิ่ม data/form pattern ใหม่โดยไม่มีเหตุผลจากงานที่ทำ

## ความสามารถของระบบ

| กลุ่มผู้ใช้ | ความสามารถหลัก |
|---|---|
| `admin` | ดูและจัดการข้อมูลนิสิตระดับภาควิชา/คณะ, กำหนดอาจารย์ที่ปรึกษา, นำเข้านิสิตและผลการเรียน, ซิงค์ข้อมูล, จัดการ master data และใช้เครื่องคำนวณผลการเรียน |
| `teacher` | ดูนิสิตในที่ปรึกษา/ภาควิชา/คณะ, ดูรายละเอียด ผลการเรียน หลักสูตร และ Note ของนิสิต รวมถึงใช้เครื่องคำนวณผลการเรียน |
| `student` | ดูภาพรวมผลการเรียน, ดูโครงสร้างหลักสูตรและวิชาที่ไม่ผ่าน, แก้ไขข้อมูลติดต่อ และจำลองผลการเรียนของตนเอง |

กลุ่มรายการนิสิตที่รองรับคือ `advisor`, `department` และ `faculty` และสามารถเติมสถานะ `graduated` ใน URL เพื่อดูนิสิตที่สำเร็จการศึกษาได้

## สิ่งที่ต้องมี

- Node.js `^20.19.0` หรือ `>=22.12.0` ตามข้อกำหนดของ Vite 8
- npm
- backend `education-api` ที่ browser เข้าถึงได้

## เริ่มต้นใช้งาน

ติดตั้ง dependency จาก root ของ repository:

```sh
npm ci
```

รัน Staff และ Student แยกกันได้ด้วย terminal คนละหน้าต่าง:

```sh
npm run dev:staff
npm run dev:student
```

- Staff: http://localhost:3001
- Student: http://localhost:3002

ค่าเริ่มต้นใน `.env.staff` เปิด Mock Login สำหรับ staff ส่วน `.env.student` ใช้หน้า Mock Login ของนิสิตเพื่อเลือกรายการผู้ใช้จำลอง

หากต้องการรัน Vite ด้วย mode ปกติและพอร์ตเริ่มต้น:

```sh
npm run dev
```

## Environment variables

ไฟล์ที่ใช้กับแต่ละคำสั่ง:

- `.env.staff` สำหรับ `npm run dev:staff`
- `.env.student` สำหรับ `npm run dev:student`
- `.env.development.example` และ `.env.production.example` เป็นตัวอย่างการตั้งค่าตาม environment
- `.env.staff.local` หรือ `.env.student.local` สำหรับ override เฉพาะเครื่อง โดยไฟล์ `*.local` จะไม่ถูก commit

ตัวอย่างสำหรับ staff mode:

```env
VITE_API_URL=http://localhost:8000/api
VITE_BASE_PATH=
VITE_MOCK_LOGIN_ENABLED=true
VITE_APP_MODE=staff
VITE_AUTH_PROVIDER=mock
```

| ตัวแปร | จำเป็น | รายละเอียด |
|---|---|---|
| `VITE_API_URL` | ใช่ | Base URL ที่ Axios ใช้เรียก backend เช่น `http://localhost:8000/api` หรือ `/api` เมื่อใช้ proxy |
| `VITE_APP_MODE` | ใช่ | โหมดของ bundle: `staff` หรือ `student` |
| `VITE_AUTH_PROVIDER` | ไม่ | `portal` (ค่าเริ่มต้น) เข้าสู่ระบบผ่าน KU All Login ที่ ENG Main · `mock` ใช้ `/mock-login` และ `/auth/callback` บนเครื่องตัวเอง |
| `VITE_PORTAL_LOGIN_URL` | ไม่ | หน้า ENG Main ที่ส่งผู้ใช้ไปเมื่อยังไม่ได้เข้าสู่ระบบหรือ session หมด (ค่าเริ่มต้น `https://office.eng.kps.ku.ac.th/eng-main/home`) |
| `VITE_PORTAL_LOGOUT_URL` | ไม่ | หน้าที่ไปหลังกดออกจากระบบ; เว้นว่าง = `VITE_PORTAL_LOGIN_URL` |
| `VITE_BASE_PATH` | ไม่ | Subpath ที่ใช้ deploy เช่น `/education`; เว้นว่างเมื่อ deploy ที่ root |
| `VITE_MOCK_LOGIN_ENABLED` | ไม่ | เปิด `/mock-login` สำหรับ staff เมื่อมีค่า `true` (ใช้ได้เฉพาะ `VITE_AUTH_PROVIDER=mock`); ควรใช้เฉพาะ local/dev/staging |
| `VITE_API_PROXY_TARGET` | ไม่ | Target ของ Vite dev proxy เช่น `http://localhost:8000` |
| `VITE_API_PROXY_PATH` | ไม่ | Path ที่ Vite proxy ไปยัง target เช่น `/api`; proxy จะทำงานเมื่อกำหนดทั้ง target และ path |

ตัวอย่างการใช้ dev proxy:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_API_PROXY_PATH=/api
```

ตัวแปร `VITE_*` ทั้งหมดถูกเปิดเผยใน browser จึงห้ามเก็บ secret, private key หรือ credential ไว้ในตัวแปรเหล่านี้

## Authentication และ Authorization

**Portal (`VITE_AUTH_PROVIDER=portal`)** — staff เข้าสู่ระบบด้วย KU All Login ผ่าน ENG Main

1. ยังไม่มี token → `RoleRedirect` พาไป `VITE_PORTAL_LOGIN_URL`
2. ผู้ใช้กด tile ของระบบใน ENG Main → กลับมาที่ `/auth/portal/{admin|teacher}?exchangeToken=…&intranetToken=…`
3. `PortalLogin` ลบ token ออกจาก URL ทันที แล้วส่งให้ `POST /auth/portal-login` (ครั้งเดียว — exchangeToken ใช้ซ้ำไม่ได้) ได้ JWT ของระบบกลับมา
4. เข้าสู่ระบบด้วย role ที่กดมา (`current_role` จาก `/me`) และยังสลับ role ได้จากเมนูมุมขวาบน
5. Request ที่แนบ token แล้วได้ 401 (เช่น session ถูกยกเลิกที่ ENG Main) → Axios interceptor ล้าง token แล้วพากลับ ENG Main
6. ออกจากระบบ → `POST /auth/logout` (ปิด session ของระบบนี้เท่านั้น ระบบอื่นใน Portal ยังใช้งานได้) แล้วไป `VITE_PORTAL_LOGOUT_URL`

ถ้าเข้าสู่ระบบไม่สำเร็จ หน้า `PortalLogin` จะแสดงข้อผิดพลาดพร้อมปุ่มกลับไปที่ Portal โดยไม่ redirect อัตโนมัติ (กันวนลูป)

**Mock (`VITE_AUTH_PROVIDER=mock`)** — สำหรับ local

1. ระบบรับ token จาก `/auth/callback?token=...`
2. `AuthContext` บันทึก token ใน `auth_token` แล้วเรียก `GET /me`

ทั้งสองแบบ ข้อมูลผู้ใช้และ role ปัจจุบันถูกเก็บใน `auth_user` และ `current_role` และ Axios interceptor แนบ Bearer token จาก local storage ให้ทุก request

สิทธิ์ route ถูกตรวจด้วย `ProtectedRoute`, `StudentAuthenticatedRoute` และ `StudentRouteGuard` การซ่อนเมนูเป็นเพียงส่วนแสดงผลและไม่ใช้แทน route guard

| Route หลัก | Role |
|---|---|
| `/students/advisor` | `teacher` |
| `/students/department`, `/students/faculty` | `teacher`, `admin` |
| `/advisor-assignments` | `admin` |
| `/student-imports`, `/grade-imports`, `/sync` | `admin` |
| `/master-data/*` | `admin` |
| `/grade-calculator` | `teacher`, `admin` |
| `/student/home`, `/student/profile`, `/student/grades`, `/student/grade-calculator` | `student` ใน student mode |

Mock Login สำหรับ staff ใช้ได้เมื่อ `VITE_AUTH_PROVIDER=mock` และ `VITE_MOCK_LOGIN_ENABLED=true` ส่วน student mode มี route `/student/mock-login` แยกต่างหากตาม flow ปัจจุบัน production ต้อง build ด้วย `VITE_AUTH_PROVIDER=portal` (backend ปิด mock login เองเมื่อ `APP_ENV=production`)

## การเชื่อมต่อ API

- เรียก API ผ่าน default export จาก `src/config/axios.ts` เท่านั้น
- Backend ส่วนใหญ่ตอบกลับในรูปแบบ `{ success, message, data }`
- service จะ unwrap `response.data.data` ก่อนส่ง domain data ให้ UI
- ชื่อ field ใน payload ใช้รูปแบบ `snake_case` ตาม backend
- token ถูกแนบโดย Axios interceptor ไม่ต้องเพิ่ม Authorization header ในแต่ละ service

## โครงสร้างโปรเจกต์

```text
src/
├── pages/          # หน้าระดับ route และการประสานงานของแต่ละหน้า
├── features/       # โมดูลตาม domain เช่น students, imports, masterData
├── components/     # component ที่ใช้ร่วมกันและ route guards
│   └── custom/     # UI primitive เฉพาะของแอป
├── layouts/        # layout หลักของแอป
├── context/        # AuthContext และ AddressMasterDataContext
├── services/       # API operations แยกตาม domain
├── config/         # Axios และ app mode configuration
├── types/          # request, response และ shared domain types
├── hooks/          # custom hooks ที่ใช้ข้าม feature
├── utils/          # utility functions
├── assets/         # asset ที่ import ผ่าน source code
└── styles.css      # global styles หลัก

public/             # static files ที่เสิร์ฟตรง
docker/             # nginx configuration
```

Route declarations รวมอยู่ที่ `src/App.tsx` และหน้าที่ผูกกับ route ถูก lazy-load ผ่าน `React.lazy`/`Suspense`

## คำสั่งที่ใช้บ่อย

```sh
npm run dev          # Vite development server
npm run dev:staff    # staff mode ที่พอร์ต 3001
npm run dev:student  # student mode ที่พอร์ต 3002
npm run lint         # ตรวจด้วย ESLint
npm run build        # TypeScript project build และ Vite production build
npm run preview      # preview ไฟล์ใน dist/
npm run docker:up    # build และเปิด staff/student containers
npm run docker:down  # หยุดและนำ containers ของ compose project ลง
```

โปรเจกต์ยังไม่มี automated test framework ก่อนส่งงานจึงต้องรันอย่างน้อย:

```sh
npm run lint
npm run build
```

## Docker

`docker compose` จะ build source เดียวกันเป็น 2 images และเสิร์ฟด้วย Nginx:

- `education-web-staff` ที่ http://localhost:3001
- `education-web-student` ที่ http://localhost:3002

เริ่มและหยุดระบบ:

```sh
npm run docker:up
npm run docker:down
```

กำหนด API URL ขณะสั่ง compose ได้ผ่าน environment variable `VITE_API_URL`; หากไม่กำหนดจะใช้ `http://localhost:8000/api` ค่า Vite ถูกฝังลง bundle ตอน build ดังนั้นเมื่อเปลี่ยนค่าต้อง build image ใหม่

Nginx ตั้งค่า SPA fallback ไปยัง `index.html` เพื่อรองรับการเปิด React Router route โดยตรง

## แนวทางพัฒนา

- ใช้ Ant Design และรูปแบบ form/service ที่มีอยู่ก่อนสร้าง pattern ใหม่
- เก็บ network call ใน `src/services/` และใช้ shared types ใน `src/types/`
- รักษา route guards และเมนูให้สอดคล้องกันเมื่อเพิ่ม route ที่ต้องตรวจสิทธิ์
- ข้อความที่แสดงต่อผู้ใช้ใช้ภาษาไทยเป็นหลัก
- หลีกเลี่ยงการแก้ไฟล์ generated เช่น `dist/` และ dependency ใน `node_modules/`

รายละเอียด convention และข้อกำหนดการแก้โค้ดเพิ่มเติมอยู่ใน [AGENTS.md](AGENTS.md)
