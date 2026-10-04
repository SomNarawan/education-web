import type {
    SemesterCreditStatus,
    StudentSemesterPerformanceRow,
} from '../../../types/StudentSemesterPerformance'

export interface StudentSemesterPerformanceSectionProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
    loading?: boolean
    display?: 'all' | 'chart' | 'table'
}

export interface StudentSemesterChartProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
}
