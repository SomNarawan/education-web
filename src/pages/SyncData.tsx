import {
    ExclamationCircleOutlined,
    EyeOutlined,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Form,
    Modal,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomTable from '../components/custom/CustomTable'
import { appColors } from '../config/appColors'
import { useAuth } from '../hooks/useAuth'
import {
    getSyncHistory,
    syncMasterData,
} from '../services/syncService'
import { syncAcademicCalendars } from '../services/academicCalendarService'
import type { ApiErrorResponse, ApiResponse } from '../types/ApiResponse'
import type {
    SyncExecutionStatus,
    SyncHistoryRecord,
    SyncResult,
    SyncStatus,
    SyncTableRecord,
    SyncTableDataType,
    SyncType,
} from '../types/SyncData'
import {
    createAcademicYearOptions,
    createAcademicYearRange,
} from '../utils/academicYear'
import { formatThaiDateTime } from '../utils/dateFormat'

const syncOptions: { label: string; value: SyncTableDataType }[] = [
    { label: 'คณะ', value: 'faculty' },
    { label: 'ภาควิชา', value: 'department' },
    { label: 'ปฏิทินการศึกษา', value: 'academic-calendar' },
]

const statusDisplay: Record<
    SyncStatus,
    { color: string; label: string }
> = {
    waiting: { color: 'default', label: 'ยังไม่ Sync' },
    running: { color: 'processing', label: 'กำลัง Sync' },
    success: { color: 'success', label: 'สำเร็จ' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}

interface SyncHistoryError {
    message: string
    unauthorized: boolean
}

const syncTypeByDataType: Record<SyncTableDataType, SyncType> = {
    faculty: 1,
    department: 2,
    'academic-calendar': 3,
}

const currentAcademicYear = new Date().getFullYear()
const academicYearOptions = createAcademicYearOptions(
    createAcademicYearRange(currentAcademicYear, 9, 1),
)

function createWaitingRecord(
    key: SyncTableDataType,
    label: string,
): SyncTableRecord {
    return {
        key,
        label,
        inserted: null,
        updated: null,
        inactivated: null,
        skipped: null,
        status: 'waiting',
        syncedAt: null,
        errorMessage: null,
    }
}

function getSyncStatus(status: SyncExecutionStatus | null): SyncStatus {
    if (status === 'running') {
        return 'running'
    }

    if (status === 'success') {
        return 'success'
    }

    if (status === 'failed') {
        return 'failed'
    }

    return 'waiting'
}

function formatSyncDate(value: string | null | undefined): string | null {
    return value ? formatThaiDateTime(value) : null
}

function getSyncHistoryError(error: unknown): SyncHistoryError {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
        return {
            message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
            unauthorized: false,
        }
    }

    if (!error.response) {
        return {
            message:
                'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่อีกครั้ง',
            unauthorized: false,
        }
    }

    const responseMessage = error.response.data?.message

    if (error.response.status === 401) {
        return {
            message:
                responseMessage ?? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
            unauthorized: true,
        }
    }

    if (error.response.status === 422) {
        const validationMessages = Object.values(
            error.response.data?.errors ?? {},
        ).flat()

        return {
            message:
                validationMessages.join(' ') ||
                responseMessage ||
                'ตัวกรองสถานะ Sync ไม่ถูกต้อง',
            unauthorized: false,
        }
    }

    return {
        message: responseMessage ?? 'โหลดสถานะ Sync ล่าสุดไม่สำเร็จ',
        unauthorized: false,
    }
}

function mapHistoryToRecords(history: SyncHistoryRecord[]): SyncTableRecord[] {
    return syncOptions.map((option) => {
        const sync = history.find(
            (item) => item.sync_type === syncTypeByDataType[option.value],
        )

        if (!sync) {
            return createWaitingRecord(option.value, option.label)
        }

        return {
            key: option.value,
            label: sync.sync_type_name || option.label,
            inserted: sync.inserted_count,
            updated: sync.updated_count,
            inactivated: sync.inactivated_count,
            skipped: sync.skipped_count,
            status: getSyncStatus(sync.status),
            syncedAt: formatSyncDate(sync.updated_at ?? sync.created_at),
            errorMessage: sync.error_message,
        }
    })
}

function mapSyncResult(result: SyncResult): Partial<SyncTableRecord> {
    return {
        inserted: result.inserted_count,
        updated: result.updated_count,
        inactivated: result.inactivated_count,
        skipped: result.skipped_count,
        status: getSyncStatus(result.status),
        syncedAt: formatSyncDate(result.updated_at ?? result.created_at),
        errorMessage: result.error_message,
    }
}

function getRequestErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data.message ?? error.message
    }

    return error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'
}

function createResultColumns(
    onViewError: (record: SyncTableRecord) => void,
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
        dataIndex: 'errorMessage',
        key: 'errorMessage',
        width: 90,
        align: 'center',
        render: (value: string | null, record) =>
            value ? (
                <Tooltip title={'ดูรายละเอียดข้อผิดพลาด'}>
                    <Button
                        className={'student-import-reason-button'}
                        type={'text'}
                        danger
                        size={'small'}
                        aria-label={
                            'ดูรายละเอียดข้อผิดพลาด ' + record.label
                        }
                        icon={<ExclamationCircleOutlined />}
                        onClick={() => onViewError(record)}
                    />
                </Tooltip>
            ) : (
                '-'
            ),
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

export default function SyncData() {
    const { clearSession } = useAuth()
    const navigate = useNavigate()
    const [syncingType, setSyncingType] =
        useState<SyncTableDataType | null>(null)
    const [errorRecord, setErrorRecord] =
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
                errorMessage: null,
            })

            const result = dataType === 'academic-calendar'
                ? await syncAcademicCalendars(selectedAcademicYears)
                : await syncMasterData(dataType)
            updateRecord(dataType, mapSyncResult(result))

            if (result.status === 'success') {
                message.success('Sync ข้อมูลสำเร็จ')
            } else {
                message.error('Sync ข้อมูลไม่สำเร็จ')
            }
        } catch (error) {
            console.error(error)
            const latestRecords = await loadSyncHistory(false, false)
            const failedRecord = latestRecords?.find(
                (record) =>
                    record.key === dataType && record.status === 'failed',
            )

            if (!failedRecord) {
                updateRecord(dataType, {
                    status: 'failed',
                    errorMessage: getRequestErrorMessage(error),
                })
            }
            message.error('Sync ข้อมูลไม่สำเร็จ')
        } finally {
            setSyncingType(null)
        }
    }

    const columns: ColumnsType<SyncTableRecord> = [
        ...createResultColumns(setErrorRecord),
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
                open={errorRecord !== null}
                title={'รายละเอียดข้อผิดพลาด'}
                footer={null}
                destroyOnHidden
                onCancel={() => setErrorRecord(null)}
            >
                <Typography.Paragraph
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                    {errorRecord?.errorMessage ||
                        'ไม่มีรายละเอียดข้อผิดพลาด'}
                </Typography.Paragraph>
            </Modal>
        </div>
    )
}
