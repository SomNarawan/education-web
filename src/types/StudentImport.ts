export type StudentImportStatus =
    | 'processing'
    | 'completed'
    | 'completed_with_errors'
    | 'failed'

export interface StudentImportHistory {
    id: number
    file_name: string
    started_at: string
    imported_by: string
    total_count: number
    success_count: number
    failed_count: number
    status: StudentImportStatus
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
