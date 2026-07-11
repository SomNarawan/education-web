export interface CurriculumDivisionCategory {
    id: number
    name_th: string
}

export interface CurriculumEnrollment {
    study_year: number
    semester: string
    semester_order: number
    actual_study_period: string
    actual_course_code: string | null
    grade_letter: string | null
    grade_point: number | null
    is_passed: boolean
}

export interface CurriculumCourse {
    plan_study_year: number
    plan_semester: string
    plan_semester_order: number
    plan_study_period: string
    course_code: string | null
    course_name: string
    curriculum_division: string
    course_group: string | null
    credit: number
    enrollment_type: string
    enrollments: CurriculumEnrollment[]
}

export interface CurriculumEnrollmentPlan {
    planned_courses: CurriculumCourse[]
    unplanned_courses: CurriculumCourse[]
}

export interface CurriculumCourseRow {
    key: string
    study_year: number
    semester: string
    semester_order: number
    course_code: string | null
    course_name: string
    course_group: string | null
    curriculum_division: string
    grade_letter: string | null
    credit: number
}

export interface FailedPlannedCourseRow {
    key: string
    study_year: number | null
    semester: string | null
    semester_order: number
    course_group: string | null
    curriculum_division: string
    course_code: string | null
    course_name: string
    credit: number
    grade_letter: string | null
}
