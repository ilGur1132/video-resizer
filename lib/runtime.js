app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};

if (!navigator.webdriver) {
  app.on.uninstalled(app.homepage() + "?v=" + app.version() + "&type=uninstall");
  app.on.installed(function (e) {
    app.on.management(function (result) {
      if (result.installType === "normal") {
        app.tab.query.index(function (index) {
          let previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
          let doupdate = previous && parseInt((Date.now() - config.welcome.lastupdate) / (24 * 3600 * 1000)) > 45;
          if (e.reason === "install" || (e.reason === "update" && doupdate)) {
            let parameter = (e.previousVersion ? "&p=" + e.previousVersion : '') + "&type=" + e.reason;
            let url = app.homepage() + "?v=" + app.version() + parameter;
            app.tab.open(url, index, e.reason === "install");
            config.welcome.lastupdate = Date.now();
          }
        });
      }
    });
  });
}

app.on.connect(function (port) {
  if (port) {
    if (port.name) {
      if (port.name in app) {
        app[port.name].port = port;
      }
      /*  */
      if (port.sender) {
        if (port.sender.tab) {
          app.interface.port = port;
          /*  */
          if (port.name === "tab") {
            app.interface.id = port.sender.tab.id;
          }
          /*  */
          if (port.name === "win") {
            if (port.sender.tab.windowId) {
              app.interface.id = port.sender.tab.windowId;
            }
          }
        }
      }
    }
    /*  */
    port.onDisconnect.addListener(function (e) {
      app.storage.load(function () {
        if (e) {
          if (e.name) {
            if (e.name in app) {
              app[e.name].port = null;
            }
            /*  */
            if (e.sender) {
              if (e.sender.tab) {
                app.interface.port = null;
                /*  */
                if (e.name === "tab") {
                  app.interface.id = '';
                }
                /*  */
                if (e.name === "win") {
                  if (e.sender.tab.windowId) {
                    if (e.sender.tab.windowId === app.interface.id) {
                      app.interface.id = '';
                    }
                  }
                }
              }
            }
          }
        }
      });
    });
  }
});
