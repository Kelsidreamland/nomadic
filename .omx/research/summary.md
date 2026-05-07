# Research Summary

## Flight Memory

The existing app already has a `Flight` model with departure date, times, airline, flight number, origin/destination fields, terminals, baggage allowances, and return-trip fields. Dashboard and Overview consume the next upcoming flight. AI ticket parsing already exists for PDFs/screenshots. Phase 8 explicitly postponed the flight trajectory map until the mobile packing flow stabilized.

Current product direction should treat flight routes as a memory/archive feature, not a live tracking feature.

Map direction: use an SVG map rather than a full tile map. `react-simple-maps` is a thin React wrapper around `d3-geo` and `topojson`, which fits a static memory map with route arcs and airport markers. Avoid MapLibre/Leaflet in the first version because Nomadic does not need tile rendering, live map controls, or navigation. Airport coordinates can come from OurAirports public-domain CSV data, filtered to IATA airports and shipped as a compact local catalog.

2026-05-07 route map follow-up: the current hand-drawn `FlightRouteMap` bottom shape is the visual weak point. Keep the product scope as a static memory poster/map, not a live map. Best implementation direction is either `@vnedyalk0v/react19-simple-maps` for a React 19-compatible SVG map with markers/lines, or a tiny custom `d3-geo` + `topojson-client` renderer if we want fewer package-level assumptions. Avoid Leaflet/MapLibre/Google Maps because the interaction model would be heavier than the MVP and would pull the visual language away from the Claude-style app. Chosen slice: custom `d3-geo` + `topojson-client` + `world-atlas` so Nomadic keeps full control over the quiet Claude-style map surface without adding map controls.
