export interface CreateStudentRequest {
    student_code?: string | null
    student_id_card: string
    title_id: number
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone: string
    email: string

    teacher_id?: string | null
    teacher_full_name?: string | null
    student_status_id: number
    admission_channel_id: number
    high_school_id?: number | null
    curriculum_id: number
    curriculum_code: string
    study_plan_id: number
    study_plan_name_th: string
    department_id?: number
    entry_year: number
    study_year?: number
    study_semester?: 1 | 2 | 3
    study_period?: string

    guardian_title_id?: number | null
    guardian_first_name_th?: string | null
    guardian_last_name_th?: string | null
    guardian_relationship_id?: number | null
    guardian_phone?: string | null
}

export type UpdateStudentRequest = Partial<CreateStudentRequest>

export interface ListStudentsRequest {
    teacher_id?: string
    department_id?: number
    faculty_id?: number
    student_status_id?: number
    search_text?: string
    search_note?: string
}
