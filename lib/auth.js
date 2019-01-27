'use strict';

const _request = require('request-promise');
const _qs = require('querystring');


/**
 * The constructor for the authentication to a nello.
 *
 * @class Auth
 * @param {String}  		  clientId			Client ID used for authentication
 * @param {String}  		  clientSecret		Client Secret used for authentication
 * @returns {Auth}
 * @constructor
 * @see https://nelloauth.docs.apiary.io/#reference/0/token/create-a-new-token-client-credentials
 */
var Auth = function Auth(clientId, clientSecret)
{
	if (!(this instanceof Auth))
		return new Auth(clientId, clientSecret);
	
	this.clientId = clientId;
	this.clientSecret = clientSecret;
	
	if (!this.clientId || !this.clientSecret)
		throw new Error('No Client ID / Client Secret provided!');
};

/**
 * This function retrieves a new token.
 *
 * @memberof Auth
 * @param void
 * @returns {Promise<Object>}
 */
Auth.prototype.retrieveToken = function retrieveToken()
{
	return _request(
	{
		url: 'https://auth.nello.io/oauth/token/',
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: _qs.stringify({'grant_type': 'client_credentials', 'client_id': this.clientId, 'client_secret': this.clientSecret})
	});
}

module.exports = Auth;
