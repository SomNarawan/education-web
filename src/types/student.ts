export interface Title {
    id: number
    title_name_th: string
    title_name_en: string | null
    created_at?: string
    updated_at?: string
}

export interface Teacher {
    id: number
    teacher_code: string
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone?: string
    email?: string
    created_at?: string
    updated_at?: string

    title?: Title
}

export interface StudentStatus {
    id: number
    status_name: string
}

export interface AdmissionChannel {
    id: number
    channel_name: string
    description?: string | null
}

export interface HighSchool {
    id: number
    school_name: string
}

export interface Affiliation {
    id: number
    affiliation_name_th: string
    affiliation_name_en: string | null
}

export interface Department {
    id: number
    department_code: string
    department_name: string
    department_short_name: string
}

export interface Faculty {
    id: number
    faculty_name_th: string
    faculty_name_en: string | null
}

export interface Campus {
    id: number
    campus_code: string
    campus_name_th: string
    campus_name_en: string | null
}

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

    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string

    phone: string
    email: string

    entry_year: string
    gpa: string

    earned_credits: number
    required_credits: number

    created_at: string
    updated_at: string
    deleted_at: string | null

    is_deleted: number

    title?: Title
    teacher?: Teacher
    student_status?: StudentStatus
    admission_channel?: AdmissionChannel
    high_school?: HighSchool
    affiliation?: Affiliation
    study_plan?: StudyPlan
    curriculum?: Curriculum
    department?: Department
    faculty?: Faculty
    campus?: Campus
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
    | 'title'
    | 'teacher'
    | 'student_status'
    | 'admission_channel'
    | 'high_school'
    | 'affiliation'
    | 'study_plan'
    | 'curriculum'
    | 'department'
    | 'faculty'
    | 'campus'
>