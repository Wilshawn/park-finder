import { Component } from '@angular/core';
import {} from 'googlemaps';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'PARK LOCATOR';
  subtitle = 'A Page Where You Can Locate Parks...';

  usMapProps = {
    center: {lat: 37.1, lng: -95.7},
    zoom: 4
  };

  searchBarProps = {
    // types: ['(cities)'],
    componentRestrictions: {country: 'us'}
  };

  selectSearch = document.getElementById('autocomplete') as HTMLInputElement;

  ngOnInit() {

    let markers = [];

    // Create Google Map Object
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: this.usMapProps.zoom,
      center: this.usMapProps.center,
      mapTypeControl: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false
    });

    // Create Info Window Object
    const infoWindow = new google.maps.InfoWindow({
      content: document.getElementById('info-content')
    });

    // Create Autocomplete Object, restrict search to US
    const autocomplete = new google.maps.places.Autocomplete(document.getElementById('autocomplete') as HTMLInputElement, {
      // types: this.searchBarProps.types,
      componentRestrictions: this.searchBarProps.componentRestrictions
    });

    // Create Places Object
    const places = new google.maps.places.PlacesService(map);

    autocomplete.addListener('place_changed', onPlaceChanged);

   // Get Place and Search Parks When Address is Selected
    function onPlaceChanged() {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
        search();
      } else {
        this.selectSearch.placeholder = 'Enter An Address';
      }
    }

    // Drop Markers for nearby Parks in Area
    function search() {
      const search = {
        bounds: map.getBounds(),
        types: ['park']
      };

      places.nearbySearch(search, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          clearResults();
          clearMarkers();

          for (let i = 0; i < results.length; i++) {
            // Use marker animation to drop the icons incrementally on the map.
            markers[i] = new google.maps.Marker({
              position: results[i].geometry.location,
              animation: google.maps.Animation.DROP,
            });

            // If the user clicks a park marker, show the details of that park
            // in an info window.
            markers[i].placeResult = results[i];
            google.maps.event.addListener(markers[i], 'click', showInfoWindow);
            setTimeout(dropMarker(i), i * 100);
            addResult(results[i], i);
          }
        }
      });

      function clearMarkers() {
        for (let i = 0; i < markers.length; i++) {
          if (markers[i]) {
            markers[i].setMap(null);
          }
        }
        markers = [];
      }

      function clearResults() {
        const results = document.getElementById('results');
        while (results.childNodes[0]) {
          results.removeChild(results.childNodes[0]);
        }
      }

      function dropMarker(i) {
        return ()  => {
          markers[i].setMap(map);
        };
      }

      // Create and style sidebar Listings
      function addResult(result, i) {

        const noneFound = document.getElementById('noneFound');
        noneFound.style.display = 'none';

        const listing = document.createElement('div');
        listing.style.backgroundColor = '#F0F0F0';
        listing.style.padding = '10px 20px';
        listing.style.borderTop = '1px solid #dbdbdb';
        listing.setAttribute('class', 'resultListing');
        listing.onclick = () => {
          google.maps.event.trigger(markers[i], 'click');
        };

        const resultName = document.createElement('h4');
        resultName.setAttribute('class', 'resultListingName');

        const addressSmall = document.createElement('small');
        const name = document.createTextNode(result.name);
        const address = document.createTextNode(result.vicinity);

        resultName.appendChild(name);
        addressSmall.appendChild(address);
        listing.appendChild(resultName);
        listing.appendChild(addressSmall);

        const results = document.getElementById('results');
        results.appendChild(listing);

        listing.addEventListener('mouseover', (event) => {
          listing.style.backgroundColor = '#d9d9d9';
        });

        listing.addEventListener('mouseout', (event) => {
          listing.style.backgroundColor = '';
        });
      }

      // Get the place details for a park. Show the information in an info window,
      // anchored on the marker for the park that the user selected.
      function showInfoWindow() {
      const marker = this;
      places.getDetails({placeId: marker.placeResult.place_id},
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return;
          }
          infoWindow.open(map, marker);
          buildIWContent(place);
        });
      }

       // Load the place information into the HTML elements used by the info window.
      function buildIWContent(place) {
        document.getElementById('iw-icon').innerHTML = '<img class="parkIcon" ' + 'src="' + place.icon + '"/>';
        document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url + '">' + place.name + '</a></b>';
        document.getElementById('iw-address').textContent = place.vicinity;

        if (place.formatted_phone_number) {
          document.getElementById('iw-phone-row').style.display = '';
          document.getElementById('iw-phone').textContent = place.formatted_phone_number;
        } else {
          document.getElementById('iw-phone-row').style.display = 'none';
        }

        // Assign a five-star rating to the park, using a black star ('&#10029;')
        // to indicate the rating the park has earned, and a white star ('&#10025;')
        // for the rating points not achieved.
        if (place.rating) {
          let ratingHtml = '';
          for (let i = 0; i < 5; i++) {
            if (place.rating < (i + 0.5)) {
              ratingHtml += '&#10025;';
            } else {
              ratingHtml += '&#10029;';
            }
            document.getElementById('iw-rating-row').style.display = '';
            document.getElementById('iw-rating').innerHTML = ratingHtml;
          }
        } else {
          document.getElementById('iw-rating-row').style.display = 'none';
        }

        if (place.website) {
          const fullUrl = place.website;
          document.getElementById('iw-website-row').style.display = '';
          document.getElementById('iw-website').textContent = fullUrl;
        } else {
          document.getElementById('iw-website-row').style.display = 'none';
        }
      }
    }
  }
}
