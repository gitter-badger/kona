var path = require('path');
var util = require('util');
var support = require('../support');
var _ = support.Utilities;
var reflectAccessors = support.ReflectAccessors;
var delegates = require('delegates');
var AbstractController = require('./abstract');


var RequestController = AbstractController.extend({

  /**
   * @param {Context} ctx Koa.Context instance from the request
   */
  constructor: function(ctx) {

    AbstractController.apply(this, arguments);

    this.ctx = ctx;

    reflectAccessors(this, this.app, 'log');

    _.merge(
      this.locals,
      this.params,
      this.router.match,
      this.request.body,
      this.request.query
    );

    reflectAccessors(this.locals, this.ctx, ['session', 'cookies', 'params']);

  }

});

_.extend(RequestController.prototype,
  require('./responders'),
  require('./rendering')
);


// add default renderers which are all handled by koa and require
// no special operations before being served to koa
[
  'json',
  'stream',
  'buffer',
  'text',
  'html',
  'default'
].forEach(function(type) {

  RequestController.addRenderer(type, function* (data) {
    return yield data;
  });

});


// setup proxies on prototype to ctx object prop
delegates(RequestController.prototype, 'ctx')
  .method('accepts')
  .method('redirect')
  .method('throw')
  .access('app')
  .access('body')
  .access('session')
  .access('cookies')
  .getter('router')
  .getter('request')
  .getter('response')


module.exports = RequestController;