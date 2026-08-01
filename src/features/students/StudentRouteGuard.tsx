import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import {
    ALLOWED_ROLES_BY_STUDENT_GROUP,
    STUDENT_GROUPS,
    STUDENT_STATUSES,
} from '../../types/StudentRoute'
import type { StudentGroup, StudentStatus } from '../../types/StudentRoute'

export default function StudentRouteGuard({
    children,
}: {
    children: React.ReactElement
}) {
    const { studentGroup, studentStatus } = useParams()

    if (!STUDENT_GROUPS.includes(studentGroup as StudentGroup)) {
        return <Navigate to="/" replace />
    }

    if (
        studentStatus &&
        !STUDENT_STATUSES.includes(studentStatus as StudentStatus)
    ) {
        return <Navigate to="/" replace />
    }

    const allowedRoles =
        ALLOWED_ROLES_BY_STUDENT_GROUP[studentGroup as StudentGroup]

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            {children}
        </ProtectedRoute>
    )
}
