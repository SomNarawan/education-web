export interface Curriculum {
    id: number
    curriculum_code: string
    name_th: string
    name_en: string | null
    display_name_th: string | null
    display_name_en: string | null
    degree_name_th: string | null
    degree_short_name_th: string | null
    degree_name_en: string | null
    degree_short_name_en: string | null
    start_year: number
    end_year: number
    curriculum_note: string | null
    status: string
    created_at: string
    updated_at: string
}

export interface StudyPlan {
    id: number
    curriculum_id: number
    name_th: string
    name_en: string | null
    study_plan_tracks_note: string | null
    status: string
    created_at: string
    updated_at: string
    curriculum?: Curriculum
}

export interface Student {
    id: number
    student_code: string
    title_id: number
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone: string
    email: string
    teacher_id: number
    student_status_id: number
    admission_channel_id: number
    high_school_id: number
    affiliation_id: number
    study_plan_id: number
    curriculum_id: number
    department_id: number
    faculty_id: number
    campus_id: number
    entry_year: string
    gpa: string
    earned_credits: number
    required_credits: number
    created_at: string
    updated_at: string
    deleted_at: string | null
    is_deleted: number
    study_plan?: StudyPlan
}

export interface StudentApiResponse {
    success: boolean
    message: string
    data: Student[]
}

export type StudentFormValues = Omit<
    Student,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'is_deleted'
    | 'study_plan'
>