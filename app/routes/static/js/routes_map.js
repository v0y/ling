// Generated by CoffeeScript 1.6.3
(function() {
  var bindManualRouteSwitch, bindSaveManualRoute, bindToFileInputChange, displayRelatedRoute, fileUploadChangeState, fillFormFields, handleNewRoute, main, sendFile, setMapHandlerControls, validateFileExtansion;

  bindToFileInputChange = function(mapHandler) {
    var $form;
    $form = $('#gpx-file-input-form');
    return $form.find("input:file").change(function() {
      return sendFile($form, mapHandler);
    });
  };

  sendFile = function($form, mapHandler) {
    var $inputField, csrfToken, fd, xhr;
    $inputField = $form.find("input:file");
    if (validateFileExtansion($inputField)) {
      xhr = new XMLHttpRequest();
      xhr.open("POST", $form.data('url'));
      csrfToken = $.cookie('csrftoken');
      if (csrfToken) {
        xhr.setRequestHeader("X-CSRFToken", csrfToken);
      }
      xhr.onreadystatechange = function() {
        return fileUploadChangeState(xhr, mapHandler);
      };
      fd = new FormData($form.get(0));
      return xhr.send(fd);
    }
  };

  validateFileExtansion = function($inputField) {
    var extention;
    extention = $inputField.val().split(".").pop().toLowerCase();
    if (extention === 'gpx') {
      return true;
    } else {
      alert("To nie jest właściwy rodzaj pliku - wybierz plik .gpx");
      return false;
    }
  };

  fileUploadChangeState = function(xhr, mapHandler) {
    var response, routeId, routes;
    if (xhr.readyState === 4 && xhr.status === 200) {
      response = JSON.parse(xhr.responseText);
      routeId = response['id'];
      routes = JSON.parse(response['tracks']);
      handleNewRoute(mapHandler, routes);
      return fillFormFields(routeId, mapHandler);
    } else if (xhr.readyState === 4) {
      return alert("Something went wrong. Error" + xhr.status);
    }
  };

  handleNewRoute = function(mapHandler, routes) {
    if (!mapHandler.map) {
      mapHandler.initializeMap();
    }
    mapHandler.singleNewRoute(routes);
    return $("#map-canvas").show();
  };

  fillFormFields = function(routeId, mapHandler) {
    var startTime;
    $('#id_route_id').val(routeId);
    if ($('#id_distance').val() === '') {
      $('#id_distance').val(mapHandler.distance.toFixed(2));
    }
    if (!mapHandler.startTime) {
      return;
    }
    if ($('#id_duration_hours').val() === '0' && $('#id_duration_mins').val() === '0' && $('#id_duration_secs').val() === '0') {
      startTime = moment.tz(mapHandler.startTime._d, "Europe/Warsaw");
      startTime.add('minutes', -startTime.zone());
      $('#id_datetime_start').val(startTime.format('DD-MM-YYYY'));
      $('#id_time_start').val(startTime.format('HH:mm:ss'));
      $('#id_duration_hours').val(mapHandler.duration.hours());
      $('#id_duration_mins').val(mapHandler.duration.minutes());
      return $('#id_duration_secs').val(mapHandler.duration.seconds());
    }
  };

  displayRelatedRoute = function(routeId, url, mapHandler) {
    return $.ajax({
      url: url,
      data: {
        'route_id': routeId
      },
      success: function(data, textStatus, jqXHR) {
        return handleNewRoute(mapHandler, JSON.parse(data['route']));
      },
      dataType: 'json'
    });
  };

  bindManualRouteSwitch = function(mapHandler) {
    return $('#route-drawing-switch').on('click', function() {
      if (!mapHandler.map) {
        mapHandler.initializeMap();
        $("#map-canvas").show();
      }
      return mapHandler.toggleManualRouteDrawing();
    });
  };

  bindSaveManualRoute = function(mapHandler) {
    var $saveRouteButton;
    $saveRouteButton = $('#manual-route-save');
    return $saveRouteButton.on('click', function() {
      var data, routeData;
      routeData = mapHandler.getRouteDataFromMap();
      data = {
        'tracks': JSON.stringify(routeData),
        'csrfmiddlewaretoken': $.cookie('csrftoken')
      };
      return $.ajax({
        url: $saveRouteButton.data('url'),
        data: data,
        dataType: "json",
        type: "POST",
        timeout: 5000,
        success: function(data, textStatus, jqXHR) {
          var routeId, routes;
          routeId = data['id'];
          routes = JSON.parse(data['tracks']);
          handleNewRoute(mapHandler, routes);
          return fillFormFields(routeId, mapHandler);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          return alert("Ups...\nNie udało się zapisać trasy.\n" + textStatus + " - " + errorThrown);
        }
      });
    });
  };

  setMapHandlerControls = function(mapHandler) {
    var controls;
    controls = {
      container: $('#map-controls'),
      distanceDisplay: $('#map-total-distance'),
      useDirectionsControl: $('#use-google-directions'),
      travelModeControl: $('#travel-mode-select'),
      googleWarningsDisplay: $('#google-warnings')
    };
    return mapHandler.controls = controls;
  };

  main = function() {
    var mapCanvas, mapHandler, routeId;
    mapCanvas = $('#map-canvas');
    if (mapCanvas[0]) {
      mapHandler = new RoutesMapHandler();
      bindToFileInputChange(mapHandler);
      bindManualRouteSwitch(mapHandler);
      bindSaveManualRoute(mapHandler);
      routeId = mapCanvas.data('route-id');
      if (routeId) {
        displayRelatedRoute(routeId, mapCanvas.data('url'), mapHandler);
      } else {
        mapCanvas.hide();
      }
      return setMapHandlerControls(mapHandler);
    }
  };

  $(function() {
    return main();
  });

}).call(this);
