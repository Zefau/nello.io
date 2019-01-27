'use strict';

const _request = require('request-promise');


/**
 * The constructor for Nello time windows.
 *
 * @class TimeWindow
 * @param {Nello}			connection		Nello instance
 * @param {String}			locationId		ID of the Nello location
 * @param {String}			twId			ID of the time window
 * @returns void
 * @constructor
 */
var TimeWindow = function TimeWindow(connection, locationId, twId)
{
	this.connection = connection;
	this.locationId = locationId;
	this.twId = twId;
};

/**
 * This function requests an action.
 *
 * @memberof TimeWindow
 * @param {String|Array}	params			Parameters to attach to URL
 * @param {String}			[method=GET]	Method to use [GET, POST, PUT, DELETE]
 * @param {String}			[body={}]		Body data to send
 * @param {String}			[options={}]	Additional options to use
 * @returns {Promise<Object>}
 * @private
 */
TimeWindow.prototype._req = function _req(params, method, body, options)
{
	params = 'locations/' + this.locationId + '/tw/' + this.twId + (params ? ('/' + (typeof params === 'string' ? params : params.join('/'))) : '');
	return _request(Object.assign(options || {},
	{
		url: 'https://public-api.nello.io/v1/' + params + '/',
		method: method || 'GET',
		headers: {'Authorization': 'Bearer ' + this.connection.token},
		body: body || {},
		json: true
	}));
	
};

/**
 * This function removes a time window.
 *
 * @memberof TimeWindow
 * @param void
 * @returns {Promise<Boolean>}
 */
TimeWindow.prototype.remove = function remove()
{
	var self = this;
	return this
		._req('', 'DELETE')
		.then(function(res)
		{
			return !!res.result.success;
		});
};


module.exports = TimeWindow;