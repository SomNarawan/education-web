export type SyncDataType = 'faculty' | 'department' | 'teacher'

export type SyncType = 1 | 2 | 3

export interface SyncResult {
    id: number
    sync_type: SyncType
    synced_count: number
    deleted_count: number
    skipped_count: number
    status: string
    error_message: string | null
    created_at: string
    updated_at: string
}

export interface SyncHistoryRecord {
    id: number | null
    sync_type: SyncType
    sync_type_name: string
    synced_count: number | null
    deleted_count: number | null
    skipped_count: number | null
    status: string | null
    error_message: string | null
    created_at: string | null
    updated_at: string | null
}

interface SyncedDataBase {
    id: number
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface SyncedSystemFaculty extends SyncedDataBase {
    th_name: string
    en_name: string
    th_short_name: string
    en_short_name: string
}

export interface SyncedSystemDepartment extends SyncedDataBase {
    th_name: string
    en_name: string
    th_short_name: string
    en_short_name: string
    system_faculty_id: number
}

export interface SyncedTeacher extends SyncedDataBase {
    nontri_id: string
    full_name_th: string
    department_id: number
}

export type SyncStatus = 'waiting' | 'success' | 'error'

export interface SyncTableRecord {
    key: SyncDataType
    label: string
    synced: number | null
    deleted: number | null
    skipped: number | null
    status: SyncStatus
    syncedAt: string | null
    errorMessage: string | null
}
