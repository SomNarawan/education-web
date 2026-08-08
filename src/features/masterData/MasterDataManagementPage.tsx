import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
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
                    index === masterDataDefinitions[key].mockData.length - 1
                        ? 'I'
                        : 'A',
            }),
        )
    }

    return initialRecords
}

export default function MasterDataManagementPage() {
    const { masterDataType } = useParams()
    const [form] = Form.useForm<MasterDataFormValues>()
    const [recordsByType, setRecordsByType] = useState(createInitialRecords)
    const [editState, setEditState] = useState<EditState | null>(null)

    const isValidType = isMasterDataType(masterDataType)
    const currentType = isValidType ? masterDataType : 'high-schools'
    const definition = masterDataDefinitions[currentType]
    const records = recordsByType[currentType]

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
        const nextStatus = record.status === 'A' ? 'I' : 'A'

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
            `${nextStatus === 'A' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}${definition.itemLabel}เรียบร้อยแล้ว`,
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
                        status: 'A',
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
        ...definition.fields.map((field) => ({
            title: field.label,
            dataIndex: field.key,
            key: field.key,
            width: definition.fields.length > 1 ? 140 : 220,
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
                { text: 'ใช้งาน', value: 'A' },
                { text: 'ไม่ใช้งาน', value: 'I' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status, record) => (
                <Switch
                    checked={status === 'A'}
                    checkedChildren="ใช้งาน"
                    unCheckedChildren="ไม่ใช้งาน"
                    aria-label={`สถานะ${definition.itemLabel}`}
                    style={
                        status === 'A'
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
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Space>
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

            <Alert
                type="info"
                showIcon
                message="ขณะนี้เป็นข้อมูลตัวอย่าง"
                description="การเพิ่ม แก้ไข และเปลี่ยนสถานะจะมีผลเฉพาะในหน้านี้ และข้อมูลจะกลับเป็นค่าเริ่มต้นเมื่อรีเฟรชหน้าเว็บ"
            />

            <div className="table-card master-data-table-card">
                <div className="master-data-table-heading">
                    <div>
                        <h2>รายการ{definition.itemLabel}</h2>
                        <Tag color="blue">Mock data</Tag>
                    </div>
                </div>

                <CustomTable<MasterDataRecord>
                    rowKey="id"
                    columns={columns}
                    dataSource={records}
                    searchPlaceholder={definition.searchPlaceholder}
                    tableLayout="fixed"
                    size="small"
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
                onOk={handleSubmit}
                onCancel={() => setEditState(null)}
                afterClose={() => form.resetFields()}
                destroyOnHidden
            >
                <Form<MasterDataFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark="optional"
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
                            ]}
                        >
                            <Input
                                placeholder={field.placeholder}
                                maxLength={255}
                                showCount
                            />
                        </Form.Item>
                    ))}
                </Form>
            </Modal>
        </div>
    )
}
