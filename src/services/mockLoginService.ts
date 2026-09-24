import api from '../config/axios'
import type { MockLoginUser } from '../types/MockLogin'

export const mockLoginBaseUrl = import.meta.env.VITE_API_URL ?? ''

export async function searchMockLoginUsers(
    query: string,
): Promise<MockLoginUser[]> {
    const response = await api.get<MockLoginUser[]>(
        '/mock-login/search',
        { params: { q: query } },
    )

    return response.data
}

export function mockLoginRedirectUrl(nontriId: string, asAdmin: boolean) {
    return `${mockLoginBaseUrl}/mock-login/system-teacher/${encodeURIComponent(nontriId)}${
        asAdmin ? '?admin=1' : ''
    }`
}
