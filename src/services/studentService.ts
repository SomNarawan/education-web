import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { StudentListResponse } from '../types/StudentListResponse'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'
import type { StudentFormValues } from '../types/StudentFormValues'

export async function getStudentsByPage(
    studentGroup?: string,
    teacherId?: number,
    departmentId?: number,
    facultyId?: number,
    searchNote?: string,
    searchText?: string,
    studentStatusId?: number,
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

    if (studentStatusId) {
        params.student_status_id = studentStatusId
    }

    if (searchNote?.trim()) {
        params.search_note = searchNote.trim()
    }

    if (searchText?.trim()) {
        params.search_text = searchText.trim()
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
    data: StudentFormValues,
): Promise<StudentDetailResponse> {
    const response = await api.post<ApiResponse<StudentDetailResponse>>(
        '/students',
        data,
    )

    return response.data.data
}

export async function updateStudent(
    id: number,
    data: StudentFormValues,
): Promise<StudentDetailResponse> {
    const response = await api.put<ApiResponse<StudentDetailResponse>>(
        `/students/${id}`,
        data,
    )

    return response.data.data
}

export async function deleteStudent(id: number): Promise<void> {
    await api.delete(`/students/${id}`)
}