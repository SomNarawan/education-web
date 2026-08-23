import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import {
    Button,
    Descriptions,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Switch,
    Tag,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CustomTable from '../../components/custom/CustomTable'
import { renderRequiredFormMark } from '../../components/custom/RequiredFormMark'
import { useAuth } from '../../hooks/useAuth'
import {
    createManagedMasterData,
    deleteManagedMasterData,
    getManagedMasterData,
    getManagedMasterDataList,
    updateManagedMasterData,
    updateManagedMasterDataStatus,
} from '../../services/masterDataService'
import type {
    ManagedMasterDataPayload,
    ManagedMasterDataRecord,
    ManagedMasterDataResource,
} from '../../types/MasterData'
import { formatThaiDateTime } from '../../utils/dateFormat'
import {
    isMasterDataType,
    masterDataDefinitions,
} from './masterDataConfig'

type MasterDataFormValues = Record<string, string>

interface ApiErrorResponse {
    message?: string
    errors?: Record<string, string[] | string> | null
}

interface EditState {
    mode: 'create' | 'edit'
    record?: ManagedMasterDataRecord
}

interface MasterDataManagementContentProps {
    resource: ManagedMasterDataResource
}

function getRecordLabel(
    record: ManagedMasterDataRecord,
    displayField: string,
    fallback: string,
) {
    const value = record[displayField]
    return typeof value === 'string' && value.trim() ? value : fallback
}

function MasterDataManagementContent({
    resource,
}: MasterDataManagementContentProps) {
    const definition = masterDataDefinitions[resource]
    const { logout } = useAuth()
    const [form] = Form.useForm<MasterDataFormValues>()
    const [records, setRecords] = useState<ManagedMasterDataRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loadingViewId, setLoadingViewId] = useState<number | null>(null)
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null)
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [editState, setEditState] = useState<EditState | null>(null)
    const [viewingRecord, setViewingRecord] =
        useState<ManagedMasterDataRecord | null>(null)

    const showRequestError = useCallback(
        (error: unknown, fallbackMessage: string) => {
            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                const responseMessage = error.response?.data.message

                if (error.response?.status === 401) {
                    message.error(
                        responseMessage ??
                            'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
                    )
                    logout()
                    return
                }

                message.error(responseMessage ?? fallbackMessage)
                return
            }

            message.error(fallbackMessage)
        },
        [logout],
    )

    const loadRecords = useCallback(async () => {
        setLoading(true)

        try {
            const data = await getManagedMasterDataList(resource)
            setRecords(data)
        } catch (error) {
            console.error(`Unable to load ${resource}`, error)
            showRequestError(
                error,
                `ไม่สามารถโหลดรายการ${definition.itemLabel}ได้`,
            )
        } finally {
            setLoading(false)
        }
    }, [definition.itemLabel, resource, showRequestError])

    useEffect(() => {
        // Initial API synchronization is intentionally triggered on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadRecords()
    }, [loadRecords])

    function replaceRecord(updatedRecord: ManagedMasterDataRecord) {
        setRecords((current) =>
            current.map((record) =>
                record.id === updatedRecord.id ? updatedRecord : record,
            ),
        )
    }

    function handleOpenCreate() {
        form.resetFields()
        setEditState({ mode: 'create' })
    }

    function openEditForm(record: ManagedMasterDataRecord) {
        form.setFieldsValue(
            Object.fromEntries(
                definition.fields.map((field) => [
                    field.key,
                    String(record[field.key] ?? ''),
                ]),
            ),
        )
        setEditState({ mode: 'edit', record })
    }

    async function handleOpenEdit(record: ManagedMasterDataRecord) {
        setLoadingEditId(record.id)

        try {
            const detail = await getManagedMasterData(resource, record.id)
            replaceRecord(detail)
            openEditForm(detail)
        } catch (error) {
            console.error(`Unable to load ${resource} for editing`, error)
            showRequestError(
                error,
                `ไม่สามารถโหลดข้อมูล${definition.itemLabel}ได้`,
            )
        } finally {
            setLoadingEditId(null)
        }
    }

    async function handleOpenDetail(record: ManagedMasterDataRecord) {
        setLoadingViewId(record.id)

        try {
            const detail = await getManagedMasterData(resource, record.id)
            replaceRecord(detail)
            setViewingRecord(detail)
        } catch (error) {
            console.error(`Unable to load ${resource} detail`, error)
            showRequestError(
                error,
                `ไม่สามารถโหลดรายละเอียด${definition.itemLabel}ได้`,
            )
        } finally {
            setLoadingViewId(null)
        }
    }

    function applyServerValidationErrors(
        errors: Record<string, string[] | string>,
    ) {
        const fieldNames = new Set(
            definition.fields.map((field) => field.key),
        )

        form.setFields(
            Object.entries(errors).flatMap(([field, fieldErrors]) =>
                fieldNames.has(field)
                    ? [
                          {
                              name: field,
                              errors: Array.isArray(fieldErrors)
                                  ? fieldErrors
                                  : [fieldErrors],
                          },
                      ]
                    : [],
            ),
        )
    }

    async function handleSubmit(values: MasterDataFormValues) {
        const payload: ManagedMasterDataPayload = Object.fromEntries(
            definition.fields.map((field) => [
                field.key,
                values[field.key].trim(),
            ]),
        )

        setSaving(true)

        try {
            if (editState?.mode === 'edit' && editState.record) {
                const updatedRecord = await updateManagedMasterData(
                    resource,
                    editState.record.id,
                    payload,
                )
                if (definition.refreshAfterMutation) {
                    await loadRecords()
                } else {
                    replaceRecord(updatedRecord)
                }
                message.success(`แก้ไข${definition.itemLabel}เรียบร้อยแล้ว`)
            } else {
                const createdRecord = await createManagedMasterData(
                    resource,
                    payload,
                )
                if (definition.refreshAfterMutation) {
                    await loadRecords()
                } else {
                    setRecords((current) => [...current, createdRecord])
                }
                message.success(`เพิ่ม${definition.itemLabel}เรียบร้อยแล้ว`)
            }

            setEditState(null)
            form.resetFields()
        } catch (error) {
            console.error(`Unable to save ${resource}`, error)

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                const errors = error.response?.data.errors

                if (error.response?.status === 422 && errors) {
                    applyServerValidationErrors(errors)
                }
            }

            showRequestError(
                error,
                `ไม่สามารถบันทึก${definition.itemLabel}ได้`,
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleStatusChange(record: ManagedMasterDataRecord) {
        const nextStatus =
            record.status === 'active' ? 'inactive' : 'active'
        setUpdatingStatusId(record.id)

        try {
            const updatedRecord = await updateManagedMasterDataStatus(
                resource,
                record.id,
                nextStatus,
            )
            if (definition.refreshAfterMutation) {
                await loadRecords()
            } else {
                replaceRecord(updatedRecord)
            }
            message.success(
                `${nextStatus === 'active' ? 'เปิด' : 'ปิด'}ใช้งาน${definition.itemLabel}เรียบร้อยแล้ว`,
            )
        } catch (error) {
            console.error(`Unable to update ${resource} status`, error)
            showRequestError(
                error,
                `ไม่สามารถเปลี่ยนสถานะ${definition.itemLabel}ได้`,
            )
        } finally {
            setUpdatingStatusId(null)
        }
    }

    async function handleDelete(record: ManagedMasterDataRecord) {
        setDeletingId(record.id)

        try {
            await deleteManagedMasterData(resource, record.id)
            message.success(`ลบ${definition.itemLabel}เรียบร้อยแล้ว`)
            await loadRecords()
        } catch (error) {
            console.error(`Unable to delete ${resource}`, error)

            if (
                resource === 'import-types' &&
                axios.isAxiosError(error) &&
                error.response?.status === 409
            ) {
                message.error(
                    'ไม่สามารถลบประเภทการนำเข้านี้ได้ เนื่องจากมีประวัติการนำเข้าใช้งานอยู่',
                )
            } else {
                showRequestError(
                    error,
                    `ไม่สามารถลบ${definition.itemLabel}ได้`,
                )
            }
        } finally {
            setDeletingId(null)
        }
    }

    const tableFields = definition.listFieldKeys
        ? definition.fields.filter((field) =>
              definition.listFieldKeys?.includes(field.key),
          )
        : definition.fields

    const fieldColumns: ColumnsType<ManagedMasterDataRecord> = [
        ...tableFields.map((field) => ({
            title: field.label,
            dataIndex: field.key,
            key: field.key,
            width: tableFields.length > 1 ? 180 : 260,
            ellipsis: true,
        })),
    ]

    const auditColumns: ColumnsType<ManagedMasterDataRecord> = [
        {
            title: 'สร้างโดย',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 140,
            ellipsis: true,
        },
        {
            title: resource === 'titles' ? 'วันเวลาสร้าง' : 'วันที่สร้าง',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 175,
            render: formatThaiDateTime,
        },
        {
            title: 'แก้ไขโดย',
            dataIndex: 'updated_by',
            key: 'updated_by',
            width: 140,
            ellipsis: true,
        },
        {
            title: 'วันที่แก้ไข',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 175,
            render: formatThaiDateTime,
        },
    ]

    const statusColumn: ColumnsType<ManagedMasterDataRecord>[number] = {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            filters: [
                { text: 'ใช้งาน', value: 'active' },
                { text: 'ไม่ใช้งาน', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: ManagedMasterDataRecord['status'], record) => {
                const isUpdating = updatingStatusId === record.id
                const nextStatusLabel =
                    status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'
                const recordLabel = getRecordLabel(
                    record,
                    definition.displayField,
                    definition.itemLabel,
                )

                return (
                    <Popconfirm
                        title={`ยืนยันการ${nextStatusLabel}${definition.itemLabel}`}
                        description={`ต้องการ${nextStatusLabel} ${recordLabel} ใช่หรือไม่`}
                        okText="ยืนยัน"
                        cancelText="ยกเลิก"
                        onConfirm={() => handleStatusChange(record)}
                    >
                        <Switch
                            checked={status === 'active'}
                            checkedChildren="ใช้งาน"
                            unCheckedChildren="ไม่ใช้งาน"
                            loading={isUpdating}
                            disabled={
                                updatingStatusId !== null && !isUpdating
                            }
                            aria-label={`${nextStatusLabel}${recordLabel}`}
                            style={
                                status === 'active'
                                    ? { backgroundColor: '#52c41a' }
                                    : undefined
                            }
                        />
                    </Popconfirm>
                )
            },
        }

    const actionColumn: ColumnsType<ManagedMasterDataRecord>[number] = {
            title: 'การจัดการ',
            key: 'actions',
            width:
                80 +
                (definition.supportsDetail ? 40 : 0) +
                (definition.supportsDelete ? 40 : 0),
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                const recordLabel = getRecordLabel(
                    record,
                    definition.displayField,
                    definition.itemLabel,
                )
                const actionInProgress =
                    loadingViewId !== null ||
                    loadingEditId !== null ||
                    updatingStatusId !== null ||
                    deletingId !== null

                return (
                    <Space size="small">
                        {definition.supportsDetail && (
                            <Button
                                icon={<EyeOutlined />}
                                aria-label={`ดูรายละเอียด${recordLabel}`}
                                loading={loadingViewId === record.id}
                                disabled={
                                    actionInProgress &&
                                    loadingViewId !== record.id
                                }
                                style={{
                                    borderColor: '#1677ff',
                                    color: '#1677ff',
                                }}
                                onClick={() => void handleOpenDetail(record)}
                            />
                        )}
                        <Button
                            icon={<EditOutlined />}
                            aria-label={`แก้ไข${recordLabel}`}
                            loading={loadingEditId === record.id}
                            disabled={
                                actionInProgress &&
                                loadingEditId !== record.id
                            }
                            style={{
                                borderColor: '#faad14',
                                color: '#faad14',
                            }}
                            onClick={() => void handleOpenEdit(record)}
                        />
                        {definition.supportsDelete && (
                            <Popconfirm
                                title={`ยืนยันการลบ${definition.itemLabel}`}
                                description={`ต้องการลบ ${recordLabel} ใช่หรือไม่`}
                                okText="ลบ"
                                okButtonProps={{ danger: true }}
                                cancelText="ยกเลิก"
                                onConfirm={() => handleDelete(record)}
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    aria-label={`ลบ${recordLabel}`}
                                    loading={deletingId === record.id}
                                    disabled={
                                        actionInProgress &&
                                        deletingId !== record.id
                                    }
                                />
                            </Popconfirm>
                        )}
                    </Space>
                )
            },
        }

    const columns: ColumnsType<ManagedMasterDataRecord> = [
        ...fieldColumns,
        ...auditColumns,
        statusColumn,
        actionColumn,
    ]

    const tableScrollWidth =
        tableFields.length > 1 ? 1250 : 1050

    return (
        <div className="student-page master-data-page">
            <div className="page-title-section">
                <div>
                    <h1>{definition.title}</h1>
                    <p>{definition.description}</p>
                </div>
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    disabled={loading}
                    onClick={handleOpenCreate}
                >
                    เพิ่ม{definition.itemLabel}
                </Button>
            </div>

            <div className="table-card master-data-table-card">
                <div className="master-data-table-heading">
                    <div>
                        <h2>รายการ{definition.itemLabel}</h2>
                    </div>
                </div>

                <CustomTable<ManagedMasterDataRecord>
                    rowKey="id"
                    showNo={false}
                    columns={columns}
                    dataSource={records}
                    loading={loading}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={`ยังไม่มีข้อมูล${definition.itemLabel}`}
                            />
                        ),
                    }}
                    searchPlaceholder={definition.searchPlaceholder}
                    tableLayout="fixed"
                    size="small"
                    scroll={{ x: tableScrollWidth }}
                />
            </div>

            <Modal
                title={`รายละเอียด${definition.itemLabel}`}
                open={Boolean(viewingRecord)}
                width={680}
                footer={
                    <Button onClick={() => setViewingRecord(null)}>ปิด</Button>
                }
                onCancel={() => setViewingRecord(null)}
            >
                {viewingRecord && (
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        items={[
                            ...definition.fields.map((field) => ({
                                key: field.key,
                                label: field.label,
                                children: viewingRecord[field.key] || '-',
                            })),
                            {
                                key: 'created_by',
                                label: 'สร้างโดย',
                                children: viewingRecord.created_by || '-',
                            },
                            {
                                key: 'created_at',
                                label: 'วันเวลาสร้าง',
                                children: formatThaiDateTime(
                                    viewingRecord.created_at,
                                ),
                            },
                            {
                                key: 'updated_by',
                                label: 'แก้ไขโดย',
                                children: viewingRecord.updated_by || '-',
                            },
                            {
                                key: 'updated_at',
                                label: 'วันที่แก้ไข',
                                children: formatThaiDateTime(
                                    viewingRecord.updated_at,
                                ),
                            },
                            {
                                key: 'status',
                                label: 'สถานะ',
                                children: (
                                    <Tag
                                        color={
                                            viewingRecord.status === 'active'
                                                ? 'success'
                                                : undefined
                                        }
                                    >
                                        {viewingRecord.status === 'active'
                                            ? 'ใช้งาน'
                                            : 'ไม่ใช้งาน'}
                                    </Tag>
                                ),
                            },
                        ]}
                    />
                )}
            </Modal>

            <Modal
                title={
                    editState?.mode === 'edit'
                        ? `แก้ไข${definition.itemLabel}`
                        : `เพิ่ม${definition.itemLabel}`
                }
                open={Boolean(editState)}
                okText="บันทึก"
                cancelText="ยกเลิก"
                confirmLoading={saving}
                maskClosable={!saving}
                closable={!saving}
                onOk={() => form.submit()}
                onCancel={() => setEditState(null)}
                afterClose={() => form.resetFields()}
                destroyOnHidden
            >
                <Form<MasterDataFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={renderRequiredFormMark}
                    onFinish={(values) => void handleSubmit(values)}
                >
                    {definition.fields.map((field) => (
                        <Form.Item
                            key={field.key}
                            name={field.key}
                            label={field.label}
                            rules={[
                                {
                                    required: true,
                                    whitespace: true,
                                    message: `กรุณากรอก${field.label}`,
                                },
                                {
                                    max: field.maxLength,
                                    message: `${field.label}ต้องไม่เกิน ${field.maxLength} ตัวอักษร`,
                                },
                            ]}
                        >
                            <Input
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                disabled={saving}
                            />
                        </Form.Item>
                    ))}
                </Form>
            </Modal>
        </div>
    )
}

export default function MasterDataManagementPage() {
    const { masterDataType } = useParams()

    if (!isMasterDataType(masterDataType)) {
        return <Navigate to="/master-data/high-schools" replace />
    }

    return (
        <MasterDataManagementContent
            key={masterDataType}
            resource={masterDataType}
        />
    )
}
