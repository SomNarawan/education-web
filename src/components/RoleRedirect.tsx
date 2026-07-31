import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'

export default function RoleRedirect() {
    const { token, currentRole } = useAuth()

    // ยังไม่ login
    if (!token) {
        return <Navigate to="/auth/callback" replace />
    }

    // รอให้ /me โหลดข้อมูลและกำหนด role ก่อน redirect
    if (!currentRole) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: 60,
                }}
            >
                <Spin size="large" />
            </div>
        )
    }

    // teacher
    if (currentRole === 'teacher') {
        return <Navigate to="/students/advisor" replace />
    }

    // admin
    if (currentRole === 'admin') {
        return <Navigate to="/students/department" replace />
    }

    // role ที่ระบบไม่รองรับ
    return null
}
