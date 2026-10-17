import {
    ArrowRightOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Modal,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import {
    advanceAcademicTerm,
    getAcademicTermPreview,
    getAcademicTermRollovers,
} from '../../services/academicTermService'
import type { ApiErrorResponse } from '../../types/ApiResponse'
import type {
    AcademicTermPreview,
    AcademicTermRollover,
    AcademicTermTransition,
} from '../../types/AcademicTerm'
import { formatThaiDateTime } from '../../utils/dateFormat'

const { Paragraph, Text } = Typography

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return (
            error.response?.data.message ??
            'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่'
        )
    }

    return error instanceof Error
        ? error.message
        : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
}

const transitionColumns: ColumnsType<AcademicTermTransition> = [
    {
        title: 'ภาคปัจจุบัน',
        dataIndex: 'from_name',
        width: '30%',
        align: 'center',
    },
    {
        title: '',
        key: 'arrow',
        width: 60,
        align: 'center',
        render: () => <ArrowRightOutlined />,
    },
    {
        title: 'ภาคถัดไป',
        dataIndex: 'to_name',
        width: '30%',
        align: 'center',
        render: (value: string, record) => (
            <Space direction="vertical" size={0}>
                <Text strong>{value}</Text>
                {record.increments_study_year && (
                    <Tag color="blue">เพิ่มชั้นปี</Tag>
                )}
            </Space>
        ),
    },
    {
        title: 'จำนวนนิสิต',
        dataIndex: 'affected_count',
        align: 'center',
        render: (value: number) => `${value.toLocaleString()} คน`,
    },
]

export default function AcademicTermManagementPage() {
    const [modal, contextHolder] = Modal.useModal()
    const [preview, setPreview] = useState<AcademicTermPreview | null>(null)
    const [history, setHistory] = useState<AcademicTermRollover[]>([])
    const [loading, setLoading] = useState(true)
    const [advancing, setAdvancing] = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [previewData, historyData] = await Promise.all([
                getAcademicTermPreview(),
                getAcademicTermRollovers(),
            ])
            setPreview(previewData)
            setHistory(historyData)
        } catch (error) {
            console.error('Unable to load academic term management data', error)
            message.error(getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial API requests are intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData()
    }, [loadData])

    const handleAdvance = () => {
        if (!preview?.can_advance) return

        modal.confirm({
            title: (
                <Space>
                    <CalendarOutlined style={{ color: '#fa8c16' }} />
                    <span>ยืนยันการปิดภาคการศึกษา</span>
                </Space>
            ),
            icon: null,
            width: 620,
            okText: 'ยืนยันและเลื่อนภาค',
            cancelText: 'ยกเลิก',
            okButtonProps: { danger: true },
            content: (
                <div className="academic-term-confirmation">
                    <Alert
                        type="warning"
                        showIcon={true}
                        message={`นิสิตกำลังศึกษา ${preview.eligible_count.toLocaleString()} คนจะถูกเลื่อนไปภาคถัดไป`}
                        description="การดำเนินการนี้เปลี่ยนชั้นปีและภาคการศึกษาของนิสิตจำนวนมาก กรุณาตรวจสอบตารางก่อนยืนยัน"
                    />
                    <Table<AcademicTermTransition>
                        rowKey="from_semester"
                        columns={transitionColumns}
                        dataSource={preview.transitions}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                    />
                </div>
            ),
            onOk: async () => {
                try {
                    setAdvancing(true)
                    const result = await advanceAcademicTerm(
                        preview.preview_token,
                    )
                    message.success(
                        `เลื่อนภาคการศึกษาสำเร็จ ${result.affected_count.toLocaleString()} คน`,
                    )
                    await loadData()
                } catch (error) {
                    console.error('Unable to advance academic term', error)
                    message.error(getErrorMessage(error))
                    await loadData()
                } finally {
                    setAdvancing(false)
                }
            },
        })
    }

    const historyColumns: ColumnsType<AcademicTermRollover> = [
        {
            title: 'วันที่ดำเนินการ',
            dataIndex: 'created_at',
            width: 190,
            render: (value: string) => formatThaiDateTime(value),
        },
        {
            title: 'รายการที่เลื่อน',
            dataIndex: 'transitions',
            render: (transitions: AcademicTermTransition[]) => (
                <Space size={[4, 4]} wrap>
                    {transitions.map((transition) => (
                        <Tag key={transition.from_semester} color="blue">
                            {transition.from_name} → {transition.to_name} ({' '}
                            {transition.affected_count.toLocaleString()} คน)
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'รวม',
            dataIndex: 'affected_count',
            width: 110,
            align: 'center',
            render: (value: number) => `${value.toLocaleString()} คน`,
        },
        {
            title: 'ดำเนินการโดย',
            dataIndex: 'created_by',
            width: 160,
        },
    ]

    return (
        <div className="student-page academic-term-page">
            {contextHolder}
            <div className="page-title-section">
                <div>
                    <h1>จัดการภาคการศึกษา</h1>
                    <p>ตรวจสอบและเลื่อนนิสิตที่กำลังศึกษาไปยังภาคถัดไป</p>
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={() => void loadData()}
                >
                    รีเฟรช
                </Button>
            </div>

            <Row gutter={[16, 16]} className="academic-term-summary-grid">
                <Col xs={24} md={12}>
                    <Card loading={loading}>
                        <Statistic
                            title="นิสิตที่จะเลื่อนภาค"
                            value={preview?.eligible_count ?? 0}
                            suffix="คน"
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card loading={loading}>
                        <Statistic
                            title="ข้อมูลภาคการศึกษาที่ผิดปกติ"
                            value={preview?.invalid_semester_count ?? 0}
                            suffix="คน"
                            valueStyle={{
                                color:
                                    (preview?.invalid_semester_count ?? 0) > 0
                                        ? '#cf1322'
                                        : '#389e0d',
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                className="academic-term-card"
                title="รายการเปลี่ยนแปลงที่จะเกิดขึ้น"
                loading={loading}
            >
                {preview && preview.invalid_semester_count > 0 && (
                    <Alert
                        type="error"
                        showIcon
                        message="พบข้อมูลภาคการศึกษาที่ไม่ถูกต้อง"
                        description="กรุณาแก้ไขข้อมูลนิสิตให้เป็นภาคต้น ภาคปลาย หรือภาคฤดูร้อนก่อนดำเนินการ"
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Table<AcademicTermTransition>
                    rowKey="from_semester"
                    columns={transitionColumns}
                    dataSource={preview?.transitions ?? []}
                    locale={{ emptyText: <Empty description="ไม่พบนิสิตกำลังศึกษา" /> }}
                    pagination={false}
                    size="middle"
                    tableLayout="fixed"
                />
                <div className="academic-term-actions">
                    <Button
                        danger
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        loading={advancing}
                        disabled={!preview?.can_advance || loading || advancing}
                        onClick={handleAdvance}
                    >
                        ปิดภาคการศึกษาและเลื่อนภาค
                    </Button>
                </div>
            </Card>

            <Card className="academic-term-card" title="ประวัติการเลื่อนภาค">
                <Table<AcademicTermRollover>
                    rowKey="id"
                    columns={historyColumns}
                    dataSource={history}
                    loading={loading}
                    locale={{ emptyText: <Empty description="ยังไม่มีประวัติการเลื่อนภาค" /> }}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Paragraph type="secondary" className="academic-term-note">
                ระบบจะอัปเดตเฉพาะนิสิตที่มีสถานะ “กำลังศึกษา” และบันทึกประวัติทุกครั้ง
            </Paragraph>
        </div>
    )
}
