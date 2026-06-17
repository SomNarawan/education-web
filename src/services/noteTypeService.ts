import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'

export interface NoteTypeResponse {
    id: number
    note: string
}

export async function getNoteTypes() {
    const response = await api.get<ApiResponse<NoteTypeResponse[]>>('/note-types')
    return response.data.data
}