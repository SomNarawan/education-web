export interface AdvisorAssignmentStudent {
    id: number
    student_code: string | null
    full_name_th: string
}

export interface AdvisorUpdateResult {
    study_plan_id: number
    teacher_id: string
    assign_student_ids: number[]
    remove_student_ids: number[]
    assigned_count: number
    removed_count: number
}
