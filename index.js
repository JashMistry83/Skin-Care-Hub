import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();

//Backend API key
const ApiKEY = "openuv-imttrmea38ffx-io";

//Location cordinates API key
const LocationApiKey = "b5eee95455574df0bee2a55c2a18666a";

//Location cordinates API endpoint
const LocationBaseURL = "https://api.opencagedata.com/geocode/v1/json";

//Backend API endpoint
const BaseURL = "https://api.openuv.io/api/v1/uv";

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

//this page appears when you go to the root of the server
app.get("/", (req, res) => {
  // res.send("Hello World");
  res.render("index.ejs");
});

//user send request to server via form
app.post("/getuv", async (req, res) => {
  console.log(req.body);
  // const lat = req.body.lat;
  // const lon = req.body.lon;

  //Area name that entered by user
  const AreaName = req.body.AreaName;

  if (AreaName.length !== 1) {
    //get the cordinates of that area name by using location cordinates API & created a JS object
    const cordinates = await axios.get(
      `${LocationBaseURL}?q=${AreaName}&key=${LocationApiKey}`
    );

    //our API response is like that in our "cordinates" object we got "data" & in that we got "results" array in that we got "components" this is where all cords get stored
    if (cordinates.data.results[0]) {
      const ActualCityName = cordinates.data.results[0].components.city;
      const ActualCountryName = cordinates.data.results[0].components.country;
      const ActualCityDistrictName =
        cordinates.data.results[0].components.state_district;
      const ActualContinent = cordinates.data.results[0].components.continent;
      const ActualStateName = cordinates.data.results[0].components.state;
      // console.log(ActualAreaName);
      console.log(cordinates.data.results);
      const lat = cordinates.data.results[0].geometry.lat;
      const lon = cordinates.data.results[0].geometry.lng;

      const result = await axios.get(`${BaseURL}?lat=${lat}&lng=${lon}`, {
        headers: { "x-access-token": ApiKEY },
      });

      let UV = result.data.result.uv; //this is the UV of specified location of current time
      let UVmax = result.data.result.uv_max; //this is maximum uv of that specified location on that day
      let UVmaxTime = result.data.result.uv_max_time; //this is maximum uv's time of that specified location on that day
      let date = new Date(UVmaxTime); //this is the date object that in differ time format

      //this is the advices variables in string values
      let Night = "It's night buddy go outside openly.";
      let low =
        "Minimal risk. No protection needed unless you have very sensitive skin.";
      let moderate =
        "Moderate risk. Wear sunglasses and consider SPF 30+ sunscreen if outside for more than 30 minutes.";
      let high =
        "High UV exposure. Use SPF 30+ sunscreen, sunglasses, and a hat. Seek shade between 10 AM and 4 PM.";
      let veryhigh =
        "Very high risk of skin damage. Apply SPF 50+ sunscreen, wear protective clothing, and avoid midday sun.";
      let extreme =
        "Extreme danger from UV rays! Stay indoors during peak hours. If outdoors, reapply SPF 50+ every 2 hours and cover all exposed skin.";

      let advice;

      if (UV == 0) {
        advice = Night;
      } else if (UV < 3) {
        advice = low;
      } else if (UV > 2 || UV < 6) {
        advice = moderate;
      } else if (UV > 5 || UV < 8) {
        advice = high;
      } else if (UV > 7 || UV < 11) {
        advice = veryhigh;
      } else if (UV > 10) {
        advice = extreme;
      }

      //that "date" object that we convert that in IST time format
      const IstTime = date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true, // 12-hour format
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

     
      console.log(result.data);
      //   console.log("MAX-UV :",result.uv_max);
      //   console.log("MAX-UV TIME :",result.uv_max_time);
      res.render("index.ejs", {
        content: result.data,
        Time: IstTime,
        advice,
        ActualCityName,
        ActualCountryName,
        ActualStateName,
        ActualCityDistrictName,
        ActualContinent,
        //this error have to be null otherwise it will remains old values
        error: null,
      });
    } else {
      res.render("index.ejs", {
        error: "This location's data is not available...",
        //this content have to be null otherwise it will remains old values
        content: null,
      });
    }
  } else {
    res.render("index.ejs", {
      error: "This location's data is not available...",
      //this content have to be null otherwise it will remains old values
      content: null,
    });
  }
});

// app.listen(port, () => {
//   console.log(`server is running on port ${port}`);
// });

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running at http://localhost:3000/");
});
