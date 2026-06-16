import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Skeleton,
    Typography,
    message,
} from 'antd'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'
import { getStudentDetail } from '../services/studentService'
import { createNote } from '../services/noteService'

const { Text } = Typography
const { TextArea } = Input

function DetailItem({
    label,
    value,
}: {
    label: string
    value?: ReactNode
}) {
    return (
        <Row style={{ marginBottom: 18 }}>
            <Col span={10}>
                <Text strong style={{ color: '#000000' }}>
                    {label} :
                </Text>
            </Col>
            <Col span={14}>
                <Text>{value || '-'}</Text>
            </Col>
        </Row>
    )
}

export default function StudentDetail() {
    const { id } = useParams()

    const [student, setStudent] = useState<StudentDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)

    const [note, setNote] = useState('')
    const [savingNote, setSavingNote] = useState(false)

    useEffect(() => {
        loadStudent()
    }, [id])

    const loadStudent = async () => {
        try {
            setLoading(true)

            const studentId = Number(id)

            if (!id || Number.isNaN(studentId)) {
                message.error('รหัสนิสิตไม่ถูกต้อง')
                setStudent(null)
                return
            }

            const student = await getStudentDetail(studentId)
            setStudent(student)
        } catch (error) {
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
            setStudent(null)
        } finally {
            setLoading(false)
        }
    }

    const handleAddNote = async () => {
        try {
            if (!student?.id) {
                message.error('ไม่พบข้อมูลนิสิต')
                return
            }

            if (!note.trim()) {
                message.warning('กรุณากรอกหมายเหตุ')
                return
            }

            setSavingNote(true)

            await createNote({
                student_id: student.id,
                note: note.trim(),
            })

            message.success('บันทึกหมายเหตุสำเร็จ')
            setNote('')
        } catch (error) {
            message.error('บันทึกหมายเหตุไม่สำเร็จ')
        } finally {
            setSavingNote(false)
        }
    }

    return (
        <Card
            title={
                student
                    ? `${student.student_code} ${student.full_name_th}`
                    : ''
            }
        >
            <Skeleton loading={loading} active paragraph={{ rows: 16 }}>
                {student && (
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card title="ข้อมูลนิสิต" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ชื่อ-นามสกุล ภาษาอังกฤษ"
                                            value={student.full_name_en}
                                        />
                                        <DetailItem
                                            label="เบอร์โทรศัพท์"
                                            value={student.phone}
                                        />
                                        <DetailItem
                                            label="อีเมล"
                                            value={student.email}
                                        />
                                        <DetailItem
                                            label="ปีเข้าเรียน"
                                            value={`${student.entry_year_ad}/${student.entry_year_be}`}
                                        />
                                        <DetailItem
                                            label="อาจารย์ที่ปรึกษา"
                                            value={student.teacher_full_name_th}
                                        />
                                        <DetailItem
                                            label="GPA"
                                            value={student.gpa}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ชื่อผู้ปกครอง"
                                            value={student.guardian_full_name}
                                        />
                                        <DetailItem
                                            label="ความสัมพันธ์"
                                            value={
                                                student.guardian_relationship_name
                                            }
                                        />
                                        <DetailItem
                                            label="เบอร์โทรศัพท์ผู้ปกครอง"
                                            value={student.guardian_phone}
                                        />
                                        <DetailItem
                                            label="สถานะนิสิต"
                                            value={student.student_status_name}
                                        />
                                        <DetailItem
                                            label="ช่องทางการรับเข้า"
                                            value={
                                                student.admission_channel_name
                                            }
                                        />
                                        <DetailItem
                                            label="หน่วยกิตที่ลงทะเบียน (ทั้งหมด/ผ่าน/ไม่ผ่าน/เกิน)"
                                            value={`${student.required_credits}/${student.passed_credits}/${student.not_passed_credits}/${student.overed_credits}`}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="ข้อมูลโรงเรียนเดิม" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="โรงเรียนเดิม"
                                            value={student.high_school_name}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ที่อยู่โรงเรียน"
                                            value={student.high_school_address}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="ข้อมูลหลักสูตร" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ประเภทหลักสูตร"
                                            value={student.curriculum_type}
                                        />
                                        <DetailItem
                                            label="แผนการเรียน"
                                            value={student.study_plan_name}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ภาควิชา"
                                            value={student.department_name}
                                        />
                                        <DetailItem
                                            label="คณะ"
                                            value={student.faculty_name}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="Note" size="small">
                                <TextArea
                                    rows={4}
                                    maxLength={255}
                                    showCount
                                    placeholder="กรอก Note"
                                    value={note}
                                    onChange={(e) =>
                                        setNote(e.target.value)
                                    }
                                />

                                <div
                                    style={{
                                        marginTop: 16,
                                        textAlign: 'right',
                                    }}
                                >
                                    <Button
                                        type="primary"
                                        onClick={handleAddNote}
                                        loading={savingNote}
                                    >
                                        เพิ่ม Note
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Skeleton>
        </Card>
    )
}