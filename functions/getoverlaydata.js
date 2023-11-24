
  exports.handler = async (event, context) => {
    let newColors = colors.map(color => {
            let tc = tinycolor(color);
            let currentVibrance = tc.toHsv().v;

            console.log(`Original Color: ${color}`);
            console.log(`Current Vibrance: ${currentVibrance}`);

            // Adjust vibrance in the HSV color space
            if (vibranceChange !== 0) {
                let newVibrance = Math.max(0, Math.min(1, currentVibrance + vibranceChange / 100));
                tc = tinycolor({ h: tc.toHsv().h, s: tc.toHsv().s, v: newVibrance });
                console.log(`New Vibrance: ${newVibrance}`);
            }

            // Convert to HSL for saturation and brightness adjustments
            let currentHsl = tc.toHsl();

            // Adjust saturation in the HSL color space
            if (saturationChange !== 0) {
                let newSaturation = Math.max(0, Math.min(1, currentHsl.s + saturationChange / 100));
                currentHsl.s = newSaturation;
                console.log(`New Saturation: ${newSaturation}`);
            }

            // Adjust brightness in the HSL color space
            if (brightnessChange !== 0) {
                let newBrightness = Math.max(0, Math.min(1, currentHsl.l + brightnessChange / 100));
                currentHsl.l = newBrightness;
                console.log(`New Brightness: ${newBrightness}`);
            }

            // Convert back to HEX color space
            tc = tinycolor(currentHsl);
            console.log(`New Color (HEX): ${tc.toHexString()}\n`);

            return tc.toHexString();
        });

        res.json({ newColors, newVibrance: vibranceChange, newBrightness: brightnessChange });
  }
  