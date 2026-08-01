import type {
    SemesterCreditStatus,
    StudentSemesterPerformanceRow,
} from '../../../types/StudentSemesterPerformance'

export interface StudentSemesterPerformanceSectionProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
    loading?: boolean
}

export interface StudentSemesterChartProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
}
