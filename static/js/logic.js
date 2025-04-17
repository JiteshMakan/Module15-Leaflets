// Create the 'basemap' tile layer that will be the background of our map.
let satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: '&copy; <a href="https://www.esri.com/en-us/home">Esri</a> contributors'
});

// Create the 'street' tile layer as a second background of the map
let streetViewLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Adding a Topographic Map
let topographicLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
});

// Create the map object with center and zoom options.
let mainMap = L.map("map").setView([37.09, -95.71], 5);

// Add the 'basemap' tile layer to the map.
satelliteLayer.addTo(mainMap);

// Create the layer groups and overlays
let quakesLayer = new L.LayerGroup(); 
let plateBoundariesLayer = new L.LayerGroup(); 

let baseMaps = {
  "Satellite View": satelliteLayer,
  "Street View": streetViewLayer,
  "Topographic View": topographicLayer
};

let overlayMaps = {
  "Earthquakes": quakesLayer,
  "Tectonic Plates": plateBoundariesLayer
};

// Fetch earthquake GeoJSON data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {
  L.geoJson(data, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng),
    style: styleInfo,
    onEachFeature: function (feature, layer) {
      layer.bindPopup(`
        <h3>Location: ${feature.properties.place}</h3>
        <hr>
        <p>Magnitude: ${feature.properties.mag}</p>
        <p>Depth: ${feature.geometry.coordinates[2]} km</p>
      `);
    }
  }).addTo(quakesLayer);

  // Create a legend
  let legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");
    div.style.backgroundColor = "#f9f9f9";
    div.style.padding = "12px";
    div.style.fontSize = "14px";
    let depthLevels = [-10, 10, 30, 50, 70, 90];
    let depthColors = ["#66ff66", "#ffff66", "#ffcc66", "#ff9966", "#ff6666", "#cc3333"];

    for (let i = 0; i < depthLevels.length; i++) {
      div.innerHTML += 
        `<i style="background:${depthColors[i]}; width: 30px; height: 15px; display: inline-block; margin-right: 5px;"></i> 
         ${depthLevels[i]}${depthLevels[i + 1] ? `&ndash;${depthLevels[i + 1]}<br>` : "+"}`;
    }

    return div;
  };
  legend.addTo(mainMap);

  // Add earthquake data to the layer
  quakesLayer.addTo(mainMap);

  // Layer control toggle
  L.control.layers(baseMaps, overlayMaps).addTo(mainMap);
});

// Style function for each marker
function styleInfo(feature) {
  return {
    color: "#222",
    weight: 0.8,
    fillColor: getDepthColor(feature.geometry.coordinates[2]),  
    fillOpacity: 0.75,
    radius: getRadius(feature.properties.mag)
  };
}

// Assign colors based on depth
function getDepthColor(depth) {
  if (depth <= 10) return "#66ff66";     // light green
  else if (depth <= 30) return "#ffff66"; // yellow
  else if (depth <= 50) return "#ffcc66"; // orange-yellow
  else if (depth <= 70) return "#ff9966"; // coral
  else if (depth <= 90) return "#ff6666"; // red
  else return "#cc3333";                 // dark red
}

// Radius based on magnitude
function getRadius(magnitude) {
  return magnitude ? magnitude * 5 : 1;
}

// Tectonic plates data
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plateData) {
  L.geoJson(plateData, {
    color: "darkorange",
    weight: 2
  }).addTo(plateBoundariesLayer);

  plateBoundariesLayer.addTo(mainMap);
});
