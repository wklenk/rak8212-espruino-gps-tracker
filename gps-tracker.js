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

var at;
var timeoutId;
var waypoints = [];

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
      console.log(rv);

      var parameters = rv.substr(10).split(',');
      var waypoint = {};

      waypoint.latitude = parseFloat(parameters[1]);
      waypoint.longitude = parseFloat(parameters[2]);
      waypoint.elevation = parseFloat(parameters[4]);

      var date = parameters[9];
      var time = parameters[0];

      waypoint.time = "20" + date.substr(4, 2) + "-" + date.substr(2, 2) + "-" + date.substr(0, 2)
        + "T" + time.substr(0, 2) + ":" + time.substr(2, 2) + ":" + time.substr(4, 2) + "Z";

      console.log(waypoint);
      waypoints.push(waypoint);

      timeoutId = setTimeout(getLocation, 10000);
    }, function onRejected(rv) {
      console.log('Error:', rv);
      timeoutId = setTimeout(getLocation, 10000);
    });

  return new Promise(function (resolve, reject) {
    resolve();
  });
}

console.log("Connecting BG96 module ...");
require("iTracker").setCellOn(true, function (usart) {
  console.log("BG96 module connected.");
  at = require("AT").connect(usart);
  // at.debug(true); // Show request and response messages of modem

  sendAtCommand('ATE0') // Turn echo off. Makes evaluation of modem responses easier.
    .then(function (rv) {
      return sendAtCommand('AT+GMR');
    })
    .then(function (rv) {
      console.log('BG96 version: ', rv);
      return sendAtCommand('AT+QGPS=1'); // Turn on GNSS
    })
    .then(function (rv) {
      console.log(rv);
      return sendAtCommand('AT+QGPSCFG="gnssconfig"'); // Get GNSS constellation
    })
    .then(function (rv) {
      console.log(rv);
      getLocation();
    });

  /*
  .then(function(rv) {
    return sendAtCommand('AT+QGPSEND'); // Turn off GNSS
  })
  .then(function(rv) {
    console.log(rv);
  });
  */
});

function onInit() {
  Bluetooth.setConsole(true); // Don't want to have console on "Serial1" that is used for modem.
}