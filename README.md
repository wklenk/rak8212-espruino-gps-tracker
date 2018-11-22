# rak8212-espruino-gps-tracker
Example how to record track data using satellite navigation (GNSS).

GNSS = Global Navigation Satellite System

* Turns on the BG96 module on the RAK8212.
* Every 10 seconds questions the GNSS position and writes it to local storage.
* With clear line of sight, it might take up to 5 minutes to receive positions (cold start).
* The blue LED will blink while no position is available.
* The stored track data can be interactively exported by calling the JavaScript function
  `formatTrackToPlainText();`
* Data in this CSV format can be imported into the online visualization tool 
  GPS Visualizer (http://www.gpsvisualizer.com/)   

**NOTE:** This example will only work if you are connected to the RAK8212 via Bluetooth LE. 
  Serial connection via USB **does not work**. 

## Plaintext CVS Format
The JavaScript function `formatTrackToPlainText();` can be called interactively
to output the track data in plain text in CSV format. The tracking is stopped 
after this method is called. The data can be copied from the console and pasted
into a text editor of your choice.

    trackpoint,time,latitude,longitude,alt
    1,13:22:05,45.9874167,-76.8752333,79.8
    2,13:22:17,45.9860000,-76.8737833,111.4
    3,13:22:25,45.9850500,-76.8724833,107.9
    4,13:22:30,45.9844000,-76.8716333,120.0
    5,13:22:34,45.9839500,-76.8710000,117.5

## Possible Visualization
This shows an example visualization of a recorded track on a map
using GPS Visualizer.
  
  ![Picture 1](media/track_visualization_on_map.png "Visualization of track on map")
