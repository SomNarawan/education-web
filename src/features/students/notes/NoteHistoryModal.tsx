import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { NoteListResponse } from '../../../types/NoteListResponse'
import { formatThaiDateTime } from '../../../utils/dateFormat'
import { showConfirmModal } from '../../../components/custom/confirmModalHelpers'

const { Text } = Typography

interface NoteHistoryModalProps {
    open: boolean
    loading?: boolean
    notes: NoteListResponse[]
    onClose: () => void
    onDelete?: (id: number) => void | Promise<void>
    showDelete?: boolean
}

export default function NoteHistoryModal({
    open,
    loading = false,
    notes,
    onClose,
    onDelete,
    showDelete = false,
}: NoteHistoryModalProps) {
    const showDeleteConfirm = (record: NoteListResponse) => {
        if (!onDelete) return

        showConfirmModal({
            title: 'ยืนยันการลบ Note',
            content: 'ต้องการลบ Note รายการนี้ใช่หรือไม่',
            okText: 'ลบ Note',
            okButtonProps: { danger: true },
            onOk: () => onDelete(record.id),
        })
    }

    const columns: ColumnsType<NoteListResponse> = [
        {
            title: 'Note',
            dataIndex: 'note',
            render: (value, record) => (
                <Text delete={!!record.deleted_at}>{value || '-'}</Text>
            ),
        },
        {
            title: 'รายละเอียด Note',
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
                    {formatThaiDateTime(value)}
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
                    {formatThaiDateTime(value)}
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
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record)}
                    />
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
