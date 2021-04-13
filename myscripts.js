// NAV
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

// MAP
var map = L.map('map').setView([52.3702157, 4.8951679], 12);

var mapLayer = L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=kyQdq1KY1ppYwHOIDB46', {
  attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
}).addTo(map);

scale = L.control.scale().addTo(map);

var north = L.control({position: "bottomright"});
north.onAdd = function() {
  var div = L.DomUtil.create("div", "info legend");
  div.innerHTML = '<img src="img/north_arrow.png" width="50" height="50" alt="north arrow">';
  return div;
}
north.addTo(map);

// LEGEND
var legend = L.control({position: 'topright'});

legend.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Legenda</h4>";
  div.innerHTML += '<i class="natuur" style="background: #6dad63"></i><span>Natuur</span><br>';
  div.innerHTML += '<i class="druk" style="background: #e27313"></i><span>Druk</span><br>';
  div.innerHTML += '<i class="rustig" style="background: #9fc866"></i><span>Rustig</span><br>';
  // div.innerHTML += '<i class="icon" style="background-image: url(./img/legenda_line.png);background-repeat: no-repeat;"></i><span>Metro en Tram lijn</span><br>';
  div.innerHTML += '<i class="line""><div></div></i><span>Metro & Tram rails</span><br>';
  div.innerHTML += '<i class="metro" style="background-image: url(./img/legenda_metro.png);background-repeat: no-repeat;"></i><span>Metrohalte</span><br>';
  div.innerHTML += '<i class="tram" style="background-image: url(./img/legenda_tram.png);background-repeat: no-repeat;"></i><span>Tramhalte</span><br>';
  return div;
};

legend.addTo(map);

// STYLING
var druk_style = {
  radius: 8,
  fillColor: "#ff6700",
  // color: "#000",
  color: "#bf4d00",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

var rustig_style = {
  radius: 8,
  fillColor: "#8de04c",
  color: "#5c9600",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

function polystyle(feauture, weight, color, opacity){
  return {
    weight: weight,
    color: color,
    fillOpacity: opacity
  };
}

// ICON CLASS (for different markers)
var CustomIcon = L.Icon.extend({
  options: {
    iconSize: [15,15],
    iconAnchor: [7.5, 7.5]
  }
})

var tramIcon = new CustomIcon({iconUrl: 'https://i.imgur.com/sBfsZ2T.png'}),
    metroIcon = new CustomIcon({iconUrl: 'https://i.imgur.com/2UQeg4G.png'})

// LAYERS & POPUPS
var amsterdamLayer = L.geoJSON(amsterdam, {style: polystyle(null, 1,'grey', 0.2)}).addTo(map)

var ovLayerPopup = L.geoJSON(ovLijnen,{
  style: polystyle(null, 2,'#424242', 0),
  onEachFeature: function(feature, layer){
    layer.bindPopup('<h2>' + feature.properties.Modaliteit + ' lijn </h2> <p class="pStyle"> Lijnen: ' + feature.properties.Lijn + '</p>');
  }
}).addTo(map);

function parkPopup(feature) {
  var stadspark;
  if (feature.properties.Stadspark === "J") {
    stadspark = "Ja"
  } else {
    stadspark = "Nee"
  }
  var parkPopupContent;
  if (feature.properties.Foto !== ""){
    parkPopupContent = '<h2>' + feature.properties.Naam + '</h2>' +
        '<img class="image" src="' + feature.properties.Foto + '" alt="' + feature.properties.Naam + ' foto" width="150" height="100"";>' +
        '<p class="pStyle"> Oppervlakte in m²: ' + feature.properties.Oppervlakte_m2 + '</p>' +
        '<p class="pStyle"> Stadspark: ' + stadspark + '</p>';
  } else {
    parkPopupContent = '<h2>' + feature.properties.Naam + '</h2>' +
        '<p class="pStyle"> Oppervlakte in m²: ' + feature.properties.Oppervlakte_m2 + '</p>' +
        '<p class="pStyle"> Stadspark: ' + stadspark + '</p>';
  }
  return parkPopupContent;
}

function ovPopup(feature) {
  ovPopupContent = '<h2>' + feature.properties.Naam + '</h2>' +
      '<p class="pStyle"> Lijnen: ' + feature.properties.Lijn + '</p>'
  return ovPopupContent;
}

var parkLayer = L.geoJSON(park,{
  style: polystyle(null, 1,'green', 0.5),
  onEachFeature: function(feature, layer){
    var parkPopupContent = parkPopup(feature, layer)
    layer.bindPopup(parkPopupContent);
  }
}).addTo(map);

// CLUSTERING
var markersDruk = L.markerClusterGroup();
var drukGroup = L.geoJSON(druk,{
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, druk_style);
  }
});
markersDruk.addLayer(drukGroup);
map.addLayer(markersDruk);


// SLIDER NATUUR
var parkenValue = 0
function rangeSlide(value) {
  parkenValue = value;
  document.getElementById('rangeValue').innerHTML = "Groter dan "+value+"m²";
}


// FILTEREN
function onFilter() {
  map.eachLayer(function (layer) {
    if(layer !== mapLayer){
      map.removeLayer(layer);
    }
  });
  // Always load
  map.addLayer(amsterdamLayer)
  map.addLayer(ovLayerPopup)

  filterPark()

  var radiosDrukte = document.getElementsByName('drukte');
  for (var i = 0, length = radiosDrukte.length; i < length; i++) {
    if (radiosDrukte[i].checked) {
      if (radiosDrukte[i].value === "druk"){
        filterDruk()
      } else {
        filterRustig()
      }
      break;
    }
  }

  var metroHalte = document.getElementsByName('metro');
  var checkedMetros = []
  for (var j = 0; j < metroHalte.length; j++) {
    if (metroHalte[j].checked) {
      checkedMetros.push(metroHalte[j].value)
    }
  }
  filterMetro(checkedMetros)

  var tramHalte = document.getElementsByName('tram');
  var checkedTrams = []
  for (var k = 0; k < tramHalte.length; k++) {
    if (tramHalte[k].checked) {
      checkedTrams.push(tramHalte[k].value)
    }
  }
  filterTram(checkedTrams)
}

function filterPark(){
  parkLayer = L.geoJSON(park, {
    filter: function (feature) {
      return feature.properties.Oppervlakte_m2 >= parkenValue;
    },
    style: polystyle(null, 1, 'green', 0.5),
    onEachFeature: function (feature, layer) {
      var parkPopupContent = parkPopup(feature, layer)
      layer.bindPopup(parkPopupContent);
    }
  })
  map.addLayer(parkLayer)
}

function filterRustig(){
  var markersRustig = L.markerClusterGroup();
  var rustigGroup = L.geoJSON(rustig,{
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, rustig_style);
    }
  });
  markersRustig.addLayer(rustigGroup);
  map.addLayer(markersRustig);
}

function filterDruk(){
  var markersDruk = L.markerClusterGroup();
  var drukGroup = L.geoJSON(druk,{
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, druk_style);
    }
  });
  markersDruk.addLayer(drukGroup);
  map.addLayer(markersDruk);
}

function filterMetro(selectedMetros){
  var metroLayer = L.geoJSON(metro,{
    filter: function(feature) {
      return containsAny(feature.properties.Lijn, selectedMetros);
    },
    onEachFeature: function(feature, layer){
      var ovPopupContent = ovPopup(feature, layer)
      layer.bindPopup(ovPopupContent);
    },
    pointToLayer: function (feature, latlng) {
      // return L.circleMarker(latlng, metro_style);
      return L.marker(latlng, {icon: metroIcon});
    }
  }).addTo(map)
}

function filterTram(selectedTrams){
  var tramLayer = L.geoJSON(tram,{
    filter: function(feature) {
      return containsAny(feature.properties.Lijn_select, selectedTrams);
    },
    onEachFeature: function(feature, layer){
      var ovPopupContent = ovPopup(feature, layer)
      layer.bindPopup(ovPopupContent);
    },
    pointToLayer: function (feature, latlng) {
      // return L.circleMarker(latlng, metro_style);
      return L.marker(latlng, {icon: tramIcon});
    }
  }).addTo(map)
}

function containsAny(str, substrings) {
  for (var i = 0; i !== substrings.length; i++) {
    var substring = substrings[i];
    if (str.indexOf(substring) !== - 1) {
      return substring;
    }
  }
  return false;
}

function toggle(source) {
  checkboxes = document.getElementsByName(source.value);
  for(var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked;
  }
}