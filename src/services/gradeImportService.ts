import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    GradeImportDownload,
    GradeImportHistory,
} from '../types/GradeImport'
import { getDownloadFileName } from '../features/imports/importUtils'

export async function getGradeImportHistory(): Promise<GradeImportHistory[]> {
    const response = await api.get<ApiResponse<GradeImportHistory[]>>(
        '/imports',
        { params: { type: 'grade' } },
    )

    return response.data.data
}

export async function importGrades(
    file: File,
    curriculumId: number,
    curriculumName: string,
): Promise<GradeImportHistory> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('curriculum_id', String(curriculumId))
    formData.append('curriculum_name', curriculumName)

    const response = await api.post<ApiResponse<GradeImportHistory>>(
        '/grades/import',
        formData,
    )

    return response.data.data
}

export async function downloadGradeImportTemplate(): Promise<Blob> {
    const response = await api.get<Blob>('/grades/import/template', {
        responseType: 'blob',
    })

    return response.data
}

export async function downloadGradeImportResult(
    importId: number,
): Promise<GradeImportDownload> {
    const response = await api.get<Blob>(`/imports/${importId}/result`, {
        responseType: 'blob',
    })

    return {
        blob: response.data,
        fileName: getDownloadFileName(
            response.headers,
            `grade_import_result_${importId}.xlsx`,
        ),
    }
}
