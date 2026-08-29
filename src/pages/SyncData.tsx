import {
    ExclamationCircleOutlined,
    EyeOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Modal,
    Space,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import CustomTable from '../components/custom/CustomTable'
import { useAuth } from '../hooks/useAuth'
import {
    getSyncedSystemDepartments,
    getSyncedSystemFaculties,
    getSyncedSystemTeachers,
    getSyncHistory,
    syncMasterData,
} from '../services/syncService'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    SyncDataType,
    SyncExecutionStatus,
    SyncHistoryRecord,
    SyncResult,
    SyncStatus,
    SyncTableRecord,
    SyncType,
    SyncedSystemDepartment,
    SyncedSystemFaculty,
    SyncedSystemTeacher,
} from '../types/SyncData'
import { formatThaiDateTime } from '../utils/dateFormat'

const syncOptions: { label: string; value: SyncDataType }[] = [
    { label: 'คณะ', value: 'faculty' },
    { label: 'ภาควิชา', value: 'department' },
    { label: 'อาจารย์ที่ปรึกษา', value: 'systemTeacher' },
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

interface ApiErrorResponse {
    success?: boolean
    message?: string
    errors?: Record<string, string[]> | null
}

interface SyncHistoryError {
    message: string
    unauthorized: boolean
}

interface SyncDetailTableRecord {
    id: number
    thName?: string
    enName?: string
    thShortName?: string
    enShortName?: string
    systemFacultyId?: number
    nontriId?: string
    fullNameTh?: string
    departmentId?: number
    deletedAt: string | null
    createdAt: string
    updatedAt: string
}

const syncTypeByDataType: Record<SyncDataType, SyncType> = {
    faculty: 1,
    department: 2,
    systemTeacher: 3,
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

const auditDetailColumns: ColumnsType<SyncDetailTableRecord> = [
    {
        title: 'ลบเมื่อ',
        dataIndex: 'deletedAt',
        key: 'deletedAt',
        width: 160,
        render: (value: string | null) => formatSyncDate(value) ?? '-',
    },
    {
        title: 'สร้างเมื่อ',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (value: string) => formatSyncDate(value) ?? '-',
    },
    {
        title: 'แก้ไขเมื่อ',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        render: (value: string) => formatSyncDate(value) ?? '-',
    },
]

const detailColumnsByType: Record<
    SyncDataType,
    ColumnsType<SyncDetailTableRecord>
> = {
    faculty: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'ชื่อคณะ (ไทย)',
            dataIndex: 'thName',
            key: 'thName',
            width: 220,
        },
        {
            title: 'ชื่อคณะ (อังกฤษ)',
            dataIndex: 'enName',
            key: 'enName',
            width: 260,
        },
        {
            title: 'ชื่อย่อ (ไทย)',
            dataIndex: 'thShortName',
            key: 'thShortName',
            width: 120,
        },
        {
            title: 'ชื่อย่อ (อังกฤษ)',
            dataIndex: 'enShortName',
            key: 'enShortName',
            width: 130,
        },
        ...auditDetailColumns,
    ],
    department: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'ชื่อภาควิชา (ไทย)',
            dataIndex: 'thName',
            key: 'thName',
            width: 240,
        },
        {
            title: 'ชื่อภาควิชา (อังกฤษ)',
            dataIndex: 'enName',
            key: 'enName',
            width: 280,
        },
        {
            title: 'ชื่อย่อ (ไทย)',
            dataIndex: 'thShortName',
            key: 'thShortName',
            width: 120,
        },
        {
            title: 'ชื่อย่อ (อังกฤษ)',
            dataIndex: 'enShortName',
            key: 'enShortName',
            width: 130,
        },
        {
            title: 'รหัสคณะ',
            dataIndex: 'systemFacultyId',
            key: 'systemFacultyId',
            width: 110,
        },
        ...auditDetailColumns,
    ],
    systemTeacher: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Nontri ID',
            dataIndex: 'nontriId',
            key: 'nontriId',
            width: 140,
        },
        {
            title: 'ชื่ออาจารย์',
            dataIndex: 'fullNameTh',
            key: 'fullNameTh',
            width: 220,
        },
        {
            title: 'รหัสภาควิชา',
            dataIndex: 'departmentId',
            key: 'departmentId',
            width: 130,
        },
        ...auditDetailColumns,
    ],
}

function mapFacultyDetails(
    faculties: SyncedSystemFaculty[],
): SyncDetailTableRecord[] {
    return faculties.map((faculty) => ({
        id: faculty.id,
        thName: faculty.th_name,
        enName: faculty.en_name,
        thShortName: faculty.th_short_name,
        enShortName: faculty.en_short_name,
        deletedAt: faculty.deleted_at,
        createdAt: faculty.created_at,
        updatedAt: faculty.updated_at,
    }))
}

function mapDepartmentDetails(
    departments: SyncedSystemDepartment[],
): SyncDetailTableRecord[] {
    return departments.map((department) => ({
        id: department.id,
        thName: department.th_name,
        enName: department.en_name,
        thShortName: department.th_short_name,
        enShortName: department.en_short_name,
        systemFacultyId: department.system_faculty_id,
        deletedAt: department.deleted_at,
        createdAt: department.created_at,
        updatedAt: department.updated_at,
    }))
}

function mapSystemTeacherDetails(
    systemTeachers: SyncedSystemTeacher[],
): SyncDetailTableRecord[] {
    return systemTeachers.map((systemTeacher) => ({
        id: systemTeacher.id,
        nontriId: systemTeacher.nontri_id,
        fullNameTh: systemTeacher.full_name_th,
        departmentId: systemTeacher.department_id,
        deletedAt: systemTeacher.deleted_at,
        createdAt: systemTeacher.created_at,
        updatedAt: systemTeacher.updated_at,
    }))
}

async function loadSyncDetails(
    dataType: SyncDataType,
): Promise<SyncDetailTableRecord[]> {
    switch (dataType) {
        case 'faculty':
            return mapFacultyDetails(await getSyncedSystemFaculties())
        case 'department':
            return mapDepartmentDetails(await getSyncedSystemDepartments())
        case 'systemTeacher':
            return mapSystemTeacherDetails(await getSyncedSystemTeachers())
    }
}

function mapHistoryToRecords(history: SyncHistoryRecord[]): SyncTableRecord[] {
    if (history.length === 0) {
        return []
    }

    return syncOptions.map((option) => {
        const sync = history.find(
            (item) => item.sync_type === syncTypeByDataType[option.value],
        )

        if (!sync) {
            return {
                key: option.value,
                label: option.label,
                inserted: null,
                updated: null,
                inactivated: null,
                skipped: null,
                status: 'waiting',
                syncedAt: null,
                errorMessage: null,
            }
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
        render: (status: SyncStatus, record) => {
            const display = statusDisplay[status]
            return (
                <Space size={4}>
                    <Tag color={display.color}>{display.label}</Tag>
                    {status === 'failed' && (
                        <Tooltip title={'ดูรายละเอียดข้อผิดพลาด'}>
                            <Button
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
                    )}
                </Space>
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

export default function SyncData() {
    const { logout } = useAuth()
    const [syncingType, setSyncingType] = useState<SyncDataType | null>(null)
    const [detailRecord, setDetailRecord] =
        useState<SyncTableRecord | null>(null)
    const [detailData, setDetailData] = useState<SyncDetailTableRecord[]>([])
    const [detailLoading, setDetailLoading] = useState(false)
    const [errorRecord, setErrorRecord] =
        useState<SyncTableRecord | null>(null)
    const [records, setRecords] = useState<SyncTableRecord[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const detailRequestId = useRef(0)

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
                setRecords([])
            }
            setHistoryError(requestError.message)

            if (showError) {
                message.error(requestError.message)
            }

            if (requestError.unauthorized) {
                logout()
            }

            return null
        } finally {
            setHistoryLoading(false)
        }
    }, [logout])

    useEffect(() => {
        // Initial API synchronization is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadSyncHistory()
    }, [loadSyncHistory])

    const updateRecord = (
        dataType: SyncDataType,
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

    const handleSync = async (dataType: SyncDataType) => {
        try {
            setSyncingType(dataType)

            const result = await syncMasterData(dataType)
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

    const handleViewDetail = async (record: SyncTableRecord) => {
        const requestId = detailRequestId.current + 1
        detailRequestId.current = requestId
        setDetailRecord(record)
        setDetailData([])
        setDetailLoading(true)

        try {
            const data = await loadSyncDetails(record.key)

            if (detailRequestId.current === requestId) {
                setDetailData(data)
            }
        } catch (error) {
            console.error(error)
            if (detailRequestId.current === requestId) {
                message.error('โหลดรายละเอียดข้อมูลไม่สำเร็จ')
            }
        } finally {
            if (detailRequestId.current === requestId) {
                setDetailLoading(false)
            }
        }
    }

    const handleCloseDetail = () => {
        detailRequestId.current += 1
        setDetailRecord(null)
        setDetailData([])
        setDetailLoading(false)
    }

    const columns: ColumnsType<SyncTableRecord> = [
        ...createResultColumns(setErrorRecord),
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
                            borderColor: '#1677ff',
                            color: '#1677ff',
                        }}
                        onClick={() => void handleViewDetail(record)}
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
                                onClick={() => void loadSyncHistory()}
                            >
                                ลองใหม่
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
                open={detailRecord !== null}
                title={`ข้อมูล${detailRecord?.label ?? ''}`}
                width={900}
                footer={null}
                destroyOnHidden
                onCancel={handleCloseDetail}
            >
                <CustomTable<SyncDetailTableRecord>
                    columns={
                        detailRecord
                            ? detailColumnsByType[detailRecord.key]
                            : []
                    }
                    dataSource={detailData}
                    loading={detailLoading}
                    rowKey={'id'}
                    showNo={false}
                    searchPlaceholder="ค้นหาข้อมูล..."
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    locale={{
                        emptyText: 'ไม่พบข้อมูลที่ Sync',
                    }}
                />
            </Modal>

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
