import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Button,
    Descriptions,
    Form,
    Input,
    Modal,
    Space,
    Switch,
    Tag,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CustomTable from '../../components/custom/CustomTable'
import { renderRequiredFormMark } from '../../components/custom/RequiredFormMark'
import SchoolLocationMap from './SchoolLocationMap'
import {
    isMasterDataType,
    masterDataDefinitions,
} from './masterDataConfig'
import type {
    MasterDataRecord,
    MasterDataType,
} from './masterDataConfig'

type MasterDataFormValues = Record<string, string>

interface EditState {
    mode: 'create' | 'edit'
    record?: MasterDataRecord
}

const mockAdministrator = 'ผู้ดูแลระบบ'

function getCurrentDateTime() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

function formatDateTime(value: string | number | null) {
    if (typeof value !== 'string' || !value) return '-'

    return dayjs(value).format('DD/MM/YYYY HH:mm')
}

function createInitialRecords(): Record<MasterDataType, MasterDataRecord[]> {
    const initialRecords = {} as Record<
        MasterDataType,
        MasterDataRecord[]
    >

    for (const key of Object.keys(masterDataDefinitions) as MasterDataType[]) {
        initialRecords[key] = masterDataDefinitions[key].mockData.map(
            (record, index) => ({
                ...record,
                created_at: `2026-07-${String(index + 1).padStart(2, '0')} 09:00:00`,
                created_by: mockAdministrator,
                updated_at:
                    index % 2 === 1 ? '2026-08-01 13:30:00' : null,
                updated_by: index % 2 === 1 ? mockAdministrator : null,
                status:
                    record.status ??
                    (index === masterDataDefinitions[key].mockData.length - 1
                        ? 'inactive'
                        : 'active'),
            }),
        )
    }

    return initialRecords
}

export default function MasterDataManagementPage() {
    const { masterDataType } = useParams()
    const [form] = Form.useForm<MasterDataFormValues>()
    const latitude = Form.useWatch('latitude', form)
    const longitude = Form.useWatch('longitude', form)
    const [recordsByType, setRecordsByType] = useState(createInitialRecords)
    const [editState, setEditState] = useState<EditState | null>(null)
    const [viewingRecord, setViewingRecord] =
        useState<MasterDataRecord | null>(null)

    const isValidType = isMasterDataType(masterDataType)
    const currentType = isValidType ? masterDataType : 'high-schools'
    const definition = masterDataDefinitions[currentType]
    const records = recordsByType[currentType]
    const visibleFields = definition.fields.filter(
        (field) => field.showInTable !== false,
    )
    const hasHiddenFields = visibleFields.length !== definition.fields.length

    function handleOpenCreate() {
        form.resetFields()
        setEditState({ mode: 'create' })
    }

    function handleOpenEdit(record: MasterDataRecord) {
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

    function handleToggleStatus(record: MasterDataRecord) {
        const nextStatus =
            record.status === 'active' ? 'inactive' : 'active'

        setRecordsByType((current) => ({
            ...current,
            [currentType]: current[currentType].map((currentRecord) =>
                currentRecord.id === record.id
                    ? {
                          ...currentRecord,
                          status: nextStatus,
                          updated_at: getCurrentDateTime(),
                          updated_by: mockAdministrator,
                      }
                    : currentRecord,
            ),
        }))
        message.success(
            `${nextStatus === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}${definition.itemLabel}เรียบร้อยแล้ว`,
        )
    }

    async function handleSubmit() {
        const values = await form.validateFields()
        const normalizedValues = Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, value.trim()]),
        )

        setRecordsByType((current) => {
            const currentRecords = current[currentType]

            if (editState?.mode === 'edit' && editState.record) {
                return {
                    ...current,
                    [currentType]: currentRecords.map((record) =>
                        record.id === editState.record?.id
                            ? {
                                  ...record,
                                  ...normalizedValues,
                                  updated_at: getCurrentDateTime(),
                                  updated_by: mockAdministrator,
                              }
                            : record,
                    ),
                }
            }

            const nextId =
                currentRecords.reduce(
                    (highestId, record) => Math.max(highestId, record.id),
                    0,
                ) + 1

            return {
                ...current,
                [currentType]: [
                    ...currentRecords,
                    {
                        id: nextId,
                        ...normalizedValues,
                        created_at: getCurrentDateTime(),
                        created_by: mockAdministrator,
                        updated_at: null,
                        updated_by: null,
                        status: 'active',
                    },
                ],
            }
        })

        message.success(
            editState?.mode === 'edit'
                ? `แก้ไข${definition.itemLabel}เรียบร้อยแล้ว`
                : `เพิ่ม${definition.itemLabel}เรียบร้อยแล้ว`,
        )
        setEditState(null)
        form.resetFields()
    }

    const columns: ColumnsType<MasterDataRecord> = [
        ...visibleFields.map((field) => ({
            title: field.label,
            dataIndex: field.key,
            key: field.key,
            width: visibleFields.length > 1 ? 140 : 220,
            ellipsis: true,
        })),
        {
            title: 'วันที่สร้าง',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 145,
            responsive: ['xl'],
            render: formatDateTime,
        },
        {
            title: 'สร้างโดย',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 110,
            ellipsis: true,
            responsive: ['xl'],
        },
        {
            title: 'วันที่แก้ไข',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 145,
            responsive: ['xl'],
            render: formatDateTime,
        },
        {
            title: 'แก้ไขโดย',
            dataIndex: 'updated_by',
            key: 'updated_by',
            width: 110,
            ellipsis: true,
            responsive: ['xl'],
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            filters: [
                { text: 'ใช้งาน', value: 'active' },
                { text: 'ไม่ใช้งาน', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status, record) => (
                <Switch
                    checked={status === 'active'}
                    checkedChildren="ใช้งาน"
                    unCheckedChildren="ไม่ใช้งาน"
                    aria-label={`สถานะ${definition.itemLabel}`}
                    style={
                        status === 'active'
                            ? { backgroundColor: '#52c41a' }
                            : undefined
                    }
                    onChange={() => handleToggleStatus(record)}
                />
            ),
        },
        {
            title: 'การจัดการ',
            key: 'actions',
            width: hasHiddenFields ? 120 : 80,
            align: 'center',
            render: (_, record) => (
                <Space>
                    {hasHiddenFields && (
                        <Button
                            icon={<EyeOutlined />}
                            aria-label={`ดูรายละเอียด${definition.itemLabel}`}
                            style={{
                                borderColor: '#1677ff',
                                color: '#1677ff',
                            }}
                            onClick={() => setViewingRecord(record)}
                        />
                    )}
                    <Button
                        icon={<EditOutlined />}
                        aria-label={`แก้ไข${definition.itemLabel}`}
                        style={{
                            borderColor: '#faad14',
                            color: '#faad14',
                        }}
                        onClick={() => handleOpenEdit(record)}
                    />
                </Space>
            ),
        },
    ]

    if (!isValidType) {
        return <Navigate to="/master-data/high-schools" replace />
    }

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
                    onClick={handleOpenCreate}
                >
                    เพิ่ม{definition.itemLabel}
                </Button>
            </div>

            <div className="table-card master-data-table-card">
                <div className="master-data-table-heading">
                    <div>
                        <h2>รายการ{definition.itemLabel}</h2>
                        <Tag color="blue">Mock data</Tag>
                    </div>
                </div>

                <CustomTable<MasterDataRecord>
                    rowKey="id"
                    showNo={false}
                    columns={columns}
                    dataSource={records}
                    searchPlaceholder={definition.searchPlaceholder}
                    tableLayout="fixed"
                    size="small"
                />
            </div>

            <Modal
                title={`รายละเอียด${definition.itemLabel}`}
                open={Boolean(viewingRecord)}
                width={currentType === 'high-schools' ? 760 : undefined}
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
                                children:
                                    viewingRecord[field.key] === null ||
                                    viewingRecord[field.key] === ''
                                        ? '-'
                                        : String(viewingRecord[field.key]),
                            })),
                            {
                                key: 'created_at',
                                label: 'วันที่สร้าง',
                                children: formatDateTime(
                                    viewingRecord.created_at,
                                ),
                            },
                            {
                                key: 'created_by',
                                label: 'สร้างโดย',
                                children:
                                    String(viewingRecord.created_by ?? '') ||
                                    '-',
                            },
                            {
                                key: 'updated_at',
                                label: 'วันที่แก้ไข',
                                children: formatDateTime(
                                    viewingRecord.updated_at,
                                ),
                            },
                            {
                                key: 'updated_by',
                                label: 'แก้ไขโดย',
                                children:
                                    String(viewingRecord.updated_by ?? '') ||
                                    '-',
                            },
                            {
                                key: 'status',
                                label: 'สถานะ',
                                children:
                                    viewingRecord.status === 'active' ? (
                                        <Tag color="success">ใช้งาน</Tag>
                                    ) : (
                                        <Tag>ไม่ใช้งาน</Tag>
                                    ),
                            },
                        ]}
                    />
                )}
                {viewingRecord && currentType === 'high-schools' && (
                    <div className="school-location-detail">
                        <h3>ตำแหน่งโรงเรียน</h3>
                        <SchoolLocationMap
                            latitude={viewingRecord.latitude}
                            longitude={viewingRecord.longitude}
                        />
                    </div>
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
                onOk={handleSubmit}
                onCancel={() => setEditState(null)}
                afterClose={() => form.resetFields()}
                destroyOnHidden
                width={currentType === 'high-schools' ? 760 : undefined}
            >
                <Form<MasterDataFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={renderRequiredFormMark}
                >
                    {definition.fields.map((field) => (
                        <Form.Item
                            key={field.key}
                            name={field.key}
                            label={field.label}
                            rules={[
                                {
                                    required: field.required,
                                    whitespace: true,
                                    message: `กรุณากรอก${field.label}`,
                                },
                                {
                                    validator: (_, value?: string) => {
                                        if (!value || !field.numberRange) {
                                            return Promise.resolve()
                                        }

                                        const numberValue = Number(value)

                                        if (
                                            !Number.isFinite(numberValue) ||
                                            numberValue <
                                                field.numberRange.min ||
                                            numberValue > field.numberRange.max
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    `${field.label}ต้องเป็นตัวเลขระหว่าง ${field.numberRange.min} ถึง ${field.numberRange.max}`,
                                                ),
                                            )
                                        }

                                        return Promise.resolve()
                                    },
                                },
                            ]}
                        >
                            <Input
                                placeholder={field.placeholder}
                                maxLength={255}
                                showCount={currentType !== 'high-schools'}
                                inputMode={
                                    field.numberRange ? 'decimal' : undefined
                                }
                            />
                        </Form.Item>
                    ))}

                    {currentType === 'high-schools' && (
                        <div className="school-location-form-field">
                            <strong>ระบุตำแหน่งบนแผนที่</strong>
                            <p>
                                คลิกบนแผนที่เพื่อปักหมุด
                                หรือลากหมุดเพื่อปรับตำแหน่ง
                            </p>
                            <SchoolLocationMap
                                editable
                                latitude={latitude}
                                longitude={longitude}
                                onPositionChange={(
                                    nextLatitude,
                                    nextLongitude,
                                ) =>
                                    form.setFieldsValue({
                                        latitude:
                                            nextLatitude.toFixed(6),
                                        longitude:
                                            nextLongitude.toFixed(6),
                                    })
                                }
                            />
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    )
}
