export interface MockLoginUser {
    nontri_id: string
    full_name_th: string
    department_id: number | null
    faculty_id: number | null
    is_admin: boolean
}

export interface MockLoginStudent {
    student_code: string
    full_name_th: string
    department_id: number | null
    department_name: string | null
    faculty_id: number | null
    study_plan_id: number
}
