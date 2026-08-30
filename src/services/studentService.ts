import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { StudentListResponse } from '../types/StudentListResponse'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'
import type {
    CreateStudentRequest,
    ListStudentsRequest,
    UpdateStudentRequest,
} from '../types/StudentRequest'

export async function getStudents(
    filters: ListStudentsRequest = {},
): Promise<StudentListResponse[]> {
    const params: ListStudentsRequest = {
        ...filters,
        search_note: filters.search_note?.trim() || undefined,
        search_text: filters.search_text?.trim() || undefined,
    }

    const response = await api.get<ApiResponse<StudentListResponse[]>>(
        '/students',
        {
            params,
        },
    )

    return response.data.data
}

export async function getStudentDetail(
    id: number,
): Promise<StudentDetailResponse> {
    const response = await api.get<ApiResponse<StudentDetailResponse>>(
        `/students/${id}`,
    )

    return response.data.data
}

export async function createStudent(
    data: CreateStudentRequest,
): Promise<StudentDetailResponse> {
    const response = await api.post<ApiResponse<StudentDetailResponse>>(
        '/students',
        data,
    )

    return response.data.data
}

export async function updateStudent(
    id: number,
    data: UpdateStudentRequest,
): Promise<StudentDetailResponse> {
    const response = await api.patch<ApiResponse<StudentDetailResponse>>(
        `/students/${id}`,
        data,
    )

    return response.data.data
}

export async function deleteStudent(id: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/students/${id}`)
}
