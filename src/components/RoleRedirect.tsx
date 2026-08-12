import { Link, Navigate } from 'react-router-dom'
import { Button, Spin, Typography } from 'antd'
import { useAuth } from '../hooks/useAuth'

export default function RoleRedirect() {
    const { token, currentRole } = useAuth()

    // ยังไม่ login — แสดงข้อความแทนการ navigate วนไปมากับ /auth/callback
    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Typography.Paragraph>
                    ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบผ่านระบบ SSO
                </Typography.Paragraph>

                {import.meta.env.VITE_MOCK_LOGIN_ENABLED === 'true' && (
                    <Link to="/mock-login">
                        <Button type="primary">Mock Login (Dev)</Button>
                    </Link>
                )}
            </div>
        )
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
