###!
Google Maps integration for YAG gallery
@author Sebastian Helzle (sebastian@helzle.net)
###
(($) ->

  # Global list of all initialized maps
  yagGoogleMaps = []

  # List of callbacks waiting for the api
  loaderCallbacks = []
  librariesLoading = false

  # Some global vars for the plugin
  selectedDestinationAddress = ''

  # Default options for the map plugin
  defaultMapOptions =
    mapOptions:
      zoom: 14
      streetViewControl: false
      mapTypeControl: false
      panControl: false
    data: {}
    cluster: true
    langCode: 'de'
    startAddress: ''
    dropAnimation: false
    showAllMarkers: true
    showFirstMarkerOnStart: true
    showRouteToLink: true
    useAddressForRouteUrl: true
    width: 400
    height: 400
    center:
      lat: 49.02
      lng: 8.4
    clusterStyles: [{
      url: '/_Resources/Static/Packages/DL.Gallery.Map/Images/cluster.png'
      width: 36
      height: 36
      anchor: [8, 0]
      textColor: '#fff'
      textSize: 14
    }]
    infoBoxOptions:
      boxClass: 'yag-gmaps-infowindow'
      alignBottom: true
      closeBoxURL: '/_Resources/Static/Packages/DL.Gallery.Map/Images/close.png'
      closeBoxMargin: '-12px'
      enableEventPropagation: true
      pixelOffset:
        width: 15
        height: -25

  # Will later hold the SimpleMarker class after loading the gmaps api
  SimpleMarker = undefined

  # Will later hold the InfoBox class after loading the gmaps api
  InfoBox = undefined

  class YagGoogleMap
    constructor: (@$mapObj, @options) ->
      @infoWindow = undefined
      @markers = []

      # Load some default into map options
      @options.mapOptions = $.extend true, {}, @options.mapOptions,
        center: new google.maps.LatLng(@options.center.lat, @options.center.lng)
        mapTypeId: google.maps.MapTypeId.HYBRID

      # Set map size
      @$mapObj.css
        width: @options.width
        height: @options.height

      # Store reference to class in data attribute
      @$mapObj.data 'api', @

      # Create map
      @map = new google.maps.Map(@$mapObj[0], @options.mapOptions)

      # Create a marker for each data entry
      for dataEntry in @options.data
        # Store marker if coordinates are sane
        if Math.abs(dataEntry.latitude) <= 90 and Math.abs(dataEntry.longitude) <= 180
          @markers.push @createMapMarker(dataEntry)

      # Create clusters
      @markerCluster = new MarkerClusterer @map, @markers,
        gridSize: 40
        maxZoom: options.mapOptions.zoom
        styles: options.clusterStyles

      # Zoom to show all markers
      @showAllMarkers() if @options.showAllMarkers and @markers.length > 1

      if @markers.length is 1
        @map.setCenter @markers[0].position

      # Show first marker info window if set
      if @options.showFirstMarkerOnStart and @markers.length
        @showInfoWindow null, @markers[0]

      # Click event for info window route to links
      $(@$mapObj).delegate '.routeToLink', 'click', (e) =>
        e.preventDefault()

        # Create start string
        startAddress = if typeof @options.startAddress is 'function' then @options.startAddress() else @options.startAddress
        start = encodeURI startAddress

        # Open maps window in new location
        window.open "https://maps.google.com/?saddr=#{start}&daddr=#{selectedDestinationAddress}"

    ###
    Show a single marker info window
    ###
    showMarker: (id) =>
      for marker in @markers when marker.ptAdditionalData.dataId is id
        return @showInfoWindow null, marker

    ###
    Method for zooming the map to show all markers
    ###
    showAllMarkers: =>
      bounds = new google.maps.LatLngBounds()
      bounds.extend(marker.position) for marker in @markers

      @map.fitBounds bounds

    ###
    Method for initializing a new map marker
    ###
    createMapMarker: (markerData) =>
      markerOptions =
        title: markerData.title
        image: markerData.icon
        classname: 'yag-gmaps-marker'

      markerPosition = new google.maps.LatLng markerData.latitude, markerData.longitude

      # Add drop animation if set
      if @options.dropAnimation
        markerOptions.animation = google.maps.Animation.DROP

      #marker = new google.maps.Marker markerOptions
      marker = new SimpleMarker @map, markerPosition, markerOptions
      marker.ptAdditionalData = markerData
      marker.position = markerPosition

        # Add event listeners to map
      google.maps.event.addListener marker, 'click', (e) =>
        @showInfoWindow e, marker

      marker

    ###
    Method for showing an info window
    ###
    showInfoWindow: (e, marker) =>
      unless @infoWindow
        @infoWindow = new InfoBox @options.infoBoxOptions

      # Create html for info window
      data = marker.ptAdditionalData

      # Create destination string
      destination = ''
      if @options.useAddressForRouteUrl
        # Use the escaped address string for better readability
        destination += encodeURI "#{data.address},#{data.zip} #{data.city},#{data.country}"
      else
        # Use latitude and longitude
        destination += "#{data.latitude},#{data.longitude}"

      # Store destination
      selectedDestinationAddress = destination

      # Add basic location information
      infoHtml = ''

      if data.title
        infoHtml += "<span class=\"gmaps-title\">#{data.title}</span>"

      # Add marker content
      if data.markerContent
        infoHtml += "<div class=\"gmaps-marker-content\">#{data.markerContent}</div>"

      # Add link to google maps route
      if @options.showRouteToLink
        infoHtml += "<p><a class='routeToLink' href='#' target='_blank'>Route anzeigen</a></p>"

      # Show info window
      @infoWindow.setContent infoHtml
      @infoWindow.open @map, marker

  ###
  Function for loading the google maps api async
  Calls initializeYagGoogleMap when script has been loaded
  ###
  loadScript = (options, callback) ->
    return unless window.google

    loaderCallbacks.push callback

    if not librariesLoading
      if google.maps
        runCallbacks()
      else
        librariesLoading = true
        google.load 'maps', '3.7',
          'other_params': "sensor=false&key=AIzaSyCCJ8oGNDlTqRTJSJLbyRhlTwgva6G4igM&&libraries=places&language=#{options.langCode}"
          'callback': ->
            librariesLoading = false
            runCallbacks()

  ###
  Function for calling all callbacks which were requested during loading of the libs
  ###
  runCallbacks = ->
    loaderCallback = null
    while loaderCallback = loaderCallbacks.pop()
      loaderCallback()

  ###
  Register jQuery plugin
  ###
  $.fn.yagGoogleMap = (options, idx=undefined) ->
    # Call plugin for each element separately
    if @length > 1
      @each ->
        $(@).yagGoogleMap options
      return @

    return @ if @length is 0

    $self = $ @

    if typeof options is 'string'
      switch options
        when 'showMarker' then $self.data('api').showMarker idx

      return @

    options = $.extend true, {}, defaultMapOptions, options

    # Load script if necessary and create map when it's done
    loadScript options, ->
      SimpleMarker = initSimpleMarkerClass() unless SimpleMarker
      InfoBox = initInfoBoxClass() unless InfoBox

      yagGoogleMaps.push new YagGoogleMap($self, options)

    # Return jQuery object for chaining
    return @

)(jQuery)
