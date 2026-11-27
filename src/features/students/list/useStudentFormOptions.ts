import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    getAdmissionChannels,
    getCurriculumPersonnel,
    getCurriculums,
    getGuardianRelationships,
    getHighSchoolOptions,
    getSystemDepartments,
    getStudentStatuses,
    getTitles,
} from '../../../services/listOfValueService'
import { getStudyPlans } from '../../../services/masterDataService'
import type { ListOfValue } from '../../../types/ListOfValue'
import type { StudyPlan } from '../../../types/MasterData'
import type { StudentCreateFormOptions } from '../../../types/StudentCreateFormOptions'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'

type OptionId = string | number

interface OptionListResult<T> {
    options: T[]
    error: string | null
}

const emptyOptions: never[] = []
const missingOptionError = 'ไม่พบข้อมูลตัวเลือกเดิม'
const loadOptionError = 'โหลดข้อมูลตัวเลือกไม่สำเร็จ'

function addCurrentOption<T extends { id: OptionId }>(
    options: T[],
    option: T | null,
): T[] {
    if (!option || options.some(({ id }) => id === option.id)) {
        return options
    }

    return [option, ...options]
}

function namedOption<Id extends OptionId>(
    id: Id | null | undefined,
    name: string | null | undefined,
    nameEn: string | null = null,
): ListOfValue<Id> | null {
    const label = name?.trim()
    return id != null && label ? { id, name_th: label, name_en: nameEn } : null
}

async function fetchMissingOptions<Id extends OptionId, T extends { id: Id }>(
    ids: Id[],
    load: (includeIds: Id[]) => Promise<T[]>,
): Promise<OptionListResult<T>> {
    const response = await load(ids)
    const options = response.filter(({ id }) => ids.includes(id))
    const hasAllOptions = ids.every((id) => options.some((item) => item.id === id))

    return { options, error: hasAllOptions ? null : missingOptionError }
}

function missingId<T extends { id: number }>(
    options: T[] | undefined,
    id: number | null | undefined,
): number | null {
    return options && id != null && !options.some((item) => item.id === id)
        ? id
        : null
}

function useMissingOptions<T extends { id: number }>(
    baseOptions: T[] | undefined,
    load: (includeIds: number[]) => Promise<T[]>,
    currentId?: number | null,
    secondCurrentId?: number | null,
) {
    const firstId = useMemo(
        () => missingId(baseOptions, currentId),
        [baseOptions, currentId],
    )
    const secondId = useMemo(
        () => missingId(baseOptions, secondCurrentId),
        [baseOptions, secondCurrentId],
    )
    const [response, setResponse] = useState<{
        firstId: number | null
        secondId: number | null
        result: OptionListResult<T>
    } | null>(null)

    useEffect(() => {
        if (firstId === null && secondId === null) return

        let cancelled = false
        const ids = [...new Set([firstId, secondId])]
            .filter((id): id is number => id !== null)
            .sort((a, b) => a - b)

        const loadOptions = async () => {
            let result: OptionListResult<T>
            try {
                result = await fetchMissingOptions(ids, load)
            } catch (error) {
                console.error(
                    'Unable to load current student form options',
                    error instanceof Error ? error.name : undefined,
                )
                result = { options: [], error: loadOptionError }
            }

            if (!cancelled) setResponse({ firstId, secondId, result })
        }

        void loadOptions()
        return () => {
            cancelled = true
        }
    }, [firstId, secondId, load])

    const result =
        response?.firstId === firstId && response.secondId === secondId
            ? response.result
            : null
    const options = useMemo(
        () => result?.options.length
            ? [...result.options, ...(baseOptions ?? emptyOptions)]
            : baseOptions ?? emptyOptions,
        [baseOptions, result],
    )

    return {
        options,
        loading: (firstId !== null || secondId !== null) && !result,
        error: result?.error ?? null,
    }
}

function useCurriculumOptions<Id extends OptionId>(
    curriculumId: number | undefined,
    load: (curriculumId: number, includeIds?: Id[]) => Promise<ListOfValue<Id>[]>,
    currentId?: Id | null,
    currentName?: string | null,
    currentNameEn?: string | null,
) {
    const [response, setResponse] = useState<{
        curriculumId: number
        currentId: Id | null | undefined
        currentName: string | null | undefined
        currentNameEn: string | null | undefined
        result: OptionListResult<ListOfValue<Id>>
    } | null>(null)

    useEffect(() => {
        if (!curriculumId) return

        let cancelled = false
        const loadOptions = async () => {
            const currentOption = namedOption(currentId, currentName, currentNameEn)
            let options = currentOption ? [currentOption] : emptyOptions
            let optionError: string | null = null
            try {
                const baseOptions = await load(curriculumId)
                if (cancelled) return

                options = addCurrentOption(baseOptions, currentOption)
                if (
                    currentId != null &&
                    !currentOption &&
                    !baseOptions.some(({ id }) => id === currentId)
                ) {
                    const missing = await fetchMissingOptions(
                        [currentId],
                        (ids) => load(curriculumId, ids),
                    )
                    options = [...missing.options, ...baseOptions]
                    optionError = missing.error
                }
            } catch (error) {
                console.error(
                    'Unable to load student curriculum options',
                    error instanceof Error ? error.name : undefined,
                )
                optionError = loadOptionError
            }

            if (!cancelled) {
                setResponse({
                    curriculumId,
                    currentId,
                    currentName,
                    currentNameEn,
                    result: { options, error: optionError },
                })
            }
        }

        void loadOptions()
        return () => {
            cancelled = true
        }
    }, [curriculumId, currentId, currentName, currentNameEn, load])

    const result =
        response &&
        response.curriculumId === curriculumId &&
        response.currentId === currentId &&
        response.currentName === currentName &&
        response.currentNameEn === currentNameEn
            ? response.result
            : null

    return {
        options: result?.options ?? emptyOptions,
        loading: !!curriculumId && !result,
        error: result?.error ?? null,
    }
}

export function useStudentFormOptions(
    preloaded: StudentCreateFormOptions | null,
    curriculumId?: number,
    editingStudent?: StudentDetailResponse | null,
) {
    const studyPlanRequests = useRef(new Map<string, Promise<StudyPlan[]>>())
    const loadStudyPlans = useCallback((id: number, includeIds?: number[]) => {
        const requests = studyPlanRequests.current
        const key = `${id}:${includeIds?.join(',') ?? ''}`
        const cached = requests.get(key)
        if (cached) return cached

        const request = getStudyPlans(id, includeIds).catch((error: unknown) => {
            requests.delete(key)
            throw error
        })
        requests.set(key, request)
        return request
    }, [])

    const base = useMemo(() => {
        if (!preloaded || !editingStudent) return preloaded

        const curriculum = namedOption(
            editingStudent.curriculum_id,
            editingStudent.curriculum_code,
        )
        return {
            ...preloaded,
            curriculums: addCurrentOption(
                preloaded.curriculums,
                curriculum && {
                    ...curriculum,
                    is_international: editingStudent.is_international,
                },
            ),
            system_departments: addCurrentOption(
                preloaded.system_departments,
                namedOption(
                    editingStudent.system_department_id,
                    editingStudent.department_name,
                ),
            ),
            student_statuses: addCurrentOption(
                preloaded.student_statuses,
                namedOption(
                    editingStudent.student_status_id,
                    editingStudent.student_status_name,
                ),
            ),
            admission_channels: addCurrentOption(
                preloaded.admission_channels,
                namedOption(
                    editingStudent.admission_channel_id,
                    editingStudent.admission_channel_name,
                ),
            ),
            high_schools: addCurrentOption(
                preloaded.high_schools,
                namedOption(
                    editingStudent.high_school_id,
                    editingStudent.high_school_name,
                ),
            ),
            guardian_relationships: addCurrentOption(
                preloaded.guardian_relationships,
                namedOption(
                    editingStudent.guardian_relationship_id,
                    editingStudent.guardian_relationship_name,
                ),
            ),
        }
    }, [preloaded, editingStudent])

    const currentCurriculum = editingStudent?.curriculum_id === curriculumId
        ? editingStudent
        : null

    return {
        titles: useMissingOptions(
            base?.titles,
            getTitles,
            editingStudent?.title_id,
            editingStudent?.guardian_title_id,
        ),
        curriculums: useMissingOptions(
            base?.curriculums,
            getCurriculums,
            editingStudent?.curriculum_id,
        ),
        systemDepartments: useMissingOptions(
            base?.system_departments,
            getSystemDepartments,
            editingStudent?.system_department_id,
        ),
        studentStatuses: useMissingOptions(
            base?.student_statuses,
            getStudentStatuses,
            editingStudent?.student_status_id,
        ),
        admissionChannels: useMissingOptions(
            base?.admission_channels,
            getAdmissionChannels,
            editingStudent?.admission_channel_id,
        ),
        highSchools: useMissingOptions(
            base?.high_schools,
            getHighSchoolOptions,
            editingStudent?.high_school_id,
        ),
        guardianRelationships: useMissingOptions(
            base?.guardian_relationships,
            getGuardianRelationships,
            editingStudent?.guardian_relationship_id,
        ),
        studyPlans: useCurriculumOptions(
            curriculumId,
            loadStudyPlans,
            currentCurriculum?.study_plan_id,
            currentCurriculum?.study_plan_name_th,
            currentCurriculum?.study_plan_name,
        ),
        systemTeachers: useCurriculumOptions(
            curriculumId,
            getCurriculumPersonnel,
            currentCurriculum?.teacher_id,
            currentCurriculum?.teacher_full_name,
        ),
    }
}
