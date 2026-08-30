import api from '../config/axios'
import type { AxiosProgressEvent } from 'axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    StudentImportDownload,
    StudentImportHistory,
    StudentImportResult,
} from '../types/StudentImport'
import {
    getStudentImportFileName,
    parseStudentImportSummary,
} from '../features/students/import/studentImportUtils'

export async function getStudentImportHistory(): Promise<
    StudentImportHistory[]
> {
    const response = await api.get<ApiResponse<StudentImportHistory[]>>(
        '/imports',
        { params: { type: 'student' } },
    )

    return response.data.data
}

export async function importStudents(
    file: File,
    curriculumId: number,
    studyPlanId: number,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
): Promise<StudentImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('curriculum_id', String(curriculumId))
    formData.append('study_plan_id', String(studyPlanId))

    const response = await api.post<Blob>(
        '/students/import',
        formData,
        {
            responseType: 'blob',
            onUploadProgress,
        },
    )

    return {
        summary: parseStudentImportSummary(response.headers),
    }
}

export async function downloadStudentImportResult(
    importId: number,
): Promise<StudentImportDownload> {
    const response = await api.get<Blob>(`/imports/${importId}/result`, {
        responseType: 'blob',
    })

    return {
        blob: response.data,
        fileName: getStudentImportFileName(
            response.headers,
            `student_import_result_${importId}.xlsx`,
        ),
    }
}

export async function downloadStudentImportTemplate(): Promise<
    StudentImportDownload
> {
    const response = await api.get<Blob>('/students/import/template', {
        responseType: 'blob',
    })

    return {
        blob: response.data,
        fileName: getStudentImportFileName(
            response.headers,
            'Import Student Template.xlsx',
        ),
    }
}
