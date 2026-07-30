import type {
    SemesterCreditStatus,
    StudentSemesterPerformanceRow,
} from '../types/StudentSemesterPerformance'

export interface StudentSemesterPerformanceSectionProps {
    studentCode: string
}

export interface StudentSemesterChartProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
}
