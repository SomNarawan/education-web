import {
    EditOutlined,
    IdcardOutlined,
    ReadOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Form,
    Input,
    Modal,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
    message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'
import {
    getStudentDetailByCode,
    updateStudent,
} from '../../services/studentService'
import type { StudentDetailResponse } from '../../types/StudentDetailResponse'

const { Text } = Typography

interface StudentContactFormValues {
    phone?: string
    guardian_phone?: string
}

function displayValue(value: string | number | null | undefined) {
    return value === null || value === undefined || value === '' ? '-' : value
}

function maskStudentIdCard(studentIdCard: string | null) {
    if (!studentIdCard) return '-'
    if (!/^\d{13}$/.test(studentIdCard)) return studentIdCard

    return `${studentIdCard.slice(0, 1)}-${studentIdCard.slice(1, 5)}-xxxxx-xx-${studentIdCard.slice(-1)}`
}

function getCreditSummary(student: StudentDetailResponse) {
    return [
        student.required_credits,
        student.passed_credits,
        student.not_passed_credits,
        student.overed_credits,
    ]
        .map(displayValue)
        .join('/')
}

export default function StudentProfilePage() {
    const { studentCode } = useCurrentStudent()
    const [form] = Form.useForm<StudentContactFormValues>()
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

    const openContactForm = () => {
        if (!student) return

        form.setFieldsValue({
            phone: student.phone ?? undefined,
            guardian_phone: student.guardian_phone ?? undefined,
        })
        setEditing(true)
    }

    const saveContact = async () => {
        if (!student) return

        const values = await form.validateFields()

        try {
            setSaving(true)
            const updatedStudent = await updateStudent(student.id, {
                phone: values.phone?.trim() || null,
                guardian_phone: values.guardian_phone?.trim() || null,
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
                <div className="student-profile-actions">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        disabled={!student || loading}
                        onClick={openContactForm}
                    >
                        แก้ไข
                    </Button>
                </div>
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
                    <>
                        <Card className="student-profile-summary-card">
                            <Space size={20} align="center">
                                <Avatar size={72} icon={<UserOutlined />} />
                                <div className="student-profile-summary-text">
                                    <h2>{displayValue(student.full_name_th)}</h2>
                                    <Text type="secondary">
                                        {displayValue(student.full_name_en)}
                                    </Text>
                                    <Space wrap>
                                        <Tag color="blue">
                                            {displayValue(student.student_code)}
                                        </Tag>
                                        <Tag color="green">
                                            {displayValue(
                                                student.student_status_name,
                                            )}
                                        </Tag>
                                    </Space>
                                </div>
                            </Space>
                        </Card>

                        <Row gutter={[20, 20]}>
                            <Col xs={24} xl={12}>
                                <Card
                                    className="student-profile-card"
                                    title={
                                        <Space>
                                            <IdcardOutlined />
                                            <span>ข้อมูลนิสิต</span>
                                        </Space>
                                    }
                                >
                                    <Descriptions
                                        column={1}
                                        items={[
                                            {
                                                key: 'studentCode',
                                                label: 'รหัสนิสิต',
                                                children: displayValue(
                                                    student.student_code,
                                                ),
                                            },
                                            {
                                                key: 'studentIdCard',
                                                label: 'เลขบัตรประชาชน',
                                                children: maskStudentIdCard(
                                                    student.student_id_card,
                                                ),
                                            },
                                            {
                                                key: 'fullNameTh',
                                                label: 'ชื่อ-นามสกุล ภาษาไทย',
                                                children: displayValue(
                                                    student.full_name_th,
                                                ),
                                            },
                                            {
                                                key: 'fullNameEn',
                                                label: 'ชื่อ-นามสกุล ภาษาอังกฤษ',
                                                children: displayValue(
                                                    student.full_name_en,
                                                ),
                                            },
                                            {
                                                key: 'phone',
                                                label: 'เบอร์โทรศัพท์',
                                                children: displayValue(
                                                    student.phone,
                                                ),
                                            },
                                            {
                                                key: 'email',
                                                label: 'อีเมล',
                                                children: displayValue(
                                                    student.email,
                                                ),
                                            },
                                            {
                                                key: 'highSchool',
                                                label: 'โรงเรียนเดิม',
                                                children: displayValue(
                                                    student.high_school_name,
                                                ),
                                            },
                                            {
                                                key: 'highSchoolAddress',
                                                label: 'ที่อยู่โรงเรียน',
                                                children: displayValue(
                                                    student.high_school_address,
                                                ),
                                            },
                                        ]}
                                    />
                                </Card>
                            </Col>

                            <Col xs={24} xl={12}>
                                <Card
                                    className="student-profile-card"
                                    title={
                                        <Space>
                                            <ReadOutlined />
                                            <span>ข้อมูลการศึกษา</span>
                                        </Space>
                                    }
                                >
                                    <Descriptions
                                        column={1}
                                        items={[
                                            {
                                                key: 'entryYear',
                                                label: 'ปีเข้าเรียน',
                                                children: displayValue(
                                                    student.entry_year_be,
                                                ),
                                            },
                                            {
                                                key: 'studyPeriod',
                                                label: 'ชั้นปีปัจจุบัน',
                                                children: displayValue(
                                                    student.study_period,
                                                ),
                                            },
                                            {
                                                key: 'admissionChannel',
                                                label: 'ช่องทางการรับเข้า',
                                                children: displayValue(
                                                    student.admission_channel_name,
                                                ),
                                            },
                                            {
                                                key: 'curriculum',
                                                label: 'หลักสูตร',
                                                children: displayValue(
                                                    student.curriculum_code,
                                                ),
                                            },
                                            {
                                                key: 'studyPlan',
                                                label: 'แผนการเรียน',
                                                children: displayValue(
                                                    student.study_plan_name_th,
                                                ),
                                            },
                                            {
                                                key: 'department',
                                                label: 'ภาควิชา',
                                                children: displayValue(
                                                    student.department_name,
                                                ),
                                            },
                                            {
                                                key: 'faculty',
                                                label: 'คณะ',
                                                children: displayValue(
                                                    student.faculty_name,
                                                ),
                                            },
                                            {
                                                key: 'advisor',
                                                label: 'อาจารย์ที่ปรึกษา',
                                                children: displayValue(
                                                    student.teacher_full_name,
                                                ),
                                            },
                                            {
                                                key: 'credits',
                                                label: 'หน่วยกิต (ทั้งหมด/ผ่าน/ไม่ผ่าน/เกิน)',
                                                children: getCreditSummary(student),
                                            },
                                            {
                                                key: 'gpa',
                                                label: 'GPA',
                                                children: displayValue(student.gpa),
                                            },
                                            {
                                                key: 'gpax',
                                                label: 'GPAX',
                                                children: displayValue(student.gpax),
                                            },
                                        ]}
                                    />
                                </Card>
                            </Col>

                            <Col xs={24}>
                                <Card
                                    className="student-profile-card"
                                    title={
                                        <Space>
                                            <TeamOutlined />
                                            <span>ข้อมูลผู้ปกครอง</span>
                                        </Space>
                                    }
                                >
                                    <Descriptions
                                        column={{ xs: 1, sm: 3 }}
                                        items={[
                                            {
                                                key: 'guardianName',
                                                label: 'ชื่อ-นามสกุล',
                                                children: displayValue(
                                                    student.guardian_full_name,
                                                ),
                                            },
                                            {
                                                key: 'guardianRelationship',
                                                label: 'ความสัมพันธ์',
                                                children: displayValue(
                                                    student.guardian_relationship_name,
                                                ),
                                            },
                                            {
                                                key: 'guardianPhone',
                                                label: 'เบอร์โทรศัพท์',
                                                children: displayValue(
                                                    student.guardian_phone,
                                                ),
                                            },
                                        ]}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </>
                ) : !error ? (
                    <Empty description="ไม่พบข้อมูลนิสิต" />
                ) : null}
            </Skeleton>

            <Modal
                title="แก้ไขข้อมูลส่วนตัว"
                open={editing}
                okText="บันทึก"
                cancelText="ยกเลิก"
                confirmLoading={saving}
                cancelButtonProps={{ disabled: saving }}
                closable={!saving}
                maskClosable={!saving}
                onOk={() => void saveContact()}
                onCancel={() => {
                    if (!saving) setEditing(false)
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="เบอร์โทรศัพท์นิสิต"
                        name="phone"
                        rules={[
                            {
                                pattern: /^0\d{8,9}$/,
                                message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
                            },
                        ]}
                    >
                        <Input
                            allowClear
                            maxLength={10}
                            inputMode="tel"
                            placeholder="กรอกเบอร์โทรศัพท์นิสิต"
                        />
                    </Form.Item>

                    <Form.Item
                        label="เบอร์โทรศัพท์ผู้ปกครอง"
                        name="guardian_phone"
                        rules={[
                            {
                                pattern: /^0\d{8,9}$/,
                                message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
                            },
                        ]}
                    >
                        <Input
                            allowClear
                            maxLength={10}
                            inputMode="tel"
                            placeholder="กรอกเบอร์โทรศัพท์ผู้ปกครอง"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
