import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Empty, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/th'
import { useMemo } from 'react'
import CustomTable from '../../../components/custom/CustomTable'
import type {
    StudentImportHistory,
    StudentImportStatus,
} from '../../../types/StudentImport'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(buddhistEra)

const bangkokTimeZone = 'Asia/Bangkok'

const statusDisplay: Record<
    StudentImportStatus,
    { color: string; label: string }
> = {
    processing: { color: 'processing', label: 'กำลังนำเข้า' },
    completed: { color: 'success', label: 'สำเร็จ' },
    completed_with_errors: { color: 'warning', label: 'สำเร็จบางส่วน' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}

interface StudentImportHistoryTableProps {
    data: StudentImportHistory[]
    loading: boolean
    downloadingId: number | null
    onDownload: (record: StudentImportHistory) => void
}

function formatImportDate(value: string): string {
    const hasExplicitTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    const date = hasExplicitTimeZone
        ? dayjs(value).tz(bangkokTimeZone)
        : dayjs.tz(value, bangkokTimeZone)

    return date.isValid()
        ? date.locale('th').format('D MMM BBBB เวลา HH:mm น.')
        : '-'
}

function getDownloadButton(record: StudentImportHistory) {
    if (record.status === 'processing') {
        return {
            disabled: true,
            label: 'กำลังประมวลผล',
            icon: <LoadingOutlined />,
        }
    }

    if (record.total_count === 0) {
        return {
            disabled: true,
            label: 'ไม่มีไฟล์ผลลัพธ์',
            icon: <DownloadOutlined />,
        }
    }

    const canDownload =
        record.status === 'completed' ||
        record.status === 'completed_with_errors' ||
        record.status === 'failed'

    return {
        disabled: !canDownload,
        label: 'ดาวน์โหลดผลลัพธ์',
        icon: <DownloadOutlined />,
    }
}

export default function StudentImportHistoryTable({
    data,
    loading,
    downloadingId,
    onDownload,
}: StudentImportHistoryTableProps) {
    const columns = useMemo<ColumnsType<StudentImportHistory>>(
        () => [
            {
                title: 'ลำดับ',
                key: 'sequence',
                width: 80,
                align: 'center',
                render: (_, __, index) => index + 1,
            },
            {
                title: 'ชื่อไฟล์',
                dataIndex: 'file_name',
                key: 'file_name',
                width: 220,
                ellipsis: true,
            },
            {
                title: 'วันที่นำเข้า',
                dataIndex: 'started_at',
                key: 'started_at',
                width: 210,
                render: (value: string) => formatImportDate(value),
            },
            {
                title: 'ผู้นำเข้า',
                dataIndex: 'imported_by',
                key: 'imported_by',
                width: 160,
                ellipsis: true,
            },
            {
                title: 'จำนวนทั้งหมด',
                dataIndex: 'total_count',
                key: 'total_count',
                width: 125,
                align: 'center',
                render: (value: number) => value.toLocaleString('th-TH'),
            },
            {
                title: 'สำเร็จ',
                dataIndex: 'success_count',
                key: 'success_count',
                width: 100,
                align: 'center',
                render: (value: number) => value.toLocaleString('th-TH'),
            },
            {
                title: 'ไม่สำเร็จ',
                dataIndex: 'failed_count',
                key: 'failed_count',
                width: 105,
                align: 'center',
                render: (value: number) => value.toLocaleString('th-TH'),
            },
            {
                title: 'สถานะ',
                dataIndex: 'status',
                key: 'status',
                width: 135,
                align: 'center',
                render: (status: StudentImportStatus) => {
                    const display = statusDisplay[status]

                    return display ? (
                        <Tag color={display.color}>{display.label}</Tag>
                    ) : (
                        <Tag>{status || '-'}</Tag>
                    )
                },
            },
            {
                title: 'ผลลัพธ์',
                key: 'action',
                width: 190,
                align: 'center',
                fixed: 'right',
                render: (_, record) => {
                    const downloadButton = getDownloadButton(record)

                    return (
                        <Button
                            type="link"
                            icon={downloadButton.icon}
                            disabled={downloadButton.disabled}
                            loading={downloadingId === record.id}
                            onClick={() => onDownload(record)}
                        >
                            {downloadButton.label}
                        </Button>
                    )
                },
            },
        ],
        [downloadingId, onDownload],
    )

    return (
        <CustomTable<StudentImportHistory>
            rowKey="id"
            showNo={false}
            columns={columns}
            dataSource={data}
            loading={loading}
            searchPlaceholder="ค้นหาประวัติจากชื่อไฟล์หรือผู้นำเข้า"
            scroll={{ x: 1325 }}
            locale={{
                emptyText: (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ยังไม่มีประวัติการ Import นักศึกษา"
                    />
                ),
            }}
        />
    )
}
