import {
    CalculatorOutlined,
    DeleteOutlined,
    HistoryOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Empty,
    Form,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { appMode } from '../../config/appMode'
import GradeCalculationHistoryModal from '../gradeCalculationHistory/GradeCalculationHistoryPage'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'
import { createGradeCalculation } from '../../services/gradeCalculationService'
import {
    getStudentAcademicOverview,
    getStudentUnattemptedCourses,
} from '../../services/studentAcademicOverviewService'
import {
    getStudentDetailByCode,
    getStudents,
} from '../../services/studentService'
import type {
    StudentAcademicHistory,
    StudentAcademicOverview,
    StudentUnattemptedCoursesData,
} from '../../types/StudentAcademicOverview'
import { gradeOptions } from './gradeOptions'

const { Text } = Typography

type CourseSource = 'backlog' | 'next-semester' | 'other'

interface StudentOption {
    id: number
    studentCode: string
    fullName: string
}

interface PredictionCourse {
    id: string
    code: string
    name: string
    credits: number
    source: CourseSource
    reason: string
}

interface CalculatedCourse extends PredictionCourse {
    grade: string
    gradePoints: number
}

interface GradeCalculationResult {
    termGpa: number
    cumulativeCredits: number
    cumulativeGpa: number
    courses: CalculatedCourse[]
}

interface GradeCalculationFormValues {
    grades?: Record<string, string>
}

const sourceLabels: Record<CourseSource, { label: string; color: string }> = {
    backlog: { label: 'วิชาคงค้าง', color: 'error' },
    'next-semester': { label: 'วิชาที่ต้องลง', color: 'processing' },
    other: { label: 'วิชาอื่น', color: 'default' },
}

function formatTerm(year: number, semester: string) {
    return `ชั้นปี ${year} ${semester}`
}

function formatDecimal(value: number | null) {
    return value === null ? '-' : value.toFixed(2)
}

function getGpaChangePresentation(change: number) {
    const roundedChange = Number(change.toFixed(2))

    return {
        text:
            roundedChange > 0
                ? `+${roundedChange.toFixed(2)}`
                : roundedChange.toFixed(2),
        color:
            roundedChange > 0
                ? '#52c41a'
                : roundedChange < 0
                  ? '#ff4d4f'
                  : '#64748b',
    }
}

function buildPredictionCourses(
    overview: StudentAcademicOverview,
    unattempted: StudentUnattemptedCoursesData,
): PredictionCourse[] {
    const backlog = overview.pending_courses.map((course, index) => ({
        id: `backlog-${course.course_code ?? 'course'}-${index}`,
        code: course.course_code ?? '-',
        name: course.course_name_th ?? '-',
        credits: course.credit ?? 0,
        source: 'backlog' as const,
        reason: course.previous_grade
            ? `ผลการเรียนเดิม ${course.previous_grade}`
            : 'ยังไม่มีผลการเรียน',
    }))
    const nextSemester = overview.next_term.courses.map((course, index) => {
        const category =
            course.course_group ??
            course.course_sub_category ??
            course.course_category

        return {
            id: `next-semester-${course.course_code ?? 'course'}-${index}`,
            code: course.course_code ?? '-',
            name: course.course_name_th ?? '-',
            credits: course.credit ?? 0,
            source: 'next-semester' as const,
            reason: category ?? 'รายวิชาตามแผนการเรียน',
        }
    })
    const other = unattempted.courses.map((course, index) => {
        const category =
            course.course_group ??
            course.course_sub_category ??
            course.course_category

        return {
            id: `other-${course.course_code ?? 'course'}-${index}`,
            code: course.course_code ?? '-',
            name: course.course_name_th ?? '-',
            credits: course.credit ?? 0,
            source: 'other' as const,
            reason: category ?? 'รายวิชาในแผนการเรียน',
        }
    })

    return [...backlog, ...nextSemester, ...other]
}

export default function GradeCalculatorPage() {
    const { currentRole, studentCode } = useCurrentStudent()
    const isStudent = appMode === 'student' || currentRole === 'student'
    const [studentOptions, setStudentOptions] = useState<StudentOption[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        null,
    )
    const [overview, setOverview] =
        useState<StudentAcademicOverview | null>(null)
    const [unattempted, setUnattempted] =
        useState<StudentUnattemptedCoursesData | null>(null)
    const [loadingStudents, setLoadingStudents] = useState(true)
    const [loadingOverview, setLoadingOverview] = useState(false)
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
    const [calculationResult, setCalculationResult] =
        useState<GradeCalculationResult | null>(null)
    const [savingCalculation, setSavingCalculation] = useState(false)
    const [calculationSaved, setCalculationSaved] = useState(false)
    const [resultOpen, setResultOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [gradeForm] = Form.useForm<GradeCalculationFormValues>()
    const expectedGrades = Form.useWatch('grades', gradeForm) ?? {}

    useEffect(() => {
        let cancelled = false

        const loadStudentOptions = async () => {
            try {
                setLoadingStudents(true)

                if (isStudent) {
                    const student = await getStudentDetailByCode(studentCode)

                    if (cancelled) return

                    if (!student) {
                        setStudentOptions([])
                        setSelectedStudentId(null)
                        return
                    }

                    setStudentOptions([
                        {
                            id: student.id,
                            studentCode: student.student_code ?? studentCode,
                            fullName: student.full_name_th,
                        },
                    ])
                    setSelectedStudentId(student.id)
                    return
                }

                const students = await getStudents()

                if (cancelled) return

                const options = students.map((student) => ({
                    id: student.id,
                    studentCode: student.student_code ?? '-',
                    fullName: student.full_name_th,
                }))
                setStudentOptions(options)
                setSelectedStudentId((currentId) =>
                    currentId && options.some(({ id }) => id === currentId)
                        ? currentId
                        : (options[0]?.id ?? null),
                )
            } catch (error) {
                if (cancelled) return

                console.error(error)
                setStudentOptions([])
                setSelectedStudentId(null)
                message.error('โหลดรายชื่อนิสิตไม่สำเร็จ')
            } finally {
                if (!cancelled) {
                    setLoadingStudents(false)
                }
            }
        }

        void loadStudentOptions()

        return () => {
            cancelled = true
        }
    }, [isStudent, studentCode])

    useEffect(() => {
        if (!selectedStudentId) {
            return
        }

        let cancelled = false

        const loadOverview = async () => {
            try {
                setLoadingOverview(true)
                const [data, unattemptedData] = await Promise.all([
                    getStudentAcademicOverview(selectedStudentId),
                    getStudentUnattemptedCourses(selectedStudentId),
                ])

                if (cancelled) return

                const courses = buildPredictionCourses(data, unattemptedData)
                setOverview(data)
                setUnattempted(unattemptedData)
                setSelectedCourseIds(
                    courses
                        .filter((course) => course.source !== 'other')
                        .map((course) => course.id),
                )
                gradeForm.resetFields()
                setCalculationResult(null)
            } catch (error) {
                if (cancelled) return

                console.error(error)
                setOverview(null)
                setUnattempted(null)
                setSelectedCourseIds([])
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
            } finally {
                if (!cancelled) {
                    setLoadingOverview(false)
                }
            }
        }

        void loadOverview()

        return () => {
            cancelled = true
        }
    }, [gradeForm, selectedStudentId])

    const predictionCourses = useMemo(
        () =>
            overview && unattempted
                ? buildPredictionCourses(overview, unattempted)
                : [],
        [overview, unattempted],
    )
    const selectedCourses = useMemo(
        () =>
            predictionCourses.filter((course) =>
                selectedCourseIds.includes(course.id),
            ),
        [predictionCourses, selectedCourseIds],
    )
    const selectedStudent = studentOptions.find(
        (student) => student.id === selectedStudentId,
    )
    const currentGpax = overview?.gpax ?? 0
    const currentCredits = overview?.cumulative_credits ?? 0
    const currentQualityPoints = currentGpax * currentCredits
    const predictionTerm = overview?.next_term ?? null
    const predictedTermLabel = predictionTerm
        ? formatTerm(predictionTerm.year, predictionTerm.semester)
        : 'ภาคการศึกษาถัดไป'
    const otherCourseIds = selectedCourseIds.filter((courseId) =>
        predictionCourses.some(
            (course) => course.id === courseId && course.source === 'other',
        ),
    )

    const resetPrediction = () => {
        setSelectedCourseIds(
            predictionCourses
                .filter((course) => course.source !== 'other')
                .map((course) => course.id),
        )
        gradeForm.resetFields()
        setCalculationResult(null)
    }

    const handleOtherCoursesChange = (courseIds: string[]) => {
        const availableOtherIds = new Set(
            predictionCourses
                .filter((course) => course.source === 'other')
                .map((course) => course.id),
        )

        setSelectedCourseIds((currentIds) => [
            ...currentIds.filter((courseId) => !availableOtherIds.has(courseId)),
            ...courseIds,
        ])
        availableOtherIds.forEach((courseId) => {
            if (!courseIds.includes(courseId)) {
                gradeForm.setFieldValue(['grades', courseId], undefined)
            }
        })
        setCalculationResult(null)
    }

    const handleCourseToggle = (courseId: string, checked: boolean) => {
        setSelectedCourseIds((currentIds) =>
            checked
                ? [...new Set([...currentIds, courseId])]
                : currentIds.filter((id) => id !== courseId),
        )
        if (!checked) {
            gradeForm.setFieldValue(['grades', courseId], undefined)
        }
        setCalculationResult(null)
    }

    const handleCalculate = async () => {
        if (selectedCourses.length === 0) {
            message.warning('กรุณาเลือกอย่างน้อย 1 รายวิชา')
            return
        }

        try {
            await gradeForm.validateFields(
                selectedCourses.map((course) => ['grades', course.id]),
            )
        } catch {
            return
        }

        const calculatedCourses = selectedCourses.map((course) => {
            const grade = expectedGrades[course.id]
            const gradePoint =
                gradeOptions.find((option) => option.value === grade)?.points ??
                0

            return {
                ...course,
                grade,
                gradePoints: gradePoint * course.credits,
            }
        })
        const termCredits = calculatedCourses.reduce(
            (total, course) => total + course.credits,
            0,
        )

        if (termCredits <= 0) {
            message.warning('รายวิชาที่เลือกไม่มีหน่วยกิตสำหรับคำนวณ')
            return
        }

        const termQualityPoints = calculatedCourses.reduce(
            (total, course) => total + course.gradePoints,
            0,
        )
        const cumulativeCredits = currentCredits + termCredits

        const result = {
            termGpa: termQualityPoints / termCredits,
            cumulativeCredits,
            cumulativeGpa:
                cumulativeCredits > 0
                    ? (currentQualityPoints + termQualityPoints) /
                      cumulativeCredits
                    : 0,
            courses: calculatedCourses,
        }

        setCalculationResult(result)
        gradeForm.resetFields()
        setCalculationSaved(false)

        if (!isStudent || !predictionTerm) {
            setResultOpen(true)
            return
        }

        try {
            setSavingCalculation(true)
            await createGradeCalculation({
                study_year: predictionTerm.year,
                semester: predictionTerm.semester,
                semester_order: predictionTerm.semester_order,
                courses: calculatedCourses.map((course) => ({
                    code: course.code,
                    name: course.name,
                    credits: course.credits,
                    source: course.source,
                    grade: course.grade,
                })),
            })
            setCalculationSaved(true)
        } catch (error) {
            console.error('Unable to save grade calculation', error)
            message.error('คำนวณสำเร็จ แต่บันทึกประวัติไม่สำเร็จ')
        } finally {
            setSavingCalculation(false)
            setResultOpen(true)
        }
    }

    const semesterColumns: ColumnsType<StudentAcademicHistory> = [
        {
            title: 'ชั้นปี',
            dataIndex: 'year',
            align: 'center',
            render: (value: number) => `ชั้นปี ${value}`,
        },
        {
            title: 'ภาคการเรียน',
            dataIndex: 'semester',
            align: 'center',
        },
        { title: 'หน่วยกิต', dataIndex: 'credits', align: 'center' },
        {
            title: 'GPA',
            dataIndex: 'gpa',
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
        {
            title: 'GPAX สะสม',
            dataIndex: 'gpax',
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
    ]

    const selectedCourseColumns: ColumnsType<PredictionCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 115 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        {
            title: 'ประเภท',
            dataIndex: 'source',
            width: 135,
            align: 'center',
            render: (source: CourseSource) => (
                <Tag color={sourceLabels[source].color}>
                    {sourceLabels[source].label}
                </Tag>
            ),
        },
        {
            title: 'หน่วยกิต',
            dataIndex: 'credits',
            width: 90,
            align: 'center',
        },
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
                        options={gradeOptions.map(({ label, value }) => ({
                            label,
                            value,
                        }))}
                        onChange={() => setCalculationResult(null)}
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
                    onClick={() => handleCourseToggle(course.id, false)}
                />
            ),
        },
    ]

    const resultColumns: ColumnsType<CalculatedCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 120 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name', width: 420 },
        {
            title: 'หน่วยกิต',
            dataIndex: 'credits',
            align: 'center',
            width: 90,
        },
        {
            title: 'เกรดคาดการณ์',
            dataIndex: 'grade',
            align: 'center',
            width: 120,
        },
        {
            title: 'คะแนนเกรด',
            dataIndex: 'gradePoints',
            align: 'center',
            width: 110,
            render: (value: number) => value.toFixed(2),
        },
    ]

    const renderCourseGroup = (
        title: string,
        description: string,
        source: CourseSource,
    ) => {
        const courses = predictionCourses.filter(
            (course) => course.source === source,
        )

        return (
            <section
                className={`grade-course-group grade-course-group-${source}`}
            >
                <div className="grade-course-group-heading">
                    <h3>{title}</h3>
                    <span>{description}</span>
                </div>
                {courses.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ไม่พบรายวิชา"
                    />
                ) : (
                    <div className="grade-course-choice-list">
                        {courses.map((course) => (
                            <Checkbox
                                key={course.id}
                                checked={selectedCourseIds.includes(course.id)}
                                onChange={(event) =>
                                    handleCourseToggle(
                                        course.id,
                                        event.target.checked,
                                    )
                                }
                            >
                                <span className="grade-course-choice-content">
                                    <strong>
                                        {course.code} — {course.name}
                                    </strong>
                                    <span>
                                        {course.credits} หน่วยกิต ·{' '}
                                        {course.reason}
                                    </span>
                                </span>
                            </Checkbox>
                        ))}
                    </div>
                )}
            </section>
        )
    }

    const calculatedGpaChange = getGpaChangePresentation(
        calculationResult
            ? calculationResult.cumulativeGpa - currentGpax
            : 0,
    )

    return (
        <div className="student-page grade-calculator-page">
            <div className="page-title-section">
                <div>
                    <h1>คำนวณผลการเรียน</h1>
                    <p>
                        ทดลองวางแผนรายวิชาและเกรดเพื่อประมาณการ GPA และ GPAX
                        ในภาคการศึกษาถัดไป
                    </p>
                </div>
                <Button
                    icon={<HistoryOutlined />}
                    disabled={!selectedStudentId}
                    onClick={() => setHistoryOpen(true)}
                >
                    ดูประวัติ
                </Button>
            </div>

            <Card
                className="grade-calculator-card"
                title="ข้อมูลสำหรับคำนวณ"
                loading={loadingStudents}
            >
                <div className="grade-calculator-controls">
                    <label>
                        <Text strong>นิสิต</Text>
                        {isStudent ? (
                            <Text className="grade-calculator-readonly-value">
                                {selectedStudent
                                    ? `${selectedStudent.studentCode} — ${selectedStudent.fullName}`
                                    : 'ไม่พบข้อมูลนิสิต'}
                            </Text>
                        ) : (
                            <Select
                                showSearch
                                optionFilterProp="label"
                                value={selectedStudentId}
                                placeholder="ค้นหาและเลือกนิสิต"
                                options={studentOptions.map((student) => ({
                                    label: `${student.studentCode} — ${student.fullName}`,
                                    value: student.id,
                                }))}
                                onChange={(studentId) => {
                                    setSelectedStudentId(studentId)
                                    setOverview(null)
                                    setUnattempted(null)
                                    setSelectedCourseIds([])
                                    setCalculationResult(null)
                                }}
                            />
                        )}
                    </label>
                    <label>
                        <Text strong>ชั้นปีที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictionTerm
                                ? `ชั้นปี ${predictionTerm.year}`
                                : '-'}
                        </Text>
                    </label>
                    <label>
                        <Text strong>ภาคการเรียนที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictionTerm?.semester ?? '-'}
                        </Text>
                    </label>
                </div>
            </Card>

            {!loadingStudents && !selectedStudentId && (
                <Alert
                    type="warning"
                    showIcon
                    message="ไม่พบข้อมูลนิสิตสำหรับคำนวณผลการเรียน"
                />
            )}

            <Card
                className="grade-calculator-card"
                title="ผลการเรียนรวมจากภาคการศึกษาที่ผ่านมา"
                loading={loadingOverview}
            >
                {overview ? (
                    <>
                        {(overview.missing_sections.length > 0 ||
                            (unattempted?.missing_sections.length ?? 0) > 0) && (
                            <Alert
                                className="grade-calculator-data-alert"
                                type="warning"
                                showIcon
                                message="ข้อมูลผลการเรียนบางส่วนยังไม่พร้อมใช้งาน"
                            />
                        )}
                        <div className="grade-summary-grid">
                            <Statistic
                                title="GPAX ปัจจุบัน"
                                value={formatDecimal(overview.gpax)}
                            />
                            <Statistic
                                title="หน่วยกิตสะสม"
                                value={overview.cumulative_credits ?? '-'}
                                suffix={
                                    overview.cumulative_credits === null
                                        ? undefined
                                        : 'หน่วยกิต'
                                }
                            />
                            <Statistic
                                title="GPA ภาคการเรียนล่าสุด"
                                value={formatDecimal(overview.latest_gpa)}
                            />
                            <Statistic
                                title="ชั้นปีและภาคการศึกษาล่าสุด"
                                value={
                                    overview.latest_completed_term
                                        ? formatTerm(
                                              overview.latest_completed_term
                                                  .year,
                                              overview.latest_completed_term
                                                  .semester,
                                          )
                                        : '-'
                                }
                            />
                        </div>
                        <Table<StudentAcademicHistory>
                            rowKey={(row) =>
                                `${row.academic_year}-${row.semester_order}`
                            }
                            columns={semesterColumns}
                            dataSource={overview.academic_history}
                            locale={{ emptyText: 'ไม่พบประวัติผลการเรียน' }}
                            pagination={false}
                            size="small"
                            tableLayout="fixed"
                        />
                    </>
                ) : (
                    !loadingOverview && (
                        <Empty description="กรุณาเลือกนิสิตเพื่อดูข้อมูล" />
                    )
                )}
            </Card>

            {overview && (
                <>
                    <Card
                        className="grade-calculator-card"
                        title={`วางแผนรายวิชา ${predictedTermLabel}`}
                    >
                        <div className="grade-course-groups">
                            {renderCourseGroup(
                                'วิชาคงค้าง',
                                'รายวิชาที่ยังไม่ผ่านหรือยังไม่มีผลการเรียน',
                                'backlog',
                            )}
                            {renderCourseGroup(
                                'วิชาที่ต้องลงในเทอมถัดไป',
                                'เฉพาะรายวิชา subject ตามแผนการเรียน',
                                'next-semester',
                            )}
                        </div>
                        <div className="grade-other-course-field">
                            <Text strong>เพิ่มวิชาอื่น</Text>
                            <Select
                                mode="multiple"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder="ค้นหาและเลือกวิชาที่ยังไม่เคยเรียน"
                                value={otherCourseIds}
                                options={predictionCourses
                                    .filter(
                                        (course) => course.source === 'other',
                                    )
                                    .map((course) => ({
                                        label: `${course.code} — ${course.name} (${course.credits} หน่วยกิต · ${course.reason})`,
                                        value: course.id,
                                    }))}
                                onChange={handleOtherCoursesChange}
                            />
                        </div>
                    </Card>

                    <Card
                        className="grade-calculator-card"
                        title={`รายวิชาที่เลือก (${selectedCourses.length} วิชา)`}
                    >
                        <Form form={gradeForm} component={false}>
                            <Table<PredictionCourse>
                                className="grade-prediction-table"
                                rowKey="id"
                                columns={selectedCourseColumns}
                                dataSource={selectedCourses}
                                locale={{ emptyText: 'ยังไม่ได้เลือกรายวิชา' }}
                                pagination={false}
                                size="small"
                                tableLayout="fixed"
                            />
                        </Form>
                        <div className="grade-calculator-actions">
                            <Space>
                                <Button onClick={resetPrediction}>
                                    คืนค่าเริ่มต้น
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CalculatorOutlined />}
                                    loading={savingCalculation}
                                    disabled={
                                        selectedCourses.length === 0 ||
                                        savingCalculation
                                    }
                                    onClick={() => void handleCalculate()}
                                >
                                    คำนวณผลการเรียน
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </>
            )}

            {calculationResult && (
                <Modal
                    width={1000}
                    open={resultOpen}
                    title="ผลการคำนวณ"
                    footer={
                        <Button type="primary" onClick={() => setResultOpen(false)}>
                            ปิด
                        </Button>
                    }
                    onCancel={() => setResultOpen(false)}
                >
                    {calculationSaved && (
                        <Alert
                            className="grade-calculation-saved-alert"
                            type="success"
                            showIcon
                            message="บันทึกการคำนวณแล้ว"
                            description="ผลการคำนวณนี้ถูกบันทึกไว้ในประวัติเรียบร้อยแล้ว"
                        />
                    )}
                    <div className="grade-calculation-result-heading">
                        ผลการคาดการณ์ {predictedTermLabel}
                    </div>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Statistic
                                title="GPA เทอมที่คาดการณ์"
                                value={calculationResult.termGpa}
                                precision={2}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Statistic
                                title="GPAX หลังจบเทอม"
                                value={calculationResult.cumulativeGpa}
                                precision={2}
                                valueStyle={{
                                    color:
                                        calculationResult.cumulativeGpa >=
                                        currentGpax
                                            ? '#52c41a'
                                            : '#fa8c16',
                                }}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Statistic
                                title="GPAX เปลี่ยนแปลง"
                                value={calculatedGpaChange.text}
                                valueStyle={{
                                    color: calculatedGpaChange.color,
                                }}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Statistic
                                title="หน่วยกิตสะสมหลังจบเทอม"
                                value={calculationResult.cumulativeCredits}
                                suffix="หน่วยกิต"
                            />
                        </Col>
                    </Row>
                    <div className="grade-result-comparison">
                        GPAX ปัจจุบัน {currentGpax.toFixed(2)}
                        {' → '} GPAX คาดการณ์{' '}
                        {calculationResult.cumulativeGpa.toFixed(2)}
                    </div>
                    <Table<CalculatedCourse>
                        rowKey="id"
                        columns={resultColumns}
                        dataSource={calculationResult.courses}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                        scroll={{ x: 860 }}
                    />
                </Modal>
            )}

            <GradeCalculationHistoryModal
                open={historyOpen}
                studentId={selectedStudentId}
                studentLabel={
                    selectedStudent
                        ? `${selectedStudent.studentCode} — ${selectedStudent.fullName}`
                        : '-'
                }
                onClose={() => setHistoryOpen(false)}
            />
        </div>
    )
}
