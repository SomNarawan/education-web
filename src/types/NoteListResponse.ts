export interface NoteListResponse {
    id: number
    student_id: number
    note: string
    created_at: string
    deleted_at: string | null
}