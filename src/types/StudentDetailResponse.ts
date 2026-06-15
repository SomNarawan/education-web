export interface StudentDetailResponse {
    id: number
    student_code: string
    full_name_th: string

    teacher_id: number
    teacher_full_name_th: string

    curriculum_type: string
    study_plan_name: string

    credits_required: number
    pass_credits: number
    not_pass_credits: number
    over_credits: number

    gpa: number
}