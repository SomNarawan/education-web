import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getCurriculumCategories } from '../../../services/masterDataService'
import { getStudentEnrollment } from '../../../services/studentJsonDataService'
import type {
    CurriculumCategory,
    CurriculumCourse,
    CurriculumCourseRow,
    CurriculumEnrollmentRecord,
} from '../../../types/CurriculumDetail'

function normalizeCurriculumCourse(
    course: CurriculumCourse,
): CurriculumEnrollmentRecord[] {
    const courseData = {
        course_name: course.course_name,
        course_category: course.course_category,
        course_sub_category: course.course_sub_category,
        curriculum_division: course.curriculum_division,
        course_group: course.course_group,
        course_requirement: course.course_requirement,
        enrollment_type: course.enrollment_type,
        credit: course.credit,
    }

    if (course.enrollments.length === 0) {
        return [
            {
                ...courseData,
                study_year: course.plan_study_year ?? 0,
                semester: course.plan_semester ?? '-',
                semester_order: course.plan_semester_order,
                study_period: course.plan_study_period,
                course_code: course.course_code,
                grade_letter: null,
                grade_point: null,
            },
        ]
    }

    return course.enrollments.map((enrollment) => ({
        ...courseData,
        study_year: enrollment.study_year,
        semester: enrollment.semester,
        semester_order: enrollment.semester_order,
        study_period: enrollment.actual_study_period,
        course_code: enrollment.actual_course_code ?? course.course_code,
        grade_letter: enrollment.grade_letter,
        grade_point: enrollment.grade_point,
    }))
}

function normalizeEnrollment(
    enrollment:
        | CurriculumEnrollmentRecord[]
        | { planned_courses: CurriculumCourse[]; unplanned_courses: CurriculumCourse[] },
): CurriculumEnrollmentRecord[] {
    if (Array.isArray(enrollment)) {
        return enrollment
    }

    return [
        ...enrollment.planned_courses,
        ...enrollment.unplanned_courses,
    ].flatMap(normalizeCurriculumCourse)
}
function buildRows(
    rows: CurriculumEnrollmentRecord[],
): CurriculumCourseRow[] {
    return rows.map((row, index) => ({
        ...row,
        key: `${row.course_code || 'course'}-${index}`,
    }))
}

function filterActiveCategories(
    categories: CurriculumCategory[],
): CurriculumCategory[] {
    return categories
        .filter((category) => category.status === 'activate')
        .map((category) => ({
            ...category,
            children: filterActiveCategories(category.children),
        }))
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback
}

export function useStudentCurriculumDetail(
    studentCode: string,
    studyPlanId: number,
) {
    const [categories, setCategories] = useState<CurriculumCategory[]>([])
    const [rows, setRows] = useState<CurriculumCourseRow[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)

    useEffect(() => {
        let cancelled = false

        const loadCategories = async () => {
            try {
                setLoadingCategories(true)
                if (!studyPlanId) {
                    throw new Error(
                        'แผนการเรียนไม่ถูกต้องหรือยังไม่ได้เลือก',
                    )
                }

                const data = await getCurriculumCategories(studyPlanId)

                if (!cancelled) {
                    setCategories(filterActiveCategories(data))
                }
            } catch (error) {
                if (cancelled) return

                console.error(error)
                message.error(
                    getErrorMessage(
                        error,
                        'โหลดหมวดหมู่หลักสูตรไม่สำเร็จ',
                    ),
                )
                setCategories([])
            } finally {
                if (!cancelled) {
                    setLoadingCategories(false)
                }
            }
        }

        loadCategories()

        return () => {
            cancelled = true
        }
    }, [studyPlanId])

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoadingCourses(true)
                const data = await getStudentEnrollment(studentCode)
                setRows(buildRows(normalizeEnrollment(data.enrollment)))
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
                setRows([])
            } finally {
                setLoadingCourses(false)
            }
        }

        loadCourses()
    }, [studentCode])

    return {
        categories,
        rows,
        loadingCategories,
        loadingCourses,
    }
}
