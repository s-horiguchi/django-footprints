"use strict";
/*
ge_control.js
/*/

var Placemarks = {};
var LineStrings = {};

function createXMLHttpRequest() {
    if (window.XMLHttpRequest) { // other than IE
	return new XMLHttpRequest();
    } else if (window.ActiveXObject) {
	try { //IE6 ~
	    return new ActiveXObject('Msxml2.XMLHTTP');
	} catch (e) {
	    try { //~ IE5
		return new ActiveXObject('Microsoft.XMLHTTP');
	    } catch (e2) {
		return null;
	    }
	}
    } else {
	return null;
    }
}

function addUIHtml(html) {
    document.getElementById('ge_UI').innerHTML += html;
}

var ge;
google.load('earth', '1');

function initCallback(instance) {
    ge = instance;
    ge.getWindow().setVisibility(true);
    //ge.getWindow().setStatusBarVisibility(true);

    // add a navigation control
    ge.getNavigationControl().setVisibility(ge.VISIBILITY_AUTO);

    // add some layers
    ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
    ge.getLayerRoot().enableLayerById(ge.LAYER_ROADS, true);
    ge.getLayerRoot().enableLayerById(ge.LAYER_TERRAIN, true);
    ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true);
    ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS_LOW_RESOLUTION, true);

    var la = ge.createLookAt('');
    la.setLongitude(139.451572);
    la.setLatitude(35.411797);
    la.setRange(3000000.0);
    ge.getView().setAbstractView(la);

    setInterval(function () {
	var streamingPercent = ge.getStreamingPercent();
	var progressBar = document.getElementById('progress-bar');
	if (streamingPercent == 100) {
	    // streaming complete, hide the progress bar
	    progressBar.style.backgroundColor = '#0f0';
	    progressBar.style.width = '100%';
	} else {
	    // show the progress bar, max width is 250 as per the stylesheet
	    progressBar.style.backgroundColor = '#00f';
	    progressBar.style.width = (100 * streamingPercent / 100) + '%';
	}
    }, 100);
}

function failureCallback(errorCode) {
    alert('GoogleEarthError:' + errorCode);
}

function init() {
    google.earth.createInstance('map3d', initCallback, failureCallback);

    addUIHtml('<style type="text/css">' +
	      '  #progress-wrap { padding-top: 1%; height: 30%; }' +
	      '  #progress-explain { height: 60%; text-align: center;}' +
	      '  #progress-container { width: 50%; height: 40%; border: 1px solid #ccc; margin: 0 auto;}' +
	      '  #progress-bar { width: 0; height: 100%; }' +
	      '</style>' +
	      '<div id="progress-wrap">' +
	      '  <div id="progress-explain">' +
	      '    Data Streaming Progress:' +
	      '  </div>' +
	      '  <div id="progress-container">' +
	      '    <div id="progress-bar"></div>' +
	      '  </div>' +
	      '</div><br/>'
	     );
}
google.setOnLoadCallback(init);

function createPlacemark(name, coord) {
    var lplacemark = Placemarks[name + coord[0] + coord[1]];

    if (lplacemark == undefined) {
	// Create new placemark
	var placemark = ge.createPlacemark('');
	placemark.setName(name);

	// Create style map for placemark
	var icon = ge.createIcon('');
	icon.setHref('http://maps.google.com/mapfiles/kml/paddle/red-circle.png');
	var style = ge.createStyle('');
	style.getIconStyle().setIcon(icon);
	placemark.setStyleSelector(style);

	// Create point
	var point = ge.createPoint('');
	point.setLongitude(coord[0]);
	point.setLatitude(coord[1]);
	placemark.setGeometry(point);
	// Save in Placemarks
	Placemarks[name + coord[0] + coord[1]] = [placemark, 0];
	lplacemark = Placemarks[name + coord[0] + coord[1]];
    }
    if (lplacemark[1] >= 0) {
	var counter = ++Placemarks[name + coord[0] + coord[1]][1];
	if (counter == 1) {
	    ge.getFeatures().appendChild(lplacemark[0]);
	    return 1;
	}
    } else {
	alert('Error: placemark(' + name + coord[0] + coord[1] + ')\'s counter is wrong.');
	return -1;
    }
    return 0;
}

function removePlacemark(name, coord) {
    var lplacemark = Placemarks[name + coord[0] + coord[1]];

    if (lplacemark == undefined) {
	alert('Error: placemark(' + name + coord[0] + coord[1] + ') not defined.');
	return -1;
    } else {
	if (lplacemark[1] > 0) {
	    var counter = --Placemarks[name + coord[0] + coord[1]][1];
	    if (counter == 0) {
		ge.getFeatures().removeChild(lplacemark[0]);
		return 1;
	    }
	}
    }
    return 0;
}

function createLineString(in_coord, out_coord) {
    var linePlacemark = LineStrings['' + in_coord[0] + in_coord[1] + out_coord[0] + out_coord[1]];
    if (linePlacemark == undefined) {
	// Create the placemark
	linePlacemark = ge.createPlacemark('');
	
	// Create the LineString; set it to extend down to the ground
	// and set the altitude mode
	var lineString = ge.createLineString('');
	linePlacemark.setGeometry(lineString);
	lineString.setExtrude(true);
	lineString.setAltitudeMode(ge.ALTITUDE_CLAMP_TO_GROUND);
	
	// Add LineString points
	lineString.getCoordinates().pushLatLngAlt(in_coord[1], in_coord[0], 0);
	lineString.getCoordinates().pushLatLngAlt(out_coord[1], out_coord[0], 0);

	// Create a style and set width and color of line
	linePlacemark.setStyleSelector(ge.createStyle(''));
	var lineStyle = linePlacemark.getStyleSelector().getLineStyle();
	lineStyle.setWidth(5);
	lineStyle.getColor().set('990000FF'); // aabbggrr format
	
	// Save in LineStrings
	LineStrings['' + in_coord[0] + in_coord[1] + out_coord[0] + out_coord[1]] = linePlacemark;
    }
    // Add the feature to Earht
    ge.getFeatures().appendChild(linePlacemark);
}

function removeLineString(in_coord, out_coord) {
    var linePlacemark = LineStrings['' + in_coord[0] + in_coord[1] + out_coord[0] + out_coord[1]];
    if (linePlacemark == undefined) {
	alert('Error: linePlacemark(' + 
	      in_coord[0] + in_coord[1] + out_coord[0] + out_coord[1] + 
	      ') not defined.');
    } else {
	ge.getFeatures().removeChild(linePlacemark);
    }
}

function getUHData(pk, callback) {
    // ajax request
    var request = createXMLHttpRequest();
    
    request.onreadystatechange = function () {
	if (request.readyState == 4 && request.status == 200) {
	    var xmlData = request.responseXML;
	    var error = xmlData.getElementsByTagName('Error')[0];
	    
	    if (error.childNodes[0]) {
		alert('DataBaseError:\n' + error.childNodes[0].nodeValue);
	    }else {
		var stations = xmlData.getElementsByTagName('Station');
		
		for (var i = 0; i < stations.length; i++) {
		    switch (stations[i].getAttribute('type')) {
		    case 'in':
			var in_name = stations[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue;
			var in_coord = [parseFloat(stations[i].getElementsByTagName('Lon')[0].childNodes[0].nodeValue), 
					parseFloat(stations[i].getElementsByTagName('Lat')[0].childNodes[0].nodeValue)];
			break;
		    case 'out':
			var out_name = stations[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue;
			var out_coord = [parseFloat(stations[i].getElementsByTagName('Lon')[0].childNodes[0].nodeValue), 
					 parseFloat(stations[i].getElementsByTagName('Lat')[0].childNodes[0].nodeValue)];
			break;
		    }
		}
		callback(in_name, in_coord, out_name, out_coord);
	    }
	}
    }
    request.open('GET', '/footprints/get_lonlat?uh=' + pk, true);
    request.send('');
}

function showBalloon(pk) { }

function onUHClick(pk) {
    var uh_tr = document.getElementById('UH_' + pk);
    
    if (uh_tr.getAttribute('bgcolor') == '#365178') {
	// show on
	// table tr bgcolor
	uh_tr.setAttribute('bgcolor', '#2B64FF');
	uh_tr.setAttribute('onmouseover', "style.background='#2BCEFF'");
	uh_tr.setAttribute('onmouseout', "style.background='#2B64FF'");
	
	// ajax
	getUHData(pk, function (in_name, in_coord, out_name, out_coord){
	    createPlacemark(in_name, in_coord);
	    createPlacemark(out_name, out_coord);
	    createLineString(in_coord, out_coord);
	});
    } else if (uh_tr.getAttribute('bgcolor') == '#2B64FF') {
	// show off
	// table tr bgcolor
	uh_tr.setAttribute('bgcolor', '#365178');
	uh_tr.setAttribute('onmouseover', "style.background='#3577E8'");
	uh_tr.setAttribute('onmouseout', "style.background='#365178'");
	
	// ajax
	getUHData(pk, function (in_name, in_coord, out_name, out_coord){
	    removePlacemark(in_name, in_coord);
	    removePlacemark(out_name, out_coord);
	    removeLineString(in_coord, out_coord);
	});
    }
}
