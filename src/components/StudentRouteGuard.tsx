import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

type StudentGroup = 'advisor' | 'department' | 'faculty'
type StudentStatus = 'graduated'

const ALLOWED_ROLES_BY_GROUP: Record<StudentGroup, string[]> = {
    advisor: ['teacher'],
    department: ['teacher', 'admin'],
    faculty: ['teacher', 'admin'],
}

const VALID_GROUPS: StudentGroup[] = ['advisor', 'department', 'faculty']
const VALID_STATUSES: StudentStatus[] = ['graduated']

export default function StudentRouteGuard({
    children,
}: {
    children: React.ReactElement
}) {
    const { studentGroup, studentStatus } = useParams()

    if (!VALID_GROUPS.includes(studentGroup as StudentGroup)) {
        return <Navigate to="/" replace />
    }

    if (
        studentStatus &&
        !VALID_STATUSES.includes(studentStatus as StudentStatus)
    ) {
        return <Navigate to="/" replace />
    }

    const allowedRoles =
        ALLOWED_ROLES_BY_GROUP[studentGroup as StudentGroup]

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            {children}
        </ProtectedRoute>
    )
}
