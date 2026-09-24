export interface NoteListResponse {
    id: number
    student_id: number
    note_type_id: number
    note: string | null
    remark: string | null
    created_at: string
    created_by: string
    deleted_at: string | null
    deleted_by: string | null
}
