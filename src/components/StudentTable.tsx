import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import type { StudentListResponse } from '../types/StudentListResponse'
import CustomTable from './custom/CustomTable'

interface StudentTableProps {
    students: StudentListResponse[]
    loading?: boolean
    onEdit: (id: number) => void
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
}: StudentTableProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const isDepartmentPage = studentGroup === 'department'

    const advisorColumn: ColumnsType<StudentListResponse>[number] = {
        title: 'อาจารย์ที่ปรึกษา',
        dataIndex: 'teacher_full_name_th',
        width: 180,
        render: (value) => value || '-',
    }

    const columns: ColumnsType<StudentListResponse> = [
        {
            title: 'รหัสนิสิต',
            dataIndex: 'student_code',
            align: 'center',
            width: 130,
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'full_name_th',
            width: 180,
            render: (value) => value || '-',
        },

        ...(isDepartmentPage ? [advisorColumn] : []),

        {
            title: 'ประเภทหลักสูตร',
            width: 260,
            render: (_, record) => {
                const degree = record.curriculum_type || '-'
                const planName = record.study_plan_name || '-'

                return (
                    <div>
                        <div>{degree}</div>
                        <Tag color="blue">{planName}</Tag>
                    </div>
                )
            },
        },
        {
            title: 'หน่วยกิตที่ลงทะเบียน (ทั้งหมด/ผ่าน/ไม่ผ่าน/เกิน)',
            align: 'center',
            width: 260,
            render: (_, record) => {
                const requiredCredits = Number(record.required_credits ?? 0)
                const passedCredits = Number(record.passed_credits ?? 0)
                const notPassedCredits = Number(record.not_passed_credits ?? 0)
                const overedCredits = Number(record.overed_credits ?? 0)

                return (
                    <Space>
                        <Tag color="default">{requiredCredits}</Tag>
                        <Tag color="green">{passedCredits}</Tag>
                        <Tag color="red">{notPassedCredits}</Tag>
                        <Tag color="orange">{overedCredits}</Tag>
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
                            navigate(`/students/detail/${record.id}`, {
                                state: {
                                    from: location.pathname,
                                },
                            })
                        }
                    />

                    <Button
                        icon={<EditOutlined />}
                        style={{
                            borderColor: '#faad14',
                            color: '#faad14',
                        }}
                        onClick={() => onEdit(record.id)}
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
        <CustomTable<StudentListResponse>
            rowKey="id"
            columns={columns}
            dataSource={students}
            loading={loading}
        />
    )
}