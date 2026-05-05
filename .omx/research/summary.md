# Research Summary

## Flight Memory

The existing app already has a `Flight` model with departure date, times, airline, flight number, origin/destination fields, terminals, baggage allowances, and return-trip fields. Dashboard and Overview consume the next upcoming flight. AI ticket parsing already exists for PDFs/screenshots. Phase 8 explicitly postponed the flight trajectory map until the mobile packing flow stabilized.

Current product direction should treat flight routes as a memory/archive feature, not a live tracking feature.

Map direction: use an SVG map rather than a full tile map. `react-simple-maps` is a thin React wrapper around `d3-geo` and `topojson`, which fits a static memory map with route arcs and airport markers. Avoid MapLibre/Leaflet in the first version because Nomadic does not need tile rendering, live map controls, or navigation. Airport coordinates can come from OurAirports public-domain CSV data, filtered to IATA airports and shipped as a compact local catalog.
