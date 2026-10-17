export interface AcademicTermTransition {
    from_semester: number
    from_name: string
    to_semester: number
    to_name: string
    increments_study_year: boolean
    affected_count: number
}

export interface AcademicTermPreview {
    eligible_count: number
    invalid_semester_count: number
    can_advance: boolean
    transitions: AcademicTermTransition[]
    preview_token: string
}

export interface AcademicTermRollover {
    id: number
    transitions: AcademicTermTransition[]
    affected_count: number
    created_by: string
    created_at: string
}
