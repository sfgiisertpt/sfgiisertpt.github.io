export function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // IISER Tirupati coordinates: 13°44'48.1"N 79°35'53.6"E
    const iiserLocation = [13.7467, 79.5983];

    // Create map
    const map = L.map('map').setView(iiserLocation, 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    // Add marker for IISER Tirupati
    L.marker(iiserLocation)
        .bindPopup('<b>IISER Tirupati</b><br/>Srinivasapuram, Yerpedu Mandal<br/>Tirupati Dist, Andhra Pradesh, India – 517619')
        .addTo(map)
        .openPopup();

    return map;
}
