import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { appMode } from '../config/appMode'
import { useAuth } from '../hooks/useAuth'

interface StudentAuthenticatedRouteProps {
    children: ReactElement
}

export default function StudentAuthenticatedRoute({
    children,
}: StudentAuthenticatedRouteProps) {
    const { currentRole, user } = useAuth()

    if (appMode !== 'student') {
        return <Navigate to="/" replace />
    }

    if (
        currentRole !== 'student' ||
        !user ||
        !user.roles.includes('student')
    ) {
        return <Navigate to="/student/mock-login" replace />
    }

    return children
}
