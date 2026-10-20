import type { GradeCalculationCourseSource } from '../../types/GradeCalculation'

export type CourseSource = GradeCalculationCourseSource

export interface StudentOption {
    id: number
    studentCode: string
    fullName: string
}

export interface PredictionCourse {
    id: string
    code: string
    name: string
    credits: number
    source: CourseSource
    reason: string
    courseGroup: string | null
    courseGroupGpa: number | null
}

export interface CalculatedCourse extends PredictionCourse {
    grade: string
    gradePoints: number
}

export interface GradeCalculationResult {
    termGpa: number
    cumulativeCredits: number
    cumulativeGpa: number
    courses: CalculatedCourse[]
}

export interface GradeCalculationFormValues {
    grades?: Record<string, string>
}

export interface RestoredGradePrediction {
    courseIds: string[]
    grades: Record<string, string>
    unavailableCourseCount: number
}
