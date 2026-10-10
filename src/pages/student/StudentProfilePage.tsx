import { EditOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Skeleton, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import StudentContactModal from '../../features/students/profile/StudentContactModal'
import type { StudentContactValues } from '../../features/students/profile/StudentContactModal'
import StudentProfileDetails from '../../features/students/profile/StudentProfileDetails'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'
import {
    getStudentDetailByCode,
    updateStudent,
} from '../../services/studentService'
import type { StudentDetailResponse } from '../../types/StudentDetailResponse'

export default function StudentProfilePage() {
    const { studentCode } = useCurrentStudent()
    const [student, setStudent] = useState<StudentDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    const loadStudent = useCallback(async () => {
        if (!studentCode) {
            setStudent(null)
            setError('ไม่พบรหัสนิสิตจากข้อมูลผู้ใช้')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const data = await getStudentDetailByCode(studentCode)

            if (!data) {
                setStudent(null)
                setError(`ไม่พบข้อมูลนิสิตรหัส ${studentCode}`)
                return
            }

            setStudent(data)
        } catch (loadError) {
            console.error('Unable to load student profile', loadError)
            setStudent(null)
            setError('โหลดข้อมูลส่วนตัวไม่สำเร็จ')
            message.error('โหลดข้อมูลส่วนตัวไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }, [studentCode])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadStudent()
    }, [loadStudent])

    const saveContact = async (values: StudentContactValues) => {
        if (!student) return

        try {
            setSaving(true)
            const updatedStudent = await updateStudent(student.id, {
                phone: values.phone,
                guardian_phone: values.guardianPhone,
            })

            setStudent(updatedStudent)
            setEditing(false)
            message.success('แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว')
        } catch (saveError) {
            console.error('Unable to update student contact', saveError)
            message.error('แก้ไขข้อมูลส่วนตัวไม่สำเร็จ')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="student-page student-profile-page">
            <div className="page-title-section">
                <div>
                    <h1>ข้อมูลส่วนตัว</h1>
                    <p>ตรวจสอบข้อมูลประจำตัว ข้อมูลการศึกษา และข้อมูลผู้ปกครอง</p>
                </div>
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    disabled={!student || loading}
                    onClick={() => setEditing(true)}
                >
                    แก้ไข
                </Button>
            </div>

            {error ? (
                <Alert
                    type="error"
                    showIcon
                    message={error}
                    action={
                        <Button size="small" onClick={() => void loadStudent()}>
                            ลองใหม่
                        </Button>
                    }
                />
            ) : null}

            <Skeleton loading={loading} active paragraph={{ rows: 14 }}>
                {student ? (
                    <StudentProfileDetails student={student} />
                ) : !error ? (
                    <Empty description="ไม่พบข้อมูลนิสิต" />
                ) : null}
            </Skeleton>

            {student ? (
                <StudentContactModal
                    open={editing}
                    saving={saving}
                    phone={student.phone}
                    guardianPhone={student.guardian_phone}
                    onCancel={() => setEditing(false)}
                    onSave={saveContact}
                />
            ) : null}
        </div>
    )
}
