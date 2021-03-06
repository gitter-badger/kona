var join = require('path').join;

module.exports = function(app) {

  /**
   * the basic config object with getter / setter methods in favor of older
   * APIs, but uses native getters and setters
   */
  var config = Object.create({});

  /**
   * options passed to koa-session construction
   */
  Object.defineProperty(config, 'session', {
    writable: true,
    value: {}
  });

  /**
   * path containing all of the application's views
   */
  Object.defineProperty(config, 'views', {
    writable: true,
    value: app.root.join('app', 'views')
  });

  /**
   * view-file extension to use application-wide
   */
  Object.defineProperty(config, 'viewExt', {
    writable: true,
    value: 'html'
  });

  /**
   * map extensions to render engines
   */
  Object.defineProperty(config, 'viewMap', {
    writable: true,
    value: {
      html: 'swig'
    }
  });

  /**
   * only 'memory' option supported at the moment. change the
   * value of `store` property to falsy to disable the memory cache.
   */
  Object.defineProperty(config, 'cache', {
    writable: true,
    value: {
      store: 'memory'
    }
  });

  /**
   * the paths that will be eager-loaded when necessary or watched for changes
   * and reloaded on `require` in `development` environment
   *
   * @type {Array}
   */
  Object.defineProperty(config, 'autoloadPaths', {
    writable: true,
    value: [
      join('app', 'controllers')
      // app.root.join('app', 'models')
    ]
  });

  /**
   * where to server static files from
   * @type {Boolean}
   */
  Object.defineProperty(config, 'publicPath', {
    writable: true,
    value: app.root.join('public')
  });

  /**
   * asset paths
   * @type {Boolean}
   */
  Object.defineProperty(config, 'assetPaths', {
    writable: true,
    value: [app.root.join('app', 'assets')]
  });

  /**
   * the port the application will run on
   * is overrided by process.env.KONA_PORT
   */
  Object.defineProperty(config, 'port', {
    writable: true,
    value: 3333
  });

  return config;

};
