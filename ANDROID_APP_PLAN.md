# RideLog Pro Android App Requirements & Design Prompt

## Overview

This repository currently contains a React/PWA implementation of RideLog Pro. The goal is to generate a native Android APK design and implementation prompt for another AI agent, using the existing web app as the source of truth.

The Android app should be a dark, offline-first ride and fuel companion for scooter and motorcycle owners, with a strong AMOLED-friendly visual style, numeric analytics, and simple data entry.

## Goal

Produce an Android application specification and design prompt that can be passed to an AI developer or code generation system. The prompt should describe:

- the required screens and navigation flow
- the data model and persistence layers
- the UI theme and color palette
- the high-level project structure
- the existing PWA source materials that inform the design

## Current Web App Context

Source repository details:

- Folder: `drive-companion-x`
- Stack: React 19 + Vite + Tailwind CSS + TanStack React Router + TanStack React Query
- App type: Progressive Web App / offline-first ride & fuel companion
- Key routes: `index`, `trips`, `fuel`, `insights`, `settings`
- Root shell: `src/routes/__root.tsx`
- App UI shell: `src/components/ridelog/AppShell.tsx`
- Core data model and logic: `src/lib/ridelog.ts`
- Theme and color tokens: `src/styles.css`
- Web app manifest: `public/manifest.webmanifest`

## Requirements

### Functional Requirements

1. Onboarding / Setup
   - Collect vehicle name
   - Collect current odometer reading
   - Collect tank capacity (liters)
   - Collect expected mileage (km/L)
   - Collect monthly fuel budget
   - Show progress stepper and validate inputs

2. Dashboard
   - Display total distance (odometer)
   - Display estimated fuel remaining and tank status
   - Display estimated range in km
   - Display today’s distance traveled
   - Display average mileage
   - Display current month fuel spend and remaining budget
   - Display a smart insight message derived from data

3. Trips
   - Support trip logging modes: Manual, GPS, Auto
   - Provide trip entry inputs for each mode
   - Show recent rides list directly on the screen
   - Support editing and deleting trips

4. Fuel Tracking
   - Record fuel fills with liters, price per liter, total cost, and odometer
   - Show fuel history list
   - Use fuel data to derive mileage and remaining range

5. Insights
   - Show mileage trends and fuel consumption summaries
   - Provide range projections and monthly usage insights
   - Present summary cards for quick comprehension

6. Settings
   - Support app preferences
   - Support backup/restore or export/import if feasible
   - Support dark theme toggle or theme override
   - Support data reset

7. Offline-first Storage
   - Persist all app data locally on the device
   - No login or remote backend required
   - Use Android-native persistence: `DataStore`, `Room`, or equivalent

### Non-functional Requirements

- Use Jetpack Compose for the Android UI
- Maintain a black AMOLED-friendly theme
- Keep interactions fast and lightweight
- Use numeric-focused typography for stats and charts
- Create a single-app shell with bottom navigation
- Keep UI minimal, with clear cards and prominent metrics

## UX / Screen Layout

### Primary Bottom Navigation

- Dashboard
- Trips
- Fuel
- Insights
- Settings

### Screen Descriptions

#### Dashboard

- Hero metric: odometer total distance
- Fuel tank status with progress bar
- Range estimate
- Today’s ride distance
- Average mileage card
- Monthly spend card
- Smart insight card

#### Trips

- Mode selector with three buttons: Manual, GPS, Auto
- Trip input form for chosen mode
- Recent trip list under the form
- Edit and delete actions on each trip row

#### Fuel

- Fill entry form with liters, price, cost, odometer
- Recent fill history list
- Summary of fuel spend by month

#### Insights

- Visual summary of consumption trends
- Range and mileage projections
- Helpful text insights based on current data

#### Settings

- App theme toggle
- Backup/export functions
- Data reset option
- App metadata and version info

## Data Model

Use the existing PWA data definitions as the Android app model.

### Vehicle

- `name: String`
- `odometer: Int` (km)
- `tankCapacity: Float` (L)
- `expectedMileage: Float` (km/L)
- `monthlyBudget: Float`
- `createdAt: Long`

### FuelEntry

- `id: String`
- `date: Long`
- `liters: Float`
- `pricePerLiter: Float`
- `totalCost: Float`
- `odometer: Int`

### Trip

- `id: String`
- `date: Long`
- `mode: String` (`manual` | `gps` | `auto`)
- `startOdo: Int?`
- `endOdo: Int?`
- `distance: Float`
- `durationSec: Int?`

### Maintenance

- `id: String`
- `type: String`
- `lastDate: Long?`
- `lastOdo: Int?`
- `intervalDays: Int?`
- `intervalKm: Int?`
- `notes: String?`

### AppData

- `vehicle: Vehicle?`
- `fuel: List<FuelEntry>`
- `trips: List<Trip>`
- `maintenance: List<Maintenance>`

## Theme and Design Tokens

Base colors derived from the current web project:

- Background: `#000000`
- Surface: `#0D0D0D`
- Surface elevated: `#151515`
- Primary: `#A9C9FF`
- Success: `#4CAF50`
- Warning: `#FFB300`
- Danger: `#FF5252`
- Foreground: `#FBFBFB`
- Muted foreground: `#9CA3AF`
- Border / input: subtle white opacities

Design details:

- Rounded corners ~28dp
- Soft radial blue glow accent
- Minimal elevated cards and glassy surfaces
- High-contrast text for readability on black backgrounds

### Android Theme Tokens (Compose example)

```kotlin
val BlackBackground = Color(0xFF000000)
val Surface = Color(0xFF0D0D0D)
val SurfaceElevated = Color(0xFF151515)
val Primary = Color(0xFFA9C9FF)
val Success = Color(0xFF4CAF50)
val Warning = Color(0xFFFFB300)
val Danger = Color(0xFFFF5252)
val Foreground = Color(0xFFFBFBFB)
val MutedForeground = Color(0xFF9CA3AF)
```

## Suggested Android Project Structure

```
android/
  app/
    src/
      main/
        AndroidManifest.xml
        java/com/ridelogpro/
          MainActivity.kt
          App.kt
          data/
            AppDataStore.kt
            models/
              AppData.kt
              Vehicle.kt
              FuelEntry.kt
              Trip.kt
              Maintenance.kt
          ui/
            theme/
              Color.kt
              Typography.kt
              Shape.kt
              Theme.kt
            navigation/
              NavGraph.kt
            screens/
              DashboardScreen.kt
              TripsScreen.kt
              FuelScreen.kt
              InsightsScreen.kt
              SettingsScreen.kt
              OnboardingScreen.kt
            components/
              StatCard.kt
              InfoCard.kt
              BottomNavBar.kt
              HeaderBar.kt
              EmptyStateView.kt
        res/
          values/
            colors.xml
            strings.xml
            themes.xml
```

## AI Prompt Instructions

Please turn this specification into a native Android application implementation plan. The output should be structured as a developer-ready prompt with these requirements:

1. Build a Jetpack Compose Android APK project.
2. Use local persistence for app data with `DataStore` or `Room`.
3. Implement onboarding, dashboard, trips, fuel, insights, and settings screens.
4. Use the provided data model and theme tokens.
5. Ensure the app is fully offline-first with no backend login.
6. Preserve the RideLog Pro brand and dark AMOLED styling.

Include a concise project outline, screen behavior, data flow, and the component structure required for a first-pass MVP.

## Acceptance Criteria

- The prompt describes the native Android app as a rewrite of the existing PWA.
- The prompt lists exact screens and features.
- The prompt includes the Android theme palette and UI style.
- The prompt identifies the existing repo artifacts to reuse conceptually.
- The prompt emphasizes offline storage and mobile app delivery as an APK.

## Notes

- Current web app source is a PWA; Android implementation should be native, not a web wrapper.
- The app should feel like RideLog Pro with the same analytics and data entry focus, but optimized for Android.
- Package name recommendation: `com.ridelogpro`.

---

Use this document as the AI prompt for the Android rewrite of RideLog Pro.