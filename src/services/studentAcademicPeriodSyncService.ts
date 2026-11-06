import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    StudentAcademicPeriodPreview,
    StudentAcademicPeriodSyncHistory,
} from '../types/StudentAcademicPeriodSync'

const endpoint = '/student-academic-period-sync'

export async function getStudentAcademicPeriodPreview(): Promise<
    StudentAcademicPeriodPreview
> {
    const response = await api.get<ApiResponse<StudentAcademicPeriodPreview>>(
        `${endpoint}/preview`,
    )

    return response.data.data
}

export async function getStudentAcademicPeriodSyncHistory(): Promise<
    StudentAcademicPeriodSyncHistory[]
> {
    const response = await api.get<
        ApiResponse<StudentAcademicPeriodSyncHistory[]>
    >(`${endpoint}/history`)

    return response.data.data
}

export async function syncStudentAcademicPeriods(): Promise<
    StudentAcademicPeriodSyncHistory[]
> {
    const response = await api.post<
        ApiResponse<StudentAcademicPeriodSyncHistory[]>
    >(endpoint)

    return response.data.data
}
