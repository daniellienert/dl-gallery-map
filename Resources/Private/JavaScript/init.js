(function ($) {
    /**
     * Gmaps initialization function
     */
    function initGmaps($selector, settings) {
        var serviceData = [], i, itemData, currentItem, itemsPerColumn = 4,
            longitude, latitude, locationHash,
            listData = $selector.data('images'),
            itemLength = listData.length,
            itemGroupId, itemGroup, itemGroups = {}, markerContent, markerTitle;

        // Check for items on the same position
        for (i = 0; i < itemLength; i++) {
            itemData = listData[i];
            locationHash = (itemData.gpsLongitude + '-' + itemData.gpsLatitude).replace(/\./g, '-');
            if (!itemGroups[locationHash]) itemGroups[locationHash] = [];
            itemGroups[locationHash].push(i);
        }

        // Create markers and groups
        for (itemGroupId in itemGroups) {
            itemGroup = itemGroups[itemGroupId];
            itemData = listData[itemGroup[0]];
            try {
                longitude = parseFloat(itemData.gpsLongitude);
                latitude = parseFloat(itemData.gpsLatitude);
            } catch (e) {
                longitude = latitude = 0;
            }

            if (longitude != 0 && latitude != 0) {
                if (itemGroup.length > 1) {
                    // Create single groupmarker for multiple items
                    markerContent = '<div class="yag-gmaps-item-group" style="width:' + itemData.markerWidth * Math.min(itemGroup.length, itemsPerColumn) + 'px;">';
                    markerTitle = '';
                    for (i = 0; i < itemGroup.length; i++) {
                        currentItem = listData[itemGroup[i]];
                        markerContent += '<a class="yag-gmaps-item-link" rel="gmaps-lightbox-' + itemGroupId + '" href="' +
                            currentItem.lightbox + '" title="' + currentItem.title + '">' +
                            '<img width="' + currentItem.markerWidth + '" height="' + currentItem.markerHeight +
                            '" src="' + currentItem.marker + '" alt="' + currentItem.title + '" /></a>';
                    }
                    markerContent += '</div>';
                } else {
                    // Create single marker for one item
                    markerTitle = itemData.title;
                    markerContent = '<a class="yag-gmaps-item-link" href="' + itemData.lightbox + '" title="' +
                        itemData.title + '">' +
                        '<img width="' + itemData.thumbWidth + '" height="' + itemData.thumbHeight +
                        '" src="' + itemData.thumb + '" alt="' + itemData.title + '" />' +
                        '</a><p>' + itemData.description + '</p>';
                }

                serviceData.push({
                    dataId: itemGroupId,
                    title: markerTitle,
                    latitude: longitude,
                    longitude: latitude,
                    icon: itemData.marker,
                    markerContent: markerContent
                });
            }
        }

        if (settings.lightbox) {
            $selector.on('click', '.yag-gmaps-item-link', function (e) {
                e.preventDefault();
                $(this).parent().children('.yag-gmaps-item-link').colorbox({
                    open: true,
                    maxWidth: '90%',
                    maxHeight: '90%'
                });
            });
        }

        $selector
            .css({
                width: settings.width,
                height: settings.height
            })
            .yagGoogleMap($.extend({data: serviceData}, settings.gmaps));
    }

    $(function () {
        $('.dl-gallery-map').each(function () {
            var $self = $(this), settings = $self.data('dl-gallery-settings');
            initGmaps($self, settings);
        });
    });
})(jQuery);
