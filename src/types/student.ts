export interface Title {
    id: number
    title_abbr_th?: string
    title_abbr_en?: string | null
    title_name_th: string
    title_name_en: string | null
}

export interface Province {
    id: number
    province_name: string
}

export interface District {
    id: number
    district_name: string
    province_id: number
    province?: Province | null
}

export interface Subdistrict {
    id: number
    subdistrict_name: string
    postal_code: string
    district_id: number
    district?: District | null
}

export interface HighSchool {
    id: number
    school_name: string
    subdistrict_id?: number | null
    subdistrict?: Subdistrict | null
}

export interface StudentStatus {
    id: number
    status_name: string
}

export interface AdmissionChannel {
    id: number
    channel_name: string
}

export interface Department {
    id: number
    department_code: string
    department_name: string
    department_short_name: string
    faculty?: Faculty | null
}

export interface Faculty {
    id: number
    faculty_code?: string | null
    faculty_name_th?: string
    faculty_name_en?: string | null
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
    total_credits_min?: number
    department_id?: number
    department?: Department | null
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
    curriculum?: Curriculum | null
}

export interface Teacher {
    id: number
    teacher_code: string
    title_id?: number | null
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone?: string | null
    email?: string | null
    department_id?: number | null
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
    is_deleted?: number
    title?: Title | null
}

export interface GuardianRelationship {
    id: number
    relationship_name: string
}

export interface Affiliation {
    id: number
    affiliation_name_th: string
    affiliation_name_en: string | null
}

export interface Campus {
    id: number
    campus_code: string
    campus_name_th: string
    campus_name_en: string | null
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

    guardian_title_id?: number | null
    guardian_first_name_th?: string | null
    guardian_last_name_th?: string | null
    guardian_relationship_id?: number | null
    guardian_phone?: string | null

    created_at: string
    updated_at: string
    deleted_at: string | null
    is_deleted: number

    title?: Title | null
    teacher?: Teacher | null
    student_status?: StudentStatus | null
    admission_channel?: AdmissionChannel | null
    high_school?: HighSchool | null
    affiliation?: Affiliation | null
    study_plan?: StudyPlan | null
    campus?: Campus | null

    guardian_title?: Title | null
    guardian_relationship?: GuardianRelationship | null
}

export interface StudentApiResponse {
    success: boolean
    message: string
    data: Student[]
}

export interface StudentFormValues {
    student_code: string

    title_id?: number
    teacher_id?: number
    student_status_id?: number
    admission_channel_id?: number
    high_school_id?: number
    affiliation_id?: number
    study_plan_id?: number

    first_name_th: string
    last_name_th: string
    first_name_en?: string
    last_name_en?: string

    phone?: string
    email?: string

    entry_year?: string
    gpa?: string | number

    earned_credits?: number
    required_credits?: number

    guardian_title_id?: number
    guardian_first_name_th?: string
    guardian_last_name_th?: string
    guardian_relationship_id?: number
    guardian_phone?: string
}