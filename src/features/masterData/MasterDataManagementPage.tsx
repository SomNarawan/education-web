import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Button,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Switch,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CustomTable from '../../components/custom/CustomTable'
import { renderRequiredFormMark } from '../../components/custom/RequiredFormMark'
import { useAuth } from '../../hooks/useAuth'
import {
    createManagedMasterData,
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
import {
    isMasterDataType,
    masterDataDefinitions,
} from './masterDataConfig'

dayjs.extend(utc)
dayjs.extend(timezone)

const bangkokTimezone = 'Asia/Bangkok'

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

function formatThaiDateTime(value: string | number | null) {
    if (typeof value !== 'string' || !value) return '-'

    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    const date = hasExplicitTimezone
        ? dayjs(value).tz(bangkokTimezone)
        : dayjs.tz(value, bangkokTimezone)

    if (!date.isValid()) return '-'

    return `${date.format('DD/MM')}/${date.year() + 543} ${date.format('HH:mm')} น.`
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
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null)
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
    const [editState, setEditState] = useState<EditState | null>(null)

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
                replaceRecord(updatedRecord)
                message.success(`แก้ไข${definition.itemLabel}เรียบร้อยแล้ว`)
            } else {
                const createdRecord = await createManagedMasterData(
                    resource,
                    payload,
                )
                setRecords((current) => [...current, createdRecord])
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
            replaceRecord(updatedRecord)
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

    const columns: ColumnsType<ManagedMasterDataRecord> = [
        ...definition.fields.map((field) => ({
            title: field.label,
            dataIndex: field.key,
            key: field.key,
            width: definition.fields.length > 1 ? 180 : 260,
            ellipsis: true,
        })),
        {
            title: 'สร้างโดย',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 140,
            ellipsis: true,
        },
        {
            title: 'วันที่สร้าง',
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
        {
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
        },
        {
            title: 'การจัดการ',
            key: 'actions',
            width: 80,
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                const recordLabel = getRecordLabel(
                    record,
                    definition.displayField,
                    definition.itemLabel,
                )
                const actionInProgress =
                    loadingEditId !== null || updatingStatusId !== null

                return (
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
                )
            },
        },
    ]

    const tableScrollWidth =
        definition.fields.length > 1 ? 1450 : 1050

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
                                showCount
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
