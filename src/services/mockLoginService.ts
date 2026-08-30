import axios from 'axios'
import type { MockLoginUser } from '../types/MockLogin'

export const mockLoginBaseUrl = import.meta.env.VITE_API_URL ?? ''

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
    return `${mockLoginBaseUrl}/mock-login/system-teacher/${encodeURIComponent(nontriId)}${
        asAdmin ? '?admin=1' : ''
    }`
}
