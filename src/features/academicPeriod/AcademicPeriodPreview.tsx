import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
} from 'antd'
import type {
    AcademicPeriodSummary,
    StudentAcademicPeriodPreview as StudentAcademicPeriodPreviewData,
} from '../../types/StudentAcademicPeriodSync'
import { academicPeriodSummaryColumns } from './academicPeriodSync.columns'

interface AcademicPeriodPreviewProps {
    preview: StudentAcademicPeriodPreviewData | null
    syncing: boolean
    onOpenCalendar: () => void
    onStartSync: () => void
}

export default function AcademicPeriodPreview({
    preview,
    syncing,
    onOpenCalendar,
    onStartSync,
}: AcademicPeriodPreviewProps) {
    if (!preview) {
        return <Empty description="ไม่พบข้อมูลสำหรับตรวจสอบ" />
    }

    return (
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
                    <Button size="small" onClick={onOpenCalendar}>
                        ดูปฏิทินการศึกษา
                    </Button>
                ) : undefined}
            />

            <Card className="academic-period-summary-card">
                <Row>
                    <Col xs={24} md={8} className="academic-period-metric">
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
                        onClick={onStartSync}
                    >
                        เริ่ม Sync
                    </Button>
                }
            >
                <Table<AcademicPeriodSummary>
                    rowKey="entry_year"
                    columns={academicPeriodSummaryColumns}
                    dataSource={preview.summaries}
                    pagination={false}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'ไม่พบนิสิตที่กำลังศึกษา' }}
                />
            </Card>
        </Space>
    )
}
