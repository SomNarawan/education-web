import React, {
    useCallback,
    createContext,
    useEffect,
    useState,
    useRef,
} from 'react'
import api from '../config/axios'
import { message } from 'antd'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    AppRole,
    AuthUser,
    MeResponse,
} from '../types/Auth'
import {
    appAllowedRoles,
    isRoleAllowedInApp,
} from '../config/appMode'
import {
    authProvider,
    clearStoredAuth,
    portalLogoutUrl,
} from '../config/auth'
import { logout as logoutRequest } from '../services/authService'

type AuthContextType = {
    token: string | null
    user: AuthUser | null
    currentRole: AppRole | null
    loginWithToken: (token: string) => Promise<void>
    // The user signs out: ends the session on the server too.
    logout: () => Promise<void>
    // The server already ended the session (401): forget it locally.
    clearSession: () => void
    setCurrentRole: (role: AppRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseStoredUser(value: string | null): AuthUser | null {
    if (!value) {
        return null
    }

    try {
        const parsed: unknown = JSON.parse(value)

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            !('roles' in parsed) ||
            !Array.isArray(parsed.roles)
        ) {
            return null
        }

        const storedUser = parsed as AuthUser

        if (
            storedUser.roles.includes('student') &&
            !storedUser.studentCode
        ) {
            return {
                ...storedUser,
                studentCode: storedUser.teacherId,
            }
        }

        return storedUser
    } catch {
        return null
    }
}

function getStoredRole(): AppRole | null {
    const role = localStorage.getItem('current_role')
    if (role !== 'admin' && role !== 'teacher' && role !== 'student') {
        return null
    }

    return isRoleAllowedInApp(role) ? role : null
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('auth_token')
    })

    const [user, setUser] = useState<AuthUser | null>(() =>
        parseStoredUser(localStorage.getItem('auth_user')),
    )

    const [currentRole, setCurrentRoleState] = useState<AppRole | null>(
        getStoredRole,
    )

    const fetchingRef = useRef(false)

    useEffect(() => {
        if (!token || fetchingRef.current) return

        let cancelled = false
        fetchingRef.current = true

        api.get<ApiResponse<MeResponse>>('/me')
            .then((res) => {
                if (cancelled) return

                const payload = res.data.data
                const roles = payload.role
                const availableRoles = roles.filter(isRoleAllowedInApp)
                const teacherId = payload.nontri_id
                const name = payload.name ?? undefined
                const studentCode = roles.includes('student')
                    ? payload.nontri_id
                    : null
                const studyPlanId =
                    payload.study_plan_id === null
                        ? null
                        : Number(payload.study_plan_id)

                const departmentId = payload.department_id ?? null

                const facultyId = payload.faculty_id ?? null

                const authUser: AuthUser = {
                    teacherId,
                    studentCode,
                    studyPlanId,
                    name,
                    roles,
                    departmentId: departmentId ? Number(departmentId) : null,
                    facultyId: facultyId ? Number(facultyId) : null,
                }

                setUser(authUser)
                localStorage.setItem('auth_user', JSON.stringify(authUser))

                const storedRole = getStoredRole()
                const responseRole = payload.current_role

                // A role picked in the header menu wins; right after login there
                // is none, so the role the user clicked in ENG Main (current_role)
                // applies.
                const roleToSet =
                    (storedRole && availableRoles.includes(storedRole)
                        ? storedRole
                        : null) ??
                    (responseRole && availableRoles.includes(responseRole)
                        ? responseRole
                        : null) ??
                    (availableRoles.includes('admin') ? 'admin' : null) ??
                    availableRoles[0]

                if (roleToSet) {
                    setCurrentRoleState(roleToSet)
                    localStorage.setItem('current_role', roleToSet)
                } else {
                    setCurrentRoleState(null)
                    localStorage.removeItem('current_role')
                }
            })
            .catch((err) => {
                if (cancelled) return

                console.error(err)
                message.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')

                setToken(null)
                setUser(null)
                setCurrentRoleState(null)

                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                localStorage.removeItem('current_role')
            })
            .finally(() => {
                fetchingRef.current = false
            })

        return () => {
            cancelled = true
            fetchingRef.current = false
        }
    }, [token])

    const loginWithToken = useCallback(async (t: string) => {
        setUser(null)
        setCurrentRoleState(null)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('current_role')

        setToken(t)
        localStorage.setItem('auth_token', t)
    }, [])

    const clearSession = useCallback(() => {
        setToken(null)
        setUser(null)
        setCurrentRoleState(null)

        clearStoredAuth()
    }, [])

    const logout = useCallback(async () => {
        // Sent while auth_token is still stored; failing is fine, the session
        // will not be used again either way.
        await logoutRequest().catch(() => undefined)

        if (authProvider === 'portal') {
            // Leaving the app, so only storage is cleared: clearing the state
            // would let RoleRedirect send the page to the login URL instead.
            clearStoredAuth()
            window.location.assign(portalLogoutUrl)
            return
        }

        clearSession()
    }, [clearSession])

    const setCurrentRole = useCallback((role: AppRole) => {
        if (!appAllowedRoles.includes(role)) return

        setCurrentRoleState(role)
        localStorage.setItem('current_role', role)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                currentRole,
                loginWithToken,
                logout,
                clearSession,
                setCurrentRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
