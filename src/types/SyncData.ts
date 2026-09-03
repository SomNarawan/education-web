export type SyncDataType = 'faculty' | 'department'

export type SyncType = 1 | 2

export type SyncExecutionStatus = 'running' | 'success' | 'failed'

export interface GetSyncsParams {
    sync_type?: SyncType
    status?: SyncExecutionStatus
}

export interface SyncResult {
    id: number
    sync_type: SyncType
    inserted_count: number
    updated_count: number
    inactivated_count: number
    skipped_count: number
    status: SyncExecutionStatus
    error_message: string | null
    created_at: string
    updated_at: string
}

export interface SyncHistoryRecord {
    id: number | null
    sync_type: SyncType
    sync_type_name: string
    inserted_count: number | null
    updated_count: number | null
    inactivated_count: number | null
    skipped_count: number | null
    status: SyncExecutionStatus | null
    error_message: string | null
    created_at: string | null
    created_by: string | null
    updated_at: string | null
    updated_by: string | null
}

export type SystemMasterDataStatus = 'active' | 'inactive'

interface SyncedDataBase {
    id: number
    created_at: string | null
    created_by: string | null
    updated_at: string | null
    updated_by: string | null
    status: SystemMasterDataStatus
    sync_id: number | null
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
    faculty_name: string | null
}

export type SyncStatus = 'waiting' | SyncExecutionStatus

export interface SyncTableRecord {
    key: SyncDataType
    label: string
    inserted: number | null
    updated: number | null
    inactivated: number | null
    skipped: number | null
    status: SyncStatus
    syncedAt: string | null
    errorMessage: string | null
}
