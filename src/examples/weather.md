---
title: Weather Tool
parent: Examples
layout: home
permalink: /examples/weather
nav_order: 10
---
### Weather tool
Lets define a tool by creating `weather.tool.js`
the `.tool` extension tells Tune that it is a tool.
```javascript
module.exports = async function({ location }, ctx) {
  // lets use openweathermap.org api 
  const api_key = process.env.OPENWEATHER_KEY 
  let result = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${api_key}`);
  result = await result.json();
  const {lat, lon} = result[0];

  result = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric`)
  return await result.json()
}
```

A tool requires a json schema, for weather tool the schema should be kept in
`weather.schema.json` file
```json
{
  "description": "get weather using openweathermap",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "Location for the weather forecast"
      }
    },
    "required": ["location"]
  }
}
```
If there is no schema Tune will try to genereate the schema based on code

```chat
s: @weather
u: whats the weather in amsterdam?
tc: weather {"location":"Amsterdam"}
tr: {
  coord: { lon: 4.8897, lat: 52.374 },
  weather: [
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }
  ],
  base: 'stations',
  main: {
    temp: 1.15,
    feels_like: -2.59,
    temp_min: 0.48,
    temp_max: 2.16,
    pressure: 1025,
    humidity: 74,
    sea_level: 1025,
    grnd_level: 1025
  },
  visibility: 10000,
  wind: { speed: 3.6, deg: 60 },
  clouds: { all: 20 },
  dt: 1739794181,
  sys: {
    type: 2,
    id: 2012552,
    country: 'NL',
    sunrise: 1739775145,
    sunset: 1739811405
  },
  timezone: 3600,
  id: 2759794,
  name: 'Amsterdam',
  cod: 200
}
```
