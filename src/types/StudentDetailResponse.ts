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
    study_year: number
    study_semester: number
    study_period: string | null

    current_year: number
    current_semester: number

    teacher_id: number | null
    teacher_full_name_th: string | null

    student_status_id: number
    student_status_name: string | null

    admission_channel_id: number
    admission_channel_name: string | null

    guardian_title_id: number
    guardian_first_name_th: string
    guardian_last_name_th: string
    guardian_full_name: string
    guardian_relationship_id: number
    guardian_relationship_name: string | null
    guardian_phone: string

    high_school_id: number
    high_school_name: string | null
    high_school_address: string

    study_plan_id: number
    curriculum_type: string | null
    study_plan_name: string | null
    curriculum_plan_name: string | null
    department_id: number | null
    department_name: string | null
    faculty_id: number | null
    faculty_name: string | null

    required_credits: number | null
    passed_credits: number | null
    not_passed_credits: number | null
    overed_credits: number | null

    gpa: number | null
    gpax: number | null
}
