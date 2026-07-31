import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal, Popconfirm, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { NoteListResponse } from '../../../types/NoteListResponse'

const { Text } = Typography

interface NoteHistoryModalProps {
    open: boolean
    loading?: boolean
    notes: NoteListResponse[]
    onClose: () => void
    onDelete?: (id: number) => void
    showDelete?: boolean
}

function formatDate(value?: string | null) {
    if (!value) return '-'

    return dayjs(value).format('DD/MM/YYYY HH:mm')
}

export default function NoteHistoryModal({
    open,
    loading = false,
    notes,
    onClose,
    onDelete,
    showDelete = false,
}: NoteHistoryModalProps) {
    const columns: ColumnsType<NoteListResponse> = [
        {
            title: 'Note',
            dataIndex: 'note',
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>{value || '-'}</Text>
            ),
        },
        {
            title: 'Remark',
            dataIndex: 'remark',
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>{value || '-'}</Text>
            ),
        },
        {
            title: 'วันที่บันทึก',
            dataIndex: 'created_at',
            width: 180,
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>
                    {formatDate(value)}
                </Text>
            ),
        },
        {
            title: 'สร้างโดย',
            dataIndex: 'created_by',
            width: 140,
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>{value || '-'}</Text>
            ),
        },
        {
            title: 'วันที่ลบ',
            dataIndex: 'deleted_at',
            width: 180,
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>
                    {formatDate(value)}
                </Text>
            ),
        },
        {
            title: 'ลบโดย',
            dataIndex: 'deleted_by',
            width: 140,
            render: (value, record) => (
                <Text delete={!!record.deleted_by}>{value || '-'}</Text>
            ),
        },
    ]

    if (showDelete) {
        columns.push({
            title: '',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => {
                if (record.deleted_at || !onDelete) {
                    return null
                }

                return (
                    <Popconfirm
                        title="ยืนยันการลบ Note ?"
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                )
            },
        })
    }

    return (
        <Modal
            title="ประวัติ Note"
            open={open}
            onCancel={onClose}
            footer={null}
            width={1080}
        >
            <Table
                rowKey="id"
                columns={columns}
                dataSource={notes}
                loading={loading}
                pagination={false}
            />
        </Modal>
    )
}
