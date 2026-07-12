import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SnackbarProvider } from './context/SnackbarContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminsPage } from './pages/AdminsPage'
import { ProfilePage } from './pages/ProfilePage'
import { BotSettingsPage } from './pages/BotSettingsPage'
import { XpSettingsPage } from './pages/XpSettingsPage'
import { StatsPage } from './pages/StatsPage'
import { GuideVideosPage } from './pages/GuideVideosPage'
import { GuideCoursesPage } from './pages/GuideCoursesPage'
import { GuideCourseEditPage } from './pages/GuideCourseEditPage'
import { GuideFilesPage } from './pages/GuideFilesPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SurveysPage } from './pages/SurveysPage'
import { SurveyEditPage } from './pages/SurveyEditPage'
import { SurveyResponsesPage } from './pages/SurveyResponsesPage'

function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="admins" element={<AdminsPage />} />
              <Route path="bot" element={<BotSettingsPage />} />
              <Route path="xp" element={<XpSettingsPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="guides/videos" element={<GuideVideosPage />} />
              <Route path="guides/courses" element={<GuideCoursesPage />} />
              <Route path="guides/courses/new" element={<GuideCourseEditPage />} />
              <Route path="guides/courses/:id/edit" element={<GuideCourseEditPage />} />
              <Route path="guides/files" element={<GuideFilesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="surveys" element={<SurveysPage />} />
              <Route path="surveys/responses" element={<SurveyResponsesPage />} />
              <Route path="surveys/new" element={<SurveyEditPage />} />
              <Route path="surveys/:id/edit" element={<SurveyEditPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  )
}

export default App
