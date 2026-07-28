import type {
    StudentCourseGroupPerformance,
    StudentCourseGroupPerformanceRow,
} from '../types/StudentCourseGroupPerformance'

export interface StudentCourseGroupPerformanceSectionProps {
    studentCode: string
}

export interface CourseGroupDataset {
    id: string
    rows: StudentCourseGroupPerformanceRow[]
}

export type CourseGroupPerformanceModule = {
    default: StudentCourseGroupPerformance[]
}
