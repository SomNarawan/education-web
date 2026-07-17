import { Card, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import CustomTable from './custom/CustomTable'
import { getCurriculumDivisionCategories } from '../services/masterDataService'
import type {
    CurriculumCourse,
    CurriculumCourseRow,
    CurriculumDivisionCategory,
    CurriculumEnrollmentPlan,
} from '../types/CurriculumDetail'

interface StudentCurriculumDetailSectionProps {
    studentCode: string
}

const enrollmentPlans = import.meta.glob<{
    default: CurriculumEnrollmentPlan
}>('../data/enrollments/*.json')

const columns: ColumnsType<CurriculumCourseRow> = [
    {
        title: 'ปีที่',
        dataIndex: 'study_year',
        key: 'study_year',
        width: 90,
        sorter: (a, b) => a.study_year - b.study_year,
    },
    {
        title: 'ภาคการศึกษา',
        dataIndex: 'semester',
        key: 'semester',
        width: 150,
        sorter: (a, b) => a.semester_order - b.semester_order,
    },
    {
        title: 'รหัสวิชา',
        dataIndex: 'course_code',
        key: 'course_code',
        width: 130,
        render: (value: string | null) => value || '-',
    },
    {
        title: 'ชื่อวิชา',
        dataIndex: 'course_name',
        key: 'course_name',
        minWidth: 260,
    },
    {
        title: 'หมวดรายวิชา',
        dataIndex: 'course_group',
        key: 'course_group',
        minWidth: 240,
        render: (value: string | null, record) =>
            value || record.curriculum_division || '-',
    },
    {
        title: 'ผลการเรียน',
        dataIndex: 'grade_letter',
        key: 'grade_letter',
        width: 110,
        render: (value: string | null) => value || '-',
    },
    {
        title: 'หน่วยกิต',
        dataIndex: 'credit',
        key: 'credit',
        width: 100,
        sorter: (a, b) => a.credit - b.credit,
    },
]

function buildRows(courses: CurriculumCourse[]): CurriculumCourseRow[] {
    return courses.map((course, courseIndex) => {
        if (course.enrollments.length === 0) {
            return {
                key: `${courseIndex}-planned`,
                study_year: course.plan_study_year,
                semester: course.plan_semester,
                semester_order: course.plan_semester_order,
                course_code: course.course_code,
                course_name: course.course_name,
                course_group: course.course_group,
                curriculum_division: course.curriculum_division,
                grade_letter: null,
                credit: course.credit,
            }
        }

        const enrollments = [...course.enrollments].sort((a, b) => {
            if (a.study_year !== b.study_year) {
                return a.study_year - b.study_year
            }

            return a.semester_order - b.semester_order
        })
        const latestEnrollment = enrollments[enrollments.length - 1]
        const gradeLetters = enrollments
            .map((enrollment) => enrollment.grade_letter)
            .filter((grade): grade is string => Boolean(grade))

        return {
            key: `${courseIndex}-enrolled`,
            study_year: latestEnrollment.study_year,
            semester: latestEnrollment.semester,
            semester_order: latestEnrollment.semester_order,
            course_code:
                latestEnrollment.actual_course_code || course.course_code,
            course_name: course.course_name,
            course_group: course.course_group,
            curriculum_division: course.curriculum_division,
            grade_letter:
                gradeLetters.length > 0 ? gradeLetters.join(',') : null,
            credit: course.credit,
        }
    })
}

function sortRows(rows: CurriculumCourseRow[]) {
    return [...rows].sort((a, b) => {
        if (a.study_year !== b.study_year) {
            return a.study_year - b.study_year
        }

        if (a.semester_order !== b.semester_order) {
            return a.semester_order - b.semester_order
        }

        return (a.course_code || '').localeCompare(b.course_code || '')
    })
}

export default function StudentCurriculumDetailSection({
    studentCode,
}: StudentCurriculumDetailSectionProps) {
    const [categories, setCategories] = useState<
        CurriculumDivisionCategory[]
    >([])
    const [courses, setCourses] = useState<CurriculumCourse[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true)
                const data = await getCurriculumDivisionCategories()
                setCategories(data)
            } catch (error) {
                console.error(error)
                message.error('โหลดหมวดรายวิชาไม่สำเร็จ')
            } finally {
                setLoadingCategories(false)
            }
        }

        loadCategories()
    }, [])

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoadingCourses(true)
                const importer =
                    enrollmentPlans[
                        `../data/enrollments/${studentCode}.json`
                    ]

                if (!importer) {
                    setCourses([])
                    return
                }

                const module = await importer()
                setCourses([
                    ...module.default.planned_courses,
                    ...module.default.unplanned_courses,
                ])
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
                setCourses([])
            } finally {
                setLoadingCourses(false)
            }
        }

        loadCourses()
    }, [studentCode])

    const allRows = useMemo(() => sortRows(buildRows(courses)), [courses])

    const tabs = useMemo(
        () =>
            categories.map((category) => ({
                key: String(category.id),
                label: category.name_th,
                children: (
                    <CustomTable<CurriculumCourseRow>
                        rowKey="key"
                        columns={columns}
                        dataSource={allRows.filter(
                            (row) =>
                                row.curriculum_division === category.name_th,
                        )}
                        loading={loadingCourses}
                        searchPlaceholder="ค้นหารายวิชา..."
                        showNo={false}
                        scroll={{ x: 1100 }}
                    />
                ),
            })),
        [allRows, categories, loadingCourses],
    )

    return (
        <Card
            title="รายละเอียดผลการเรียน"
            size="small"
            loading={loadingCategories}
        >
            <Tabs items={tabs} destroyOnHidden />
        </Card>
    )
}
