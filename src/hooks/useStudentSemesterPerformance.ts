import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getStudentGraphs } from '../services/studentJsonDataService'
import type {
    SemesterCreditStatus,
    SemesterCreditStatusRecord,
    StudentSemesterPerformance,
    StudentSemesterPerformanceRow,
} from '../types/StudentSemesterPerformance'

const creditStatusLabels: Record<string, string> = {
    credit_study: 'หน่วยกิตที่เรียน',
    credit_over: 'หน่วยกิตที่เรียนเกิน',
}

const semesterOrder: Record<string, number> = {
    ภาคฤดูร้อน: 0,
    ภาคต้น: 1,
    ภาคปลาย: 2,
}

function buildRows(
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

export function useStudentSemesterPerformance(studentCode: string) {
    const [creditStatuses, setCreditStatuses] = useState<
        SemesterCreditStatus[]
    >([])
    const [rows, setRows] = useState<StudentSemesterPerformanceRow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadPerformance = async () => {
            try {
                setLoading(true)
                const data = await getStudentGraphs(studentCode)
                setCreditStatuses(buildCreditStatuses(data.by_credit))
                setRows(buildRows(data.by_semester))
            } catch (error) {
                console.error(error)
                message.error('โหลดรายงานผลการเรียนไม่สำเร็จ')
                setCreditStatuses([])
                setRows([])
            } finally {
                setLoading(false)
            }
        }

        loadPerformance()
    }, [studentCode])

    return { creditStatuses, rows, loading }
}
