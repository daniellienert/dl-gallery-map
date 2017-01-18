
/*!
Google Maps integration for YAG gallery
@author Sebastian Helzle (sebastian@helzle.net)
 */

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function($) {
    var InfoBox, SimpleMarker, YagGoogleMap, defaultMapOptions, librariesLoading, loadScript, loaderCallbacks, runCallbacks, selectedDestinationAddress, yagGoogleMaps;
    yagGoogleMaps = [];
    loaderCallbacks = [];
    librariesLoading = false;
    selectedDestinationAddress = '';
    defaultMapOptions = {
      mapOptions: {
        zoom: 14,
        streetViewControl: false,
        mapTypeControl: false,
        panControl: false,
        scrollwheel: false,
        draggable: false
      },
      data: {},
      cluster: true,
      langCode: 'de',
      startAddress: '',
      dropAnimation: false,
      showAllMarkers: true,
      showFirstMarkerOnStart: true,
      showRouteToLink: true,
      useAddressForRouteUrl: true,
      width: 400,
      height: 400,
      center: {
        lat: 49.02,
        lng: 8.4
      },
      clusterStyles: [
        {
          url: '/_Resources/Static/Packages/DL.Gallery.Map/Images/cluster.png',
          width: 38,
          height: 38,
          anchor: [8, 0],
          textColor: '#fff',
          textSize: 14
        }
      ],
      infoBoxOptions: {
        boxClass: 'dl-gallery-map-info',
        alignBottom: true,
        closeBoxURL: '/_Resources/Static/Packages/DL.Gallery.Map/Images/close.png',
        closeBoxMargin: '-12px',
        enableEventPropagation: true,
        pixelOffset: {
          width: 15,
          height: -25
        }
      }
    };
    SimpleMarker = void 0;
    InfoBox = void 0;
    YagGoogleMap = (function() {
      function YagGoogleMap($mapObj, options) {
        var dataEntry, i, len, ref;
        this.$mapObj = $mapObj;
        this.options = options;
        this.showInfoWindow = bind(this.showInfoWindow, this);
        this.createMapMarker = bind(this.createMapMarker, this);
        this.showAllMarkers = bind(this.showAllMarkers, this);
        this.showMarker = bind(this.showMarker, this);
        this.infoWindow = void 0;
        this.markers = [];
        this.options.mapOptions = $.extend(true, {}, this.options.mapOptions, {
          center: new google.maps.LatLng(this.options.center.lat, this.options.center.lng),
          mapTypeId: google.maps.MapTypeId.HYBRID
        });

        this.$mapObj.data('api', this);
        this.map = new google.maps.Map(this.$mapObj[0], this.options.mapOptions);
        ref = this.options.data;
        for (i = 0, len = ref.length; i < len; i++) {
          dataEntry = ref[i];
          if (Math.abs(dataEntry.latitude) <= 90 && Math.abs(dataEntry.longitude) <= 180) {
            this.markers.push(this.createMapMarker(dataEntry));
          }
        }
        this.markerCluster = new MarkerClusterer(this.map, this.markers, {
          gridSize: 40,
          maxZoom: options.mapOptions.zoom,
          styles: options.clusterStyles
        });

        if (this.options.showAllMarkers && this.markers.length > 1) {
          this.showAllMarkers();
        }
        if (this.markers.length === 1) {
          this.map.setCenter(this.markers[0].position);
        }
        if (this.options.showFirstMarkerOnStart && this.markers.length) {
          this.showInfoWindow(null, this.markers[0]);
        }
        $(this.$mapObj).delegate('.routeToLink', 'click', (function(_this) {
          return function(e) {
            var start, startAddress;
            e.preventDefault();
            startAddress = typeof _this.options.startAddress === 'function' ? _this.options.startAddress() : _this.options.startAddress;
            start = encodeURI(startAddress);
            return window.open("https://maps.google.com/?saddr=" + start + "&daddr=" + selectedDestinationAddress);
          };
        })(this));
      }


      /*
      Show a single marker info window
       */

      YagGoogleMap.prototype.showMarker = function(id) {
        var i, len, marker, ref;
        ref = this.markers;
        for (i = 0, len = ref.length; i < len; i++) {
          marker = ref[i];
          if (marker.ptAdditionalData.dataId === id) {
            return this.showInfoWindow(null, marker);
          }
        }
      };


      /*
      Method for zooming the map to show all markers
       */

      YagGoogleMap.prototype.showAllMarkers = function() {
        var bounds, i, len, marker, ref;
        bounds = new google.maps.LatLngBounds();
        ref = this.markers;
        for (i = 0, len = ref.length; i < len; i++) {
          marker = ref[i];
          bounds.extend(marker.position);
        }
        return this.map.fitBounds(bounds);
      };


      /*
      Method for initializing a new map marker
       */

      YagGoogleMap.prototype.createMapMarker = function(markerData) {
        var marker, markerOptions, markerPosition;
        markerOptions = {
          title: markerData.title,
          image: markerData.icon,
          classname: 'dl-gallery-map-marker'
        };
        markerPosition = new google.maps.LatLng(markerData.latitude, markerData.longitude);
        if (this.options.dropAnimation) {
          markerOptions.animation = google.maps.Animation.DROP;
        }
        marker = new SimpleMarker(this.map, markerPosition, markerOptions);
        marker.ptAdditionalData = markerData;
        marker.position = markerPosition;
        google.maps.event.addListener(marker, 'click', (function(_this) {
          return function(e) {
            return _this.showInfoWindow(e, marker);
          };
        })(this));
        return marker;
      };


      /*
      Method for showing an info window
       */

      YagGoogleMap.prototype.showInfoWindow = function(e, marker) {
        var data, destination, infoHtml;
        if (!this.infoWindow) {
          this.infoWindow = new InfoBox(this.options.infoBoxOptions);
        }
        data = marker.ptAdditionalData;
        destination = '';
        if (this.options.useAddressForRouteUrl) {
          destination += encodeURI(data.address + "," + data.zip + " " + data.city + "," + data.country);
        } else {
          destination += data.latitude + "," + data.longitude;
        }
        selectedDestinationAddress = destination;
        infoHtml = '';
        if (data.title) {
          infoHtml += "<span class=\"dl-gallery-map-title\">" + data.title + "</span>";
        }
        if (data.markerContent) {
          infoHtml += "<div class=\"gmaps-marker-content\">" + data.markerContent + "</div>";
        }
        if (this.options.showRouteToLink) {
          infoHtml += "<p><a class='routeToLink' href='#' target='_blank'>Route anzeigen</a></p>";
        }
        this.infoWindow.setContent(infoHtml);
        return this.infoWindow.open(this.map, marker);
      };

      return YagGoogleMap;

    })();

    /*
    Function for loading the google maps api async
    Calls initializeYagGoogleMap when script has been loaded
     */
    loadScript = function(options, callback) {
      if (!window.google) {
        return;
      }
      loaderCallbacks.push(callback);
      if (!librariesLoading) {
        if (google.maps) {
          return runCallbacks();
        } else {
          librariesLoading = true;
          return google.load('maps', '3.7', {
            'other_params': "sensor=false&key=AIzaSyCCJ8oGNDlTqRTJSJLbyRhlTwgva6G4igM&&libraries=places&language=" + options.langCode,
            'callback': function() {
              librariesLoading = false;
              return runCallbacks();
            }
          });
        }
      }
    };

    /*
    Function for calling all callbacks which were requested during loading of the libs
     */
    runCallbacks = function() {
      var loaderCallback, results;
      loaderCallback = null;
      results = [];
      while (loaderCallback = loaderCallbacks.pop()) {
        results.push(loaderCallback());
      }
      return results;
    };

    /*
    Register jQuery plugin
     */
    return $.fn.yagGoogleMap = function(options, idx) {
      var $self;
      if (idx == null) {
        idx = void 0;
      }
      if (this.length > 1) {
        this.each(function() {
          return $(this).yagGoogleMap(options);
        });
        return this;
      }
      if (this.length === 0) {
        return this;
      }
      $self = $(this);
      if (typeof options === 'string') {
        switch (options) {
          case 'showMarker':
            $self.data('api').showMarker(idx);
        }
        return this;
      }
      options = $.extend(true, {}, defaultMapOptions, options);
      loadScript(options, function() {
        if (!SimpleMarker) {
          SimpleMarker = initSimpleMarkerClass();
        }
        if (!InfoBox) {
          InfoBox = initInfoBoxClass();
        }
        return yagGoogleMaps.push(new YagGoogleMap($self, options));
      });
      return this;
    };
  })(jQuery);

}).call(this);
