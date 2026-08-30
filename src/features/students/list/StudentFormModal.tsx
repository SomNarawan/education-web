import {
Card,
Col,
DatePicker,
Form,
Input,
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
import ListOfValueSelect from '../../../components/custom/ListOfValueSelect'
import { toListOfValueOptions } from '../../../utils/listOfValue'

interface StudentFormModalProps {
    open: boolean
    loading: boolean
    editingStudent: StudentDetailResponse | null
    onCancel: () => void
    onSave: (values: StudentFormValues) => void | Promise<void>
}

interface FormValues extends Omit<StudentFormValues, 'entry_year'> {
    entry_year: Dayjs
}

export default function StudentFormModal({
open,
loading,
editingStudent,
onCancel,
onSave,
}: StudentFormModalProps) {
const [form] = Form.useForm<FormValues>()
const {
    options: dropdownData,
    loading: optionsLoading,
    error: optionsError,
} = useStudentFormOptions(open)

useEffect(() => {
    if (!open) return

    if (editingStudent) {
        form.setFieldsValue({
            student_code: editingStudent.student_code,
            student_id_card: editingStudent.student_id_card,
            title_id: editingStudent.title_id,
            first_name_th: editingStudent.first_name_th,
            last_name_th: editingStudent.last_name_th,
            first_name_en: editingStudent.first_name_en,
            last_name_en: editingStudent.last_name_en,
            phone: editingStudent.phone,
            email: editingStudent.email,
            study_plan_id: editingStudent.study_plan_id,
            entry_year: dayjs().year(editingStudent.entry_year),
            teacher_id: editingStudent.teacher_id,
            admission_channel_id: editingStudent.admission_channel_id,
            high_school_id: editingStudent.high_school_id,
            guardian_title_id: editingStudent.guardian_title_id,
            guardian_first_name_th: editingStudent.guardian_first_name_th,
            guardian_last_name_th: editingStudent.guardian_last_name_th,
            guardian_relationship_id: editingStudent.guardian_relationship_id,
            guardian_phone: editingStudent.guardian_phone,
            student_status_id: editingStudent.student_status_id,
        })
    } else {
        form.resetFields()
    }
}, [open, editingStudent, form])

const handleOk = async () => {
    const values = await form.validateFields()
    const formattedValues: StudentFormValues = {
        ...values,
        entry_year: values.entry_year.year(),
        teacher_id: values.teacher_id ?? null,
    }
    await onSave(formattedValues)
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
                        {
                            pattern: /^\d+$/,
                            message: 'รหัสนิสิตต้องเป็นตัวเลขเท่านั้น',
                        },
                    ]}
                >
                    <Input maxLength={10} inputMode="numeric" />
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
                            <Input maxLength={13} />
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
                            <ListOfValueSelect
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={optionsLoading}
                                error={optionsError}
                                placeholder="เลือกคำนำหน้า"
                                options={toListOfValueOptions(
                                    dropdownData.titles,
                                )}
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
                            <Input maxLength={50} />
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
                            <Input maxLength={50} />
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
                            <Input maxLength={50} />
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
                            <Input maxLength={50} />
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
                            <Input maxLength={10} />
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
                                {
                                    type: 'email',
                                    message: 'รูปแบบอีเมลไม่ถูกต้อง',
                                },
                            ]}
                        >
                            <Input maxLength={50} />
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
                                loading={optionsLoading}
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
                            <DatePicker
                                picker="year"
                                minDate={dayjs('1901-01-01')}
                                maxDate={dayjs('2155-12-31')}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="4. อาจารย์ที่ปรึกษา" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                    label="อาจารย์ที่ปรึกษา"
                    name="teacher_id"
                >
                    <ListOfValueSelect
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={optionsLoading}
                        error={optionsError}
                        placeholder="เลือกอาจารย์ที่ปรึกษา"
                        options={toListOfValueOptions(
                            dropdownData.systemTeachers,
                        )}
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
                    <ListOfValueSelect
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={optionsLoading}
                        error={optionsError}
                        placeholder="เลือกช่องทางรับเข้า"
                        options={toListOfValueOptions(
                            dropdownData.admissionChannels,
                        )}
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
                    <ListOfValueSelect
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={optionsLoading}
                        error={optionsError}
                        placeholder="เลือกโรงเรียน"
                        options={toListOfValueOptions(
                            dropdownData.highSchools,
                        )}
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
                            <ListOfValueSelect
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={optionsLoading}
                                error={optionsError}
                                placeholder="เลือกคำนำหน้า"
                                options={toListOfValueOptions(
                                    dropdownData.titles,
                                )}
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
                            <Input maxLength={50} />
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
                            <Input maxLength={50} />
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
                            <ListOfValueSelect
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={optionsLoading}
                                error={optionsError}
                                placeholder="เลือกความสัมพันธ์"
                                options={toListOfValueOptions(
                                    dropdownData.guardianRelationships,
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
                            <Input maxLength={10} />
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
                    <ListOfValueSelect
                        allowClear
                        showSearch
                        optionFilterProp={'label'}
                        loading={optionsLoading}
                        error={optionsError}
                        placeholder="เลือกสถานะ"
                        options={toListOfValueOptions(
                            dropdownData.studentStatuses,
                        )}
                    />
                </Form.Item>
            </Card>

        </Form>
    </Modal>
)
}
