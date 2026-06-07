import {
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import StudentTable from '../components/StudentTable'
import type { Student, StudentFormValues } from '../types/student'
import { getStudentDetail } from '../services/studentService'

export default function StudentList() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)

    const [form] = Form.useForm<StudentFormValues>()

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        try {
            setLoading(true)
            const data = await getStudentDetail()
            setStudents(data)
        } catch (error) {
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingStudent(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const openEditModal = (student: Student) => {
        setEditingStudent(student)
        form.setFieldsValue(student)
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        const values = await form.validateFields()

        if (editingStudent) {
            setStudents((prev) =>
                prev.map((item) =>
                    item.id === editingStudent.id
                        ? { ...item, ...values }
                        : item,
                ),
            )
            message.success('แก้ไขข้อมูลนิสิตสำเร็จ')
        } else {
            const newStudent: Student = {
                id: Date.now(),
                ...values,
                created_at: '',
                updated_at: '',
                deleted_at: null,
                is_deleted: 0,
            }

            setStudents((prev) => [...prev, newStudent])
            message.success('เพิ่มข้อมูลนิสิตสำเร็จ')
        }

        setIsModalOpen(false)
        form.resetFields()
    }

    const handleDelete = (id: number) => {
        setStudents((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, is_deleted: 1 } : item,
            ),
        )

        message.success('ลบข้อมูลนิสิตสำเร็จ')
    }

    const activeStudents = students.filter((item) => item.is_deleted === 0)

    return (
        <div className="student-page">
            <div className="page-title-section">
                <div>
                    <h1>ฐานข้อมูลนิสิต</h1>
                    <p>จัดการข้อมูลนิสิต เพิ่ม ลบ แก้ไข และดูรายละเอียด</p>
                </div>

                <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                    เพิ่มนิสิต
                </Button>
            </div>

            <div className="table-card">
                <StudentTable
                    students={activeStudents}
                    loading={loading}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                />
            </div>

            <Modal
                title={editingStudent ? 'แก้ไขข้อมูลนิสิต' : 'เพิ่มข้อมูลนิสิต'}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                okText="บันทึก"
                cancelText="ยกเลิก"
                width={850}
            >
                <Form layout="vertical" form={form}>
                    <div className="form-grid">
                        <Form.Item label="รหัสนิสิต" name="student_code">
                            <Input />
                        </Form.Item>

                        <Form.Item label="ชื่อภาษาไทย" name="first_name_th">
                            <Input />
                        </Form.Item>

                        <Form.Item label="นามสกุลภาษาไทย" name="last_name_th">
                            <Input />
                        </Form.Item>

                        <Form.Item label="GPAX" name="gpa">
                            <InputNumber min={0} max={4} step={0.01} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="หน่วยกิตที่ผ่าน" name="earned_credits">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="หน่วยกิตที่ต้องเรียน" name="required_credits">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}