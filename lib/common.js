var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "load": function () {
    var context = config.interface.context;
    var url = app.interface.path + '?' + context;
    /*  */
    app.interface.id = '';
    app.button.set.popup(context === "popup" ? url : '');
    /*  */
    app.contextmenu.create({
      "id": "tab", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in tab",  
      "checked": context === "tab"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "win", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in win",  
      "checked": context === "win"
    }, app.error);
  },
  "action": {
    "storage": function (changes, namespace) {
      /*  */
    },
    "contextmenu": function (e) {
      app.interface.close(config.interface.context);
      config.interface.context = e.menuItemId;
      /*  */
      var context = config.interface.context;
      var url = app.interface.path + '?' + context;
      app.button.set.popup(context === "popup" ? url : '');
    },
    "button": function () {
      var context = config.interface.context;
      var url = app.interface.path + '?' + context;
      /*  */
      if (context === "popup") {
        app.button.set.popup(url);
      } else {
        if (app.interface.id) {
          if (context === "tab") {
            app.tab.get(app.interface.id, function (tab) {
              if (tab) {
                app.tab.update(app.interface.id, {"active": true});
              } else {
                app.tab.open(url, undefined, true, function (e) {
                  app.interface.id = e.id;
                });
              }
            });
          }
          /*  */
          if (context === "win") {
            app.window.get(app.interface.id, function (win) {
              if (win) {
                app.window.update(app.interface.id, {"focused": true});
              } else {
                app.interface.create(url, function (e) {
                  app.interface.id = e.id;
                });
              }
            });
          }
        } else {
          if (context === "tab") {
            app.tab.open(url, undefined, true, function (e) {
              app.interface.id = e.id;
            });
          }
          /*  */
          if (context === "win") {
            app.interface.create(url, function (e) {
              app.interface.id = e.id;
            });
          }
        }
      }
    }
  }
};

app.window.on.removed(function (e) {
  if (e === app.interface.id) {
    app.interface.id = '';
  }
});

app.tab.on.removed(function (e) {
  if (e === app.interface.id) {
    app.interface.id = '';
  }
});

app.on.storage(core.action.storage);
app.button.on.clicked(core.action.button);
app.contextmenu.on.clicked(core.action.contextmenu);

app.on.startup(core.start);
app.on.installed(core.install);