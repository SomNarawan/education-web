export interface StudentListResponse {
    id: number
    student_code: string
    full_name_th: string

    teacher_id: number
    teacher_full_name_th: string

    curriculum_type: string
    curriculum_plan_name: string

    required_credits: number
    passed_credits: number
    not_passed_credits: number
    overed_credits: number

    gpa: number
    gpax: number
}
