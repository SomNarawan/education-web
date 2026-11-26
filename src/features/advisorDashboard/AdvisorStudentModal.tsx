import { useState } from 'react'
import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons'
import { Input, Modal, Select, Skeleton, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import type { AdvisorHistoryStudent } from '../../types/AdvisorSummary'

import PendingStudentReview from './PendingStudentReview'

const groupLabels: Record<string, string> = {
    on_plan: 'ตามแผน', off_plan: 'ไม่ตามแผน', retired: 'พ้นสภาพนิสิต', unknown: 'รอข้อมูล',
    studying: 'กำลังศึกษา', graduated: 'จบการศึกษา', other: 'สถานะอื่น',
    range_3_25_4_00: '3.25 – 4.00', range_2_00_3_24: '2.00 – 3.24',
    range_1_75_1_99: '1.75 – 1.99', range_0_00_1_74: '0.00 – 1.74', no_gpax: 'ไม่มีค่า GPAX',
}
const number = (value: number) => value.toLocaleString('th-TH')
const grade = (value: number | null | undefined) => value == null ? '—' : value.toFixed(2)
const group = (student: AdvisorHistoryStudent) => student.plan_status ?? student.range ?? student.status ?? 'unknown'

interface AdvisorStudentModalProps {
    title: string
    students: AdvisorHistoryStudent[] | null
    onClose: () => void
    gradeContext?: 'current' | 'annual' | 'term'
    showPending?: boolean
    pendingTermLabel?: string
    // Show the latest term with grades of each student, and wait for rows that are still loading.
    showLatestTerm?: boolean
    loading?: boolean
}

export default function AdvisorStudentModal({ title, students, loading = false, showPending, pendingTermLabel, onClose, ...roster }: AdvisorStudentModalProps) {
    return <Modal title={title} open={students !== null || loading} onCancel={onClose} footer={null}
        width="min(1240px, calc(100vw - 32px))" destroyOnHidden className="advisor-student-modal">
        {showPending ? (loading ? <div role="status" aria-label="กำลังโหลดรายชื่อ"><Skeleton active /></div>
            : <PendingStudentReview students={students ?? []} termLabel={pendingTermLabel} />)
            : <StudentRoster students={students} loading={loading} {...roster} />}
    </Modal>
}

function StudentRoster({ students, gradeContext = 'current', showLatestTerm = false, loading }: Pick<AdvisorStudentModalProps, 'students' | 'gradeContext' | 'showLatestTerm' | 'loading'>) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const query = search.trim().toLocaleLowerCase('th-TH')
    const rows = (students ?? []).filter((student) => (filter === 'all' || group(student) === filter)
        && (!query || `${student.student_code} ${student.full_name_th}`.toLocaleLowerCase('th-TH').includes(query)))
    const groups = [...new Set((students ?? []).map(group))]
    const isTerm = gradeContext === 'term'
    const yearField = isTerm ? 'term_study_year' : 'study_year'
    const gradeField = isTerm ? 'gpax' : 'current_gpax'
    const columns: ColumnsType<AdvisorHistoryStudent> = [
        { title: 'รหัสนิสิต', dataIndex: 'student_code', width: 145, render: (code: string, row) => <Link to={`/students/advisor/detail/${row.id}`} state={{ from: '/advisor-dashboard' }}>{code}</Link> },
        { title: 'ชื่อ–นามสกุล', dataIndex: 'full_name_th', width: 230, render: (name: string) => <strong className="advisor-student-name">{name || '—'}</strong> },
        { title: isTerm ? 'ชั้นปีในภาคนั้น' : 'ชั้นปี', dataIndex: yearField, width: isTerm ? 125 : 85, align: 'center', render: (year: number | null | undefined) => year == null ? '—' : `ปี ${year}` },
        { title: isTerm ? 'GPAX ณ สิ้นภาค' : 'GPAX', dataIndex: gradeField, width: isTerm ? 140 : 90, align: 'right', render: grade, sorter: (a, b) => (a[gradeField] ?? -1) - (b[gradeField] ?? -1) },
    ]
    if (gradeContext === 'annual') columns.push({ title: 'GPA ปีที่เลือก', dataIndex: 'gpa', width: 125, align: 'right', render: grade })
    if (showLatestTerm) {
        const termRank = (student: AdvisorHistoryStudent) => student.latest_grade_term ? student.latest_grade_term.academic_year * 10 + student.latest_grade_term.semester_order : 0
        const newest = (students ?? []).reduce<AdvisorHistoryStudent | null>((best, student) => best === null || termRank(student) > termRank(best) ? student : best, null)?.latest_grade_term?.term_label
        columns.push({ title: 'ข้อมูลเกรดล่าสุด', key: 'latest_term', width: 150, render: (_, student) => {
            const label = student.latest_grade_term?.term_label
            return label ? <Tag color={label === newest ? 'default' : 'orange'}>{label}</Tag> : 'ไม่มีข้อมูลภาคเรียน'
        } })
    }
    columns.push({ title: isTerm ? 'สถานะในภาคนั้น' : showLatestTerm ? 'สถานะตามแผน' : 'กลุ่ม', key: 'group', width: 155, render: (_, student) => <Tag>{groupLabels[group(student)] ?? group(student)}</Tag> })
    columns.push({ title: '', key: 'detail', width: 160, render: (_, row) => <Link to={`/students/advisor/detail/${row.id}`} state={{ from: '/advisor-dashboard' }}>ดูรายละเอียด <ArrowRightOutlined /></Link> })

    return <>
        <div className="advisor-student-toolbar">
            <Input aria-label="ค้นหานิสิตในตาราง" placeholder="ค้นหารหัสนิสิต หรือชื่อ–นามสกุล" prefix={<SearchOutlined />} allowClear value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
            {groups.length > 1 && <Select aria-label="กรองกลุ่มนิสิต" value={filter} onChange={(value) => { setFilter(value); setPage(1) }} options={[{ label: 'ทุกกลุ่ม', value: 'all' }, ...groups.map((value) => ({ value, label: groupLabels[value] ?? value }))]} />}
            <span>{loading ? 'กำลังโหลดรายชื่อ…' : `แสดง ${number(rows.length)} / ${number(students?.length ?? 0)} คน`}</span>
        </div>
        <Table<AdvisorHistoryStudent> className="advisor-student-table" rowKey="id" dataSource={rows} columns={columns} size="middle" loading={loading}
            locale={{ emptyText: search ? 'ไม่พบนิสิตที่ตรงกับคำค้นหา' : 'ไม่มีนิสิตในกลุ่มนี้' }}
            pagination={{ current: page, onChange: setPage, pageSize: 8, showSizeChanger: false }} scroll={{ x: 1000 }}
        />
        <p className="advisor-footnote">{isTerm ? 'GPAX คือเกรดเฉลี่ยสะสมจนถึงสิ้นภาคเรียนที่เลือก' : gradeContext === 'annual' ? 'ชั้นปีและ GPAX เป็นข้อมูลปัจจุบัน ส่วน GPA คิดเฉพาะปีที่เลือก' : 'ชั้นปีและ GPAX เป็นข้อมูลปัจจุบันของนิสิต'}</p>
    </>
}
