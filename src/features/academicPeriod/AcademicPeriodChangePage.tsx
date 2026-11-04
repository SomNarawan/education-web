import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    HistoryOutlined,
    ReloadOutlined,
    SyncOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Modal,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
} from 'antd'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appColors } from '../../config/appColors'
import {
    getStudentAcademicPeriodPreview,
    getStudentAcademicPeriodSyncHistory,
    syncStudentAcademicPeriods,
} from '../../services/studentAcademicPeriodSyncService'
import type { ApiResponse } from '../../types/ApiResponse'
import type {
    AcademicPeriodSummary,
    AcademicPeriodSummaryStatus,
    AcademicPeriodSyncStatus,
    StudentAcademicPeriodPreview,
    StudentAcademicPeriodSyncHistory,
} from '../../types/StudentAcademicPeriodSync'
import { formatThaiDate, formatThaiDateTime } from '../../utils/dateFormat'
import './academicPeriodChange.css'

const { Text } = Typography

const summaryStatusDisplay: Record<
    AcademicPeriodSummaryStatus,
    { color: string; label: string }
> = {
    ready: { color: 'success', label: 'พร้อม Sync' },
    missing_calendar: { color: 'error', label: 'ไม่มีปฏิทินการศึกษา' },
    calendar_conflict: { color: 'error', label: 'ปฏิทินไม่ตรงกัน' },
    invalid_entry_year: { color: 'warning', label: 'ปีเข้าไม่ถูกต้อง' },
}

const historyStatusDisplay: Record<
    AcademicPeriodSyncStatus,
    { color: string; label: string }
> = {
    running: { color: 'processing', label: 'กำลัง Sync' },
    success: { color: 'success', label: 'สำเร็จ' },
    partial: { color: 'warning', label: 'สำเร็จบางส่วน' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data.message ?? error.message
    }

    return error instanceof Error
        ? error.message
        : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
}

function createSummaryColumns(): TableColumnsType<AcademicPeriodSummary> {
    return [
        {
            title: 'ปีการศึกษาที่เข้า',
            dataIndex: 'entry_year_be',
            key: 'entry_year_be',
            render: (value: number) => <Text strong>{value}</Text>,
        },
        {
            title: 'จำนวนนิสิต',
            dataIndex: 'student_count',
            key: 'student_count',
            align: 'right',
            render: (value: number) => `${value.toLocaleString()} คน`,
        },
        {
            title: 'ชั้นปีจากระบบ',
            dataIndex: 'study_year',
            key: 'study_year',
            align: 'center',
            render: (value: number | null) => value === null ? '-' : `ชั้นปีที่ ${value}`,
        },
        {
            title: 'ปี/ภาคการศึกษาที่จะ Sync',
            key: 'targetPeriod',
            render: (_, record) =>
                record.academic_year_be && record.term_name_th
                    ? `${record.academic_year_be} / ${record.term_name_th}`
                    : '-',
        },
        {
            title: 'รายการอัปเดต',
            dataIndex: 'update_count',
            key: 'update_count',
            align: 'right',
            render: (value: number) => `${value.toLocaleString()} รายการ`,
        },
        {
            title: 'รายการไม่อัปเดต',
            dataIndex: 'unchanged_count',
            key: 'unchanged_count',
            align: 'right',
            render: (value: number) => `${value.toLocaleString()} รายการ`,
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status: AcademicPeriodSummaryStatus) => {
                const display = summaryStatusDisplay[status]
                return <Tag color={display.color}>{display.label}</Tag>
            },
        },
    ]
}

export default function AcademicPeriodChangePage() {
    const navigate = useNavigate()
    const [preview, setPreview] =
        useState<StudentAcademicPeriodPreview | null>(null)
    const [history, setHistory] = useState<StudentAcademicPeriodSyncHistory[]>([])
    const [selectedHistory, setSelectedHistory] =
        useState<StudentAcademicPeriodSyncHistory | null>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const [previewData, historyData] = await Promise.all([
                getStudentAcademicPeriodPreview(),
                getStudentAcademicPeriodSyncHistory(),
            ])
            setPreview(previewData)
            setHistory(historyData)
        } catch (loadError) {
            console.error('Unable to load student academic period sync', loadError)
            setError(getErrorMessage(loadError))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial API load is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData()
    }, [loadData])

    const summaryColumns = useMemo(() => createSummaryColumns(), [])
    const historyColumns = useMemo<TableColumnsType<StudentAcademicPeriodSyncHistory>>(
        () => [
            {
                title: 'ปี / ภาคการศึกษา',
                key: 'period',
                render: (_, record) => record.academic_year && record.term_name_th
                    ? `${record.academic_year + 543} / ${record.term_name_th}`
                    : '-',
            },
            {
                title: 'นิสิตทั้งหมด',
                dataIndex: 'total_students',
                key: 'total_students',
                align: 'right',
                render: (value: number) => value.toLocaleString(),
            },
            {
                title: 'รายการอัปเดต',
                dataIndex: 'updated_count',
                key: 'updated_count',
                align: 'right',
                render: (value: number) => value.toLocaleString(),
            },
            {
                title: 'รายการไม่อัปเดต',
                dataIndex: 'skipped_count',
                key: 'skipped_count',
                align: 'right',
                render: (value: number) => value.toLocaleString(),
            },
            {
                title: 'ไม่สำเร็จ',
                dataIndex: 'failed_count',
                key: 'failed_count',
                align: 'right',
                render: (value: number) => value.toLocaleString(),
            },
            {
                title: 'สถานะ',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                render: (status: AcademicPeriodSyncStatus) => {
                    const display = historyStatusDisplay[status]
                    return <Tag color={display.color}>{display.label}</Tag>
                },
            },
            {
                title: 'ดำเนินการโดย',
                dataIndex: 'created_by',
                key: 'created_by',
            },
            {
                title: 'วันที่ Sync',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (value: string) => formatThaiDateTime(value),
            },
            {
                title: 'จัดการ',
                key: 'action',
                width: 70,
                align: 'center',
                render: (_, record) => (
                    <Button
                        icon={<EyeOutlined />}
                        aria-label="ดูรายละเอียดประวัติ Sync"
                        style={{
                            borderColor: appColors.info,
                            color: appColors.info,
                        }}
                        onClick={() => setSelectedHistory(record)}
                    />
                ),
            },
        ],
        [],
    )

    const handleSync = async () => {
        setSyncing(true)

        try {
            const result = await syncStudentAcademicPeriods()
            setConfirmOpen(false)

            if (result.status === 'success') {
                message.success(
                    `Sync สำเร็จ อัปเดตนิสิต ${result.updated_count.toLocaleString()} คน`,
                )
            } else if (result.status === 'partial') {
                message.warning('Sync สำเร็จบางส่วน กรุณาตรวจสอบรายการที่ไม่สำเร็จ')
            } else {
                message.error(result.error_message ?? 'Sync ไม่สำเร็จ')
            }

            await loadData()
        } catch (syncError) {
            console.error('Unable to sync student academic periods', syncError)
            message.error(getErrorMessage(syncError))
        } finally {
            setSyncing(false)
        }
    }

    const previewPanel = preview ? (
        <Space direction="vertical" size={16} className="academic-period-stack">
            <Alert
                showIcon
                type={preview.calendar_status === 'ready' ? 'success' : 'error'}
                icon={preview.calendar_status === 'ready'
                    ? <CheckCircleOutlined />
                    : <ExclamationCircleOutlined />}
                message={preview.calendar_status === 'ready'
                    ? `พร้อม Sync · ปีการศึกษา ${preview.academic_year_be ?? '-'} · ${preview.term_name_th ?? '-'}`
                    : 'ยังไม่สามารถ Sync ได้'}
                description={preview.calendar_status === 'ready'
                    ? (
                        <Space wrap size={[8, 4]}>
                            <span>{preview.calendar_message}</span>
                            <Tag color="blue">หลักสูตรภาษาไทย</Tag>
                            <Tag color="warning">
                                หลักสูตรนานาชาติ: รอการรับรอง
                            </Tag>
                        </Space>
                    )
                    : preview.calendar_message}
                action={preview.calendar_status !== 'ready' ? (
                    <Button
                        size="small"
                        onClick={() => navigate('/central-data/academic-calendar')}
                    >
                        ดูปฏิทินการศึกษา
                    </Button>
                ) : undefined}
            />

            <Card className="academic-period-summary-card">
                <Row>
                    <Col
                        xs={24}
                        md={8}
                        className="academic-period-metric"
                    >
                        <Statistic
                            title="นิสิตกำลังศึกษาที่ตรวจสอบทั้งหมด"
                            value={preview.total_students}
                            suffix="คน"
                            prefix={<TeamOutlined />}
                        />
                    </Col>
                    <Col
                        xs={24}
                        md={8}
                        className="academic-period-metric academic-period-metric-update"
                    >
                        <Statistic
                            title="จะได้รับการอัปเดต"
                            value={preview.update_students}
                            suffix="คน"
                            prefix={<SyncOutlined />}
                        />
                    </Col>
                    <Col
                        xs={24}
                        md={8}
                        className="academic-period-metric academic-period-metric-unchanged"
                    >
                        <Statistic
                            title="ข้อมูลไม่เปลี่ยนแปลง"
                            value={preview.unchanged_students}
                            suffix="คน"
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                </Row>
            </Card>

            <Card
                title="สรุปนิสิตตามปีการศึกษาที่เข้า (กำลังศึกษาอยู่เท่านั้น)"
                className="academic-period-table-card"
                extra={
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        loading={syncing}
                        disabled={
                            preview.calendar_status !== 'ready' ||
                            preview.ready_students === 0
                        }
                        onClick={() => setConfirmOpen(true)}
                    >
                        เริ่ม Sync
                    </Button>
                }
            >
                <Table<AcademicPeriodSummary>
                    rowKey="entry_year"
                    columns={summaryColumns}
                    dataSource={preview.summaries}
                    pagination={false}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'ไม่พบนิสิตที่กำลังศึกษา' }}
                />
            </Card>
        </Space>
    ) : (
        <Empty description="ไม่พบข้อมูลสำหรับตรวจสอบ" />
    )

    const historyPanel = (
        <Card className="academic-period-table-card">
            <Table<StudentAcademicPeriodSyncHistory>
                rowKey="id"
                columns={historyColumns}
                dataSource={history}
                loading={loading}
                scroll={{ x: 1100 }}
                locale={{ emptyText: 'ยังไม่มีประวัติการ Sync' }}
            />
        </Card>
    )

    return (
        <div className="student-page academic-period-page">
            <div className="page-title-section academic-period-title">
                <div>
                    <h1>ซิงค์ชั้นปีและภาคการศึกษานิสิต</h1>
                    <p>
                        คำนวณชั้นปีจากปีการศึกษาที่เข้า และภาคการศึกษาจากปฏิทินที่ Sync ไว้โดยอัตโนมัติ
                    </p>
                </div>
                <Space wrap>
                    <Button
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={() => void loadData()}
                    >
                        รีเฟรช
                    </Button>
                </Space>
            </div>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="โหลดข้อมูลไม่สำเร็จ"
                    description={error}
                    action={
                        <Button size="small" onClick={() => void loadData()}>
                            ลองใหม่
                        </Button>
                    }
                    className="academic-period-error"
                />
            )}

            {loading ? (
                <div
                    className="page-loading"
                    role="status"
                    aria-label="กำลังโหลดข้อมูล"
                >
                    <Spin size="large" />
                </div>
            ) : (
                <Tabs
                    items={[
                        {
                            key: 'preview',
                            label: (
                                <span><SyncOutlined /> ตรวจสอบและ Sync</span>
                            ),
                            children: previewPanel,
                        },
                        {
                            key: 'history',
                            label: (
                                <span><HistoryOutlined /> ประวัติการ Sync</span>
                            ),
                            children: historyPanel,
                        },
                    ]}
                />
            )}

            <Modal
                open={confirmOpen}
                title="ยืนยันการ Sync ชั้นปีและภาคการศึกษานิสิต"
                okText="ยืนยัน Sync"
                cancelText="ยกเลิก"
                okButtonProps={{
                    loading: syncing,
                    icon: <SyncOutlined />,
                }}
                closable={!syncing}
                maskClosable={!syncing}
                onOk={() => void handleSync()}
                onCancel={() => setConfirmOpen(false)}
            >
                <Alert
                    type="warning"
                    showIcon
                    message={`ระบบจะ Sync นิสิตที่มีปฏิทินการศึกษารองรับ ${preview?.ready_students.toLocaleString() ?? 0} คน`}
                    description="ชั้นปีและภาคการศึกษาจะถูกคำนวณใหม่จากฐานข้อมูลโดยอัตโนมัติ กรุณาตรวจสอบสรุปก่อนยืนยัน"
                />
            </Modal>

            <Modal
                open={selectedHistory !== null}
                title={`รายละเอียดประวัติ Sync #${selectedHistory?.id ?? ''}`}
                footer={null}
                width={920}
                onCancel={() => setSelectedHistory(null)}
            >
                {selectedHistory?.error_message && (
                    <Alert
                        type="error"
                        showIcon
                        message="สาเหตุที่ Sync ไม่สำเร็จ"
                        description={selectedHistory.error_message}
                        className="academic-period-history-error"
                    />
                )}
                {selectedHistory && (
                    <Space
                        direction="vertical"
                        size={16}
                        className="academic-period-history-detail"
                    >
                        <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2 }}
                            items={[
                                {
                                    key: 'period',
                                    label: 'ปี / ภาคการศึกษา',
                                    children:
                                        selectedHistory.academic_year &&
                                        selectedHistory.term_name_th
                                            ? `${selectedHistory.academic_year + 543} / ${selectedHistory.term_name_th}`
                                            : '-',
                                },
                                {
                                    key: 'status',
                                    label: 'สถานะ',
                                    children: (
                                        <Tag
                                            color={historyStatusDisplay[
                                                selectedHistory.status
                                            ].color}
                                        >
                                            {historyStatusDisplay[
                                                selectedHistory.status
                                            ].label}
                                        </Tag>
                                    ),
                                },
                                {
                                    key: 'reference_date',
                                    label: 'วันที่ใช้อ้างอิง',
                                    children: formatThaiDate(
                                        selectedHistory.reference_date,
                                    ),
                                },
                                {
                                    key: 'created_at',
                                    label: 'วันที่ Sync',
                                    children: formatThaiDateTime(
                                        selectedHistory.created_at,
                                    ),
                                },
                                {
                                    key: 'created_by',
                                    label: 'ดำเนินการโดย',
                                    children: selectedHistory.created_by || '-',
                                    span: 2,
                                },
                            ]}
                        />

                        <Row gutter={[12, 12]}>
                            <Col xs={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title="นิสิตทั้งหมด"
                                        value={selectedHistory.total_students}
                                        suffix="คน"
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title="อัปเดต"
                                        value={selectedHistory.updated_count}
                                        suffix="คน"
                                        valueStyle={{ color: appColors.info }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title="ข้อมูลไม่เปลี่ยนแปลง"
                                        value={selectedHistory.skipped_count}
                                        suffix="คน"
                                        valueStyle={{ color: appColors.success }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title="ไม่สำเร็จ"
                                        value={selectedHistory.failed_count}
                                        suffix="คน"
                                        valueStyle={{ color: appColors.error }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </Space>
                )}
            </Modal>
        </div>
    )
}
