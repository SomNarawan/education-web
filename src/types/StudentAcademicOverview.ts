export interface StudentAcademicTerm {
    year: number
    semester: string
    semester_order: number
}

export interface StudentCompletedAcademicTerm extends StudentAcademicTerm {
    academic_year: number | null
    academic_year_be: number | null
}

export interface StudentAcademicHistory extends StudentCompletedAcademicTerm {
    credits: number
    gpa: number
    gpax: number
}

export interface StudentPendingCourse {
    course_code: string | null
    course_name_th: string | null
    credit: number | null
    previous_grade: string | null
    course_category: string | null
    course_sub_category: string | null
    course_group: string | null
}

export interface StudentNextTermCourse {
    course_code: string | null
    course_name_th: string | null
    credit: number | null
    course_category: string | null
    course_sub_category: string | null
    course_group: string | null
}

export interface StudentNextAcademicTerm extends StudentAcademicTerm {
    source_import_id: number | null
    courses: StudentNextTermCourse[]
}

export interface StudentAcademicOverview {
    student_id: number
    student_code: string
    current_term: StudentAcademicTerm
    gpax: number | null
    cumulative_credits: number | null
    latest_gpa: number | null
    latest_completed_term: StudentCompletedAcademicTerm | null
    academic_history: StudentAcademicHistory[]
    pending_courses: StudentPendingCourse[]
    next_term: StudentNextAcademicTerm
    missing_sections: string[]
}

export interface StudentUnattemptedCoursesData {
    student_id: number
    student_code: string
    source_import_id: number | null
    courses: StudentNextTermCourse[]
    missing_sections: string[]
}
