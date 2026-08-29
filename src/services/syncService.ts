import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    GetSyncsParams,
    SyncDataType,
    SyncHistoryRecord,
    SyncResult,
    SyncedSystemDepartment,
    SyncedSystemFaculty,
    SyncedSystemTeacher,
} from '../types/SyncData'

const syncEndpoints: Record<SyncDataType, string> = {
    faculty: '/system-faculties/sync',
    department: '/system-departments/sync',
    systemTeacher: '/system-teachers/sync',
}

export async function syncMasterData(
    dataType: SyncDataType,
): Promise<SyncResult> {
    const response = await api.post<ApiResponse<SyncResult>>(
        syncEndpoints[dataType],
    )

    return response.data.data
}

export async function getSyncHistory(
    filters: GetSyncsParams = {},
): Promise<SyncHistoryRecord[]> {
    const params: GetSyncsParams = {}

    if (filters.sync_type !== undefined) {
        params.sync_type = filters.sync_type
    }

    if (filters.status !== undefined) {
        params.status = filters.status
    }

    const response = await api.get<ApiResponse<SyncHistoryRecord[]>>('/syncs', {
        params,
    })

    return response.data.data
}

export async function getSyncedSystemFaculties(): Promise<
    SyncedSystemFaculty[]
> {
    const response = await api.get<ApiResponse<SyncedSystemFaculty[]>>(
        '/system-faculties',
    )

    return response.data.data
}

export async function getSyncedSystemDepartments(): Promise<
    SyncedSystemDepartment[]
> {
    const response = await api.get<ApiResponse<SyncedSystemDepartment[]>>(
        '/system-departments',
    )

    return response.data.data
}

export async function getSyncedSystemTeachers(): Promise<
    SyncedSystemTeacher[]
> {
    const response = await api.get<ApiResponse<SyncedSystemTeacher[]>>(
        '/system-teachers',
        {
            params: { include_deleted: true },
        },
    )

    return response.data.data
}
