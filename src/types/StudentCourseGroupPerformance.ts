export interface StudentCourseGroupPerformance {
    course_group: string
    gpa: number
    credits: number
    completed_credits: number
    remaining_credits: number
    overed_credits?: number | null
}

export interface StudentCourseGroupPerformanceRow
    extends StudentCourseGroupPerformance {
    key: string
}

export interface CourseGroupDataset {
    id: string
    rows: StudentCourseGroupPerformanceRow[]
}
