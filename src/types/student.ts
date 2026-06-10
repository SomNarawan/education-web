export interface Title {
    id: number
    title_abbr_th?: string
    title_abbr_en?: string | null
    title_name_th: string
    title_name_en: string | null
    created_at?: string
    updated_at?: string
}

export interface Province {
    id: number
    province_name: string
    province_name_th?: string
    province_name_en?: string | null
}

export interface District {
    id: number
    district_name: string
    province_id: number
    province?: Province
}

export interface Subdistrict {
    id: number
    subdistrict_name: string
    postal_code: string
    district_id: number
    district?: District
}

export interface Teacher {
    id: number
    teacher_code: string
    title_id?: number
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone?: string
    email?: string
    department_id?: number
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
    is_deleted?: number
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
    subdistrict_id?: number
    subdistrict?: Subdistrict
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
    faculty_code?: string
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

export interface GuardianRelationship {
    id: number
    relationship_name: string
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
    curriculum_id?: number
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

    guardian_title?: Title
    guardian_relationship?: GuardianRelationship
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
    curriculum_id?: number
    department_id?: number
    faculty_id?: number
    campus_id?: number

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

    title_name?: string
    teacher_name?: string
    student_status_name?: string
    admission_channel_name?: string

    high_school_name?: string
    district_name?: string
    province_name?: string

    affiliation_name?: string
    study_plan_name?: string
    curriculum_name?: string
    department_name?: string
    faculty_name?: string
    campus_name?: string

    guardian_title_name?: string
    guardian_full_name?: string
    guardian_relationship_name?: string
}