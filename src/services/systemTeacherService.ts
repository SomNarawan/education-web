import type { ListOfValue } from '../types/ListOfValue'
import { getSystemTeachers } from './listOfValueService'

export async function getSystemTeachersByDepartment(
    departmentId: number,
): Promise<ListOfValue[]> {
    return getSystemTeachers(departmentId)
}
