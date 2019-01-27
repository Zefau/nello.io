'use strict';

const _request = require('request-promise');
const _ical = require('ical.js');

const _fs = require('fs');
const _url = require('url-parse');
const _express = require('express');
const _https = require('https');
const _http = require('http');

const _events = require('events').EventEmitter;
const _util = require('util');

const TimeWindow = require('./timewindow');


/**
 * The constructor for Nello locations.
 *
 * @class Location
 * @param {Nello}			connection		Nello instance
 * @param {String}			locationId		ID of the Nello location
 * @returns void
 * @constructor
 */
var Location = function Location(Nello, locationId)
{
	_events.call(this);
	
	this.parent = Nello;
	this.locationId = locationId;
};

/**
 * This function requests an action.
 *
 * @memberof Location
 * @param {String|Array}	params			Parameters to attach to URL
 * @param {String}			[method=GET]	Method to use [GET, POST, PUT, DELETE]
 * @param {String}			[body={}]		Body data to send
 * @param {String}			[options={}]	Additional options to use
 * @returns {Promise<Object>}
 * @private
 */
Location.prototype._req = function _req(params, method, body, options)
{
	params = 'locations/' + this.locationId + '/' + (params ? ('/' + (typeof params === 'string' ? params : params.join('/'))) : '');
	return _request(Object.assign(options || {},
	{
		url: 'https://public-api.nello.io/v1/' + params + '/',
		method: method || 'GET',
		headers: {'Authorization': 'Bearer ' + this.parent.token},
		body: body || {},
		json: true
	}));
};

_util.inherits(Location, _events);


/**
 * This function opens the door.
 *
 * @memberof Location
 * @param void
 * @returns {Promise<Boolean>}
 */
Location.prototype.openDoor = function openDoor()
{
	var self = this;
	return this
		._req('open', 'PUT')
		.then(function(res)
		{
			return !!res.result.success;
		});
};

/**
 * This function retrieves all time windows.
 *
 * @memberof Location
 * @param void
 * @returns {Promise<TimeWindowInfo[]>}
 */
Location.prototype.getTimeWindows = function getTimeWindows()
{
	var self = this;
	return this
		._req('tw')
		.then(function(res)
		{
			if (res.result === undefined || res.result.success !== true || !Array.isArray(res.data))
				throw new Error('Did not receive any time windows!');
			
			return res.data;
		})
		.map(function(tw)
		{
			// enrich data
			var ical = {_raw: JSON.stringify(tw.ical)};
			var vevent = new _ical.Component(_ical.parse(tw.ical)).getFirstSubcomponent('vevent');
			['UID', 'SUMMARY', 'DTSTAMP', 'DTSTART', 'DTEND'].forEach(function(key)
			{
				ical[key.toLowerCase()] = vevent.getFirstPropertyValue(key.toLowerCase()) || null;
			});
			
			ical.rrule = new _ical.Recur(vevent.getFirstPropertyValue('rrule'));
			tw.ical = ical;
			
			tw.action = new TimeWindow(self.parent, self.locationId, tw.id);
			return tw;
		});
};

/**
 * This function retrieves a single time window.
 *
 * @memberof Location
 * @param {String}			twId			ID of the time window
 * @returns {Promise<TimeWindowInfo>}
 */
Location.prototype.getTimeWindow = function getTimeWindow(twId)
{
	var self = this;
	return this.getTimeWindows()
		.then(function(tws)
		{
			var found = null;
			tws.map(function(tw)
			{
				if (tw.id == twId)
					found = tw;
			});
			
			if (found === null)
				throw new Error('Did not find the requested Nello time window!');
			else
				return found;
		});
};

/**
 * This function adds a new time window.
 *
 * @memberof Location
 * @param {Object}			data			Data of the new time window
 * @param {String}			data.name		Name of the new time window
 * @param {String}			data.ical		ICal data of the new time window
 * @returns {Promise<Object>}
 */
Location.prototype.addTimeWindow = function addTimeWindow(data)
{
	var self = this;
	return this
		._req('tw', 'POST', data)
		.then(function(res)
		{
			if (res.result.success !== true)
				throw new Error(res.result.message);
			else
				return res.data;
		});
};

/**
 * This function removes a specfic time window.
 *
 * @memberof Location
 * @param {String}			twId			ID of the time window
 * @returns {Promise<Boolean>}
 */
Location.prototype.removeTimeWindow = function removeTimeWindow(twId)
{
	var self = this;
	return this.getTimeWindows()
		.then(function(tws)
		{
			var removed = false;
			tws.map(function(tw)
			{
				if (tw.id === twId)
					removed = tw.action.remove();
			});
			
			return removed;
		});
};

/**
 * This function removes all time windows.
 *
 * @memberof Location
 * @param void
 * @returns {Promise<Boolean>}
 */
Location.prototype.removeAllTimeWindows = function removeAllTimeWindows()
{
	var self = this;
	return this.getTimeWindows()
		.then(function(tws)
		{
			var removed = [];
			tws.map(function(tw)
			{
				removed.push(tw.action.remove());
			});
			
			return Promise.all(removed);
		});
};

/**
 * This function adds / attaches a webhook.
 *
 * @memberof Location
 * @param {String}			url													URL of the webhook
 * @param {Object}			[ssl]												SSL configuration data
 * @param {String}			ssl.key												SSL Private key (either string to file or key itself)
 * @param {String}			ssl.cert											SSL Certificate (either string to file or key itself)
 * @param {String}			ssl.ca												SSL Certificate authority (either string to file or key itself)
 * @param {Array}			[actions=['swipe', 'geo', 'tw', 'deny']]			Allowed nello actions to listen to
 * @param {Boolean}			[listen=false]										State whether listener shall be attached to webhook
 * @param {Array}			[methods=['GET', 'POST', 'PUT', 'DELETE']]			Allowed HTTP methods to the webhook
 * @returns {Promise<Object>}
 */
Location.prototype.addWebhook = function addWebhook(url, ssl, actions, listen, methods)
{
	var self = this;
	url = url.indexOf('http') === -1 ? ((ssl !== undefined && ssl !== false ? 'https://' : 'http://') + url) : url;
	
	return this
		._req('webhook', 'PUT', {'url': url, 'actions': actions || ['swipe', 'geo', 'tw', 'deny']})
		.then(function(res)
		{
			// attach listener
			if (listen === true)
				self.addListener(url, ssl, methods);
			
			return res.result.success === true ? url : false;
		});
};

/**
 * This function adds a listener on an URL respectively a webhook to receive events.
 *
 * @memberof Location
 * @param {String}			url													URL of the webhook
 * @param {Array}			[methods=['GET', 'POST', 'PUT', 'DELETE']]			Allowed HTTP methods to the webhook
 * @param {Object}			[ssl]												SSL configuration data
 * @param {String}			ssl.key												SSL Private key (either string to file or key itself)
 * @param {String}			ssl.cert											SSL Certificate (either string to file or key itself)
 * @param {String}			ssl.ca												SSL Certificate authority (either string to file or key itself)
 * @returns void
 */
Location.prototype.addListener = function addListener(url, methods, ssl)
{
	var self = this;
	url = url.indexOf('http') === -1 ? ((ssl !== undefined && ssl !== false ? 'https://' : 'http://') + url) : url;
	methods = methods === undefined ? ['GET', 'POST', 'PUT', 'DELETE'] : methods;
	
	// get port and path from URL
	var parsedUrl = _url(url, true);
	var port = parsedUrl.port || 80;
	var path = parsedUrl.pathname;
	
	// start server
	var server;
	var app = _express();
	app.use(_express.json());
	
	// validate SSL
	if (ssl !== undefined && (ssl.cert === undefined || ssl.key === undefined))
		throw new Error('Incomplete SSL configuration! Please provide a certificate and a private key.');
	
	// attach to https server
	else if (ssl !== undefined && ssl.cert !== undefined && ssl.key !== undefined)
		server = _https.createServer({
			key: ssl.key.indexOf('.') === -1 ? ssl.key : _fs.readFileSync(ssl.key),
			cert: ssl.cert.indexOf('.') === -1 ? ssl.cert : _fs.readFileSync(ssl.cert),
			ca: ssl.ca.indexOf('.') === -1 ? ssl.ca : _fs.readFileSync(ssl.ca),
			//rejectUnauthorized: false,
		}, app);
	
	// attach to http server
	else
		server = _http.createServer(app);
	
	// handle requests
	app.all(path, function(req, res)
	{
		if (methods.indexOf(req.method) === -1)
			res.sendStatus(403);
		
		var body = req.body;
		if (body)
		{
			self.emit('webhook', body);
			self.emit(body.action, body.data);
			self.parent.emit('webhook', body);
			self.parent.emit(body.action, body.data);
		}
	});
	
	// listen for events
	this.listener = server.listen(port);
};

/**
 * This function removes a webhook.
 *
 * @memberof Location
 * @param void
 * @returns {Promise<Boolean>}
 */
Location.prototype.removeWebhook = function removeWebhook()
{
	var self = this;
	return this
		._req('webhook', 'DELETE')
		.then(function(res)
		{
			if (self.listener)
				self.listener.close();
			
			return !!res.result.success;
		});
};


module.exports = Location;


/**
 * @typedef {Object}		TimeWindowInfo
 * @property {Number}		id						ID of the time window
 * @property {String}		name					Name of the time window
 * @property {String}		image					Path to image of the time window (not used by nello API)
 * @property {Boolean}		enabled					Indication whether time window is enabled
 * @property {Boolean}		state					State of the time window
 * @property {Object}		ical					Ical data of the time window
 * @property {TimeWindow}	action					TimeWindow instance
 */