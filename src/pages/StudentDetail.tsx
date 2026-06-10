import { Button, Card, Col, Empty, Row, Skeleton, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Student } from '../types/student'
import { getStudentDetail } from '../services/studentService'

const { Text } = Typography

function DetailItem({
    label,
    value,
}: {
    label: string
    value?: React.ReactNode
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
        ? `${student.teacher.title?.title_name_th ?? ''} ${student.teacher.first_name_th} ${student.teacher.last_name_th}`.trim()
        : '-'

    const guardianName = student
        ? `${student.guardian_title?.title_name_th ?? ''} ${student.guardian_first_name_th ?? ''} ${student.guardian_last_name_th ?? ''}`.trim()
        : '-'

    const provinceName =
        student?.high_school?.subdistrict?.district?.province?.province_name

    const districtName =
        student?.high_school?.subdistrict?.district?.district_name

    const subdistrictName =
        student?.high_school?.subdistrict?.subdistrict_name

    const postalCode =
        student?.high_school?.subdistrict?.postal_code

    const addressSchool =
        provinceName === 'กรุงเทพมหานคร'
            ? `แขวง${subdistrictName ?? '-'} ${districtName ?? '-'} ${provinceName} ${postalCode ?? '-'}`
            : `ตำบล${subdistrictName ?? '-'} อำเภอ${districtName ?? '-'} จังหวัด${provinceName ?? '-'} ${postalCode ?? '-'}`

    const curriculum =
        student?.study_plan?.curriculum ?? student?.curriculum

    return (
        <Card
            title={
                student
                    ? `${student.student_code} ${fullNameTh}`
                    : 'รายละเอียดนิสิต'
            }
            extra={
                <Button onClick={() => navigate('/students')}>
                    กลับ
                </Button>
            }
        >
            <Skeleton loading={loading} active paragraph={{ rows: 16 }}>
                {student && (
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card title="ข้อมูลส่วนตัว" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem label="รหัสนิสิต" value={student.student_code} />
                                        <DetailItem label="ชื่อ-นามสกุล ภาษาไทย" value={fullNameTh} />
                                        <DetailItem label="ชื่อ-นามสกุล ภาษาอังกฤษ" value={fullNameEn} />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem label="เบอร์โทรศัพท์" value={student.phone} />
                                        <DetailItem label="e-Mail" value={student.email} />
                                        <DetailItem label="สถานะนิสิต" value={student.student_status?.status_name} />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="ข้อมูลผู้ปกครอง" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem label="ชื่อผู้ปกครอง" value={guardianName} />
                                        <DetailItem
                                            label="ความสัมพันธ์กับนิสิต"
                                            value={student.guardian_relationship?.relationship_name}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="เบอร์โทรศัพท์ผู้ปกครอง"
                                            value={student.guardian_phone}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="ข้อมูลการศึกษา" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem label="ปีเข้าเรียน" value={student.entry_year} />
                                        <DetailItem label="ช่องทางรับเข้า" value={student.admission_channel?.channel_name} />
                                        <DetailItem label="อาจารย์ที่ปรึกษา" value={teacherName} />
                                        <DetailItem label="เบอร์โทรอาจารย์ที่ปรึกษา" value={student.teacher?.phone} />
                                        <DetailItem label="อีเมลอาจารย์ที่ปรึกษา" value={student.teacher?.email} />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem label="สังกัด" value={student.affiliation?.affiliation_name_th} />
                                        <DetailItem label="คณะ" value={student.faculty?.faculty_name_th} />
                                        <DetailItem label="ภาควิชา" value={student.department?.department_name} />
                                        <DetailItem label="วิทยาเขต" value={student.campus?.campus_name_th} />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="หลักสูตร"
                                            value={
                                                curriculum?.display_name_th ??
                                                curriculum?.name_th
                                            }
                                        />
                                        <DetailItem
                                            label="แผนการเรียน"
                                            value={student.study_plan?.name_th}
                                        />
                                        <DetailItem
                                            label="ชื่อปริญญา"
                                            value={curriculum?.degree_name_th}
                                        />
                                        <DetailItem
                                            label="ชื่อย่อปริญญา"
                                            value={curriculum?.degree_short_name_th}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="GPAX"
                                            value={student.gpa ? Number(student.gpa).toFixed(2) : '-'}
                                        />
                                        <DetailItem label="หน่วยกิตที่ผ่าน" value={earnedCredits} />
                                        <DetailItem label="หน่วยกิตทั้งหมด" value={requiredCredits} />
                                        <DetailItem label="หน่วยกิตคงเหลือ" value={remainingCredits} />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="ข้อมูลโรงเรียนเดิม" size="small">
                                <Row gutter={[48, 8]}>
                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="โรงเรียนมัธยม"
                                            value={student.high_school?.school_name}
                                        />
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <DetailItem
                                            label="ที่อยู่โรงเรียน"
                                            value={addressSchool}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Skeleton>
        </Card>
    )
}