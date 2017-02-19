function gps(selector, options){
    var self = document.querySelector(selector);
    if (self.mounted) return self;

    var optionsDefault = {
      gmapsOptions: {//api: http://goo.gl/x3h6o3
        //types: ['geocode','(regions)','(cities)', 'establishment']
      },
      valueFormat: ['route','sublocality| - ','locality','administrative_area_level_1'],
      addressFormat: undefined,
      pin: {
        show: true,
        assigned: {
          pinTitle: 'Click to open on Google Maps.',
          pinImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAABBUlEQVQ4jZXTTyuEURQG8F9T/mzGNCjh4yghG8N3MDtZKd+ApfJ12GomZIVEKDakZMHGvBZz3rwz7jt46nTuuc95ntu573v5iWE00cZLRAvrGEr092AWJ8hK4hgzZeJRnEXjHRqYjFjBVXCnGEkZbBbE9QRfx330bKQM2kE2ol7GDa6xFHtr0XOUMngLshp1flqG29irRf2aiyoFg07kLMFV+rhOPwGXkeciN/GIh1jDfOSL1AjbccK59CWO+x5rK2UwjQ+9n7GKMawWxO+YShnAvvKfKI+9MjFM4HmA+ClGGYhF3VvuF39i4Tdxjt2Ewc5fxXRf5GFBfBB7/0JN9xm3Yp3EF8CeW3oneDAyAAAAAElFTkSuQmCC'
        },
        unassigned: {
          pinTitle: 'Location not assigned.',
          pinImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAACE0lEQVQ4jY2QQWsTURSFv5dMm2xCQFwILoqhIIolJDMpxKAU3WqxQqDoyh8gIhUXVsSNUKobK/QP1J2ICxXqwpWU0sKbgWI2GhzqQqgUoUToi9N5181MmaZFvKv7zj3nvHuuYqBGR0cL5XL5NnATGEngTeClMeZFp9P5k+Wr7KNarZ50HOetiHwDnkdR9BnAcZyxfD5/R0RGrLWTQRD8OGQwMTFR7PV6a8CS1vpZug1At9vtA3ied19Epnd2dpoptm/ged5dEbmktb7aarVKxphZYDsZHy8Wi09WVlZ6ruu+Bz5orRcAnEyCG9baGQBjzL3h4eH51dXVXwDNZvNYv9+fAR4rpZ6KyBywAJBL1SJyJo5jnfQ2FQNk+0KhoIGz6XvfAJBSqZQDUEpl8fQDBbC3t3fg8FniV2NM6rxVq9Wa6aDRaJwHtgCsteeAL+kse4NlYApY01ov1uv1W57nXQGI47jr+/5issk1EVlORfvrjI+Pn4rj2I+i6PTGxsbPwQgAruuWga611guCYPNAhPX19RB4NTQ09OAocVKPROR1Kh68AdbaWeB6kvlA1ev1C0BbKfUwi6tBYq1Wu5jL5ZYAV2u9DdBoNE5Ya7WITPu+/+mfBknWOWCsUqlMAoRh+E5EAq31oXhHGrTb7XwYhm+A70Bkra34vj8F2P8yAGi1WqXd3d2PSikxxlzudDq/j+L9BaBN8gpKSjbcAAAAAElFTkSuQmCC'
        }
      }
    }
    self.mount = function(){
      self.options = Object.assign({},optionsDefault, options);
      self.style.cssText += "padding-right: 20px;";

      //pin
      if(this.options.pin.show){
        self.insertAdjacentHTML('afterend', "<pin class='gps-pin' />");
        self.pin = document.querySelector('pin.gps-pin');
        self.pin.style.cssText += "position: absolute;";
        var left = self.offsetLeft + self.offsetWidth - 18;
        var top = self.offsetTop + ((self.offsetHeight - 16) / 2);
        self.pin.style.cssText += "left: " + left +";";
        self.pin.style.cssText += "top: " + top +";";
        self.pin.style.cssText += "height: 16px;";
        self.pin.style.cssText += "width: 16px;";
        self.pin.style.cssText += "cursor: pointer;";

        self.pin.addEventListener("click", function(e) {
          if(self.setted()){
            window.open(self.googlePlace.url,'_blank');
          }
        }, false);
        self.addEventListener("input", function(e) {
          if(this.setted()){
            this.set();
          }
        }, false);
      }

      //google autocomplete
      self.gmapsAutocomplete = new google.maps.places.Autocomplete(self, self.options.gmapsOptions);
      self.gmapsAutocomplete.gps = self;
      google.maps.event.addListener(self.gmapsAutocomplete, 'place_changed', function(){
        this.gps.set(this.getPlace());
      });

      self.set();
      self.mounted = true;
    };

    self.set = function(googlePlace){
      this.gps = {
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        bounds: undefined
      };
      this.googlePlace = googlePlace;
      if(googlePlace){
        this.value = this.format(googlePlace, this.options.valueFormat);
        var location = googlePlace.geometry.location;
        var viewport = this.googlePlace.geometry.viewport;
        var bounds;
        if (viewport) {
          bounds = {
            southWest :{
              latitude: viewport.getSouthWest().lat(),
              longitude: viewport.getSouthWest().lng()
            },
            northEast :{
              latitude: viewport.getNorthEast().lat(),
              longitude: viewport.getNorthEast().lng()
            }
          }
        }
        this.gps = {
          address: this.format(googlePlace, this.options.addressFormat),
          latitude: location.lat(),
          longitude: location.lng(),
          bounds: bounds
        }
      }
      this.togglePin(googlePlace ? true : false);
    }

    self.format = function(googlePlace, format) {
      if(format == undefined) return googlePlace.formatted_address;

      var formatting = "";
      format.forEach(function(form){
        var formSplitted = form.split('|');
        var addressComponent = googlePlace.address_components.find(function(component){
          return component.types.some(function(type){
             return type == formSplitted[0];
          });
        });
        if (addressComponent) {
          var name = formSplitted[2] ? addressComponent.long_name : addressComponent.short_name;
          var division = formSplitted[1] || ', ';
          if(format.indexOf(form) == format.length - 1)
              division = "";
          formatting += name + division;
        }
      });
      return formatting;
    }

    self.togglePin = function(state){
      if(!this.options.pin.show) return;

      var pinImage, pinTitle;

      if (state){
        pinImage = this.options.pin.assigned.pinImage;
        pinTitle = this.options.pin.assigned.pinTitle;
      }
      else{
        pinImage = this.options.pin.unassigned.pinImage;
        pinTitle = this.options.pin.unassigned.pinTitle;
      }
      this.pin.style.cssText += "background: no-repeat url("+pinImage+")";
      this.pin.setAttribute('title', pinTitle);
    }

    self.setted = function(){
      return this.googlePlace !== undefined;
    }
    self.boundsAssigned = function(){
      return this.assigned() && this.gps.bounds !== undefined;
    }
    self.mount();
    return self;
}
