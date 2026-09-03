import { ReloadOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Tag,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CustomTable from '../components/custom/CustomTable'
import {
    getSyncedSystemDepartments,
    getSyncedSystemFaculties,
} from '../services/syncService'
import type {
    SyncDataType,
    SyncedSystemDepartment,
    SyncedSystemFaculty,
    SystemMasterDataStatus,
} from '../types/SyncData'
import { formatThaiDateTime } from '../utils/dateFormat'

interface DetailRecord {
    id: number
    thName?: string
    enName?: string
    thShortName?: string
    enShortName?: string
    facultyName?: string | null
    status: SystemMasterDataStatus
    createdAt: string | null
    createdBy: string | null
    updatedAt: string | null
    updatedBy: string | null
}

const pageConfig: Record<
    SyncDataType,
    { title: string; description: string; searchPlaceholder: string }
> = {
    faculty: {
        title: 'รายละเอียดข้อมูลคณะ',
        description: 'ข้อมูลคณะทั้งหมดจากระบบส่วนกลาง',
        searchPlaceholder: 'ค้นหาชื่อคณะหรือชื่อย่อ...',
    },
    department: {
        title: 'รายละเอียดข้อมูลภาควิชา',
        description: 'ข้อมูลภาควิชาและคณะที่สังกัดทั้งหมด',
        searchPlaceholder: 'ค้นหาภาควิชาหรือคณะ...',
    },
}

const syncDataTypes: SyncDataType[] = ['faculty', 'department']

function isSyncDataType(value: string | undefined): value is SyncDataType {
    return syncDataTypes.some((dataType) => dataType === value)
}

function mapAuditFields(
    item: SyncedSystemFaculty | SyncedSystemDepartment,
) {
    return {
        status: item.status,
        createdAt: item.created_at,
        createdBy: item.created_by,
        updatedAt: item.updated_at,
        updatedBy: item.updated_by,
    }
}

const statusColumn: ColumnsType<DetailRecord>[number] = {
    title: 'สถานะ',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    filters: [
        { text: 'ใช้งาน', value: 'active' },
        { text: 'ไม่ใช้งาน', value: 'inactive' },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status: SystemMasterDataStatus) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
            {status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Tag>
    ),
}

const auditColumns: ColumnsType<DetailRecord> = [
    {
        title: 'สร้างโดย',
        dataIndex: 'createdBy',
        key: 'createdBy',
        ellipsis: true,
    },
    {
        title: 'วันที่สร้าง',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string | null) => formatThaiDateTime(value),
    },
    {
        title: 'แก้ไขโดย',
        dataIndex: 'updatedBy',
        key: 'updatedBy',
        ellipsis: true,
    },
    {
        title: 'วันที่แก้ไข',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string | null) => formatThaiDateTime(value),
    },
]

const columnsByType: Record<SyncDataType, ColumnsType<DetailRecord>> = {
    faculty: [
        {
            title: 'ชื่อคณะ (ไทย)',
            dataIndex: 'thName',
            key: 'thName',
        },
        {
            title: 'ชื่อคณะ (อังกฤษ)',
            dataIndex: 'enName',
            key: 'enName',
        },
        {
            title: 'ชื่อย่อ (ไทย)',
            dataIndex: 'thShortName',
            key: 'thShortName',
        },
        {
            title: 'ชื่อย่อ (อังกฤษ)',
            dataIndex: 'enShortName',
            key: 'enShortName',
        },
        ...auditColumns,
        statusColumn,
    ],
    department: [
        {
            title: 'ชื่อภาควิชา (ไทย)',
            dataIndex: 'thName',
            key: 'thName',
        },
        {
            title: 'ชื่อภาควิชา (อังกฤษ)',
            dataIndex: 'enName',
            key: 'enName',
        },
        {
            title: 'ชื่อย่อ (ไทย)',
            dataIndex: 'thShortName',
            key: 'thShortName',
        },
        {
            title: 'ชื่อย่อ (อังกฤษ)',
            dataIndex: 'enShortName',
            key: 'enShortName',
        },
        {
            title: 'ชื่อคณะ',
            dataIndex: 'facultyName',
            key: 'facultyName',
        },
        ...auditColumns,
        statusColumn,
    ],
}

async function loadDetailRecords(dataType: SyncDataType): Promise<DetailRecord[]> {
    if (dataType === 'faculty') {
        const faculties = await getSyncedSystemFaculties()

        return faculties.map((faculty) => ({
            id: faculty.id,
            thName: faculty.th_name,
            enName: faculty.en_name,
            thShortName: faculty.th_short_name,
            enShortName: faculty.en_short_name,
            ...mapAuditFields(faculty),
        }))
    }

    if (dataType === 'department') {
        const departments = await getSyncedSystemDepartments()

        return departments.map((department) => ({
            id: department.id,
            thName: department.th_name,
            enName: department.en_name,
            thShortName: department.th_short_name,
            enShortName: department.en_short_name,
            facultyName: department.faculty_name,
            ...mapAuditFields(department),
        }))
    }

    return []
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? error.message
    }

    return error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'
}

export default function SystemMasterDataDetail() {
    const { dataType: dataTypeParam } = useParams()
    const [records, setRecords] = useState<DetailRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const dataType = isSyncDataType(dataTypeParam) ? dataTypeParam : null

    const loadRecords = useCallback(async () => {
        if (!dataType) return

        setLoading(true)
        setError(null)

        try {
            setRecords(await loadDetailRecords(dataType))
        } catch (requestError) {
            console.error(requestError)
            const errorMessage = getErrorMessage(requestError)
            setRecords([])
            setError(errorMessage)
            message.error('โหลดรายละเอียดข้อมูลไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }, [dataType])

    useEffect(() => {
        // Loading is intentionally triggered when the selected data type changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadRecords()
    }, [loadRecords])

    if (!dataType) {
        return <Navigate to="/sync" replace />
    }

    const config = pageConfig[dataType]
    return (
        <div className="student-page">
            <div className="page-title-section">
                <div>
                    <h1>{config.title}</h1>
                    <p>{config.description}</p>
                </div>
            </div>

            <div className="table-card">
                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message="โหลดรายละเอียดข้อมูลไม่สำเร็จ"
                        description={error}
                        action={
                            <Button
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => void loadRecords()}
                            >
                                รีเฟรช
                            </Button>
                        }
                        style={{ marginBottom: 16 }}
                    />
                )}

                <CustomTable<DetailRecord>
                    columns={columnsByType[dataType]}
                    dataSource={records}
                    loading={loading}
                    rowKey="id"
                    showNo={false}
                    searchPlaceholder={config.searchPlaceholder}
                    pagination={{ defaultPageSize: 10 }}
                    tableLayout="fixed"
                    locale={{ emptyText: 'ไม่พบข้อมูล' }}
                />
            </div>
        </div>
    )
}
