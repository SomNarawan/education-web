import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type StudentGroup = 'advisor' | 'department' | 'faculty'

const VALID_GROUPS: StudentGroup[] = ['advisor', 'department', 'faculty']

const ALLOWED_ROLES_BY_GROUP: Record<StudentGroup, string[]> = {
    advisor: ['teacher'],
    department: ['admin'],
    faculty: ['admin'],
}

export default function StudentRouteGuard({
    children,
}: {
    children: React.ReactElement
}) {
    const { studentGroup } = useParams()
    const { token, currentRole } = useAuth()

    if (!token) {
        return <Navigate to="/auth/callback" replace />
    }

    if (!VALID_GROUPS.includes(studentGroup as StudentGroup)) {
        return <Navigate to="/" replace />
    }

    const group = studentGroup as StudentGroup
    const allowedRoles = ALLOWED_ROLES_BY_GROUP[group]

    if (!currentRole || !allowedRoles.includes(currentRole)) {
        if (currentRole === 'teacher') {
            return <Navigate to="/students/advisor" replace />
        }

        if (currentRole === 'admin') {
            return <Navigate to="/students/department" replace />
        }

        return <Navigate to="/" replace />
    }

    return children
}