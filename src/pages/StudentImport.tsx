import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import StudentImportHistoryTable from '../features/students/import/StudentImportHistoryTable'
import StudentImportPicker from '../features/students/import/StudentImportPicker'
import {
    downloadStudentImportBlob,
    parseStudentImportError,
} from '../features/students/import/studentImportUtils'
import {
    downloadStudentImportResult,
    getStudentImportHistory,
} from '../services/studentImportService'
import type { StudentImportHistory } from '../types/StudentImport'

function getDownloadErrorMessage(status: number | undefined, message: string) {
    const statusMessages: Record<number, string> = {
        401: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
        404: 'ไม่พบไฟล์ผลลัพธ์ของรายการ Import นี้',
        422: 'ไฟล์ผลลัพธ์ยังไม่พร้อมให้ดาวน์โหลด กรุณาลองใหม่ภายหลัง',
    }

    return statusMessages[status ?? 0] ?? message
}

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
            const parsedError = await parseStudentImportError(error)
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
            if (
                record.total_count === 0 ||
                ![
                    'completed',
                    'completed_with_errors',
                    'failed',
                ].includes(record.status)
            ) {
                return
            }

            try {
                setDownloadingId(record.id)
                const result = await downloadStudentImportResult(record.id)
                downloadStudentImportBlob(result.blob, result.fileName)
                message.success('ดาวน์โหลดไฟล์ผลลัพธ์สำเร็จ')
            } catch (error) {
                console.error('Unable to download student import result', error)
                const parsedError = await parseStudentImportError(error)
                message.error(
                    getDownloadErrorMessage(
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
