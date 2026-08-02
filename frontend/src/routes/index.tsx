import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { ActivitiesPage } from '../pages/admin/ActivitiesPage'
import { ActivityGroupDetailPage } from '../pages/admin/ActivityGroupDetailPage'
import { ActivityGroupsPage } from '../pages/admin/ActivityGroupsPage'
import { ActivityPricingPage } from '../pages/admin/ActivityPricingPage'
import { ClothingOrderDetailPage } from '../pages/admin/ClothingOrderDetailPage'
import { ClothingOrdersPage } from '../pages/admin/ClothingOrdersPage'
import { ClothingPricingPage } from '../pages/admin/ClothingPricingPage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { KibbutzExportPage } from '../pages/admin/KibbutzExportPage'
import { PaymentDetailPage } from '../pages/admin/PaymentDetailPage'
import { PaymentsPage } from '../pages/admin/PaymentsPage'
import { RegistrationDetailPage } from '../pages/admin/RegistrationDetailPage'
import { RegistrationsPage } from '../pages/admin/RegistrationsPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { SeasonsPage } from '../pages/admin/SeasonsPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicHomePage } from '../pages/PublicHomePage'
import { ClothingOrderPage } from '../pages/public/ClothingOrderPage'
import { FootballRegistrationPage } from '../pages/public/FootballRegistrationPage'
import { HealthDeclarationPage } from '../pages/public/HealthDeclarationPage'
import { SwimmingRegistrationPage } from '../pages/public/SwimmingRegistrationPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicHomePage />} />
          <Route path="register/football" element={<FootballRegistrationPage />} />
          <Route path="register/swimming" element={<SwimmingRegistrationPage />} />
          <Route path="register/clothing" element={<ClothingOrderPage />} />
          <Route
            path="register/health-declaration"
            element={<HealthDeclarationPage />}
          />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="activity-pricing" element={<ActivityPricingPage />} />
            <Route path="clothing-pricing" element={<ClothingPricingPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="registrations/:id" element={<RegistrationDetailPage />} />
            <Route path="clothing-orders" element={<ClothingOrdersPage />} />
            <Route path="clothing-orders/:id" element={<ClothingOrderDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payments/:id" element={<PaymentDetailPage />} />
            <Route path="activity-groups" element={<ActivityGroupsPage />} />
            <Route path="activity-groups/:id" element={<ActivityGroupDetailPage />} />
            <Route path="exports/kibbutz" element={<KibbutzExportPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
