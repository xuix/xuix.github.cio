'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`; //get month returns a 0 based numbers
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    return (this.pace = this.duration / this.distance);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    return (this.speed = this.distance / (this.duration / 60));
  }
}
const run1 = new Running([39, -12], 5.2, 24, 178);
const Cycling1 = new Cycling([39, -12], 27, 95, 523);

console.log('run1=', run1);
console.log('Cycling1=', Cycling1);
///////////////////////////////////////////////////////////////
// Application Architecture

class App {
  map;
  mapEvent;
  mapZoomLevel = 13;
  workouts = [];

  constructor() {
    //Get user's position
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage();

    form.addEventListener('submit', e => this._newWorkout(e));
    inputType.addEventListener('change', () => this._toggleElevationField());
    containerWorkouts.addEventListener('click', e => this._moveToPopup(e));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      position => {
        this._loadMap(position);
      },
      err => {
        console.log('could not get your posion', err);
      }
    );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log('position=', latitude, longitude);
    console.log(
      '=map',
      `https://www.google.co.uk/maps/@${latitude},${longitude},14z`
    );
    let coords = [latitude, longitude];
    this.map = L.map('map').setView(coords, this.mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // on is a method that comes from the leaflet library, not native javascript
    this.map.on('click', mapE => this._showForm(mapE));
    //display the marker (whick were loaded from local storage)
    // need  to do this after the map has been displayed
    this.workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    //  We need the mapEvent in the addEventlistener below, so copy it to the global scope
    this.mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(mapE) {
    //  We need the mapEvent in the addEventlistener below, so copy it to the global scope
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';
    this.mapEvent = mapE;
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    //helper functions
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.mapEvent.latlng;
    let workout;

    //if workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duratation) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        //Check if data is valid
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.workouts.push(workout);
    console.log('this.workouts=', this.workouts);

    //Add the new object to the workout array

    //Render the workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on the list
    this._renderWorkout(workout);

    //  Clear Input fields
    this._hideForm();
    //Display Marker

    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    //Display Marker

    console.log('=`${workout.type}-popup`=', `${workout.type}-popup`);
    L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          // classname from CSS
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴‍♀'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}"
                   data-id="${workout.id}">
                    <h2 class="workout__title">${workout.description}</h2>
                    <div class="workout__details">
                    <span class="workout__icon">${
                      workout.type === 'running' ? '🏃' : '🚴‍♀'
                    }</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.pace.toFixed(1)}</span>
                  <span class="workout__unit">min/km</span>
               </div>
               <div class="workout__details">
                  <span class="workout__icon">🦶🏼</span>
                  <span class="workout__value">${workout.cadence}</span>
                  <span class="workout__unit">spm</span>
                </div>
              </li>`;
    }

    if (workout.type === 'cycling') {
      html += ` <div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.speed.toFixed(
                    1
                  )}</span>
                  <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⛰</span>
                  <span class="workout__value">${workout.elevationGain}</span>
                  <span class="workout__unit">m</span>
                </div>
            </li> `;
    }
    console.log('html=', html);
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.map.setView(workout.coords, this.mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
    console.log('workout=', workout);
    //  workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    //restore the workouts array from the data
    this.workouts = data;
    this.workouts.forEach(work => this._renderWorkout(work));
  }
  //method to be used in console....   app.reset()
  reset() {
    localStorage.removeItem('workouts');
    //reload the page
    location.reload();
  }
}

const app = new App();
