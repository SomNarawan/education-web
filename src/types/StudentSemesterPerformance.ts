export interface StudentSemesterEnrollment {
    course_name: string
    grade_letter: string | null
    credit: number
}

export interface StudentSemesterPerformance {
    study_year: number
    semester: string
    semester_year: number
    semester_year_be: number
    credits: number
    gpa: number
    gpax: number
    diff_gpax: number | string
    enrollments: StudentSemesterEnrollment[]
}

export interface StudentSemesterPerformanceRow
    extends StudentSemesterPerformance {
    key: string
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
