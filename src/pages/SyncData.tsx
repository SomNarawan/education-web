import {
    ExclamationCircleOutlined,
    EyeOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { Button, Modal, Space, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import CustomTable from '../components/custom/CustomTable'
import { getSyncHistory, syncMasterData } from '../services/syncService'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    SyncDataType,
    SyncHistoryRecord,
    SyncResult,
    SyncStatus,
    SyncTableRecord,
    SyncType,
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

const detailColumns: ColumnsType<{ key: string; detail: string }> = [
    {
        title: 'รายละเอียดข้อมูล',
        dataIndex: 'detail',
        key: 'detail',
    },
]

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

function formatSyncDate(value: string | null): string | null {
    if (!value) {
        return null
    }

    const date = dayjs(value)
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm:ss') : null
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
    const [errorRecord, setErrorRecord] =
        useState<SyncTableRecord | null>(null)
    const [records, setRecords] = useState(initialRecords)
    const [historyLoading, setHistoryLoading] = useState(true)

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
                        style={{
                            borderColor: '#1677ff',
                            color: '#1677ff',
                        }}
                        onClick={() => setDetailRecord(record)}
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
                onCancel={() => setDetailRecord(null)}
            >
                <CustomTable<{ key: string; detail: string }>
                    columns={detailColumns}
                    dataSource={[]}
                    showNo={false}
                    searchPlaceholder="ค้นหาข้อมูล..."
                    pagination={false}
                    locale={{
                        emptyText: 'รายละเอียดข้อมูลจะเพิ่มในขั้นตอนถัดไป',
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
