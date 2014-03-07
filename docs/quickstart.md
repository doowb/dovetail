To install the module, run the following in the command line:

```bash
npm i dovetail --save
```

Use within your application with the following lines of JavaScript:

```js
var events = require('events');

// require the main Dovetail class
var Dovetail = require('dovetail');

// create an "application" to be pluggable
var MyApp = function (options) {
  // make it an EventEmitter
  events.EventEmitter.call(this);

  // create a new instance of Dovetail
  // passing in your application
  this.dovetail = new Dovetail(this);

  // automatically load plugins
  this.dovetail.resolve('/path/to/plugins/*.js');
};

require('util').inherits(MyApp, events.EventEmitter);
```

Nothing else is required, but the plugins won't run until you
trigger them

```js
MyApp.prototype.trigger = function (event, params, done) {
  this.dovetail.runEvent(event, params, done);
};
```

Now you can drop a javascript file into your plugins folder and it'll be registered:

```js
module.exports = function (app) {

  // create a plugin function that takes a params object and done callback function
  var plugin = function (params, done) {

    console.log('This is my custom plugin!');
    console.log('event', params.event);

    // add something to the params to be passed back to your app
    params.startTime = new Date();

    // let the app know that the plugin is finished
    done();
  };

  plugin.options = {

    // name your plugin
    name: 'my-custom-plugin',

    // describe your plugin
    description: 'This is an awesome plugin that runs before the application starts.',

    // list of events your plugin will listen for
    events: [ 'app:before:start' ]

  };

  // Return an object containing your plugin functions
  // These will get registered with the app
  var rtn = {};
  rtn[plugin.options.name] = plugin;
  return rtn;

};
```

Create a function for your app that will trigger some events:

```js
MyApp.prototype.start = function () {
  var self = this;

  // set up some paramets to keep track of state
  self.params = {};

  // trigger that the app will be starting
  self.trigger('app:before:start', self.params, function(err) {
    if (err) {
      throw new Error(err);
    }
    console.log('The app has started');

    // do some work


    // trigger that the app is going to end
    self.trigger('app:before:end', self.params, function (err) {
      if (err) {
        throw new Error(err);
      }
      console.log('The app has ended');
    });

  });
}
```