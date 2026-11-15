import axios from 'axios'
import type { ApiErrorResponse } from '../types/ApiResponse'

export function getApiErrorMessage(
    error: unknown,
    fallback = 'ไม่ทราบสาเหตุ',
): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return error.response?.data?.message?.trim() || error.message || fallback
    }

    return error instanceof Error ? error.message : fallback
}
