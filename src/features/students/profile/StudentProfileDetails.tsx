import {
    IdcardOutlined,
    ReadOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import {
    Avatar,
    Card,
    Col,
    Descriptions,
    Row,
    Space,
    Tag,
    Typography,
} from 'antd'
import type { DescriptionsProps } from 'antd'
import type { ReactNode } from 'react'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'

const { Text } = Typography

type DescriptionItem = NonNullable<DescriptionsProps['items']>[number]

interface StudentProfileDetailsProps {
    student: StudentDetailResponse
}

interface ProfileCardProps {
    icon: ReactNode
    title: string
    items: DescriptionItem[]
    column?: DescriptionsProps['column']
}

function displayValue(value: string | number | null | undefined) {
    return value === null || value === undefined || value === '' ? '-' : value
}

function createItem(
    key: string,
    label: string,
    value: string | number | null | undefined,
): DescriptionItem {
    return {
        key,
        label,
        children: displayValue(value),
    }
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

function ProfileCard({
    icon,
    title,
    items,
    column = 1,
}: ProfileCardProps) {
    return (
        <Card
            className="student-profile-card"
            title={
                <Space>
                    {icon}
                    <span>{title}</span>
                </Space>
            }
        >
            <Descriptions column={column} items={items} />
        </Card>
    )
}

export default function StudentProfileDetails({
    student,
}: StudentProfileDetailsProps) {
    const studentItems = [
        createItem('studentCode', 'รหัสนิสิต', student.student_code),
        createItem(
            'studentIdCard',
            'เลขบัตรประชาชน',
            maskStudentIdCard(student.student_id_card),
        ),
        createItem('fullNameTh', 'ชื่อ-นามสกุล ภาษาไทย', student.full_name_th),
        createItem('fullNameEn', 'ชื่อ-นามสกุล ภาษาอังกฤษ', student.full_name_en),
        createItem('phone', 'เบอร์โทรศัพท์', student.phone),
        createItem('email', 'อีเมล', student.email),
        createItem('highSchool', 'โรงเรียนเดิม', student.high_school_name),
        createItem(
            'highSchoolAddress',
            'ที่อยู่โรงเรียน',
            student.high_school_address,
        ),
    ]
    const educationItems = [
        createItem('entryYear', 'ปีเข้าเรียน', student.entry_year_be),
        createItem('studyPeriod', 'ชั้นปีปัจจุบัน', student.study_period),
        createItem(
            'admissionChannel',
            'ช่องทางการรับเข้า',
            student.admission_channel_name,
        ),
        createItem('curriculum', 'หลักสูตร', student.curriculum_code),
        createItem('studyPlan', 'แผนการเรียน', student.study_plan_name_th),
        createItem('department', 'ภาควิชา', student.department_name),
        createItem('faculty', 'คณะ', student.faculty_name),
        createItem('advisor', 'อาจารย์ที่ปรึกษา', student.teacher_full_name),
        createItem(
            'credits',
            'หน่วยกิต (ทั้งหมด/ผ่าน/ไม่ผ่าน/เกิน)',
            getCreditSummary(student),
        ),
        createItem('gpa', 'GPA', student.gpa),
        createItem('gpax', 'GPAX', student.gpax),
    ]
    const guardianItems = [
        createItem('guardianName', 'ชื่อ-นามสกุล', student.guardian_full_name),
        createItem(
            'guardianRelationship',
            'ความสัมพันธ์',
            student.guardian_relationship_name,
        ),
        createItem('guardianPhone', 'เบอร์โทรศัพท์', student.guardian_phone),
    ]

    return (
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
                                {displayValue(student.student_status_name)}
                            </Tag>
                        </Space>
                    </div>
                </Space>
            </Card>

            <Row gutter={[20, 20]}>
                <Col xs={24} xl={12}>
                    <ProfileCard
                        icon={<IdcardOutlined />}
                        title="ข้อมูลนิสิต"
                        items={studentItems}
                    />
                </Col>

                <Col xs={24} xl={12}>
                    <ProfileCard
                        icon={<ReadOutlined />}
                        title="ข้อมูลการศึกษา"
                        items={educationItems}
                    />
                </Col>

                <Col xs={24}>
                    <ProfileCard
                        icon={<TeamOutlined />}
                        title="ข้อมูลผู้ปกครอง"
                        items={guardianItems}
                        column={{ xs: 1, sm: 3 }}
                    />
                </Col>
            </Row>
        </>
    )
}
