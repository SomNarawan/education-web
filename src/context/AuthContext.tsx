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
import type { AppRole, AuthUser, MeResponse } from '../types/Auth'

type AuthContextType = {
    token: string | null
    user: AuthUser | null
    currentRole: AppRole | null
    loginWithToken: (token: string) => Promise<void>
    logout: () => void
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

        return parsed as AuthUser
    } catch {
        return null
    }
}

function getStoredRole(): AppRole | null {
    const role = localStorage.getItem('current_role')
    return role === 'admin' || role === 'teacher' ? role : null
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

        api.get<ApiResponse<MeResponse> | MeResponse>('/me')
            .then((res) => {
                if (cancelled) return

                const response = res.data
                const payload =
                    'data' in response ? response.data : response

                const roles = payload.role ?? []
                const rawId = payload.id ?? payload.nontri_id
                const id = rawId == null ? undefined : Number(rawId)
                const nontriId = payload.nontri_id ?? null
                const teacherId = payload.teacher_id ?? null
                const name = payload.name

                const departmentId = payload.department_id ?? null

                const facultyId = payload.faculty_id ?? null

                const authUser: AuthUser = {
                    id,
                    nontriId,
                    teacherId: teacherId ? Number(teacherId) : null,
                    name,
                    roles,
                    departmentId: departmentId ? Number(departmentId) : null,
                    facultyId: facultyId ? Number(facultyId) : null,
                }

                setUser(authUser)
                localStorage.setItem('auth_user', JSON.stringify(authUser))

                const storedRole = getStoredRole()
                const responseRole = payload.current_role

                const roleToSet =
                    (storedRole && roles.includes(storedRole)
                        ? storedRole
                        : null) ??
                    (roles.includes('admin') ? 'admin' : null) ??
                    (responseRole && roles.includes(responseRole)
                        ? responseRole
                        : null) ??
                    roles[0]

                if (roleToSet) {
                    setCurrentRoleState(roleToSet)
                    localStorage.setItem('current_role', roleToSet)
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

    const logout = useCallback(() => {
        setToken(null)
        setUser(null)
        setCurrentRoleState(null)

        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('current_role')
    }, [])

    const setCurrentRole = useCallback((role: AppRole) => {
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
                setCurrentRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
