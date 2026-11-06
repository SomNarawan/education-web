import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { PortalLoginResponse, PortalLoginRole } from '../types/Auth'

export async function portalLogin(
    exchangeToken: string,
    intranetToken: string,
    role: PortalLoginRole,
): Promise<PortalLoginResponse> {
    const response = await api.post<ApiResponse<PortalLoginResponse>>(
        '/auth/portal-login',
        { exchangeToken, intranetToken, role },
    )

    return response.data.data
}

// Ends the session in this system only; the portal session stays.
export async function logout(): Promise<void> {
    await api.post('/auth/logout')
}
