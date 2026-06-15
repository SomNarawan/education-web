import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { StudentListResponse } from '../types/StudentListResponse'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'

export async function getStudentsByPage(
    studentGroup?: string,
    studentStatus?: string,
    teacherId?: number,
    departmentId?: number,
    facultyId?: number,
    searchText?: string,
): Promise<StudentListResponse[]> {
    const params: Record<string, string | number> = {}

    if (studentGroup === 'advisor' && teacherId) {
        params.teacher_id = teacherId
    }

    if (studentGroup === 'department' && departmentId) {
        params.department_id = departmentId
    }

    if (studentGroup === 'faculty' && facultyId) {
        params.faculty_id = facultyId
    }

    if (studentStatus === 'graduated') {
        params.student_status_id = 2
    }

    if (searchText?.trim()) {
        params.search_text = searchText.trim()
    }

    const response = await api.get<ApiResponse<StudentListResponse[]>>('/students', {
        params,
    })

    return response.data.data
}

export async function getStudentDetail(id: number): Promise<StudentDetailResponse> {
    const response = await api.get<ApiResponse<StudentDetailResponse>>(`/students/${id}`)

    return response.data.data
}