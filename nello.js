const _request = require('request');
const _fs = require('fs');
const _http = require('http');
const _https = require('https');
const _ical = require('ical.js');
const _uuidv4 = require('uuid/v4');

/**
 * Nello
 *
 * @description Javascript implementation of the nello.io API
 * @author Zefau <https://github.com/Zefau/>
 * @license MIT License
 * @version 0.4.5
 *
 */
class Nello
{
	/**
	* Ical Object.
	*
	* @typedef	ical
	* @type		{object}
	* @property	{string}		uid				UID of the event
	* @property	{string}		name			Name of the event
	* @property	{string}		summary			Summary of the event
	* @property	{object}		dtstamp			Stamp of the event with indizes year, month, day, hour, minute, second, isDate, timezone
	* @property	{object}		dtstart			Start of the event with indizes year, month, day, hour, minute, second, isDate, timezone
	* @property	{object}		dtend			End of the event with indizes year, month, day, hour, minute, second, isDate, timezone
	* @property	{object}		recurrence		Recurrence of event with indizes depending on specific recurrency freq, byday, bymonthday, bymonth, until
	*
	*/
	
	
	/**
	 * Constructor.
	 *
	 * @param	{object}		connection					Object containing connection settings
	 * @param	{string}		connection.clientId			Client ID
	 * @param	{string}		connection.clientSecret		Client Secret
	 * @param	{string}		connection.tokenType		Token Type
	 * @param	{string}		connection.tokenAccess		Token Access
	 * @param	{object}		connection.ssl				(optional) Object for SSL connection
	 * @param	{string}		connection.ssl.key			(optional) Private Key for SSL connection
	 * @param	{string}		connection.ssl.cert			(optional) Certificate for SSL connection
	 * @return	void
	 *
	 */
    constructor(connection)
	{
		// initialise variables
		this.clientId = connection.clientId;
		this.clientSecret = connection.clientSecret;
		this.token = {
			type: connection.tokenType,
			access: connection.tokenAccess,
		};
		
		// PLEASE NOTE: The nello API v1 does not seem to support SSL / HTTPS
		//
		this.isSecure = connection.ssl !== undefined && connection.ssl.key !== undefined && connection.ssl.cert !== undefined && connection.ssl.key !== '' && connection.ssl.cert !== '';
		this.ssl = !this.isSecure ? null : {key: connection.ssl.key, cert: connection.ssl.cert};
		
		this.server = null;
    }
	
	/**
	 * Converts an ical string to an object with all the data. See https://www.npmjs.com/package/jsical for more information.
	 *
	 * @see		{@link https://www.npmjs.com/package/jsical|jsical -Javascript parser for rfc5545-} for more information on the returned value
	 * @param	{string}		ical			Ical string to be converted
	 * @return	{ical}							Parsed ical as object (incl. _raw index for original string)		
	 *
	 */
	_getIcal(ical)
	{
		var data = {_raw: JSON.stringify(ical)};
		var vevent = new _ical.Component(_ical.parse(ical)).getFirstSubcomponent('vevent');
		['UID', 'SUMMARY', 'DTSTAMP', 'DTSTART', 'DTEND'].forEach(function(key)
		{
			data[key.toLowerCase()] = vevent.getFirstPropertyValue(key.toLowerCase()) || null;
		});
		
		data.rrule = new _ical.Recur(vevent.getFirstPropertyValue('rrule'));
		return data;
	}
	
	/**
	 * Handle HTTP / HTTPS response.
	 *
	 * @param	{object}		request
	 * @param	{object}		response
	 * @param	{function}		callback		(optional) Callback function to be invoked
	 * @return	void
	 *
	 */
	_handler(callback)
	{
		var data = null, body = [];
		return function(request, response)
		{
			request
				.on('error', (err) => {callback({result: false, error: err})})
				.on('data', (chunk) => {body.push(chunk)})
				.on('end', () =>
				{
					var result = null;
					try {
						body = JSON.parse(Buffer.concat(body).toString());
						body.data.timestamp = Math.round(Date.now()/1000);
						result = {result: true, body: body};
					}
					catch(err) {
						result = {result: false, error: err.message};
					}
					
					callback(result);
				});
		}
	}
	
	/**
	 * Converts an ical object to a string with the relevant data. See https://www.npmjs.com/package/jsical for more information.
	 *
	 * @see		{@link https://www.npmjs.com/package/jsical|jsical -Javascript parser for rfc5545-} for more information on the returned value
	 * @param	{ical}			ical			Ical object to be converted to string
	 * @return	{string}						Converted ical string
	 *
	 */
	_setIcal(data)
	{
		// to be implemented
		
		return '';
	}
	
	/**
	 * Sends a request to the nello API.
	 *
	 * @param	{string}		url				URL to be called
	 * @param	{string}		method			(optional) Method to be used (GET, POST, PUT or DELETE), default is GET
	 * @param	{object}		body			(optional) Body to be sent with the request, default is empty {}
	 * @param	{object}		callback		(optional)
	 * @param	{function}		callback.fct	(optional) Callback function to be invoked receiving -err, res, body- as param
	 * @param	{function}		callback.return	(optional) Callback function to be invoked only receiving -{result: true|false, error: {..}}- as param
	 * @return	{object}						this
	 *
	 */
	_req(url, method = "GET", callback = {}, body = {})
	{
		_request({
			uri: url,
			method: method,
			headers: {
				"Authorization": this.token.type + " " + this.token.access
			},
			body: body,
			json: true
		},
		callback.fct !== undefined ? callback.fct : function(err, res, body)
		{
			if (body !== undefined && body.result !== undefined && body.result.success === true)
				callback.return({result: true});
			
			else
				callback.return({result: false, error: err});
		});
		
		return this;
	}
	
	/**
	 * Opens door of a location.
	 *
	 * @param	{string}		locationId		ID of the location
	 * @param	{function}		callback		(optional) Callback function to be invoked
	 * @return	{object}						this
	 *
	 */
	openDoor(locationId, callback = function() {})
	{
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/open/", "PUT", {return: callback});
	}
	
	/**
	 * Gets all locations.
	 *
	 * @param	{function}		callback		Callback function to be invoked
	 * @return	{object}						this
	 *
	 */
	getLocations(callback)
	{
		return this._req("https://public-api.nello.io/v1/locations/", "GET", {fct: function(err, res, body)
			{
				if (body !== undefined && body.result !== undefined && body.result.success === true)
					callback({result: true, locations: body.data});
				
				else
					callback({result: false, error: err});
			}
		});
    }
	
	/**
	 * Gets all time windows.
	 *
	 * @param	{string}		locationId		ID of the location
	 * @param	{function}		callback		Callback function to be invoked
	 * @return	{object}						this
	 *
	 */
	getTimeWindows(locationId, callback)
	{
		var that = this;
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/tw/", "GET", {fct: function(err, res, body)
			{
				if (body !== undefined && body.result !== undefined && body.result.success === true)
				{
					// convert ical-string to full data object
					body.data.forEach(function(entry, i)
					{
						body.data[i].ical = that._getIcal(entry.ical);
					});
					
					callback({result: true, timeWindows: body.data});
				}
				
				else
					callback({result: false, error: err});
			}
		});
	}
	
	/**
	 * Creates a time window.
	 *
	 * @param	{string}		locationId			ID of the location
	 * @param	{object}		data				Data for the time window
	 * @param	{string}		data.name			Name of the time window
	 * @param	{string|object}	data.ical			Ical data of the time window
	 * @param	{function}		callback			(optional) Callback function to be invoked
	 * @return	{object}							this
	 *
	 */
	createTimeWindow(locationId, data, callback = function() {})
	{
		// convert ical to object
		if (data.ical !== 'string')
			data.ical = this._setIcal(Object.assign(data.ical, {name: data.name}));
		
		// roughly verify ical data
		else if (data.ical === 'string' && (data.ical.indexOf('BEGIN:VCALENDAR') === -1 || data.ical.indexOf('END:VCALENDAR') === -1 || data.ical.indexOf('BEGIN:VEVENT') === -1 || data.ical.indexOf('END:VEVENT') === -1))
			callback({result: false, error: 'Wrong ical data provided! Missing BEGIN:VCALENDAR, END:VCALENDAR, BEGIN:VEVENT or END:VEVENT.'});
		
		// request
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/tw/", "POST", {fct: function(err, res, body)
			{
				if (body !== undefined && body.result !== undefined && body.result.success === true)
					callback({result: true, timeWindow: data.body});
				
				else
					callback({result: false, error: err});
			}
		}, {'name': data.name, 'ical': data.ical});
	}
	
	/**
	 * Deletes a time window.
	 *
	 * @param	{string}		locationId		ID of the location
	 * @param	{string}		twId			ID of the time window
	 * @param	{function}		callback		(optional) Callback function to be invoked
	 * @return	{object}						this
	 *
	 */
	deleteTimeWindow(locationId, twId, callback = function() {})
	{
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/tw/" + twId + "/", "DELETE", {return: callback});
	}
	
	/**
	 * Unubscribe from events (delete a webhook)
	 *
	 * @param	{string}			locationId		ID of the location
	 * @param	{function}			callback		(optional) Callback function to be invoked
	 * @return	{object}							this
	 *
	 */
	unlisten(locationId, callback = function() {})
	{
		this.server = null;
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/webhook/", "DELETE", {return: callback});
	}
	
	/**
	 * Subscribe / listen to events (add a webhook)
	 *
	 * @param	{string}			locationId		ID of the location
	 * @param	{object|string}		uri				External URL including port (e.g. www.domain.com:port) of the webhook that the adapter is listening on
	 * @param	{string}			uri.url			External URL of the webhook that the adapter is listening on
	 * @param	{integer}			uri.port		External Port of the webhook that the adapter is listening on
	 * @param	{array}				actions			(optional) Actions to listen to (defaults to ['swipe', 'geo', 'tw', 'deny'])
	 * @param	{function}			callback		Callback function to be invoked
	 * @return	{object}							this
	 *
	 */
	listen(locationId, uri, callback, actions = ['swipe', 'geo', 'tw', 'deny'])
	{
		// convert uri to object
		if (typeof uri === 'string')
		{
			if (uri.indexOf(':') === -1)
				callback({result: false, error: 'Invalid url specified! Please specify port using ":", e.g. domain.com:PORT!'});
			
			else
				var u = {
					ssl: this.isSecure,
					url: (this.isSecure ? 'https://' : 'http://') + uri.substr(0, uri.indexOf(':')).replace(/http:\/\//gi, '').replace(/https:\/\//gi, ''),
					port: parseInt(uri.substr(uri.indexOf(':')+1))
				};
		}
		else
			var u = {
				ssl: this.isSecure,
				url: (this.isSecure ? 'https://' : 'http://') + uri.substr(0, uri.indexOf(':')).replace(/http:\/\//gi, '').replace(/https:\/\//gi, ''),
				port: parseInt(url.port)
			};
		
		// request
		u.uri = u.url + ':' + u.port;
		var that = this;
		return this._req("https://public-api.nello.io/v1/locations/" + locationId + "/webhook/", "PUT", {fct: function(err, res, body)
			{
				if (body !== undefined && body.result !== undefined && body.result.success === true)
				{
					if (that.isSecure === true)
						that.server = _https.createServer(
							{
								key: that.ssl.key.indexOf('.') === -1 ? that.ssl.key : _fs.readFileSync(that.ssl.key),
								//ca: that.ssl.ca.indexOf('.') === -1 ? that.ssl.ca : _fs.readFileSync(that.ssl.ca),
								cert: that.ssl.cert.indexOf('.') === -1 ? that.ssl.cert : _fs.readFileSync(that.ssl.cert)
							},
							that._handler(callback)
						).listen(u.port);
					
					else
						that.server = _http.createServer(that._handler(callback)).listen(u.port);
					
					callback({result: true, uri: u});
				}
				
				else
					callback({result: false, error: err});
			}
		}, {'url': u.uri, 'actions': actions});
	}
}

module.exports = Nello;
