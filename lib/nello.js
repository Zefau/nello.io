'use strict';

const _request = require('request-promise');
const _events = require('events').EventEmitter;
const _util = require('util');

const Location = require('./location');


/**
 * The constructor for a connection to a nello.
 *
 * @class Nello
 * @param {String}  		  token    		 Token for authentication
 * @returns {Nello}
 * @constructor
 */
var Nello = function Nello(token)
{
	if (!(this instanceof Nello))
		return new Nello(token);
	
	_events.call(this);
	this.token = token;
	
	if (!this.token)
		throw new Error('Please check the arguments!');
};

_util.inherits(Nello, _events);


/**
 * This function requests an action.
 *
 * @memberof Nello
 * @param {String|Array}	params			Parameters to attach to URL
 * @param {String}			[method=GET]	Method to use [GET, POST, PUT, DELETE]
 * @param {String}			[body={}]		Body data to send
 * @param {String}			[options={}]	Additional options to use
 * @returns {Promise<Object>}
 * @private
 */
Nello.prototype._req = function _req(params, method, body, options)
{
	params = (params ? ('/' + (typeof params === 'string' ? params : params.join('/'))) : '');
	return _request(Object.assign(options || {},
	{
		url: 'https://public-api.nello.io/v1/' + params + '/',
		method: method || 'GET',
		headers: {'Authorization': 'Bearer ' + this.token},
		body: body || {},
		json: true
	}));
};

/**
 * This function returnes a list of locations.
 *
 * @memberof Nello
 * @param void
 * @returns {Promise<LocationInfo[]>}
 */
Nello.prototype.getLocations = function getLocations()
{
	var self = this;
	return this
		._req('locations')
		.then(function(res)
		{
			if (res.result === undefined || res.result.success !== true || !Array.isArray(res.data))
				throw new Error('Did not receive a list of locations!');
			
			return res.data;
		})
		.map(function(location)
		{
			// enrich data
			location.address.streetName = location.address.street.trim();
			location.address.streetNumber = location.address.number;
			location.address.street = location.address.streetName + " " + location.address.streetNumber;
			location.address.fullAddress = location.address.streetName + " " + location.address.streetNumber + ", " + location.address.zip + " " + location.address.city;
			delete location.address.number;
			
			location.action = new Location(self, location.location_id);
			return location;
		});
};

/**
 * This function retrieves a single location.
 *
 * @memberof Nello
 * @param {String}			locationId		ID of the Nello location
 * @returns {Promise<LocationInfo>}
 */
Nello.prototype.getLocation = function getLocation(locationId)
{
	var self = this;
	return this.getLocations()
		.then(function(locations)
		{
			var found = null;
			locations.map(function(location)
			{
				if (location.location_id == locationId)
					found = location;
			});
			
			if (found === null)
				throw new Error('Did not find the requested Nello location!');
			else
				return found;
		});
};


module.exports = Nello;


/**
 * @typedef {Object}		LocationInfo
 * @property {String}		location_id				ID of the location
 * @property {Object}		address					Address data of the location
 * @property {String}		address.city			City
 * @property {Number}		address.zip				Zip code
 * @property {String}		address.state			State
 * @property {String}		address.country			Country
 * @property {String}		address.street			Street name and number
 * @property {String}		address.streetName		Name of the street
 * @property {Number}		address.streetNumber	Number of the street
 * @property {String}		address.fullAddress		Full address including street name, number, zip code and city
 * @property {Location}		action					Location instance
 */