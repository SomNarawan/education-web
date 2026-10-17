import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    AcademicTermPreview,
    AcademicTermRollover,
} from '../types/AcademicTerm'

export async function getAcademicTermPreview(): Promise<AcademicTermPreview> {
    const response = await api.get<ApiResponse<AcademicTermPreview>>(
        '/academic-term/preview',
    )

    return response.data.data
}

export async function getAcademicTermRollovers(): Promise<
    AcademicTermRollover[]
> {
    const response = await api.get<ApiResponse<AcademicTermRollover[]>>(
        '/academic-term/rollovers',
    )

    return response.data.data
}

export async function advanceAcademicTerm(
    previewToken: string,
): Promise<AcademicTermRollover> {
    const response = await api.post<ApiResponse<AcademicTermRollover>>(
        '/academic-term/advance',
        {
            preview_token: previewToken,
            confirmation: 'ADVANCE_TERM',
        },
    )

    return response.data.data
}
