export type GradeImportStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'completed_with_errors'
    | 'failed'

export interface GradeImportHistory {
    id: number
    import_type_id: number
    type: string | null
    curriculum_id: number
    curriculum_code: string
    curriculum_plan_id: number | null
    curriculum_plan_name_th: string | null
    file_name: string
    started_at: string
    completed_at: string | null
    imported_by: string
    total_count: number
    success_count: number
    failed_count: number
    status: GradeImportStatus
    error_message: string | null
}
