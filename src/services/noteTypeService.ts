import { getNoteTypes as getListOfValueNoteTypes } from './listOfValueService'

export async function getNoteTypes() {
    return getListOfValueNoteTypes()
}
