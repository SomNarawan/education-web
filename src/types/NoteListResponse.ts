export interface NoteListResponse {
    id: number
    student_id: number
    note: string
    remark: string | null
    created_at: string
    deleted_at: string | null
}