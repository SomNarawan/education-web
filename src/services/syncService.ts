import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    SyncDataType,
    SyncHistoryRecord,
    SyncResult,
} from '../types/SyncData'

const syncEndpoints: Record<SyncDataType, string> = {
    faculty: '/system-faculties/sync',
    department: '/system-departments/sync',
    teacher: '/teachers/sync',
}

export async function syncMasterData(
    dataType: SyncDataType,
): Promise<SyncResult> {
    const response = await api.get<ApiResponse<SyncResult>>(
        syncEndpoints[dataType],
    )

    return response.data.data
}

export async function getSyncHistory(): Promise<SyncHistoryRecord[]> {
    const response = await api.get<ApiResponse<SyncHistoryRecord[]>>('/syncs')

    return response.data.data
}
