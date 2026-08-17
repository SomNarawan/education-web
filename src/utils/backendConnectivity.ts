import axios from 'axios'
import api from '../config/axios'

export type BackendConnectivityResult =
    | { ok: true; status: number }
    | { ok: false; message: string }

// เรียก /me โดยตั้งใจไม่ส่ง token — ต้องการแค่เช็คว่า FE คุยกับ BE รอด
// (ได้ HTTP response กลับมา แม้จะเป็น 401 ก็ถือว่าเชื่อมต่อสำเร็จ)
// error ที่ไม่มี response เลย = เชื่อมต่อไม่ได้ (network ล่ม / CORS ปิดกั้น / backend ไม่ตอบ)
export async function checkBackendConnectivity(): Promise<BackendConnectivityResult> {
    const baseURL = api.defaults.baseURL ?? '(ไม่ได้ตั้งค่า VITE_API_URL)'

    try {
        const res = await api.get('/me', { timeout: 8000 })

        console.log(
            `[backend-connectivity] เชื่อมต่อสำเร็จ — ${baseURL}/me → HTTP ${res.status}`,
        )

        return { ok: true, status: res.status }
    } catch (err) {
        if (axios.isAxiosError(err)) {
            if (err.response) {
                console.log(
                    `[backend-connectivity] เชื่อมต่อสำเร็จ (ได้ response จาก server) — ${baseURL}/me → HTTP ${err.response.status}`,
                )

                return { ok: true, status: err.response.status }
            }

            const detail =
                err.code === 'ECONNABORTED'
                    ? `หมดเวลาเชื่อมต่อ (timeout) หลัง 8 วินาที`
                    : `ไม่ได้รับ response จาก server เลย (${err.message}) — สาเหตุที่เป็นไปได้: backend ไม่ได้รันอยู่, ผิด URL/พอร์ต, network ล่ม, หรือถูก CORS บล็อก (เปิด DevTools > Console/Network เพื่อดู error ตัวจริงจาก browser)`

            console.error(
                `[backend-connectivity] เชื่อมต่อ backend ไม่สำเร็จ — ${baseURL}/me\n${detail}`,
                err,
            )

            return { ok: false, message: detail }
        }

        console.error(
            `[backend-connectivity] เกิดข้อผิดพลาดที่ไม่คาดคิดระหว่างเชื่อมต่อ backend — ${baseURL}/me`,
            err,
        )

        return { ok: false, message: String(err) }
    }
}
