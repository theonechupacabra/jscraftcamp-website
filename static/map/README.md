# Map Assets

This directory contains all assets needed to serve the map on the Venue page.

## `munich.pmtiles`

PMTiles extract for the area around the venue.

Created with the [PMTiles CLI](https://github.com/protomaps/go-pmtiles):

```
pmtiles extract https://demo-bucket.protomaps.com/v4.pmtiles munich.pmtiles --bbox=11.55,48.10,11.76,48.27 --maxzoom=15
```

## `style.json`

Pulled from [maps.protomaps.com](https://maps.protomaps.com/). With the following edits:

- `sources.protomaps.url`: updated to use serve the `.pmtiles` file in this directory.
- `sprite`: updated to serve the sprite from `protomaps-basemap-assets`.
- Remove the `glyphs` key to fall back to local web fonts.

## protomaps-basemap-assets

Contains sprite downloaded from: https://github.com/protomaps/basemaps-assets.
