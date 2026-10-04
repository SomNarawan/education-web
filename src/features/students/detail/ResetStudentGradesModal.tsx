import {
    Alert,
    Col,
    Form,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Typography,
} from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'

const { Paragraph, Text } = Typography

const semesterLabels: Record<number, string> = {
    1: 'ภาคต้น',
    2: 'ภาคปลาย',
    3: 'ภาคฤดูร้อน',
}

type ResetScope = 'all' | 'semester'

export type ResetStudentGradesSelection =
    | { scope: 'all' }
    | { scope: 'semester'; studyYear: number; semester: number }

interface ResetStudentGradesModalProps {
    open: boolean
    studentCode: string
    studentName: string
    currentStudyYear: number
    currentStudySemester: number
    loading?: boolean
    onCancel: () => void
    onConfirm: (selection: ResetStudentGradesSelection) => Promise<boolean>
}

export default function ResetStudentGradesModal({
    open,
    studentCode,
    studentName,
    currentStudyYear,
    currentStudySemester,
    loading = false,
    onCancel,
    onConfirm,
}: ResetStudentGradesModalProps) {
    const [scope, setScope] = useState<ResetScope>('all')
    const [studyYear, setStudyYear] = useState<number>()
    const [semester, setSemester] = useState<number>()

    const hasValidCurrentStudyPeriod =
        currentStudyYear >= 1 &&
        currentStudySemester >= 1 &&
        currentStudySemester <= 3

    const latestSelectableStudyYear = hasValidCurrentStudyPeriod
        ? currentStudySemester > 1
            ? currentStudyYear
            : currentStudyYear - 1
        : 0

    const studyYearOptions = useMemo(
        () =>
            Array.from(
                { length: Math.max(0, latestSelectableStudyYear) },
                (_, index) => {
                    const year = index + 1

                    return {
                        label: year,
                        value: year,
                    }
                },
            ),
        [latestSelectableStudyYear],
    )

    const semesterOptions = useMemo(() => {
        if (studyYear === undefined) return []

        const lastSemester =
            studyYear < currentStudyYear ? 3 : currentStudySemester - 1

        return Array.from({ length: lastSemester }, (_, index) => {
            const semesterOrder = index + 1

            return {
                label:
                    semesterLabels[semesterOrder] ??
                    `ภาคเรียนที่ ${semesterOrder}`,
                value: semesterOrder,
            }
        })
    }, [currentStudySemester, currentStudyYear, studyYear])

    const resetSelection = () => {
        setScope('all')
        setStudyYear(undefined)
        setSemester(undefined)
    }

    const handleCancel = () => {
        resetSelection()
        onCancel()
    }

    const handleConfirm = async () => {
        if (scope === 'semester') {
            if (studyYear === undefined || semester === undefined) return

            const confirmed = await onConfirm({ scope, studyYear, semester })

            if (confirmed) resetSelection()
            return
        }

        const confirmed = await onConfirm({ scope })

        if (confirmed) resetSelection()
    }

    const targetDescription =
        scope === 'all'
            ? 'ผลการเรียนทั้งหมดของนิสิตรายนี้'
            : studyYear !== undefined && semester !== undefined
              ? `ปีที่ ${studyYear} ${semesterLabels[semester]}`
              : 'ปีและภาคเรียนที่เลือก'

    const isConfirmDisabled =
        scope === 'semester' &&
        (studyYear === undefined || semester === undefined)

    return (
        <Modal
            open={open}
            title={
                <Space>
                    <ExclamationCircleOutlined style={{ color: '#d4380d' }} />
                    ยืนยันการรีเซ็ตผลการเรียน
                </Space>
            }
            okText="ยืนยันการรีเซ็ต"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, disabled: isConfirmDisabled }}
            confirmLoading={loading}
            maskClosable={!loading}
            closable={!loading}
            onOk={handleConfirm}
            onCancel={handleCancel}
            destroyOnHidden
        >
            <Alert
                type="warning"
                showIcon
                message="ข้อมูลที่รีเซ็ตจะไม่แสดงในผลการเรียนและกราฟวิเคราะห์"
                description="เมื่อเชื่อมต่อระบบหลังบ้านแล้ว การดำเนินการนี้จะลบข้อมูลผลการเรียนตามขอบเขตที่เลือก และต้องนำเข้าข้อมูลใหม่หากต้องการกู้คืน"
                style={{ marginBottom: 20 }}
            />

            <Paragraph style={{ marginBottom: 4 }}>
                <Text type="secondary">นิสิต</Text>
            </Paragraph>
            <Paragraph strong style={{ marginTop: 0, marginBottom: 20 }}>
                {studentCode} {studentName}
            </Paragraph>

            <Form layout="vertical">
                <Form.Item label="ขอบเขตที่ต้องการรีเซ็ต" required>
                    <Radio.Group
                        value={scope}
                        onChange={(event) => {
                            const nextScope = event.target.value as ResetScope
                            setScope(nextScope)
                            setStudyYear(undefined)
                            setSemester(undefined)
                        }}
                    >
                        <Space direction="vertical" size={12}>
                            <Radio value="all">
                                <Space direction="vertical" size={0}>
                                    <Text strong>ผลการเรียนทั้งหมด</Text>
                                    <Text type="secondary">
                                        ล้างผลการเรียนทุกชั้นปีและทุกภาคเรียน
                                    </Text>
                                </Space>
                            </Radio>
                            <Radio
                                value="semester"
                                disabled={studyYearOptions.length === 0}
                            >
                                <Space direction="vertical" size={0}>
                                    <Text strong>
                                        ระบุปีและภาคเรียน
                                    </Text>
                                    <Text type="secondary">
                                        ล้างเฉพาะผลการเรียนในช่วงเวลาที่เลือก
                                    </Text>
                                </Space>
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>

                {scope === 'semester' && (
                    <Row gutter={12}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="ปีที่" required>
                                <Select
                                    placeholder="เลือกปี"
                                    value={studyYear}
                                    options={studyYearOptions}
                                    onChange={(value) => {
                                        setStudyYear(value)
                                        setSemester(undefined)
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="เทอม" required>
                                <Select
                                    placeholder="เลือกเทอม"
                                    value={semester}
                                    options={semesterOptions}
                                    disabled={studyYear === undefined}
                                    onChange={setSemester}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}
            </Form>

            <Paragraph style={{ marginBottom: 0 }}>
                ระบบจะรีเซ็ต <Text strong>{targetDescription}</Text>
            </Paragraph>
        </Modal>
    )
}
