import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Button, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { appColors } from '../../config/appColors'
import type { SyncStatus, SyncTableRecord } from '../../types/SyncData'

const statusDisplay: Record<
    SyncStatus,
    { color: string; label: string }
> = {
    waiting: { color: 'default', label: 'ยังไม่ Sync' },
    running: { color: 'processing', label: 'กำลัง Sync' },
    success: { color: 'success', label: 'สำเร็จ' },
    partial_success: { color: 'warning', label: 'สำเร็จบางส่วน' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}

export function createSyncResultColumns(
    onViewResult: (record: SyncTableRecord) => void,
): ColumnsType<SyncTableRecord> {
    return [
        {
            title: 'ประเภทข้อมูล',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'จำนวนที่เพิ่ม',
            dataIndex: 'inserted',
            key: 'inserted',
            align: 'center',
            render: (value: number | null) => value ?? '-',
        },
        {
            title: 'จำนวนที่แก้ไข',
            dataIndex: 'updated',
            key: 'updated',
            align: 'center',
            render: (value: number | null) => value ?? '-',
        },
        {
            title: 'จำนวนที่ปิดใช้งาน',
            dataIndex: 'inactivated',
            key: 'inactivated',
            align: 'center',
            render: (value: number | null) => value ?? '-',
        },
        {
            title: 'จำนวนที่ข้าม',
            dataIndex: 'skipped',
            key: 'skipped',
            align: 'center',
            render: (value: number | null) => value ?? '-',
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status: SyncStatus) => {
                const display = statusDisplay[status]
                return <Tag color={display.color}>{display.label}</Tag>
            },
        },
        {
            title: 'สาเหตุ',
            dataIndex: 'resultMessage',
            key: 'resultMessage',
            width: 90,
            align: 'center',
            render: (value: string | null, record) => {
                if (!value) return '-'

                const isFailed = record.status === 'failed'

                return (
                    <Tooltip title="ดูรายละเอียดผลการ Sync">
                        <Button
                            className="student-import-reason-button"
                            type="text"
                            danger={isFailed}
                            size="small"
                            aria-label={
                                `ดูรายละเอียดผลการ Sync ${record.label}`
                            }
                            icon={<ExclamationCircleOutlined />}
                            onClick={() => onViewResult(record)}
                            style={isFailed
                                ? undefined
                                : { color: appColors.warning }}
                        />
                    </Tooltip>
                )
            },
        },
        {
            title: 'Sync ล่าสุด',
            dataIndex: 'syncedAt',
            key: 'syncedAt',
            align: 'center',
            render: (value: string | null) => value ?? '-',
        },
    ]
}
