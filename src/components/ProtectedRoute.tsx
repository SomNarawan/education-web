import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { AppRole } from '../types/Auth'

type ProtectedRouteProps = {
    children: React.ReactElement
    allowedRoles: AppRole[]
}

export default function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {
    const { token, currentRole } = useAuth()

    if (!token) {
        return <Navigate to="/" replace />
    }

    if (!currentRole) {
        return <Navigate to="/" replace />
    }

    if (!allowedRoles.includes(currentRole)) {
        return <Navigate to="/" replace />
    }

    return children
}
