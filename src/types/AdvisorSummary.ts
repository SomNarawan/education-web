export type GpaxRangeKey =
    | 'range_3_25_4_00'
    | 'range_2_00_3_24'
    | 'range_1_75_1_99'
    | 'range_0_00_1_74'
    | 'no_gpax'

export type GpaxRanges = Record<GpaxRangeKey, number>

export interface AdvisorHistoryStudent {
    id: number
    student_code: string
    full_name_th: string
    study_year: number | null
    current_gpax: number | null
    term_study_year?: number | null
    gpa?: number
    gpax?: number | null
    range?: GpaxRangeKey
    plan_status?: 'on_plan' | 'off_plan' | 'retired' | 'unknown'
    status?: 'studying' | 'graduated' | 'retired' | 'other'
    status_source?: string
    pending_count?: number | null
    pending_credits?: number | null
    pending_courses?: AdvisorPendingCourse[] | null
}

export interface AdvisorPendingCourse {
    course_code: string | null
    course_name: string | null
    study_period: string | null
    semester_year_be: number | null
    grade_letter: string | null
    enrollment_type: string
    credit: number | null
    // Past terms only: whether the course has been passed since, from the latest grades.
    resolved?: boolean
    resolved_term_label?: string | null
}

export interface AdvisorAnnualCohort {
    entry_year: number
    ranges: GpaxRanges
    students: AdvisorHistoryStudent[]
}

export interface AdvisorAcademicTerm {
    academic_year: number
    semester_order: number
    semester_name: string
    term_label: string
    on_plan: number
    off_plan: number
    retired: number
    unknown: number
    students: AdvisorHistoryStudent[]
}

export interface AdvisorSummaryTotals {
    all: number
    studying: number
    graduated: number
    retired: number
    other: number
}

// Studying students compared with their study plan: on plan = every course of
// the plan that is due has been passed, off plan = at least one is not passed
// or not taken, unknown = no grade import for the student yet.
export interface PlanStatusCounts {
    on_plan: number
    off_plan: number
    unknown: number
}

export interface AdvisorSummaryEntryYear {
    entry_year: number
    total: number
    studying: number
    graduated: number
    retired: number
    other: number
    // GPAX ranges of the students of this entry year who are studying / have graduated.
    gpax: GpaxRanges
    graduated_gpax: GpaxRanges
    plan: PlanStatusCounts
    students: AdvisorHistoryStudent[]
}

export interface AdvisorSummaryStudyYear {
    study_year: number
    count: number
}

export type AdvisorSummaryBlockKey =
    | 'plan_status'
    | 'gpa_by_study_year'
    | 'gpa_by_academic_term'

export interface AdvisorSummaryBlock {
    available: boolean
    reason: string | null
}

export interface AdvisorSummaryDataQuality {
    // Studying or graduated students whose GPAX is exactly 0.00 / missing:
    // usually grades were never imported.
    gpax_zero: number
    gpax_missing: number
}

export interface AdvisorSummary {
    gpa_by_study_year: { study_year: number; cohorts: AdvisorAnnualCohort[] }[]
    academic_terms: AdvisorAcademicTerm[]
    history_coverage: { with_grades: number; without_grades: number }
    teacher_id: string | null
    teacher_full_name: string | null
    totals: AdvisorSummaryTotals
    studying_gpax: GpaxRanges
    graduated_gpax: GpaxRanges
    studying_by_study_year: AdvisorSummaryStudyYear[]
    plan_status: PlanStatusCounts
    off_plan_students: AdvisorHistoryStudent[]
    by_entry_year: AdvisorSummaryEntryYear[]
    data_quality: AdvisorSummaryDataQuality
    blocks: Record<AdvisorSummaryBlockKey, AdvisorSummaryBlock>
}
