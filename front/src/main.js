function buildJson(){
	const objet = {
		source: 'ANTARES',
		entity: '',
		type: 'EVENT',
		mutation: 'CREATE',
		id: 'd0538784-5402-426a-a3d1-f424bc71f9d7',
		data: { },
		date: '', // FIXME date ou eventDate ?
		version: 1.0
	}
	// Date
	setTimeOfPositionning()
	objet.date = $('#top').val()
	// Code du CGO
	objet.data.codeCgo = $('#codeCgo').val()
	objet.data.radioId = $('#radioId').val()
	// Moyen
	objet.data.vehicule = {}
	objet.data.vehicule.id = $('#codeMoyen').val()
	objet.data.vehicule.nom = 'Le nom du moyen'
	// Statut
	const statut = $('#codeStatus').val()
	if (statut == '') {
		objet.entity = 'ANTARES_LOCATION_VEHICLE'
		// Digital
		objet.data.vehicule.digital = {}
		objet.data.vehicule.digital.input = 0
		objet.data.vehicule.digital.output = 0
		// Tracking
		objet.data.vehicule.tracking = 'OK' // Pas utilisé encore
	} else {
		objet.entity = 'ANTARES_LOCALIZED_OPERATIONAL_STATUS_VEHICLE'
		// Statut
		objet.data.vehicule.statut = {}
		objet.data.vehicule.statut.id = 'Le libellé du statut'
		objet.data.vehicule.statut.number = parseInt(statut)
		// Aknowledgement
		objet.data.vehicule.acknoledgement = {}
		objet.data.vehicule.acknoledgement.requis = true
		objet.data.vehicule.acknoledgement.message = 'Accusé de reception requis'
		// origineDate
		objet.data.vehicule.origineDate = 'véhicule'
		// groupCommField
		objet.data.vehicule.groupCommunication = 'Le numéro du canal radio'
	}
	// Coordonnées
	objet.data.vehicule.coordonnees = {}
	objet.data.vehicule.coordonnees.longitude = parseFloat($('#lg').val())
	objet.data.vehicule.coordonnees.latitude = parseFloat($('#lt').val())
	// statutLocalisation
	objet.data.vehicule.statutLocalisation = {} // ou locationStatus ?
	objet.data.vehicule.statutLocalisation.code = '44'
	objet.data.vehicule.statutLocalisation.libelle = 'actif'
	// dateLocalisation
	objet.data.vehicule.dateLocalisation = $('#top').val() // ou locationDate ?
	
	//console.log(objet)
	return JSON.stringify(objet, null, 4)
}

$(".build").click(function() {
	var json = buildJson()
	$('.json').html(json)
	$('.json').click()
});

function setTimeOfPositionning() {
	const d = new Date();
	const time = d.getUTCFullYear() + '-' +
		pad(d.getUTCMonth() + 1) + '-' +
		pad(d.getUTCDate()) + 'T' +
		pad(d.getUTCHours()) + ':' +
		pad(d.getUTCMinutes()) + ':' +
		pad(d.getUTCSeconds()) + 'Z'
	$('#top').val(time)
}
setTimeOfPositionning()

function pad(number) {
	if ( number < 10 ) {
		return '0' + number
	}
	return number
}

const basemap = new ol.layer.Tile({
	source: new ol.source.XYZ({
		url: 'https://api.mapbox.com/styles/v1/adrienvh/ckb0rvexl11d11io94axnoy29/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYWRyaWVudmgiLCJhIjoiU2lDV0N5cyJ9.2pFJAwvwZ9eBKKPiOrNWEw'
	}),
	name: "basemap"
});

function getLocalisantsStyle(f){
	return new ol.style.Style({
		text: new ol.style.Text({
			font:'bold 30px "Arial"',
			text:"+",
			fill: new ol.style.Fill({color: '#4c5268'})
		})
	});
}

var localisantsSource = new ol.source.Vector({projection : 'EPSG:3857'});
var localisants = new ol.layer.Vector({
	source: localisantsSource,
	style: getLocalisantsStyle,
	name: "localisants"
});

const map = new ol.Map({
	layers: [basemap, localisants],
	target: document.getElementById('map'),
	view: new ol.View({
		center: ol.proj.transform([2.668288, 48.532930], 'EPSG:4326','EPSG:3857'),
		zoom: 17,
		minZoom:8,
		maxZoom:17
	}),
	controls : ol.control.defaults({
		attribution : false,
		zoom : false
	})
});

map.on('singleclick', function(evt){
	const xy = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326').map(c => c.toFixed(6))
	$('#lg').val(xy[0])
	$('#lt').val(xy[1])
	addCircleToMap(false)
})

$('#lg, #lt').change(function(){
	if($('#lg').val() != '' && $('#lt').val() != ''){
		addCircleToMap(true)
	}
});

$('#lg, #lt').keyup(function(){
	if($('#lg').val() != '' && $('#lt').val() != ''){
		addCircleToMap(true)
	}
});

function addCircleToMap(zoomToCenter){
	localisantsSource.clear()
	const centerLongitudeLatitude = ol.proj.fromLonLat([$('#lg').val(), $('#lt').val()])
	localisantsSource.addFeature(new ol.Feature(new ol.geom.Point(centerLongitudeLatitude)))
	if (zoomToCenter) {
		map.getView().setCenter(centerLongitudeLatitude)
		map.getView().setZoom(17)
	}
}

$('.json').html(buildJson())
addCircleToMap(true)

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

function searchAddress(query){
	$('#search h2.recents').hide()
	$('#search ul li').remove()

	var request = $.ajax({
		url: "https://api-adresse.data.gouv.fr/search?",
		method: "GET",
		data: {q: query, limit: 10, type: 'housenumber'}
	});

	request.done(function(result) {
		if (result.features.length > 0) {
			for (const feature of result.features) {
				if (feature.properties.score > 0.5) {
					var label = feature.properties.label
					var li = $('<li data-lg="'+feature.geometry.coordinates[0]+'" data-lt="'+feature.geometry.coordinates[1]+'">' + label + '</li>').appendTo('#search ul.results')
					li.click(function(){
						$('#lt').val('+' + $(this).data('lt'))
						$('#lg').val('+' + $(this).data('lg'))
						addCircleToMap(true)
						$('#search').hide()
						$('#showsearchpanel').show()
						// Sauvegarde parmi les localisations récentes
						saveAddress($(this).html(), $(this).data('lt'), $(this).data('lg'))
					});
				}
			}
		} else {
			alert("Aucune adresse n'a été trouvée")
		}
	});

	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
		$('#search').hide()
		$('#showsearchpanel').show()
		alert("An error has occured")
	});
}

$( "#showsearchpanel" ).click(function() {
	$('#search input').val('')
	$('#search ul li').remove()
	$('#search').show()
	$('#showsearchpanel').hide()
	// Affichage des localisations récentes
	let addresses = localStorage.getItem('addresses')
	if (addresses) {
		$('#search h2.recents').show()
		addresses = JSON.parse(addresses)
		for (const address of addresses) {
			var li = $('<li data-lg="'+address.lg+'" data-lt="'+address.lt+'">' + address.label + '</li>').appendTo('#search ul.recents')
			li.click(function(){
				$('#lt').val('+' + $(this).data('lt'))
				$('#lg').val('+' + $(this).data('lg'))
				addCircleToMap(true)
				$('#search').hide()
				$('#showsearchpanel').show()
			});
		}
	} else {
		$('#search h2.recents').hide()
	}
});

$( ".search" ).click(function() {
	searchAddress($('#query').val())
});

$( ".cancel" ).click(function() {
	$('#search').hide()
	$('#showsearchpanel').show()
});

$(".json").click(function() {
	var elm = document.getElementsByClassName("json")[0];
	var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(elm);
    selection.removeAllRanges();
    selection.addRange(range);
	document.execCommand("Copy");
	selection.removeAllRanges();
    alert("Ce message au format JSON a été copié dans le presse-papiers. Vous pouvez maintenant le coller dans votre console RabbitMQ, afin de l'envoyer manuellement.");
});

$(function () {
	setInterval(updateJson, 1000)
});

function updateJson() {
	setTimeOfPositionning()
	const json = buildJson()
	$('.json').html(json)
}

function saveAddress(label, lt, lg) {
	let addresses = localStorage.getItem('addresses')
	if (addresses) {
		addresses = JSON.parse(addresses)
	} else {
		addresses = []
	}
	addresses.unshift({label, lt, lg})
	addresses = addresses.slice(0, 15)
	localStorage.setItem('addresses', JSON.stringify(addresses))
}