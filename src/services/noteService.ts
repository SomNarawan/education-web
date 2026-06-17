import api from '../config/axios'
import type { NoteListResponse } from '../types/NoteListResponse'

interface CreateNoteRequest {
    student_id: number
    note: string
}

export async function createNote(data: CreateNoteRequest): Promise<void> {
    await api.post('/notes', data)
}

export async function getNotes(studentId: number): Promise<NoteListResponse[]> {
    const response = await api.get('/notes', {
        params: {
            student_id: studentId,
        },
    })

    return response.data.data
}

export async function deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}`)
}