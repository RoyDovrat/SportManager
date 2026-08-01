import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { ActivitiesPage } from '../pages/admin/ActivitiesPage'
import { ActivityPricingPage } from '../pages/admin/ActivityPricingPage'
import { ClothingPricingPage } from '../pages/admin/ClothingPricingPage'
import { RegistrationDetailPage } from '../pages/admin/RegistrationDetailPage'
import { RegistrationsPage } from '../pages/admin/RegistrationsPage'
import { SeasonsPage } from '../pages/admin/SeasonsPage'
import { AdminHomePage } from '../pages/AdminHomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicHomePage } from '../pages/PublicHomePage'
import { FootballRegistrationPage } from '../pages/public/FootballRegistrationPage'
import { SwimmingRegistrationPage } from '../pages/public/SwimmingRegistrationPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicHomePage />} />
          <Route path="register/football" element={<FootballRegistrationPage />} />
          <Route path="register/swimming" element={<SwimmingRegistrationPage />} />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="activity-pricing" element={<ActivityPricingPage />} />
            <Route path="clothing-pricing" element={<ClothingPricingPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="registrations/:id" element={<RegistrationDetailPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
