import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    CreateGradeCalculationRequest,
    GradeCalculation,
    GradeCalculationListData,
    LatestGradeCalculationRequest,
    ListGradeCalculationsRequest,
} from '../types/GradeCalculation'

export async function getGradeCalculations(
    filters: ListGradeCalculationsRequest = {},
): Promise<GradeCalculationListData> {
    const response = await api.get<ApiResponse<GradeCalculationListData>>(
        '/grade-calculations',
        { params: filters },
    )

    return response.data.data
}

export async function getLatestGradeCalculation(
    filters: LatestGradeCalculationRequest = {},
): Promise<GradeCalculation | null> {
    const response = await api.get<ApiResponse<GradeCalculation | null>>(
        '/grade-calculations/latest',
        { params: filters },
    )

    return response.data.data
}

export async function createGradeCalculation(
    data: CreateGradeCalculationRequest,
): Promise<GradeCalculation> {
    const response = await api.post<ApiResponse<GradeCalculation>>(
        '/grade-calculations',
        data,
    )

    return response.data.data
}
