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
                <Button onClick={() => navigate('/students')}>กลับ</Button>
            </Card>
        )
    }

    const requiredCredits = student?.required_credits ?? 0
    const earnedCredits = student?.earned_credits ?? 0
    const remainingCredits = Math.max(requiredCredits - earnedCredits, 0)

    const fullNameTh = student
        ? `${student.title?.title_name_th ?? ''} ${student.first_name_th} ${student.last_name_th}`.trim()
        : '-'

    const fullNameEn = student
        ? `${student.title?.title_name_en ?? ''} ${student.first_name_en} ${student.last_name_en}`.trim()
        : '-'

    const teacherName = student?.teacher
        ? `${student.teacher?.title?.title_name_th ?? ''} ${student.teacher.first_name_th} ${student.teacher.last_name_th}`
        : '-'

    const teacherNameEn = student?.teacher
        ? `${student.teacher?.title?.title_name_en ?? ''} ${student.teacher.first_name_en} ${student.teacher.last_name_en}`
        : '-'

    return (
        <Card
            title="รายละเอียดนิสิต"
            extra={
                <Button onClick={() => navigate('/students')}>
                    กลับ
                </Button>
            }
        >
            <Skeleton loading={loading} active paragraph={{ rows: 18 }}>
                {student && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="รหัสนิสิต">
                            {student.student_code}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อ-นามสกุล">
                            {fullNameTh || '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อภาษาอังกฤษ">
                            {fullNameEn || '-'}
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

                        <Descriptions.Item label="สถานะนิสิต">
                            {student.student_status?.status_name ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ช่องทางรับเข้า">
                            {student.admission_channel?.channel_name ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="โรงเรียนเดิม">
                            {student.high_school?.school_name ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="อาจารย์ที่ปรึกษา">
                            {teacherName}
                        </Descriptions.Item>

                        <Descriptions.Item label="อาจารย์ที่ปรึกษา ภาษาอังกฤษ">
                            {teacherNameEn}
                        </Descriptions.Item>

                        <Descriptions.Item label="สังกัด">
                            {student.affiliation?.affiliation_name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="วิทยาเขต">
                            {student.campus?.campus_name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="คณะ">
                            {student.faculty?.faculty_name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ภาควิชา">
                            {student.department?.department_name ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="GPAX">
                            {student.gpa ? Number(student.gpa).toFixed(2) : '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ประเภทหลักสูตร">
                            {student.curriculum?.degree_short_name_th ??
                                student.study_plan?.curriculum?.degree_short_name_th ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="แผนการเรียน">
                            {student.study_plan?.name_th ?? '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="หลักสูตร">
                            {student.curriculum?.name_th ??
                                student.study_plan?.curriculum?.name_th ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อหลักสูตรที่แสดง">
                            {student.curriculum?.display_name_th ??
                                student.study_plan?.curriculum?.display_name_th ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="ชื่อปริญญา">
                            {student.curriculum?.degree_name_th ??
                                student.study_plan?.curriculum?.degree_name_th ??
                                '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="รหัสหลักสูตร">
                            {student.curriculum?.curriculum_code ??
                                student.study_plan?.curriculum?.curriculum_code ??
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
                    </Descriptions>
                )}
            </Skeleton>
        </Card>
    )
}