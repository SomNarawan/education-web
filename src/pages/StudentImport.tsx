import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import StudentImportHistoryTable from '../features/students/import/StudentImportHistoryTable'
import StudentImportPicker from '../features/students/import/StudentImportPicker'
import {
    canDownloadImportResult,
    downloadBlob,
    getImportResultDownloadErrorMessage,
    parseImportError,
} from '../features/imports/importUtils'
import {
    downloadStudentImportResult,
    getStudentImportHistory,
} from '../services/studentImportService'
import type { StudentImportHistory } from '../types/StudentImport'

export default function StudentImport() {
    const [history, setHistory] = useState<StudentImportHistory[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<number | null>(null)

    const loadHistory = useCallback(async () => {
        try {
            setHistoryLoading(true)
            setHistoryError(null)
            const importHistory = await getStudentImportHistory()

            // API เรียงรายการล่าสุดมาก่อนอยู่แล้ว จึงคงลำดับตาม response
            setHistory(importHistory)
        } catch (error) {
            console.error('Unable to load student import history', error)
            const parsedError = await parseImportError(
                error,
                'โหลดประวัติการ Import นักศึกษาไม่สำเร็จ',
            )
            setHistoryError(parsedError.message)
        } finally {
            setHistoryLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial API loading is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadHistory()
    }, [loadHistory])

    const handleDownload = useCallback(
        async (record: StudentImportHistory) => {
            if (!canDownloadImportResult(record)) {
                return
            }

            try {
                setDownloadingId(record.id)
                const result = await downloadStudentImportResult(record.id)
                downloadBlob(result.blob, result.fileName)
                message.success('ดาวน์โหลดไฟล์ผลลัพธ์สำเร็จ')
            } catch (error) {
                console.error('Unable to download student import result', error)
                const parsedError = await parseImportError(
                    error,
                    'ดาวน์โหลดไฟล์ผลลัพธ์ไม่สำเร็จ',
                )
                message.error(
                    getImportResultDownloadErrorMessage(
                        parsedError.status,
                        parsedError.message,
                    ),
                )
            } finally {
                setDownloadingId(null)
            }
        },
        [],
    )

    return (
        <div className="student-import-page">
            <div className="page-title-section">
                <div>
                    <Typography.Title level={1}>
                        ประวัติการ Import นักศึกษา
                    </Typography.Title>
                    <Typography.Paragraph>
                        ตรวจสอบสถานะและดาวน์โหลดผลลัพธ์การนำเข้าข้อมูลนักศึกษา
                    </Typography.Paragraph>
                </div>
            </div>

            <Card className="student-import-card">
                <StudentImportPicker
                    onImportComplete={loadHistory}
                />
            </Card>

            <Card className="student-import-card student-import-history">
                <div className="student-import-history-heading">
                    <Typography.Title level={4}>
                        รายการ Import ล่าสุด
                    </Typography.Title>
                    <Button
                        icon={<ReloadOutlined />}
                        loading={historyLoading}
                        onClick={() => void loadHistory()}
                    >
                        รีเฟรช
                    </Button>
                </div>

                {historyError && (
                    <Alert
                        className="student-import-history-error"
                        type="error"
                        showIcon
                        title="โหลดประวัติการ Import ไม่สำเร็จ"
                        description={historyError}
                        action={
                            <Button
                                danger
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => void loadHistory()}
                            >
                                รีเฟรช
                            </Button>
                        }
                    />
                )}

                <StudentImportHistoryTable
                    data={history}
                    loading={historyLoading}
                    downloadingId={downloadingId}
                    onDownload={(record) => void handleDownload(record)}
                />
            </Card>
        </div>
    )
}
