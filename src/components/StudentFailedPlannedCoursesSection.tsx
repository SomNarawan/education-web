import { Card, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type {
    CurriculumCourse,
    CurriculumEnrollmentPlan,
    FailedPlannedCourseRow,
} from '../types/CurriculumDetail'

interface StudentFailedPlannedCoursesSectionProps {
    studentCode: string
}

const enrollmentPlans = import.meta.glob<{
    default: CurriculumEnrollmentPlan
}>('../data/enrollments/*.json')

const columns: ColumnsType<FailedPlannedCourseRow> = [
    {
        title: 'ชั้นปี',
        dataIndex: 'study_year',
        key: 'study_year',
        width: 110,
        align: 'center',
        render: (value: number | null) => value ?? '-',
    },
    {
        title: 'ภาคการเรียน',
        dataIndex: 'semester',
        key: 'semester',
        width: 150,
        align: 'center',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'หมวดวิชา',
        dataIndex: 'course_group',
        key: 'course_group',
        width: 220,
        render: (value: string | null, record) =>
            value || record.curriculum_division || '-',
    },
    {
        title: 'รหัสวิชา',
        dataIndex: 'course_code',
        key: 'course_code',
        width: 150,
        align: 'center',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'ชื่อรายวิชายังไม่ผ่าน',
        dataIndex: 'course_name',
        key: 'course_name',
        width: 260,
        render: (value: string) => (
            <span className="course-result-name-cell">{value || '-'}</span>
        ),
    },
    {
        title: 'หน่วยกิต',
        dataIndex: 'credit',
        key: 'credit',
        width: 120,
        align: 'center',
        render: (value: number | null) => value ?? '-',
    },
    {
        title: 'สถานะ',
        dataIndex: 'grade_letter',
        key: 'grade_letter',
        width: 120,
        align: 'center',
        render: (value: string | null) => value || '-',
    },
]

const failedGradeLetters = new Set(['F', 'W'])

function buildFailedRows(
    courses: CurriculumCourse[],
): FailedPlannedCourseRow[] {
    return courses.flatMap((course, courseIndex): FailedPlannedCourseRow[] => {
        const latestEnrollment =
            course.enrollments[course.enrollments.length - 1]

        if (
            !latestEnrollment ||
            latestEnrollment.grade_letter === null ||
            !failedGradeLetters.has(latestEnrollment.grade_letter)
        ) {
            return []
        }

        if (latestEnrollment.is_passed) {
            return []
        }

        return [
            {
                key: `${courseIndex}-failed`,
                study_year: latestEnrollment.study_year,
                semester: latestEnrollment.semester,
                semester_order: latestEnrollment.semester_order,
                course_group: course.course_group,
                curriculum_division: course.curriculum_division,
                course_code:
                    latestEnrollment.actual_course_code || course.course_code,
                course_name: course.course_name,
                credit: course.credit,
                grade_letter: latestEnrollment.grade_letter,
            },
        ]
    })
}

function buildClearedBacklogRows(
    courses: CurriculumCourse[],
): FailedPlannedCourseRow[] {
    return courses.flatMap((course, courseIndex): FailedPlannedCourseRow[] => {
        const failedEnrollments = course.enrollments.filter(
            (enrollment) => !enrollment.is_passed,
        )
        const passedEnrollments = course.enrollments.filter(
            (enrollment) => enrollment.is_passed,
        )
        const latestPassedEnrollment =
            passedEnrollments[passedEnrollments.length - 1]

        if (!latestPassedEnrollment || failedEnrollments.length === 0) {
            return []
        }

        const gradeLetters = [
            ...failedEnrollments,
            latestPassedEnrollment,
        ].flatMap((enrollment) =>
            enrollment.grade_letter ? [enrollment.grade_letter] : [],
        )

        return [
            {
                key: `${courseIndex}-cleared`,
                study_year: latestPassedEnrollment.study_year,
                semester: latestPassedEnrollment.semester,
                semester_order: latestPassedEnrollment.semester_order,
                course_group: course.course_group,
                curriculum_division: course.curriculum_division,
                course_code:
                    latestPassedEnrollment.actual_course_code ||
                    course.course_code,
                course_name: course.course_name,
                credit: course.credit,
                grade_letter: gradeLetters.join(','),
            },
        ]
    })
}

function buildOverCurriculumRows(
    courses: CurriculumCourse[],
): FailedPlannedCourseRow[] {
    return courses.flatMap((course, courseIndex): FailedPlannedCourseRow[] => {
        if (course.enrollments.length === 0) {
            return [
                {
                    key: `${courseIndex}-over-planned`,
                    study_year: null,
                    semester: null,
                    semester_order: 0,
                    course_group: course.course_group,
                    curriculum_division: course.curriculum_division,
                    course_code: course.course_code,
                    course_name: course.course_name,
                    credit: course.credit,
                    grade_letter: null,
                },
            ]
        }

        return course.enrollments.map((enrollment, enrollmentIndex) => ({
            key: `${courseIndex}-${enrollmentIndex}-over`,
            study_year: enrollment.study_year,
            semester: enrollment.semester,
            semester_order: enrollment.semester_order,
            course_group: course.course_group,
            curriculum_division: course.curriculum_division,
            course_code: enrollment.actual_course_code || course.course_code,
            course_name: course.course_name,
            credit: course.credit,
            grade_letter: enrollment.grade_letter,
        }))
    })
}

function sortRows(rows: FailedPlannedCourseRow[]) {
    return [...rows].sort((a, b) => {
        if ((a.study_year || 0) !== (b.study_year || 0)) {
            return (a.study_year || 0) - (b.study_year || 0)
        }

        if (a.semester_order !== b.semester_order) {
            return a.semester_order - b.semester_order
        }

        return (a.course_code || '').localeCompare(b.course_code || '')
    })
}

function buildColumns(courseNameTitle: string): ColumnsType<FailedPlannedCourseRow> {
    return columns.map((column) =>
        column.key === 'course_name'
            ? {
                  ...column,
                  title: courseNameTitle,
              }
            : column,
    )
}

function CourseResultTable({
    title,
    courseNameTitle,
    rows,
    loading,
}: {
    title: string
    courseNameTitle: string
    rows: FailedPlannedCourseRow[]
    loading: boolean
}) {
    const totalCredit = useMemo(
        () => rows.reduce((total, row) => total + row.credit, 0),
        [rows],
    )
    const tableColumns = useMemo(
        () => buildColumns(courseNameTitle),
        [courseNameTitle],
    )

    return (
        <Card
            className="failed-planned-courses-card"
            title={title}
            size="small"
        >
            <Table<FailedPlannedCourseRow>
                className="failed-planned-courses-table"
                rowKey="key"
                columns={tableColumns}
                dataSource={rows}
                loading={loading}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total) =>
                        `จำนวนรายการทั้งหมด ${total} รายการ`,
                }}
                scroll={{ x: 1200 }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                            <strong>รวม</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            {rows.length}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                            {totalCredit}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} />
                    </Table.Summary.Row>
                )}
            />
        </Card>
    )
}

export default function StudentFailedPlannedCoursesSection({
    studentCode,
}: StudentFailedPlannedCoursesSectionProps) {
    const [plannedCourses, setPlannedCourses] = useState<CurriculumCourse[]>([])
    const [unplannedCourses, setUnplannedCourses] = useState<
        CurriculumCourse[]
    >([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoading(true)
                const importer =
                    enrollmentPlans[
                        `../data/enrollments/${studentCode}.json`
                    ]

                if (!importer) {
                    setPlannedCourses([])
                    setUnplannedCourses([])
                    return
                }

                const module = await importer()
                setPlannedCourses(module.default.planned_courses)
                setUnplannedCourses(module.default.unplanned_courses)
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลผลการเรียนวิชาที่ไม่ผ่านไม่สำเร็จ')
                setPlannedCourses([])
                setUnplannedCourses([])
            } finally {
                setLoading(false)
            }
        }

        loadCourses()
    }, [studentCode])

    const failedRows = useMemo(
        () => sortRows(buildFailedRows(plannedCourses)),
        [plannedCourses],
    )
    const clearedBacklogRows = useMemo(
        () => sortRows(buildClearedBacklogRows(plannedCourses)),
        [plannedCourses],
    )
    const overCurriculumRows = useMemo(
        () => sortRows(buildOverCurriculumRows(unplannedCourses)),
        [unplannedCourses],
    )

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CourseResultTable
                title="ผลการเรียนวิชาที่ไม่ผ่านตามแผน"
                courseNameTitle="ชื่อรายวิชายังไม่ผ่าน"
                rows={failedRows}
                loading={loading}
            />
            <CourseResultTable
                title="ผลการเรียนวิชาที่วิชาตกค้างที่ผ่านแล้ว"
                courseNameTitle="ชื่อรายวิชาผ่านแล้ว"
                rows={clearedBacklogRows}
                loading={loading}
            />
            <CourseResultTable
                title="วิชาเรียนที่เรียนเกินหลักสูตร"
                courseNameTitle="ชื่อรายวิชา"
                rows={overCurriculumRows}
                loading={loading}
            />
        </Space>
    )
}
