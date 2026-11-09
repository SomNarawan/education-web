import api from '../config/axios'
import type { AdvisorSummary } from '../types/AdvisorSummary'
import type { ApiResponse } from '../types/ApiResponse'

// The API reads the advisor from the signed-in teacher's token.
export async function getAdvisorSummary(): Promise<AdvisorSummary> {
    const response = await api.get<ApiResponse<AdvisorSummary>>(
        '/students/advisor-summary',
    )

    return response.data.data
}
