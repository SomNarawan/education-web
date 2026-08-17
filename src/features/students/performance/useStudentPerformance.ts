import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getStudentGraphs } from '../../../services/studentJsonDataService'
import type { CourseGroupDataset } from '../../../types/StudentCourseGroupPerformance'
import type {
    SemesterCreditStatus,
    SemesterCreditStatusRecord,
    StudentSemesterPerformance,
    StudentSemesterPerformanceRow,
} from '../../../types/StudentSemesterPerformance'

const creditStatusLabels: Record<string, string> = {
    credit_study: 'หน่วยกิตที่เรียน',
    credit_over: 'หน่วยกิตที่เรียนเกิน',
}

const semesterOrder: Record<string, number> = {
    ภาคฤดูร้อน: 0,
    ภาคต้น: 1,
    ภาคปลาย: 2,
}

function buildSemesterRows(
    rows: StudentSemesterPerformance[],
): StudentSemesterPerformanceRow[] {
    return [...rows]
        .sort((first, second) => {
            if (first.semester_year_be !== second.semester_year_be) {
                return first.semester_year_be - second.semester_year_be
            }

            return (
                (semesterOrder[first.semester] ?? 99) -
                (semesterOrder[second.semester] ?? 99)
            )
        })
        .map((row, index) => ({
            ...row,
            key: `${row.semester_year_be}-${row.semester}-${index}`,
        }))
}

function buildCreditStatuses(
    rows: SemesterCreditStatusRecord[],
): SemesterCreditStatus[] {
    return rows.map((row) => ({
        label: creditStatusLabels[row.type] ?? row.type,
        value: row.credits_study,
        total: row.credits_all,
        gpa: row.gpa,
    }))
}

export function useStudentPerformance(studentCode: string) {
    const [creditStatuses, setCreditStatuses] = useState<
        SemesterCreditStatus[]
    >([])
    const [semesterRows, setSemesterRows] = useState<
        StudentSemesterPerformanceRow[]
    >([])
    const [courseGroupDatasets, setCourseGroupDatasets] = useState<
        CourseGroupDataset[]
    >([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!studentCode) {
            return
        }

        let cancelled = false

        const loadPerformance = async () => {
            try {
                setLoading(true)
                const data = await getStudentGraphs(studentCode)

                if (cancelled) return

                setCreditStatuses(buildCreditStatuses(data.by_credit))
                setSemesterRows(buildSemesterRows(data.by_semester))
                setCourseGroupDatasets(
                    Object.entries(data.by_group)
                        .filter(([, records]) => records.length > 0)
                        .map(([group, records]) => ({
                            id: group,
                            rows: records.map((record, index) => ({
                                ...record,
                                key: `${group}-${index}`,
                            })),
                        })),
                )
            } catch (error) {
                if (cancelled) return

                console.error(error)
                message.error('โหลดรายงานผลการเรียนไม่สำเร็จ')
                setCreditStatuses([])
                setSemesterRows([])
                setCourseGroupDatasets([])
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadPerformance()

        return () => {
            cancelled = true
        }
    }, [studentCode])

    return {
        creditStatuses,
        semesterRows,
        courseGroupDatasets,
        loading,
    }
}
