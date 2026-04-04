---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: complete
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
---

# RollPlan - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for RollPlan, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Visitors can register with email and password
FR2: Registered users can log in and receive an authenticated session
FR3: Authenticated users can log out
FR4: Authenticated users can view and edit their profile
FR5: Authenticated users can create a trip with a name, description, and optional cover image
FR6: Authenticated users can view a list of their trips
FR7: Authenticated users can edit trip details (name, description, dates)
FR8: Authenticated users can delete a trip (with confirmation)
FR9: Authenticated users can set a trip status (Planning, Active, Completed, Archived)
FR10: Authenticated users can add a step to a trip with a name, type, location, date, and time
FR11: Authenticated users can search and select a step location via place autocomplete
FR12: Authenticated users can assign a step type (Travel, Accommodation, Activity, Meal, Rest)
FR13: Authenticated users can edit step details
FR14: Authenticated users can delete a step (with confirmation)
FR15: Authenticated users can reorder steps within a trip
FR16: Authenticated users can view all trip steps as pins on a map
FR17: Authenticated users can view a route line connecting steps in order
FR18: Authenticated users can tap/click a map pin to open step details
FR19: Authenticated users can toggle between map view and list view
FR20: Authenticated users can add a text note to a step
FR21: Authenticated users can edit or remove a note from a step
FR22: Authenticated users can upload one or more photos to a step
FR23: Authenticated users can capture a photo directly from their device camera
FR24: Authenticated users can delete a photo from a step
FR25: Authenticated users can view all photos attached to a step
FR26: Authenticated users can generate a shareable invite link for a trip
FR27: Authenticated users can revoke and regenerate a trip's share link
FR28: Anyone with a valid share link can view a trip's itinerary, map, and Moment Cards without an account
FR29: The shared trip view is read-only
FR30: All core flows are fully usable on mobile devices at 375px+
FR31: Users can access the device camera from within the app to capture and attach photos

### NonFunctional Requirements

NFR1: Initial page load < 3 seconds on standard broadband
NFR2: Map renders all step pins within 2 seconds of opening trip view
NFR3: Photo upload shows progress indicator for files > 1MB
NFR4: API responses for trip/step CRUD complete within 1 second under normal load
NFR5: All API endpoints require JWT auth except registration, login, and share-link trip view
NFR6: Passwords hashed via .NET Identity (bcrypt)
NFR7: All data transmitted over HTTPS
NFR8: Share tokens use GUID (128-bit minimum entropy)
NFR9: Photo uploads validated server-side (file type + 10MB size limit)
NFR10: CORS restricted to known Angular origin(s)
NFR11: Stateless API — no in-memory session state
NFR12: Semantic HTML on all core flows
NFR13: Keyboard-navigable forms
NFR14: Google Places API graceful degradation to manual text input
NFR15: Map provider graceful fallback to list view if map fails to load
NFR16: Photo storage configurable between local disk (dev) and Azure Blob Storage (prod)

### Additional Requirements

- Monorepo structure: `rollplan-api/` (.NET 8) + `rollplan-client/` (Angular 17+)
- Angular initialized with `--standalone --routing --style=scss` + Tailwind CSS
- .NET initialized with `--use-controllers` + EF Core + Npgsql + JWT Bearer + Azure.Storage.Blobs
- PostgreSQL database with `UseSnakeCaseNamingConvention()`
- All entities use Guid as primary key
- EF Core Code-First migrations
- `IStorageService` abstraction for local disk (dev) / Azure Blob (prod)
- Global `ErrorHandlingMiddleware` → RFC 7807 ProblemDetails on all errors
- Angular HTTP interceptors: auth (JWT attachment) + error (401 redirect, toast)
- Feature-folder structure in Angular: `auth/`, `trips/`, `steps/`, `map/`, `share/`, `shared/`, `core/`
- Note stored as nullable string column on Step entity (not separate table)
- Photos served via direct Azure Blob URL (no API proxy)
- GitHub Actions CI/CD pipelines for both projects
- Serilog logging: console (dev), file (prod)

### UX Design Requirements

N/A — no UX design document provided.

### FR Coverage Map

FR1: Epic 1 — Register with email and password
FR2: Epic 1 — Log in and receive authenticated session
FR3: Epic 1 — Log out
FR4: Epic 1 — View and edit profile
FR5: Epic 2 — Create trip
FR6: Epic 2 — View trip list
FR7: Epic 2 — Edit trip details
FR8: Epic 2 — Delete trip
FR9: Epic 2 — Set trip status
FR10: Epic 3 — Add step to trip
FR11: Epic 3 — Search location via place autocomplete
FR12: Epic 3 — Assign step type
FR13: Epic 3 — Edit step details
FR14: Epic 3 — Delete step
FR15: Epic 3 — Reorder steps
FR16: Epic 4 — View steps as map pins
FR17: Epic 4 — View route line connecting steps
FR18: Epic 4 — Tap/click pin to open step details
FR19: Epic 4 — Toggle map/list view
FR20: Epic 5 — Add note to step
FR21: Epic 5 — Edit/remove note
FR22: Epic 5 — Upload photos to step
FR23: Epic 5 — Capture photo from camera
FR24: Epic 5 — Delete photo
FR25: Epic 5 — View photos on step
FR26: Epic 6 — Generate shareable invite link
FR27: Epic 6 — Revoke/regenerate share link
FR28: Epic 6 — View trip via share link (no account)
FR29: Epic 6 — Share view is read-only
FR30: Cross-cutting — Mobile responsive (all epics)
FR31: Cross-cutting — Camera access on mobile (Epic 5)

## Epic List

### Epic 1: Project Foundation & Authentication
Users can register, log in, and access the app securely. Both projects are initialized, configured, and connected end-to-end.
**FRs covered:** FR1, FR2, FR3, FR4
**Architecture:** Monorepo setup, Angular + Tailwind init, .NET + EF Core + PostgreSQL, JWT Bearer, HTTP interceptors, global error handling, CI/CD

### Epic 2: Trip Management
Users can create, view, edit, delete, and organize their trips with status tracking.
**FRs covered:** FR5, FR6, FR7, FR8, FR9

### Epic 3: Itinerary & Step Management
Users can build a complete step-by-step itinerary with typed stops, location search via autocomplete, and step reordering.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15

### Epic 4: Map Visualization
Users can see their full trip on an interactive map with pins and route lines, toggling between map and list views.
**FRs covered:** FR16, FR17, FR18, FR19

### Epic 5: Moment Cards (Notes & Photos)
Users can capture notes and photos per step, building a travel memory alongside their itinerary.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25

### Epic 6: Trip Sharing
Users can share their trip with family via an invite link — no account required to view.
**FRs covered:** FR26, FR27, FR28, FR29

## Epic 1: Project Foundation & Authentication

Users can register, log in, log out, and manage their profile. Both projects are initialized, connected, and infrastructure is in place.

### Story 1.1: Initialize Monorepo and Project Scaffolding

As a **developer**,
I want both the Angular and .NET projects initialized with all dependencies configured,
So that the team has a working foundation to build features on.

**Acceptance Criteria:**

**Given** an empty repository
**When** setup is complete
**Then** `rollplan-client/` contains an Angular 17+ standalone app with Tailwind CSS configured and `ng serve` runs without errors
**And** `rollplan-api/` contains a .NET 8 Web API with `dotnet run` running without errors
**And** both projects are in a single monorepo with a root `.gitignore` and `README.md`
**And** GitHub Actions CI workflows exist for both projects (build + test on push)
**And** `appsettings.Development.json` is git-ignored

### Story 1.2: Configure Backend Data Layer

As a **developer**,
I want EF Core connected to PostgreSQL with the base `AppDbContext` configured,
So that subsequent stories can define and migrate entity schemas.

**Acceptance Criteria:**

**Given** the .NET project is initialized
**When** `dotnet ef migrations add Initial` is run
**Then** a migration is created successfully and applies to a local PostgreSQL instance
**And** `UseSnakeCaseNamingConvention()` is active on the DbContext
**And** `IStorageService` abstraction exists with `LocalStorageService` (dev) and `AzureBlobStorageService` (prod) implementations
**And** `ErrorHandlingMiddleware` returns RFC 7807 ProblemDetails for unhandled exceptions

### Story 1.3: User Registration

As a **visitor**,
I want to register with my email and password,
So that I can access the app.

**Acceptance Criteria:**

**Given** a visitor on the registration page
**When** they submit a valid email and password (min 6 chars)
**Then** a new user is created and a JWT token is returned
**And** the Angular client stores the token in `localStorage` and navigates to `/trips`
**And** duplicate email returns a 400 with a clear error message
**And** invalid input shows inline form validation errors

### Story 1.4: User Login and Logout

As a **registered user**,
I want to log in with my email and password and log out when done,
So that my trips are securely accessible only to me.

**Acceptance Criteria:**

**Given** a registered user on the login page
**When** they submit valid credentials
**Then** a JWT token is returned, stored in `localStorage`, and the user is navigated to `/trips`
**And** invalid credentials return a 401 with a clear error message
**And** the Angular auth guard redirects unauthenticated users to `/login`
**And** logging out clears the token from `localStorage` and redirects to `/login`
**And** the JWT HTTP interceptor attaches the token to all authenticated requests

### Story 1.5: User Profile View and Edit

As an **authenticated user**,
I want to view and edit my profile (display name, email),
So that my account information is up to date.

**Acceptance Criteria:**

**Given** an authenticated user on the profile page
**When** they view their profile
**Then** their current display name and email are shown
**And** they can update their display name and save successfully
**And** attempting to change to an already-used email returns a 400 with a clear error
**And** the profile page is accessible from the main navigation

## Epic 2: Trip Management

Users can create, view, edit, delete, and organize their trips with status tracking.

### Story 2.1: Create Trip

As an **authenticated user**,
I want to create a new trip with a name, description, and optional cover image,
So that I can start planning my itinerary.

**Acceptance Criteria:**

**Given** an authenticated user on the trips page
**When** they submit the create trip form with a name and description
**Then** a new trip is created and they are navigated to the trip detail page
**And** an optional cover image can be uploaded (JPG/PNG, max 10MB)
**And** the trip is assigned a default status of "Planning"
**And** missing required fields show inline validation errors

### Story 2.2: View Trip List

As an **authenticated user**,
I want to see a list of all my trips,
So that I can quickly access and manage each one.

**Acceptance Criteria:**

**Given** an authenticated user on the trips page
**When** the page loads
**Then** all trips owned by the user are displayed with name, status, and cover image (if set)
**And** trips are ordered by most recently updated
**And** an empty state is shown when no trips exist
**And** each trip card links to the trip detail page

### Story 2.3: Edit Trip Details

As an **authenticated user**,
I want to edit a trip's name, description, and dates,
So that my trip information stays accurate.

**Acceptance Criteria:**

**Given** an authenticated user viewing a trip
**When** they submit the edit trip form
**Then** the trip is updated with the new values
**And** both start date and end date are optional
**And** invalid input shows inline validation errors
**And** the updated values are immediately reflected in the UI

### Story 2.4: Set Trip Status

As an **authenticated user**,
I want to set my trip's status (Planning, Active, Completed, Archived),
So that I can track where the trip is in its lifecycle.

**Acceptance Criteria:**

**Given** an authenticated user viewing a trip
**When** they change the trip status
**Then** the status is updated and reflected immediately in the UI
**And** all four statuses are available: Planning, Active, Completed, Archived
**And** the current status is visually indicated on the trip card and detail page

### Story 2.5: Delete Trip

As an **authenticated user**,
I want to delete a trip after confirming,
So that I can remove trips I no longer need.

**Acceptance Criteria:**

**Given** an authenticated user viewing a trip
**When** they trigger delete and confirm the confirmation dialog
**Then** the trip and all its steps, photos, and data are permanently deleted
**And** they are redirected to the trip list page
**And** cancelling the confirmation dialog does nothing
**And** the confirmation dialog clearly states the action is permanent

## Epic 3: Itinerary & Step Management

Users can build a complete step-by-step itinerary with typed stops, location search, and step reordering.

### Story 3.1: Add Step to Trip

As an **authenticated user**,
I want to add a step to a trip with a name, type, location, date, and time,
So that I can build a complete itinerary.

**Acceptance Criteria:**

**Given** an authenticated user on the trip detail page
**When** they submit the add step form with required fields
**Then** a new step is created and appended to the trip's step list
**And** step type must be one of: Travel, Accommodation, Activity, Meal, Rest
**And** location, date, and time are optional
**And** the step name is required
**And** invalid input shows inline validation errors

### Story 3.2: Search Step Location via Autocomplete

As an **authenticated user**,
I want to search for a step location using place autocomplete,
So that I can quickly find and attach accurate location data to a step.

**Acceptance Criteria:**

**Given** an authenticated user adding or editing a step
**When** they type in the location field
**Then** Google Places autocomplete suggestions appear
**And** selecting a suggestion populates the location name and lat/lng coordinates
**And** if Google Places is unavailable, a plain text input is shown as fallback (NFR14)
**And** coordinates are stored with the step for use in map rendering

### Story 3.3: Edit Step Details

As an **authenticated user**,
I want to edit any step's details,
So that I can keep the itinerary up to date.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step
**When** they submit the edit step form
**Then** the step is updated with the new values
**And** all fields (name, type, location, date, time) are editable
**And** the updated values are immediately reflected in the UI

### Story 3.4: Delete Step

As an **authenticated user**,
I want to delete a step after confirming,
So that I can remove unwanted items from my itinerary.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step
**When** they trigger delete and confirm the confirmation dialog
**Then** the step and its associated note and photos are permanently deleted
**And** the remaining steps retain their correct order
**And** cancelling the confirmation dialog does nothing

### Story 3.5: Reorder Steps

As an **authenticated user**,
I want to reorder steps within a trip,
So that my itinerary reflects the correct sequence of events.

**Acceptance Criteria:**

**Given** an authenticated user viewing the step list for a trip
**When** they drag and drop a step to a new position
**Then** the step order is updated and persisted immediately
**And** the map route (if visible) updates to reflect the new order
**And** the new order persists on page refresh

## Epic 4: Map Visualization

Users can see their full trip on an interactive map with pins and route lines, toggling between map and list views.

### Story 4.1: View Steps as Map Pins

As an **authenticated user**,
I want to see all trip steps displayed as pins on an interactive map,
So that I can visualize the geography of my trip.

**Acceptance Criteria:**

**Given** an authenticated user on the trip detail page
**When** the map view is active
**Then** all steps with location coordinates are shown as pins on the map
**And** the map fits its bounds to include all pins
**And** steps without coordinates are excluded from the map (still visible in list)
**And** the map renders all pins within 2 seconds of opening (NFR2)
**And** if the map fails to load, the list view is shown as fallback (NFR15)

### Story 4.2: View Route Line Connecting Steps

As an **authenticated user**,
I want to see a route line connecting all steps in order on the map,
So that I can see the path of my trip at a glance.

**Acceptance Criteria:**

**Given** an authenticated user on the map view with 2+ steps with coordinates
**When** the map renders
**Then** a polyline connects all steps in their itinerary order
**And** the route updates automatically when steps are reordered or edited

### Story 4.3: Tap Pin to Open Step Details

As an **authenticated user**,
I want to tap or click a map pin to see step details,
So that I can quickly access step information from the map.

**Acceptance Criteria:**

**Given** an authenticated user on the map view
**When** they tap or click a map pin
**Then** a popup or side panel opens showing the step's name, type, date, and time
**And** the popup includes a link to the full step detail view
**And** tapping elsewhere closes the popup

### Story 4.4: Toggle Between Map and List View

As an **authenticated user**,
I want to toggle between the map view and the step list view,
So that I can choose the most useful way to review my trip.

**Acceptance Criteria:**

**Given** an authenticated user on the trip detail page
**When** they tap the toggle control
**Then** the view switches between map and list
**And** the toggle state is visually clear (which view is active)
**And** the last selected view persists during the session

## Epic 5: Moment Cards (Notes & Photos)

Users can capture notes and photos per step, building a travel memory alongside their itinerary.

### Story 5.1: Add, Edit, and Remove Note on a Step

As an **authenticated user**,
I want to add, edit, or remove a text note on a step,
So that I can capture context and memories for each stop.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step detail
**When** they save a note
**Then** the note text is stored and displayed on the step
**And** an existing note can be edited and saved
**And** a note can be removed, leaving the step with no note
**And** the note is plain text (no rich formatting)

### Story 5.2: Upload Photos to a Step

As an **authenticated user**,
I want to upload one or more photos to a step,
So that I can attach visual memories to each stop.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step detail
**When** they select one or more photos to upload
**Then** each photo is uploaded and displayed in the step's photo gallery
**And** accepted formats are JPG, PNG, HEIC; max 10MB per file (NFR9)
**And** files exceeding the size limit show a clear error message
**And** a progress indicator is shown for files over 1MB (NFR3)
**And** multiple photos can be uploaded in a single selection

### Story 5.3: Capture Photo from Device Camera

As an **authenticated user**,
I want to open my device camera directly from the app to capture and attach a photo,
So that I can quickly add in-the-moment photos without leaving the app.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step detail on a mobile device
**When** they tap "Take Photo"
**Then** the device camera opens
**And** after capturing, the photo is immediately uploaded to the step
**And** the captured photo appears in the step's photo gallery
**And** this uses the HTML `capture` attribute on a file input (FR31)

### Story 5.4: View and Delete Photos on a Step

As an **authenticated user**,
I want to view all photos attached to a step and delete any I don't want,
So that I can manage the visual memory for each stop.

**Acceptance Criteria:**

**Given** an authenticated user viewing a step detail with photos
**When** they view the photo gallery
**Then** all photos are displayed in a grid or scrollable list
**And** tapping a photo opens a larger preview
**And** they can delete a photo after confirming
**And** the photo is removed from storage and the gallery immediately

## Epic 6: Trip Sharing

Users can share their trip with family via an invite link — no account required to view.

### Story 6.1: Generate and Manage Share Link

As an **authenticated user**,
I want to generate a shareable invite link for my trip and be able to revoke it,
So that I can share my trip with family without requiring them to register.

**Acceptance Criteria:**

**Given** an authenticated user on the trip detail page
**When** they generate a share link
**Then** a unique GUID-based URL is created and displayed for copying
**And** the link is immediately active and shareable
**And** they can revoke the current link and generate a new one
**And** after revocation, the old link returns a 404 for any viewer
**And** share tokens use GUID (128-bit minimum entropy) (NFR8)

### Story 6.2: Public Share View (No Account Required)

As a **family member with a share link**,
I want to view the full trip itinerary, map, and Moment Cards without registering,
So that I can see the trip details without needing an account.

**Acceptance Criteria:**

**Given** anyone with a valid share link
**When** they open the link
**Then** the trip's steps, map, notes, and photos are displayed in read-only mode
**And** no login or registration is required
**And** no edit or delete controls are shown
**And** an invalid or revoked token returns a clear "trip not found" message
**And** the share view is fully usable on mobile at 375px+ (FR30)
