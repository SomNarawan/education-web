import { message } from 'antd'
import { useEffect, useState } from 'react'
import {
    getAdmissionChannels,
    getGuardianRelationships,
    getHighSchoolOptions,
    getStudentStatuses,
    getTeachers,
    getTitles,
} from '../../../services/listOfValueService'
import { getStudyPlans } from '../../../services/masterDataService'
import type { ListOfValue } from '../../../types/ListOfValue'
import type { StudyPlan } from '../../../types/MasterData'

interface StudentFormOptions {
    titles: ListOfValue[]
    teachers: ListOfValue[]
    studentStatuses: ListOfValue[]
    admissionChannels: ListOfValue[]
    highSchools: ListOfValue[]
    guardianRelationships: ListOfValue[]
    studyPlans: StudyPlan[]
}

const emptyOptions: StudentFormOptions = {
    titles: [],
    teachers: [],
    studentStatuses: [],
    admissionChannels: [],
    highSchools: [],
    guardianRelationships: [],
    studyPlans: [],
}

export function useStudentFormOptions(enabled: boolean) {
    const [options, setOptions] = useState<StudentFormOptions>(emptyOptions)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            return
        }

        let cancelled = false

        const loadOptions = async () => {
            try {
                setLoading(true)
                setError(null)
                const [
                    titles,
                    teachers,
                    studentStatuses,
                    admissionChannels,
                    highSchools,
                    guardianRelationships,
                    studyPlans,
                ] = await Promise.all([
                    getTitles(),
                    getTeachers(),
                    getStudentStatuses(),
                    getAdmissionChannels(),
                    getHighSchoolOptions(),
                    getGuardianRelationships(),
                    getStudyPlans(),
                ])

                if (!cancelled) {
                    setOptions({
                        titles,
                        teachers,
                        studentStatuses,
                        admissionChannels,
                        highSchools,
                        guardianRelationships,
                        studyPlans,
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    const errorMessage =
                        'โหลดข้อมูลตัวเลือกสำหรับแบบฟอร์มไม่สำเร็จ'
                    setError(errorMessage)
                    message.error(errorMessage)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadOptions()

        return () => {
            cancelled = true
        }
    }, [enabled])

    return { options, loading, error }
}
