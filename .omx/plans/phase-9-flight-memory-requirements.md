# Phase 9 — Flight Memory Requirements Draft

Date: 2026-05-05

## Current Hypothesis

Flight tracking should not become a Flighty competitor inside Nomadic. It should be a lightweight travel-memory layer for long-term nomads: import past flights, show historical routes on a map, and optionally export a flight passport / poster. Operational flight status, live delay tracking, airport alerts, seat maps, loyalty programs, and aviation analytics are out of scope unless explicitly re-approved.

## North Star

The first version serves private personal joy: "this is the visual record of my nomadic life." Sharing and monetization are allowed later, but they must not drive the first build. The feature should feel like opening a memory archive, not managing an aviation dashboard.

## Why It May Belong

- Nomadic already stores flights for packing and luggage limits.
- Long-term travelers think in routes, seasons, homes, and luggage systems, not only single trips.
- A visual route memory can make the app emotionally shareable without changing the packing workflow.
- Imported past flights can turn a utility into a personal archive, which supports retention and possible monetization.

## Product Boundary

In scope:

- Historical flight route map for personal memory.
- Past flight data import from simple formats first.
- Manual correction of imported flights when data is incomplete.
- Flight summary stats only if they support memory: routes, countries/cities, years, distance, most visited places.
- Quiet archive-style timeline or list so the map is not the only way to inspect data.

Out of scope:

- Live flight tracking.
- Delay alerts.
- Gate changes.
- Airport navigation.
- Full aviation dashboard.
- Competing with dedicated flight apps.
- Monetization-driven gating in the first version.
- Share poster / passport export in the first implementation slice.

## Open Decisions

- Whether this feature is a top-level section, a dashboard subview, or a hidden memory/export tool.
- Whether this feature should be a top-level "足跡 / Memory" section or live under the existing flight/dashboard area.
- Whether import should support CSV first, manual entry first, or existing PDF/screenshot parsing first.
- Which map library should be used without making the app heavy.

## Acceptance Criteria For Planning

- The first implementation slice must be small enough to avoid changing Nomadic's identity.
- A user can understand the feature as "my travel memory" rather than "flight operations."
- The feature must reuse existing flight data where possible.
- The feature must have explicit non-goals before implementation starts.
- The first implementation must still be useful even if poster sharing and monetization are not present.
