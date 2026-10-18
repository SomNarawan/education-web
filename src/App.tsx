import { Suspense, lazy } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './layouts/MainLayout'
import RoleRedirect from './components/RoleRedirect'
import StudentAuthenticatedRoute from './components/StudentAuthenticatedRoute'
import StudentRouteGuard from './features/students/StudentRouteGuard'
import ProtectedRoute from './components/ProtectedRoute'
import { appMode, type AppMode } from './config/appMode'

const StudentList = lazy(
    () => import('./features/students/list/StudentListPage'),
)
const StudentDetail = lazy(
    () => import('./features/students/detail/StudentDetailPage'),
)
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const MockLogin = lazy(() => import('./pages/MockLogin'))
const SyncData = lazy(() => import('./pages/SyncData'))
const SystemMasterDataDetail = lazy(
    () => import('./pages/SystemMasterDataDetail'),
)
const StudentImport = lazy(() => import('./pages/StudentImport'))
const GradeImport = lazy(() => import('./pages/GradeImport'))
const AdvisorAssignment = lazy(
    () => import('./features/advisorAssignments/AdvisorAssignmentPage'),
)
const MasterDataManagement = lazy(
    () => import('./features/masterData/MasterDataManagementPage'),
)
const HighSchoolManagement = lazy(
    () => import('./features/masterData/HighSchoolManagementPage'),
)
const GradeCalculator = lazy(
    () => import('./features/gradeCalculator/GradeCalculatorPage'),
)
const StudentHomePage = lazy(() => import('./pages/student/StudentHomePage'))
const StudentProfilePage = lazy(
    () => import('./pages/student/StudentProfilePage'),
)
const StudentGradesPage = lazy(
    () => import('./pages/student/StudentGradesPage'),
)
const StudentMockLoginPage = lazy(
    () => import('./pages/student/StudentMockLoginPage'),
)

function normalizeBasePath(value?: string): string | undefined {
    if (!value) return undefined

    const trimmed = value.trim()

    if (!trimmed) return undefined

    const withLeadingSlash = trimmed.startsWith('/')
        ? trimmed
        : `/${trimmed}`

    return withLeadingSlash.replace(/\/+$/, '') || undefined
}

const basename = normalizeBasePath(import.meta.env.VITE_BASE_PATH)

function PageLoading() {
    return (
        <div className="page-loading">
            <Spin size="large" />
        </div>
    )
}

interface AppModeRouteProps {
    mode: AppMode
    children: ReactElement
}

function AppModeRoute({ mode, children }: AppModeRouteProps) {
    return appMode === mode ? children : <Navigate to="/" replace />
}

export default function App() {
    return (
        <BrowserRouter basename={basename}>
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route
                        path="/auth/callback"
                        element={<AuthCallback />}
                    />
                    <Route
                        path="/mock-login"
                        element={
                            <AppModeRoute mode="staff">
                                <MockLogin />
                            </AppModeRoute>
                        }
                    />
                    <Route
                        path="/student/mock-login"
                        element={
                            <AppModeRoute mode="student">
                                <StudentMockLoginPage />
                            </AppModeRoute>
                        }
                    />

                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<RoleRedirect />} />

                        <Route
                            path="student/home"
                            element={
                                <StudentAuthenticatedRoute>
                                    <StudentHomePage />
                                </StudentAuthenticatedRoute>
                            }
                        />

                        <Route
                            path="student/profile"
                            element={
                                <StudentAuthenticatedRoute>
                                    <StudentProfilePage />
                                </StudentAuthenticatedRoute>
                            }
                        />

                        <Route
                            path="student/grades"
                            element={
                                <StudentAuthenticatedRoute>
                                    <StudentGradesPage />
                                </StudentAuthenticatedRoute>
                            }
                        />

                        <Route
                            path="student/grade-calculator"
                            element={
                                <StudentAuthenticatedRoute>
                                    <GradeCalculator />
                                </StudentAuthenticatedRoute>
                            }
                        />

                        <Route
                            path="students/:studentGroup"
                            element={
                                <StudentRouteGuard>
                                    <StudentList />
                                </StudentRouteGuard>
                            }
                        />

                        <Route
                            path="students/:studentGroup/:studentStatus"
                            element={
                                <StudentRouteGuard>
                                    <StudentList />
                                </StudentRouteGuard>
                            }
                        />

                        <Route
                            path="students/:studentGroup/detail/:id"
                            element={
                                <StudentRouteGuard>
                                    <StudentDetail />
                                </StudentRouteGuard>
                            }
                        />

                        <Route
                            path="advisor-assignments"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdvisorAssignment />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="student-imports"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <StudentImport />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="grade-imports"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <GradeImport />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="sync"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <SyncData />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="sync/details/:dataType"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <SystemMasterDataDetail />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="grade-calculator"
                            element={
                                <ProtectedRoute
                                    allowedRoles={['teacher', 'admin']}
                                >
                                    <GradeCalculator />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="master-data/high-schools"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <HighSchoolManagement />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="master-data/:masterDataType"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <MasterDataManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
