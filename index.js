var map = L.map('map').setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');

var PolygonLater_Style = {
    "color": "#dde0e5",
    "weight": 1.5,
    "opacity": 0.25,
    "fillColor": "#32353a",
    "fillOpacity": 1
}

$.getJSON("prefectures.geojson", function (data) {
    L.geoJson(data, {
        style: PolygonLater_Style
    }).addTo(map);
}); 

$.getJSON(" https://api.p2pquake.net/v2/history?codes=551", function (data) {
    var [time, name, shindo, magnitude, depth] = [
        data["0"]["earthquake"]["time"],
        data["0"]["earthquake"]["hypocenter"]["name"],
        data["0"]["earthquake"]["maxScale"],
        data["0"]["earthquake"]["hypocenter"]["magnitude"],
        data["0"]["earthquake"]["hypocenter"]["depth"]
    ]

    var hypoLatLng = new L.LatLng(data[0]["earthquake"]["hypocenter"]["latitude"], data[0]["earthquake"]["hypocenter"]["longitude"]);
    var hypoIconimage = L.icon({
        iconUrl: 'source/shingen.png',
        iconSize: [40,40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -40]
    })
    var hypoIcon = L.marker(hypoLatLng, {icon: hypoIconimage }).addTo(map);
});


const latest_maxscale = document.querySelector(".latest-card_maxscale");

function updateMaxScale(scale) {
    
    const scaleClassMap = {
        "7": "seven-bg",
        "6強": "six-plus-bg",
        "6弱": "six-minus-bg",
        "5強": "five-plus-bg",
        "5弱": "five-minus-bg",
        "4": "four-bg",
        "3": "three-bg",
        "2": "two-bg",
        "1": "one-bg"
    };

    // 既存の震度色全消し
    Object.values(scaleClassMap).forEach(cls => {
        latest_maxscale.classList.remove(cls);
    });

    // scaleに対応したクラスを追加
    const bgClass = scaleClassMap[scale];
    if (bgClass) {
        latest_maxscale.classList.add(bgClass);
    }

    // 数字と修飾に分割
    const match = scale.match(/^(\d)([^\d]*)$/);
    const number = match ? match[1] : scale;
    const modifier = match ? match[2] : "";

    // 更新
    const txt = latest_maxscale.querySelector(".latest-card_maxscale-txt");
    const label = latest_maxscale.querySelector(".latest-card_maxscale-label")
    txt.innerHTML = `${number}<span class="scale_modifier">${modifier}</span>`;

    if (number === "3" || number === "4") {
        txt.style.color = "#000";
        label.style.color = "#000";
    }
}

updateMaxScale("7");