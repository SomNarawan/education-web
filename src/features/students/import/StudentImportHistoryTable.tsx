import {
    DownloadOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
} from '@ant-design/icons'
import { Button, Empty, Modal, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import CustomTable from '../../../components/custom/CustomTable'
import type {
    StudentImportHistory,
    StudentImportStatus,
} from '../../../types/StudentImport'
import { formatThaiDateTime } from '../../../utils/dateFormat'

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
    const [errorRecord, setErrorRecord] = useState<StudentImportHistory | null>(
        null,
    )
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
                render: (value: string) => formatThaiDateTime(value),
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
                title: 'สาเหตุ',
                dataIndex: 'error_message',
                key: 'error_message',
                width: 90,
                align: 'center',
                render: (value: string | null, record) =>
                    value ? (
                        <Button
                            className={'student-import-reason-button'}
                            type="text"
                            danger
                            icon={<ExclamationCircleOutlined />}
                            aria-label={`ดูสาเหตุที่ Import ไฟล์ ${record.file_name} ไม่สำเร็จ`}
                            onClick={() => setErrorRecord(record)}
                        />
                    ) : (
                        '-'
                    ),
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
        <>
            <CustomTable<StudentImportHistory>
                rowKey="id"
                showNo={false}
                columns={columns}
                dataSource={data}
                loading={loading}
                searchPlaceholder="ค้นหาประวัติจากชื่อไฟล์หรือผู้นำเข้า"
                scroll={{ x: 1415 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="ยังไม่มีประวัติการ Import นักศึกษา"
                        />
                    ),
                }}
            />

            <Modal
                open={errorRecord !== null}
                title="รายละเอียดข้อผิดพลาด"
                footer={null}
                onCancel={() => setErrorRecord(null)}
            >
                <Typography.Paragraph
                    style={{
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                    }}
                >
                    {errorRecord?.error_message ||
                        'ไม่มีรายละเอียดข้อผิดพลาด'}
                </Typography.Paragraph>
            </Modal>
        </>
    )
}
