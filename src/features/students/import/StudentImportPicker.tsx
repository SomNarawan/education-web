import {
    CheckCircleOutlined,
    DeleteOutlined,
    FileExcelOutlined,
    InboxOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Progress,
    Space,
    Typography,
    Upload,
    message,
} from 'antd'
import type { UploadProps } from 'antd'
import { useRef, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { importStudents } from '../../../services/studentImportService'
import {
    parseStudentImportError,
    runStudentImportOnce,
    validateStudentImportFile,
} from './studentImportUtils'

const excelMimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface StudentImportPickerProps {
    onImportComplete: () => void | Promise<void>
}

export default function StudentImportPicker({
    onImportComplete,
}: StudentImportPickerProps) {
    const { logout } = useAuth()
    const importLock = useRef(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [uploadPercent, setUploadPercent] = useState(0)

    const handleImport = async () => {
        const validationError = validateStudentImportFile(selectedFile)

        if (validationError) {
            message.error(validationError)
            return
        }

        if (!selectedFile) return

        await runStudentImportOnce(importLock, async () => {
            let refreshHistory = false

            try {
                setImporting(true)
                setUploadPercent(0)
                const result = await importStudents(
                    selectedFile,
                    (progressEvent) => {
                        if (!progressEvent.total) return

                        setUploadPercent(
                            Math.min(
                                99,
                                Math.round(
                                    (progressEvent.loaded /
                                        progressEvent.total) *
                                        100,
                                ),
                            ),
                        )
                    },
                )

                setUploadPercent(100)
                const summary = result.summary
                const summaryMessage = `นำเข้าทั้งหมด ${summary.total} รายการ สำเร็จ ${summary.success} รายการ และไม่สำเร็จ ${summary.failed} รายการ`

                if (summary.failed > 0) {
                    message.warning(summaryMessage)
                } else {
                    message.success(summaryMessage)
                }

                setSelectedFile(null)
                refreshHistory = true
            } catch (error) {
                console.error('Unable to import students', error)
                const parsedError = await parseStudentImportError(error)
                message.error(parsedError.message)
                refreshHistory = parsedError.status !== 401

                if (parsedError.status === 401) {
                    logout()
                }
            } finally {
                if (refreshHistory) {
                    await onImportComplete()
                }

                setImporting(false)
            }
        })
    }

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
        const validationError = validateStudentImportFile(file)

        if (validationError) {
            message.error(validationError)
            return Upload.LIST_IGNORE
        }

        setSelectedFile(file)
        setUploadPercent(0)
        return false
    }

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
        <div className="student-import-inline-picker">
            <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    เลือกไฟล์ หรือลากไฟล์มาวางเพื่อ Import นักศึกษา
                </p>
                <p className="ant-upload-hint">
                    รองรับเฉพาะไฟล์ .xlsx ขนาดไม่เกิน 20 MB
                </p>
            </Upload.Dragger>

            {selectedFile && (
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
                        <Typography.Text
                            ellipsis={{ tooltip: selectedFile.name }}
                        >
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
                    type="primary"
                    size="large"
                    icon={<UploadOutlined />}
                    loading={importing}
                    disabled={!selectedFile || importing}
                    onClick={() => void handleImport()}
                >
                    {importing ? 'กำลังประมวลผล' : 'Import นักศึกษา'}
                </Button>
            </div>

            {importing && (
                <Alert
                    type="info"
                    showIcon
                    title="ระบบกำลังประมวลผลไฟล์ กรุณารอสักครู่"
                    description={
                        <Progress
                            percent={uploadPercent}
                            status="active"
                            aria-label={`อัปโหลดแล้ว ${uploadPercent} เปอร์เซ็นต์`}
                        />
                    }
                />
            )}
        </div>
    )
}
