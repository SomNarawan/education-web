import { SyncOutlined } from '@ant-design/icons'
import {
    Alert,
    Card,
    Col,
    Descriptions,
    Modal,
    Row,
    Space,
    Statistic,
    Tag,
} from 'antd'
import { appColors } from '../../config/appColors'
import type {
    StudentAcademicPeriodPreview,
    StudentAcademicPeriodSyncHistory,
} from '../../types/StudentAcademicPeriodSync'
import { formatThaiDate, formatThaiDateTime } from '../../utils/dateFormat'
import { academicPeriodHistoryStatusDisplay } from './academicPeriodSync.constants'

interface AcademicPeriodConfirmModalProps {
    open: boolean
    syncing: boolean
    preview: StudentAcademicPeriodPreview | null
    onConfirm: () => void
    onCancel: () => void
}

export function AcademicPeriodConfirmModal({
    open,
    syncing,
    preview,
    onConfirm,
    onCancel,
}: AcademicPeriodConfirmModalProps) {
    return (
        <Modal
            open={open}
            title="ยืนยันการ Sync ชั้นปีและภาคการศึกษานิสิต"
            okText="ยืนยัน Sync"
            cancelText="ยกเลิก"
            okButtonProps={{
                loading: syncing,
                icon: <SyncOutlined />,
            }}
            closable={!syncing}
            maskClosable={!syncing}
            onOk={onConfirm}
            onCancel={onCancel}
        >
            <Alert
                type="warning"
                showIcon
                message={`ระบบจะ Sync นิสิตที่มีปฏิทินการศึกษารองรับ ${preview?.ready_students.toLocaleString() ?? 0} คน`}
                description="ชั้นปีและภาคการศึกษาจะถูกคำนวณใหม่จากฐานข้อมูลโดยอัตโนมัติ กรุณาตรวจสอบสรุปก่อนยืนยัน"
            />
        </Modal>
    )
}

interface AcademicPeriodHistoryModalProps {
    history: StudentAcademicPeriodSyncHistory | null
    onClose: () => void
}

export function AcademicPeriodHistoryModal({
    history,
    onClose,
}: AcademicPeriodHistoryModalProps) {
    return (
        <Modal
            open={history !== null}
            title={`รายละเอียดประวัติ Sync #${history?.id ?? ''}`}
            footer={null}
            width={920}
            onCancel={onClose}
        >
            {history?.error_message && (
                <Alert
                    type="error"
                    showIcon
                    message="สาเหตุที่ Sync ไม่สำเร็จ"
                    description={history.error_message}
                    className="academic-period-history-error"
                />
            )}
            {history && (
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
                                key: 'student_type',
                                label: 'ประเภทนิสิต',
                                children: (
                                    <Tag color={history.is_international ? 'purple' : 'blue'}>
                                        {history.is_international ? 'นิสิตนานาชาติ' : 'นิสิตปกติ'}
                                    </Tag>
                                ),
                            },
                            {
                                key: 'period',
                                label: 'ปี / ภาคการศึกษา',
                                children:
                                    history.academic_year &&
                                    history.term_name_th
                                        ? `${history.academic_year + 543} / ${history.term_name_th}`
                                        : '-',
                            },
                            {
                                key: 'status',
                                label: 'สถานะ',
                                children: (
                                    <Tag
                                        color={
                                            academicPeriodHistoryStatusDisplay[
                                                history.status
                                            ].color
                                        }
                                    >
                                        {
                                            academicPeriodHistoryStatusDisplay[
                                                history.status
                                            ].label
                                        }
                                    </Tag>
                                ),
                            },
                            {
                                key: 'reference_date',
                                label: 'วันที่ใช้อ้างอิง',
                                children: formatThaiDate(history.reference_date),
                            },
                            {
                                key: 'created_at',
                                label: 'วันที่ Sync',
                                children: formatThaiDateTime(history.created_at),
                            },
                            {
                                key: 'created_by',
                                label: 'ดำเนินการโดย',
                                children: history.created_by || '-',
                                span: 2,
                            },
                        ]}
                    />

                    <Row gutter={[12, 12]}>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="นิสิตทั้งหมด"
                                    value={history.total_students}
                                    suffix="คน"
                                />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="อัปเดต"
                                    value={history.updated_count}
                                    suffix="คน"
                                    valueStyle={{ color: appColors.info }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="ข้อมูลไม่เปลี่ยนแปลง"
                                    value={history.skipped_count}
                                    suffix="คน"
                                    valueStyle={{ color: appColors.success }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="ไม่สำเร็จ"
                                    value={history.failed_count}
                                    suffix="คน"
                                    valueStyle={{ color: appColors.error }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Space>
            )}
        </Modal>
    )
}
