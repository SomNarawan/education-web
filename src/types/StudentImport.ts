export type StudentImportStatus =
    | 'processing'
    | 'completed'
    | 'completed_with_errors'
    | 'failed'

export interface StudentImportHistory {
    id: number
    import_type_id: number
    type: string | null
    system_department_id: number | null
    curriculum_id: number
    curriculum_code: string
    curriculum_plan_id: number
    curriculum_plan_name_th: string
    file_name: string
    started_at: string
    completed_at: string | null
    imported_by: string
    total_count: number
    success_count: number
    failed_count: number
    status: StudentImportStatus
    error_message: string | null
}

export interface StudentImportSummary {
    importId: number
    total: number
    success: number
    failed: number
}

export interface StudentImportResult {
    summary: StudentImportSummary
}

export interface StudentImportDownload {
    blob: Blob
    fileName: string
}

export interface StudentImportApiErrorBody {
    message?: string
    errors?: Record<string, string | string[]> | null
}

export interface StudentImportError {
    message: string
    validationErrors: string[]
    status?: number
}
