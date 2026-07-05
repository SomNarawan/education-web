export type SyncDataType = 'faculty' | 'department' | 'teacher'

export interface SyncResult {
    synced: number
    deleted: number
    skipped_null?: number
    skipped_unknown?: number
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
}
