import axios from 'axios'
import type { ApiErrorResponse } from '../../types/ApiResponse'
import { getApiErrorMessage } from '../../utils/apiError'

interface SyncHistoryError {
    message: string
    unauthorized: boolean
}

export function getSyncHistoryError(error: unknown): SyncHistoryError {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
        return {
            message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
            unauthorized: false,
        }
    }

    if (!error.response) {
        return {
            message:
                'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่อีกครั้ง',
            unauthorized: false,
        }
    }

    const responseMessage = error.response.data?.message

    if (error.response.status === 401) {
        return {
            message:
                responseMessage ?? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
            unauthorized: true,
        }
    }

    if (error.response.status === 422) {
        const validationMessages = Object.values(
            error.response.data?.errors ?? {},
        ).flat()

        return {
            message:
                validationMessages.join(' ') ||
                responseMessage ||
                'ตัวกรองสถานะ Sync ไม่ถูกต้อง',
            unauthorized: false,
        }
    }

    return {
        message: responseMessage ?? 'โหลดสถานะ Sync ล่าสุดไม่สำเร็จ',
        unauthorized: false,
    }
}

export function getRequestErrorMessage(error: unknown): string {
    return getApiErrorMessage(error)
}
