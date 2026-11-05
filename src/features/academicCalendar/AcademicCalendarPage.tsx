import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Empty,
    Modal,
    Segmented,
    Spin,
    Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import type {
    AcademicCurriculumType,
    AcademicTermCode,
} from '../../types/AcademicCalendar'
import { toBuddhistYear } from '../../utils/academicYear'
import { formatThaiDateTime } from '../../utils/dateFormat'
import AcademicCalendarMonth from './AcademicCalendarMonth'
import AcademicCalendarSchedule, {
    AcademicCalendarEventList,
} from './AcademicCalendarSchedule'
import { ACADEMIC_EVENT_DISPLAY } from './academicCalendar.constants'
import {
    formatCalendarDateRange,
    formatCalendarFullDate,
} from './academicCalendar.utils'
import { useAcademicCalendar } from './useAcademicCalendar'

export default function AcademicCalendarPage() {
    const navigate = useNavigate()
    const {
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
    } = useAcademicCalendar()

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
                                options={academicYearOptions}
                                disabled={loading}
                                aria-label="เลือกปีการศึกษา"
                                onChange={(year) => {
                                    selectAcademicYear(Number(year))
                                }}
                            />
                        </div>
                        <div className="academic-calendar-curriculum-control">
                            <Typography.Text className="academic-calendar-label">
                                ประเภทหลักสูตร
                            </Typography.Text>
                            <Segmented
                                value={curriculum}
                                disabled={
                                    loading || curriculumOptions.length === 0
                                }
                                options={curriculumOptions}
                                onChange={(value) => {
                                    selectCurriculum(
                                        value as AcademicCurriculumType,
                                    )
                                }}
                            />
                        </div>
                        <div className="academic-calendar-term-control">
                            <Typography.Text className="academic-calendar-label">
                                ภาคการศึกษา
                            </Typography.Text>
                            <Segmented
                                value={selectedTerm}
                                disabled={
                                    loading || availableTerms.length === 0
                                }
                                options={availableTerms.map((term) => ({
                                    value: term.code,
                                    label: term.nameTh,
                                }))}
                                onChange={(value) => {
                                    selectTerm(value as AcademicTermCode)
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {!activeTerm ? (
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
                    <section
                        className="academic-calendar-content"
                        aria-live="polite"
                    >
                        <div className="academic-calendar-section-heading">
                            <div>
                                <h2>
                                    {activeTerm.nameTh} ปีการศึกษา{' '}
                                    {toBuddhistYear(academicYear)}
                                </h2>
                                <p>
                                    {activeTerm.curriculumNameTh} ·{' '}
                                    {formatCalendarDateRange(
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
                                    <AcademicCalendarMonth
                                        key={monthDate.format('YYYY-MM')}
                                        monthDate={monthDate}
                                        events={events}
                                        selectedDate={selectedDate}
                                        onSelectDate={setSelectedDate}
                                    />
                                ))}
                            </div>

                            <AcademicCalendarSchedule events={events} />
                        </div>
                    </section>
                )}
            </Spin>

            <Modal
                className="academic-calendar-date-modal"
                open={selectedDate !== null}
                title={selectedDate
                    ? formatCalendarFullDate(selectedDate)
                    : undefined}
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
                <AcademicCalendarEventList
                    events={selectedDateEvents}
                    emptyDescription="ไม่พบกิจกรรมหรือวันสำคัญ"
                />
            </Modal>
        </div>
    )
}
