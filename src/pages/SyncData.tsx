import {
    ExclamationCircleOutlined,
    EyeOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { Button, Modal, Space, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import CustomTable from '../components/custom/CustomTable'
import {
    getSyncedSystemDepartments,
    getSyncedSystemFaculties,
    getSyncedTeachers,
    getSyncHistory,
    syncMasterData,
} from '../services/syncService'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    SyncDataType,
    SyncHistoryRecord,
    SyncResult,
    SyncStatus,
    SyncTableRecord,
    SyncType,
    SyncedSystemDepartment,
    SyncedSystemFaculty,
    SyncedTeacher,
} from '../types/SyncData'

const syncOptions: { label: string; value: SyncDataType }[] = [
    { label: 'คณะ', value: 'faculty' },
    { label: 'ภาควิชา', value: 'department' },
    { label: 'อาจารย์ที่ปรึกษา', value: 'teacher' },
]

const initialRecords: SyncTableRecord[] = syncOptions.map((option) => ({
    key: option.value,
    label: option.label,
    synced: null,
    deleted: null,
    skipped: null,
    status: 'waiting',
    syncedAt: null,
    errorMessage: null,
}))

const statusDisplay: Record<
    SyncStatus,
    { color: string; label: string }
> = {
    waiting: { color: 'default', label: 'ยังไม่ Sync' },
    success: { color: 'success', label: 'สำเร็จ' },
    error: { color: 'error', label: 'ไม่สำเร็จ' },
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
    teacher: 3,
}

function getSyncStatus(status: string | null): SyncStatus {
    if (status === 'success') {
        return 'success'
    }

    if (status === 'failed') {
        return 'error'
    }

    return 'waiting'
}

function formatSyncDate(value: string | null | undefined): string | null {
    if (!value) {
        return null
    }

    const date = dayjs(value)
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm:ss') : null
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
    teacher: [
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

function mapTeacherDetails(
    teachers: SyncedTeacher[],
): SyncDetailTableRecord[] {
    return teachers.map((teacher) => ({
        id: teacher.id,
        nontriId: teacher.nontri_id,
        fullNameTh: teacher.full_name_th,
        departmentId: teacher.department_id,
        deletedAt: teacher.deleted_at,
        createdAt: teacher.created_at,
        updatedAt: teacher.updated_at,
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
        case 'teacher':
            return mapTeacherDetails(await getSyncedTeachers())
    }
}

function mapHistoryToRecords(history: SyncHistoryRecord[]): SyncTableRecord[] {
    return syncOptions.map((option) => {
        const sync = history.find(
            (item) => item.sync_type === syncTypeByDataType[option.value],
        )

        if (!sync) {
            return {
                key: option.value,
                label: option.label,
                synced: null,
                deleted: null,
                skipped: null,
                status: 'waiting',
                syncedAt: null,
                errorMessage: null,
            }
        }

        return {
            key: option.value,
            label: sync.sync_type_name || option.label,
            synced: sync.synced_count,
            deleted: sync.deleted_count,
            skipped: sync.skipped_count,
            status: getSyncStatus(sync.status),
            syncedAt: formatSyncDate(sync.updated_at ?? sync.created_at),
            errorMessage: sync.error_message,
        }
    })
}

function mapSyncResult(result: SyncResult): Partial<SyncTableRecord> {
    return {
        synced: result.synced_count,
        deleted: result.deleted_count,
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
        title: 'จำนวนที่ Sync',
        dataIndex: 'synced',
        key: 'synced',
        align: 'center',
        render: (value: number | null) => value ?? '-',
    },
    {
        title: 'จำนวนที่ลบ',
        dataIndex: 'deleted',
        key: 'deleted',
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
                    {status === 'error' && (
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
    const [syncingType, setSyncingType] = useState<SyncDataType | null>(null)
    const [detailRecord, setDetailRecord] =
        useState<SyncTableRecord | null>(null)
    const [detailData, setDetailData] = useState<SyncDetailTableRecord[]>([])
    const [detailLoading, setDetailLoading] = useState(false)
    const [errorRecord, setErrorRecord] =
        useState<SyncTableRecord | null>(null)
    const [records, setRecords] = useState(initialRecords)
    const [historyLoading, setHistoryLoading] = useState(true)
    const detailRequestId = useRef(0)

    const loadSyncHistory = useCallback(async (showError = true) => {
        try {
            const history = await getSyncHistory()
            const historyRecords = mapHistoryToRecords(history)
            setRecords(historyRecords)
            return historyRecords
        } catch (error) {
            console.error(error)
            if (showError) {
                message.error('โหลดประวัติ Sync ไม่สำเร็จ')
            }
            return null
        } finally {
            setHistoryLoading(false)
        }
    }, [])

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
            const latestRecords = await loadSyncHistory(false)
            const failedRecord = latestRecords?.find(
                (record) =>
                    record.key === dataType && record.status === 'error',
            )

            if (!failedRecord) {
                updateRecord(dataType, {
                    status: 'error',
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
                        loading={syncingType === record.key}
                        disabled={
                            syncingType !== null &&
                            syncingType !== record.key
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
                <CustomTable<SyncTableRecord>
                    columns={columns}
                    dataSource={records}
                    loading={historyLoading}
                    searchPlaceholder="ค้นหาประเภทข้อมูล..."
                    pagination={false}
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
