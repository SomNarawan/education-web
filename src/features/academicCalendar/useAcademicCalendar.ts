import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAcademicCalendar } from '../../services/academicCalendarService'
import { getSyncHistory } from '../../services/syncService'
import type {
    AcademicCalendarData,
    AcademicCurriculumType,
    AcademicTermCode,
} from '../../types/AcademicCalendar'
import {
    createAcademicYearOptions,
    createAcademicYearRange,
} from '../../utils/academicYear'
import { ACADEMIC_TERM_ORDER } from './academicCalendar.constants'
import {
    getEventsForDate,
    getMonthsInRange,
    mapAcademicCalendarEvents,
} from './academicCalendar.utils'

const ACADEMIC_YEAR_OPTION_COUNT = 5
const CURRENT_ACADEMIC_YEAR = dayjs().year()

export function useAcademicCalendar() {
    const [calendarData, setCalendarData] =
        useState<AcademicCalendarData | null>(null)
    const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [curriculum, setCurriculum] =
        useState<AcademicCurriculumType>('thai')
    const [selectedTerm, setSelectedTerm] =
        useState<AcademicTermCode>('first')
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const academicYearOptions = useMemo(
        () => createAcademicYearOptions(
            createAcademicYearRange(
                CURRENT_ACADEMIC_YEAR,
                ACADEMIC_YEAR_OPTION_COUNT - 1,
                1,
            ),
        ).sort((firstOption, secondOption) =>
            firstOption.value - secondOption.value,
        ),
        [],
    )

    const loadCalendar = useCallback(async (year: number) => {
        setLoading(true)
        setLoadError(null)

        try {
            const data = await getAcademicCalendar(year)
            setCalendarData(data)
            setAcademicYear(year)
        } catch (error) {
            console.error('Unable to load academic calendar', error)
            setLoadError('โหลดข้อมูลปฏิทินการศึกษาไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }, [])

    const loadLastSyncDate = useCallback(async () => {
        try {
            const history = await getSyncHistory({
                sync_type: 3,
                status: 'success',
            })
            const latestSync = history.find((item) => item.sync_type === 3)

            setLastSyncedAt(
                latestSync?.updated_at ?? latestSync?.created_at ?? null,
            )
        } catch (error) {
            console.error('Unable to load academic calendar sync date', error)
            setLastSyncedAt(null)
        }
    }, [])

    useEffect(() => {
        // Initial API load is intentionally triggered when the page mounts.
        /* eslint-disable react-hooks/set-state-in-effect */
        void Promise.all([
            loadCalendar(CURRENT_ACADEMIC_YEAR),
            loadLastSyncDate(),
        ])
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [loadCalendar, loadLastSyncDate])

    const curriculumOptions = useMemo(() => {
        const options = new Map<AcademicCurriculumType, string>()

        calendarData?.terms.forEach((term) => {
            options.set(term.curriculum, term.curriculumNameTh)
        })

        return Array.from(options, ([value, label]) => ({ value, label }))
    }, [calendarData?.terms])

    const availableTerms = useMemo(
        () => (calendarData?.terms ?? [])
            .filter((term) => term.curriculum === curriculum)
            .sort(
                (firstTerm, secondTerm) =>
                    ACADEMIC_TERM_ORDER.indexOf(firstTerm.code) -
                    ACADEMIC_TERM_ORDER.indexOf(secondTerm.code),
            ),
        [calendarData?.terms, curriculum],
    )
    const activeTerm = availableTerms.find(
        (term) => term.code === selectedTerm,
    )
    const events = useMemo(
        () => mapAcademicCalendarEvents(activeTerm?.events ?? []),
        [activeTerm],
    )
    const calendarMonths = useMemo(
        () => activeTerm
            ? getMonthsInRange(activeTerm.startDate, activeTerm.endDate)
            : [],
        [activeTerm],
    )
    const selectedDateEvents = useMemo(
        () => selectedDate ? getEventsForDate(events, selectedDate) : [],
        [events, selectedDate],
    )

    const selectAcademicYear = useCallback((year: number) => {
        setSelectedDate(null)
        void loadCalendar(year)
    }, [loadCalendar])

    const selectCurriculum = useCallback((value: AcademicCurriculumType) => {
        setCurriculum(value)
        setSelectedDate(null)
    }, [])

    const selectTerm = useCallback((value: AcademicTermCode) => {
        setSelectedTerm(value)
        setSelectedDate(null)
    }, [])

    return {
        academicYear,
        academicYearOptions,
        curriculum,
        curriculumOptions,
        selectedTerm,
        availableTerms,
        activeTerm,
        events,
        calendarMonths,
        selectedDate,
        selectedDateEvents,
        lastSyncedAt,
        loading,
        loadError,
        loadCalendar,
        selectAcademicYear,
        selectCurriculum,
        selectTerm,
        setSelectedDate,
    }
}
