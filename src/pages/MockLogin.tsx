import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Card, Input, List, Tag, Typography, message } from 'antd'
import {
    mockLoginRedirectUrl,
    searchMockLoginUsers,
} from '../services/mockLoginService'
import type { MockLoginUser } from '../types/MockLogin'

export default function MockLoginPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MockLoginUser[]>([])
    const [loading, setLoading] = useState(false)

    // เฉพาะ dev/staging — ต้อง build ด้วย VITE_MOCK_LOGIN_ENABLED=true เท่านั้น ห้ามใช้ในโปรดักชัน
    if (import.meta.env.VITE_MOCK_LOGIN_ENABLED !== 'true') {
        return <Navigate to="/" replace />
    }

    const handleSearch = async (value: string) => {
        const q = value.trim()

        if (!q) {
            setResults([])
            return
        }

        setLoading(true)

        try {
            setResults(await searchMockLoginUsers(q))
        } catch (err) {
            console.error(err)
            message.error('ค้นหาผู้ใช้ไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    const loginAs = (user: MockLoginUser, asAdmin: boolean) => {
        window.location.assign(mockLoginRedirectUrl(user.nontri_id, asAdmin))
    }

    return (
        <div style={{ maxWidth: 520, margin: '60px auto', padding: 24 }}>
            <Card title="Mock Login (Dev)">
                <Typography.Paragraph type="secondary">
                    ค้นหาผู้ใช้ด้วยรหัสนนทรีหรือชื่อ แล้วเลือกเข้าสู่ระบบด้วยบัญชีนั้น
                </Typography.Paragraph>

                <Input.Search
                    placeholder="รหัสนนทรี หรือ ชื่อ"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onSearch={handleSearch}
                    loading={loading}
                    allowClear
                />

                <List
                    style={{ marginTop: 16 }}
                    dataSource={results}
                    locale={{ emptyText: 'ไม่พบผู้ใช้' }}
                    renderItem={(user) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="login"
                                    type="link"
                                    onClick={() => loginAs(user, false)}
                                >
                                    เข้าสู่ระบบ
                                </Button>,
                                ...(!user.is_admin
                                    ? [
                                          <Button
                                              key="login-admin"
                                              type="link"
                                              onClick={() =>
                                                  loginAs(user, true)
                                              }
                                          >
                                              เข้าสู่ระบบ (+admin)
                                          </Button>,
                                      ]
                                    : []),
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <>
                                        {user.full_name_th}{' '}
                                        {user.is_admin && (
                                            <Tag color="gold">admin</Tag>
                                        )}
                                    </>
                                }
                                description={`รหัสนนทรี: ${user.nontri_id} · ภาควิชา: ${
                                    user.department_id ?? '-'
                                }`}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    )
}
