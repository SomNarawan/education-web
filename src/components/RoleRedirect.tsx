import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Alert, Button, Spin, Typography } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { checkBackendConnectivity } from '../utils/backendConnectivity'

export default function RoleRedirect() {
    const { token, currentRole } = useAuth()
    const [connectionError, setConnectionError] = useState<string | null>(
        null,
    )

    // เช็คว่า FE คุยกับ BE รอดหรือไม่ ก่อนให้ผู้ใช้กด login — log ผลลง console เสมอ
    // และถ้าเชื่อมต่อไม่ได้จะโชว์เหตุผลบนหน้าจอด้วย
    useEffect(() => {
        if (token) return

        let cancelled = false

        checkBackendConnectivity().then((result) => {
            if (cancelled) return
            setConnectionError(result.ok ? null : result.message)
        })

        return () => {
            cancelled = true
        }
    }, [token])

    // ยังไม่ login — แสดงข้อความแทนการ navigate วนไปมากับ /auth/callback
    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                {connectionError && (
                    <Alert
                        type="error"
                        showIcon
                        message="เชื่อมต่อกับ backend ไม่สำเร็จ"
                        description={connectionError}
                        style={{
                            maxWidth: 640,
                            margin: '0 auto 24px',
                            textAlign: 'left',
                        }}
                    />
                )}

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
