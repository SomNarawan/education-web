import { Button, Card, Input, List, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
    mockStudentLoginRedirectUrl,
    searchMockLoginStudents,
} from '../../services/mockLoginService'
import type { MockLoginStudent } from '../../types/MockLogin'

export default function StudentMockLoginPage() {
    const { currentRole, user } = useAuth()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MockLoginStudent[]>([])
    const [loading, setLoading] = useState(false)

    if (currentRole === 'student' && user?.roles.includes('student')) {
        return <Navigate to="/student/home" replace />
    }

    const handleSearch = async (value: string) => {
        const normalizedQuery = value.trim()

        if (!normalizedQuery) {
            setResults([])
            return
        }

        setLoading(true)

        try {
            setResults(await searchMockLoginStudents(normalizedQuery))
        } catch (error) {
            console.error(error)
            message.error('ค้นหาผู้ใช้ไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = (student: MockLoginStudent) => {
        window.location.assign(
            mockStudentLoginRedirectUrl(student.student_code),
        )
    }

    return (
        <div style={{ maxWidth: 520, margin: '60px auto', padding: 24 }}>
            <Card title="Mock Login (Dev)">
                <Typography.Paragraph type="secondary">
                    ค้นหานิสิตด้วยรหัสนิสิตหรือชื่อ แล้วเลือกเข้าสู่ระบบด้วยบัญชีนั้น
                </Typography.Paragraph>

                <Input.Search
                    placeholder="รหัสนิสิต หรือ ชื่อ"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onSearch={handleSearch}
                    loading={loading}
                    allowClear
                />

                <List
                    style={{ marginTop: 16 }}
                    dataSource={results}
                    locale={{ emptyText: 'ไม่พบนิสิต' }}
                    renderItem={(student) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="login"
                                    type="link"
                                    onClick={() => handleLogin(student)}
                                >
                                    เข้าสู่ระบบ
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <>
                                        {student.full_name_th}{' '}
                                        <Tag color="blue">student</Tag>
                                    </>
                                }
                                description={`รหัสนิสิต: ${student.student_code} · ภาควิชา: ${
                                    student.department_name ?? '-'
                                }`}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    )
}
