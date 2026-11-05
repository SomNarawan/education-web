import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Card, Empty, Tag, Typography } from 'antd'
import { ACADEMIC_EVENT_DISPLAY } from './academicCalendar.constants'
import {
    formatCalendarDateRange,
    type AcademicCalendarEvent,
} from './academicCalendar.utils'

interface AcademicCalendarEventItemProps {
    event: AcademicCalendarEvent
}

export function AcademicCalendarEventItem({
    event,
}: AcademicCalendarEventItemProps) {
    return (
        <div className="academic-schedule-item">
            <span
                className={`academic-schedule-marker ${ACADEMIC_EVENT_DISPLAY[event.type].className}`}
            />
            <div>
                <strong>{event.title}</strong>
                <span>
                    <ClockCircleOutlined />{' '}
                    {formatCalendarDateRange(event.startDate, event.endDate)}
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

interface AcademicCalendarEventListProps {
    events: AcademicCalendarEvent[]
    emptyDescription: string
}

export function AcademicCalendarEventList({
    events,
    emptyDescription,
}: AcademicCalendarEventListProps) {
    if (events.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={emptyDescription}
            />
        )
    }

    return (
        <div className="academic-schedule-list">
            {events.map((event) => (
                <AcademicCalendarEventItem key={event.id} event={event} />
            ))}
        </div>
    )
}

interface AcademicCalendarScheduleProps {
    events: AcademicCalendarEvent[]
}

export default function AcademicCalendarSchedule({
    events,
}: AcademicCalendarScheduleProps) {
    return (
        <Card
            className="academic-schedule-card"
            title={
                <span>
                    <CalendarOutlined /> กำหนดการสำคัญ
                </span>
            }
            extra={<Tag>{events.length} รายการ</Tag>}
        >
            <AcademicCalendarEventList
                events={events}
                emptyDescription="ไม่พบกำหนดการในภาคการศึกษานี้"
            />
        </Card>
    )
}
