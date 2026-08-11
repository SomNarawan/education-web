import {
    CalculatorOutlined,
    DeleteOutlined,
    EyeOutlined,
    HistoryOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Checkbox,
    Col,
    Descriptions,
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
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
    gradeOptions,
    mockCalculationHistories,
    mockPredictionCourses,
    mockStudentProfiles,
} from './gradeCalculatorMockData'
import type {
    CalculationHistoryCourse,
    CourseSource,
    GradeCalculationHistory,
    PredictionCourse,
    SemesterAcademicResult,
} from './gradeCalculatorMockData'

const { Text } = Typography

const predictedAcademicYearLabel = 'ปีที่ 3'
const predictedSemesterLabel = 'ภาคต้น'
const predictedTermLabel = `${predictedAcademicYearLabel} ${predictedSemesterLabel}`
const currentAcademicTermLabel = 'ปีที่ 2 ภาคปลาย'

const semesterLabels: Record<number, string> = {
    1: 'ภาคต้น',
    2: 'ภาคปลาย',
    3: 'ภาคฤดูร้อน',
}

const sourceLabels: Record<CourseSource, { label: string; color: string }> = {
    backlog: { label: 'วิชาคงค้าง', color: 'error' },
    'next-semester': { label: 'วิชาที่ต้องลง', color: 'processing' },
    other: { label: 'วิชาอื่น', color: 'default' },
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

function getStudyYear(academicYear: number, firstAcademicYear: number) {
    return Math.max(1, academicYear - firstAcademicYear + 1)
}

function formatStudyTerm(
    academicYear: number,
    semester: number,
    firstAcademicYear: number,
) {
    const semesterLabel =
        semesterLabels[semester] ?? `ภาคการเรียนที่ ${semester}`

    return `ปีที่ ${getStudyYear(academicYear, firstAcademicYear)} ${semesterLabel}`
}

interface SemesterResultRow extends SemesterAcademicResult {
    cumulativeGpa: number
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

function calculatePreviousSummary(results: SemesterAcademicResult[]) {
    const credits = results.reduce(
        (total, semester) => total + semester.credits,
        0,
    )
    const qualityPoints = results.reduce(
        (total, semester) => total + semester.gpa * semester.credits,
        0,
    )

    return {
        credits,
        qualityPoints,
        cumulativeGpa: credits > 0 ? qualityPoints / credits : 0,
    }
}

function createSemesterRows(
    results: SemesterAcademicResult[],
): SemesterResultRow[] {
    let cumulativeCredits = 0
    let cumulativeQualityPoints = 0

    return results.map((semester) => {
        cumulativeCredits += semester.credits
        cumulativeQualityPoints += semester.gpa * semester.credits

        return {
            ...semester,
            cumulativeGpa: cumulativeQualityPoints / cumulativeCredits,
        }
    })
}

export default function GradeCalculatorPage() {
    const [selectedStudentCode, setSelectedStudentCode] = useState(
        mockStudentProfiles[0].studentCode,
    )
    const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>(
        mockPredictionCourses
            .filter((course) => course.source !== 'other')
            .map((course) => course.code),
    )
    const [expectedGrades, setExpectedGrades] = useState<
        Record<string, string>
    >({})
    const [calculationResult, setCalculationResult] =
        useState<GradeCalculationResult | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [selectedHistory, setSelectedHistory] =
        useState<GradeCalculationHistory | null>(null)

    const selectedProfile =
        mockStudentProfiles.find(
            (profile) => profile.studentCode === selectedStudentCode,
        ) ?? mockStudentProfiles[0]
    const previousSummary = useMemo(
        () => calculatePreviousSummary(selectedProfile.semesterResults),
        [selectedProfile],
    )
    const semesterRows = useMemo(
        () => createSemesterRows(selectedProfile.semesterResults),
        [selectedProfile],
    )
    const firstAcademicYear =
        selectedProfile.semesterResults[0]?.academicYear ?? 0
    const selectedCourses = useMemo(
        () =>
            mockPredictionCourses.filter((course) =>
                selectedCourseCodes.includes(course.code),
            ),
        [selectedCourseCodes],
    )
    const studentHistories = mockCalculationHistories.filter(
        (history) => history.studentCode === selectedStudentCode,
    )

    const resetPrediction = () => {
        setSelectedCourseCodes(
            mockPredictionCourses
                .filter((course) => course.source !== 'other')
                .map((course) => course.code),
        )
        setExpectedGrades({})
        setCalculationResult(null)
    }

    const handleCourseToggle = (courseCode: string, checked: boolean) => {
        setSelectedCourseCodes((currentCodes) =>
            checked
                ? [...new Set([...currentCodes, courseCode])]
                : currentCodes.filter((code) => code !== courseCode),
        )
        setExpectedGrades((currentGrades) => {
            if (checked) return currentGrades

            const nextGrades = { ...currentGrades }
            delete nextGrades[courseCode]
            return nextGrades
        })
        setCalculationResult(null)
    }

    const handleOtherCoursesChange = (courseCodes: string[]) => {
        const otherCourseCodes = new Set(
            mockPredictionCourses
                .filter((course) => course.source === 'other')
                .map((course) => course.code),
        )

        setSelectedCourseCodes((currentCodes) => [
            ...currentCodes.filter((code) => !otherCourseCodes.has(code)),
            ...courseCodes,
        ])
        setExpectedGrades((currentGrades) =>
            Object.fromEntries(
                Object.entries(currentGrades).filter(
                    ([courseCode]) =>
                        !otherCourseCodes.has(courseCode) ||
                        courseCodes.includes(courseCode),
                ),
            ),
        )
        setCalculationResult(null)
    }

    const handleCalculate = () => {
        if (selectedCourses.length === 0) {
            message.warning('กรุณาเลือกอย่างน้อย 1 รายวิชา')
            return
        }

        const courseWithoutGrade = selectedCourses.find(
            (course) => !expectedGrades[course.code],
        )

        if (courseWithoutGrade) {
            message.warning(
                `กรุณาระบุเกรดคาดการณ์ของวิชา ${courseWithoutGrade.code}`,
            )
            return
        }

        const calculatedCourses = selectedCourses.map((course) => {
            const grade = expectedGrades[course.code]
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
        const termQualityPoints = calculatedCourses.reduce(
            (total, course) => total + course.gradePoints,
            0,
        )
        const cumulativeCredits = previousSummary.credits + termCredits

        setCalculationResult({
            termGpa: termQualityPoints / termCredits,
            cumulativeCredits,
            cumulativeGpa:
                (previousSummary.qualityPoints + termQualityPoints) /
                cumulativeCredits,
            courses: calculatedCourses,
        })
    }

    const semesterColumns: ColumnsType<SemesterResultRow> = [
        {
            title: 'ชั้นปี',
            dataIndex: 'academicYear',
            align: 'center',
            render: (value: number) => getStudyYear(value, firstAcademicYear),
        },
        {
            title: 'ภาคการเรียน',
            dataIndex: 'semester',
            align: 'center',
            render: (value: number) =>
                semesterLabels[value] ?? `ภาคที่ ${value}`,
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
            dataIndex: 'cumulativeGpa',
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
    ]

    const selectedCourseColumns: ColumnsType<PredictionCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 110 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        {
            title: 'ประเภท',
            dataIndex: 'source',
            width: 130,
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
            width: 145,
            render: (_, course) => (
                <Select
                    aria-label={`เกรดคาดการณ์วิชา ${course.code}`}
                    placeholder="เลือกเกรด"
                    value={expectedGrades[course.code]}
                    options={gradeOptions.map(({ label, value }) => ({
                        label,
                        value,
                    }))}
                    onChange={(grade) => {
                        setExpectedGrades((currentGrades) => ({
                            ...currentGrades,
                            [course.code]: grade,
                        }))
                        setCalculationResult(null)
                    }}
                />
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
                    onClick={() => handleCourseToggle(course.code, false)}
                />
            ),
        },
    ]

    const resultColumns: ColumnsType<CalculatedCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code' },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        { title: 'หน่วยกิต', dataIndex: 'credits', align: 'center' },
        { title: 'เกรดคาดการณ์', dataIndex: 'grade', align: 'center' },
        {
            title: 'คะแนนเกรด',
            dataIndex: 'gradePoints',
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
    ]

    const historyColumns: ColumnsType<GradeCalculationHistory> = [
        {
            title: 'วันที่คำนวณ',
            dataIndex: 'calculatedAt',
            width: 150,
            render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'ภาคการเรียน',
            key: 'semester',
            width: 110,
            align: 'center',
            render: (_, history) =>
                formatStudyTerm(
                    history.academicYear,
                    history.semester,
                    firstAcademicYear,
                ),
        },
        {
            title: 'จำนวนวิชา',
            dataIndex: 'courses',
            width: 100,
            align: 'center',
            render: (courses: GradeCalculationHistory['courses']) =>
                `${courses.length} วิชา`,
        },
        {
            title: 'GPA คาดการณ์',
            dataIndex: 'predictedTermGpa',
            width: 120,
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
        {
            title: 'GPAX คาดการณ์',
            dataIndex: 'predictedCumulativeGpa',
            width: 125,
            align: 'center',
            render: (value: number) => value.toFixed(2),
        },
        {
            title: 'GPAX เปลี่ยนแปลง',
            key: 'gpaChange',
            width: 125,
            align: 'center',
            render: (_, history) => {
                const change = getGpaChangePresentation(
                    history.predictedCumulativeGpa - history.previousGpa,
                )

                return <Text style={{ color: change.color }}>{change.text}</Text>
            },
        },
        {
            title: 'รายละเอียด',
            key: 'view',
            width: 90,
            align: 'center',
            render: (_, history) => (
                <Button
                    icon={<EyeOutlined />}
                    aria-label="ดูรายละเอียดประวัติการคำนวณ"
                    style={{
                        borderColor: '#1677ff',
                        color: '#1677ff',
                    }}
                    onClick={() => setSelectedHistory(history)}
                />
            ),
        },
    ]

    const historyCourseColumns: ColumnsType<CalculationHistoryCourse> = [
        { title: 'รหัสวิชา', dataIndex: 'code', width: 110 },
        { title: 'ชื่อรายวิชา', dataIndex: 'name' },
        {
            title: 'หน่วยกิต',
            dataIndex: 'credits',
            width: 90,
            align: 'center',
        },
        {
            title: 'เกรด',
            dataIndex: 'grade',
            width: 80,
            align: 'center',
        },
    ]

    const renderCourseGroup = (
        title: string,
        description: string,
        source: CourseSource,
    ) => (
        <section className={`grade-course-group grade-course-group-${source}`}>
            <div className="grade-course-group-heading">
                <h3>{title}</h3>
                <span>{description}</span>
            </div>
            <div className="grade-course-choice-list">
                {mockPredictionCourses
                    .filter((course) => course.source === source)
                    .map((course) => (
                        <Checkbox
                            key={course.code}
                            checked={selectedCourseCodes.includes(course.code)}
                            onChange={(event) =>
                                handleCourseToggle(
                                    course.code,
                                    event.target.checked,
                                )
                            }
                        >
                            <span className="grade-course-choice-content">
                                <strong>
                                    {course.code} — {course.name}
                                </strong>
                                <span>
                                    {course.credits} หน่วยกิต · {course.reason}
                                </span>
                            </span>
                        </Checkbox>
                    ))}
            </div>
        </section>
    )

    const otherCourseCodes = selectedCourseCodes.filter((courseCode) =>
        mockPredictionCourses.some(
            (course) =>
                course.code === courseCode && course.source === 'other',
        ),
    )
    const latestSemester =
        selectedProfile.semesterResults[
            selectedProfile.semesterResults.length - 1
        ]
    const calculatedGpaChange = getGpaChangePresentation(
        calculationResult
            ? calculationResult.cumulativeGpa - previousSummary.cumulativeGpa
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
                    size="large"
                    icon={<HistoryOutlined />}
                    onClick={() => setHistoryOpen(true)}
                >
                    ประวัติการคำนวณ
                </Button>
            </div>

            <Card className="grade-calculator-card" title="ข้อมูลสำหรับคำนวณ">
                <div className="grade-calculator-controls">
                    <label>
                        <Text strong>นิสิต</Text>
                        <Select
                            showSearch
                            optionFilterProp="label"
                            value={selectedStudentCode}
                            options={mockStudentProfiles.map((profile) => ({
                                label: `${profile.studentCode} — ${profile.fullName}`,
                                value: profile.studentCode,
                            }))}
                            onChange={(studentCode) => {
                                setSelectedStudentCode(studentCode)
                                resetPrediction()
                            }}
                        />
                    </label>
                    <label>
                        <Text strong>ชั้นปีที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictedAcademicYearLabel}
                        </Text>
                    </label>
                    <label>
                        <Text strong>ภาคการเรียนที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictedSemesterLabel}
                        </Text>
                    </label>
                </div>
            </Card>

            <Card
                className="grade-calculator-card"
                title="ผลการเรียนรวมจากภาคการศึกษาที่ผ่านมา"
            >
                <div className="grade-summary-grid">
                    <Statistic
                        title="GPAX ปัจจุบัน"
                        value={previousSummary.cumulativeGpa}
                        precision={2}
                    />
                    <Statistic
                        title="หน่วยกิตสะสม"
                        value={previousSummary.credits}
                        suffix="หน่วยกิต"
                    />
                    <Statistic
                        title="GPA ภาคการเรียนล่าสุด"
                        value={latestSemester.gpa}
                        precision={2}
                    />
                    <Statistic
                        title="ชั้นปีปัจจุบัน"
                        value={currentAcademicTermLabel}
                    />
                </div>
                <Table<SemesterResultRow>
                    rowKey="id"
                    columns={semesterColumns}
                    dataSource={semesterRows}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                />
            </Card>

            <Card
                className="grade-calculator-card"
                title={`วางแผนรายวิชา ${predictedTermLabel}`}
            >
                <div className="grade-course-groups">
                    {renderCourseGroup(
                        'วิชาคงค้าง',
                        'รายวิชาที่ยังไม่ผ่านหรือถอนรายวิชา',
                        'backlog',
                    )}
                    {renderCourseGroup(
                        'วิชาที่ต้องลงในเทอมถัดไป',
                        'รายวิชาตามแผนการเรียนที่แนะนำ',
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
                        placeholder="ค้นหาและเลือกวิชาอื่นเพิ่มเติม"
                        value={otherCourseCodes}
                        options={mockPredictionCourses
                            .filter((course) => course.source === 'other')
                            .map((course) => ({
                                label: `${course.code} — ${course.name} (${course.credits} หน่วยกิต)`,
                                value: course.code,
                            }))}
                        onChange={handleOtherCoursesChange}
                    />
                </div>
            </Card>

            <Card
                className="grade-calculator-card"
                title={`รายวิชาที่เลือก (${selectedCourses.length} วิชา)`}
            >
                <Table<PredictionCourse>
                    className="grade-prediction-table"
                    rowKey="code"
                    columns={selectedCourseColumns}
                    dataSource={selectedCourses}
                    locale={{ emptyText: 'ยังไม่ได้เลือกรายวิชา' }}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                />
                <div className="grade-calculator-actions">
                    <Space>
                        <Button onClick={resetPrediction}>คืนค่าเริ่มต้น</Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CalculatorOutlined />}
                            disabled={selectedCourses.length === 0}
                            onClick={handleCalculate}
                        >
                            คำนวณผลการเรียน
                        </Button>
                    </Space>
                </div>
            </Card>

            {calculationResult && (
                <Card
                    className="grade-calculator-card grade-calculation-result"
                    title={`ผลการคาดการณ์ ${predictedTermLabel}`}
                >
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
                                        previousSummary.cumulativeGpa
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
                        GPAX ปัจจุบัน {previousSummary.cumulativeGpa.toFixed(2)}
                        {' → '} GPAX คาดการณ์{' '}
                        {calculationResult.cumulativeGpa.toFixed(2)}
                    </div>
                    <Table<CalculatedCourse>
                        rowKey="code"
                        columns={resultColumns}
                        dataSource={calculationResult.courses}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                    />
                </Card>
            )}

            <Modal
                title={`ประวัติการคำนวณ — ${selectedProfile.studentCode} ${selectedProfile.fullName}`}
                open={historyOpen}
                width={1000}
                footer={
                    <Button onClick={() => setHistoryOpen(false)}>ปิด</Button>
                }
                onCancel={() => setHistoryOpen(false)}
            >
                <Table<GradeCalculationHistory>
                    rowKey="id"
                    columns={historyColumns}
                    dataSource={studentHistories}
                    locale={{ emptyText: 'ยังไม่มีประวัติการคำนวณ' }}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                />
            </Modal>

            <Modal
                title="รายละเอียดประวัติการคำนวณ"
                open={Boolean(selectedHistory)}
                width={1000}
                footer={
                    <Button onClick={() => setSelectedHistory(null)}>ปิด</Button>
                }
                onCancel={() => setSelectedHistory(null)}
            >
                {selectedHistory && (
                    <>
                        <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 12 }}
                            items={[
                                {
                                    key: 'semester',
                                    label: 'ภาคการเรียน',
                                    children: formatStudyTerm(
                                        selectedHistory.academicYear,
                                        selectedHistory.semester,
                                        firstAcademicYear,
                                    ),
                                    span: { xs: 1, sm: 6 },
                                },
                                {
                                    key: 'calculatedAt',
                                    label: 'วันที่คำนวณ',
                                    children: dayjs(
                                        selectedHistory.calculatedAt,
                                    ).format('DD/MM/YYYY HH:mm'),
                                    span: { xs: 1, sm: 6 },
                                },
                                {
                                    key: 'previousGpa',
                                    label: 'GPAX ก่อนคำนวณ',
                                    children:
                                        selectedHistory.previousGpa.toFixed(2),
                                    span: { xs: 1, sm: 3 },
                                },
                                {
                                    key: 'predictedTermGpa',
                                    label: 'GPA เทอมที่คาดการณ์',
                                    children:
                                        selectedHistory.predictedTermGpa.toFixed(
                                            2,
                                        ),
                                    span: { xs: 1, sm: 3 },
                                },
                                {
                                    key: 'predictedCumulativeGpa',
                                    label: 'GPAX คาดการณ์',
                                    children:
                                        selectedHistory.predictedCumulativeGpa.toFixed(
                                            2,
                                        ),
                                    span: { xs: 1, sm: 3 },
                                },
                                {
                                    key: 'gpaChange',
                                    label: 'GPAX เปลี่ยนแปลง',
                                    children: (() => {
                                        const change = getGpaChangePresentation(
                                            selectedHistory.predictedCumulativeGpa -
                                                selectedHistory.previousGpa,
                                        )

                                        return (
                                            <Text
                                                strong
                                                style={{ color: change.color }}
                                            >
                                                {change.text}
                                            </Text>
                                        )
                                    })(),
                                    span: { xs: 1, sm: 3 },
                                },
                            ]}
                        />
                        <Table<CalculationHistoryCourse>
                            className="grade-history-detail-table"
                            rowKey="code"
                            columns={historyCourseColumns}
                            dataSource={selectedHistory.courses}
                            pagination={false}
                            size="small"
                            tableLayout="fixed"
                        />
                    </>
                )}
            </Modal>
        </div>
    )
}
