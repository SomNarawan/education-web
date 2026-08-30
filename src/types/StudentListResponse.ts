export interface StudentListResponse {
    id: number
    student_code: string
    full_name_th: string

    teacher_id: number | null
    teacher_full_name_th: string | null

    curriculum_type: string
    study_plan_name: string | null
    curriculum_plan_name: string | null

    required_credits: number | null
    passed_credits: number | null
    not_passed_credits: number | null
    overed_credits: number | null

    gpa: number | null
    gpax: number | null
}
