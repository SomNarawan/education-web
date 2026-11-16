import { EyeOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Form,
    Modal,
    Select,
    Space,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomTable from '../components/custom/CustomTable'
import { appColors } from '../config/appColors'
import {
    getAcademicCalendarSyncOutcome,
} from '../features/sync/academicCalendarSyncOutcome'
import {
    mapHistoryToRecords,
    mapSyncResult,
} from '../features/sync/syncData'
import {
    getRequestErrorMessage,
    getSyncHistoryError,
} from '../features/sync/syncError'
import { createSyncResultColumns } from '../features/sync/syncResultColumns'
import { useAuth } from '../hooks/useAuth'
import { syncAcademicCalendars } from '../services/academicCalendarService'
import {
    getSyncHistory,
    syncMasterData,
} from '../services/syncService'
import type {
    SyncTableDataType,
    SyncTableRecord,
} from '../types/SyncData'
import {
    createAcademicYearOptions,
    createAcademicYearRange,
} from '../utils/academicYear'

const currentAcademicYear = new Date().getFullYear()
const academicYearOptions = createAcademicYearOptions(
    createAcademicYearRange(currentAcademicYear, 9, 1),
)

export default function SyncData() {
    const { clearSession } = useAuth()
    const navigate = useNavigate()
    const [syncingType, setSyncingType] =
        useState<SyncTableDataType | null>(null)
    const [resultRecord, setResultRecord] =
        useState<SyncTableRecord | null>(null)
    const [records, setRecords] = useState<SyncTableRecord[]>(() =>
        mapHistoryToRecords([]),
    )
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const [selectedAcademicYears, setSelectedAcademicYears] = useState<number[]>(
        [currentAcademicYear],
    )
    const [academicYearValidationError, setAcademicYearValidationError] =
        useState(false)

    const loadSyncHistory = useCallback(async (
        showError = true,
        clearRecordsOnError = true,
    ) => {
        setHistoryLoading(true)
        setHistoryError(null)

        try {
            const history = await getSyncHistory()
            const historyRecords = mapHistoryToRecords(history)
            setRecords(historyRecords)
            return historyRecords
        } catch (error) {
            console.error(error)
            const requestError = getSyncHistoryError(error)
            if (clearRecordsOnError) {
                setRecords(mapHistoryToRecords([]))
            }
            setHistoryError(requestError.message)

            if (showError) {
                message.error(requestError.message)
            }

            if (requestError.unauthorized) {
                clearSession()
            }

            return null
        } finally {
            setHistoryLoading(false)
        }
    }, [clearSession])

    useEffect(() => {
        // Initial API synchronization is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadSyncHistory()
    }, [loadSyncHistory])

    const updateRecord = (
        dataType: SyncTableDataType,
        values: Partial<SyncTableRecord>,
    ) => {
        setRecords((currentRecords) =>
            currentRecords.map((record) =>
                record.key === dataType
                    ? { ...record, ...values }
                    : record,
            ),
        )
    }

    const handleSync = async (dataType: SyncTableDataType) => {
        if (
            dataType === 'academic-calendar' &&
            selectedAcademicYears.length === 0
        ) {
            setAcademicYearValidationError(true)
            message.warning('กรุณาเลือกปีการศึกษาอย่างน้อย 1 ปี')
            return
        }

        if (dataType === 'academic-calendar') {
            setAcademicYearValidationError(false)
        }

        try {
            setSyncingType(dataType)

            updateRecord(dataType, {
                status: 'running',
                resultMessage: null,
            })

            const result = dataType === 'academic-calendar'
                ? await syncAcademicCalendars(selectedAcademicYears)
                : await syncMasterData(dataType)
            if (dataType === 'academic-calendar') {
                const outcome = getAcademicCalendarSyncOutcome(result)
                updateRecord(dataType, outcome.record)
                message[outcome.notice.type](outcome.notice.message)
                return
            }

            const syncRecord = mapSyncResult(result)
            updateRecord(dataType, syncRecord)

            if (
                result.status === 'success' ||
                result.status === 'partial_success'
            ) {
                if (syncRecord.status === 'partial_success') {
                    message.warning(
                        `Sync ข้อมูลสำเร็จบางส่วน · ข้าม ${result.skipped_count.toLocaleString()} รายการ (ดูรายละเอียดที่สาเหตุ)`,
                    )
                } else if (result.skipped_count > 0) {
                    message.warning(
                        `Sync ข้อมูลสำเร็จ · ข้าม ${result.skipped_count.toLocaleString()} รายการ (ดูรายละเอียดที่สาเหตุ)`,
                    )
                } else {
                    message.success('Sync ข้อมูลสำเร็จ')
                }
            } else {
                message.error('Sync ข้อมูลไม่สำเร็จ')
            }
        } catch (error) {
            console.error(error)
            const requestErrorMessage = getRequestErrorMessage(error)
            const latestRecords = await loadSyncHistory(false, false)
            const failedRecord = latestRecords?.find(
                (record) =>
                    record.key === dataType && record.status === 'failed',
            )

            if (!failedRecord) {
                updateRecord(dataType, {
                    status: 'failed',
                    resultMessage: requestErrorMessage,
                })
            }
            message.error(`Sync ข้อมูลไม่สำเร็จ: ${requestErrorMessage}`)
        } finally {
            setSyncingType(null)
        }
    }

    const columns: ColumnsType<SyncTableRecord> = [
        ...createSyncResultColumns(setResultRecord),
        {
            title: 'ปีการศึกษา',
            key: 'academicYears',
            width: 280,
            render: (_, record) =>
                record.key === 'academic-calendar' ? (
                    <Form.Item
                        validateStatus={
                            academicYearValidationError ? 'error' : undefined
                        }
                        help={academicYearValidationError
                            ? 'กรุณาเลือกปีการศึกษาอย่างน้อย 1 ปี'
                            : undefined}
                        style={{ marginBottom: 0 }}
                    >
                        <Select
                            mode="multiple"
                            value={selectedAcademicYears}
                            options={academicYearOptions}
                            placeholder="เลือกปีการศึกษา"
                            aria-label="เลือกปีการศึกษาที่ต้องการ Sync"
                            status={
                                academicYearValidationError
                                    ? 'error'
                                    : undefined
                            }
                            maxTagCount="responsive"
                            disabled={syncingType !== null}
                            onChange={(years) => {
                                setSelectedAcademicYears(years)
                                if (years.length > 0) {
                                    setAcademicYearValidationError(false)
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                ) : (
                    '-'
                ),
        },
        {
            title: 'จัดการ',
            key: 'actions',
            align: 'center',
            width: 210,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        loading={
                            syncingType === record.key ||
                            record.status === 'running'
                        }
                        disabled={
                            record.status === 'running' ||
                            (syncingType !== null &&
                                syncingType !== record.key)
                        }
                        onClick={() => handleSync(record.key)}
                    >
                        Sync
                    </Button>
                    <Button
                        icon={<EyeOutlined />}
                        aria-label={'ดูข้อมูล ' + record.label}
                        style={{
                            borderColor: appColors.info,
                            color: appColors.info,
                        }}
                        onClick={() =>
                            navigate(record.key === 'academic-calendar'
                                ? '/central-data/academic-calendar'
                                : `/central-data/${record.key}`)
                        }
                    />
                </Space>
            ),
        },
    ]

    return (
        <div className="student-page">
            <div className="page-title-section">
                <div>
                    <h1>Sync ข้อมูล</h1>
                    <p>อัปเดตข้อมูลส่วนกลางจากระบบต้นทาง</p>
                </div>
            </div>

            <div className="table-card">
                {historyError && (
                    <Alert
                        type="error"
                        showIcon
                        message="โหลดสถานะ Sync ล่าสุดไม่สำเร็จ"
                        description={historyError}
                        action={
                            <Button
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => void loadSyncHistory()}
                            >
                                รีเฟรช
                            </Button>
                        }
                        style={{ marginBottom: 16 }}
                    />
                )}
                <CustomTable<SyncTableRecord>
                    columns={columns}
                    dataSource={records}
                    loading={historyLoading}
                    searchPlaceholder="ค้นหาประเภทข้อมูล..."
                    pagination={false}
                    locale={{ emptyText: 'ไม่พบข้อมูลสถานะ Sync' }}
                />
            </div>

            <Modal
                open={resultRecord !== null}
                title="รายละเอียดผลการ Sync"
                footer={null}
                destroyOnHidden
                onCancel={() => setResultRecord(null)}
            >
                <Typography.Paragraph
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                    {resultRecord?.resultMessage ||
                        'ไม่มีรายละเอียดผลการ Sync'}
                </Typography.Paragraph>
            </Modal>
        </div>
    )
}
