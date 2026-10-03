export interface CurriculumPlanCourseOption {
    course_code: string
    course_name: string
    credit: number
}

export interface CurriculumPlanCourse {
    plan_study_year: number
    plan_semester: string
    plan_year: number
    plan_year_be: number
    plan_semester_order: number
    plan_study_period: string
    course_code: string | null
    course_name: string
    course_category_code: string | null
    course_category: string
    course_sub_category_code: string | null
    course_sub_category: string | null
    course_group_code: string | null
    course_group: string | null
    credit: number
    enrollment_type: string
    courses: CurriculumPlanCourseOption[] | null
}

export interface CurriculumPlanCourseList {
    curriculum_id: number
    curriculum_name: string
    curriculum_status: string
    curriculum_plan_id: number
    curriculum_plan_name: string
    total_credits_min: number
    data: CurriculumPlanCourse[]
}
