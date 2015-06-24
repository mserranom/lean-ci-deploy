///<reference path="model.ts"/>
///<reference path="builder.ts"/>
var api;
(function (api) {
    var LeanCIApi = (function () {
        function LeanCIApi(queue, builder) {
            this._queue = queue;
            this._builder = builder;
        }
        LeanCIApi.prototype.start = function (app) {
            var _this = this;
            app.post('/github/push', function (req, res) {
                console.log('received /github/push POST request');
                res.end();
                console.info(JSON.stringify(req.body)); // https://developer.github.com/v3/activity/events/types/#pushevent
                var repo = req.body.repository.full_name;
                _this._builder.queueBuild(repo);
            });
            app.post('/build/start', function (req, res) {
                console.log('received /build/start POST request');
                res.end();
                console.info(JSON.stringify(req.body));
                var repo = req.body.repo;
                console.log(repo);
                _this._builder.queueBuild(repo);
            });
            app.get('/build/queue', function (req, res) {
                console.log('received /build/queue GET request');
                var result = [];
                _this._queue.queue().forEach(function (project) { return result.push(project.toJSONObject()); });
                res.send(JSON.stringify(result));
            });
            app.post('/build/pingFinish', function (req, res) {
                var buildId = req.query.id;
                console.log('received /build/pingFinish GET request, build id=' + buildId);
                _this._builder.pingFinish(buildId, req.body);
            });
            app.get('/build/active', function (req, res) {
                console.log('received /build/active GET request');
                var result = [];
                _this._queue.activeBuilds().forEach(function (project) { return result.push(project.toJSONObject()); });
                res.send(JSON.stringify(result));
            });
            app.get('/build/finished', function (req, res) {
                console.log('received /build/active GET request');
                var result = [];
                _this._queue.finished().forEach(function (project) { return result.push(project.toJSONObject()); });
                res.send(JSON.stringify(result));
            });
        };
        return LeanCIApi;
    })();
    api.LeanCIApi = LeanCIApi;
})(api = exports.api || (exports.api = {}));
