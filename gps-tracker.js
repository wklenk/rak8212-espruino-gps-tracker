/*
 * gps-tracker - Example how to use GPS functionality of RAK81212 module.
 *
 * Copyright (C) 2018 Wolfgang Klenk <wolfgang.klenk@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var ledBlinkingInterval = -1;
var ledBlinkState;

var at;
var timeoutId;
var track = {};
var stopTracking = false;

track.logIndex = 0;
track.latitude = new Float32Array(1000);
track.longitude = new Float32Array(1000);
track.elevation = new Float32Array(1000);
track.time = [];

// Format the track to plain-text file (suitable for input in GPS Visualizer)
function formatTrackToPlainText() {
  stopTracking = true;
  clearTimeout(timeoutId);

  console.log('trackpoint,time,latitude,longitude,alt');
  var i;
  for (i = 0; i < track.logIndex; i++) {
    console.log(i + 1, ',', track.time[i], ',', track.latitude[i], ',', track.longitude[i], ',', track.elevation[i]);
  }
}

// Returns a promise for a given AT command that is sent to the BG96 module
function sendAtCommand(command, timeoutMs) {

  return new Promise(function (resolve, reject) {
    var answer = "";
    at.cmd(command + "\r\n", timeoutMs || 1E3, function processResponse(response) {
      if (undefined === response || "ERROR" === response || response.startsWith("+CME ERROR")) {
        reject(command + ": " + response ? response : "TIMEOUT");
      } else if ("OK" === response || "SEND OK" === response) {
        resolve(answer);
      } else {
        return answer += (answer ? "\n" : "") + response, processResponse;
      }
    });
  });
}

function getLocation() {
  sendAtCommand('AT+QGPSLOC=2') // Obtain positioning information.
    .then(function onFulfilled(rv) {
      if (ledBlinkingInterval >= 0) {
        clearInterval(ledBlinkingInterval);
        ledBlinkingInterval = -1;
      }

      // console.log(rv);

      var parameters = rv.substr(10).split(',');

      track.latitude[track.logIndex] = parseFloat(parameters[1]);
      track.longitude[track.logIndex] = parseFloat(parameters[2]);
      track.elevation[track.logIndex] = parseFloat(parameters[4]);

      var time = parameters[0];
      track.time[track.logIndex] = time.substr(0, 2) + ":" + time.substr(2, 2) + ":" + time.substr(4, 2);

      track.logIndex++;
      track.logIndex = track.logIndex % track.latitude.length;

      if (!stopTracking) {
        timeoutId = setTimeout(getLocation, 10000);
      }
    }, function onRejected(rv) {
      // console.log('Error:', rv);

      if (ledBlinkingInterval < 0) {
        ledBlinkingInterval = setInterval("digitalWrite(LED1,ledBlinkState = !ledBlinkState);", 500);
      }

      if (!stopTracking) {
        timeoutId = setTimeout(getLocation, 10000);
      }
    });

  return new Promise(function (resolve, reject) {
    resolve();
  });
}

// Main function. Start to read GPS positions and store to internal data structure.
function startTracking() {
  // console.log("Connecting BG96 module ...");
  require("iTracker").setCellOn(true, function (usart) {
    // console.log("BG96 module connected.");
    at = require("AT").connect(usart);
    // at.debug(true); // Show request and response messages of modem

    sendAtCommand('ATE0') // Turn echo off. Makes evaluation of modem responses easier.
      .then(function (rv) {
        return sendAtCommand('AT+GMR');
      })
      .then(function (rv) {
        // console.log('BG96 version: ', rv);
        return sendAtCommand('AT+QGPS=1'); // Turn on GNSS
      })
      .then(function (rv) {
        // console.log(rv);
        return sendAtCommand('AT+QGPSCFG="gnssconfig"'); // Get GNSS constellation
      })
      .then(function (rv) {
        // console.log(rv);
        getLocation();
      });

  });
}


function onInit() {
  Bluetooth.setConsole(true); // Don't want to have console on "Serial1" that is used for modem.
  startTracking();
}