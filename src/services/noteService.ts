import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { NoteListResponse } from '../types/NoteListResponse'

interface CreateNoteRequest {
    student_id: number
    note_type_id: number
    remark?: string | null
}

export async function createNote(data: CreateNoteRequest): Promise<void> {
    await api.post('/notes', data)
}

export async function getNotes(studentId: number): Promise<NoteListResponse[]> {
    const response = await api.get<ApiResponse<NoteListResponse[]>>('/notes', {
        params: {
            student_id: studentId,
        },
    })

    return response.data.data
}

export async function deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}`)
}
