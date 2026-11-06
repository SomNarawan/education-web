export type AcademicPeriodCalendarStatus =
    | 'ready'
    | 'missing_calendar'
    | 'calendar_conflict'
    | 'not_required'

export type AcademicPeriodSummaryStatus =
    | 'ready'
    | 'missing_calendar'
    | 'calendar_conflict'
    | 'invalid_entry_year'

export type AcademicPeriodSyncStatus =
    | 'running'
    | 'success'
    | 'partial'
    | 'failed'

export interface AcademicPeriodCalendarCurriculum {
    curriculum: string
    curriculum_name_th: string
    term_code: string | null
    term_name_th: string | null
    start_date: string | null
    end_date: string | null
    status: 'ready' | 'missing'
}

export interface AcademicPeriodSummary {
    entry_year: number
    entry_year_be: number
    student_count: number
    study_year: number | null
    academic_year: number | null
    academic_year_be: number | null
    term_code: string | null
    term_name_th: string | null
    ready_count: number
    update_count: number
    unchanged_count: number
    status: AcademicPeriodSummaryStatus
}

export interface StudentAcademicPeriodPreviewGroup {
    is_international: boolean
    calendar_key: 'thai' | 'international'
    calendar_status: AcademicPeriodCalendarStatus
    calendar_message: string
    academic_year: number | null
    academic_year_be: number | null
    term_code: string | null
    term_name_th: string | null
    study_semester: number | null
    calendar_curricula: AcademicPeriodCalendarCurriculum[]
    total_students: number
    ready_students: number
    update_students: number
    unchanged_students: number
    missing_calendar_students: number
    invalid_students: number
    summaries: AcademicPeriodSummary[]
}

export interface StudentAcademicPeriodPreview {
    reference_date: string
    total_students: number
    ready_students: number
    update_students: number
    unchanged_students: number
    missing_calendar_students: number
    invalid_students: number
    groups: StudentAcademicPeriodPreviewGroup[]
}

export interface StudentAcademicPeriodSyncHistory {
    id: number
    reference_date: string
    is_international: boolean
    academic_year: number | null
    term_code: string | null
    term_name_th: string | null
    total_students: number
    updated_count: number
    skipped_count: number
    failed_count: number
    status: AcademicPeriodSyncStatus
    error_message: string | null
    created_at: string
    created_by: string
}
