// Generated by CoffeeScript 1.6.3
(function() {
  var MapHandler, Route, deg2rad, get2PointsDistance, getDistanceFromLatLonInKm, getPointOnSection, getPointToMarkerDistance, getPositionOnShortestPath, getTotalDistance;

  MapHandler = (function() {
    function MapHandler() {}

    MapHandler.prototype.mode = 'gpx';
    MapHandler.prototype.map = null;

    MapHandler.prototype.routes = [];

    MapHandler.prototype.activeRoute = null;

    MapHandler.prototype.directionsService = null;

    MapHandler.prototype.controls = null;

    MapHandler.prototype.initializeMap = function() {
      var mapOptions, styles;
      $("#map-canvas").show();
      if (!this.map) {
        styles = [
          {
            featureType: "poi",
            stylers: [
              {
                visibility: "off"
              }
            ]
          }
        ];
        mapOptions = {
          center: new google.maps.LatLng(50.15, 14.5),
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: styles
        };
        return this.map = new google.maps.Map($("#map-canvas")[0], mapOptions);
      }
    };

    MapHandler.prototype.addRoute = function(isManual) {
      var route;
      route = new Route();
      route.map = this.map;
      route.controls = this.controls;
      if (isManual) {
        route.isManual = true;
      }
      this.routes.push(route);
      this.activeRoute = route;
      return route;
    };

    MapHandler.prototype.addRouteFromJson = function(routeJson) {
      var route;
      route = this.addRoute();
      route.tracks = routeJson;
      route.draw();
      this.getDistance();
      return this.getTimes();
    };

    MapHandler.prototype.addManualRoute = function() {
      var route;
      return route = this.addRoute();
    };

    MapHandler.prototype.clearRoutes = function() {
      var route, _i, _len, _ref;
      _ref = this.routes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        route = _ref[_i];
        route.clear();
      }
      return this.routes = [];
    };

    MapHandler.prototype.singleNewRoute = function(routeJson) {
      this.clearRoutes();
      this.finishManualRouteHandling();
      return this.addRouteFromJson(routeJson);
    };

    MapHandler.prototype.getDistance = function() {
      var route, _i, _len, _ref;
      this.distance = 0;
      _ref = this.routes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        route = _ref[_i];
        this.distance += route.distance;
      }
      return this.distance;
    };

    MapHandler.prototype.getTimes = function() {
      var durationSeconds, route, _i, _len, _ref;
      this.startTime = this.routes[0].startTime;
      this.endTime = this.routes[0].startTime;
      _ref = this.routes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        route = _ref[_i];
        if (route.startTime < this.startTime) {
          this.startTime = route.startTime;
        }
        if (route.endTime > this.endTime) {
          this.endTime = route.endTime;
        }
      }
      if (this.endTime) {
        durationSeconds = this.endTime.diff(this.startTime, 'seconds');
        this.duration = moment.duration(durationSeconds, 'seconds');
      }
      return this.duration;
    };

    MapHandler.prototype.toggleManualRouteDrawing = function() {
      switch (this.mode) {
        case 'readOnly':
          return this.initializeManualRouteHandling();
        case 'edit':
          return this.finishManualRouteHandling();
      }
    };

    MapHandler.prototype.initializeManualRouteHandling = function() {
      var route;
      this.clearRoutes();
      if (!this.directionsService) {
        this.directionsService = new google.maps.DirectionsService();
      }
      this.controls.container.show();
      route = this.addRoute(true);
      route.directionsService = this.directionsService;
      route.initializeMapBindings();
      return this.mode = 'edit';
    };

    MapHandler.prototype.finishManualRouteHandling = function() {
      if (this.activeRoute) {
        this.activeRoute.removeMapBindings();
        this.activeRoute.makeMarkersUnDragable();
      }
      this.controls.container.hide();
      return this.mode = 'readOnly';
    };

    MapHandler.prototype.getRouteDataFromMap = function() {
      if (this.mode === 'edit' && this.activeRoute) {
        this.finishManualRouteHandling();
        return this.activeRoute.markersToTracks();
      } else {
        return null;
      }
    };

    return MapHandler;

  })();

  Route = (function() {
    function Route() {}

    Route.prototype.map = null;

    Route.prototype.tracks = null;

    Route.prototype.isManual = false;

    Route.prototype.polylines = [];

    Route.prototype.mapPoints = [];

    Route.prototype.distance = 0;

    Route.prototype.fullKmSectionsList = [];

    Route.prototype.startMarker = null;

    Route.prototype.finishMarker = null;

    Route.prototype.fullKmMarkers = [];

    Route.latlngbounds = null;

    Route.prototype.controls = null;

    Route.prototype.draw = function() {
      var fullKmSectionsList;
      this.drawTracks();
      this.addStartFinishMarkers();
      fullKmSectionsList = this.getRouteDistance();
      this.drawFullKmMarkers(fullKmSectionsList);
      this.getStartFinishTimes();
      return this.map.fitBounds(this.latlngbounds);
    };

    Route.prototype.clear = function() {
      var marker, polyline, _i, _j, _len, _len1, _ref, _ref1;
      _ref = this.fullKmMarkers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        marker.setMap(null);
      }
      this.fullKmMarkers = [];
      if (this.startMarker) {
        this.startMarker.setMap(null);
      }
      if (this.finishMarker) {
        this.finishMarker.setMap(null);
      }
      _ref1 = this.polylines;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        polyline = _ref1[_j];
        polyline.setMap(null);
      }
      return this.polylines = [];
    };

    Route.prototype.drawTracks = function() {
      var point, polyline, pt, segment, segmentMapPoints, track, trackMapPoints, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
      this.clear();
      this.latlngbounds = new google.maps.LatLngBounds();
      _ref = this.tracks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        trackMapPoints = [];
        _ref1 = track['segments'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          segment = _ref1[_j];
          segmentMapPoints = [];
          for (_k = 0, _len2 = segment.length; _k < _len2; _k++) {
            point = segment[_k];
            pt = new google.maps.LatLng(point['lat'], point['lon']);
            segmentMapPoints.push(pt);
            this.latlngbounds.extend(pt);
          }
          polyline = new google.maps.Polyline({
            path: segmentMapPoints,
            editable: false,
            draggable: false,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 5
          });
          polyline.setMap(this.map);
          this.polylines.push(polyline);
          trackMapPoints.push(segmentMapPoints);
        }
        _results.push(this.mapPoints.push(trackMapPoints));
      }
      return _results;
    };

    Route.prototype.addStartFinishMarkers = function() {
      var finishInfoWindow, routePoints, startInfoWindow, trackPoints,
        _this = this;
      this.startMarker = new google.maps.Marker({
        position: this.mapPoints[0][0][0],
        map: this.map,
        title: "Start"
      });
      routePoints = this.mapPoints[this.mapPoints.length - 1];
      trackPoints = routePoints[routePoints.length - 1];
      this.finishMarker = new google.maps.Marker({
        position: trackPoints[trackPoints.length - 1],
        map: this.map,
        title: "Koniec"
      });
      finishInfoWindow = new google.maps.InfoWindow({
        content: "<span>Koniec</span>"
      });
      startInfoWindow = new google.maps.InfoWindow({
        content: "<span>Start</span>"
      });
      google.maps.event.addListener(this.startMarker, 'click', function() {
        finishInfoWindow.close();
        return startInfoWindow.open(_this.map, _this.startMarker);
      });
      return google.maps.event.addListener(this.finishMarker, 'click', function() {
        startInfoWindow.close();
        return finishInfoWindow.open(_this.map, _this.finishMarker);
      });
    };

    Route.prototype.getRouteDistance = function() {
      var distance, fullKmSectionsList, _ref;
      _ref = getTotalDistance(this.tracks), distance = _ref[0], fullKmSectionsList = _ref[1];
      this.distance = distance;
      this.controls.distanceDisplay.html(distance.toFixed(2));
      return fullKmSectionsList;
    };

    Route.prototype.getStartFinishTimes = function() {
      var endTimeString, lastSegment, lastTracks, startTimeString;
      if (!this.tracks[0].segments[0][0].time) {
        return;
      }
      startTimeString = this.tracks[0].segments[0][0].time;
      this.startTime = moment(startTimeString, 'YYYY-MM-DD HH:mm:ss');
      lastTracks = this.tracks[this.tracks.length - 1].segments;
      lastSegment = lastTracks[lastTracks.length - 1];
      endTimeString = lastSegment[lastSegment.length - 1].time;
      this.endTime = moment(endTimeString, 'YYYY-MM-DD HH:mm:ss');
      return this.totalTime = this.endTime.diff(this.startTime, 'minutes');
    };

    Route.prototype.drawFullKmMarkers = function(fullKmSectionsList) {
      _results = [];
      for (_i = 0, _len = fullKmSectionsList.length; _i < _len; _i++) {
        section = fullKmSectionsList[_i];
        start = Math.max(Math.ceil(section.startDistance), 1);
        pt1ToFullKmDistance = start - section.startDistance;
        kmsToMark = [];
        while (start < Math.floor(section.endDistance + 1)) {
          kmsToMark.push(start);
          start += 1;
        }
        i = 0;
        _results.push((function() {
          var _j, _len1, _ref, _results1;
          _results1 = [];
          for (_j = 0, _len1 = kmsToMark.length; _j < _len1; _j++) {
            km = kmsToMark[_j];
            _ref = getPointOnSection(section, pt1ToFullKmDistance, i), lat = _ref[0], lon = _ref[1];
            latlng = new google.maps.LatLng(lat, lon);
            image = {
              url: "http://www.markericons.eu/ico?file=903f5ca84d5043e8998f379fe6fe8608.png&txt=" + markerCounter + "km&fs=10"
            };
            marker = new google.maps.Marker({
              position: latlng,
              map: this.map,
              icon: image
            });
            this.fullKmMarkers.push(marker);
            markerCounter += 1;
            _results1.push(i += 1);
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Route.prototype.markers = [];

    Route.prototype.polyline = null;

    Route.prototype.directionsService = null;

    Route.prototype.directionsCache = {};

    Route.prototype.mapEventHandles = [];

    Route.prototype.initializeMapBindings = function() {
      var mapListenerHandle, _this;
      _this = this;
      mapListenerHandle = google.maps.event.addListener(this.map, 'click', function(point) {
        return _this.addMarker(point);
      });
      return this.mapEventHandles.push(mapListenerHandle);
    };

    Route.prototype.removeMapBindings = function() {
      var handle, _i, _len, _ref, _results;
      _ref = this.mapEventHandles;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        _results.push(google.maps.event.removeListener(handle));
      }
      return _results;
    };

    Route.prototype.addMarker = function(point, position) {
      var handle, marker, _this;
      _this = this;
      marker = new google.maps.Marker({
        position: point.latLng,
        map: _this.map,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5
        }
      });
      if (position) {
        _this.markers.splice(position, 0, marker);
      } else {
        _this.markers.push(marker);
      }
      handle = google.maps.event.addListener(marker, 'rightclick', function() {
        var i, _i, _ref;
        marker.setMap(null);
        for (i = _i = 0, _ref = _this.markers.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (marker === _this.markers[i]) {
            _this.markers.splice(i, 1);
            break;
          }
        }
        return _this.drawManualRoute();
      });
      this.mapEventHandles.push(handle);
      if (this.controls.useDirectionsControl.prop('checked')) {
        this.addGoogleDirectionsRouteMarker(marker);
      } else {
        this.addSimpleManualRouteMarker(marker);
      }
      return this.drawManualRoute();
    };

    Route.prototype.addSimpleManualRouteMarker = function(marker) {
      var handle, _this;
      marker.useGoogleDirections = false;
      _this = this;
      handle = google.maps.event.addListener(marker, 'drag', function() {
        return _this.drawManualRoute();
      });
      return this.mapEventHandles.push(handle);
    };

    Route.prototype.addGoogleDirectionsRouteMarker = function(marker) {
      var delay, handle, scrollTimeoutId, _this;
      marker.useGoogleDirections = true;
      _this = this;
      delay = 1000;
      scrollTimeoutId = null;
      handle = google.maps.event.addListener(marker, 'drag', function() {
        clearTimeout(scrollTimeoutId);
        return scrollTimeoutId = setTimeout(function() {
          return _this.drawManualRoute();
        }, delay);
      });
      return this.mapEventHandles.push(handle);
    };

    Route.prototype.drawManualRoute = function() {
      var fullKmSectionsList, handle, path, _this;
      if (this.activePolyline) {
        this.activePolyline.setMap(null);
        this.polylines.pop();
      }
      if (this.markers.length < 2) {
        return;
      }
      path = this.markersToTracks();
      if (!path) {
        return;
      } else {
        this.tracks = path;
      }
      this.drawTracks();
      fullKmSectionsList = this.getRouteDistance();
      this.drawFullKmMarkers(fullKmSectionsList);
      this.activePolyline = this.polylines[this.polylines.length - 1];
      _this = this;
      handle = google.maps.event.addListener(this.activePolyline, 'click', function(point) {
        return _this.polylineClickCalback(point);
      });
      this.mapEventHandles.push(handle);
      this.activePolyline.setMap(this.map);
      return this.polylines.push(this.activePolyline);
    };

    Route.prototype.polylineClickCalback = function(point) {
      var position;
      position = getPositionOnShortestPath(this.markers, point);
      return this.addMarker(point, position);
    };

    Route.prototype.getGoogleDirections = function(mark1, mark2, mark3) {
      var cacheKey, cacheKey2, path, path2, request, travelMode, waypoint, _this;
      cacheKey = "" + mark1.position.B + ":" + mark1.position.k + "-" + mark2.position.B + ":" + mark2.position.k;
      path = this.directionsCache[cacheKey];
      if (path) {
        return path;
      }
      travelMode = this.controls.travelModeControl.find(":selected").val();
      request = {
        origin: mark1.position,
        destination: mark2.position,
        travelMode: google.maps.TravelMode[travelMode],
        optimizeWaypoints: false,
        provideRouteAlternatives: false,
        region: 'pl'
      };
      if (mark3 && mark3.useGoogleDirections) {
        cacheKey2 = "" + mark2.position.B + ":" + mark2.position.k + "-" + mark3.position.B + ":" + mark3.position.k;
        path2 = this.directionsCache[cacheKey2];
        if (!(path2 && path2.length)) {
          request.destination = mark3.position;
          waypoint = {
            location: mark2.position,
            stopover: false
          };
          request.waypoints = [waypoint];
        }
      }
      _this = this;
      this.directionsService.route(request, function(response, status) {
        var msg, _ref;
        if (status === google.maps.DirectionsStatus.OK) {
          _ref = _this.googleResponceToPath(response), path = _ref[0], path2 = _ref[1];
          _this.directionsCache[cacheKey] = path;
          if (path2.length) {
            _this.directionsCache[cacheKey2] = path2;
          }
          _this.controls.googleWarningsDisplay.html(response.routes[0].warnings);
        } else if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
          mark2.useGoogleDirections = false;
          msg = "Nie znaleziono trasy - rysuję linię prostą";
          _this.controls.googleWarningsDisplay.html(msg);
        } else {
          mark2.useGoogleDirections = false;
        }
        return _this.drawManualRoute();
      });
      return false;
    };

    Route.prototype.googleResponceToPath = function(response) {
      var idx, path, path2, point, route, step, waypointStepIdx, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      path = [];
      path2 = [];
      route = response.routes[0];
      if (route.legs[0].via_waypoint.length) {
        waypointStepIdx = route.legs[0].via_waypoint[0].step_index;
        idx = 0;
        _ref = route.legs[0].steps;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          step = _ref[_i];
          if (idx <= waypointStepIdx) {
            _ref1 = step.path;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              point = _ref1[_j];
              path.push(point);
            }
          } else {
            _ref2 = step.path;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              point = _ref2[_k];
              path2.push(point);
            }
          }
          idx += 1;
        }
      } else {
        _ref3 = route.overview_path;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          point = _ref3[_l];
          path.push(point);
        }
      }
      return [path, path2];
    };

    Route.prototype.makeMarkersUnDragable = function() {
      var marker, _i, _len, _ref, _results;
      _ref = this.markers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        _results.push(marker.setDraggable(false));
      }
      return _results;
    };

    Route.prototype.markersToTracks = function() {
      var googlePath, i, marker, nextMarker, obj, path, point, prevMarker, _i, _j, _len, _len1, _ref;
      path = [];
      i = 0;
      _ref = this.markers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        if (!marker.useGoogleDirections || i === 0) {
          obj = {
            'lat': marker.position.lat(),
            'lon': marker.position.lng()
          };
          path.push(obj);
        } else {
          prevMarker = this.markers[i - 1];
          nextMarker = this.markers[i + 1];
          googlePath = this.getGoogleDirections(prevMarker, marker, nextMarker);
          if (!googlePath) {
            return;
          } else {
            for (_j = 0, _len1 = googlePath.length; _j < _len1; _j++) {
              point = googlePath[_j];
              obj = {
                'lat': point.lat(),
                'lon': point.lng()
              };
              path.push(obj);
            }
          }
        }
        i += 1;
      }
      return [
        {
          'segments': [path]
        }
      ];
    };

    return Route;

  })();

  getTotalDistance = function(tracks) {
    var distance, fullKmDistance, fullKmSectionsList, i, obj, pt1, pt2, segment, track, x, _i, _j, _k, _len, _len1, _ref, _ref1;
    distance = 0;
    fullKmSectionsList = [];
    fullKmDistance = 0;
    for (_i = 0, _len = tracks.length; _i < _len; _i++) {
      track = tracks[_i];
      _ref = track['segments'];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        segment = _ref[_j];
        for (i = _k = 1, _ref1 = segment.length - 1; 1 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 1 <= _ref1 ? ++_k : --_k) {
          pt1 = segment[i - 1];
          pt2 = segment[i];
          x = get2PointsDistance(pt1, pt2);
          if (Math.floor(distance + x) > fullKmDistance) {
            obj = {
              startPoint: pt1,
              startDistance: distance,
              endPoint: pt2,
              endDistance: distance + x
            };
            fullKmSectionsList.push(obj);
            fullKmDistance = Math.floor(distance + x);
          }
          distance += x;
        }
      }
    }
    return [distance, fullKmSectionsList];
  };

  get2PointsDistance = function(pt1, pt2) {
    return getDistanceFromLatLonInKm(pt1['lat'], pt1['lon'], pt2['lat'], pt2['lon']);
  };

  getPointToMarkerDistance = function(obj1, obj2) {
    var pt1, pt2;
    if (obj1.position != null) {
      pt1 = {
        'lat': obj1.position.lat(),
        'lon': obj1.position.lng()
      };
    } else {
      pt1 = {
        'lat': obj1.latLng.lat(),
        'lon': obj1.latLng.lng()
      };
    }
    if (obj2.position != null) {
      pt2 = {
        'lat': obj2.position.lat(),
        'lon': obj2.position.lng()
      };
    } else {
      pt2 = {
        'lat': obj2.latLng.lat(),
        'lon': obj2.latLng.lng()
      };
    }
    return get2PointsDistance(pt1, pt2);
  };

  getDistanceFromLatLonInKm = function(lat1, lon1, lat2, lon2) {
    var R, a, c, d, dlat, dlon;
    R = 6371;
    dlat = deg2rad(lat2 - lat1);
    dlon = deg2rad(lon2 - lon1);
    a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    d = R * c;
    return d;
  };

  deg2rad = function(deg) {
    return deg * (Math.PI / 180);
  };

  getPositionOnShortestPath = function(path, newPoint) {
    var bestDistance, distance, i, index, position, tmpPath, _i, _j, _ref, _ref1;
    bestDistance = 1 / 0;
    position = null;
    for (index = _i = 1, _ref = path.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; index = 1 <= _ref ? ++_i : --_i) {
      tmpPath = path.slice(0);
      tmpPath.splice(index, 0, newPoint);
      distance = 0;
      for (i = _j = 1, _ref1 = tmpPath.length - 2; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 1 <= _ref1 ? ++_j : --_j) {
        distance += getPointToMarkerDistance(tmpPath[i - 1], tmpPath[i]);
      }
      if (distance < bestDistance) {
        bestDistance = distance;
        position = index;
      }
    }
    return position;
  };

  getPointOnSection = function(section, pt1ToFullKmDistance, ithKilometer) {
    var deltaLat, deltaLon, lat, lon, pt1ToIthKmDistance, sectionDistance;
    deltaLon = Number(section.endPoint['lon']) - Number(section.startPoint['lon']);
    deltaLat = Number(section.endPoint['lat']) - Number(section.startPoint['lat']);
    sectionDistance = get2PointsDistance(section.startPoint, section.endPoint);
    pt1ToIthKmDistance = pt1ToFullKmDistance + ithKilometer;
    lon = Math.abs(deltaLon) * pt1ToIthKmDistance / sectionDistance;
    lat = Math.abs(deltaLat) * pt1ToIthKmDistance / sectionDistance;
    if (deltaLon < 0) {
      lon = lon * -1;
    }
    if (deltaLat < 0) {
      lat = lat * -1;
    }
    return [Number(section.startPoint['lat']) + lat, Number(section.startPoint['lon']) + lon];
  };

  window.RoutesMapHandler = MapHandler;

}).call(this);
