import { Button, Card, Descriptions, Empty, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Student } from '../types/student'
import { getStudentDetail } from '../services/studentService'

export default function StudentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadStudent()
    }, [id])

    const loadStudent = async () => {
        try {
            setLoading(true)

            const students = await getStudentDetail()

            const foundStudent = students.find(
                (item) => item.id === Number(id),
            )

            setStudent(foundStudent ?? null)
        } catch (error) {
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    if (!loading && !student) {
        return (
            <Card>
                <Empty description="ไม่พบข้อมูลนิสิต" />
                <Button onClick={() => navigate('/students')}>
                    กลับ
                </Button>
            </Card>
        )
    }

    const requiredCredits = student?.required_credits ?? 0
    const earnedCredits = student?.earned_credits ?? 0
    const remainingCredits = Math.max(requiredCredits - earnedCredits, 0)

    return (
        <Card
            title="รายละเอียดนิสิต"
            extra={
                <Button onClick={() => navigate('/students')}>
                    กลับ
                </Button>
            }
        >
            <Skeleton loading={loading} active paragraph={{ rows: 12 }}>
                {student && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="รหัสนิสิต">
                            {student.student_code}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อ-นามสกุล">
                            {student.first_name_th} {student.last_name_th}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อภาษาอังกฤษ">
                            {student.first_name_en} {student.last_name_en}
                        </Descriptions.Item>

                        <Descriptions.Item label="เบอร์โทร">
                            {student.phone || '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="อีเมล">
                            {student.email || '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ปีเข้าเรียน">
                            {student.entry_year}
                        </Descriptions.Item>

                        <Descriptions.Item label="GPAX">
                            {student.gpa ? Number(student.gpa).toFixed(2) : '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ประเภทหลักสูตร">
                            {student.study_plan?.curriculum
                                ?.degree_short_name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="แผนการเรียน">
                            {student.study_plan?.name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="หลักสูตร">
                            {student.study_plan?.curriculum?.name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อปริญญา">
                            {student.study_plan?.curriculum?.degree_name_th ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="รหัสหลักสูตร">
                            {student.study_plan?.curriculum?.curriculum_code ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="หน่วยกิตทั้งหมด">
                            {requiredCredits}
                        </Descriptions.Item>

                        <Descriptions.Item label="หน่วยกิตที่ผ่าน">
                            {earnedCredits}
                        </Descriptions.Item>

                        <Descriptions.Item label="หน่วยกิตคงเหลือ">
                            {remainingCredits}
                        </Descriptions.Item>

                        <Descriptions.Item label="Title ID">
                            {student.title_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Teacher ID">
                            {student.teacher_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Student Status ID">
                            {student.student_status_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Admission Channel ID">
                            {student.admission_channel_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="High School ID">
                            {student.high_school_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Affiliation ID">
                            {student.affiliation_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Study Plan ID">
                            {student.study_plan_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Curriculum ID">
                            {student.curriculum_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Department ID">
                            {student.department_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Faculty ID">
                            {student.faculty_id}
                        </Descriptions.Item>

                        <Descriptions.Item label="Campus ID">
                            {student.campus_id}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Skeleton>
        </Card>
    )
}