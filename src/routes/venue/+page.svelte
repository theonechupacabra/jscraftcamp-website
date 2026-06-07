<script lang="ts">
	import Card from '$lib/layout/Card.svelte';
	import PageLayout from '$lib/layout/PageLayout.svelte';
	import VenueSearchCard from '$lib/components/VenueSearchCard.svelte';
	import { venueConfig } from '$lib/config/venue';
	import Content from '$lib/layout/Content.svelte';
	import { MapLibre, Marker, NavigationControl } from 'svelte-maplibre-gl';
	import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';

	// MapLibre GL JS requires the sprite URL to be absolute
	// so we're downloading the style JSON and setting the sprite path manually
	async function loadStyle() {
		const style = await fetch('/map/style.json').then((r) => r.json());
		style.sprite = `${window.location.origin}/map/protomaps-basemap-assets/sprites/v4/light`;
		return style;
	}

	const mapStyle = loadStyle();
</script>

<PMTilesProtocol />

<PageLayout>
	<Content>
		<h1>Location Information</h1>

		{#if venueConfig.noVenueAvailable}
			<VenueSearchCard />
		{:else}
			<Card>
				{#if venueConfig.description}
					<p>{venueConfig.description}</p>
				{/if}
				{#if venueConfig.address}
					<p>
						{venueConfig.address.name}<br />
						{venueConfig.address.street}<br />
						{venueConfig.address.city}<br />
						<a href={venueConfig.address.openStreetMapLink} rel="external noopener noreferrer"
							>OpenStreetMap</a
						>
						-
						<a href={venueConfig.address.googleMapsLink} rel="external noopener noreferrer"
							>Google Maps</a
						>
					</p>
				{/if}
				{#if venueConfig.impressionsLink}
					<p>
						See some impressions of the venue
						<a href={venueConfig.impressionsLink} rel="external noopener noreferrer">here</a>.
					</p>
				{/if}
			</Card>

			{#if venueConfig.coordinates}
				<Card class="h-100">
					{#await mapStyle then style}
						<MapLibre
							{style}
							zoom={15}
							center={venueConfig.coordinates}
							maxBounds={[
								[11.55, 48.1],
								[11.76, 48.27]
							]}
							class="h-100 w-full rounded"
						>
							<NavigationControl />
							<Marker lnglat={venueConfig.coordinates} color="#b06bff" />
						</MapLibre>
					{/await}
				</Card>
			{/if}

			{#if venueConfig.entryInfo}
				<Card>
					<h3>Entry</h3>
					<p>{venueConfig.entryInfo}</p>
				</Card>
			{/if}

			<Card>
				<h3>Parking</h3>
				<p>
					There are only limited parking slots available at the venue. Please consider arriving by
					public transport.
				</p>
			</Card>

			<Card>
				<h3>Public Transport</h3>
				<p>
					You can take the <strong>S8</strong> and walk approximately 1.3 km from the station to the
					venue, or take the bus line directly.
				</p>
			</Card>

			{#if venueConfig.accessibility}
				<Card>
					<h3>Accessibility</h3>
					<p>{venueConfig.accessibility.description}</p>
				</Card>
			{/if}
		{/if}
	</Content>
</PageLayout>
