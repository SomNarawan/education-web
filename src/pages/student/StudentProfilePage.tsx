import {
    EditOutlined,
    IdcardOutlined,
    ReadOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import {
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
    message,
} from 'antd'
import { useState } from 'react'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'

const { Text } = Typography

interface StudentProfile {
    studentCode: string
    studentIdCard: string
    firstNameTh: string
    lastNameTh: string
    firstNameEn: string
    lastNameEn: string
    phone: string
    email: string
    entryYear: number
    studyPeriod: string
    studentStatus: string
    admissionChannel: string
    curriculum: string
    studyPlan: string
    department: string
    faculty: string
    advisor: string
    highSchool: string
    guardianFirstName: string
    guardianLastName: string
    guardianRelationship: string
    guardianPhone: string
}

interface StudentProfileFormValues {
    firstNameTh: string
    lastNameTh: string
    firstNameEn: string
    lastNameEn: string
    phone: string
    email: string
    guardianFirstName: string
    guardianLastName: string
    guardianRelationship: string
    guardianPhone: string
}

const defaultStudentProfile: StudentProfile = {
    studentCode: '6020501361',
    studentIdCard: '1103700123456',
    firstNameTh: 'นราวัลย์',
    lastNameTh: 'เอี่ยมสอาด',
    firstNameEn: 'Narawan',
    lastNameEn: 'Iamsaard',
    phone: '0812345678',
    email: '6020501361@ku.th',
    entryYear: 2566,
    studyPeriod: 'ชั้นปีที่ 3 ภาคต้น',
    studentStatus: 'กำลังศึกษา',
    admissionChannel: 'โควตา',
    curriculum: 'วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์',
    studyPlan: 'แผนการเรียนปกติ',
    department: 'ภาควิชาวิศวกรรมคอมพิวเตอร์',
    faculty: 'คณะวิศวกรรมศาสตร์ กำแพงแสน',
    advisor: 'อาจารย์สมชาย ใจดี',
    highSchool: 'โรงเรียนสาธิตแห่งมหาวิทยาลัยเกษตรศาสตร์',
    guardianFirstName: 'สมศักดิ์',
    guardianLastName: 'ใจดี',
    guardianRelationship: 'บิดา',
    guardianPhone: '0898765432',
}

function maskStudentIdCard(studentIdCard: string) {
    if (!/^\d{13}$/.test(studentIdCard)) return studentIdCard

    return `${studentIdCard.slice(0, 1)}-${studentIdCard.slice(1, 5)}-xxxxx-xx-${studentIdCard.slice(-1)}`
}

function createInitialProfile(
    studentCode?: string | null,
    studentName?: string,
): StudentProfile {
    const resolvedStudentCode =
        studentCode?.trim() ||
        defaultStudentProfile.studentCode
    const resolvedName = studentName
    const [firstNameTh, ...lastNameParts] =
        resolvedName
            ?.replace(/^(นาย|นางสาว|นาง)/, '')
            .trim()
            .split(/\s+/) ?? []

    return {
        ...defaultStudentProfile,
        studentCode: resolvedStudentCode,
        firstNameTh: firstNameTh || defaultStudentProfile.firstNameTh,
        lastNameTh:
            lastNameParts.join(' ') || defaultStudentProfile.lastNameTh,
        email: `${resolvedStudentCode}@ku.th`,
    }
}

export default function StudentProfilePage() {
    const { studentCode, user } = useCurrentStudent()
    const [form] = Form.useForm<StudentProfileFormValues>()
    const [editing, setEditing] = useState(false)
    const [profile, setProfile] = useState<StudentProfile>(() =>
        createInitialProfile(studentCode, user?.name),
    )

    const fullNameTh = `${profile.firstNameTh} ${profile.lastNameTh}`
    const fullNameEn = `${profile.firstNameEn} ${profile.lastNameEn}`
    const guardianFullName = `${profile.guardianFirstName} ${profile.guardianLastName}`

    const openEditModal = () => {
        form.setFieldsValue({
            firstNameTh: profile.firstNameTh,
            lastNameTh: profile.lastNameTh,
            firstNameEn: profile.firstNameEn,
            lastNameEn: profile.lastNameEn,
            phone: profile.phone,
            email: profile.email,
            guardianFirstName: profile.guardianFirstName,
            guardianLastName: profile.guardianLastName,
            guardianRelationship: profile.guardianRelationship,
            guardianPhone: profile.guardianPhone,
        })
        setEditing(true)
    }

    const saveProfile = async () => {
        const values = await form.validateFields()

        setProfile((current) => ({
            ...current,
            ...values,
            firstNameTh: values.firstNameTh.trim(),
            lastNameTh: values.lastNameTh.trim(),
            firstNameEn: values.firstNameEn.trim(),
            lastNameEn: values.lastNameEn.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            guardianFirstName: values.guardianFirstName.trim(),
            guardianLastName: values.guardianLastName.trim(),
            guardianRelationship: values.guardianRelationship.trim(),
            guardianPhone: values.guardianPhone.trim(),
        }))
        setEditing(false)
        message.success('แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว')
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
                    size="large"
                    icon={<EditOutlined />}
                    onClick={openEditModal}
                >
                    แก้ไขข้อมูล
                </Button>
            </div>

            <Card className="student-profile-summary-card">
                <Space size={20} align="center">
                    <Avatar size={72} icon={<UserOutlined />} />
                    <div className="student-profile-summary-text">
                        <h2>{fullNameTh}</h2>
                        <Text type="secondary">{fullNameEn}</Text>
                        <Space wrap>
                            <Tag color="blue">{profile.studentCode}</Tag>
                            <Tag color="green">{profile.studentStatus}</Tag>
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
                                    children: profile.studentCode,
                                },
                                {
                                    key: 'studentIdCard',
                                    label: 'เลขบัตรประชาชน',
                                    children: maskStudentIdCard(
                                        profile.studentIdCard,
                                    ),
                                },
                                {
                                    key: 'fullNameTh',
                                    label: 'ชื่อ-นามสกุล ภาษาไทย',
                                    children: fullNameTh,
                                },
                                {
                                    key: 'fullNameEn',
                                    label: 'ชื่อ-นามสกุล ภาษาอังกฤษ',
                                    children: fullNameEn,
                                },
                                {
                                    key: 'phone',
                                    label: 'เบอร์โทรศัพท์',
                                    children: profile.phone,
                                },
                                {
                                    key: 'email',
                                    label: 'อีเมล',
                                    children: profile.email,
                                },
                                {
                                    key: 'highSchool',
                                    label: 'โรงเรียนเดิม',
                                    children: profile.highSchool,
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
                                    children: profile.entryYear,
                                },
                                {
                                    key: 'studyPeriod',
                                    label: 'ชั้นปีปัจจุบัน',
                                    children: profile.studyPeriod,
                                },
                                {
                                    key: 'admissionChannel',
                                    label: 'ช่องทางการรับเข้า',
                                    children: profile.admissionChannel,
                                },
                                {
                                    key: 'curriculum',
                                    label: 'หลักสูตร',
                                    children: profile.curriculum,
                                },
                                {
                                    key: 'studyPlan',
                                    label: 'แผนการเรียน',
                                    children: profile.studyPlan,
                                },
                                {
                                    key: 'department',
                                    label: 'ภาควิชา',
                                    children: profile.department,
                                },
                                {
                                    key: 'faculty',
                                    label: 'คณะ',
                                    children: profile.faculty,
                                },
                                {
                                    key: 'advisor',
                                    label: 'อาจารย์ที่ปรึกษา',
                                    children: profile.advisor,
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
                                    children: guardianFullName,
                                },
                                {
                                    key: 'guardianRelationship',
                                    label: 'ความสัมพันธ์',
                                    children: profile.guardianRelationship,
                                },
                                {
                                    key: 'guardianPhone',
                                    label: 'เบอร์โทรศัพท์',
                                    children: profile.guardianPhone,
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title="แก้ไขข้อมูลส่วนตัว"
                open={editing}
                width={760}
                okText="บันทึก"
                cancelText="ยกเลิก"
                onOk={saveProfile}
                onCancel={() => setEditing(false)}
            >
                <Form
                    form={form}
                    layout="vertical"
                    requiredMark="optional"
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="ชื่อภาษาไทย"
                                name="firstNameTh"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกชื่อภาษาไทย',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="นามสกุลภาษาไทย"
                                name="lastNameTh"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกนามสกุลภาษาไทย',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="ชื่อภาษาอังกฤษ"
                                name="firstNameEn"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกชื่อภาษาอังกฤษ',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="นามสกุลภาษาอังกฤษ"
                                name="lastNameEn"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกนามสกุลภาษาอังกฤษ',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="เบอร์โทรศัพท์"
                                name="phone"
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกเบอร์โทรศัพท์',
                                    },
                                    {
                                        pattern: /^0\d{8,9}$/,
                                        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
                                    },
                                ]}
                            >
                                <Input maxLength={10} inputMode="tel" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="อีเมล"
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกอีเมล',
                                    },
                                    {
                                        type: 'email',
                                        message: 'รูปแบบอีเมลไม่ถูกต้อง',
                                    },
                                ]}
                            >
                                <Input maxLength={100} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Typography.Title level={5}>ข้อมูลผู้ปกครอง</Typography.Title>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="ชื่อผู้ปกครอง"
                                name="guardianFirstName"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกชื่อผู้ปกครอง',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="นามสกุลผู้ปกครอง"
                                name="guardianLastName"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกนามสกุลผู้ปกครอง',
                                    },
                                ]}
                            >
                                <Input maxLength={50} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="ความสัมพันธ์"
                                name="guardianRelationship"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกความสัมพันธ์',
                                    },
                                ]}
                            >
                                <Input maxLength={30} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="เบอร์โทรศัพท์ผู้ปกครอง"
                                name="guardianPhone"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            'กรุณากรอกเบอร์โทรศัพท์ผู้ปกครอง',
                                    },
                                    {
                                        pattern: /^0\d{8,9}$/,
                                        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
                                    },
                                ]}
                            >
                                <Input maxLength={10} inputMode="tel" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}
