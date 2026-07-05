import { EyeOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import CustomTable from '../components/custom/CustomTable'
import { syncMasterData } from '../services/syncService'
import type {
    SyncDataType,
    SyncStatus,
    SyncTableRecord,
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

const resultColumns: ColumnsType<SyncTableRecord> = [
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
        render: (status: SyncStatus) => {
            const display = statusDisplay[status]
            return <Tag color={display.color}>{display.label}</Tag>
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

export default function SyncData() {
    const [syncingType, setSyncingType] = useState<SyncDataType | null>(null)
    const [detailRecord, setDetailRecord] =
        useState<SyncTableRecord | null>(null)
    const [records, setRecords] = useState(initialRecords)

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
            const skipped =
                (result.skipped_null ?? 0) +
                (result.skipped_unknown ?? 0)

            updateRecord(dataType, {
                synced: result.synced,
                deleted: result.deleted,
                skipped,
                status: 'success',
                syncedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            })
            message.success('Sync ข้อมูลสำเร็จ')
        } catch (error) {
            console.error(error)
            updateRecord(dataType, {
                status: 'error',
                syncedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            })
            message.error('Sync ข้อมูลไม่สำเร็จ')
        } finally {
            setSyncingType(null)
        }
    }

    const columns: ColumnsType<SyncTableRecord> = [
        ...resultColumns,
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
        </div>
    )
}
