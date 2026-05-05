# Sticker Cutout And Mobile Sponsor Design

## Goal

Replace the low-impact sticker background picker with a local manual cutout workflow, and keep the Sponsor / VIP call to action visible on mobile without adding noise to the bottom navigation.

## Image Editing

The first version uses a local manual lasso. Users draw around the item on the photo preview with touch or mouse. The app stores that path only during editing, clips the original photo to the selected polygon, and exports a square transparent PNG with a white cut-paper border and subtle shadow. AI background removal stays out of the capture flow so photo intake remains fast.

If the user does not draw a shape, the editor keeps the existing fast sticker generation path. Zoom and position controls remain useful after cutout because they adjust the final card composition.

## Mobile Sponsor CTA

Desktop keeps the existing text CTA in the top navigation. Mobile gets a small icon-only Sponsor / VIP button in the header, next to language and version controls. The bottom navigation remains limited to core app sections.

## Verification

- Unit tests cover cutout point clamping and default polygon behavior.
- A jsdom component test covers that mobile and desktop sponsor entry points are both present.
- TypeScript, targeted tests, production build, and a browser smoke check verify the final behavior.
