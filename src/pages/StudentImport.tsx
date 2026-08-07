import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileExcelOutlined,
    InboxOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Descriptions,
    Modal,
    Space,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CustomTable from '../components/custom/CustomTable'
import {
    downloadStudentImportErrors,
    getStudentImportHistory,
    importStudents,
} from '../services/studentImportService'
import type { ApiResponse } from '../types/ApiResponse'
import type { StudentImportHistory } from '../types/StudentImport'

const excelMimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface StatusDisplay {
    color: string
    label: string
}

function getStatusDisplay(status: string): StatusDisplay {
    const normalizedStatus = status.trim().toLowerCase()

    if (['success', 'completed'].includes(normalizedStatus)) {
        return { color: 'success', label: 'สำเร็จ' }
    }

    if (
        [
            'partial',
            'partial_success',
            'partially_success',
            'success_with_errors',
        ].includes(normalizedStatus)
    ) {
        return { color: 'warning', label: 'สำเร็จบางส่วน' }
    }

    if (['failed', 'error'].includes(normalizedStatus)) {
        return { color: 'error', label: 'ไม่สำเร็จ' }
    }

    if (['processing', 'in_progress'].includes(normalizedStatus)) {
        return { color: 'processing', label: 'กำลังประมวลผล' }
    }

    if (normalizedStatus === 'pending') {
        return { color: 'default', label: 'รอดำเนินการ' }
    }

    return { color: 'default', label: status || '-' }
}

function formatImportDate(value: string): string {
    const date = dayjs(value)
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : '-'
}

function getRequestErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data.message ?? error.message
    }

    return error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export default function StudentImport() {
    const [history, setHistory] = useState<StudentImportHistory[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [downloadingId, setDownloadingId] = useState<number | null>(null)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [detailRecord, setDetailRecord] =
        useState<StudentImportHistory | null>(null)

    const loadHistory = useCallback(async () => {
        try {
            setHistoryLoading(true)
            setHistory(await getStudentImportHistory())
        } catch (error) {
            console.error(error)
            message.error('โหลดประวัติการนำเข้านิสิตไม่สำเร็จ')
        } finally {
            setHistoryLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial API loading is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadHistory()
    }, [loadHistory])

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
        const isXlsx =
            file.name.toLowerCase().endsWith('.xlsx') &&
            (!file.type || file.type === excelMimeType)

        if (!isXlsx) {
            message.error('กรุณาเลือกไฟล์ Excel นามสกุล .xlsx เท่านั้น')
            return Upload.LIST_IGNORE
        }

        setFileList([file])
        return false
    }

    const handleImport = async () => {
        const file = fileList[0]?.originFileObj ?? fileList[0]

        if (!(file instanceof File)) {
            message.warning('กรุณาเลือกไฟล์ .xlsx ที่ต้องการนำเข้า')
            return
        }

        try {
            setImporting(true)
            const result = await importStudents(file)
            setFileList([])
            message.success(
                result.failed_count > 0
                    ? 'นำเข้านิสิตสำเร็จบางส่วน กรุณาตรวจสอบผลการนำเข้า'
                    : 'นำเข้านิสิตสำเร็จ',
            )
            await loadHistory()
        } catch (error) {
            console.error(error)
            message.error(`นำเข้านิสิตไม่สำเร็จ: ${getRequestErrorMessage(error)}`)
        } finally {
            setImporting(false)
        }
    }

    const handleDownloadErrors = async (record: StudentImportHistory) => {
        try {
            setDownloadingId(record.id)
            const blob = await downloadStudentImportErrors(record.id)
            const baseName = record.file_name.replace(/\.xlsx$/i, '')
            downloadBlob(blob, `${baseName}-errors.xlsx`)
        } catch (error) {
            console.error(error)
            message.error('ดาวน์โหลดรายการที่ผิดพลาดไม่สำเร็จ')
        } finally {
            setDownloadingId(null)
        }
    }

    const columns = useMemo<ColumnsType<StudentImportHistory>>(
        () => [
            {
                title: 'วันที่นำเข้า',
                dataIndex: 'imported_at',
                key: 'imported_at',
                width: 155,
                render: (value: string) => formatImportDate(value),
            },
            {
                title: 'ชื่อไฟล์',
                dataIndex: 'file_name',
                key: 'file_name',
                width: 200,
                ellipsis: true,
            },
            {
                title: 'จำนวนทั้งหมด',
                dataIndex: 'total_records',
                key: 'total_records',
                align: 'center',
                width: 120,
            },
            {
                title: 'ผลการนำเข้า',
                key: 'result',
                width: 260,
                render: (_, record) => (
                    <Space size={[8, 4]} wrap>
                        <Typography.Text type="success">
                            สำเร็จ {record.success_count}
                        </Typography.Text>
                        <Typography.Text>อัปเดต {record.updated_count}</Typography.Text>
                        <Typography.Text type="warning">
                            ข้าม {record.skipped_count}
                        </Typography.Text>
                        <Typography.Text type="danger">
                            ผิดพลาด {record.failed_count}
                        </Typography.Text>
                    </Space>
                ),
            },
            {
                title: 'สถานะ',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                width: 135,
                render: (status: string) => {
                    const display = getStatusDisplay(status)
                    return <Tag color={display.color}>{display.label}</Tag>
                },
            },
            {
                title: 'ผู้นำเข้า',
                dataIndex: 'imported_by',
                key: 'imported_by',
                width: 150,
            },
            {
                title: 'การดำเนินการ',
                key: 'actions',
                align: 'center',
                width: 210,
                render: (_, record) => (
                    <Space>
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => setDetailRecord(record)}
                        >
                            ดูรายละเอียด
                        </Button>
                        {record.failed_count > 0 && (
                            <Button
                                type="link"
                                danger
                                icon={<DownloadOutlined />}
                                loading={downloadingId === record.id}
                                onClick={() => void handleDownloadErrors(record)}
                            >
                                ดาวน์โหลดข้อผิดพลาด
                            </Button>
                        )}
                    </Space>
                ),
            },
        ],
        [downloadingId],
    )

    return (
        <div className="student-import-page">
            <div className="page-title-section">
                <div>
                    <h1>นำเข้านิสิต</h1>
                    <p>นำเข้าข้อมูลนิสิตจากไฟล์ Excel และตรวจสอบประวัติการนำเข้า</p>
                </div>
            </div>

            <Card
                className="student-import-card"
                title={
                    <Space>
                        <FileExcelOutlined />
                        <span>เลือกไฟล์สำหรับนำเข้า</span>
                    </Space>
                }
            >
                <Upload.Dragger
                    accept={`.xlsx,${excelMimeType}`}
                    beforeUpload={beforeUpload}
                    fileList={fileList}
                    maxCount={1}
                    multiple={false}
                    showUploadList={false}
                    disabled={importing}
                    onRemove={() => {
                        setFileList([])
                        return true
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        คลิกเพื่อเลือก หรือลากไฟล์มาวางบริเวณนี้
                    </p>
                    <p className="ant-upload-hint">รองรับเฉพาะไฟล์ .xlsx</p>
                </Upload.Dragger>

                {fileList[0] && (
                    <div
                        className="student-import-selected-file"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="student-import-selected-file-icon">
                            <FileExcelOutlined />
                        </div>
                        <div className="student-import-selected-file-info">
                            <Space size={6}>
                                <CheckCircleOutlined />
                                <strong>เลือกไฟล์แล้ว</strong>
                            </Space>
                            <Typography.Text ellipsis={{ tooltip: fileList[0].name }}>
                                {fileList[0].name}
                            </Typography.Text>
                        </div>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={importing}
                            aria-label={`ล้างไฟล์ ${fileList[0].name}`}
                            onClick={() => setFileList([])}
                        >
                            ล้างไฟล์
                        </Button>
                    </div>
                )}

                <div className="student-import-actions">
                    <Button
                        type="primary"
                        size="large"
                        icon={<UploadOutlined />}
                        loading={importing}
                        disabled={fileList.length === 0}
                        onClick={() => void handleImport()}
                    >
                        นำเข้า
                    </Button>
                </div>
            </Card>

            <div className="table-card student-import-history">
                <Typography.Title level={4}>ประวัติการนำเข้านิสิต</Typography.Title>
                <CustomTable<StudentImportHistory>
                    columns={columns}
                    dataSource={history}
                    loading={historyLoading}
                    rowKey="id"
                    searchPlaceholder="ค้นหาชื่อไฟล์ สถานะ หรือผู้นำเข้า..."
                    scroll={{ x: 1300 }}
                />
            </div>

            <Modal
                open={detailRecord !== null}
                title="รายละเอียดการนำเข้านิสิต"
                footer={null}
                destroyOnHidden
                width={720}
                onCancel={() => setDetailRecord(null)}
            >
                {detailRecord && (
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="วันที่นำเข้า">
                            {formatImportDate(detailRecord.imported_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label="ผู้นำเข้า">
                            {detailRecord.imported_by}
                        </Descriptions.Item>
                        <Descriptions.Item label="ชื่อไฟล์" span={2}>
                            {detailRecord.file_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="จำนวนทั้งหมด">
                            {detailRecord.total_records}
                        </Descriptions.Item>
                        <Descriptions.Item label="สถานะ">
                            <Tag color={getStatusDisplay(detailRecord.status).color}>
                                {getStatusDisplay(detailRecord.status).label}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="นำเข้าสำเร็จ">
                            {detailRecord.success_count}
                        </Descriptions.Item>
                        <Descriptions.Item label="อัปเดต">
                            {detailRecord.updated_count}
                        </Descriptions.Item>
                        <Descriptions.Item label="ข้าม">
                            {detailRecord.skipped_count}
                        </Descriptions.Item>
                        <Descriptions.Item label="ไม่สำเร็จ">
                            {detailRecord.failed_count}
                        </Descriptions.Item>
                        {detailRecord.error_message && (
                            <Descriptions.Item label="ข้อผิดพลาด" span={2}>
                                <Typography.Text type="danger">
                                    {detailRecord.error_message}
                                </Typography.Text>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    )
}
