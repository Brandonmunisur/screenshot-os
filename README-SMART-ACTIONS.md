# ScreenshotOS — Smart Actions v2

This build extends the first live smart-action layer without changing the database,
Supabase configuration, Gemini prompt, authentication, upload flow, or storage.

Live now:
- Find Restaurant → opens a Google search based on the extracted venue/location.
- Open Map → opens Google Maps using the extracted venue/location.
- Find Product → opens Google Shopping using brand/product type/colour/style when available.
- Find Similar → opens Google Images using the extracted visual product attributes.
- Search Web → opens a general Google search using the screenshot title and extracted context.

Still intentionally marked as "Coming soon":
- Save to Wishlist
- Track Price
- Save Food
- Add to Calendar
- Add to Trip
- Save

Quick test:
1. Run `npm run dev`.
2. Open the Nike/product screenshot.
3. Click Find Product and confirm the search contains useful structured terms such as Nike, sneaker, colours, and style.
4. Click Find Similar and confirm an image search opens.
5. Re-test Find Restaurant / Open Map on the Flame Café screenshot.

No SQL migration is required for this version.
