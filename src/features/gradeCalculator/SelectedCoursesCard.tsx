import { CalculatorOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Select, Space, Table } from 'antd'
import type { FormInstance } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CourseGroupPerformance, CourseSourceTag } from './GradeCourseDetails'
import type {
    CourseSource,
    GradeCalculationFormValues,
    PredictionCourse,
} from './gradeCalculator.types'
import { gradeOptions } from './gradeOptions'

interface SelectedCoursesCardProps {
    courses: PredictionCourse[]
    form: FormInstance<GradeCalculationFormValues>
    canLoadLatest: boolean
    loadingLatest: boolean
    saving: boolean
    onLoadLatest: () => Promise<void>
    onReset: () => void
    onCalculate: () => Promise<void>
    onRemove: (courseId: string) => void
    onGradeChange: () => void
}

const gradeSelectOptions = gradeOptions.map(({ label, value }) => ({ label, value }))

export default function SelectedCoursesCard({
    courses,
    form,
    canLoadLatest,
    loadingLatest,
    saving,
    onLoadLatest,
    onReset,
    onCalculate,
    onRemove,
    onGradeChange,
}: SelectedCoursesCardProps) {
    const columns: ColumnsType<PredictionCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 115 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        {
            title: 'เกรดเฉลี่ยของหมวดวิชา',
            key: 'courseGroupPerformance',
            width: 360,
            render: (_, course) => <CourseGroupPerformance {...course} />,
        },
        {
            title: 'ประเภท',
            dataIndex: 'source',
            width: 135,
            align: 'center',
            render: (source: CourseSource) => <CourseSourceTag source={source} />,
        },
        { title: 'หน่วยกิต', dataIndex: 'credits', width: 90, align: 'center' },
        {
            title: (
                <>
                    เกรดคาดการณ์
                    <span className="form-required-mark" aria-hidden="true">
                        *
                    </span>
                </>
            ),
            key: 'grade',
            width: 175,
            render: (_, course) => (
                <Form.Item
                    name={['grades', course.id]}
                    rules={[{ required: true, message: 'กรุณาเลือกเกรด' }]}
                    preserve={false}
                    style={{ marginBottom: 0 }}
                >
                    <Select
                        aria-label={`เกรดคาดการณ์วิชา ${course.code}`}
                        placeholder="เลือกเกรด"
                        options={gradeSelectOptions}
                        onChange={onGradeChange}
                    />
                </Form.Item>
            ),
        },
        {
            title: '',
            key: 'remove',
            width: 64,
            align: 'center',
            render: (_, course) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`นำวิชา ${course.code} ออก`}
                    onClick={() => onRemove(course.id)}
                />
            ),
        },
    ]

    return (
        <Card
            className="grade-calculator-card"
            title={`รายวิชาที่เลือก (${courses.length} วิชา)`}
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    loading={loadingLatest}
                    disabled={!canLoadLatest}
                    onClick={() => void onLoadLatest()}
                >
                    ดึงข้อมูลการคำนวณล่าสุด
                </Button>
            }
        >
            <Form form={form} component={false}>
                <Table<PredictionCourse>
                    className="grade-prediction-table"
                    rowKey="id"
                    columns={columns}
                    dataSource={courses}
                    locale={{ emptyText: 'ยังไม่ได้เลือกรายวิชา' }}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                    scroll={{ x: 1180 }}
                />
            </Form>
            <div className="grade-calculator-actions">
                <Space wrap>
                    <Button onClick={onReset}>คืนค่าเริ่มต้น</Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CalculatorOutlined />}
                        loading={saving}
                        disabled={courses.length === 0 || saving}
                        onClick={() => void onCalculate()}
                    >
                        คำนวณผลการเรียน
                    </Button>
                </Space>
            </div>
        </Card>
    )
}
