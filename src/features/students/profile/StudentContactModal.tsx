import { Form, Input, Modal } from 'antd'

export interface StudentContactValues {
    phone: string | null
    guardianPhone: string | null
}

interface StudentContactModalProps {
    open: boolean
    saving: boolean
    phone: string | null
    guardianPhone: string | null
    onCancel: () => void
    onSave: (values: StudentContactValues) => void | Promise<void>
}

interface ContactFormValues {
    phone?: string
    guardianPhone?: string
}

const phoneRules = [
    {
        pattern: /^0\d{8,9}$/,
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
    },
]

export default function StudentContactModal({
    open,
    saving,
    phone,
    guardianPhone,
    onCancel,
    onSave,
}: StudentContactModalProps) {
    const [form] = Form.useForm<ContactFormValues>()

    const submitForm = () => {
        void form
            .validateFields()
            .then((values) =>
                onSave({
                    phone: values.phone?.trim() || null,
                    guardianPhone: values.guardianPhone?.trim() || null,
                }),
            )
            .catch(() => undefined)
    }

    return (
        <Modal
            title="แก้ไขข้อมูลส่วนตัว"
            open={open}
            okText="บันทึก"
            cancelText="ยกเลิก"
            confirmLoading={saving}
            cancelButtonProps={{ disabled: saving }}
            closable={!saving}
            maskClosable={!saving}
            onOk={submitForm}
            onCancel={() => {
                if (!saving) onCancel()
            }}
            afterOpenChange={(isOpen) => {
                if (!isOpen) return

                form.setFieldsValue({
                    phone: phone ?? undefined,
                    guardianPhone: guardianPhone ?? undefined,
                })
            }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="เบอร์โทรศัพท์นิสิต"
                    name="phone"
                    rules={phoneRules}
                >
                    <Input
                        allowClear
                        maxLength={10}
                        inputMode="tel"
                        placeholder="กรอกเบอร์โทรศัพท์นิสิต"
                    />
                </Form.Item>

                <Form.Item
                    label="เบอร์โทรศัพท์ผู้ปกครอง"
                    name="guardianPhone"
                    rules={phoneRules}
                >
                    <Input
                        allowClear
                        maxLength={10}
                        inputMode="tel"
                        placeholder="กรอกเบอร์โทรศัพท์ผู้ปกครอง"
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
