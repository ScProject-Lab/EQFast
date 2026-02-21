let map = L.map('map').setView([36.575, 137.984], 6);

L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');

let shindoLayer = L.layerGroup().addTo(map);
let JMAPointsJson = null;

let PolygonLater_Style = {
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

$.getJSON("source/JMAstations.json", function (data) {
    JMAPointsJson = data;

    updateData();
    setInterval(updateData, 10000);
});

function updateData() {
    $.getJSON("https://api.p2pquake.net/v2/history?codes=551", (data) => {
        drawShindoPoints(data[0].points);
        console.log(data[0]);

        let [time, hyponame, maxscale, magnitude, depth, tsunami] = [
            data["0"]["earthquake"]["time"],
            data["0"]["earthquake"]["hypocenter"]["name"],
            data["0"]["earthquake"]["maxScale"],
            data["0"]["earthquake"]["hypocenter"]["magnitude"],
            data["0"]["earthquake"]["hypocenter"]["depth"],
            data["0"]["earthquake"]["domesticTsunami"]
        ]

        console.log(time, hyponame, magnitude)

        let hypoLatLng = new L.LatLng(data[0]["earthquake"]["hypocenter"]["latitude"], data[0]["earthquake"]["hypocenter"]["longitude"]);
        let hypoIconimage = L.icon({
            iconUrl: 'source/shingen.png',
            iconSize: [40,40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -40]
        })
        updateMarker(hypoLatLng, hypoIconimage);

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

        const map_maxscale = scaleMap[maxscale];

        updateEarthquakeParam(time, map_maxscale, hyponame, magnitude, depth, tsunami);
        updateEqHistory()
    });

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

    function updateEarthquakeParam(time, scale, name, magnitude, depth, tsunami) {
        const latest_maxscale = document.querySelector(".latest-card_maxscale");

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

        document.getElementsByClassName("latest-card_location")[0].textContent = name;

        // 日付フォーマット
        const date = new Date(time);

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        const formatted_time = `${month}/${day} ${hours}:${minutes}`;

        document.getElementsByClassName("latest-card_date")[0].textContent = `${formatted_time}ごろ発生`;

        // マグニチュード
        const magnitude_class = document.getElementsByClassName("latest-card_magnitude")[0]

        if (Number(magnitude) === -1) {
            magnitude_class.textContent = "調査中"
            magnitude_class.classList.add("investigate-text")
        } else {
            let formatted_magnitude = magnitude.toFixed(1)
            magnitude_class.textContent = formatted_magnitude
        }

        //深さ
        const depth_class = document.getElementsByClassName("latest-card_depth")[0]
        let num_depth = Number(depth)

        if (num_depth === -1) {
            depth_class.textContent = "調査中"
            depth_class.classList.add("investigate-text")
        } else if (num_depth === 0)  {
            depth_class.textContent = "ごく浅い"
            depth_class.classList.add("investigate-text")
        } else {
            depth_class.textContent = `${num_depth}km`
        }

        //津波
        const tsunamiCommentMap = {
            "None": "津波の心配なし",
            "Unknown": "不明",
            "Checking": "調査中",
            "NonEffective": "若干の海面変動",
            "Watch": "津波注意報発表中",
            "Warning": "津波予報等発表中",
        };

        const tsunamiComment = tsunamiCommentMap[tsunami];
        const tsunami_class = document.getElementsByClassName("latest-card_tsunami")[0]
        tsunami_class.textContent = tsunamiComment
    }


    function updateEqHistory () {
        const eqHistoryData = [
            {
                maxScale: 2,
                date: "3/10 15:15ごろ",
                magnitude: 3.9,
                depth: 50,
                location: "カムチャツカ半島付近"
            },
            {
                maxScale: 4,
                date: "3/11 02:31ごろ",
                magnitude: 5.2,
                depth: 30,
                location: "茨城県南部"
            },
            {
                maxScale: 1,
                date: "3/11 05:12ごろ",
                magnitude: 2.8,
                depth: 10,
                location: "岩手県沖"
            }
        ];

        const container = document.getElementById("eq-history-list");
        container.innerHTML = "";

        eqHistoryData.forEach(eq => {

            const bgClass = scaleClassMap[String(eq.maxScale)] || "";

            const html = `
                <div class="eq-history_content">
                    <div class="eq-history_maxscale ${bgClass}">
                        <p>${eq.maxScale}</p>
                    </div>
                    <div class="eq-history_elements">
                        <p class="eq-history_date">${eq.date}</p>
                        <div class="eq-history_param">
                            <p class="eq-history_param_magnitude">M ${eq.magnitude}</p>
                            <p class="eq-history_param_depth">深さ ${eq.depth}km</p>
                        </div>
                        <p class="eq-history_location">${eq.location}</p>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML("beforeend", html);
        });
    }
}

let hypoMarker = null;

function updateMarker(hypoLatLng, hypoIconimage) {
    if (!hypoMarker) {
        hypoMarker = L.marker(hypoLatLng, { icon: hypoIconimage }).addTo(map);
    } else {
        hypoMarker.setLatLng(hypoLatLng)
    }
}

function drawShindoPoints(points) {

    if (!JMAPointsJson) return;

    shindoLayer.clearLayers();

    points.forEach(element => {

        const station = JMAPointsJson.find(
            p => p.name === element.addr
        );

        if (!station) return;

        let iconUrl = "";
        let scale = element.scale;

        const iconMap = {
            10: "int1",
            20: "int2",
            30: "int3",
            40: "int4",
            45: "int50",
            50: "int55",
            55: "int60",
            60: "int65",
            70: "int7"
        };

        const iconName = iconMap[scale] || "int_";
        iconUrl = `source/point_icons/_${iconName}.png`;

        const icon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20]
        });

        const latlng = [
            Number(station.lat),
            Number(station.lon)
        ];

        const marker = L.marker(latlng, { icon: icon });

        marker.bindPopup(`${element.addr} 震度${scale / 10}`);

        shindoLayer.addLayer(marker);
    });
}