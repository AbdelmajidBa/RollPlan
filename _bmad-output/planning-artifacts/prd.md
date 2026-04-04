---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-04-04-2000.md']
workflowType: 'prd'
classification:
  projectType: web_app
  domain: consumer_travel
  complexity: low-medium
  projectContext: greenfield
---

# Product Requirements Document — RollPlan

**Author:** Abdel
**Date:** 2026-04-04
**Type:** Web Application (Angular SPA + .NET REST API) | Consumer / Travel & Lifestyle | Greenfield

---

## Executive Summary

RollPlan is a family trip planner web application that consolidates trip planning, itinerary management, and travel memory capture into a single experience. Families scatter trip data across messaging apps, documents, and photo galleries — RollPlan replaces that friction with one structured, map-first product.

**Target users:** Families with a designated trip organizer who plans multi-stop trips and shares the itinerary with family members.

**Core loop:** Create a trip → build a step-by-step itinerary with typed stops (travel, accommodation, activity, meal, rest) → visualize the full route on a map → attach notes and photos per stop as Moment Cards → share with family via invite link.

The app serves two modes in one interface: **planning mode** (before the trip) and **capture mode** (during the trip) — same data model, zero context switching.

### What Makes This Special

Most trip tools are planning-only (TripIt, Google Trips) or memory-only (photo albums). RollPlan unifies both in a map-first interface where each itinerary stop is a **Moment Card** — a container for logistics, notes, and photos that persists from planning through to memory.

The invite link model (no account required for viewers) removes the biggest adoption blocker for family sharing.

**One-liner:** *Plan the trip. Live the trip. Remember the trip.*

---

## Success Criteria

### User Success
- Family organizer creates a trip, adds stops, and shares with family in under 10 minutes
- Itinerary is readable and navigable on mobile without degradation
- Notes and photos are added to a stop during travel without friction
- Shared invite link renders correctly for family members without an account

### Business Success
- Personal project — success is a polished, fully functional app used on at least one real family trip
- All MVP features shipped and stable before adding v2 features

### Measurable Outcomes
- All 6 MVP build layers complete and integrated end-to-end
- At least one real family trip planned and captured in the app

---

## Product Scope

### MVP (Phase 1)
Auth → Trip CRUD → Step CRUD + Google Places → Map view (pins + route) → Moment Card (note + photo) → Share via invite link

### Growth (Phase 2)
Step templates, duplicate trip, step type icons on map, on-the-road UX mode, photo gallery per trip

### Vision (Phase 3)
AI step suggestions, budget tracker, weather per stop, offline maps, PDF export, packing list, voice notes per step, family voting, real-time collaboration

---

## User Journeys

### Journey 1: Trip Organizer — Planning Mode (Happy Path)

**Meet Sara.** She's planning a 5-day road trip for her family of four. Her current "plan" lives in a Notes app, two WhatsApp threads, and a screenshot of a Google Maps route she'll inevitably lose.

She opens RollPlan, registers, and creates *"Normandy Summer 2026."* She adds stops one by one — ferry crossing, two hotels, the D-Day beaches, a restaurant. For each stop she picks the type, searches the location with autocomplete, sets the date and time. Within 20 minutes she has a full itinerary.

She taps the map view. For the first time she *sees* the trip — pins connected by a route, the whole journey at once. That's the moment.

She generates a share link and pastes it into the family WhatsApp group. Done.

**Capabilities revealed:** Trip CRUD, Step CRUD + typed categories, Google Places autocomplete, map view with route, invite link generation.

---

### Journey 2: Family Viewer — Invite Link (No Account)

**Meet Marc**, Sara's husband. He taps the WhatsApp link on his phone and sees the full itinerary — stops listed, map rendered, dates clear. No registration. No install. He shows it to the kids on the drive.

When Sara updates a stop, Marc sees it next time he opens the link.

**Capabilities revealed:** Token-based read-only sharing, no-auth trip view, mobile-responsive map + list display.

---

### Journey 3: Organizer On The Road — Capture Mode

**Day 3.** Sara is at a bakery in Bayeux not in the plan but going in the memory. She opens RollPlan, finds the current stop, taps *"add photo,"* shoots it with her camera, adds a note: *"Best croissant of the trip."* Fifteen seconds. Back in her pocket.

That evening she adds an unplanned stop — a viewpoint they stumbled on. The trip is growing in real time.

**Capabilities revealed:** Mobile-first UX, camera capture, photo upload, note entry on mobile, add/edit steps mid-trip.

---

### Journey 4: Organizer — Error Recovery

Sara accidentally deletes a stop. The app confirms destructive actions before executing. She tries to add a stop with no location — the form guides her rather than failing silently.

**Capabilities revealed:** Delete confirmation dialogs, form validation, clear error states.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Trip + Step CRUD | Journey 1 |
| Step types + Google Places | Journey 1 |
| Map view with route lines | Journey 1 |
| Token-based share link | Journey 1 & 2 |
| No-auth read-only view | Journey 2 |
| Mobile-responsive UI | Journey 2 & 3 |
| Camera capture + photo upload | Journey 3 |
| In-trip step editing | Journey 3 |
| Delete confirmation + validation | Journey 4 |

---

## Technical Architecture

### Frontend (Angular)
- Angular 17+ standalone components, Angular Router for client-side navigation
- Angular Material or Tailwind CSS for UI components
- Google Maps JavaScript API (or Leaflet.js) for map rendering
- Google Places Autocomplete for step location input
- Reactive Forms for trip/step creation; HTTP interceptors for JWT token attachment
- Mobile-responsive via CSS Flexbox/Grid, all flows usable at 375px+

### Backend (.NET)
- .NET 8 Web API, Entity Framework Core + SQL Server (or PostgreSQL)
- .NET Identity + JWT authentication (7-day token, no refresh token in v1)
- Azure Blob Storage (local disk in dev) for photo uploads; server-side resize before storage
- Share link: GUID token per trip stored in DB; no auth required to read; owner can revoke by regenerating
- RESTful endpoints, JSON responses; CORS restricted to Angular origin

### Browser Support
- Chrome, Firefox, Safari, Edge — last 2 major versions; no IE

### Environment
- Dev / Prod configs: API base URL, Maps API key, storage backend
- Photo size limit: 10MB per file; accepted formats: JPG, PNG, HEIC

---

## Functional Requirements

### User Management
- **FR1:** Visitors can register with email and password
- **FR2:** Registered users can log in and receive an authenticated session
- **FR3:** Authenticated users can log out
- **FR4:** Authenticated users can view and edit their profile

### Trip Management
- **FR5:** Authenticated users can create a trip with a name, description, and optional cover image
- **FR6:** Authenticated users can view a list of their trips
- **FR7:** Authenticated users can edit trip details (name, description, dates)
- **FR8:** Authenticated users can delete a trip (with confirmation)
- **FR9:** Authenticated users can set a trip status (Planning, Active, Completed, Archived)

### Itinerary & Step Management
- **FR10:** Authenticated users can add a step to a trip with a name, type, location, date, and time
- **FR11:** Authenticated users can search and select a step location via place autocomplete
- **FR12:** Authenticated users can assign a step type (Travel, Accommodation, Activity, Meal, Rest)
- **FR13:** Authenticated users can edit step details
- **FR14:** Authenticated users can delete a step (with confirmation)
- **FR15:** Authenticated users can reorder steps within a trip

### Map & Visualization
- **FR16:** Authenticated users can view all trip steps as pins on a map
- **FR17:** Authenticated users can view a route line connecting steps in order
- **FR18:** Authenticated users can tap/click a map pin to open step details
- **FR19:** Authenticated users can toggle between map view and list view

### Moment Cards (Notes & Photos)
- **FR20:** Authenticated users can add a text note to a step
- **FR21:** Authenticated users can edit or remove a note from a step
- **FR22:** Authenticated users can upload one or more photos to a step
- **FR23:** Authenticated users can capture a photo directly from their device camera
- **FR24:** Authenticated users can delete a photo from a step
- **FR25:** Authenticated users can view all photos attached to a step

### Trip Sharing
- **FR26:** Authenticated users can generate a shareable invite link for a trip
- **FR27:** Authenticated users can revoke and regenerate a trip's share link
- **FR28:** Anyone with a valid share link can view a trip's itinerary, map, and Moment Cards without an account
- **FR29:** The shared trip view is read-only

### Mobile Experience
- **FR30:** All core flows (trip list, step list, map, Moment Card, share) are usable on mobile at 375px+
- **FR31:** Users can access the device camera from within the app to capture and attach photos

---

## Non-Functional Requirements

### Performance
- Initial page load < 3 seconds on standard broadband
- Map renders all step pins within 2 seconds of opening trip view
- Photo upload shows progress indicator for files > 1MB
- API responses for trip/step CRUD complete within 1 second under normal load

### Security
- All API endpoints require JWT auth except: registration, login, and share-link trip view
- Passwords hashed via .NET Identity (bcrypt)
- All data transmitted over HTTPS
- Share tokens use GUID (128-bit minimum entropy)
- Photo uploads validated server-side (file type + 10MB size limit)
- CORS restricted to known Angular origin(s)

### Scalability
- Single-instance deployment sufficient for v1 (personal project)
- Stateless API design — no in-memory session state; must not block future horizontal scaling

### Accessibility
- Semantic HTML on all core flows
- Keyboard-navigable forms (login, trip creation, step creation)
- WCAG AA not required for v1

### Integration
- Google Places API: graceful degradation to manual text input if unavailable
- Map provider: graceful fallback to list view if map fails to load
- Photo storage: configurable between local disk (dev) and Azure Blob Storage (prod)
