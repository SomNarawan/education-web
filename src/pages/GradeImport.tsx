import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    FileExcelOutlined,
    InboxOutlined,
    ReloadOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    Empty,
    Form,
    Modal,
    Progress,
    Row,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd'
import type { UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ListOfValueSelect from '../components/custom/ListOfValueSelect'
import { renderRequiredFormMark } from '../components/custom/RequiredFormMark'
import {
    downloadGradeImportTemplate,
    getGradeImportHistory,
    importGrades,
} from '../services/gradeImportService'
import {
    downloadStudentImportBlob,
} from '../features/students/import/studentImportUtils'
import { getCurriculums } from '../services/listOfValueService'
import type {
    GradeImportHistory,
    GradeImportStatus,
} from '../types/GradeImport'
import type { Curriculum } from '../types/MasterData'
import { formatThaiDateTime } from '../utils/dateFormat'

const MAX_GRADE_IMPORT_FILE_SIZE = 20 * 1024 * 1024
const excelMimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const statusDisplay: Record<
    GradeImportStatus,
    { color: string; label: string }
> = {
    queued: { color: 'default', label: 'รอประมวลผล' },
    processing: { color: 'processing', label: 'กำลังประมวลผล' },
    completed: { color: 'success', label: 'สำเร็จ' },
    completed_with_errors: { color: 'warning', label: 'สำเร็จบางส่วน' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}

interface ApiErrorBody {
    message?: string
    errors?: Record<string, string | string[]>
}

function validateGradeImportFile(file: File | null): string | null {
    if (!file) return 'กรุณาเลือกไฟล์ผลการเรียนที่ต้องการนำเข้า'

    if (!/\.xlsx$/i.test(file.name)) {
        return 'รองรับเฉพาะไฟล์นามสกุล .xlsx เท่านั้น'
    }

    if (file.size > MAX_GRADE_IMPORT_FILE_SIZE) {
        return 'ไฟล์ต้องมีขนาดไม่เกิน 20 MB'
    }

    return null
}

function getErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError<ApiErrorBody>(error)) {
        return error instanceof Error && error.message
            ? error.message
            : fallback
    }

    const body = error.response?.data
    const validationErrors = body?.errors
        ? Object.values(body.errors).flatMap((item) => item)
        : []

    return validationErrors[0] ?? body?.message ?? fallback
}

function getProgress(record: GradeImportHistory) {
    if (record.status === 'completed') return 100
    if (record.total_count === 0) return 0

    return Math.min(
        100,
        Math.round(
            ((record.success_count + record.failed_count) /
                record.total_count) *
                100,
        ),
    )
}

function getProgressStatus(status: GradeImportStatus) {
    if (status === 'completed') return 'success' as const
    if (status === 'failed') return 'exception' as const
    if (status === 'processing') return 'active' as const

    return 'normal' as const
}

export default function GradeImport() {
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<
        number | undefined
    >()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [history, setHistory] = useState<GradeImportHistory[]>([])
    const [curriculumsLoading, setCurriculumsLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [templateDownloading, setTemplateDownloading] = useState(false)
    const [errorRecord, setErrorRecord] = useState<GradeImportHistory | null>(
        null,
    )

    const loadHistory = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setHistoryLoading(true)
            setHistory(await getGradeImportHistory())
        } catch (error) {
            console.error('Unable to load grade import history', error)
            if (showLoading) {
                message.error(
                    getErrorMessage(
                        error,
                        'โหลดประวัติการนำเข้าเกรดไม่สำเร็จ',
                    ),
                )
            }
        } finally {
            if (showLoading) setHistoryLoading(false)
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadCurriculums = async () => {
            try {
                setCurriculumsLoading(true)
                const data = await getCurriculums()
                if (!cancelled) setCurriculums(data)
            } catch (error) {
                if (!cancelled) {
                    console.error('Unable to load curriculums', error)
                    message.error('โหลดข้อมูลหลักสูตรไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) setCurriculumsLoading(false)
            }
        }

        void loadCurriculums()
        const historyTimer = window.setTimeout(() => {
            void loadHistory()
        }, 0)

        return () => {
            cancelled = true
            window.clearTimeout(historyTimer)
        }
    }, [loadHistory])

    const hasRunningJobs = history.some(
        (item) => item.status === 'queued' || item.status === 'processing',
    )

    useEffect(() => {
        if (!hasRunningJobs) return

        const intervalId = window.setInterval(() => {
            void loadHistory(false)
        }, 3000)

        return () => window.clearInterval(intervalId)
    }, [hasRunningJobs, loadHistory])

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
        const validationError = validateGradeImportFile(file)

        if (validationError) {
            message.error(validationError)
            return Upload.LIST_IGNORE
        }

        setSelectedFile(file)
        return false
    }

    const handleDownloadTemplate = async () => {
        try {
            setTemplateDownloading(true)
            const blob = await downloadGradeImportTemplate()
            downloadStudentImportBlob(blob, 'Import Grade Template.xlsx')
            message.success('ดาวน์โหลดไฟล์ Template สำเร็จ')
        } catch (error) {
            console.error('Unable to download grade import template', error)
            message.error(
                getErrorMessage(error, 'ไม่สามารถดาวน์โหลดไฟล์ Template ได้'),
            )
        } finally {
            setTemplateDownloading(false)
        }
    }

    const handleImport = async () => {
        const validationError = validateGradeImportFile(selectedFile)

        if (validationError) {
            message.error(validationError)
            return
        }

        const curriculum = curriculums.find(
            (item) => item.id === selectedCurriculumId,
        )

        if (!curriculum || !selectedFile) {
            message.error('กรุณาเลือกหลักสูตรและไฟล์ให้ครบถ้วน')
            return
        }

        try {
            setImporting(true)
            await importGrades(
                selectedFile,
                curriculum.id,
                curriculum.name_th,
            )
            setSelectedFile(null)
            message.success('เพิ่มงานนำเข้าเกรดลงในคิวแล้ว')
            await loadHistory(false)
        } catch (error) {
            console.error('Unable to import grades', error)
            message.error(
                getErrorMessage(error, 'ไม่สามารถเพิ่มงานนำเข้าเกรดได้'),
            )
        } finally {
            setImporting(false)
        }
    }

    const columns = useMemo<ColumnsType<GradeImportHistory>>(
        () => [
            {
                title: 'ชื่อไฟล์',
                dataIndex: 'file_name',
                key: 'file_name',
                width: 210,
            },
            {
                title: 'หลักสูตร',
                dataIndex: 'curriculum_code',
                key: 'curriculum_code',
                width: 240,
                ellipsis: true,
            },
            {
                title: 'วันที่เริ่มงาน',
                dataIndex: 'started_at',
                key: 'started_at',
                width: 165,
                render: (value: string) => formatThaiDateTime(value),
            },
            {
                title: 'ความคืบหน้า',
                key: 'progress',
                width: 210,
                render: (_, record) => (
                    <Progress
                        percent={getProgress(record)}
                        status={getProgressStatus(record.status)}
                    />
                ),
            },
            {
                title: 'สำเร็จ/ทั้งหมด',
                key: 'summary',
                width: 115,
                align: 'center',
                render: (_, record) =>
                    `${record.success_count.toLocaleString('th-TH')}/${record.total_count.toLocaleString('th-TH')}`,
            },
            {
                title: 'สถานะ',
                dataIndex: 'status',
                key: 'status',
                width: 125,
                align: 'center',
                render: (status: GradeImportStatus) => {
                    const display = statusDisplay[status]
                    return <Tag color={display?.color}>{display?.label ?? status}</Tag>
                },
            },
            {
                title: 'สาเหตุ',
                dataIndex: 'error_message',
                key: 'error_message',
                width: 70,
                align: 'center',
                fixed: 'right',
                render: (value: string | null, record) =>
                    value ? (
                        <Button
                            type="text"
                            danger
                            icon={<ExclamationCircleOutlined />}
                            aria-label={`ดูข้อผิดพลาดของไฟล์ ${record.file_name}`}
                            onClick={() => setErrorRecord(record)}
                        />
                    ) : (
                        '-'
                    ),
            },
        ],
        [],
    )

    const uploadProps: UploadProps = {
        accept: `.xlsx,${excelMimeType}`,
        beforeUpload,
        disabled: importing,
        fileList: [],
        maxCount: 1,
        multiple: false,
        showUploadList: false,
    }

    return (
        <div className="student-import-page grade-import-page">
            <div className="page-title-section">
                <div>
                    <Typography.Title level={1}>นำเข้าเกรด</Typography.Title>
                    <Typography.Paragraph>
                        ระบบจะประมวลผลแบบเบื้องหลังและสร้างข้อมูลผลการเรียนแยกตามรหัสนิสิต
                    </Typography.Paragraph>
                </div>
            </div>

            <Card className="student-import-card">
                <div className="student-import-inline-picker">
                    <Form layout="vertical" requiredMark={renderRequiredFormMark}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item label="หลักสูตร" required>
                                    <ListOfValueSelect
                                        allowClear
                                        showSearch
                                        optionFilterProp="label"
                                        loading={curriculumsLoading}
                                        disabled={importing}
                                        placeholder="เลือกหลักสูตร"
                                        value={selectedCurriculumId}
                                        options={curriculums.map((item) => ({
                                            label: item.name_th,
                                            value: item.id,
                                        }))}
                                        onChange={setSelectedCurriculumId}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Upload.Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            เลือกไฟล์ หรือลากไฟล์มาวางเพื่อนำเข้าเกรด
                        </p>
                        <p className="ant-upload-hint">
                            รองรับเฉพาะไฟล์ .xlsx ขนาดไม่เกิน 20 MB
                        </p>
                    </Upload.Dragger>

                    {selectedFile && (
                        <div className="student-import-selected-file" role="status">
                            <div className="student-import-selected-file-icon">
                                <FileExcelOutlined />
                            </div>
                            <div className="student-import-selected-file-info">
                                <Space size={6}>
                                    <CheckCircleOutlined />
                                    <strong>เลือกไฟล์แล้ว</strong>
                                </Space>
                                <Typography.Text ellipsis={{ tooltip: selectedFile.name }}>
                                    {selectedFile.name}
                                </Typography.Text>
                            </div>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={importing}
                                onClick={() => setSelectedFile(null)}
                            >
                                ลบไฟล์
                            </Button>
                        </div>
                    )}

                    <div className="student-import-actions">
                        <Button
                            size="large"
                            icon={<DownloadOutlined />}
                            loading={templateDownloading}
                            disabled={importing}
                            onClick={() => void handleDownloadTemplate()}
                        >
                            ดาวน์โหลดไฟล์ Template
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<UploadOutlined />}
                            loading={importing}
                            disabled={
                                !selectedCurriculumId ||
                                !selectedFile ||
                                importing
                            }
                            onClick={() => void handleImport()}
                        >
                            {importing ? 'กำลังอัปโหลด' : 'Import เกรด'}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="student-import-card student-import-history">
                <div className="student-import-history-heading">
                    <div>
                        <Typography.Title level={4}>งานนำเข้าเกรด</Typography.Title>
                        <Typography.Text type="secondary">
                            หนึ่งรายการนับความสำเร็จตามจำนวนนิสิตที่สร้างไฟล์ครบถ้วน
                        </Typography.Text>
                    </div>
                    <Button
                        icon={<ReloadOutlined />}
                        loading={historyLoading}
                        onClick={() => void loadHistory()}
                    >
                        รีเฟรช
                    </Button>
                </div>

                <Table<GradeImportHistory>
                    rowKey="id"
                    columns={columns}
                    dataSource={history}
                    loading={historyLoading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    tableLayout="fixed"
                    scroll={{ x: 1140 }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="ยังไม่มีงานนำเข้าเกรด"
                            />
                        ),
                    }}
                />
            </Card>

            <Modal
                open={errorRecord !== null}
                title="รายละเอียดข้อผิดพลาด"
                footer={null}
                onCancel={() => setErrorRecord(null)}
            >
                <Typography.Paragraph
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                    {errorRecord?.error_message ?? 'ไม่มีรายละเอียดข้อผิดพลาด'}
                </Typography.Paragraph>
            </Modal>
        </div>
    )
}
