///<reference path="../../../lib/node-0.10.d.ts"/>
///<reference path="promises.ts"/>
var https = require("https");
var promises_1 = require('./promises');
exports.defer = promises_1.P.defer;
exports.when = promises_1.P.when;
var terminal;
(function (terminal) {
    var TerminalAPI = (function () {
        function TerminalAPI(config, sshKey) {
            this._config = config;
            this._sshKey = sshKey;
        }
        TerminalAPI.prototype.createTerminalWithOpenPorts = function (ports) {
            var _this = this;
            var d = exports.defer();
            var openPortOptions = {
                query: 'edit_terminal_access',
                requireAuthentication: true,
                data: {
                    'container_key': '',
                    'is_public_list': ports,
                    'access_rules': ["IDE::mserranom@gmail.com", "*::mserranom@gmail.com"]
                }
            };
            this.createTerminal().then(function (info) {
                console.log('opening terminal ports: ' + ports);
                openPortOptions.data.container_key = info.container_key;
                _this.createTerminalRequest(openPortOptions)
                    .then(function (res) { return d.resolve(info); })
                    .fail(function (error) { return d.reject(error); });
            }).fail(function (error) { return d.reject(error); });
            return d.promise();
        };
        TerminalAPI.prototype.createTerminal = function () {
            var _this = this;
            console.info('creating new agent');
            var d = exports.defer();
            var options = {
                query: 'start_snapshot',
                requireAuthentication: true,
                data: {
                    'snapshot_id': this._config.buildAgentId,
                    'publicKey': this._sshKey,
                    'keep_ram': true,
                    'temporary': true
                }
            };
            var pollAttempts = TerminalAPI.CREATE_TERMINAL_TIMEOUT / TerminalAPI.POLL_INTERVAL_MS;
            var currentAttempt = 0;
            var pollRequest = function (requestId) {
                var requestOptions = {
                    query: 'request_progress',
                    requireAuthentication: false,
                    data: { 'request_id': requestId }
                };
                _this.createTerminalRequest(requestOptions)
                    .fail(function (err) { return d.reject(err); })
                    .then(function (requestStatus) {
                    if (requestStatus.status == 'success') {
                        console.log('new terminal request succeeded');
                        d.resolve(requestStatus.result);
                    }
                    else {
                        console.log('new terminal request status: ' + requestStatus.status);
                        currentAttempt++;
                        if (currentAttempt > pollAttempts) {
                            var errorMessage = "new terminal request timeout";
                            console.error(errorMessage);
                            d.reject({ message: errorMessage });
                        }
                        else {
                            setTimeout(function () { return pollRequest(requestId); }, TerminalAPI.POLL_INTERVAL_MS);
                        }
                    }
                });
            };
            this.createTerminalRequest(options)
                .fail(function (err) { return d.reject(err); })
                .then(function (result) { return pollRequest(result['request_id']); });
            return d.promise();
        };
        TerminalAPI.prototype.closeTerminal = function (agent) {
            var options = {
                query: 'delete_terminal',
                requireAuthentication: true,
                data: {
                    'container_key': agent.container_key,
                }
            };
            this.createTerminalRequest(options).fail(function (error) { return console.error(error); });
        };
        TerminalAPI.prototype.createTerminalRequest = function (options) {
            var _this = this;
            var d = exports.defer();
            var headers = {
                'Content-Type': 'application/json'
            };
            if (options.requireAuthentication) {
                headers['user-token'] = this._config.userToken;
                headers['access-token'] = this._config.accessToken;
            }
            var reqOptions = {
                host: 'www.terminal.com',
                path: '/api/v0.2/' + options.query,
                method: 'POST',
                headers: headers
            };
            console.info('creating terminal.com request: ' + JSON.stringify(options.query));
            var request = https.request(reqOptions, function (response) { return _this.processResponse(response, d); });
            request.on('error', function (e) {
                var errorMessage = 'error creating terminal.com "' + options.query + '" request: ' + e;
                console.error(errorMessage);
                d.reject({ message: errorMessage });
            });
            if (options.data) {
                request.write(JSON.stringify(options.data));
            }
            console.info('request data: ' + JSON.stringify(options.data));
            request.end();
            return d.promise();
        };
        TerminalAPI.prototype.processResponse = function (response, d) {
            response.setEncoding('utf-8');
            var responseString = '';
            response.on('data', function (data) {
                responseString += data;
            });
            response.on('end', function () {
                console.info('terminal.com response received: ' + JSON.stringify(responseString));
                var responseObject;
                try {
                    responseObject = JSON.parse(responseString);
                }
                catch (error) {
                    var errorMessage = 'terminal.com reponse parser error: ' + error;
                    d.reject({ message: errorMessage });
                    return;
                }
                if (responseObject.error) {
                    var errorMessage = 'terminal.com request error: ' + responseObject.error;
                    console.error(errorMessage);
                    d.reject({ message: errorMessage });
                }
                else {
                    d.resolve(responseObject);
                }
            });
        };
        TerminalAPI.POLL_INTERVAL_MS = 2000;
        TerminalAPI.CREATE_TERMINAL_TIMEOUT = 60000;
        return TerminalAPI;
    })();
    terminal.TerminalAPI = TerminalAPI;
})(terminal = exports.terminal || (exports.terminal = {}));
