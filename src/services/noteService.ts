import api from '../config/axios'

interface CreateNoteRequest {
    student_id: number
    note: string
}

export async function createNote(data: CreateNoteRequest): Promise<void> {
    await api.post('/notes', data)
}