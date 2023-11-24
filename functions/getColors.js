
  exports.handler = async (event, context) => {
    const imageUrl = req.query.url; // Get the 'url' parameter from the query string

  // Fetch the image from the provided URL (you may need to adjust this based on your requirements)
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

try {
  // Define the number of quadrants (e.g., 4 for dividing into four parts)
  const numQuadrants = 4;

  // Get image dimensions
  const { width, height } = await getImageDimensions(imageBuffer);

  // Calculate the dimensions of each quadrant
  const quadrantWidth = Math.floor(width / numQuadrants);
  const quadrantHeight = Math.floor(height / numQuadrants);

  // Initialize an array to store the colors from all quadrants
  const allColors = [];
  const swatchedColors = [];
  
  // Process each quadrant separately
  for (let i = 0; i < numQuadrants; i++) {
    for (let j = 0; j < numQuadrants; j++) {
      // Calculate the coordinates of the current quadrant
      const x1 = i * quadrantWidth;
      const x2 = (i + 1) * quadrantWidth;
      const y1 = j * quadrantHeight;
      const y2 = (j + 1) * quadrantHeight;

      // Crop the image to the current quadrant
      const quadrantBuffer = await cropImage(imageBuffer, x1, y1, x2, y2);

      // Create a Vibrant object with the quadrant image
      const palette = await Vibrant.from(quadrantBuffer).getPalette();
      
      // Extract swatch colors from the quadrant palette
      const swatchColors = Object.values(palette).map(swatch => swatch? swatch.getHex() :null).filter(swatch => swatch !== null);
      // console.log(swatchColors);
      swatchedColors.push(...swatchColors);
      // console.log("Pushed to swatched colors:");
      // console.log(swatchColors);
      // console.log("Colors in swatched colors");
      // console.log(swatchedColors);

      // Filter and add the colors to the allColors array (adjust criteria as needed)
      const filteredColors = swatchColors.filter(color => {
        const [r, g, b] = hexToRgb(color);
        const saturation = calculateSaturation(r, g, b);
        const vibrancy = calculateVibrancy(r, g, b);
        const minSaturation = 0.5;
        const minVibrancy = 0.5;
        return saturation >= minSaturation && vibrancy >= minVibrancy;
      });

      allColors.push(...filteredColors);
    }
  }

  // Randomize the colors
  const randomizedColors = shuffleArray(allColors);

  // Remove similar colors (adjust tolerance as needed, smaller values are more strict)
  const filteredColors = removeSimilarColors(randomizedColors, 35);

  // Check if filteredColors has fewer than 2 colors
  if (filteredColors.length < 2) {
      // Create an array to store the 5 random colors
      const randomColors = [];
      const swatchColors = [...new Set(swatchedColors)];
      // Ensure that randomizedColors has at least 5 colors
      console.log("All unique colors before filtering:");
      console.log(swatchColors);
      if (swatchedColors.length >= 5) {
          // Generate 5 random indices to select colors from randomizedColors
          const randomIndices = [];
          while (randomIndices.length < 5) {
              const randomIndex = Math.floor(Math.random() * swatchColors.length);
              if (!randomIndices.includes(randomIndex)) {
                  randomIndices.push(randomIndex);
              }
          }
  
          // Retrieve the selected random colors and add them to randomColors
          randomIndices.forEach(index => {
              randomColors.push(swatchColors[index]);
          });
            
            // Check if filteredColors is not empty and add its contents to randomColors
            if (filteredColors.length > 0) {
                randomColors.push(...filteredColors);
            }
            // Respond with the selected colors as JSON
            res.json(randomColors);
      } else {
          // Handle the case where randomizedColors has fewer than 5 colors
          console.error("randomizedColors should have at least 5 colors.");
      }
  
      // Now, randomColors contains 5 random colors (if available)
      console.log(randomColors);
  } else{
    // Respond with the selected colors as JSON
    res.json(filteredColors);
  }

  
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Error extracting colors' });
}
  }
  