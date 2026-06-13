import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Student } from '../types/student'
import CustomTable from './custom/CustomTable'

interface StudentTableProps {
    students: Student[]
    loading?: boolean
    onEdit: (student: Student) => void
    onDelete: (id: number) => void
    studentGroup?: string
    studentStatus?: string
}

export default function StudentTable({
    students,
    loading = false,
    onEdit,
    onDelete,
    studentGroup,
    studentStatus,
}: StudentTableProps) {
    const navigate = useNavigate()

    const isDepartmentPage = studentGroup === 'department'

    const advisorColumn: ColumnsType<Student>[number] = {
        title: 'อาจารย์ที่ปรึกษา',
        width: 180,
        render: (_, record) => {
            if (!record.teacher) {
                return '-'
            }

            return `${record.teacher.title?.title_name_th ?? ''} ${record.teacher.first_name_th} ${record.teacher.last_name_th}`.trim()
        },
    }

    const columns: ColumnsType<Student> = [
        {
            title: 'รหัสนิสิต',
            dataIndex: 'student_code',
            align: 'center',
            width: 130,
        },
        {
            title: 'ชื่อ-นามสกุล',
            width: 180,
            render: (_, record) =>
                `${record.title?.title_name_th ?? ''} ${record.first_name_th} ${record.last_name_th}`,
        },

        ...(isDepartmentPage ? [advisorColumn] : []),

        {
            title: 'ประเภทหลักสูตร',
            width: 260,
            render: (_, record) => {
                const degree =
                    record.study_plan?.curriculum?.degree_short_name_th ?? '-'

                const planName = record.study_plan?.name_th ?? '-'

                return (
                    <div>
                        <div>{degree}</div>
                        <Tag color="blue">{planName}</Tag>
                    </div>
                )
            },
        },
        {
            title: 'หน่วยกิตที่ลงทะเบียน (ทั้งหมด/ผ่าน/ไม่ผ่าน)',
            align: 'center',
            width: 260,
            render: (_, record) => {
                const requiredCredits = record.required_credits ?? 0
                const earnedCredits = record.earned_credits ?? 0
                const notPassedCredits = requiredCredits - earnedCredits

                return (
                    <Space>
                        <Tag color="green">{requiredCredits}</Tag>
                        <Tag color="green">{earnedCredits}</Tag>
                        <Tag color="red">{notPassedCredits}</Tag>
                    </Space>
                )
            },
        },
        {
            title: 'GPAX',
            dataIndex: 'gpa',
            align: 'center',
            width: 100,
            render: (gpa) => gpa ?? '-',
        },
        {
            title: 'รายละเอียด',
            align: 'center',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        style={{
                            borderColor: '#1677ff',
                            color: '#1677ff',
                        }}
                        onClick={() =>
                            navigate(`/students/detail/${record.id}`)
                        }
                    />

                    <Button
                        icon={<EditOutlined />}
                        style={{
                            borderColor: '#faad14',
                            color: '#faad14',
                        }}
                        onClick={() => onEdit(record)}
                    />

                    <Popconfirm
                        title="ยืนยันการลบข้อมูลนิสิต?"
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <CustomTable<Student>
            rowKey="id"
            columns={columns}
            dataSource={students}
            loading={loading}
        />
    )
}