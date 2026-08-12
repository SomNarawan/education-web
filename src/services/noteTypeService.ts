import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { NoteTypeListResponse } from '../types/NoteTypeListResponse'

export async function getNoteTypes() {
    const response = await api.get<ApiResponse<NoteTypeListResponse[]>>('/note-types')
    return response.data.data
}