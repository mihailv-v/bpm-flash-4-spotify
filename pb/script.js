document.addEventListener("DOMContentLoaded", function () {
    // Initialize variables and flags
    let currentBPM = 0;
    let isCustomBPM = false;
    let customBPM = 0;
    let isPlaying;
    let lastKnownBPM = 0;
    let lastKnownSongDetails = "N/A";
    let customTrackURL = "";
    let bpmMultiplier = 1;
    let lastBPMMultiplied;
    let isSkipping = false;
    let songAndBPMUpdated = false;
    let isTransitionUpdated = false;
    const bpmElement = document.getElementById("bpm");
    const songTitleElement = document.getElementById("song-title");
    const customColorsInput = document.getElementById("custom-colors");
    const setColorsButton = document.getElementById("set-colors-button");
    const defaultColorsButton = document.getElementById("default-colors-button");
    let customFlashingColors = [];
    let savedExtractedColors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
    const defaultFlashingColors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
    let accessToken = getCookie("access_token");
    const loginButton = document.getElementById("login-button");
    const switchToCurrentlyPlayingButton = document.getElementById("switch-to-currently-playing-button");
    let isTokenExpired = false;
    let isFirstExecution = true; // Flag to track the first execution
    document.getElementById("skip-mode-container").style.display = "none";
    let isSkipInProgress = false; // Flag to track if a skip is already in progress
    let isShuffleEnabled = false;
    let shuffleFromPlaybackCheck = false;
    let currentSongUrl;


    // Function to get a cookie value by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
    }
    // Function to delete a cookie
    function deleteCookie(name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log(`cookie ${name} deleted`);
    }
  
    // Function to redirect to Spotify login
    loginButton.addEventListener("click", function () {
        console.log("Login Clicked");
        window.location.href = "/login"; // Redirect to the "/login" URL
    });


  // Function to refresh the access token
  async function refreshAccessToken() {
      try {
          const response = await fetch('/refresh-token', {
              method: 'GET',
              // Add any headers or credentials if needed
          });

          if (response.status === 200) {
              console.log('Access token refreshed successfully');
              accessToken=getCookie("access_token");
              isTokenExpired = false;
              // You can perform any additional actions here
          } else {
              console.error('Error refreshing access token:', response.statusText);
          }
      } catch (error) {
          console.error('Error refreshing access token:', error);
      }
  }

  // Call the refreshAccessToken function initially
  refreshAccessToken();

  // Set up an interval to refresh the access token every 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
  const refreshInterval = 30 * 60 * 1000;

  setInterval(refreshAccessToken, refreshInterval);


        // Function to check if the access token is expired and refresh it if possible
    async function checkAndRefreshToken() {
      await refreshAccessToken();
        try {
            const response = await fetch("https://api.spotify.com/v1/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401) {
                // Access token has expired or not provided
                handleTokenExpiration();
                document.getElementById("song-details").style.display = "none";
                console.log("Access token not accepted");
                isTokenExpired = true;
            }
        } catch (error) {
            console.error("Error checking/accessing token:", error);
        }
    }
  
    // Call the function on startup
    checkAndRefreshToken();
    
    async function isPlaybackActive() {
      if(isTokenExpired){
        await checkAndRefreshToken();
        if(isTokenExpired){
        handleTokenExpiration()
        Promise.resolve(false)
        return false;
        }
      }else{
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player', {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Replace with your access token
                },
            });
    
            if (response.status === 200) {
                const data = await response.json();
                isShuffleEnabled = data.shuffle_state;
                shuffleFromPlaybackCheck = data.shuffle_state
                const shuffleIcon = document.getElementById("shuffle-icon");
                const unshuffleIcon = document.getElementById("unshuffle-icon");
                                    
                if (!isShuffleEnabled) {
                      unshuffleIcon.style.display = "none";
                      shuffleIcon.style = "";
                } else {
                      shuffleIcon.style.display = "none";
                      unshuffleIcon.style = "";
                    }
              togglePlayPauseIcon(data.is_playing); // Change icon to pause
                return data.is_playing;
            } else if(response.status === 401){
              await checkAndRefreshToken();
              await isPlaybackActive();
            }else {
              console.log(`resp stat in last else ${response.status}`)
                return false;
            }
        } catch (error) {
            console.error('Error checking playback state:', error);
            return false;
        }
      }
    }
  async function isShuffleActive() {
    if(isTokenExpired){
      await checkAndRefreshToken();
      if(isTokenExpired){
      handleTokenExpiration()
      Promise.resolve(false)
      return false;
      }
    }else{
      try {
          const response = await fetch('https://api.spotify.com/v1/me/player', {
              headers: {
                  Authorization: `Bearer ${accessToken}`, // Replace with your access token
              },
          });

          if (response.status === 200) {
              const data = await response.json();
              isShuffleEnabled = data.shuffle_state;
              shuffleFromPlaybackCheck = data.shuffle_state
              const shuffleIcon = document.getElementById("shuffle-icon");
              const unshuffleIcon = document.getElementById("unshuffle-icon");

              if (!isShuffleEnabled) {
                    unshuffleIcon.style.display = "none";
                    shuffleIcon.style = "";
              } else {
                    shuffleIcon.style.display = "none";
                    unshuffleIcon.style = "";
                  }
              return data.shuffle_state;
          } else if(response.status === 401){
            await checkAndRefreshToken();
            await isShuffleActive();
          }else {
            console.log(`resp stat in last else ${response.status}`)
              return false;
          }
      } catch (error) {
          console.error('Error checking playback state:', error);
          return false;
      }
    }
  }

    // Function to periodically check if playback is active
    async function checkPlaybackStatus() {
      if(!isTokenExpired && !(isCustomBPM || customTrackURL)){
        isPlaying = await isPlaybackActive();
        console.log('Playback is active: ', isPlaying);
      }else{
        isPlaying=false;
      console.log('Playback is active: ', isPlaying);
      }
    }
    
    // Initialize isPlaying variable and perform initial check
    (async () => {
        isPlaying = await isPlaybackActive();
        console.log('Playback is active:', isPlaying);
      
        const interval = setInterval(async () => {
            checkPlaybackStatus();
            updateBPMOverlay();
        }, 30000);
    })();




  
  
      async function fetchTrackURL(accessToken) {
        if (isTokenExpired) {
          await checkAndRefreshToken();
          if(isTokenExpired){
            handleTokenExpiration();
            Promise.resolve("");
            return;
          }
        }
        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

                    if (response.status === 401) {
                // Access token has expired or not provided
                      await checkAndRefreshToken();
                      await fetchTrackURL(accessToken);
                // handleTokenExpiration();
                // console.log("Access token expired.");
                // isTokenExpired = true;
                // return 0;
            }

            const data = await response.json();

            if (data.item && data.item.external_urls && data.item.external_urls.spotify) {
                // Fetch audio features for the currently playing track
                const trackURLResp = data.item.external_urls.spotify;
                console.log(trackURLResp);
                return trackURLResp;
            }
        }catch (error) {
            console.error("Error fetching Spotify Currently Playing track URL:", error);
            return 0;
        }
      }



        
    // Function to fetch the BPM from Spotify using the access token
    async function fetchBPMFromSpotify(accessToken) {
        if (isTokenExpired) {
          await checkAndRefreshToken();
          if(isTokenExpired){
            handleTokenExpiration();
            Promise.resolve(0);
            return 0;
          }
        }
        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401) {
                await checkAndRefreshToken();
                await fetchBPMFromSpotify(accessToken);
                // // Access token has expired or not provided
                // handleTokenExpiration();
                // console.log("Access token expired.");
                // isTokenExpired = true;
                // return 0;
            }

            const data = await response.json();

            if (data.item && data.item.id) {
                // Fetch audio features for the currently playing track
                const audioFeaturesResponse = await fetch(`https://api.spotify.com/v1/audio-features/${data.item.id}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                });

                const audioFeatures = await audioFeaturesResponse.json();

                if (audioFeatures.tempo) {
                    // Reset the token expiration flag
                    isTokenExpired = false;
                    return audioFeatures.tempo;
                } else {
                    return 0;
                }
            } else {
                // No currently playing track, or data is missing
                return 0;
            }
        } catch (error) {
            console.error("Error fetching BPM from Spotify:", error);
            return 0;
        }
    }

    // Function to fetch the song title from Spotify using the access token
    async function fetchSongTitleFromSpotify(accessTokenIn) {
        if (isTokenExpired) {
          await checkAndRefreshToken();
          if(isTokenExpired){
            handleTokenExpiration();
            Promise.resolve("");
            return;
          }
        }
        if(!isPlaying){
            Promise.resolve(null);
            return;
        }
        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessTokenIn}`,
                },
            });

            if (response.status === 401) {
                await checkAndRefreshToken();
                // // Access token has expired or not provided
                // handleTokenExpiration();
                // console.log("Access token expired.");
                // isTokenExpired = true;
                // return 0;
              await fetchSongTitleFromSpotify(accessToken);
            }
          
            const data = await response.json();
            if (data.item && data.item.name) {
              if(data.context && data.context.external_urls){
              embedPlaylist(data.context.external_urls.spotify)
              currentSongUrl=data.item.external_urls.spotify;
              }
                const songName = data.item.name;
                const artists = data.item.artists.map(artist => artist.name).join(', ');
              // console.log(data)
                return `${artists} - ${songName}`;
            } else {
                return "N/A";
            }
          
        } catch (error) {
            console.error("Error fetching song title from Spotify:", error);
            return "N/A";
        }
    }

      async function embedPlaylist(url) {

        const contextDiv = document.getElementById('context-current-playlist');
        const iframeSrc = url.replace('open.spotify', 'embed.spotify');
        const existingIframe = contextDiv.querySelector(`iframe[src="${iframeSrc}"]`);
        if (existingIframe) {
          // If an iframe with the same source URL already exists, do nothing.
          return;
        }

        // If an iframe with the same source URL does not exist, clear the div context and append a new one.
        contextDiv.innerHTML = '';
        const iframe = document.createElement('iframe');
        const embed = document.createElement('embed');
        iframe.src = iframeSrc;
        iframe.width = 'inherit';
        iframe.height = '361';
        iframe.style.mixBlendMode = "multiply";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";
        iframe.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";
        iframe.style.backgroundColor = "rgba(1, 1, 1, 0.2)";
        contextDiv.style.border = "none";
        contextDiv.style.borderRadius = "10px";
        contextDiv.style.mixBlendMode = "add";
        contextDiv.style.backgroundColor = "rgba(1, 1, 1, 0.2)";
        // Attach the listener function to the load event of the iframe element
        iframe.addEventListener("load", listener);
        contextDiv.appendChild(iframe);

        function listener() {
          // Create an async function that waits for 7 seconds
async function wait7Seconds() {
  // Use the await keyword to pause the execution until the promise is resolved
  await new Promise((resolve) => setTimeout(resolve, 7000));
  // Return a value
  return "Done waiting!";
}

// Call the async function and use the .then() method to handle the promise
wait7Seconds().then((value) => {
  // Log the value to the console

          // Get the element with the custom attribute
          var element = document.querySelector('[id="context-current-playlist"]');

          // Get all of its children
          var children = element.children;
          
          // Loop through the children and set their background color to opacity 0
          for (var i = 0; i < children.length; i++) {
            children[i].style.backgroundColor = "rgba(0, 0, 0, 80)"; // transparent
          
            
          }

            console.log(value); // "Done waiting!"
});
        }



      }

  
    // Function to fetch BPM from a custom track URL
    async function fetchBPMFromCustomTrackURL(trackURL) {
        try {
            // Extract the track ID from the Spotify URL
            const trackId = extractTrackIdFromURL(trackURL);
            console.log(trackId);
            if (trackId) {
                // Fetch audio features for the track from the Spotify Web API
                const audioFeatures = await fetchAudioFeatures(trackId, accessToken);

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

    // Function to fetch audio features for a track from the Spotify Web API
    async function fetchTrackInfo(trackId, accessToken) {
        try {
            const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching song details:", error);
            throw error;
        }
    }

    let runCount=0;
  
    // Function to update the overlay with BPM and song title
    async function updateBPMOverlay() {
      
        try {
            let bpm = 0;
            let songTitle = "custom";
            songAndBPMUpdated=false;
            isTransitionUpdated = true;
            const toggleChecked = document.getElementById("extract-toggle").checked;
  
            if (isCustomBPM) {
                // Use the custom BPM if set
                bpm = customBPM;
                lastKnownBPM = bpm;
                // Hide the "Now Playing" indicator when using custom BPM
                document.getElementById("now-playing").style.display = "none";
                document.getElementById("skip-mode-container").style.display = "none";
              let multipliedBPM = bpmMultiplier * lastKnownBPM;
              if(multipliedBPM !== lastBPMMultiplied){
                lastBPMMultiplied = multipliedBPM;
                updateBackgroundColor(lastBPMMultiplied);
                bpmElement.textContent = lastBPMMultiplied;
              }
                // Update the "Switch to Currently Playing" button
                updateSwitchToCurrentlyPlayingButton();
                if (customTrackURL === "") {
                    document.getElementById("song-details").style.display = "none";
                } else {
                    if (!isTokenExpired) {
                        document.getElementById("song-details").style.display = "block";
                        document.getElementById("toggle-container").style.display = "flex";
                        const trackId = extractTrackIdFromURL(customTrackURL);
                        const data = await fetchTrackInfo(trackId, accessToken);
                        if (data.name) {
                            const songName = data.name;
                            const artists = data.artists.map(artist => artist.name).join(', ');
                            songTitle = `${artists} - ${songName}`;
                            if(songTitle !== lastKnownSongDetails){
                            songTitleElement.textContent = songTitle;
                            lastKnownSongDetails = songTitle;
                            }
                        } else {
                            songTitle = "N/A";
                            songTitleElement.textContent = songTitle;
                        }
                    }
                }
            } else if (!isTokenExpired) {
                if(!isPlaying){
                  console.log(`${isPlaying} playing in if`);
                document.getElementById("song-details").style.display = "none";
                // document.getElementById("toggle-container").style.display = "flex";
                document.getElementById("now-playing").textContent = "Nothing currently playing";
                document.getElementById("now-playing").style.display = "block";
                }else{
                  console.log(`${isPlaying} playing in else`);
                  if(!isSkipping){
                document.getElementById("now-playing").textContent = "• Now Playing";
                  }
                // Fetch the currently playing song title
                songTitle = await fetchSongTitleFromSpotify(accessToken);
                  if(songTitle !== lastKnownSongDetails){
                      songTitleElement.textContent = songTitle;
                      try{
                        if(songTitle!=="custom" && songTitle!=="N/A" && bpmMultiplier !== 0){
                        bpm = await fetchBPMFromSpotify(accessToken);
                        lastKnownBPM = bpm;
                          songAndBPMUpdated=true;
                                        if(toggleChecked && document.getElementById("song-details").style.display!=="none"){
                                          if(!isSkipInProgress && toggleChecked){
                                          const currentlyPlayingURL = await fetchTrackURL(accessToken);
                                          // console.log(currentlyPlayingURL);
                                          await fetchAndExtractColorsForTrack(currentlyPlayingURL,accessToken);
                                          }
                                        }
                          document.getElementById("now-playing").textContent = "• Now Playing";
                          updateTransition();
                        }} catch (error) {
                    console.error("Error fetching BPM:", error);
                }

                    try{
                        if(songTitle!=="custom" && songTitle!=="N/A" && isSkipping && bpmMultiplier == 0){
                        bpm = await fetchBPMFromSpotify(accessToken);
                        lastKnownBPM = bpm;
                          songAndBPMUpdated=true;
                          updateTransition();
                          const nowPl=document.getElementById("now-playing");
                          nowPl.style.display = "block";
                          nowPl.textContent = `• Now Playing Without Flash\n - \n${lastKnownBPM}`;
                        }} catch (error) {
                    console.error("Error fetching BPM in skipping mode:", error);
                      
                  }
              lastKnownSongDetails = songTitle;

                document.getElementById("song-details").style.display = "block";
                document.getElementById("toggle-container").style.display = "flex";

                if (bpmMultiplier == 0 && !isSkipping) {
                    // Hide the "Now Playing" indicator when using custom BPM
                    document.getElementById("now-playing").style.display = "none";
                } else {
                    if (!isTokenExpired) {
                        document.getElementById("now-playing").style.display = "block";
                    }
                }
            }
            
            }


            // Check if the fetched BPM is different from the last known BPM
            if (bpm !== lastKnownBPM && bpm !== 0) {
                lastKnownBPM = bpm;                
            }

          
            let multipliedBPM = bpmMultiplier * lastKnownBPM;
            if(multipliedBPM !== lastBPMMultiplied){
              lastBPMMultiplied = multipliedBPM;
              updateBackgroundColor(lastBPMMultiplied);
              bpmElement.textContent = lastBPMMultiplied;
            }
          
    console.log("skip is checking");
              if(isSkipping){
    await performSkipBasedOnMode();
              }
            // Update the "Switch to Currently Playing" button
            updateSwitchToCurrentlyPlayingButton();


          
            }
                      if(subCode){
              sendOverlayData();
              }
        }catch (error) {
            console.error("Error fetching BPM:", error);
            showAlert("Error fetching BPM. Please try again.");
        }
    }

    // // Function to update the overlay with BPM and song title
    // async function updateBPMOverlay() {
    //     try {
    //         let bpm = 0;
    //         let songTitle = "custom";
    //         songAndBPMUpdated = false;
    //         isTransitionUpdated = true;
    //         const toggleChecked = document.getElementById("extract-toggle").checked;
    
    //         if (isCustomBPM) {
    //             // Use the custom BPM if set
    //             bpm = customBPM;
    //             // Hide the "Now Playing" indicator when using custom BPM
    //             document.getElementById("now-playing").style.display = "none";
    //             if (customTrackURL === "") {
    //                 document.getElementById("song-details").style.display = "none";
    //             } else if (!isTokenExpired) {
    //                     document.getElementById("song-details").style.display = "block";
    //                     document.getElementById("toggle-container").style.display = "flex";
    //                     const trackId = extractTrackIdFromURL(customTrackURL);
    //                     const data = await fetchTrackInfo(trackId, accessToken);
    //                     if (data.name) {
    //                         const songName = data.name;
    //                         const artists = data.artists.map(artist => artist.name).join(', ');
    //                         songTitle = `${artists} - ${songName}`;
    //                         if (songTitle !== lastKnownSongDetails) {
    //                             songTitleElement.textContent = songTitle;
    //                             lastKnownSongDetails = songTitle;
    //                         }
    //                     } else {
    //                         songTitle = "N/A";
    //                         songTitleElement.textContent = songTitle;
    //                     }
    //                 }
    //         } else if (!isTokenExpired) {
    //             // Check if playback is active before fetching data
    //             if ((await isPlaying)===false) {
    //                 document.getElementById("song-details").style.display = "none";
    //                 document.getElementById("now-playing").textContent = "Nothing currently playing";
    //                 document.getElementById("now-playing").style.display = "block";
    //             } else {
    //                 if (isFirstExecution) {
    //                     // Introduce a delay of 100ms for the first execution
    //                     await new Promise(resolve => setTimeout(resolve, 100));
    //                     isFirstExecution = false; // Set the flag to false after the first execution
    //                 }
    //                 document.getElementById("now-playing").textContent = "• Now Playing";
    //                 // Fetch the currently playing song title
    //               if(isPlaying){
    //                 songTitle = await fetchSongTitleFromSpotify(accessToken);
    //               }
    //                 if (songTitle !== lastKnownSongDetails) {
    //                     songTitleElement.textContent = songTitle;
    //                     try {
    //                         if (songTitle !== "custom" && songTitle !== "N/A" && bpmMultiplier !== 0) {
    //                             bpm = await fetchBPMFromSpotify(accessToken);
    //                             lastKnownBPM = bpm;
    //                             songAndBPMUpdated = true;
    //                             document.getElementById("skip-mode-container").style.display = "none";
    //                             if (toggleChecked && document.getElementById("song-details").style.display == "block") {
    //                                 const currentlyPlayingURL = await fetchTrackURL(accessToken);
    //                                 console.log(currentlyPlayingURL);
    //                                 fetchAndExtractColorsForTrack(currentlyPlayingURL, accessToken);
    //                             }
    //                             updateTransition();
    //                         }
    //                     } catch (error) {
    //                         console.error("Error fetching BPM:", error);
    //                     }
    //                     lastKnownSongDetails = songTitle;
    //                 }
    
    //                 document.getElementById("song-details").style.display = "block";
    //                 document.getElementById("toggle-container").style.display = "flex";
    
    //                 if (bpmMultiplier == 0) {
    //                     // Hide the "Now Playing" indicator when using custom BPM
    //                     document.getElementById("now-playing").style.display = "none";
    //                 } else {
    //                     if (!isTokenExpired) {
    //                         document.getElementById("now-playing").style.display = "block";
    //                     }
    //                 }
    //             }
    //         }
    
    //         // Check if the fetched BPM is different from the last known BPM
    //         if (bpm !== lastKnownBPM && bpm !== 0) {
    //             lastKnownBPM = bpm;
    //         }
    
    //         let multipliedBPM = bpmMultiplier * lastKnownBPM;
    //         if (multipliedBPM !== lastBPMMultiplied) {
    //             lastBPMMultiplied = multipliedBPM;
    //             updateBackgroundColor(lastBPMMultiplied);
    //             bpmElement.textContent = lastBPMMultiplied;
    //         }
    
    //         // Update the "Switch to Currently Playing" button
    //         updateSwitchToCurrentlyPlayingButton();
    
    //         // Check if skipping is active and not in custom BPM mode
    //         if (isSkipping && !isCustomBPM) {
    //             const selectedMode = document.getElementById("skip-mode-dropdown").value;
    //             const bpmThresholdInput = document.getElementById("bpm-threshold");
    //             const lowRangeInput = document.getElementById("low-range");
    //             const highRangeInput = document.getElementById("high-range");
    
    //             switch (selectedMode) {
    //                 case "below":
    //                 case "above":
    //                     if (validateBPMThresholdInput(bpmThresholdInput.value)) {
    //                         // Call the appropriate skip update function for "below" and "above" modes here.
    //                         if (selectedMode === "below") {
    //                             await skipBelowBPM(bpmThresholdInput.value);
    //                         } else if (selectedMode === "above") {
    //                             await skipAboveBPM(bpmThresholdInput.value);
    //                         }
    //                     }
    //                     break;
    //                 case "outside":
    //                     if (validateRangeInputs(lowRangeInput.value, highRangeInput.value)) {
    //                         // Call the skip update function for "outside" mode here.
    //                         await skipOutsideBPMRange(lowRangeInput.value, highRangeInput.value);
    //                     }
    //                     break;
    //             }
    //         }
    //     } catch (error) {
    //         console.error("Error fetching BPM:", error);
    //         showAlert("Error fetching BPM. Please try again.");
    //     }
    // };


// Add an event listener to the skip button
const skipButton = document.getElementById("skip-button");
skipButton.addEventListener("click", () => toggleSkip(skipButton));

// Function to toggle the skip button text and isSkipping value
function toggleSkip(skipButton) {
  
    if (!isCustomBPM) {
        if (isSkipping) {
            skipButton.textContent = "Start Skipping";
        } else {
            skipButton.textContent = "Stop Skipping";
        }
        isSkipping = !isSkipping; // Toggle the isSkipping value
        isSkipping ? (console.log("skipping"), updateBPMOverlay()) : console.log("not skipping");
    }
}

    


    


    // // Function to validate the BPM threshold input
    // function validateBPMThresholdInput(inputValue) {
    //       if (!inputValue) {
    //     // No input, no need to display an alert
    //     return false;
    // }
    //     const bpmThreshold = parseFloat(inputValue);
    //     if (isNaN(bpmThreshold) || bpmThreshold <= 0 || bpmThreshold >= 10000) {
    //         alert("Please enter a valid BPM threshold (a positive number less than 10,000).");
    //         return false;
    //     }
    //     return true;
    // }
    
    // // Function to validate the low range input and high range input (for outside mode)
    // function validateRangeInputs(lowRangeInputValue, highRangeInputValue) {
    //           if (!lowRangeInputValue && !highRangeInputValue) {
    //     // Both fields are empty, no need to display an alert
    //     return false;
    // } else if (!lowRangeInputValue || !highRangeInputValue) {
    //     // One of the fields is empty, display an alert
    //     return false;
    // }
    //     const lowRange = parseFloat(lowRangeInputValue);
    //     const highRange = parseFloat(highRangeInputValue);
    
    //     if (
    //         isNaN(lowRange) || isNaN(highRange) ||
    //         lowRange < 0 || highRange < 0 ||
    //         lowRange >= 10000 || highRange >= 10000 ||
    //         lowRange > highRange
    //     ) {
    //         alert("Please enter valid BPM range values. Low range should be a positive number less than or equal to high range.");
    //         return false;
    //     }
    //     return true;
    // }

  

    // // Function to clear input fields
    // function clearInputFields() {
    //     document.getElementById("bpm-threshold").value = "";
    //     document.getElementById("low-range").value = "";
    //     document.getElementById("high-range").value = "";
    // }
    
    // // Add an event listener to the mode dropdown
    // const skipModeDropdown = document.getElementById("skip-mode-dropdown");
    // skipModeDropdown.addEventListener("change", () => {
    //   clearInputFields();

    //       // Toggle visibility of threshold and range inputs based on the selected mode
    // const selectedMode = skipModeDropdown.value;
    // const bpmThresholdInput = document.getElementById("bpm-threshold");
    // const lowRangeInput = document.getElementById("low-range");
    // const highRangeInput = document.getElementById("high-range");

    // if (selectedMode === "below" || selectedMode === "above") {
    //     bpmThresholdInput.style.display = "inline-block";
    //     lowRangeInput.style.display = "none";
    //     highRangeInput.style.display = "none";
    // } else if (selectedMode === "outside") {
    //     bpmThresholdInput.style.display = "none";
    //     lowRangeInput.style.display = "inline-block";
    //     highRangeInput.style.display = "inline-block";
    // }

    // });


  // Store the old mode and input
let oldMode = "";
let oldInput = "";

// Add an event listener to the mode dropdown
const skipModeDropdown = document.getElementById("skip-mode-dropdown");
skipModeDropdown.addEventListener("change", () => {
    // Get the selected mode
    const selectedMode = skipModeDropdown.value;

    // Get the input fields
    const bpmThresholdInput = document.getElementById("bpm-threshold");
    const lowRangeInput = document.getElementById("low-range");
    const highRangeInput = document.getElementById("high-range");

    // Check if the old mode matches the selected mode
    if (oldMode === selectedMode) {
        // Transfer the old input to the new input
        if (selectedMode === "below" || selectedMode === "above") {
            bpmThresholdInput.value = oldInput;
        } else if (selectedMode === "outside") {
            lowRangeInput.value = oldInput;
            highRangeInput.value = parseInt(oldInput) + 20;
        }
    }

    // Update the old mode and input
    oldMode = selectedMode;
    oldInput = selectedMode === "outside" ? lowRangeInput.value : bpmThresholdInput.value;

    // Toggle visibility of threshold and range inputs based on the selected mode
    if (selectedMode === "below" || selectedMode === "above") {
        bpmThresholdInput.style.display = "inline-block";
        lowRangeInput.style.display = "none";
        highRangeInput.style.display = "none";
    } else if (selectedMode === "outside") {
        bpmThresholdInput.style.display = "none";
        lowRangeInput.style.display = "inline-block";
        highRangeInput.style.display = "inline-block";
    }
});



    
    // // Function to handle skipping in "Above BPM" mode
    // async function skipAboveBPM(threshold) {
    //     if (!isSkipping || isSkipInProgress) return;
    
    //     isSkipInProgress = true; // Set the flag to indicate skip is in progress
    
    //     const currentBPM = lastKnownBPM;
    
    //     if (currentBPM !== null && currentBPM > threshold) {
    //         console.log("Skipping to the next song because BPM is above the threshold.");
    //         await skipToNext();
    //     }
    
    //     isSkipInProgress = false; // Reset the flag when skip is complete
    // }
    
    // // Function to handle skipping in "Outside BPM Range" mode
    // async function skipOutsideBPMRange(lowRange, highRange) {
    //     if (!isSkipping || isSkipInProgress) return;
    
    //     isSkipInProgress = true; // Set the flag to indicate skip is in progress
    
    //     const currentBPM = lastKnownBPM;
    
    //     if (currentBPM !== null && (currentBPM < lowRange || currentBPM > highRange)) {
    //         console.log("Skipping to the next song because BPM is outside the specified range.");
    //         await skipToNext();
    //     }
    
    //     isSkipInProgress = false; // Reset the flag when skip is complete
    // }
    
    // // Function to handle skipping in "Below BPM" mode
    // async function skipBelowBPM(threshold) {
    //     if (!isSkipping || isSkipInProgress) return;
    
    //     isSkipInProgress = true; // Set the flag to indicate skip is in progress
    
    //     const currentBPM = lastKnownBPM;
    
    //     if (currentBPM !== null && currentBPM < threshold) {
    //         console.log("Skipping to the next song because BPM is below the threshold." + ` ${currentBPM} BPM`);
    //         await skipToNext();
    //     }
    
    //     isSkipInProgress = false; // Reset the flag when skip is complete
    // }
    
    // // Function to update the skip check every 3 seconds
    // function updateSkipCheck() {
    //     setInterval(() => {
    //         // Check if skipping is active and not in custom BPM mode
    //         if (isSkipping && !isCustomBPM  && validateBPMThresholdInput(lastKnownBPM)) {
    //             const selectedMode = document.getElementById("skip-mode-dropdown").value;
    //             const bpmThresholdInput = document.getElementById("bpm-threshold");
    //             const lowRangeInput = document.getElementById("low-range");
    //             const highRangeInput = document.getElementById("high-range");
    
    //             switch (selectedMode) {
    //                 case "below":
    //                 case "above":
    //                     if (validateBPMThresholdInput(bpmThresholdInput.value)) {
    //                         // Call the appropriate skip update function for "below" and "above" modes here.
    //                         if (selectedMode === "below") {
    //                             skipBelowBPM(bpmThresholdInput.value);
    //                         } else if (selectedMode === "above") {
    //                             skipAboveBPM(bpmThresholdInput.value);
    //                         }
    //                     }
    //                     break;
    //                 case "outside":
    //                     if (
    //                         validateBPMThresholdInput(bpmThresholdInput.value) &&
    //                         validateRangeInputs(lowRangeInput.value, highRangeInput.value)
    //                     ) {
    //                         // Call the skip update function for "outside" mode here.
    //                         skipOutsideBPMRange(lowRangeInput.value, highRangeInput.value);
    //                     }
    //                     break;
    //             }
    //         }
    //     }, 3000); // Update skip check every 3 seconds
    // }
    
    // // Call the updateSkipCheck function to start updating skip checks
    // updateSkipCheck();





  

    // Function to update the "Switch to Currently Playing" button
    function updateSwitchToCurrentlyPlayingButton() {
        const switchButton = document.getElementById("switch-to-currently-playing-button");
        const BPMskip = document.getElementById("skip-mode-container");
        const skipButton = document.getElementById("skip-button");
      
        if (isCustomBPM || customTrackURL) {
            // Enable the button when custom BPM or custom track URL is set
            switchButton.disabled = false;
            skipButton.textContent = "Start Skipping";
            skipButton.disabled = false;
            BPMskip.style.display = "none";
            isSkipping = false; // Ensure skipping is turned off
            
        } else {
            switchButton.disabled = true;
            BPMskip.style.display = "block";
        }
    }

    switchToCurrentlyPlayingButton.addEventListener("click", function () {
        // Clear custom BPM and custom track URL
        customBPM = 0;
        customTrackURL = "";
        isCustomBPM = false;
        document.getElementById("toggle-container").style.display = "flex";

        // Disable the "Switch to Currently Playing" button
        switchToCurrentlyPlayingButton.disabled = true;
        getBackToInternalColors();
        // Update the BPM overlay and fetch the currently playing song
        lastKnownSongDetails= "";
        updateBPMOverlay();
    });

    async function getBackToInternalColors(){
      try{
     const toggleChecked = document.getElementById("extract-toggle").checked;
      if(toggleChecked && document.getElementById("song-details").style.display=="block"){
            const currentlyPlayingURL = await fetchTrackURL(accessToken);
            console.log(currentlyPlayingURL);
            fetchAndExtractColorsForTrack(currentlyPlayingURL,accessToken);
        }
      }catch(error){
        console.log("Error getting back to otigical colors from GET BPM Colors: " + error)
      }
    }
  
    // Function to update the background color based on BPM
    function updateBackgroundColor(bpm) {
        const body = document.body;
    
        let colorIndex = 0;

        // Calculate interval in ms (BPM is beats per minute, so we convert it to beats per second)
        const interval = 60 / bpm * 1000;

        // Set up color flashing
        async function changeColor() {
  let rand = document.getElementById("extract-toggle1").checked;
          if(subCode){
            await sendColorToSecondary(customFlashingColors[colorIndex]);
          }
            body.style.backgroundColor = customFlashingColors[colorIndex];
            //body.style.transition= "background-color 0 ease";
            oldCI=colorIndex;
          // if random is true then make colour index some random number from custom flashing colours length
          if(rand){
            while(colorIndex==oldCI){
            colorIndex = Math.floor(Math.random() * customFlashingColors.length);
            }
          }else{
            colorIndex = (colorIndex + 1) % customFlashingColors.length;
          }

          // Send the color change to the /secondary route
          
        }

        // Clear the previous interval (if any) to avoid multiple flashing intervals
        clearInterval(body.intervalId);

        // Check if the BPM is valid and not 0 or N/A
        if (bpm > 0) {
            body.intervalId = setInterval(changeColor, interval);
        } else {
            body.style.backgroundColor = "#424242";
            // Stop flashing if BPM is 0 or N/A
            clearInterval(body.intervalId);
        }
    }


async function sendColorToSecondary(color) {
    let transition = document.getElementById('transition-slider').value;

    try {
        // Use fetch to send a PUT request to the /updateColor route
        await fetch(`/updateColor/${encodeURIComponent(subCode)}/${encodeURIComponent(color)}/${encodeURIComponent(transition)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error sending color to /updateColor:', error);
    }
}

  let oldoverlay;
const overlayElement = document.getElementById('song-info');
async function sendOverlayData() {
  if(!oldoverlay){
    oldoverlay=overlayElement.innerHTML;
  }
  if((overlayElement.innerHTML)!==oldoverlay){
    let overlayHTML = overlayElement.innerHTML;

    // Check if currentSongUrl has a value
    if (currentSongUrl) {
        // Append a button with the URL if it has a value
        const playButton = `<div id="song-link-btn"><br><button id="song-link" class="hide-ui" style="opacity:0.88;" onclick="window.open('${currentSongUrl}', '_blank')">Play the Song</button></div>`;
        overlayHTML += playButton;
    }
    // console.log('Sending overlay data:', overlayHTML);
oldoverlay=overlayElement.innerHTML;
    fetch(`/saveoverlaydata?code=${encodeURIComponent(subCode)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Change content type to JSON
        },
        body: JSON.stringify({ overlayHTML }), // Send the data as JSON
    })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error sending overlay data:', error));
    
  }
}





let subCode;
function generateRandomCode() {
  // Function to generate a random 6-character code with numbers and letters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
  
  const mirrorColor = document.getElementById('subscribe');
  mirrorColor.addEventListener('click', becomeMirror);
  const goToMirror = document.getElementById('goToMirror');
  goToMirror.addEventListener('click', subscribeToMirror);
function becomeMirror() {
  // Generate a random code
 subCode= generateRandomCode();
  // Append the code to the button text
  const button = document.getElementById('subscribe');
  button.textContent = `Mirror Colors Code 👇`;
 // Display the code for copying
  const codeDisplay = document.getElementById('code-display');
  codeDisplay.textContent = `Code: ${subCode}`;

  // Copy the code to the clipboard
  const dummyElement = document.createElement('textarea');
  dummyElement.value = subCode;
  document.body.appendChild(dummyElement);
  dummyElement.select();
  document.execCommand('copy');
  document.body.removeChild(dummyElement);


}
 function subscribeToMirror() {
   const codeDisplay = document.getElementById('code-display');
   codeDisplay.textContent
   // Redirect to /subscribe.html in a new window
   const newWindow = window.open(`/subscribe.html${codeDisplay.textContent.includes('Code: ')?`?code=${subCode}`:''}`, '_blank');
   newWindow.focus();
 } 

  
    const rangeElement = document.getElementById('transition-slider');
    const sliderValue = document.getElementById('slider-label');
    const body = document.body;
      // Add an event listener to the slider for input changes
    rangeElement.addEventListener('input', updateTransition);

    const bpmSpan = document.getElementById("bpm");
    const sliderLabel = document.getElementById("slider-label");

    function updateTransition(){
      updateStepBasedOnBPM();
      // Get the slider value
      const sliderVal = rangeElement.value;
    
      // Update the body's transition duration and the displayed value
      body.style.transition = `background-color ${sliderVal}s ease`;
      sliderValue.textContent = `Transition duration: ${sliderVal}s`;
      if(isTokenExpired){
        console.log('Token is expired in transition upd func')
        checkAndRefreshToken();
      }
    }

  
    // Function to update the step attribute of the range input and adjust the slider value
    function updateStepBasedOnBPM() {
      // Get the BPM value from the span and parse it as an integer
      const bpmValue = parseFloat(lastKnownBPM, 10);
      let transitionDurationSeconds;
    if(lastKnownBPM>0){
      // Calculate the transition duration in seconds based on BPM
      transitionDurationSeconds = 60 / bpmValue.toFixed(3);
    }else{
      // Set the transition duration to 0 if BPM is 0 or N/A
      transitionDurationSeconds = 1;
    }
      // Calculate the number of steps (always 8 steps)
      const numSteps = 8;
    
      // Calculate the step size based on the number of steps
      const stepSize = transitionDurationSeconds / numSteps;
    
      console.log("BPM Value:", bpmValue);
      console.log("Transition Duration (seconds):", transitionDurationSeconds);
      console.log("Division of millis:", numSteps);
      console.log("Step Size:", stepSize);
    
      // Get the current slider value
      const currentSliderValue = parseFloat(rangeElement.value);
    
      // Calculate the closest step value based on the user's set value
      const closestStep = Math.round(currentSliderValue / stepSize);
    
      console.log("Current Slider Value:", currentSliderValue);
      console.log("Closest Step:", closestStep);
    
      // Calculate the new slider value based on the closest step
      const newSliderValue = closestStep * stepSize;
    
      console.log("New Slider Value:", newSliderValue);
      console.log(`\n`);
      // Update the slider label with the new step value
      sliderLabel.textContent = `Transition Duration: ${stepSize.toFixed(3)}s`;
    
      // Update the slider value with the new calculated value
      rangeElement.value = newSliderValue.toFixed(3).toString();
    
      // Set the transition duration as the step for the range input
      rangeElement.step = stepSize.toFixed(3).toString();
    
      // Update the body's transition duration based on the new BPM
      body.style.transition = `background-color ${stepSize.toFixed(3)}s ease`;
      isTransitionUpdated = true;
    }

    // Add an event listener to the BPM span to trigger slider update when BPM changes
    bpmSpan.addEventListener("change", updateTransition);

    
    
  
    // Event listener for the "Set Colors" button
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

    // Event listener for the "Default Colors" button
    defaultColorsButton.addEventListener("click", function () {
        // Set the default colors for flashing
        setDefaultColors();
    });

  document.getElementById("random-colors-button").addEventListener("click", getRandomColors);

  function getRandomColors() {
      const numColors = Math.floor(Math.random() * (lastKnownBPM - 4 + 1)) + 4; // Random number between 4 and 15
      fetch(`/randomColors?numColors=${numColors}`)
          .then(response => response.json())
          .then(data => {
              const randomColors = data.randomColors;
              customFlashingColors = randomColors;
              console.log(randomColors);
          })
          .catch(error => console.error('Error fetching random colors:', error));
  }


    // Event listener for setting a custom BPM
    const setCustomBPMButton = document.getElementById("set-custom-bpm");
    setCustomBPMButton.addEventListener("click", function () {
        const customBPMInput = document.getElementById("custom-bpm-input");
        const inputBPM = parseFloat(customBPMInput.value);

        if (!isNaN(inputBPM) && inputBPM > 0) {
            // Set the custom BPM and flag
            customBPM = inputBPM;
            isCustomBPM = true;
            customTrackURL = "";
            document.getElementById("toggle-container").style.display = "none";
            updateBPMOverlay();
        } else {
            showAlert("Please enter a valid BPM greater than 0.");
        }
    });

    // Event listener for the "Get BPM" button
    const getBPMButton = document.getElementById("get-bpm-button");
    getBPMButton.addEventListener("click", async function () {
        try {
            // Get the custom track URL from the input field
            const inputTrackURL = document.getElementById("custom-track-url").value.trim();

            if (inputTrackURL) {
                // Fetch BPM from the Spotify Web API using the custom track URL
                const bpm = await fetchBPMFromCustomTrackURL(inputTrackURL);
                if (!isNaN(bpm) && bpm > 0) {
                    // Set the custom BPM and flag
                    customBPM = bpm;
                    isCustomBPM = true;
                    customTrackURL = inputTrackURL;
                    document.getElementById("toggle-container").style.display = "none";
                    fetchAndExtractColorsForTrack(inputTrackURL, accessToken);
                  
                // Check if there is a change in song title or BPM
                if (songTitleElement.textContent !== "custom" || bpm !== lastKnownBPM) {
                    updateBPMOverlay();
                }
                } else {
                    showAlert("Custom URL BPM could not be fetched or is invalid.");
                }
            } else {
                console.error("Custom Track URL is empty.");
                showAlert("Custom Track URL is empty.");
            }
        } catch (error) {
            console.error("Error fetching BPM:", error);
        }
    });

    // Event listeners for tempo multiplier buttons
    const tempoHalfButton = document.getElementById("half-button");
    tempoHalfButton.addEventListener("click", function () {
        bpmMultiplier = 0.5;
        updateBPMOverlay();
    });

    const tempoDoubleButton = document.getElementById("double-button");
    tempoDoubleButton.addEventListener("click", function () {
        bpmMultiplier = 2;
        updateBPMOverlay();
    });

    const tempoQuadrupleButton = document.getElementById("quadruple-button");
    tempoQuadrupleButton.addEventListener("click", function () {
        bpmMultiplier = 4;
        updateBPMOverlay();
    });

    const resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("click", function () {
        bpmMultiplier = 1;
        updateBPMOverlay();
    });

    // Event listener for the "Stop" button
    const stopButton = document.getElementById("stop-button");
    stopButton.addEventListener("click", function () {
        bpmMultiplier = 0; // Reset the BPM multiplier to 1x
        updateBPMOverlay();
    });

    // Event listener for the "Switch to Currently Playing" button
    switchToCurrentlyPlayingButton.addEventListener("click", function () {
        isCustomBPM = false; // Switch to currently playing mode
        updateBPMOverlay(); // Start fetching currently playing BPM
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
        document.getElementById("extract-toggle").checked = false;
    }


let vibrance = 0;
let brightness = 0;

// Get references to the sliders and their text elements
let saturationSlider = document.getElementById("color-saturation");
let vibranceSlider = document.getElementById("color-vibrance");
let brightnessSlider = document.getElementById("color-brightness");
let saturationText = document.getElementById("saturation-text");
let vibranceText = document.getElementById("vibrance-text");
let brightnessText = document.getElementById("brightness-text");
let submitButton = document.getElementById("submit-btn");



// Function to send colors and color adjustments to server
function sendColorsAndAdjustments() {
    let saturationChange = saturationSlider.value;
    let vibranceChange = vibranceSlider.value;
    let brightnessChange = brightnessSlider.value;

    // Ensure values are within valid range
    saturationChange = Math.min(100, Math.max(-100, saturationChange));
    vibranceChange = Math.min(100, Math.max(-100, vibranceChange));
    brightnessChange = Math.min(100, Math.max(-100, brightnessChange));

    fetch('/adjustColors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            customFlashingColors,
            saturationChange,
            vibranceChange,
            brightnessChange,
        }),
    })
    .then(response => response.json())
    .then(data => {
        customFlashingColors = data.newColors;
        vibrance = data.newVibrance;
        brightness = data.newBrightness;
      

        console.log('New colors:', customFlashingColors);
        console.log('New vibrance:', vibrance);
        console.log('New brightness:', brightness);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function to update slider text
function updateSliderText(slider, textElement) {
    textElement.textContent = slider.value;
}

// Update adjustments whenever the sliders change
saturationSlider.oninput = function() {
    updateSliderText(saturationSlider, saturationText);
    // Avoid immediate changes, only trigger on button click
};

vibranceSlider.oninput = function() {
    updateSliderText(vibranceSlider, vibranceText);
    // Avoid immediate changes, only trigger on button click
};

brightnessSlider.oninput = function() {
    updateSliderText(brightnessSlider, brightnessText);
    // Avoid immediate changes, only trigger on button click
};

// Handle adjustments when the submit button is clicked
submitButton.onclick = function() {
    sendColorsAndAdjustments();

  // Reset sliders to 0
  saturationSlider.value = 0;
  vibranceSlider.value = 0;
  brightnessSlider.value = 0;

  // Update slider text to show 0
  updateSliderText(saturationSlider, saturationText);
  updateSliderText(vibranceSlider, vibranceText);
  updateSliderText(brightnessSlider, brightnessText);
};

  

    // Function to show an alert to the user
    function showAlert(message) {
        alert(message);
    }

    // Function to handle the "no token provided" or "Expired token" scenarios
    function handleTokenExpiration() {
        // Hide elements when there's no token or it's expired
        document.getElementById('now-playing').style.display = 'none';
        document.getElementById('song-details').style.display = 'none';

        // Show a message above the login button
        document.getElementById('login-message').textContent = 'Please login to get the currently playing song.';
        document.getElementById('login-message').style.display = 'block';

        // Set isCustomBPM to true to stop fetching currently playing details
        isCustomBPM = true;
        customBPM = 0;
        lastKnownBPM = 0;
    }



    const hideUI = document.getElementById("hide-ui");
    const controlsContainer = document.querySelector(".controls-container");
    const overlayContainer = document.querySelector(".overlay-container");
    const forSpaceContainer = document.querySelector(".for-space");


    hideUI.addEventListener("click", function () {
      if (controlsContainer.classList.contains("hidden-controls")) {
          controlsContainer.classList.remove("hidden-controls");
          overlayContainer.style.marginTop = "5.5vh"; // Reset the margin
          forSpaceContainer.style.position = "relative";
          forSpaceContainer.style.paddingBottom = "0"; // Reset padding
      } else {
          controlsContainer.classList.add("hidden-controls");
          overlayContainer.style.marginTop = "25.65vh"; // Move overlay to the middle
          forSpaceContainer.style.position = "relative";
          forSpaceContainer.style.paddingBottom = "57%"; // No padding when controls are hidden
      }
    });



    // Function to fetch the best quality image URL for a Spotify track
    async function fetchBestQualityImageURL(trackId, accessToken) {
      try {
        // Fetch track details to get album ID
        const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
    
        const trackData = await trackResponse.json();
    
        if (trackData.album && trackData.album.images && trackData.album.images.length > 0) {
          // Sort images by size and get the last (largest) image
          const images = trackData.album.images.sort((a, b) => b.width - a.width);
          const bestQualityImageURL = images[0].url;
          return bestQualityImageURL;
        } else {
          console.error("No album images found.");
          return null;
        }
      } catch (error) {
        console.error("Error fetching best quality image URL:", error);
        return null;
      }
    }
    
    
    
    
    // Function to extract colors from an image URL and set custom colors for flashing
    async function extractColorsFromImage(imageURL) {
      try {
        // Update the URL to match the new route
        const imageUrl = encodeURIComponent(imageURL);
        const response = await fetch(`/getColors?url=${imageUrl}`);
        const data = await response.json();
    
            if (Object.keys(data).length > 0) {
              // Convert the response object into an array of colors
              const extractedColors = Object.values(data);
              // Check if the arrays are different
        const areColorsDifferent = !arraysEqual(extractedColors, customFlashingColors);
        
        if (areColorsDifferent && extractedColors.length > 0) {
            setCustomColors(extractedColors);
            savedExtractedColors = extractedColors;
        }
          console.log("Colors received from server:", extractedColors);
        } else {
          setCustomColors(defaultFlashingColors);
          console.error("No colors extracted from the image.");
          // showAlert("No colors extracted from the image.");
        }
      } catch (error) {
        console.error("Error fetching colors from image:", error);
      }
    }

  
    // Function to compare two arrays for equality
    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    const extractToggle = document.getElementById('extract-toggle');
    
    extractToggle.addEventListener('change', function () {
        if (this.checked) {
              setCustomColors(savedExtractedColors);
          getBackToInternalColors();
          
        } else {
            setCustomColors(defaultFlashingColors);
        }
    });
    
    
    // Function to fetch the best quality image URL for a track and extract colors
    async function fetchAndExtractColorsForTrack(trackURL, accessToken) {
      if((isSkipping && ((Date.now() - lastSkipTimestamp) > 6250)) || !isSkipping) {
      try {
        const trackId = extractTrackIdFromURL(trackURL);
        const bestQualityImageURL = await fetchBestQualityImageURL(trackId, accessToken);
    
        if (bestQualityImageURL) {
          // Call the function to extract colors from the image URL
          extractColorsFromImage(bestQualityImageURL);
        } else {
          console.error("No best quality image URL found.");
          showAlert("No best quality image URL found.");
        }
      } catch (error) {
        console.error("Error fetching and extracting colors for track:", error);
      }
      }
    }


        // Event listener for custom BPM input field to work on hitting "Enter"
    const customBpmInput = document.getElementById("custom-bpm-input");
    customBpmInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent the default form submission
            setCustomBPMButton.click(); // Trigger the "Set BPM" button click
        }
    });
          // Event listener for custom BPM input field to work on hitting "Enter"
    const customTrackInput = document.getElementById("custom-track-url");
    customTrackInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent the default form submission
            getBPMButton.click(); // Trigger the "Set BPM" button click
        }
    });
    // setColorsButton
  




    // Add event listeners for the playback control buttons
    document.getElementById('play-pause-button').addEventListener('click', playOrPause);
    document.getElementById('next-song-button').addEventListener('click', playNext);
    document.getElementById('prev-song-button').addEventListener('click', playPrevious);
    let playPauseMultiplier=1;
  
    // Function to play or pause the current track
    async function playOrPause() {
        try {
            const playPauseButton = document.getElementById('play-pause-button');
            const tempoControlButtons = document.querySelectorAll('.tempo-controls button');
    
            // Fetch the user's current playback state
            const response = await fetch('https://api.spotify.com/v1/me/player', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
    
            if (response.status === 200) {
                const data = await response.json();
                // Check the playback state
              if (data.is_playing) {
        // If currently playing, send a pause request
        const pauseResponse = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
    
        if (pauseResponse.status === 204) {
            console.log('Playback paused.');
            togglePlayPauseIcon(false); // Change icon to play
            isPlaying = false;
            playPauseMultiplier = bpmMultiplier;
            console.log(playPauseMultiplier);
            tempoControlButtons.forEach((button) => {
                if (button.textContent === `Stop`) {
                    button.click(); // Click the applicable tempo control button
                }
            });
        } else {
            console.error('Error pausing playback:', pauseResponse.statusText);
        }
    }
    else {
                    // If paused, send a play request
                    const playResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });
    
                    if (playResponse.status === 204) {
                        console.log('Playback started.');
                        togglePlayPauseIcon(true); // Change icon to pause
                        isPlaying = true;
    
                        tempoControlButtons.forEach((button) => {
                            if (button.textContent === `${playPauseMultiplier}x`) {
                                button.click(); // Click the applicable tempo control button
                            }
                        });
                    } else {
                        console.error('Error starting playback:', playResponse.statusText);
                    }
                }
            } else {
                console.error('Error fetching playback state:', response.statusText);
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    }

    // Function to play the next track
    async function playNext() {
      if(isSkipping){
      await new Promise(resolve => setTimeout(resolve, 233));
      }

      
        // Send a request to play the next track
        fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        })
        .then(response => {
            if (response.status === 204) {
                // Status 204 indicates success with no content (empty response)
                console.log('Skipped to the next song successfully.');
               if(isSkipMixActive){
                 firstRunSkipMix = true
               }
            } else {
                // Handle other status codes or errors here
                console.error('Error skipping to the next song. Status code:', response.status);
            }
        })
        .catch(error => {
            console.error('Error skipping to the next song:', error);
        });
    }
    
    // Function to play the previous track
    function playPrevious() {
        // Send a request to play the previous track
        fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        })
        .then(response => {
            if (response.status === 204) {
                // Status 204 indicates success with no content (empty response)
                console.log('Went back to the previous song successfully.');
              if(isSkipMixActive){
                firstRunSkipMix = true
              }
            } else {
                // Handle other status codes or errors here
                console.error('Error going back to the previous song. Status code:', response.status);
            }
        })
        .catch(error => {
            console.error('Error going back to the previous song:', error);
        });
    }


  // Function to toggle play/pause icon
  function togglePlayPauseIcon(isPlaying) {
      const playPauseButton = document.getElementById('play-pause-button');
      if (isPlaying) {
          playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
          playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
      }
  }

  
    togglePlayPauseIcon(true); 

  // Function to update the volume using the Spotify Web API
async  function updateVolume(volumePercent) {
      // Calculate the volume value (0 to 100)
      const volumeValue = Math.min(Math.max(volumePercent, 0), 100);
  
      // Send a request to update the volume
      fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumeValue}`, {
          method: 'PUT',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
          },
      })
      .then(response => {
          if (response.status === 204) {
              console.log('Volume updated successfully.');
          }else if (response.status === 401) {
              checkAndRefreshToken();
              console.log('Volume updated successfully.');
          } else {
              console.error('Error updating volume:', response.statusText);
          }
      })
      .catch(error => {
          console.error('Error updating volume:', error);
      });
  }

    // Listen for changes in the volume slider
    const volumeSlider = document.getElementById('volumeRange');
    volumeSlider.addEventListener('input', () => {
        const volumePercent = volumeSlider.value;
        updateVolume(volumePercent);
    });

        

let lastSkipTimestamp = 0; // Initialize the timestamp to 0
let bpmInSkip = null
let songInSkip = null
// Function to skip to the next song
async function skipToNext() {
  if (songInSkip!==lastKnownSongDetails && bpmInSkip !== lastKnownBPM){
    try {
        const currentTime = Date.now(); // Get the current timestamp
          console.log(`${currentTime - lastSkipTimestamp} OUTSIDE MMMMMMMMMMMMMMMMMM`);
        // Check if it's been less than 3 seconds since the last skip
        if (currentTime - lastSkipTimestamp > 1000) {
                  await playNext();
        console.log("Passed through PLAY_NEXT")
        
        songInSkip=lastKnownSongDetails
        bpmInSkip=lastKnownBPM
console.log(`${currentTime - lastSkipTimestamp} INSIDE------------`);
        // Update the last skip timestamp
        lastSkipTimestamp = Date.now();
        }
      console.log(`A second hasnt passed before next skip`);
        
        // Call the playNext function to skip to the next track


    } catch (error) {
        console.error("Error skipping to the next song:", error);
        showAlert("Error skipping to the next song. Please try again.");
    }
  }
  console.log("Passed through SKIP_TO_NEXT BUT song or bpm havent yet changed so no skip")
}






const shuffleIcon = document.getElementById("shuffle-icon");
const unshuffleIcon = document.getElementById("unshuffle-icon");


// Function to toggle shuffle state with debounce
async function shuffleToggleDebounced() {
  if (!shuffleProcess) {
    shuffleProcess = true;

    // Toggle the shuffle state
    isShuffleEnabled = !isShuffleEnabled;

    try {
      // Send a request to the Spotify API to toggle shuffle
      await toggleShuffleOnSpotify(isShuffleEnabled);

      // Update the shuffle icon
      if (!isShuffleEnabled) {
        unshuffleIcon.style.display = "none";
        shuffleIcon.style = "";
      } else {
        shuffleIcon.style.display = "none";
        unshuffleIcon.style = "";
      }
    } catch (error) {
      console.error("Error toggling shuffle state:", error);
      // Handle the error here as needed
    }

    setTimeout(() => {
      shuffleProcess = false;
    }, 500); // Set a timeout to allow the function to be called again after 1 second
  }
}

// Attach the debounced function to the button click event
document.getElementById('shuffle-toggle-button').addEventListener('click', shuffleToggleDebounced);


let shuffleProcess = false;

async function setShuffle(setShuffleState) {
  if (shuffleProcess) {
    return; // Do not proceed if the process is already running
  }

  try {
    shuffleProcess = true;
    
    // Send a request to the Spotify API to toggle shuffle
    await toggleShuffleOnSpotify(setShuffleState);

    // Update the shuffle icon
    if (!isShuffleEnabled) {
      unshuffleIcon.style.display = "none";
      shuffleIcon.style = "";
    } else {
      shuffleIcon.style.display = "none";
      unshuffleIcon.style = "";
    }
  } catch (error) {
    console.error("Error setting shuffle:", error);
  } finally {
    shuffleProcess = false;
  }
}

// Function to send a request to the Spotify API to toggle shuffle
async function toggleShuffleOnSpotify(shuffleState) {
  const apiUrl = `https://api.spotify.com/v1/me/player/shuffle?state=${shuffleState}`;

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  if (response.status === 204) {
    // Shuffle command sent successfully
    console.log("Shuffle state updated");
    isShuffleEnabled = shuffleState;
  } else {
    // Handle error cases
    isShuffleEnabled = !shuffleState;
    console.error("Error updating shuffle state");
  }
}

  
//         // Function to send a request to the Spotify API to toggle shuffle
//     function toggleShuffleOnSpotify(shuffleState) {
//         const apiUrl = `https://api.spotify.com/v1/me/player/shuffle?state=${shuffleState}`;

//         fetch(apiUrl, {
//             method: "PUT",
//             headers: {
//                 "Authorization": `Bearer ${accessToken}`,
//                 "Content-Type": "application/json"
//             }
//         })
//         .then(response => {
//             if (response.status === 204) {
//                 // Shuffle command sent successfully
//                 console.log("Shuffle state updated");
//             } else {
//                 // Handle error cases
//                 console.error("Error updating shuffle state");
//             }
//         })
//         .catch(error => {
//             console.error("Error updating shuffle state:", error);
//         });
//     }
// document.getElementById('shuffle-toggle-button').addEventListener('click', shuffleToggle);


  
// Function to validate BPM threshold input
function validateBPMThresholdInput(input) {
    const bpm = parseInt(input, 10);
    if (isNaN(bpm) || bpm < 1 || bpm > 300) {
        showAlert("Invalid BPM threshold. Please enter a number between 1 and 300.");
        console.log("Invalid BPM threshold. Please enter a number between 1 and 300.");
        return false;
    }
    return true;
}

// Function to validate range inputs
function validateRangeInputs(lowRange, highRange) {
    const low = parseInt(lowRange, 10);
    const high = parseInt(highRange, 10);

    if (isNaN(low) || isNaN(high) || low < 1 || low > 300 || high < 1 || high > 300 || low >= high) {
        showAlert("Invalid BPM range. Please enter valid low and high BPM values (1-300) where low is less than high.");
        console.log("Invalid BPM range. Please enter valid low and high BPM values (1-300) where low is less than high.");
        return false;
    }

    return true;
}

// Helper function to determine if a skip should be performed based on BPM condition
async function shouldSkip(input, currentBPM, operation) {
    if (operation === "above") {
        // For "above" mode
        console.log("Checking 'above' mode.");
        return input <= currentBPM;
    } else if (operation === "below") {
        // For "below" mode
        console.log("Checking 'below' mode.");
        return input >= currentBPM;
    } else if (input.lowRange !== undefined && input.highRange !== undefined) {
        // For "outside" mode
        console.log("Checking 'outside' mode.");
        return currentBPM < input.lowRange || currentBPM > input.highRange;
    }
}

// Helper function to perform skip action after validating input and BPM condition
async function performSkipAction(input, skipFunction, operation) {
    if (!isSkipping || isSkipInProgress) return;

    isSkipInProgress = true; // Set the flag to indicate skip is in progress

    const currentBPM = lastKnownBPM;

    if (currentBPM !== null) {
        // Evaluate the BPM condition before performing the skip action
        if (await shouldSkip(input, currentBPM, operation)) {
            console.log("Skipping to occur with data:", input, ", currentBPM:", currentBPM, ", operation:", operation);
            await skipToNext();
        }
    }

    isSkipInProgress = false; // Reset the flag when skip is complete
}

// Main function to perform skip action based on selected mode
async function performSkipBasedOnMode() {
    // Check if song and BPM were updated before performing a skip
  songAndBPMUpdated = true;
  // log(`${songAndBPMUpdated} ${isSkipping}`, 'outside skip method');
    if (songAndBPMUpdated && isSkipping) {
      log(songAndBPMUpdated && isSkipping, 'inside skip method');
        songAndBPMUpdated = false; // Reset the flag
        setTimeout(async () => {
            // Check if skipping is active and not in custom BPM mode
            if (isSkipping && !isCustomBPM && isPlaying) {
                const selectedMode = document.getElementById("skip-mode-dropdown").value;
                const bpmThresholdInput = document.getElementById("bpm-threshold");
                const lowRangeInput = document.getElementById("low-range");
                const highRangeInput = document.getElementById("high-range");
              log(selectedMode, bpmThresholdInput.value, lowRangeInput.value, highRangeInput.value, 'inside skip method before switch');


                switch (selectedMode) {
                    case "below":
                        if (validateBPMThresholdInput(bpmThresholdInput.value)) {
                            // Call the appropriate skip update function for "below" mode
                            console.log("Performing 'below' mode skip.");
                            performSkipAction(parseInt(bpmThresholdInput.value, 10), 'skipBelowBPM', "below");
                        }
                        break;
                    case "above":
                        if (validateBPMThresholdInput(bpmThresholdInput.value)) {
                            // Call the appropriate skip update function for "above" mode
                            console.log("Performing 'above' mode skip.");
                            performSkipAction(parseInt(bpmThresholdInput.value, 10), 'skipAboveBPM', "above");
                        }
                        break;
                    case "outside":
                        if (validateRangeInputs(lowRangeInput.value, highRangeInput.value)) {
                            // Call the skip update function for "outside" mode
                            console.log("Performing 'outside' mode skip.");
                            performSkipAction(
                                {
                                    lowRange: parseInt(lowRangeInput.value, 10),
                                    highRange: parseInt(highRangeInput.value, 10),
                                },
                                'skipOutsideBPMRange',
                                "outside"
                            );
                        }
                        break;
                }
            }
        }, 1000); // Delay for 2 seconds before performing the skip
    }
}

// Call the main skip action function to start performing skips




// Define variables to manage the skip mix process
let isSkipMixActive = false;
let currentSkipTime = 0;
let lastTrackURI = null;
let runCountSkip = 0;

// Function to toggle Skip Mix
function toggleSkipMix() {
    isSkipMixActive = !isSkipMixActive;
    if (isSkipMixActive) {
        updateSkipMixButton("Stop Skip Mix");
        updateSkipMixMessage("Skip Mix Active \n");
        performSkipMix();
    } else {
        runCountSkip = 0;
        updateSkipMixButton("Start Skip Mix");
        updateSkipMixMessage("Skip Mix Inactive \n");
        currentTime=0;
        timeToSkip=0;
        currentTrack = null;
        firstRunSkipMix = true;
        currentSongInSkip =null;
        countRuns=0;
    }
}


  // Function to update the skip mix message
  function updateSkipMixMessage(message = "") {
      const messageField = document.getElementById("skip-mix-message");
      const existingMessage = messageField.textContent;
      const messages = existingMessage.split('\n');
      if (messages.length >= 2) {
          // Keep only the last two messages (latest and last older message)
          messages.splice(0, messages.length - 2);
      }
      const newMessage = messages.join('\n') + '\n' + message;
      messageField.textContent = newMessage;
  }


// Function to update the Skip Mix button text
function updateSkipMixButton(text) {
    const skipMixButton = document.getElementById("skip-mix-button");
    skipMixButton.textContent = text;
}

  let currentTime = 0;
  let timeToSkip = 0;
  let currentTrack = null;
  let firstRunSkipMix = true;
  let currentSongInSkip =null;
  let countRuns=0;
  let consecutiveRuns=0;
  let lastKnownBPM1;
  let shuffleToggled = false;





  
// async function performSkipMix() {
//   console.log(`Inside func start - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}`)
//     if (isSkipMixActive && isPlaying) {
//         if (isTokenExpired) {
//             await checkAndRefreshToken();
//         }
//       currentTime=Date.now()

//         if (firstRunSkipMix) {
//             // On the first run, skip the currently playing song to the start of its second third
//             currentTime=Date.now()
//             currentTrack = await getCurrentTrack();
//             if (currentTrack) {
//               countRuns++;
//       console.log(`In the first iteration - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}`)

              
//               // Get configuration values
//               const randomSeekPosition = document.getElementById("random-seek-position").checked;
//               const randomSkipPosition = document.getElementById("random-skip-position").checked;
              
//               // Calculate seek and skip positions
//               let seekPosition;
//               let timeToSkipPosition;
//               // Calculate seek and skip positions
//               if (randomSeekPosition && randomSkipPosition) {
//                 while(true){
//                 while (true) {
//                   seekPosition = getRandomSeconds(3, currentTrack.duration - 12);
//                   if (!(seekPosition > currentTrack.duration - 12)) {
//                     break;
//                   }
//                 }
//                 while (true) {
//                   timeToSkipPosition = getRandomMilliseconds(15000, (currentTrack.duration - seekPosition) * 1000);
//                   if (!(timeToSkipPosition > currentTrack.millis - 12000 && currentTrack.duration - seekPosition >= timeToSkipPosition / 1000)) {
//                     break;
//                   }
//                 }
//                   if(seekPosition*1000<=timeToSkipPosition){
//                     break;
//                   }
                    
//                 }
//               }else if (randomSeekPosition) {
//                 while(true){
//                   seekPosition = getRandomSeconds(3, currentTrack.duration /3);
                  
//                   if (seekPosition < (currentTrack.duration / 3)+12) {
//                     break;
//                 }
                  
                  
//                 }
//                 timeToSkipPosition=(currentTrack.millis/3*2)-(seekPosition*1000);
//               } else if (randomSkipPosition) {
//                 while(true){
//                               timeToSkipPosition = getRandomMilliseconds((currentTrack.millis/3)+(currentTrack.millis/3/2), currentTrack.millis -12000);
                  
//                   if (timeToSkipPosition > (currentTrack.millis / 3)+10) {
//                     break;
//                 }
                  
                  
//                 }
//                 seekPosition=currentTrack.duration/3;
//           } else {
//             // Neither seek nor skip are random
//             seekPosition = currentTrack.duration/3;
//             timeToSkipPosition = currentTrack.millis/3;
//           }






//                 const songName = currentTrack.name; // Get song name
//                 currentSongInSkip = currentTrack.name;
//                 const artists = currentTrack.artists.map(artist => artist.name).join(', '); // Get all artists
//                 console.log(`Currently playing: ${songName} by ${artists}`); // Log song and artists
//                 updateSkipMixMessage(`Currently playing: ${songName} by ${artists}`);
//                 await seekToTime(seekPosition);
//                 currentSkipTime = timeToSkipPosition/1000;
//                 currentTime=Date.now();
//                 timeToSkip = currentTime + timeToSkipPosition;
//                 const timeToSkipInSeconds = (timeToSkip - currentTime) / 1000;
//                 const timeToSkipInSong = (timeToSkipPosition) / 1000;
//                 // Inside the performSkipMix function
//                 const timeToSkipInMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSeconds);
//                 const timeToSkipInSongInSeconds = timeToSkipInSong;
//                 const timeToSkipInSongMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSongInSeconds);
//                               console.log(`${countRuns} FIRST RUN________seek in seconds: ${secondsToMinutesAndSeconds(seekPosition)}, when to skip in seconds ${secondsToMinutesAndSeconds(timeToSkipPosition/1000)}`);
//               console.log(`Is it thyme in first inside 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}`)
//                 updateSkipMixMessage(`\nFirst Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition+timeToSkipInSongInSeconds)} in the song duration\nThe song will play for ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}\nCurrently playing song: ${songName} by ${artists}`);
//                 firstRunSkipMix = false;
//                 consecutiveRuns++;
//             }

//         } else if (Date.now() >= timeToSkip || secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000).includes("-")) {
//           consecutiveRuns++;

 
//           console.log(`BEFORE consecutive ${consecutiveRuns} runs check`)
//             if (consecutiveRuns % 2 === 0 && consecutiveRuns > 0 && !shuffleToggled) {
//               const shuffleIsActive = await isShuffleActive();
          
//               if (shuffleIsActive) {
//                 console.log(`Shuffle TURN OFF FROM ON IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
//                 await setShuffle(false);
//                 console.log(`Shuffle TURN ON FROM OFF FROM ON IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
//                 await setShuffle(true);
//               } else {
//                 console.log(`Shuffle TURN ON FROM OFF  IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
//                 await setShuffle(true);
//               }
          
//               shuffleToggled = true;
//             }
//           console.log(`AFTER consecutive ${consecutiveRuns} runs check`)
//             await skipToNextSong();
//             currentTrack = await getCurrentTrack();
//           if (currentTrack) {
//               countRuns++;

//               // Configuration object to store options
//           const options = {
//             maxOffset: 30000,
//             seekFraction: 1 / 3,
//             minInterval: 33,
//             seekSafety: 12,
//           };
          
//           // Get configuration values
//           const randomSeekPosition = document.getElementById("random-seek-position").checked;
//           const randomSkipPosition = document.getElementById("random-skip-position").checked;
          
//           // Function to generate a random offset within constraints
//           function getRandomOffset(maxOffset) {
//             return Math.floor(Math.random() * maxOffset);
//           }
          
//           // Calculate seek and skip positions
//           let seekPosition;
//           let timeToSkipPosition;
          
//           if (randomSeekPosition && randomSkipPosition) {
//             while(true){
//             while (true) {
//               seekPosition = getRandomSeconds(0, currentTrack.duration - 12);
//               if (!(seekPosition > currentTrack.duration - 12)) {
//                 break;
//               }
//             }
//             while (true) {
//               timeToSkipPosition = getRandomMilliseconds(15000, (currentTrack.duration - seekPosition) * 1000);
//               if (!(timeToSkipPosition > currentTrack.millis - 12000 && currentTrack.duration - seekPosition >= timeToSkipPosition / 1000)) {
//                 break;
//               }
//             }
//               if(seekPosition*1000<=timeToSkipPosition){
//                 break;
//               }

//             }
//           } else if (randomSeekPosition) {
//             // Only seek is random
//             while(true){
//                   seekPosition = getRandomSeconds(3, currentTrack.duration /3);
                  
//                   if (seekPosition < (currentTrack.duration / 3)+12) {
//                     break;
//                 }
                  
                  
//                 }
//             timeToSkipPosition=(currentTrack.millis/3*2)-(seekPosition*1000);
//           } else if (randomSkipPosition) {
//             while(true){
//                   timeToSkipPosition = getRandomMilliseconds((currentTrack.millis/3)+(currentTrack.millis/3/2), currentTrack.millis -12000);
                  
//                   if (timeToSkipPosition > (currentTrack.millis / 3)+10) {
//                     break;
//                 }
                  
                  
//                 }
//             seekPosition=currentTrack.duration/3;
//           } else {
//             // Neither seek nor skip are random
//             seekPosition = currentTrack.duration/3;
//             timeToSkipPosition = currentTrack.millis/3;
//           }


//             console.log(`${countRuns} CONSECUTIVE RUNS________seek in seconds: ${seekPosition}, when to skip in seconds ${timeToSkipPosition/1000}`) ;

            
//                 const songName = currentTrack.name; // Get song name
//                 currentSongInSkip = currentTrack.name;
//                 const artists = currentTrack.artists.map(artist => artist.name).join(', '); // Get all artists
//                 console.log(`Currently playing: ${songName} by ${artists}`); // Log song and artists
//                 updateSkipMixMessage(`Currently playing: ${songName} by ${artists}`);
//                 await seekToTime(seekPosition);
//                 currentSkipTime = timeToSkipPosition/1000;
//                 currentTime=Date.now();
//                 timeToSkip = currentTime + timeToSkipPosition;
//                 const timeToSkipInSeconds = (timeToSkip - currentTime) / 1000;
//                 const timeToSkipInSong = (timeToSkipPosition) / 1000;
//                 // Inside the performSkipMix function
//                 const timeToSkipInMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSeconds);
//                 const timeToSkipInSongInSeconds = timeToSkipInSong;
//                 const timeToSkipInSongMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSongInSeconds);

            
//          console.log(`In consecutive ${consecutiveRuns} - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}`)
//             // In subsequent runs, when the scheduled time arrives, skip to the next song
            
//               console.log(`Is it thyme in consecutive 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}`)

            
//                 updateSkipMixMessage(`\nCONSECUTIVE Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition+timeToSkipInSongInSeconds)} in the song duration\nThe song will play for ${secondsToMinutesAndSeconds((timeToSkip - Date.now())/1000)}\nCurrently playing song: ${songName} by ${artists}`);
//             firstRunSkipMix = false;
//             }
//           // Reset shuffleToggled at the end of the run
//           shuffleToggled = false;
//         }
//         lastKnownBPM<=0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;
//         currentTime = Date.now();
//         console.log(`At the end but insde skipmixactive plus is playing: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000/lastKnownBPM1)} and time current current time ${Date(currentTime*1)}`);
      
//         setTimeout(performSkipMix, 60000/lastKnownBPM1);
//     }else if(isSkipMixActive && !isPlaying){
//       console.log(`At the end but insde skipmixactive plus is NOT playing: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000/lastKnownBPM1)} and time current current time ${Date(currentTime)}`);
//       lastKnownBPM<=0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;
//       while(!isPlaying){
//         lastKnownBPM<=0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;
//         console.log("Not playing");
//         currentTime = Date.now();
//         console.log(`At the end but insde skipmixactive plus is NOT playing WHILE: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000/lastKnownBPM1)} and time current current time ${Date(currentTime)}`);
//         await wait(60000/lastKnownBPM1*3);
//       }
//       currentTime = Date.now();
//       performSkipMix();
//       console.log(`At the end but insde skipmixactive plus is playing NOW ACTIVE AFtER WHILE: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000/lastKnownBPM1)} and time current current time ${Date.parse(currentTime)}`);
//       setTimeout(performSkipMix, 60000/lastKnownBPM1);
//     }
// }

async function performSkipMix() {
    console.log(`Inside func start - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now()) / 1000)}`);

    if (isSkipMixActive && isPlaying) {
        if (isTokenExpired) {
            await checkAndRefreshToken();
        }

        currentTime = Date.now();

        if (firstRunSkipMix) {
            await handleFirstRun();
        } else if (shouldSkip()) {
            await handleSubsequentRun();
        }

        lastKnownBPM <= 0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;
        currentTime = Date.now();
        console.log(`At the end but inside skipmixactive plus is playing: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000 / lastKnownBPM1)} and time current current time ${Date(currentTime * 1)}`);

        setTimeout(performSkipMix, 60000 / lastKnownBPM1);
    } else if (isSkipMixActive && !isPlaying) {
        console.log(`At the end but inside skipmixactive plus is NOT playing: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000 / lastKnownBPM1)} and time current current time ${Date(currentTime)}`);
        lastKnownBPM <= 0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;

        while (!isPlaying) {
            lastKnownBPM <= 0 || !lastKnownBPM || isNaN(lastKnownBPM) ? lastKnownBPM1 = 100 : lastKnownBPM1 = lastKnownBPM;
            console.log("Not playing");
            currentTime = Date.now();
            console.log(`At the end but inside skipmixactive plus is NOT playing WHILE: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000 / lastKnownBPM1)} and time current current time ${Date(currentTime)}`);
            await wait(60000 / lastKnownBPM1 * 3);
        }

        currentTime = Date.now();
        performSkipMix();
        console.log(`At the end but inside skipmixactive plus is playing NOW ACTIVE AFTER WHILE: bpm ${lastKnownBPM1} and timeout to be ${secondsToMinutesAndSeconds(6000 / lastKnownBPM1)} and time current current time ${Date.parse(currentTime)}`);
        setTimeout(performSkipMix, 60000 / lastKnownBPM1);
    }
}

async function handleFirstRun() {
    currentTime = Date.now();
    currentTrack = await getCurrentTrack();

    if (currentTrack) {
        countRuns++;
        const { seekPosition, timeToSkipPosition } = calculatePositions(currentTrack);
        const songName = currentTrack.name;
        const artists = currentTrack.artists.map(artist => artist.name).join(', ');

        console.log(`${countRuns} FIRST RUN________seek in seconds: ${secondsToMinutesAndSeconds(seekPosition)}, when to skip in seconds ${secondsToMinutesAndSeconds(timeToSkipPosition / 1000)}`);

        updateSkipMixMessage(`\nFirst Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition + timeToSkipPosition / 1000)} in the song duration\nThe song will play for ${secondsToMinutesAndSeconds(timeToSkipPosition / 1000)}\nCurrently playing song: ${songName} by ${artists}`);

        await seekToTime(seekPosition);
        currentSkipTime = timeToSkipPosition / 1000;
        currentTime = Date.now();
        timeToSkip = currentTime + timeToSkipPosition;
        const timeToSkipInSeconds = (timeToSkip - currentTime) / 1000;
        const timeToSkipInSong = timeToSkipPosition / 1000;
        const timeToSkipInMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSeconds);
        const timeToSkipInSongInSeconds = timeToSkipInSong;
        const timeToSkipInSongMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSongInSeconds);

        console.log(`In first iteration - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now()) / 1000)}`);
        updateSkipMixMessage(`\nFirst Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition + timeToSkipInSongInSeconds)} in the song duration\nThe song will play for ${timeToSkipInSongMinutesAndSeconds}\nCurrently playing song: ${songName} by ${artists}`);

        firstRunSkipMix = false;
        consecutiveRuns++;
    }
}

async function handleSubsequentRun() {
    consecutiveRuns++;
    console.log(`BEFORE consecutive ${consecutiveRuns} runs check`);
            if (consecutiveRuns % 2 === 0 && consecutiveRuns > 0 && !shuffleToggled) {
              const shuffleIsActive = await isShuffleActive();
          
              if (shuffleIsActive) {
                console.log(`Shuffle TURN OFF FROM ON IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
                await setShuffle(false);
                await waitMS(888);
                console.log(`Shuffle TURN ON FROM OFF FROM ON IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
                await setShuffle(true);
              } else {
                console.log(`Shuffle TURN ON FROM OFF  IN CONSECUTIVE RUNS ${consecutiveRuns} CHECK SHUFFLE CHECK`);
                await setShuffle(true);
              }
          
              shuffleToggled = true;
            }

    console.log(`AFTER consecutive ${consecutiveRuns} runs check`);
    await skipToNextSong();
    const lastTrack = currentTrack;
    while (`${lastTrack.name},${lastTrack.artists.map(artist => artist.name).join(', ')}` === `${currentTrack.name},${currentTrack.artists.map(artist => artist.name).join(', ')}`){
      
      console.log(`Song hasn't yet changed \n${lastTrack.name} - ${lastTrack.artists.map(artist => artist.name).join(', ')} is same as \n${currentTrack.name} - ${currentTrack.artists.map(artist => artist.name).join(', ')}`)
      await waitMS(158);
    currentTrack = await getCurrentTrack();
    }
    if (currentTrack) {
        countRuns++;
        const { seekPosition, timeToSkipPosition } = calculatePositions(currentTrack);

        console.log(`${countRuns} CONSECUTIVE RUNS________seek in seconds: ${seekPosition}, when to skip in seconds ${secondsToMinutesAndSeconds(timeToSkipPosition / 1000)}`);

        const songName = currentTrack.name;
        const artists = currentTrack.artists.map(artist => artist.name).join(', ');

        updateSkipMixMessage(`\nCONSECUTIVE Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition + timeToSkipPosition / 1000)} in the song duration\nThe song will play for ${secondsToMinutesAndSeconds(timeToSkipPosition / 1000)}\nCurrently playing song: ${songName} by ${artists}`);

        await seekToTime(seekPosition);
        currentSkipTime = timeToSkipPosition / 1000;
        currentTime = Date.now();
        timeToSkip = currentTime + timeToSkipPosition;
        const timeToSkipInSeconds = (timeToSkip - currentTime) / 1000;
        const timeToSkipInSong = timeToSkipPosition / 1000;
        const timeToSkipInMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSeconds);
        const timeToSkipInSongInSeconds = timeToSkipInSong;
        const timeToSkipInSongMinutesAndSeconds = secondsToMinutesAndSeconds(timeToSkipInSongInSeconds);

        console.log(`In consecutive ${consecutiveRuns} - Is it thyme 🤨 ${(Date.now() >= timeToSkip)}, if not how much time left: ${secondsToMinutesAndSeconds((timeToSkip - Date.now()) / 1000)}`);

        updateSkipMixMessage(`\nCONSECUTIVE Seeked to: ${secondsToMinutesAndSeconds(seekPosition)}\nSkip will occur at ${secondsToMinutesAndSeconds(seekPosition + timeToSkipInSongInSeconds)} in the song duration\nThe song will play for ${timeToSkipInSongMinutesAndSeconds}\nCurrently playing song: ${songName} by ${artists}`);
    }

    // Reset shuffleToggled at the end of the run
    shuffleToggled = false;
}

function shouldSkip() {
    return Date.now() >= timeToSkip || secondsToMinutesAndSeconds((timeToSkip - Date.now()) / 1000).includes("-");
}

function calculatePositions(currentTrack) {
    const options = {
        maxOffset: 30000,
        seekFraction: 1 / 3,
        minInterval: 33,
        seekSafety: 12,
    };

    let randomSeekPosition = document.getElementById("random-seek-position").checked;
    let randomSkipPosition = document.getElementById("random-skip-position").checked;

    let seekPosition;
    let timeToSkipPosition;

    if (randomSeekPosition && randomSkipPosition) {
        while (true) {
            while (true) {
                seekPosition = getRandomSeconds(3, currentTrack.duration - 12);
                if (!(seekPosition > currentTrack.duration - 12)) {
                    break;
                }
            }
            while (true) {
                timeToSkipPosition = getRandomMilliseconds(15000, (currentTrack.duration - seekPosition) * 1000);
                if (!(timeToSkipPosition > currentTrack.millis - 12000 && currentTrack.duration - seekPosition >= timeToSkipPosition / 1000)) {
                    break;
                }
            }
            if (seekPosition * 1000 <= timeToSkipPosition) {
                break;
            }
        }
    } else if (randomSeekPosition) {
        while (true) {
            seekPosition = getRandomSeconds(3, currentTrack.duration / 3);

            if (seekPosition < (currentTrack.duration / 3) + 12) {
                break;
            }
        }
        timeToSkipPosition = (currentTrack.millis / 3 * 2) - (seekPosition * 1000);
    } else if (randomSkipPosition) {
        while (true) {
            timeToSkipPosition = getRandomMilliseconds((currentTrack.millis / 3) + (currentTrack.millis / 3 / 2), currentTrack.millis - 12000);

            if (timeToSkipPosition > (currentTrack.millis / 3) + 10) {
                break;
            }
        }
        seekPosition = currentTrack.duration / 3;
    } else {
        seekPosition = currentTrack.duration / 3;
        timeToSkipPosition = currentTrack.millis / 3;
    }

    return { seekPosition, timeToSkipPosition };
}













function waitMS(ms) {
  console.log(`Waiting ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

  
// Function to convert seconds to minutes and seconds
function secondsToMinutesAndSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minutes and ${remainingSeconds.toFixed(2)} seconds`;
}




// Function to get the current track's information from Spotify
async function getCurrentTrack() {
  await wait(200);
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const data = await response.json();
            
            return {
                uri: data.item.uri,
                duration: data.item.duration_ms / 1000, // Duration in seconds
                millis: data.item.duration_ms,
                name: data.item.name,
                artists:data.item.artists
            };
        } else {
            console.error('Error getting currently playing track:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error getting currently playing track:', error);
        return null;
    }
}

// Function to seek to a specific time in the current track
async function seekToTime(timeInSeconds) {
    try {
        const positionMs = Math.floor(timeInSeconds * 1000); // Convert to milliseconds
        const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 204) {
            console.log(`Seeking to ${timeInSeconds} seconds in the track.`);
            await wait(200);
        } else {
            console.error('Error seeking to specified time:', response.statusText);
        }
    } catch (error) {
        console.error('Error seeking to specified time:', error);
    }
}

// Function to skip to the next song
async function skipToNextSong() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 204) {
            console.log('Skipping to the next song.');
        }  else if (response.status === 401) {
              console.log('Refreshing token and retrying.');
            await checkAndRefreshToken();
            skipToNextSong()
          } 
        
        else {
            console.error('Error skipping to the next song:', response.statusText);
        }
    } catch (error) {
        console.error('Error skipping to the next song:', error);
    }
}

// Event listener for the Skip Mix button
document.getElementById('skip-mix-button').addEventListener('click', toggleSkipMix);

// Function to get a random time in seconds within the specified range
function getRandomSecondsFromSeconds(minSeconds, maxSeconds) {
    return Math.random() * (maxSeconds - minSeconds) + minSeconds;
}

// Function to get a random time in seconds from milliseconds within the specified range
function getRandomSecondsFromMilliseconds(minMillis, maxMillis) {
    const minSeconds = minMillis / 1000;
    const maxSeconds = maxMillis / 1000;
    return getRandomSecondsFromSeconds(minSeconds, maxSeconds);
}

// Function to get a random time in minutes from seconds within the specified range
function getRandomMinutesFromSeconds(minSeconds, maxSeconds) {
    const minMinutes = minSeconds / 60;
    const maxMinutes = maxSeconds / 60;
    return getRandomMinutes(minMinutes, maxMinutes);
}

// Function to get a random time in minutes from milliseconds within the specified range
function getRandomMinutesFromMilliseconds(minMillis, maxMillis) {
    const minMinutes = minMillis / 60000;
    const maxMinutes = maxMillis / 60000;
    return getRandomMinutes(minMinutes, maxMinutes);
}

// Function to get a random time in milliseconds within the specified range
function getRandomMillisecondsFromMilliseconds(minMillis, maxMillis) {
    return Math.random() * (maxMillis - minMillis) + minMillis;
}
// Function to get a random time in milliseconds from seconds within the specified range
function getRandomMillisecondsFromSeconds(minSeconds, maxSeconds) {
    const minMillis = minSeconds * 1000;
    const maxMillis = maxSeconds * 1000;
    return getRandomMilliseconds(minMillis, maxMillis)*1;
}

// Function to get a random time in milliseconds within the specified range
function getRandomMilliseconds(minMillis, maxMillis) {
    return 1*Math.random() * (maxMillis - minMillis) + minMillis;
}

function getRandomSeconds(minSeconds, maxSeconds) {
    return 1*Math.random() * (maxSeconds - minSeconds) + minSeconds;
}





 // Manual BPM Counter Variables
let tapTimes = [];
const maxTapInterval = 3000; // Maximum time between taps

// Manual BPM Counter Event Listeners
document.getElementById("manual-bpm-button").addEventListener("click", handleManualBPM);
document.getElementById("manual-bpm-input").addEventListener("input", handleInput);
document.getElementById("clear-taps-button").addEventListener("click", clearTaps);

// // Function to handle manual BPM counter
// function handleManualBPM() {
//     const currentTime = new Date().getTime();
//     tapTimes.push(currentTime);

//     // Remove taps that are older than the maximum interval
//     tapTimes = tapTimes.filter((tapTime) => currentTime - tapTime < maxTapInterval);

//     // Calculate BPM based on the time between taps
//     const bpm = calculateBPM(tapTimes);
    
//     // Update the BPM result in the HTML
//     document.getElementById("custom-bpm-input").value = `${bpm.toFixed(2)}`;
//         const customBPMInput = document.getElementById("custom-bpm-input");
//         const inputBPM = parseFloat(customBPMInput.value);

//         if (!isNaN(inputBPM) && inputBPM > 0) {
//             // Set the custom BPM and flag
//             customBPM = inputBPM;
//             isCustomBPM = true;
//             customTrackURL = "";
//             document.getElementById("toggle-container").style.display = "none";
//           if (tapTimes.length === 1 || tapTimes.length === 2) {
//             updateBPMOverlay();
//         }
//         }
// }

// Function to handle input changes (simulating taps)
function handleInput() {
    // Simulate a tap when the input field changes
    handleManualBPM();
  document.getElementById("manual-bpm-input").value='';
}

// // Function to calculate BPM based on tap times
// function calculateBPM(tapTimes) {
//     if (tapTimes.length < 2) {
//         return 0; // Not enough taps to calculate BPM
//     }

//     const averageInterval = tapTimes.reduce((sum, tapTime, index, array) => {
//         if (index !== 0) {
//             sum += tapTime - array[index - 1];
//         }
//         return sum;
//     }, 0) / (tapTimes.length - 1);

//     const bpm = 60000 / averageInterval;
//     return bpm;
// }




  
// // Function to clear tap times
// function clearTaps() {
//     tapTimes = [];
//     // Clear the BPM result in the HTML
//     document.getElementById("custom-bpm-input").value = "";
//     console.log("Tap data cleared");
// }



  let lastSmoothedBPM;

// // Manual BPM Counter Event Listeners
// document.getElementById("manual-bpm-button").addEventListener("click", handleManualBPM);
// document.getElementById("manual-bpm-input").addEventListener("input", handleInput);
// document.getElementById("clear-taps-button").addEventListener("click", clearTaps);

// Function to handle manual BPM counter
function handleManualBPM() {
    const currentTime = new Date().getTime();
    tapTimes.push(currentTime);

    // Remove taps that are older than the maximum interval
    tapTimes = tapTimes.filter((tapTime) => currentTime - tapTime < maxTapInterval);

    // Calculate raw BPM based on the time between taps with averaging every five taps
    const rawBPM = calculateBPM(tapTimes);

    // Calculate smoothed BPM based on the raw BPM
    const smoothedBPM = calculateSmoothedBPM(rawBPM);

    // Update the BPM result in the HTML
    document.getElementById("custom-bpm-input").value = `${smoothedBPM.toFixed(2)}`;

    const customBPMInput = document.getElementById("custom-bpm-input");
    const inputBPM = parseFloat(customBPMInput.value);

    if (!isNaN(inputBPM) && inputBPM > 0) {
        // Set the custom BPM and flag
        customBPM = inputBPM;
        isCustomBPM = true;
        customTrackURL = "";
        document.getElementById("toggle-container").style.display = "none";
        if (tapTimes.length === 1 || tapTimes.length === 2) {
            updateBPMOverlay();
        }
    }
}

// Function to calculate smoothed BPM based on the raw BPM
function calculateSmoothedBPM(rawBPM) {
    if (lastSmoothedBPM === undefined) {
        return rawBPM;
    }

    // Use a smoothing factor to dampen sudden changes in BPM
    const smoothingFactor = 0.1; // Adjust as needed
    const smoothedBPM = rawBPM * (1 - smoothingFactor) + lastSmoothedBPM * smoothingFactor;

    lastSmoothedBPM = smoothedBPM;

    return smoothedBPM;
}

// Function to clear tap times
function clearTaps() {
    tapTimes = [];
    lastSmoothedBPM = undefined;

    // Clear the BPM result in the HTML
    document.getElementById("custom-bpm-input").value = "";
    console.log("Tap data cleared");
}

// Function to calculate BPM based on tap times
function calculateBPM(tapTimes) {
    const numTaps = tapTimes.length;

    if (numTaps < 2) {
        return 0; // Not enough taps to calculate BPM
    }

    // Calculate the average interval between taps
    const averageInterval = tapTimes.reduce((sum, tapTime, index, array) => {
        if (index !== 0) {
            sum += tapTime - array[index - 1];
        }
        return sum;
    }, 0) / (numTaps - 1);

    // Initialize an array to store averages of every five taps
    const intervalAverages = [];

    if (numTaps < 5) {
        // If there are fewer than five taps, calculate the average for all taps
        return 60000 / averageInterval;
    }

    // Calculate the average of every five taps
    for (let i = 0; i < numTaps - 4; i++) {
        const fiveTapInterval = (tapTimes[i + 4] - tapTimes[i]) / 4;
        intervalAverages.push(fiveTapInterval);
    }

    // Include the remaining taps in the calculation
    const remainingTaps = numTaps % 5;
    if (remainingTaps > 0) {
        const remainingAverage = (tapTimes[numTaps - 1] - tapTimes[numTaps - remainingTaps - 1]) / remainingTaps;
        intervalAverages.push(remainingAverage);
    }

    // Calculate the final BPM based on the average of every five taps
    const finalBPM = 60000 / (intervalAverages.reduce((sum, interval) => sum + interval, 0) / intervalAverages.length);

    return finalBPM;
}





  


function log(message) {
    console.log(message);
}

function log(variable, message) {
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    console.log(`${variable}: ${formattedMessage}`);
}

function log(...args) {
  console.log(args.map(arg => {
    if (typeof arg === 'string') {
      return `"${arg}"`;
    } else {
      return arg;
    }
  }).join(': '));
}
  
  // Function to trigger the logout
              function logout() {
                deleteCookie('access_token');
                accessToken = getCookie('access_token');
                fetch('/logout', {
                  method: 'GET',
                })
                  .then((response) => {
                    if (response.status === 200) {
                      console.log('Logout successful');
                      isTokenExpired = true;
                      handleTokenExpiration();
                      deleteCookie('access_token');
                      accessToken = '';
                      isTokenExpired = true;
                      alert(`Logout successful`)
                    } else {
                      console.error('Error logging out:', response.statusText);
                    }
                  })
                  .catch((error) => {
                    console.error('Error logging out:', error);
                  });
              }


  // Attach a click event listener to the logout button
  document.getElementById('logout-button').addEventListener('click', logout);
  
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

    let updOverlayTime;

    // Call the updateBPMOverlay function on an interval
    setDefaultColors();
    updateBPMOverlay();
    if (!isTokenExpired) {
        if (accessToken !== "" && accessToken) {
                updOverlayTime = setInterval(updateBPMOverlay, 7130); // 30,000 milliseconds = 30 seconds

    }
}
});

