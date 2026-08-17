export interface StudentImportHistory {
    id: number
    imported_at: string
    file_name: string
    total_records: number
    success_count: number
    updated_count: number
    skipped_count: number
    failed_count: number
    status: string
    imported_by: string
    error_message: string | null
}

