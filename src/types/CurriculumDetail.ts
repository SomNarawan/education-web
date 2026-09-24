export type CurriculumCategoryType = 'category' | 'subcategory' | 'group'

export type CurriculumCategoryApiType = CurriculumCategoryType | 'subject'

export type CurriculumCourseSourceType =
    | 'manual'
    | 'ku_subject_category'
    | 'non_course_requirement'
    | 'free_elective'

export interface CurriculumCategory {
    id: number
    category_type: CurriculumCategoryType
    code: string | null
    name_th: string | null
    name_en: string | null
    course_source_type?: CurriculumCourseSourceType | null
    children: CurriculumCategory[]
}

export interface CurriculumCategoryApiNode {
    id: number
    category_type: CurriculumCategoryApiType
    code: string | null
    name_th: string | null
    name_en: string | null
    course_source_type?: CurriculumCourseSourceType | null
    children: CurriculumCategoryApiNode[]
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
    plan_study_year?: number
    plan_semester?: string
    plan_semester_order?: number
    plan_study_period?: string
    course_code: string | null
    course_name: string
    course_category: string
    course_sub_category?: string | null
    curriculum_division?: string
    course_group: string | null
    course_requirement?: string | null
    credit: number
    enrollment_type: string
    enrollments: CurriculumEnrollment[]
}

export interface CurriculumEnrollmentPlan {
    planned_courses: CurriculumCourse[]
    unplanned_courses: CurriculumCourse[]
}

export interface CurriculumEnrollmentRecord {
    study_year: number
    semester: string
    semester_year?: number
    semester_year_be?: number
    semester_order?: number
    study_period?: string
    course_code: string | null
    course_name: string
    course_category: string
    course_sub_category?: string | null
    curriculum_division?: string
    course_group: string | null
    course_requirement?: string | null
    grade_letter: string | null
    grade_point?: string | number | null
    enrollment_type?: string
    credit: number
}

export interface CurriculumCourseRow extends CurriculumEnrollmentRecord {
    key: string
}

export interface FailedPlannedCourseRow extends CurriculumEnrollmentRecord {
    key: string
}
