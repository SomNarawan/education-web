export type GradeCalculationCourseSource =
    | 'backlog'
    | 'next-semester'
    | 'other'

export interface GradeCalculationStudent {
    id: number
    student_code: string
    full_name_th: string
}

export interface GradeCalculationCourse {
    code: string
    name: string
    credits: number
    source: GradeCalculationCourseSource
    grade: string
    grade_points: number
}

export interface GradeCalculation {
    id: number
    student: GradeCalculationStudent
    study_year: number
    semester: string
    semester_order: number | null
    current_gpax: number
    current_credits: number
    term_gpa: number
    term_credits: number
    cumulative_gpa: number
    cumulative_credits: number
    courses: GradeCalculationCourse[]
    created_at: string
}

export interface GradeCalculationPagination {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export interface GradeCalculationListData {
    items: GradeCalculation[]
    pagination: GradeCalculationPagination
}

export interface ListGradeCalculationsRequest {
    student_id?: number
    page?: number
    per_page?: number
}

export interface CreateGradeCalculationRequest {
    study_year: number
    semester: string
    semester_order: number | null
    courses: Array<{
        code: string
        name: string
        credits: number
        source: GradeCalculationCourseSource
        grade: string
    }>
}
