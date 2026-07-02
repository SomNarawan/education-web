import React, {
    useCallback,
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from 'react'
import api, { setAuthToken } from '../config/axios'
import { message } from 'antd'

type User = {
    id?: number
    nontriId?: number | string | null
    teacherId?: number | null
    name?: string
    roles: string[]
    departmentId?: number | null
    facultyId?: number | null
}

type AuthContextType = {
    token: string | null
    user: User | null
    currentRole: string | null
    loginWithToken: (token: string) => Promise<void>
    logout: () => void
    setCurrentRole: (role: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({
    children,
}) => {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('auth_token')
    })

    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('auth_user')
        return storedUser ? JSON.parse(storedUser) : null
    })

    const [currentRole, setCurrentRoleState] = useState<string | null>(() => {
        return localStorage.getItem('current_role')
    })

    const fetchingRef = useRef(false)

    useEffect(() => {
        if (!token || fetchingRef.current) return

        let cancelled = false
        fetchingRef.current = true
        setAuthToken(token)

        api.get('/me')
            .then((res) => {
                if (cancelled) return

                const payload = res.data?.data ?? res.data

                const roles = payload.role ?? []
                const id = payload.id ?? payload.nontri_id
                const nontriId = payload.nontri_id ?? null
                const teacherId = payload.teacher_id ?? null
                const name = payload.name

                const departmentId = payload.department_id ?? null

                const facultyId = payload.faculty_id ?? null

                const authUser: User = {
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

                const storedRole = localStorage.getItem('current_role')
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

                setAuthToken(null)
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
        setAuthToken(t)
    }, [])

    const logout = useCallback(() => {
        setToken(null)
        setUser(null)
        setCurrentRoleState(null)

        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('current_role')

        setAuthToken(null)
    }, [])

    const setCurrentRole = useCallback((role: string) => {
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

export function useAuth() {
    const ctx = useContext(AuthContext)

    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider')
    }

    return ctx
}

export default AuthContext