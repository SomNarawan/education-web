import { message } from 'antd'
import { useCallback, useState } from 'react'
import { deleteNote, getNotes } from '../../../services/noteService'
import type { NoteListResponse } from '../../../types/NoteListResponse'

export function useStudentNotes(studentId?: number) {
    const [notes, setNotes] = useState<NoteListResponse[]>([])
    const [loading, setLoading] = useState(false)

    const loadNotes = useCallback(async (requestedStudentId?: number) => {
        const targetStudentId = requestedStudentId ?? studentId

        if (!targetStudentId) {
            setNotes([])
            return
        }

        try {
            setLoading(true)
            setNotes(await getNotes(targetStudentId))
        } catch (error) {
            console.error(error)
            message.error('โหลดประวัติ Note ไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }, [studentId])

    const removeNote = useCallback(
        async (noteId: number) => {
            try {
                await deleteNote(noteId)
                message.success('ลบ Note สำเร็จ')
                await loadNotes()
            } catch (error) {
                console.error(error)
                message.error('ลบ Note ไม่สำเร็จ')
            }
        },
        [loadNotes],
    )

    return { notes, loading, loadNotes, removeNote }
}
