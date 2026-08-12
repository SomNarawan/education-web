import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { StudentImportHistory } from '../types/StudentImport'

export async function getStudentImportHistory(): Promise<
    StudentImportHistory[]
> {
    const response = await api.get<ApiResponse<StudentImportHistory[]>>(
        '/student-imports',
    )

    return response.data.data
}

export async function importStudents(
    file: File,
): Promise<StudentImportHistory> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<StudentImportHistory>>(
        '/student-imports',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
        },
    )

    return response.data.data
}

export async function downloadStudentImportErrors(
    importId: number,
): Promise<Blob> {
    const response = await api.get<Blob>(
        `/student-imports/${importId}/errors`,
        { responseType: 'blob' },
    )

    return response.data
}

