import {
Card,
Col,
DatePicker,
Form,
Input,
InputNumber,
Modal,
Row,
Select,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect } from 'react'
import type { StudentFormValues } from '../../../types/StudentFormValues'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'
import { useStudentFormOptions } from './useStudentFormOptions'
import { renderRequiredFormMark } from '../../../components/custom/RequiredFormMark'

interface StudentFormModalProps {
    open: boolean
    loading: boolean
    editingStudent: StudentDetailResponse | null
    onCancel: () => void
    onSave: (values: StudentFormValues) => void | Promise<void>
}

interface FormValues extends Omit<StudentFormValues, 'entry_year'> {
    entry_year?: Dayjs
}

export default function StudentFormModal({
open,
loading,
editingStudent,
onCancel,
onSave,
}: StudentFormModalProps) {
const [form] = Form.useForm<FormValues>()
const { options: dropdownData, loading: optionsLoading } =
    useStudentFormOptions(open)

useEffect(() => {
    if (!open) return

    if (editingStudent) {
        form.setFieldsValue({
            ...editingStudent,
            entry_year: editingStudent.entry_year ? dayjs().year(editingStudent.entry_year) : undefined,
        })
    } else {
        form.resetFields()
    }
}, [open, editingStudent, form])

const handleOk = async () => {
    const values = await form.validateFields()
    const formattedValues = {
        ...values,
        entry_year: values.entry_year?.year?.() ?? undefined,
    } as StudentFormValues
    await onSave(formattedValues)
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
        confirmLoading={loading || optionsLoading}
    >
        <Form
            layout="vertical"
            form={form}
            requiredMark={renderRequiredFormMark}
        >
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
                    <Input maxLength={150} showCount />
                </Form.Item>
            </Card>

            <Card title="2. ข้อมูลส่วนตัว" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} md={24}>
                        <Form.Item
                            label="เลขบัตรประชาชน"
                            name="student_id_card"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกเลขบัตรประชาชน',
                                },
                            ]}
                        >
                            <Input maxLength={13} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                        <Form.Item
                            label="คำนำหน้า"
                            name="title_id"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกคำนำหน้า',
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={loading}
                                placeholder="เลือกคำนำหน้า"
                                options={dropdownData.titles.map((item) => ({
                                    label: item.title_abbr_th + ' / ' + item.title_abbr_en,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={9}>
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
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={9}>
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
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="ชื่อภาษาอังกฤษ"
                            name="first_name_en"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกชื่อภาษาอังกฤษ',
                                },
                            ]}
                        >
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="นามสกุลภาษาอังกฤษ"
                            name="last_name_en"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกนามสกุลภาษาอังกฤษ',
                                },
                            ]}
                        >
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="เบอร์โทร"
                            name="phone"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกเบอร์โทร',
                                },
                            ]}
                        >
                            <Input maxLength={10} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="อีเมล"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกอีเมล',
                                },
                            ]}
                        >
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card
                title="3. แผนการเรียน"
                size="small"
                style={{ marginBottom: 16 }}
            >
                <Row gutter={16}>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="แผนการเรียน"
                            name="study_plan_id"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกแผนการเรียน',
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={loading}
                                placeholder="เลือกแผนการเรียน"
                                options={dropdownData.studyPlans.map((item) => ({
                                    label: item.name_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="ปีเข้าเรียน"
                            name="entry_year"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกปีเข้าเรียน',
                                },
                            ]}
                        >
                            <DatePicker picker="year" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="4. อาจารย์ที่ปรึกษา" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                    label="อาจารย์ที่ปรึกษา"
                    name="teacher_id"
                >
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={loading}
                        placeholder="เลือกอาจารย์ที่ปรึกษา"
                        options={dropdownData.teachers.map((item) => ({
                            label: item.full_name_th,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="5. ช่องทางรับเข้า" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                    label="ช่องทางรับเข้า"
                    name="admission_channel_id"
                    rules={[
                        {
                            required: true,
                            message: 'กรุณาเลือกช่องทางรับเข้า',
                        },
                    ]}
                >
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={loading}
                        placeholder="เลือกช่องทางรับเข้า"
                        options={dropdownData.admissionChannels.map((item) => ({
                            label: item.channel_name,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="6. โรงเรียน ม.ปลาย" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                    label="ชื่อโรงเรียน"
                    name="high_school_id"
                    rules={[
                        {
                            required: true,
                            message: 'กรุณาเลือกโรงเรียน',
                        },
                    ]}
                >
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={loading}
                        placeholder="เลือกโรงเรียน"
                        options={dropdownData.highSchools.map((item) => ({
                            label: item.school_name,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="7. ผู้ปกครอง" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} md={6}>
                        <Form.Item
                            label="คำนำหน้าผู้ปกครอง"
                            name="guardian_title_id"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกคำนำหน้าผู้ปกครอง',
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={loading}
                                placeholder="เลือกคำนำหน้า"
                                options={dropdownData.titles.map((item) => ({
                                    label: item.title_abbr_th,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={9}>
                        <Form.Item
                            label="ชื่อผู้ปกครอง"
                            name="guardian_first_name_th"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกชื่อผู้ปกครอง',
                                },
                            ]}
                        >
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={9}>
                        <Form.Item
                            label="นามสกุลผู้ปกครอง"
                            name="guardian_last_name_th"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกนามสกุลผู้ปกครอง',
                                },
                            ]}
                        >
                            <Input maxLength={150} showCount />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="ความสัมพันธ์"
                            name="guardian_relationship_id"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกความสัมพันธ์',
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={loading}
                                placeholder="เลือกความสัมพันธ์"
                                options={dropdownData.guardianRelationships.map(
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
                            label="เบอร์โทรผู้ปกครอง"
                            name="guardian_phone"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอกเบอร์โทรผู้ปกครอง',
                                },
                            ]}
                        >
                            <Input maxLength={10} showCount />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="8. สถานะปัจจุบัน" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                    label="สถานะ"
                    name="student_status_id"
                    rules={[
                        {
                            required: true,
                            message: 'กรุณาเลือกสถานะ',
                        },
                    ]}
                >
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={loading}
                        placeholder="เลือกสถานะ"
                        options={dropdownData.studentStatuses.map((item) => ({
                            label: item.status_name,
                            value: item.id,
                        }))}
                    />
                </Form.Item>
            </Card>

            <Card title="9. ผลการเรียนล่าสุด" size="small">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="GPA"
                            name="gpa"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอก GPA',
                                },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                max={4}
                                step={0.01}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="GPAX"
                            name="gpax"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณากรอก GPAX',
                                },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                max={4}
                                step={0.01}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="จำนวนหน่วยกิตที่ผ่าน"
                            name="passed_credits"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="จำนวนหน่วยกิตที่ไม่ผ่าน"
                            name="not_passed_credits"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="จำนวนหน่วยกิตที่เกิน"
                            name="overed_credits"
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
