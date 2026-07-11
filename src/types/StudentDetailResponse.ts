export interface StudentDetailResponse {
    id: number
    student_code: string
    student_id_card: string

    title_id: number
    full_name_th: string
    full_name_en: string

    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string

    phone: string
    email: string

    entry_year: number
    entry_year_be: number

    teacher_id: number
    teacher_full_name_th: string

    student_status_id: number
    student_status_name: string

    admission_channel_id: number
    admission_channel_name: string

    guardian_title_id: number
    guardian_first_name_th: string
    guardian_last_name_th: string
    guardian_full_name: string
    guardian_relationship_id: number
    guardian_relationship_name: string
    guardian_phone: string

    high_school_id: number
    high_school_name: string
    high_school_address: string

    study_plan_id: number
    curriculum_type: string
    curriculum_plan_name: string
    department_name: string
    faculty_name: string

    required_credits: number
    passed_credits: number
    not_passed_credits: number
    overed_credits: number

    gpa: number
}