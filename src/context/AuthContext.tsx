import React, {
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
    name?: string
    roles: string[]
    departmentId?: number | null
    facultyId?: number | null
}

type AuthContextType = {
    token: string | null
    user: User | null
    currentRole: string | null
    departmentId: number | null
    facultyId: number | null
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

    const [user, setUser] = useState<User | null>(null)

    const [currentRole, setCurrentRoleState] = useState<string | null>(() => {
        return localStorage.getItem('current_role')
    })

    const [departmentId, setDepartmentId] = useState<number | null>(() => {
        const value = localStorage.getItem('department_id')
        return value ? Number(value) : null
    })

    const [facultyId, setFacultyId] = useState<number | null>(() => {
        const value = localStorage.getItem('faculty_id')
        return value ? Number(value) : null
    })

    const fetchingRef = useRef(false)

    useEffect(() => {
        if (!token || fetchingRef.current) return

        let cancelled = false
        fetchingRef.current = true
        setAuthToken(token)

        api
            .get('/me')
            .then((res) => {
                if (cancelled) return

                const payload = res.data?.data ?? res.data

                const roles = payload.role ?? payload.roles ?? []
                const id = payload.nontri_id ?? payload.id
                const name = payload.name

                const departmentIdFromPayload =
                    payload.department_id ??
                    payload.departmentId ??
                    payload.department?.id ??
                    null

                const facultyIdFromPayload =
                    payload.faculty_id ??
                    payload.facultyId ??
                    payload.faculty?.id ??
                    payload.department?.faculty_id ??
                    payload.department?.facultyId ??
                    payload.department?.faculty?.id ??
                    null

                setUser({
                    roles,
                    id,
                    name,
                    departmentId: departmentIdFromPayload,
                    facultyId: facultyIdFromPayload,
                })

                if (departmentIdFromPayload) {
                    setDepartmentId(Number(departmentIdFromPayload))
                    localStorage.setItem(
                        'department_id',
                        String(departmentIdFromPayload),
                    )
                } else {
                    setDepartmentId(null)
                    localStorage.removeItem('department_id')
                }

                if (facultyIdFromPayload) {
                    setFacultyId(Number(facultyIdFromPayload))
                    localStorage.setItem(
                        'faculty_id',
                        String(facultyIdFromPayload),
                    )
                } else {
                    setFacultyId(null)
                    localStorage.removeItem('faculty_id')
                }

                const roleToSet =
                    payload.current_role ??
                    payload.currentRole ??
                    payload.currenct_role ??
                    payload.currenctRole ??
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
                setDepartmentId(null)
                setFacultyId(null)

                localStorage.removeItem('auth_token')
                localStorage.removeItem('current_role')
                localStorage.removeItem('department_id')
                localStorage.removeItem('faculty_id')

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

    const loginWithToken = async (t: string) => {
        setToken(t)
        localStorage.setItem('auth_token', t)
        setAuthToken(t)
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        setCurrentRoleState(null)
        setDepartmentId(null)
        setFacultyId(null)

        localStorage.removeItem('auth_token')
        localStorage.removeItem('current_role')
        localStorage.removeItem('department_id')
        localStorage.removeItem('faculty_id')

        setAuthToken(null)
    }

    const setCurrentRole = (role: string) => {
        setCurrentRoleState(role)
        localStorage.setItem('current_role', role)
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                currentRole,
                departmentId,
                facultyId,
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