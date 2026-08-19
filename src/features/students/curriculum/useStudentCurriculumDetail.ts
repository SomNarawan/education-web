import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getCurriculumCategories } from '../../../services/masterDataService'
import { getStudentEnrollment } from '../../../services/studentJsonDataService'
import type {
    CurriculumCategory,
    CurriculumCourseRow,
    CurriculumEnrollmentRecord,
} from '../../../types/CurriculumDetail'

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
                setRows(buildRows(data.enrollment))
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
