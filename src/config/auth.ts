export type AuthProvider = 'mock' | 'portal'

// Anything but an explicit "mock" means the portal, so a build that forgets
// the variable cannot fall back to mock login.
export const authProvider: AuthProvider =
    import.meta.env.VITE_AUTH_PROVIDER === 'mock' ? 'mock' : 'portal'

// ENG Main, where staff pick this system and come back to /auth/portal/:role.
export const portalLoginUrl: string =
    import.meta.env.VITE_PORTAL_LOGIN_URL ||
    'https://office.eng.kps.ku.ac.th/eng-main/home'

export const portalLogoutUrl: string =
    import.meta.env.VITE_PORTAL_LOGOUT_URL || portalLoginUrl

export function clearStoredAuth(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('current_role')
}
