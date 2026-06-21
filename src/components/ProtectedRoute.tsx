import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type ProtectedRouteProps = {
    children: React.ReactElement
    allowedRoles: string[]
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