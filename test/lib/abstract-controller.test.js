var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var Kona = require(path.join(__dirname.replace(/test\//, ''), 'kona'));
var AbstractController = require(__filename.replace(/test(\/|\.)?/g, ''));
var co = require('co');
var Writable = require('stream').Writable;

describe('controller/base', function() {
  var app;

  beforeEach(function() {
    app = new Kona();
  });

  describe('#set', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = getCtx(app),
      controller = new AbstractController(ctx);
    });

    describe('given a key-value pair', function() {

      it('sets the value at the key to ctx.locals', function() {

        var key = 'test',
            value = {one: 'two'};
        controller.set(key, value);

        expect(controller.locals).to.include.key(key);
        expect(controller.locals[key]).to.eql(value);
        expect(ctx.locals[key]).to.eql(value);

      });

      it('sets an object map of key values paris to ctx.locals', function() {

        var object = {
          one: 'two',
          three: 'four'
        };
        controller.set(object);

        expect(controller.locals).to.include.keys(Object.keys(object));
        Object.keys(object).forEach(function(key) {
          expect(ctx.locals[key]).to.eql(object[key]);
          expect(controller.locals[key]).to.eql(object[key]);
        });

      });

      it('assigns object key value pairs to locals without overwriting existing', function() {

        var object = {
          one: 'two',
          three: 'four'
        };
        controller.locals['existing'] = true;

        controller.set(object);
        expect(controller.locals.existing).to.be.true;
        expect(ctx.locals.existing).to.be.true;

        Object.keys(object).forEach(function(key) {
          expect(ctx.locals[key]).to.eql(object[key]);
          expect(controller.locals[key]).to.eql(object[key]);
        });

      });

    })

  });

  describe('#respondTo', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = {locals: {},
        request: {
          accepts: function() {}
        },
        router: {},
        throw: function() {}
      };
      controller = new AbstractController(ctx);
    });

    describe('when no type: *responder object is given', function() {

      it("throws a 500", function() {

        var spy = sinon.spy(controller, 'throw'),
            gen;
        gen = controller.respondTo();
        gen.next();
        expect(spy).to.be.calledWith(500);
      });

    });

    describe('when router provides explicit format', function() {

      it("uses that format (trump)", function() {

        var spy = sinon.spy(controller, 'throw'),
            acceptSpy = sinon.spy(controller.request, 'accepts'),
            htmlSpy = sinon.spy(),
            router = {match: {format: 'xml'}},
            formatStub,
            gen;

        controller.ctx.router = router;

        co(function* () {
          yield controller.respondTo({
            html: function* () {htmlSpy();}
          });
        });

        expect(acceptSpy).to.not.have.been.called;
        expect(spy).to.be.calledWith(406);
      });

    });

    describe('when no type: *responder matches the accept type', function() {

      it("throws a 406", function() {

        var spy = sinon.spy(controller, 'throw'),
            acceptStub = sinon.stub(controller.request, 'accepts').returns(false),
            htmlSpy = sinon.spy(),
            jsonSpy = sinon.spy(),
            gen;

        gen = controller.respondTo({
          html: function*() {
            htmlSpy();
          },
          json: function*() {
            jsonSpy();
          }
        });
        gen.next();
        expect(spy).to.be.calledWith(406);
        expect(htmlSpy).to.not.have.been.called;
        expect(jsonSpy).to.not.have.been.called;
      });

    });

    describe('when a type: *resopnder matches the accept type', function() {

      it('calls that responder', function() {

        var throwSpy = sinon.spy(controller, 'throw'),
            acceptStub = sinon.stub(controller.request, 'accepts').returns('json'),
            htmlSpy = sinon.spy(),
            jsonSpy = sinon.spy(),
            gen;

        gen = controller.respondTo({
          json: jsonSpy,
          html: htmlSpy
        });
        gen.next();

        expect(htmlSpy).to.not.have.been.called;
        expect(jsonSpy).to.have.been.called;
        expect(throwSpy).to.not.have.been.called;

      });

    });

  });

  describe('#respondsTo', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = getCtx(),
      controller = new AbstractController(ctx);
    });

    it('adds the respond content-type to an private array', function() {

      controller.respondsTo('json');

      expect(controller._respondsTo).to.eql(['json']);

      controller.respondsTo('html');

      expect(controller._respondsTo).to.eql(['json', 'html']);

    });

  });

  describe('#respondsTo', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = getCtx(app);
      controller = new AbstractController(ctx, kona);
    });

    xit('stores the render call arguments for the responder', function() {

      var renderText = {text: 'hello world'},
          gen;

      controller.render(renderText, null);

      expect(controller._render).to.eql([renderText, null]);

    });

    xit('throws a 500 if called more than once', function() {

      var spy = sinon.spy(controller, 'throw');

      controller.render({text: 'tick'});

      controller.render({text: 'boom'});

      controller.render({json: {id: 1}});

      expect(spy).to.have.callCount(2);

    });

  });

  describe('#{before|after}Filter', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = getCtx(app),
      controller = new AbstractController(ctx);
    });

    it('registers {before|after}Filter functions', function() {

      controller.beforeFilter('one');
      expect(controller._beforeFilters.length).to.eq(1);
      expect(controller._beforeFilters[0]).to.eq('one');
      controller.beforeFilter('two', 'three');
      expect(controller._beforeFilters.length).to.eq(3);
      expect(controller._beforeFilters).to.eql(['one', 'two', 'three']);

    });

  });

  describe('#call{Before|After}Filters', function() {

    var controller, ctx;

    beforeEach(function() {
      ctx = getCtx(),
      controller = new (AbstractController.extend({
        before: function*() {},
        after: function*() {}
      }))(ctx);
    });

    it('calls all before filters', function() {

      var spy = sinon.spy(Object.getPrototypeOf(controller), 'before');
      controller.beforeFilter('before');
      var gen = controller.callBeforeFilters();
      gen.next();
      expect(spy).to.be.calledOnce;

    });

    it('calls all after filters', function() {

      var spy = sinon.spy(Object.getPrototypeOf(controller), 'after');
      controller.afterFilter('after');
      var gen = controller.callAfterFilters();
      gen.next();
      expect(spy).to.be.calledOnce;
    });


    it('does nothing when there are no filters', function() {

      var gen, result;
      expect(controller._beforeFilters).to.be.empty;
      expect(controller._afterFilters).to.be.empty;
      gen = controller.callAfterFilters();
      result = gen.next();
      expect(result.value).to.be.undefined;
      gen = controller.callBeforeFilters();
      result = gen.next();
      expect(result.value).to.be.undefined;

    });

  });

  describe('::addRenderer', function() {
    it('explodes when type is not given and render is not a function', function() {

      expect(function() {
        AbstractController.addRenderer(function() {});
      }).to.throw(Error);

      expect(function() {
        AbstractController.addRenderer('josn', function() {});
      }).to.throw(Error);

      expect(function() {
        AbstractController.addRenderer('josn', function*() {});
      }).to.not.throw(Error);

    });
  });

  describe('::getRenderer', function() {
    it('returns the renderer by type', function() {
      var renderer = function*() {
        return yield '|_|_|1|_|3|_|_|1|_|';
      };
      AbstractController.addRenderer('xlsx', renderer);

      expect(AbstractController.getRenderer('xlsx')).to.eq(renderer);
    });
  });

  describe('renderers', function() {

    var map = {
      html: '<html>',
      json: {one: 'two'},
      stream: new Writable(),
      buffer: new Buffer('hello'),
      text: 'one two three'
    };

    Object.keys(map).forEach(function(type) {
      describe(type, function() {
        it('returns their input when handled by koa', function() {
          var renderer = AbstractController.getRenderer(type),
              data = map[type];

          co.wrap(renderer)(data).then(function(returned) {
            expect(returned).to.eq(data);
          });
        })
      });
    });
  });

  describe('#respondWith', function() {

    it('delegates to respondTo to determine the render func', function(done) {

      var error,
          ctx = getCtx(app),
          ctrl = new AbstractController(ctx),
          spy = sinon.spy(Object.getPrototypeOf(ctrl), 'respondTo');
          acceptSpy = sinon.stub(ctrl.request, 'accepts').returns();

      ctrl.request.accepts = acceptSpy;

      ctrl.respondsTo('html', 'json');

      co.wrap(ctrl.respondWith).call(ctrl, {some: 'object'})
        .then(function() {
          expect(spy).to.have.been.called;
          done();
        })
        .catch(function(err) {
          error = err;
          done(err);
        });

    })

  });

});

function getCtx(app) {
  return {
    app: app,
    request: {
      accepts: function() {}
    },
    router: {},
    throw: function() {}
  };
}