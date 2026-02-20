var map = L.map('map').setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');

var PolygonLater_Style = {
    "color": "#ffffff",
    "weight": 1.5,
    "opacity": 0.25,
    "fillColor": "#201d1a",
    "fillOpacity": 1
}

$.getJSON("prefectures.geojson", function (data) {
    L.geoJson(data, {
        style: PolygonLater_Style
    }).addTo(map);
}); 
