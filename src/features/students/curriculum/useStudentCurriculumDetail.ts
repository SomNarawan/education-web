import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getCurriculumDivisions } from '../../../services/masterDataService'
import { getStudentEnrollment } from '../../../services/studentJsonDataService'
import type {
    CurriculumCourseRow,
    CurriculumDivision,
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

export function useStudentCurriculumDetail(studentCode: string) {
    const [divisions, setDivisions] = useState<CurriculumDivision[]>([])
    const [rows, setRows] = useState<CurriculumCourseRow[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true)
                setDivisions(await getCurriculumDivisions())
            } catch (error) {
                console.error(error)
                message.error('โหลดโครงสร้างหลักสูตรไม่สำเร็จ')
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
        divisions,
        rows,
        loadingCategories,
        loadingCourses,
    }
}
