import {
Card,
Col,
Form,
Input,
InputNumber,
Modal,
Row,
Select,
} from 'antd'
import { useEffect } from 'react'
import type { Student, StudentFormValues } from '../types/student'
import type { MasterData } from '../services/masterDataCache'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'

interface StudentFormModalProps {
open: boolean
loading: boolean
editingStudent: StudentDetailResponse | null
masterData: MasterData | null
onCancel: () => void
onSave: (values: StudentFormValues) => void | Promise<void>
}

export default function StudentFormModal({
open,
loading,
editingStudent,
masterData,
onCancel,
onSave,
}: StudentFormModalProps) {
const [form] = Form.useForm<StudentDetailResponse>()

useEffect(() => {
    if (!open) return

    if (editingStudent) {
        form.setFieldsValue({
            ...editingStudent,

            // title_id: editingStudent.title_id,
            // teacher_id: editingStudent.teacher_id,
            // student_status_id: editingStudent.student_status_id,
            // admission_channel_id: editingStudent.admission_channel_id,
            // high_school_id: editingStudent.high_school_id,
            // affiliation_id: editingStudent.affiliation_id,
            // study_plan_id: editingStudent.study_plan_id,

            // guardian_title_id:
            //     editingStudent.guardian_title_id ?? undefined,
            // guardian_first_name_th:
            //     editingStudent.guardian_first_name_th ?? '',
            // guardian_last_name_th:
            //     editingStudent.guardian_last_name_th ?? '',
            // guardian_relationship_id:
            //     editingStudent.guardian_relationship_id ?? undefined,
            // guardian_phone: editingStudent.guardian_phone ?? '',
        })
    } else {
        form.resetFields()
    }
}, [open, editingStudent, form])

const handleOk = async () => {
    const values = await form.validateFields()
    // await onSave(values)
    form.resetFields()
}

return (
    <Modal
        title={editingStudent ? 'แก้ไขข้อมูลนิสิต' : 'เพิ่มข้อมูลนิสิต'}
        open={open}
        onOk={handleOk}
        onCancel={onCancel}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={1000}
        confirmLoading={loading}
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
                        <Form.Item label="คำนำหน้า" name="title_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกคำนำหน้า"
                                options={masterData?.titles.map((item) => ({
                                    label: item.title_name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

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
                                    message: 'กรุณากรอกนามสกุลภาษาไทย',
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
                        <Form.Item label="สังกัด" name="affiliation_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกสังกัด"
                                options={masterData?.affiliations.map((item) => ({
                                    label: item.affiliation_name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="แผนการเรียน" name="study_plan_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกแผนการเรียน"
                                options={masterData?.studyPlans.map((item) => ({
                                    label: item.name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="หลักสูตร" name="curriculum_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกหลักสูตร"
                                options={masterData?.curriculums.map((item) => ({
                                    label: item.display_name_th ?? item.name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="ภาควิชา" name="department_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกภาควิชา"
                                options={masterData?.departments.map((item) => ({
                                    label: item.department_name,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="คณะ" name="faculty_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกคณะ"
                                options={masterData?.faculties.map((item) => ({
                                    label: item.faculty_name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="วิทยาเขต" name="campus_id">
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกวิทยาเขต"
                                options={masterData?.campuses.map((item) => ({
                                    label: item.campus_name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="4. อาจารย์ที่ปรึกษา" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="อาจารย์ที่ปรึกษา" name="teacher_id">
                    <Select
                        allowClear
                        showSearch
                        loading={loading}
                        placeholder="เลือกอาจารย์ที่ปรึกษา"
                        optionFilterProp="label"
                        options={masterData?.teachers.map((item) => ({
                            label: `${item.title?.title_name_th ?? ''} ${item.first_name_th} ${item.last_name_th}`.trim(),
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="5. ช่องทางรับเข้า" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="ช่องทางรับเข้า" name="admission_channel_id">
                    <Select
                        allowClear
                        loading={loading}
                        placeholder="เลือกช่องทางรับเข้า"
                        options={masterData?.admissionChannels.map((item) => ({
                            label: item.channel_name,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="6. โรงเรียน ม.ปลาย" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="ชื่อโรงเรียน" name="high_school_id">
                    <Select
                        allowClear
                        showSearch
                        loading={loading}
                        placeholder="เลือกโรงเรียน"
                        optionFilterProp="label"
                        options={masterData?.highSchools.map((item) => ({
                            label: item.school_name,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="7. ผู้ปกครอง" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="คำนำหน้าผู้ปกครอง"
                            name="guardian_title_id"
                        >
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกคำนำหน้า"
                                options={masterData?.titles.map((item) => ({
                                    label: item.title_name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="ความสัมพันธ์"
                            name="guardian_relationship_id"
                        >
                            <Select
                                allowClear
                                loading={loading}
                                placeholder="เลือกความสัมพันธ์"
                                options={masterData?.guardianRelationships.map(
                                    (item) => ({
                                        label: item.relationship_name,
                                        value: item.id,
                                    }),
                                )}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="ชื่อผู้ปกครอง"
                            name="guardian_first_name_th"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="นามสกุลผู้ปกครอง"
                            name="guardian_last_name_th"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="เบอร์โทรผู้ปกครอง" name="guardian_phone">
                            <Input maxLength={10} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="8. สถานะปัจจุบัน" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="สถานะ" name="student_status_id">
                    <Select
                        allowClear
                        loading={loading}
                        placeholder="เลือกสถานะ"
                        options={masterData?.studentStatuses.map((item) => ({
                            label: item.status_name,
                            value: item.id,
                        }))}
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
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label="จำนวนหน่วยกิตที่ต้องเรียน"
                            name="required_credits"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </Form>
    </Modal>
)
}