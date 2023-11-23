
document.addEventListener("DOMContentLoaded", function () {


  // Get access token from cookie
  const accessToken = getCookie('access_token');
  const loginButton = document.getElementById('login-button');
  loginButton.addEventListener('click', function () {
    window.location.href = '/login'; // Redirect to the Spotify login route
  });

  
  // Function to get a cookie value by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };


    let currentBPM = 0; // Store the current BPM
    let isCustomBPM = false; // Flag to indicate if a custom BPM is set
    const bpmElement = document.getElementById("bpm");


    // Get references to the custom track URL input field and the "Get BPM" button
    const customTrackURLInput = document.getElementById("custom-track-url");
    const getBPMButton = document.getElementById("get-bpm-button");

     // Get references to the custom colors input field and buttons
    const customColorsInput = document.getElementById("custom-colors");
    const setColorsButton = document.getElementById("set-colors-button");
    const defaultColorsButton = document.getElementById("default-colors-button");

    let defaultFlashingColors=['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    let customFlashingColors=[];

    
        // Add an event listener for the "click" event on the "Get BPM" button
        getBPMButton.addEventListener("click", async function () {
            try {
                // Get the custom track URL from the input field
                const customTrackURL = customTrackURLInput.value.trim();
    
                if (customTrackURL) {
                    // Fetch BPM from the Spotify Web API using the custom track URL
                    const bpm = await fetchBPMFromCustomTrackURL(customTrackURL);
                    bpmElement.textContent = bpm;                 
                            if (isNaN(bpm) || bpm <= 0) {
                                showAlert("Custom URL BPM could not be fetched");
                            } else {
                                // // Set the custom BPM and flag
                                // currentBPM = customBPM;
                                // isCustomBPM = true;
                                // updateBPMOverlay();
                                // // Call the function to update the background color based on the custom BPM
                                // updateBackgroundColor(currentBPM);
                            }
                } else {
                    console.error("Custom Track URL is empty.");
                }
            } catch (error) {
                console.error("Error fetching BPM:", error);
            }
        });


    // Function to fetch the BPM and update the overlay
    async function updateBPMOverlay() {
        try {
            let bpm = 0;

            if (isCustomBPM) {
                // Use the custom BPM if set
                bpm = currentBPM;
            } else {
                // Fetch the BPM from Spotify
                let currentUrl = await fetchBPMFromSpotify(accessToken);
              
                bpm = await fetchBPMFromCustomTrackURL(currentUrl);
                customBPM = bpm;
            }

            // Update the overlay with the new BPM value
            const bpmElement = document.getElementById("bpm");
            bpmElement.textContent = bpm;

            // Fetch the currently playing song title
            const songTitle = await fetchSongTitleFromSpotify(accessToken);
            const songTitleElement = document.getElementById("song-title");
            songTitleElement.textContent = songTitle;

            // Call a function to update the background color based on BPM
            updateBackgroundColor(bpm);
        } catch (error) {
            console.error("Error fetching BPM:", error);
            showAlert("Error fetching BPM. Please try again.");
        }
    }

    

    // Function to update the background color based on BPM
    function updateBackgroundColor(bpm) {
        const body = document.body;
        let color_index = 0;

        // Calculate interval in ms (BPM is beats per minute, so we convert it to beats per second)
        const interval = 60 / bpm * 1000;

        // Set up color flashing
        function changeColor() {
            body.style.backgroundColor = customFlashingColors[color_index];
            color_index = (color_index + 1) % customFlashingColors.length;
        }

        // Clear the previous interval (if any) to avoid multiple flashing intervals
        clearInterval(body.intervalId);

        // Check if the BPM is valid and not 0 or N/A
        if (bpm > 0) {
            body.intervalId = setInterval(changeColor, interval);
        } else {
            // Stop flashing if BPM is 0 or N/A
            clearInterval(body.intervalId);
        }
    }

    // Function to fetch the BPM of the currently playing song from Spotify
          async function fetchBPMFromSpotify(accessToken) {
        try {
          const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });
      
          const data = await response.json();
          if (data.item && data.item.external_urls.spotify) {
            return data.item.external_urls.spotify;
          } else {
            return 0;
          }
        } catch (error) {
          console.error("Error fetching URL of current song:", error);
          return 0;
        }
      }


// Function to fetch the currently playing song title from Spotify
async function fetchSongTitleFromSpotify(accessToken) {
    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (data.item && data.item.name) {
            const songName = data.item.name;
            const artists = data.item.artists.map(artist => artist.name).join(', ');
            return `${artists} - ${songName}`;
        } else {
            return "N/A";
        }
    } catch (error) {
        console.error("Error fetching song title:", error);
        return "N/A";
    }
}



    // Function to show an alert to the user
    function showAlert(message) {
        alert(message);
    }

    // Get references to the custom BPM input field and the "Set BPM" button
    const customBPMInput = document.getElementById("custom-bpm-input");

    // Add an event listener for the "keydown" event on the custom BPM input
    customBPMInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            // When the "Enter" key is pressed, trigger a click event on the "Set BPM" button
            setCustomBPMButton.click();
        }
    });

    // Get references to the custom BPM input field and the "Set BPM" button
    const customTrackInput = document.getElementById("custom-track-url");
    const customTrackButton = document.getElementById("get-bpm-button");

    // Add an event listener for the "keydown" event on the custom BPM input
    customTrackInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            // When the "Enter" key is pressed, trigger a click event on the "Set BPM" button
            customTrackButton.click();
        }
    });

    // Get references to the custom BPM input field and the "Set BPM" button
    const customColorInput = document.getElementById("custom-colors");
    const customColorButton = document.getElementById("set-colors-button");

    // Add an event listener for the "keydown" event on the custom BPM input
    customColorInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            // When the "Enter" key is pressed, trigger a click event on the "Set BPM" button
            customColorButton.click();
        }
    });

    // Add an event listener for the "click" event on the "Set Colors" button
    setColorsButton.addEventListener("click", function () {
        try {
            // Get the custom colors from the input field
            const customColorsString = customColorsInput.value.trim();

            if (customColorsString) {
                // Split the input string by commas to get an array of custom colors
                const customColors = customColorsString.split(",");

                // Set the custom colors for flashing
                setCustomColors(customColors);
            } else {
                console.error("Custom Colors input is empty.");
                showAlert("Custom Colors input is empty.");
            }
        } catch (error) {
            console.error("Error setting custom colors:", error);
        }
    });

        // Add an event listener for the "click" event on the "Default Colors" button
        defaultColorsButton.addEventListener("click", function () {
            // Set the default colors for flashing
            setDefaultColors();
        });

            // Function to set custom colors for flashing
    function setCustomColors(colors) {
        // Update the colors array for flashing
        customFlashingColors = colors;
    }

    // Function to set default colors for flashing
    function setDefaultColors() {
        // Update the colors array for flashing with default colors
        customFlashingColors = defaultFlashingColors;
    }


    // Event listener for setting a custom BPM
    const setCustomBPMButton = document.getElementById("set-custom-bpm");
    setCustomBPMButton.addEventListener("click", function () {
        const customBPMInput = document.getElementById("custom-bpm-input");
        const customBPM = customBPMInput.value;

        if (isNaN(customBPM) || customBPM <= 0) {
            showAlert("Please enter a valid BPM greater than 0.");
        } else {
            // Set the custom BPM and flag
            currentBPM = customBPM;
            isCustomBPM = true;
            updateBPMOverlay();
            // Call the function to update the background color based on the custom BPM
            updateBackgroundColor(currentBPM);
        }
    });

    // Event listeners for tempo multiplier buttons
    const tempoHalfButton = document.getElementById("half-button");
    tempoHalfButton.addEventListener("click", function () {
        currentBPM *= 0.5;
        updateBPMOverlay();
    });

    const tempoDoubleButton = document.getElementById("double-button");
    tempoDoubleButton.addEventListener("click", function () {
        currentBPM *= 2;
        updateBPMOverlay();
    });

    const tempoQuadrupleButton = document.getElementById("quadruple-button");
    tempoQuadrupleButton.addEventListener("click", function () {
        currentBPM *= 4;
        updateBPMOverlay();
    });
    const stopButton = document.getElementById("stop-button");
    stopButton.addEventListener("click", function () {
        currentBPM *= 0;
        updateBPMOverlay();
    });


        // Function to fetch BPM from the Spotify Web API using a custom track URL
        async function fetchBPMFromCustomTrackURL(trackURL) {
            try {
                // Extract the track ID from the Spotify URL
                const trackId = extractTrackIdFromURL(trackURL);
                var x = "Error fetching BPM from Custom Track URL: "+trackId;
                if (trackId) {
                    // Fetch audio features for the track from the Spotify Web API
                    const audioFeatures = await fetchAudioFeatures(trackId,accessToken);
    
                    // Extract the BPM from the audio features
                    const bpm = audioFeatures.tempo || "N/A";
                    return bpm;
                } else {
                    console.error("Invalid Spotify Track URL.");
                    showAlert("Invalid Spotify Track URL.");
                    return "N/A";
                }
            } catch (error) {
                console.error("Error fetching BPM from Custom Track URL:", error);
                return "N/A";
            }
        }
    
        // Function to extract the track ID from a Spotify track URL
        function extractTrackIdFromURL(trackURL) {
            // Use a regular expression to extract the track ID from the URL
            const match = trackURL.match(/\/track\/([a-zA-Z0-9]+)/);
    
            if (match && match[1]) {
                return match[1];
            } else {
                return null;
            }
        }
    
        // Function to fetch audio features for a track from the Spotify Web API
        async function fetchAudioFeatures(trackId, accessToken) {
            try {
                const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                });

                const data = await response.json();
                return data;
            } catch (error) {
                console.error("Error fetching audio features:", error);
                throw error;
            }
        }




        // Function to fetch the access token from Spotify
        async function fetchAccessToken(clientId, clientSecret) {
            try {
                // Create a URL-encoded string of the client ID and client secret
                const credentials = `${clientId}:${clientSecret}`;
                const base64Credentials = btoa(credentials);

                // Make a POST request to Spotify's token endpoint to obtain an access token
                const response = await fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${base64Credentials}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "grant_type=client_credentials",
                });

                const data = await response.json();
                if (data.access_token) {
                    return data.access_token;
                } else {
                    throw new Error("Unable to fetch access token.");
                }
            } catch (error) {
                console.error("Error fetching access token:", error);
                throw error;
            }
        }




    // Call the updateBPMOverlay function on an interval
    setDefaultColors();
    if(accessToken!=""){
    setInterval(updateBPMOverlay, 5000); // Update every 5 seconds
    }
});
