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
