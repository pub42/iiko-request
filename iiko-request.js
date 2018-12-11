/*

name: iiko-card5
documentation: https://docs.google.com/document/d/1kuhs94UV_0oUkI2CI3uOsNo_dydmh9Q0MFoDWmhzwxc/edit#
author: pub42 (xziy, ...)

(c) 2018
v 0.2
*/
var https = require('https'); // iiko biz support only SSL requests


var config, access_token;
exports.init = function (_config) {
  config = _config;
};
///////////////////////////////////////////////////////////////////////////////////

exports.call = function (method, params, modifier, data) {
  return new Promise(function (resolve, reject) {
    switch (method.type) {

      case 'GET':
        get(fetchGETurl(method, params, modifier)).then(
          result => {
            resolve(result);
          },
          error => {
            reject(error);
          });
        break;

      case 'POST':
        post(fetchGETurl(method, params, modifier), data).then(
          result => {
            resolve(result);
          },
          error => {
            reject(error);
          });
        break;

      default:
        reject('Method is not defined');
        break
    }
  });
};


function fetchGETurl(method, data, modifier) {
  let url = method.path;
  if (modifier)
    url = modifier(url);
  url += '?';

  for (var param in method.params) {
    if (!data.hasOwnProperty(param)) {
      console.error("iiko-request: The expected " + param + " property is not found");
    }
    url = url + param + '=' + data[param] + '&'
  }
  return url
}

function get(url) {
  return new Promise(function (resolve, reject) {
    checkToken().then(function (token) {
      let path = url + '&access_token=' + token;
      // console.log(path);
      https.get({
        hostname: config.host,
        port: config.port,
        path: path,
        agent: false // create a new agent just for this one request
      }, (res) => {
        let rawData = '';
        res.on('data', (data) => {
          rawData += data;
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(rawData);
            resolve(data);
          } catch (e) {
            console.log(rawData);
            console.log(e.message);
            reject(e);
          }
        });
      }).on('error', err => {
        reject(err);
      });
    }, reason => reject(reason));
  });
}

function post(url, data) {
  return new Promise(function (resolve, reject) {
    checkToken().then(function (token) {
      let path = url + '&access_token=' + token;
      // console.log(path);
      let req = https.request({
        hostname: config.host,
        port: config.port,
        path: path,
        agent: false,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }, (res) => {
        res.setEncoding('utf8');

        let rawData = '';
        res.on('data', (data) => {
          rawData += data;
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(rawData);
            resolve(data);
          } catch (e) {
            console.log(rawData);
            console.log(e.message);
            reject(e);
          }
        });
      }).on('error', err => {
        reject(err);
      });
      req.write(JSON.stringify(data));
      req.end();
    }, reason => reject(reason));
  });
}

///////////////////////////////////////////////////////////////////////////////////

function getToken() {
  // Получение токена
  //console.log(" IN __getToken");
  return new Promise(function (resolve, reject) {
    let path = '/api/0/auth/access_token?user_id=' + config.login + '&user_secret=' + config.password;
    https.get({
      hostname: config.host,
      port: config.port,
      path: path,
      agent: false // create a new agent just for this one request
    }, (res) => {
      res.on('data', (token) => {
        try {
          access_token = JSON.parse(token);
          if (/[A-Za-z1-9_]*/.test(access_token))
            resolve(access_token);
          else {
            getToken().then(value => {
              resolve(value);
            }).catch(e => {
              reject(e);
            });
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', err => {
      reject(err);
    });
  });
  //console.log(" OUT __getToken");
}

///////////////////////////////////////////////////////////////////////////////////
function checkToken() {
  // Проверяет токен, если токен нерабочий то получет токен
  //console.log("IN __checkToken");
  return new Promise(function (resolve, reject) {
    let path = '/api/0/auth/echo?msg=true&access_token=' + access_token;
    //console.log(path);
    https.get({
      hostname: config.host,
      port: config.port,
      path: path,
      agent: false // create a new agent just for this one request
    }, (res) => {

      res.on('data', (response) => {
        if (response.toString() === '"Wrong access token"') {
          getToken().then(function (token) {
            resolve(token);
          }).catch(err => {
            reject(err);
          });
        } else if (response.toString() === '"true"') {
          resolve(access_token);
        } else {
          reject('response undefined ' + response);
        }
      });
    }).on('error', err => {
      reject(err);
    });
  })
  //console.log(" OUT  __checkToken");
}
