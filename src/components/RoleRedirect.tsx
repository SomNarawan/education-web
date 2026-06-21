import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRedirect() {
    const { token, currentRole } = useAuth()

    // ยังไม่ login
    if (!token) {
        return <Navigate to="/auth/callback" replace />
    }

    // teacher
    if (currentRole === 'teacher') {
        return <Navigate to="/students/advisor" replace />
    }

    // admin
    if (currentRole === 'admin') {
        return <Navigate to="/students/department" replace />
    }

    // fallback
    return <Navigate to="/students/advisor" replace />
}