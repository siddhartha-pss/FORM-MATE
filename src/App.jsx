// client/src/App.jsx — full updated version

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Providers
import { AppProvider }         from './context/AppContext';
import { OnboardingProvider }  from './context/OnboardingContext';

// Existing pages
import HomePage             from './Pages/HomePage';
import FaceScanPage         from './Pages/FaceScanPage';
import FallbackPage         from './Pages/FallbackPage';
import AccountSelectionPage from './Pages/AccountSelectionPage';
import FormSelectionPage    from './Pages/FormSelectionPage';
import FormFillPage         from './Pages/FormFillPage';

// New onboarding pages
import AccountTypePage          from './Pages/onboarding/AccountTypePage';
import DocumentCapturePage      from './Pages/onboarding/DocumentCapturePage';
import ConfirmDetailsPage       from './Pages/onboarding/ConfirmDetailsPage';
import FaceCapturePage          from './Pages/onboarding/FaceCapturePage';
import RegistrationSuccessPage  from './Pages/onboarding/RegistrationSuccessPage';

function App() {
  return (
    <AppProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Existing routes ── */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/face-scan"   element={<FaceScanPage />} />
            <Route path="/fallback"    element={<FallbackPage />} />
            <Route path="/accounts"    element={<AccountSelectionPage />} />
            <Route path="/form-select" element={<FormSelectionPage />} />
            <Route path="/form-fill"   element={<FormFillPage />} />

            {/* ── New user onboarding routes ── */}
            <Route path="/new-user"              element={<AccountTypePage />} />
            <Route path="/new-user/documents" element={<DocumentCapturePage />} />
            <Route path="/new-user/confirm"      element={<ConfirmDetailsPage />} />
            <Route path="/new-user/face-capture" element={<FaceCapturePage />} />
            <Route path="/new-user/success"      element={<RegistrationSuccessPage />} />
          </Routes>
        </BrowserRouter>
      </OnboardingProvider>
    </AppProvider>
  );
}

export default App;