import axios from 'axios'
import type { MockLoginUser } from '../types/MockLogin'

// /mock-login อยู่นอก /api (ไม่ผ่าน JWT middleware) จึงต้องตัด /api ท้าย VITE_API_URL ออก
export const mockLoginBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(
    /\/api\/?$/,
    '',
)

export async function searchMockLoginUsers(
    query: string,
): Promise<MockLoginUser[]> {
    const response = await axios.get<MockLoginUser[]>(
        `${mockLoginBaseUrl}/mock-login/search`,
        { params: { q: query } },
    )

    return response.data
}

export function mockLoginRedirectUrl(nontriId: string, asAdmin: boolean) {
    return `${mockLoginBaseUrl}/mock-login/teacher/${nontriId}${
        asAdmin ? '?admin=1' : ''
    }`
}
