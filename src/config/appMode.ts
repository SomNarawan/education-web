import type { AppRole } from '../types/Auth'

export type AppMode = 'staff' | 'student'

export const appMode: AppMode =
    import.meta.env.VITE_APP_MODE === 'student' ||
    import.meta.env.MODE === 'student'
        ? 'student'
        : 'staff'

export const appAllowedRoles: AppRole[] =
    appMode === 'student' ? ['student'] : ['admin', 'teacher']

export function isRoleAllowedInApp(role: AppRole): boolean {
    return appAllowedRoles.includes(role)
}

export function getDefaultRouteForRole(role: AppRole): string {
    if (role === 'student') return '/student/home'
    if (role === 'teacher') return '/students/advisor'
    return '/students/department'
}
