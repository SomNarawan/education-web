import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
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
        } catch {
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

        form.setFieldsValue({
            ...student,

            title_name: student.title?.title_name_th,

            teacher_name: student.teacher
                ? `${student.teacher.title?.title_name_th ?? ''} ${student.teacher.first_name_th} ${student.teacher.last_name_th}`.trim()
                : '',

            student_status_name: student.student_status?.status_name,
            admission_channel_name: student.admission_channel?.channel_name,

            high_school_name: student.high_school?.school_name,
            district_name: student.high_school?.subdistrict?.district?.district_name,
            province_name:
                student.high_school?.subdistrict?.district?.province
                    ?.province_name,

            affiliation_name: student.affiliation?.affiliation_name_th,
            study_plan_name: student.study_plan?.name_th,
            curriculum_name:
                student.curriculum?.display_name_th ??
                student.curriculum?.name_th ??
                student.study_plan?.curriculum?.display_name_th ??
                student.study_plan?.curriculum?.name_th,

            department_name: student.department?.department_name,
            faculty_name: student.faculty?.faculty_name_th,
            campus_name: student.campus?.campus_name_th,
        })

        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()

            const savedStudent: Student = {
                id: editingStudent?.id ?? Date.now(),

                student_code: values.student_code,

                title_id: values.title_id ?? editingStudent?.title_id ?? 0,
                teacher_id: values.teacher_id ?? editingStudent?.teacher_id ?? 0,
                student_status_id:
                    values.student_status_id ??
                    editingStudent?.student_status_id ??
                    0,
                admission_channel_id:
                    values.admission_channel_id ??
                    editingStudent?.admission_channel_id ??
                    0,
                high_school_id:
                    values.high_school_id ?? editingStudent?.high_school_id ?? 0,
                affiliation_id:
                    values.affiliation_id ?? editingStudent?.affiliation_id ?? 0,
                study_plan_id:
                    values.study_plan_id ?? editingStudent?.study_plan_id ?? 0,
                curriculum_id:
                    values.curriculum_id ?? editingStudent?.curriculum_id,
                department_id:
                    values.department_id ?? editingStudent?.department_id ?? 0,
                faculty_id: values.faculty_id ?? editingStudent?.faculty_id ?? 0,
                campus_id: values.campus_id ?? editingStudent?.campus_id ?? 0,

                first_name_th: values.first_name_th,
                last_name_th: values.last_name_th,
                first_name_en: values.first_name_en ?? '',
                last_name_en: values.last_name_en ?? '',

                phone: values.phone ?? '',
                email: values.email ?? '',

                entry_year: values.entry_year ?? '',
                gpa: String(values.gpa ?? ''),

                earned_credits: values.earned_credits ?? 0,
                required_credits: values.required_credits ?? 0,

                created_at: editingStudent?.created_at ?? '',
                updated_at: editingStudent?.updated_at ?? '',
                deleted_at: null,
                is_deleted: 0,

                title: editingStudent?.title,

                teacher: editingStudent?.teacher,

                student_status: {
                    id: editingStudent?.student_status?.id ?? 0,
                    status_name: values.student_status_name ?? '',
                },

                admission_channel: {
                    id: editingStudent?.admission_channel?.id ?? 0,
                    channel_name: values.admission_channel_name ?? '',
                    description:
                        editingStudent?.admission_channel?.description ?? null,
                },

                high_school: {
                    id: editingStudent?.high_school?.id ?? 0,
                    school_name: values.high_school_name ?? '',
                    subdistrict_id:
                        editingStudent?.high_school?.subdistrict_id ?? 0,
                    subdistrict: {
                        id:
                            editingStudent?.high_school?.subdistrict?.id ??
                            0,
                        subdistrict_name:
                            editingStudent?.high_school?.subdistrict
                                ?.subdistrict_name ?? '',
                        postal_code:
                            editingStudent?.high_school?.subdistrict
                                ?.postal_code ?? '',
                        district_id:
                            editingStudent?.high_school?.subdistrict
                                ?.district_id ?? 0,
                        district: {
                            id:
                                editingStudent?.high_school?.subdistrict
                                    ?.district?.id ?? 0,
                            district_name: values.district_name ?? '',
                            province_id:
                                editingStudent?.high_school?.subdistrict
                                    ?.district?.province_id ?? 0,
                            province: {
                                id:
                                    editingStudent?.high_school?.subdistrict
                                        ?.district?.province?.id ?? 0,
                                province_name: values.province_name ?? '',
                            },
                        },
                    },
                },

                affiliation: {
                    id: editingStudent?.affiliation?.id ?? 0,
                    affiliation_name_th: values.affiliation_name ?? '',
                    affiliation_name_en:
                        editingStudent?.affiliation?.affiliation_name_en ??
                        null,
                },

                study_plan: {
                    id: editingStudent?.study_plan?.id ?? 0,
                    curriculum_id:
                        editingStudent?.study_plan?.curriculum_id ?? 0,
                    name_th: values.study_plan_name ?? '',
                    name_en: editingStudent?.study_plan?.name_en ?? null,
                    study_plan_tracks_note:
                        editingStudent?.study_plan
                            ?.study_plan_tracks_note ?? null,
                    status: editingStudent?.study_plan?.status ?? '',
                    created_at: editingStudent?.study_plan?.created_at ?? '',
                    updated_at: editingStudent?.study_plan?.updated_at ?? '',
                    curriculum: editingStudent?.study_plan?.curriculum,
                },

                curriculum: editingStudent?.curriculum
                    ? {
                          ...editingStudent.curriculum,
                          display_name_th:
                              values.curriculum_name ??
                              editingStudent.curriculum.display_name_th,
                          name_th:
                              values.curriculum_name ??
                              editingStudent.curriculum.name_th,
                      }
                    : undefined,

                department: {
                    id: editingStudent?.department?.id ?? 0,
                    department_code:
                        editingStudent?.department?.department_code ?? '',
                    department_name: values.department_name ?? '',
                    department_short_name:
                        editingStudent?.department?.department_short_name ?? '',
                },

                faculty: {
                    id: editingStudent?.faculty?.id ?? 0,
                    faculty_code: editingStudent?.faculty?.faculty_code ?? '',
                    faculty_name_th: values.faculty_name ?? '',
                    faculty_name_en:
                        editingStudent?.faculty?.faculty_name_en ?? null,
                },

                campus: {
                    id: editingStudent?.campus?.id ?? 0,
                    campus_code: editingStudent?.campus?.campus_code ?? '',
                    campus_name_th: values.campus_name ?? '',
                    campus_name_en:
                        editingStudent?.campus?.campus_name_en ?? null,
                },
            }

            if (editingStudent) {
                setStudents((prev) =>
                    prev.map((item) =>
                        item.id === editingStudent.id ? savedStudent : item,
                    ),
                )
                message.success('แก้ไขข้อมูลนิสิตสำเร็จ')
            } else {
                setStudents((prev) => [...prev, savedStudent])
                message.success('เพิ่มข้อมูลนิสิตสำเร็จ')
            }

            setIsModalOpen(false)
            form.resetFields()
        } catch {
            message.error('กรุณาตรวจสอบข้อมูลให้ครบถ้วน')
        }
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

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddModal}
                >
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
                width={1000}
            >
                <Form layout="vertical" form={form}>
                    <Card title="1. รหัสนิสิต" size="small" style={{ marginBottom: 16 }}>
                        <Form.Item
                            label="รหัสนิสิต"
                            name="student_code"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกรหัสนิสิต',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Card>

                    <Card title="2. ข้อมูลส่วนตัว" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="ชื่อภาษาไทย"
                                    name="first_name_th"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'กรุณากรอกชื่อภาษาไทย',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="นามสกุลภาษาไทย"
                                    name="last_name_th"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                'กรุณากรอกนามสกุลภาษาไทย',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="ชื่อภาษาอังกฤษ" name="first_name_en">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="นามสกุลภาษาอังกฤษ" name="last_name_en">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="เบอร์โทร" name="phone">
                                    <Input maxLength={10} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="อีเมล" name="email">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="ปีเข้าเรียน" name="entry_year">
                                    <Input placeholder="เช่น 2567 หรือ 2024" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        title="3. สังกัด / แผนการเรียน / หลักสูตร / ภาควิชา / คณะ"
                        size="small"
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="สังกัด" name="affiliation_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="แผนการเรียน" name="study_plan_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="หลักสูตร" name="curriculum_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="ภาควิชา" name="department_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="คณะ" name="faculty_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="วิทยาเขต" name="campus_name">
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="4. อาจารย์ที่ปรึกษา" size="small" style={{ marginBottom: 16 }}>
                        <Form.Item label="อาจารย์ที่ปรึกษา" name="teacher_name">
                            <Input />
                        </Form.Item>
                    </Card>

                    <Card title="5. ช่องทางรับเข้า" size="small" style={{ marginBottom: 16 }}>
                        <Form.Item label="ช่องทางรับเข้า" name="admission_channel_name">
                            <Input />
                        </Form.Item>
                    </Card>

                    <Card title="6. โรงเรียน ม.ปลาย" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="ชื่อโรงเรียน" name="high_school_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="อำเภอ / เขต" name="district_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="จังหวัด" name="province_name">
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="7. ผู้ปกครอง" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="ชื่อบิดา" name="father_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="เบอร์โทรบิดา" name="father_phone">
                                    <Input maxLength={10} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="ชื่อมารดา" name="mother_name">
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="เบอร์โทรมารดา" name="mother_phone">
                                    <Input maxLength={10} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="8. สถานะปัจจุบัน" size="small" style={{ marginBottom: 16 }}>
                        <Form.Item label="สถานะ" name="student_status_name">
                            <Select
                                allowClear
                                placeholder="เลือกสถานะ"
                                options={[
                                    {
                                        label: 'กำลังเรียน',
                                        value: 'กำลังเรียน',
                                    },
                                    {
                                        label: 'จบการศึกษา',
                                        value: 'จบการศึกษา',
                                    },
                                    {
                                        label: 'ลาออก',
                                        value: 'ลาออก',
                                    },
                                    {
                                        label: 'พักการเรียน',
                                        value: 'พักการเรียน',
                                    },
                                ]}
                            />
                        </Form.Item>
                    </Card>

                    <Card title="9. ผลการเรียนล่าสุด" size="small">
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item label="GPA / GPAX" name="gpa">
                                    <InputNumber
                                        min={0}
                                        max={4}
                                        step={0.01}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="จำนวนหน่วยกิตที่ผ่าน"
                                    name="earned_credits"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="จำนวนหน่วยกิตที่ต้องเรียน"
                                    name="required_credits"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Modal>
        </div>
    )
}