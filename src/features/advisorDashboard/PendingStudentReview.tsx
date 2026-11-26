import { useRef, useState } from 'react'
import { ArrowLeftOutlined, ArrowRightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select } from 'antd'
import { Link } from 'react-router-dom'
import type { AdvisorHistoryStudent, AdvisorPendingCourse } from '../../types/AdvisorSummary'

type SortField = 'pending_credits' | 'pending_count' | 'gpax'
const unitLabels: Record<string, string> = { credit: 'หน่วยกิต', course: 'วิชา', hour: 'ชั่วโมง', day: 'วัน', week: 'สัปดาห์' }
const sortOptions = [
    { label: 'หน่วยกิตค้าง', value: 'pending_credits' },
    { label: 'จำนวนรายการค้าง', value: 'pending_count' },
    { label: 'GPAX', value: 'gpax' },
]
const number = (value: number) => value.toLocaleString('th-TH')
const quantity = (value: number | null | undefined, unit: string) => value == null ? 'รอข้อมูล' : `${number(value)} ${unit}`
const gpaxOf = (student: AdvisorHistoryStudent, historical: boolean) => historical ? student.gpax : student.current_gpax
const yearOf = (student: AdvisorHistoryStudent, historical: boolean) => historical ? student.term_study_year : student.study_year

function outstandingAmounts(students: AdvisorHistoryStudent[]) {
    const totals = new Map<string, number>()
    for (const student of students) {
        if (!student.pending_courses) {
            if (student.pending_credits != null && student.pending_credits > 0) {
                totals.set('credit', (totals.get('credit') ?? 0) + student.pending_credits)
            }
            continue
        }
        for (const course of student.pending_courses) {
            const unit = course.enrollment_type
            if (unit && Object.hasOwn(unitLabels, unit) && course.credit != null && course.credit > 0) {
                totals.set(unit, (totals.get(unit) ?? 0) + course.credit)
            }
        }
    }
    return [...totals].map(([unit, amount]) => quantity(amount, unitLabels[unit])).join(' · ')
}

function CourseItem({ course, historical }: { course: AdvisorPendingCourse; historical: boolean }) {
    const code = String(course.course_code ?? '').trim()
    const group = !code || code === '-' || code.toUpperCase() === 'FREE' || /x/i.test(code)
    const latestGrade = course.grade_letter?.split(',').map((item) => item.trim()).filter((item) => item && item !== '-').at(-1)
    const unit = unitLabels[course.enrollment_type ?? '']
    const amount = course.credit == null || !unit ? null : quantity(course.credit, unit)
    const showRemaining = group || (!!unit && course.enrollment_type !== 'credit')
    const reason = !unit ? 'ยังประเมินไม่ได้' : showRemaining ? (amount ? `ขาดอีก ${amount}` : 'ยังเรียนไม่ครบตามแผน') : latestGrade ? `ผลการเรียน ${latestGrade}` : 'ยังไม่มีผลการเรียน'
    const meta = [
        code && code !== '-' && code.toUpperCase() !== 'FREE' ? code : null,
        showRemaining ? null : amount,
        course.study_period,
        course.semester_year_be ? `ปีการศึกษา ${course.semester_year_be}` : null,
    ].filter(Boolean).join(' · ')
    return <li>
        <div className="advisor-course-title"><strong>{course.course_name || (group ? 'กลุ่มวิชาตามแผน' : 'ไม่ระบุชื่อวิชา')}</strong></div>
        <div className="advisor-course-meta">{historical ? 'ในภาคที่เลือก: ' : ''}{reason}{group && latestGrade ? ` · ผลการเรียน ${latestGrade}` : ''}</div>
        {meta && <div className="advisor-course-meta">{meta}</div>}
        {historical && course.resolved && course.resolved_term_label && <div className="advisor-course-meta">ผ่านแล้วในปีการศึกษา {course.resolved_term_label}</div>}
    </li>
}

function pendingSummary(student: AdvisorHistoryStudent, historical: boolean) {
    const courses = student.pending_courses
    const count = student.pending_count ?? courses?.length
    if (count == null) return 'ยังไม่มีข้อมูลจำนวนรายการค้าง'
    if (!historical) return `ค้าง ${quantity(count, 'รายการ')}`
    const atTerm = `ภาคที่เลือกค้าง ${quantity(count, 'รายการ')}`
    if (!courses?.length) return atTerm
    const pending = courses.filter((course) => course.resolved === false).length
    const unknown = courses.some((course) => course.resolved == null) || courses.length !== count
    if (unknown && !pending) return `${atTerm} · ข้อมูลล่าสุดยังไม่ครบ`
    if (!pending) return `${atTerm} · ตอนนี้ผ่านครบแล้ว`
    return `${atTerm} · ล่าสุดยังค้าง ${unknown ? 'อย่างน้อย ' : ''}${quantity(pending, 'รายการ')}`
}

function CourseList({ courses, historical }: { courses: AdvisorPendingCourse[]; historical: boolean }) {
    return <ul className="advisor-review-courses">{courses.map((course, index) =>
        <CourseItem key={`${course.course_code}-${index}`} course={course} historical={historical} />)}</ul>
}

function CourseHistory({ courses }: { courses: AdvisorPendingCourse[] }) {
    const pending = courses.filter((course) => course.resolved === false)
    const unknown = courses.filter((course) => course.resolved == null)
    const passed = courses.filter((course) => course.resolved === true)
    return <>
        {pending.length > 0 && <><h4>รายการที่ยังค้าง</h4><CourseList courses={pending} historical /></>}
        {unknown.length > 0 && <><h4>ยังไม่มีข้อมูลสถานะล่าสุด</h4><CourseList courses={unknown} historical /></>}
        {passed.length > 0 && <details className="advisor-course-history">
            <summary>รายการที่ผ่านแล้ว ({number(passed.length)})</summary>
            <CourseList courses={passed} historical />
        </details>}
    </>
}

interface PendingReviewProps {
    students: AdvisorHistoryStudent[]
    termLabel?: string
}

export default function PendingStudentReview({ students, termLabel }: PendingReviewProps) {
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortField>('pending_credits')
    const [reverseOrder, setReverseOrder] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [showMobileDetail, setShowMobileDetail] = useState(false)
    const activeButton = useRef<HTMLButtonElement>(null)
    const backButton = useRef<HTMLButtonElement>(null)
    const query = search.trim().toLocaleLowerCase('th-TH')
    const historical = Boolean(termLabel)
    const rows = students.filter((student) => `${student.student_code} ${student.full_name_th}`.toLocaleLowerCase('th-TH').includes(query))
        .sort((a, b) => {
            const first = sort === 'gpax' ? gpaxOf(a, historical) : a[sort]
            const second = sort === 'gpax' ? gpaxOf(b, historical) : b[sort]
            if (first == null || second == null) return Number(first == null) - Number(second == null)
            const ascending = sort === 'gpax' ? !reverseOrder : reverseOrder
            return ascending ? first - second : second - first
        })
    const selected = rows.find((student) => student.id === selectedId) ?? rows[0]
    const amounts = outstandingAmounts(rows)
    const totalCount = () => {
        const known = rows.filter((student) => student.pending_count != null)
        return known.length ? quantity(known.reduce((sum, student) => sum + (student.pending_count ?? 0), 0), 'รายการ') : 'รอข้อมูล'
    }
    const showStudent = (student: AdvisorHistoryStudent) => {
        setSelectedId(student.id)
        setShowMobileDetail(true)
        requestAnimationFrame(() => {
            if (backButton.current?.offsetParent) backButton.current.focus({ preventScroll: true })
        })
    }
    const backToList = () => {
        setShowMobileDetail(false)
        requestAnimationFrame(() => activeButton.current?.focus({ preventScroll: true }))
    }
    if (!students.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={historical ? 'ไม่มีนิสิตที่เรียนไม่ตามแผนในภาคนี้' : 'ไม่มีนิสิตที่ยังเรียนไม่ตามแผน'} />
    const latestTerm = selected?.latest_grade_term?.term_label
    const selectedAmounts = selected ? outstandingAmounts([selected]) : ''
    const heading = termLabel ?? (latestTerm ? `ข้อมูลถึงปีการศึกษา ${latestTerm}` : 'ยังไม่มีข้อมูลภาคเรียนล่าสุด')
    return <>
        <p className="advisor-review-total" aria-live="polite">
            {query ? 'พบ' : 'ทั้งหมด'} {number(rows.length)} คน
            {rows.length > 0 && <> · {historical ? 'ภาคที่เลือกค้าง' : 'ค้าง'} {totalCount()}{amounts && ` · ${amounts}`}
                {rows.some((row) => row.pending_count == null || row.pending_courses?.some(course => course.credit == null)) && ' (รวมเฉพาะยอดที่มีข้อมูล)'}</>}
        </p>
        <div className="advisor-review" data-mobile-detail={showMobileDetail && !!selected}>
            <section className="advisor-review-list" aria-label="รายชื่อนิสิตไม่ตามแผน">
                <Input allowClear value={search} onChange={(event) => setSearch(event.target.value)}
                    prefix={<SearchOutlined />} placeholder="ค้นหาชื่อหรือรหัสนิสิต" aria-label="ค้นหาชื่อหรือรหัสนิสิต" />
                <div className="advisor-review-sort"><Select<SortField> aria-label="เรียงรายชื่อนิสิตตาม" value={sort}
                    onChange={(field) => { setSort(field); setReverseOrder(false) }} options={sortOptions} />
                    <Button onClick={() => setReverseOrder(!reverseOrder)} aria-label="สลับทิศทางการเรียงรายชื่อ">{(sort === 'gpax') !== reverseOrder ? 'น้อยไปมาก' : 'มากไปน้อย'}</Button>
                </div>
                <ul className="advisor-review-names">{rows.map((student) => {
                    const year = yearOf(student, historical)
                    const studentAmounts = historical ? '' : outstandingAmounts([student])
                    return <li key={student.id}><button type="button" aria-pressed={selected?.id === student.id}
                        ref={selected?.id === student.id ? activeButton : undefined} onClick={() => showStudent(student)}>
                        <strong>{student.full_name_th || student.student_code}</strong>
                        <span>{student.student_code} · {year == null ? 'ไม่ระบุชั้นปี' : `ชั้นปีที่ ${year}`}</span>
                        <span>{pendingSummary(student, historical)}{studentAmounts && ` · ${studentAmounts}`}</span>
                    </button></li>
                })}</ul>
                {!rows.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบนิสิตที่ตรงกับคำค้นหา" />}
            </section>
            {selected && <section key={selected.id} className="advisor-review-detail" aria-label="รายละเอียดวิชาค้าง">
                <Button className="advisor-review-back" ref={backButton} icon={<ArrowLeftOutlined />} onClick={backToList}>กลับไปรายชื่อ</Button>
                <header><h3>{selected.full_name_th || selected.student_code}</h3>
                    <div className="advisor-course-meta">{selected.student_code} · {historical ? 'GPAX ณ สิ้นภาค' : 'GPAX'} {gpaxOf(selected, historical)?.toFixed(2) ?? 'รอข้อมูล'}</div>
                    <div className="advisor-course-meta">{heading}{historical && selectedAmounts && ` · ค้าง ${selectedAmounts}`}</div>
                    <h4>{pendingSummary(selected, historical)}</h4>
                </header>
                {selected.pending_courses?.length ? (historical ? <CourseHistory courses={selected.pending_courses} /> : <CourseList courses={selected.pending_courses} historical={false} />)
                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={selected.pending_courses == null || selected.pending_count !== 0
                        ? 'ยังไม่มีรายละเอียดรายวิชาค้าง' : 'ไม่มีรายการค้างในภาคที่ประเมิน'} />}
                {!!selected.unassessed_courses?.length && <p>ยังประเมินไม่ได้ · {selected.unassessed_courses.map(course => course.course_name || course.course_code || 'ไม่ระบุชื่อวิชา').join(', ')}</p>}
                <Link to={`/students/advisor/detail/${selected.id}`} state={{ from: '/advisor-dashboard' }}>ดูข้อมูลนิสิต <ArrowRightOutlined /></Link>
            </section>}
        </div>
    </>
}
