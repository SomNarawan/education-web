import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getStudentEnrollmentStatuses } from '../../../services/studentJsonDataService'
import type {
    CurriculumEnrollmentRecord,
    FailedPlannedCourseRow,
} from '../../../types/CurriculumDetail'

function buildRows(
    rows: CurriculumEnrollmentRecord[],
    keyPrefix: string,
): FailedPlannedCourseRow[] {
    return rows.map((row, index) => ({
        ...row,
        key: `${keyPrefix}-${row.course_code || 'course'}-${index}`,
    }))
}

export function useStudentFailedPlannedCourses(studentCode: string) {
    const [failedRows, setFailedRows] = useState<FailedPlannedCourseRow[]>([])
    const [clearedBacklogRows, setClearedBacklogRows] = useState<
        FailedPlannedCourseRow[]
    >([])
    const [overCurriculumRows, setOverCurriculumRows] = useState<
        FailedPlannedCourseRow[]
    >([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoading(true)
                const data = await getStudentEnrollmentStatuses(studentCode)
                setFailedRows(buildRows(data.enrollment_not_pass, 'not-pass'))
                setClearedBacklogRows(
                    buildRows(data.enrollment_pass, 'pass'),
                )
                setOverCurriculumRows(
                    buildRows(data.enrollment_over, 'over'),
                )
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
                setFailedRows([])
                setClearedBacklogRows([])
                setOverCurriculumRows([])
            } finally {
                setLoading(false)
            }
        }

        loadCourses()
    }, [studentCode])

    return {
        failedRows,
        clearedBacklogRows,
        overCurriculumRows,
        loading,
    }
}
