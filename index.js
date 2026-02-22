var map = L.map('map', {
    preferCanvas: true,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
}).setView([36.575, 137.984], 6);

L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('bottomleft');

const resetViewControl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
        const btn = L.DomUtil.create('a', 'leaflet-control-zoom-reset');
        btn.innerHTML = '';
        btn.title = '初期位置に戻る';
        btn.href = '#';

        L.DomEvent.on(btn, 'click', (e) => {
            L.DomEvent.preventDefault(e);
            map.setView([36.575, 137.984], 6);
        });

        return btn;
    }
});

map.attributionControl.addAttribution(
    "<a href='https://www.jma.go.jp/jma/index.html' target='_blank'>気象庁</a>"
);
map.attributionControl.addAttribution(
    "<a href='https://github.com/mutsuyuki/Leaflet.SmoothWheelZoom' target='_blank'>SmoothWheelZoom</a>"
);

map.addControl(new resetViewControl());

// ペインのzIndex設定（2つ目のコードより）
map.createPane("pane_map1").style.zIndex = 1;
map.createPane("pane_map2").style.zIndex = 2;
map.createPane("pane_map3").style.zIndex = 3;
map.createPane("pane_map_filled").style.zIndex = 5;  // 細分区域塗りつぶし
map.createPane("shindo10").style.zIndex = 10;
map.createPane("shindo20").style.zIndex = 20;
map.createPane("shindo30").style.zIndex = 30;
map.createPane("shindo40").style.zIndex = 40;
map.createPane("shindo45").style.zIndex = 45;
map.createPane("shindo46").style.zIndex = 46;
map.createPane("shindo50").style.zIndex = 50;
map.createPane("shindo55").style.zIndex = 55;
map.createPane("shindo60").style.zIndex = 60;
map.createPane("shindo70").style.zIndex = 70;
map.createPane("shingen").style.zIndex = 100;
map.createPane("tsunami_map").style.zIndex = 110;

let shindoLayer = L.layerGroup().addTo(map);
let shindoFilledLayer = L.layerGroup().addTo(map);
let JMAPointsJson = null;
let japan_data = null;
let filled_list = {};

const PolygonLayer_Style = {
    "color": "#dde0e5",
    "weight": 1.5,
    "opacity": 0.25,
    "fillColor": "#32353a",
    "fillOpacity": 1
};

const shindoFillColorMap = {
    10: "#007a9c",   // 震度1
    20: "#008369",   // 震度2
    30: "#ffe066",   // 震度3
    40: "#c27b2b",   // 震度4
    45: "#c22b2b",   // 震度5弱
    46: "#db4921",   // 震度5弱以上
    50: "#a11717",   // 震度5強
    55: "#8f0d34",   // 震度6弱
    60: "#80142f",   // 震度6強
    70: "#4a0083",   // 震度7
};

$.getJSON("source/saibun.geojson", function (data) {
    japan_data = data;
    L.geoJson(data, {
        pane: "pane_map3",
        style: PolygonLayer_Style
    }).addTo(map);
});

$.getJSON("source/JMAstations.json", function (data) {
    JMAPointsJson = data;
    updateData();
    setInterval(updateData, 2000);
});

const scaleMap = {
    "70": "7",
    "60": "6強",
    "55": "6弱",
    "50": "5強",
    "45": "5弱",
    "40": "4",
    "30": "3",
    "20": "2",
    "10": "1",
    "-1": "不明"
};

const scaleClassMap = {
    "7": "seven-bg",
    "6強": "six-plus-bg",
    "6弱": "six-minus-bg",
    "5強": "five-plus-bg",
    "5弱": "five-minus-bg",
    "4": "four-bg",
    "3": "three-bg",
    "2": "two-bg",
    "1": "one-bg",
    "不明": "null-bg"
};

function updateData() {
    $.getJSON("https://api.p2pquake.net/v2/history?codes=551", (data) => {
        const latest = data[0];

        const { time, hypocenter, maxScale, domesticTsunami } = latest.earthquake;
        const { name: hyponame, magnitude, depth, latitude, longitude } = hypocenter;

        const hypoLatLng = new L.LatLng(latitude, longitude);
        const hypoIconImage = L.icon({
            iconUrl: 'source/shingen.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -40]
        });
        updateMarker(hypoLatLng, hypoIconImage);

        const map_maxscale = scaleMap[String(maxScale)];

        drawShindoPoints(latest.points);

        updateEarthquakeParam(time, map_maxscale, hyponame, magnitude, depth, domesticTsunami);
        updateEqHistory(data.filter(eq => eq.issue.type === "DetailScale"));
    });
}

function drawShindoPoints(points) {
    if (!JMAPointsJson || !japan_data) return;

    shindoLayer.clearLayers();
    shindoFilledLayer.clearLayers();
    filled_list = {};

    points.forEach(element => {
        const station = JMAPointsJson.find(p => p.name === element.addr);
        if (!station) return;

        const scale = element.scale;

        const iconMap = {
            10: "int1",
            20: "int2",
            30: "int3",
            40: "int4",
            45: "int50",
            46: "int_",
            50: "int55",
            55: "int60",
            60: "int65",
            70: "int7"
        };
        const iconName = iconMap[scale] || "int_";
        const iconUrl = `./source/point_icons/_${iconName}.png`;

        const icon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            popupAnchor: [0, -15]
        });

        const latlng = [Number(station.lat), Number(station.lon)];
        const pane = `shindo${scale}`;

        const marker = L.marker(latlng, {
            icon: icon,
            pane: map.getPane(pane) ? pane : undefined
        });

        const scaleText = scaleMap[String(scale)] || "不明";
        marker.on('mouseover', function () { this.openPopup(); });
        marker.on('mouseout', function () { this.closePopup(); });

        shindoLayer.addLayer(marker);

        if (station.area && station.area.name) {
            const areaCode = AreaNameToCode(station.area.name);
            if (areaCode !== undefined && areaCode !== null) {
                if (!filled_list[areaCode] || filled_list[areaCode] < scale) {
                    filled_list[areaCode] = scale;
                }
            }
        }
    });

    for (const areaCode in filled_list) {
        const fillColor = getShindoFillColor(filled_list[areaCode]);
        FillPolygon(areaCode, fillColor);
    }
}

function getShindoFillColor(scale) {
    return shindoFillColorMap[scale] || "#888888";
}

// 細分区域ポリゴン塗りつぶし
function FillPolygon(area_Code, fillColor) {
    if (!japan_data) return;

    const array_Num = AreaCode.indexOf(area_Code);
    if (array_Num === -1) return;

    const style = {
        "color": "#d1d1d1",
        "weight": 0.2,
        "opacity": 1,
        "fillColor": fillColor,
        "fillOpacity": 1,
    };

    const data_japan = japan_data["features"][array_Num];
    const filledLayer = L.geoJSON(data_japan, {
        style: style,
        pane: "pane_map_filled",
        onEachFeature: function (feature, layer) {
            layer.myTag = "Filled";
        }
    });

    shindoFilledLayer.addLayer(filledLayer);
}

// エリア名とコード変換
function AreaNameToCode(Name) {
    const array_Num = AreaName.indexOf(Name);
    return AreaCode[array_Num];
}
function AreaCodeToName(code) {
    const array_Num = AreaCode.indexOf(code);
    return AreaName[array_Num];
}

// 震源マーカーの更新
let hypoMarker = null;

function updateMarker(hypoLatLng, hypoIconImage) {
    if (!hypoMarker) {
        hypoMarker = L.marker(hypoLatLng, { icon: hypoIconImage, pane: "shingen" }).addTo(map);
    } else {
        hypoMarker.setLatLng(hypoLatLng);
    }
}

// 地震パラメータUI更新
function updateEarthquakeParam(time, scale, name, magnitude, depth, tsunami) {
    const latest_maxscale = document.querySelector(".latest-card_maxscale");

    Object.values(scaleClassMap).forEach(cls => latest_maxscale.classList.remove(cls));

    const bgClass = scaleClassMap[scale];
    if (bgClass) latest_maxscale.classList.add(bgClass);

    const match = scale.match(/^(\d)([^\d]*)$/);
    const number = match ? match[1] : scale;
    const modifier = match ? match[2] : "";

    const txt = latest_maxscale.querySelector(".latest-card_maxscale-txt");
    const label = latest_maxscale.querySelector(".latest-card_maxscale-label");
    txt.innerHTML = `${number}<span class="scale_modifier">${modifier}</span>`;

    if (number === "3" || number === "4") {
        txt.style.color = "#000";
        label.style.color = "#000";
    } else {
        txt.style.color = "";
        label.style.color = "";
    }

    document.getElementsByClassName("latest-card_location")[0].textContent = name;

    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const formatted_time = `${month}/${day} ${hours}:${minutes}`;
    document.getElementsByClassName("latest-card_date")[0].textContent = `${formatted_time}ごろ発生`;

    const magnitude_class = document.getElementsByClassName("latest-card_magnitude")[0];
    if (Number(magnitude) === -1) {
        magnitude_class.textContent = "調査中";
        magnitude_class.classList.add("investigate-text");
    } else {
        magnitude_class.textContent = magnitude.toFixed(1);
        magnitude_class.classList.remove("investigate-text");
    }

    const depth_class = document.getElementsByClassName("latest-card_depth")[0];
    const num_depth = Number(depth);
    if (num_depth === -1) {
        depth_class.textContent = "調査中";
        depth_class.classList.add("investigate-text");
    } else if (num_depth === 0) {
        depth_class.textContent = "ごく浅い";
        depth_class.classList.add("investigate-text");
    } else {
        depth_class.textContent = `${num_depth}km`;
        depth_class.classList.remove("investigate-text");
    }

    const tsunamiCommentMap = {
        "None": "津波の心配なし",
        "Unknown": "津波調査中",
        "Checking": "津波調査中",
        "NonEffective": "若干の海面変動",
        "Watch": "津波注意報発表中",
        "Warning": "津波予報等発表中",
    };
    const tsunamiClassMap = {
        "None": "tsunami-none",
        "Unknown": "tsunami-un",
        "Checking": "tsunami-check",
        "NonEffective": "tsunami-effect",
        "Watch": "tsunami-watch",
        "Warning": "tsunami-warn",
    };

    const tsunami_class = document.getElementsByClassName("latest-card_tsunami")[0];
    Object.values(tsunamiClassMap).forEach(cls => tsunami_class.classList.remove(cls));
    tsunami_class.textContent = tsunamiCommentMap[tsunami] || "情報なし";
    if (tsunamiClassMap[tsunami]) tsunami_class.classList.add(tsunamiClassMap[tsunami]);
}

// UI更新
function updateEqHistory(eqData) {
    const container = document.getElementById("eq-history-list");
    container.innerHTML = "";

    eqData.forEach((eq, index) => {
        if (index === 0) return;

        const { time, maxScale, hypocenter } = eq.earthquake;
        const { name, magnitude, depth } = hypocenter;

        const scaleText = scaleMap[String(maxScale)] || "不明";
        const bgClass = scaleClassMap[scaleText] || "";

        const match = scaleText.match(/^(\d)([^\d]*)$/);
        const scaleNumber = match ? match[1] : scaleText;
        const scaleModifier = match ? match[2] : "";

        const date = new Date(time);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const formatted_time = `${month}/${day} ${hours}:${minutes}ごろ`;

        const num_depth = Number(depth);
        const depthText = num_depth === -1 ? "調査中"
                        : num_depth === 0  ? "ごく浅い"
                        : `${num_depth}km`;

        const magText = Number(magnitude) === -1 ? "調査中" : `M ${magnitude.toFixed(1)}`;

        const darkTextClass = (scaleNumber === "3" || scaleNumber === "4") ? "dark-text" : "";

        const html = `
            <div class="eq-history_content">
                <div class="eq-history_maxscale ${bgClass} ${darkTextClass}">
                    <p>${scaleNumber}<span class="scale_modifier">${scaleModifier}</span></p>
                </div>
                    <div class="eq-history_elements">
                        <p class="eq-history_date">${formatted_time}</p>
                        <div class="eq-history_param">
                            <p class="eq-history_param_magnitude">${magText}</p>
                            <p class="eq-history_param_depth">深さ ${depthText}</p>
                        </div>
                        <p class="eq-history_location">${name}</p>
                    </div>
                </div>
            `;
        container.insertAdjacentHTML("beforeend", html);
    });
}

// ドラッグスクロール
function enableDragScroll(element, options = {}) {
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;
    const speed = options.speed || 1;

    element.style.cursor = 'grab';

    element.addEventListener('mousedown', (e) => {
        isDown = true;
        element.classList.add('active');
        element.style.cursor = 'grabbing';
        startX = e.pageX - element.offsetLeft;
        startY = e.pageY - element.offsetTop;
        scrollLeft = element.scrollLeft;
        scrollTop = element.scrollTop;
    });

    element.addEventListener('mouseup', () => {
        isDown = false;
        element.classList.remove('active');
        element.style.cursor = 'grab';
    });

    element.addEventListener('mouseleave', () => {
        isDown = false;
        element.classList.remove('active');
        element.style.cursor = 'grab';
    });

    element.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const y = e.pageY - element.offsetTop;
        element.scrollLeft = scrollLeft - (x - startX) * speed;
        element.scrollTop  = scrollTop  - (y - startY) * speed;
    });
}

const scrollable = document.querySelector('.side-panel');
enableDragScroll(scrollable, { speed: 1 });