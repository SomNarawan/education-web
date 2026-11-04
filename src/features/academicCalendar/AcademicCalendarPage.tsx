import {
    CalendarOutlined,
    ClockCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Empty,
    Modal,
    Segmented,
    Spin,
    Tag,
    Typography,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAcademicCalendar } from '../../services/academicCalendarService'
import { getSyncHistory } from '../../services/syncService'
import type {
    AcademicCalendarData,
    AcademicCalendarEventData,
    AcademicCurriculumType,
    AcademicTermCode,
} from '../../types/AcademicCalendar'
import {
    createAcademicYearOptions,
    createAcademicYearRange,
    toBuddhistYear,
} from '../../utils/academicYear'
import { formatThaiDateTime } from '../../utils/dateFormat'
import {
    ACADEMIC_EVENT_DISPLAY,
    ACADEMIC_EVENT_TYPE_PRIORITY,
    ACADEMIC_TERM_ORDER,
    SHORT_THAI_WEEKDAYS,
    THAI_MONTHS,
    THAI_WEEKDAYS,
    type AcademicCalendarEventType,
} from './academicCalendar.constants'

type AcademicTerm = AcademicTermCode
type CurriculumType = AcademicCurriculumType

interface AcademicCalendarEvent {
    id: string
    title: string
    description: string | null
    startDate: Dayjs
    endDate: Dayjs
    type: AcademicCalendarEventType
}

const ACADEMIC_YEAR_OPTION_COUNT = 5
const CURRENT_ACADEMIC_YEAR = dayjs().year()
const ACADEMIC_YEAR_OPTIONS = createAcademicYearOptions(
    createAcademicYearRange(
        CURRENT_ACADEMIC_YEAR,
        ACADEMIC_YEAR_OPTION_COUNT - 1,
        1,
    ),
)

function getCalendarEventType(
    event: AcademicCalendarEventData,
): AcademicCalendarEventType {
    if (event.eventType === 'holiday') {
        return 'holiday'
    }

    return 'academic'
}

function getHighestPriorityEventType(
    events: AcademicCalendarEvent[],
): AcademicCalendarEventType | undefined {
    return events.reduce<AcademicCalendarEventType | undefined>((selectedType, event) => {
        if (
            selectedType === undefined ||
            ACADEMIC_EVENT_TYPE_PRIORITY[event.type] >
                ACADEMIC_EVENT_TYPE_PRIORITY[selectedType]
        ) {
            return event.type
        }

        return selectedType
    }, undefined)
}

function mapEvents(
    sourceEvents: AcademicCalendarEventData[],
): AcademicCalendarEvent[] {
    return sourceEvents
        .map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            startDate: dayjs(event.startDate),
            endDate: dayjs(event.endDate),
            type: getCalendarEventType(event),
        }))
        .sort((firstEvent, secondEvent) =>
            firstEvent.startDate.valueOf() - secondEvent.startDate.valueOf(),
        )
}

function getMonthsInRange(startDate: string, endDate: string): Dayjs[] {
    const startMonth = dayjs(startDate).startOf('month')
    const endMonth = dayjs(endDate).startOf('month')

    if (!startMonth.isValid() || !endMonth.isValid() || endMonth.isBefore(startMonth)) {
        return []
    }

    const months: Dayjs[] = []
    let currentMonth = startMonth

    while (!currentMonth.isAfter(endMonth, 'month')) {
        months.push(currentMonth)
        currentMonth = currentMonth.add(1, 'month')
    }

    return months
}

function formatShortDate(date: Dayjs): string {
    return `${date.date()} ${THAI_MONTHS[date.month()]} ${toBuddhistYear(date.year())}`
}

function formatDateRange(startDate: Dayjs, endDate: Dayjs): string {
    if (startDate.isSame(endDate, 'day')) {
        return formatShortDate(startDate)
    }

    if (startDate.year() === endDate.year()) {
        const start = `${startDate.date()} ${THAI_MONTHS[startDate.month()]}`
        return `${start} – ${formatShortDate(endDate)}`
    }

    return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
}

function formatEventDate(event: AcademicCalendarEvent): string {
    return formatDateRange(event.startDate, event.endDate)
}

function formatFullDate(date: Dayjs): string {
    return `${THAI_WEEKDAYS[date.day()]}ที่ ${formatShortDate(date)}`
}

function ScheduleEventItem({ event }: { event: AcademicCalendarEvent }) {
    return (
        <div className="academic-schedule-item">
            <span
                className={`academic-schedule-marker ${ACADEMIC_EVENT_DISPLAY[event.type].className}`}
            />
            <div>
                <strong>{event.title}</strong>
                <span>
                    <ClockCircleOutlined /> {formatEventDate(event)}
                </span>
                {event.description && (
                    <Typography.Text
                        type="secondary"
                        className="academic-schedule-description"
                    >
                        {event.description}
                    </Typography.Text>
                )}
            </div>
            <Tag color={ACADEMIC_EVENT_DISPLAY[event.type].color}>
                {ACADEMIC_EVENT_DISPLAY[event.type].label}
            </Tag>
        </div>
    )
}

interface MonthCalendarProps {
    monthDate: Dayjs
    events: AcademicCalendarEvent[]
    selectedDate: Dayjs | null
    onSelectDate: (date: Dayjs) => void
}

function MonthCalendar({
    monthDate,
    events,
    selectedDate,
    onSelectDate,
}: MonthCalendarProps) {
    const firstDay = monthDate.startOf('month')
    const daysInMonth = firstDay.daysInMonth()
    const cells = Array.from(
        { length: Math.ceil((firstDay.day() + daysInMonth) / 7) * 7 },
        (_, index) => {
            const date = index - firstDay.day() + 1
            return date > 0 && date <= daysInMonth ? date : null
        },
    )

    return (
        <Card
            className="academic-month-card"
            title={`${THAI_MONTHS[firstDay.month()]} ${toBuddhistYear(firstDay.year())}`}
            size="small"
        >
            <div className="academic-month-grid" role="grid">
                {SHORT_THAI_WEEKDAYS.map((weekday, index) => (
                    <div
                        key={weekday}
                        className={index === 0 || index === 6
                            ? 'academic-weekday academic-weekend'
                            : 'academic-weekday'}
                        role="columnheader"
                    >
                        {weekday}
                    </div>
                ))}
                {cells.map((date, index) => {
                    if (date === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="academic-calendar-day academic-calendar-day-empty"
                                role="gridcell"
                            />
                        )
                    }

                    const currentDate = firstDay.date(date)
                    const matchingEvents = events.filter(
                        (item) =>
                            !currentDate.isBefore(item.startDate, 'day') &&
                            !currentDate.isAfter(item.endDate, 'day'),
                    )
                    const displayType = getHighestPriorityEventType(
                        matchingEvents,
                    )
                    const weekend = currentDate.day() === 0 || currentDate.day() === 6
                    const classes = [
                        'academic-calendar-day',
                        weekend ? 'academic-calendar-day-weekend' : '',
                        displayType
                            ? ACADEMIC_EVENT_DISPLAY[displayType].className
                            : '',
                        selectedDate?.isSame(currentDate, 'day')
                            ? 'academic-calendar-day-selected'
                            : '',
                    ].filter(Boolean).join(' ')
                    const eventTitles = matchingEvents
                        .map((event) => event.title)
                        .join('\n')

                    return (
                        <button
                            key={date}
                            type="button"
                            className={classes}
                            role="gridcell"
                            title={eventTitles || undefined}
                            aria-pressed={selectedDate?.isSame(
                                currentDate,
                                'day',
                            )}
                            aria-label={matchingEvents.length > 0
                                ? `${date} ${THAI_MONTHS[firstDay.month()]}: มี ${matchingEvents.length} กำหนดการ`
                                : `${date} ${THAI_MONTHS[firstDay.month()]}`}
                            onClick={() => onSelectDate(currentDate)}
                        >
                            {String(date).padStart(2, '0')}
                        </button>
                    )
                })}
            </div>
        </Card>
    )
}

export default function AcademicCalendarPage() {
    const navigate = useNavigate()
    const [calendarData, setCalendarData] =
        useState<AcademicCalendarData | null>(null)
    const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [curriculum, setCurriculum] = useState<CurriculumType>('thai')
    const [selectedTerm, setSelectedTerm] = useState<AcademicTerm>('first')
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

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
        const options = new Map<CurriculumType, string>()

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
        () => mapEvents(activeTerm?.events ?? []),
        [activeTerm],
    )
    const calendarMonths = useMemo(
        () => activeTerm
            ? getMonthsInRange(activeTerm.startDate, activeTerm.endDate)
            : [],
        [activeTerm],
    )
    const hasCalendarData = activeTerm !== undefined
    const selectedDateEvents = selectedDate
        ? events.filter(
            (event) =>
                !selectedDate.isBefore(event.startDate, 'day') &&
                !selectedDate.isAfter(event.endDate, 'day'),
        )
        : []

    return (
        <div className="student-page academic-calendar-page">
            <div className="page-title-section academic-calendar-title">
                <div>
                    <h1>ปฏิทินการศึกษา</h1>
                    <p>กำหนดการศึกษาแยกตามปีการศึกษา ภาคการศึกษา และประเภทหลักสูตร</p>
                </div>
                <div className="academic-calendar-title-actions">
                    <Typography.Text type="secondary">
                        <ClockCircleOutlined /> วันที่ Sync ล่าสุด:{' '}
                        {lastSyncedAt
                            ? formatThaiDateTime(lastSyncedAt)
                            : '-'}
                    </Typography.Text>
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={() => navigate('/sync')}
                    >
                        ไปหน้า Sync ข้อมูล
                    </Button>
                </div>
            </div>

            {loadError && (
                <Alert
                    type="error"
                    showIcon
                    message={loadError}
                    action={
                        <Button
                            size="small"
                            onClick={() => void loadCalendar(academicYear)}
                        >
                            ลองใหม่
                        </Button>
                    }
                    style={{ marginBottom: 16 }}
                />
            )}

            <Spin spinning={loading}>
            <Card className="academic-calendar-toolbar-card">
                <div className="academic-calendar-toolbar">
                    <div className="academic-calendar-year-control">
                        <Typography.Text className="academic-calendar-label">
                            ปีการศึกษา
                        </Typography.Text>
                        <Segmented
                            value={academicYear}
                            options={ACADEMIC_YEAR_OPTIONS}
                            disabled={loading}
                            aria-label="เลือกปีการศึกษา"
                            onChange={(year) => {
                                setSelectedDate(null)
                                void loadCalendar(Number(year))
                            }}
                        />
                    </div>
                    <div className="academic-calendar-curriculum-control">
                        <Typography.Text className="academic-calendar-label">
                            ประเภทหลักสูตร
                        </Typography.Text>
                        <Segmented
                            value={curriculum}
                            disabled={loading || curriculumOptions.length === 0}
                            options={curriculumOptions}
                            onChange={(value) => {
                                setCurriculum(value as CurriculumType)
                                setSelectedDate(null)
                            }}
                        />
                    </div>
                    <div className="academic-calendar-term-control">
                        <Typography.Text className="academic-calendar-label">
                            ภาคการศึกษา
                        </Typography.Text>
                        <Segmented
                            value={selectedTerm}
                            disabled={loading || availableTerms.length === 0}
                            options={availableTerms.map((term) => ({
                                value: term.code,
                                label: term.nameTh,
                            }))}
                            onChange={(value) => {
                                setSelectedTerm(value as AcademicTerm)
                                setSelectedDate(null)
                            }}
                        />
                    </div>
                </div>
            </Card>

            {!hasCalendarData ? (
                <section
                    className="academic-calendar-content academic-calendar-empty"
                    aria-live="polite"
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="academic-calendar-empty-description">
                                <strong>ไม่มีปฏิทินการศึกษาในปีที่เลือก</strong>
                                <span>
                                    กรุณา Sync ข้อมูลจากระบบกลางก่อนใช้งาน
                                </span>
                            </div>
                        }
                    >
                        <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={() => navigate('/sync')}
                        >
                            ไปหน้า Sync ข้อมูล
                        </Button>
                    </Empty>
                </section>
            ) : (
                <section className="academic-calendar-content" aria-live="polite">
                    <div className="academic-calendar-section-heading">
                        <div>
                            <h2>
                                {activeTerm.nameTh} ปีการศึกษา{' '}
                                {academicYear === undefined
                                    ? '-'
                                    : toBuddhistYear(academicYear)}
                            </h2>
                            <p>
                                {activeTerm.curriculumNameTh} ·{' '}
                                {formatDateRange(
                                    dayjs(activeTerm.startDate),
                                    dayjs(activeTerm.endDate),
                                )}
                            </p>
                        </div>
                        <div
                            className="academic-calendar-legends"
                            aria-label="คำอธิบายสี"
                        >
                            {Object.entries(ACADEMIC_EVENT_DISPLAY).map(
                                ([type, display]) => (
                                    <span key={type}>
                                        <i className={display.className} />
                                        {display.label}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="academic-calendar-layout">
                        <div className="academic-calendar-months">
                            {calendarMonths.map((monthDate) => (
                                <MonthCalendar
                                    key={monthDate.format('YYYY-MM')}
                                    monthDate={monthDate}
                                    events={events}
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                />
                            ))}
                        </div>

                        <Card
                            className="academic-schedule-card"
                            title={
                                <span>
                                    <CalendarOutlined /> กำหนดการสำคัญ
                                </span>
                            }
                            extra={<Tag>{events.length} รายการ</Tag>}
                        >
                            {events.length > 0 ? (
                                <div className="academic-schedule-list">
                                    {events.map((event) => (
                                        <ScheduleEventItem
                                            key={event.id}
                                            event={event}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="ไม่พบกำหนดการในภาคการศึกษานี้"
                                />
                            )}
                        </Card>
                    </div>
                </section>
            )}
            </Spin>

            <Modal
                className="academic-calendar-date-modal"
                open={selectedDate !== null}
                title={selectedDate ? formatFullDate(selectedDate) : undefined}
                footer={null}
                width={720}
                onCancel={() => setSelectedDate(null)}
            >
                <Typography.Text
                    type="secondary"
                    className="academic-calendar-date-summary"
                >
                    {selectedDateEvents.length > 0
                        ? `พบ ${selectedDateEvents.length} กำหนดการในวันนี้`
                        : 'ไม่มีกำหนดการในวันนี้'}
                </Typography.Text>
                {selectedDateEvents.length > 0 ? (
                    <div className="academic-schedule-list">
                        {selectedDateEvents.map((event) => (
                            <ScheduleEventItem key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ไม่พบกิจกรรมหรือวันสำคัญ"
                    />
                )}
            </Modal>
        </div>
    )
}
