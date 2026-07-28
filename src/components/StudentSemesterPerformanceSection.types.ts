import type {
    StudentSemesterPerformance,
    StudentSemesterPerformanceRow,
} from '../types/StudentSemesterPerformance'

export interface StudentSemesterPerformanceSectionProps {
    studentCode: string
}

export interface SemesterCreditStatus {
    label: string
    value: number
    total: number
    gpa: number
}

export interface SemesterCreditStatusRecord {
    type: string
    credits_study: number
    credits_all: number
    gpa: number
}

export type SemesterPerformanceModule = {
    default: StudentSemesterPerformance[]
}

export type SemesterCreditStatusModule = {
    default: SemesterCreditStatusRecord[]
}

export interface StudentSemesterChartProps {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
}
