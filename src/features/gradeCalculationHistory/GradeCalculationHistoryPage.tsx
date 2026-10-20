import { EyeOutlined } from '@ant-design/icons'
import {
    Button,
    Empty,
    Modal,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { appMode } from '../../config/appMode'
import { useAuth } from '../../hooks/useAuth'
import { getGradeCalculations } from '../../services/gradeCalculationService'
import type {
    GradeCalculation,
    GradeCalculationCourse,
    GradeCalculationCourseSource,
} from '../../types/GradeCalculation'

const { Text } = Typography

interface GradeCalculationHistoryModalProps {
    open: boolean
    studentId: number | null
    studentLabel: string
    onClose: () => void
}

const sourceLabels: Record<
    GradeCalculationCourseSource,
    { label: string; color: string }
> = {
    backlog: { label: 'วิชาคงค้าง', color: 'error' },
    'next-semester': { label: 'วิชาที่ต้องลง', color: 'processing' },
    other: { label: 'วิชาอื่น', color: 'default' },
}

function renderGpaxWithChange(currentGpax: number, previousGpax: number) {
    const change = Number((currentGpax - previousGpax).toFixed(2))
    const changeText =
        change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
    const changeClassName =
        change > 0
            ? 'grade-calculation-gpax-change-positive'
            : change < 0
              ? 'grade-calculation-gpax-change-negative'
              : 'grade-calculation-gpax-change-neutral'

    return (
        <span className="grade-calculation-gpax-value">
            {currentGpax.toFixed(2)}{' '}
            <span className={changeClassName}>({changeText})</span>
        </span>
    )
}

function renderCourseGroupPerformance(course: GradeCalculationCourse) {
    if (!course.course_group) return '-'

    return (
        <span className="grade-course-group-performance">
            <span>{course.course_group}</span>
            <Text type="secondary">
                เกรดเฉลี่ย{' '}
                {course.course_group_gpa == null
                    ? '-'
                    : course.course_group_gpa.toFixed(2)}
            </Text>
        </span>
    )
}

export default function GradeCalculationHistoryModal({
    open,
    studentId,
    studentLabel,
    onClose,
}: GradeCalculationHistoryModalProps) {
    const { currentRole } = useAuth()
    const isStudent = appMode === 'student' || currentRole === 'student'
    const [calculations, setCalculations] = useState<GradeCalculation[]>([])
    const [selectedCalculation, setSelectedCalculation] =
        useState<GradeCalculation | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (!open) return

        if (!isStudent && !studentId) return

        let cancelled = false

        const loadHistory = async () => {
            try {
                setLoading(true)
                const data = await getGradeCalculations({
                    student_id: isStudent ? undefined : (studentId ?? undefined),
                    page,
                    per_page: pageSize,
                })

                if (cancelled) return

                setCalculations(data.items)
                setTotal(data.pagination.total)
            } catch (error) {
                if (cancelled) return

                console.error('Unable to load grade calculation history', error)
                setCalculations([])
                setTotal(0)
                message.error('โหลดประวัติการคำนวณผลการเรียนไม่สำเร็จ')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void loadHistory()

        return () => {
            cancelled = true
        }
    }, [isStudent, open, page, pageSize, studentId])

    const columns: ColumnsType<GradeCalculation> = [
        {
            title: 'วันที่คำนวณ',
            dataIndex: 'created_at',
            width: 165,
            render: (value: string) =>
                dayjs(value).format('DD/MM/YYYY HH:mm น.'),
        },

            {
                title: 'ภาคการศึกษาที่คาดการณ์',
                key: 'term',
                align: 'center',
                render: (_, record) =>
                    `ชั้นปี ${record.study_year} ${record.semester}`,
            },
            {
                title: 'จำนวนวิชา',
                dataIndex: 'courses',
                align: 'center',
                width: 105,
                render: (courses: GradeCalculationCourse[]) =>
                    `${courses.length} วิชา`,
            },
            {
                title: 'GPAX ภาคก่อนหน้า',
                dataIndex: 'current_gpax',
                align: 'center',
                width: 130,
                render: (value: number) => value.toFixed(2),
            },
            {
                title: 'GPA คาดการณ์',
                dataIndex: 'term_gpa',
                align: 'center',
                width: 120,
                render: (value: number) => value.toFixed(2),
            },
            {
                title: 'GPAX คาดการณ์',
                dataIndex: 'cumulative_gpa',
                align: 'center',
                width: 175,
                render: (value: number, record) =>
                    renderGpaxWithChange(value, record.current_gpax),
            },
            {
                title: '',
                key: 'actions',
                align: 'center',
                width: 115,
                render: (_, record) => (
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => setSelectedCalculation(record)}
                    >
                        ดูรายละเอียด
                    </Button>
                ),
            },
    ]

    const courseColumns: ColumnsType<GradeCalculationCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 110 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        {
            title: 'เกรดเฉลี่ยของหมวดวิชา',
            key: 'courseGroupPerformance',
            width: 360,
            render: (_, course) => renderCourseGroupPerformance(course),
        },
        {
            title: 'ประเภท',
            dataIndex: 'source',
            align: 'center',
            width: 125,
            render: (source: GradeCalculationCourseSource) => (
                <Tag color={sourceLabels[source].color}>
                    {sourceLabels[source].label}
                </Tag>
            ),
        },
        { title: 'หน่วยกิต', dataIndex: 'credits', align: 'center', width: 85 },
        { title: 'เกรด', dataIndex: 'grade', align: 'center', width: 75 },
        {
            title: 'คะแนนเกรด',
            dataIndex: 'grade_points',
            align: 'center',
            width: 105,
            render: (value: number) => value.toFixed(2),
        },
    ]

    const handleTableChange = (pagination: TablePaginationConfig) => {
        setPage(pagination.current ?? 1)
        setPageSize(pagination.pageSize ?? 20)
    }

    const handleClose = () => {
        setSelectedCalculation(null)
        setPage(1)
        onClose()
    }

    return (
        <>
            <Modal
                width={1300}
                open={open}
                title="ประวัติการคำนวณผลการเรียน"
                footer={null}
                onCancel={handleClose}
            >
                <div className="grade-calculation-history-student">
                    <Text type="secondary">ประวัติของนิสิต</Text>
                    <Text strong>{studentLabel}</Text>
                </div>

                <Table<GradeCalculation>
                    rowKey="id"
                    columns={columns}
                    dataSource={calculations}
                    loading={loading}
                    locale={{
                        emptyText: (
                            <Empty description="ไม่พบประวัติการคำนวณผลการเรียน" />
                        ),
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (value) => `ทั้งหมด ${value} รายการ`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </Modal>

            <Modal
                width={1200}
                open={selectedCalculation !== null}
                title={
                    selectedCalculation
                        ? `รายละเอียดการคำนวณ ชั้นปี ${selectedCalculation.study_year} ${selectedCalculation.semester}`
                        : undefined
                }
                footer={null}
                onCancel={() => setSelectedCalculation(null)}
            >
                {selectedCalculation && (
                    <>
                        <div className="grade-calculation-history-summary">
                            <Text>
                                GPAX ภาคก่อนหน้า{' '}
                                <strong>
                                    {selectedCalculation.current_gpax.toFixed(2)}
                                </strong>
                            </Text>
                            <Text>
                                GPA คาดการณ์{' '}
                                <strong>
                                    {selectedCalculation.term_gpa.toFixed(2)}
                                </strong>
                            </Text>
                            <Text>
                                GPAX คาดการณ์{' '}
                                <strong>
                                    {renderGpaxWithChange(
                                        selectedCalculation.cumulative_gpa,
                                        selectedCalculation.current_gpax,
                                    )}
                                </strong>
                            </Text>
                            <Text>
                                หน่วยกิตสะสม{' '}
                                <strong>
                                    {selectedCalculation.cumulative_credits}
                                </strong>
                            </Text>
                        </div>
                        <Table<GradeCalculationCourse>
                            rowKey={(course) =>
                                `${course.source}-${course.code}`
                            }
                            columns={courseColumns}
                            dataSource={selectedCalculation.courses}
                            pagination={false}
                            size="small"
                            scroll={{ x: 1100 }}
                        />
                    </>
                )}
            </Modal>
        </>
    )
}
