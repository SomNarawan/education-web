export interface StudentFormValues {
    student_code: string
    student_id_card: string
    title_id: number
    first_name_th: string
    last_name_th: string
    first_name_en: string
    last_name_en: string
    phone: string
    email: string

    study_plan_id: number
    entry_year: number

    teacher_id?: number

    admission_channel_id: number

    high_school_id: number

    guardian_title_id: number
    guardian_first_name_th: string
    guardian_last_name_th: string
    guardian_relationship_id: number
    guardian_phone: string

    student_status_id: number

    gpa: number
    passed_credits: number
    not_passed_credits: number
    overed_credits: number
}
