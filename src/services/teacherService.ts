import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { TeacherListResponse } from '../types/TeacherListResponse'

export async function getTeachersByDepartment(
    departmentId: number,
): Promise<TeacherListResponse[]> {
    const response = await api.get<ApiResponse<TeacherListResponse[]>>(
        '/teachers',
        {
            params: { department_id: departmentId },
        },
    )

    return response.data.data
}
