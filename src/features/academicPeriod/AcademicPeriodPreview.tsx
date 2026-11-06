import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag } from 'antd'
import type {
    AcademicPeriodSummary,
    StudentAcademicPeriodPreview as PreviewData,
    StudentAcademicPeriodPreviewGroup,
} from '../../types/StudentAcademicPeriodSync'
import { academicPeriodSummaryColumns } from './academicPeriodSync.columns'

interface Props {
    preview: PreviewData | null
    syncing: boolean
    onOpenCalendar: () => void
    onStartSync: () => void
}

function CalendarGroup({
    group,
    onOpenCalendar,
}: {
    group: StudentAcademicPeriodPreviewGroup
    onOpenCalendar: () => void
}) {
    const ready = group.calendar_status === 'ready'
    const notRequired = group.calendar_status === 'not_required'
    const typeLabel = group.is_international ? 'นิสิตนานาชาติ' : 'นิสิตปกติ'

    return (
        <Card
            title={typeLabel}
            extra={<Tag color={group.is_international ? 'purple' : 'blue'}>{typeLabel}</Tag>}
            className="academic-period-table-card"
        >
            <Space direction="vertical" size={12} className="academic-period-stack">
                <Alert
                    showIcon
                    type={ready ? 'success' : notRequired ? 'info' : 'error'}
                    icon={ready ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                    message={ready
                        ? `พร้อม Sync · ปีการศึกษา ${group.academic_year_be ?? '-'} · ${group.term_name_th ?? '-'}`
                        : group.calendar_message}
                    description={ready ? group.calendar_message : undefined}
                    action={!ready && !notRequired ? (
                        <Button size="small" onClick={onOpenCalendar}>
                            ดูปฏิทินการศึกษา
                        </Button>
                    ) : undefined}
                />
                <Table<AcademicPeriodSummary>
                    rowKey="entry_year"
                    columns={academicPeriodSummaryColumns}
                    dataSource={group.summaries}
                    pagination={false}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'ไม่พบนิสิตในกลุ่มนี้' }}
                />
            </Space>
        </Card>
    )
}

export default function AcademicPeriodPreview({
    preview,
    syncing,
    onOpenCalendar,
    onStartSync,
}: Props) {
    if (!preview) return <Empty description="ไม่พบข้อมูลสำหรับตรวจสอบ" />

    const canSync = preview.groups.some(
        (group) => group.calendar_status === 'ready' && group.ready_students > 0,
    )

    return (
        <Space direction="vertical" size={16} className="academic-period-stack">
            <Card
                className="academic-period-summary-card"
                extra={(
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        loading={syncing}
                        disabled={!canSync}
                        onClick={onStartSync}
                    >
                        เริ่ม Sync
                    </Button>
                )}
            >
                <Row>
                    <Col xs={24} md={8} className="academic-period-metric">
                        <Statistic title="นิสิตที่ตรวจสอบทั้งหมด" value={preview.total_students} suffix="คน" prefix={<TeamOutlined />} />
                    </Col>
                    <Col xs={24} md={8} className="academic-period-metric academic-period-metric-update">
                        <Statistic title="จะได้รับการอัปเดต" value={preview.update_students} suffix="คน" prefix={<SyncOutlined />} />
                    </Col>
                    <Col xs={24} md={8} className="academic-period-metric academic-period-metric-unchanged">
                        <Statistic title="ข้อมูลไม่เปลี่ยนแปลง" value={preview.unchanged_students} suffix="คน" prefix={<CheckCircleOutlined />} />
                    </Col>
                </Row>
            </Card>

            {preview.groups.map((group) => (
                <CalendarGroup
                    key={group.calendar_key}
                    group={group}
                    onOpenCalendar={onOpenCalendar}
                />
            ))}
        </Space>
    )
}
