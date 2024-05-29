var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "send": function (id, data) {
    if (id) {
      if (background.port) {
        if (background.port.name !== "webapp") {
          chrome.runtime.sendMessage({
            "method": id,
            "data": data,
            "path": "interface-to-background"
          }, function () {
            return chrome.runtime.lastError;
          });
        }
      }
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "port": background.port.name,
          "path": "interface-to-background"
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (let id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-interface") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config = {
  "settings": {},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      const context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            /*  */
            background.connect(chrome.runtime.connect({"name": config.port.name}));
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "load": function () {
    const reload = document.getElementById("reload");
    const result = document.getElementById("result");
    const resize = document.getElementById("resize");
    const support = document.getElementById("support");
    const input = document.getElementById("input-file");
    const settings = document.getElementById("settings");
    const donation = document.getElementById("donation");
    const download = document.getElementById("download");
    const consolearea = document.getElementById("console");
    const select = document.querySelector("select[name='dimension']");
    const content = document.querySelector(".settings").querySelector(".content");
    const numbers = [...content.querySelectorAll("input[type='number']")];
    const radios = [...content.querySelectorAll("input[type='radio']")];
    /*  */
    select.addEventListener("change", config.listener.select);
    input.addEventListener("change", config.ffmpeg.input, false);
    resize.addEventListener("click", config.ffmpeg.resize, false);
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);     
    /*  */
    settings.addEventListener("click", function () {
      config.listener.button(".settings");
    }, false);
    /*  */
    consolearea.addEventListener("click", function () {
      config.listener.button(".console");
    }, false);
    /*  */
    result.addEventListener("click", function () {
      config.listener.button(".result");
    }, false);
    /*  */
    radios.map(function (radio) {
      radio.addEventListener("change", config.listener.radio);
    });
    /*  */
    numbers.map(function (number) {
      number.addEventListener("change", config.listener.number);
    });
    /*  */
    download.addEventListener("click", function () {
      config.ffmpeg.result.download(false);
    }, false);
    /*  */
    support.addEventListener("click", function () {
      let url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      let url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.action.render);
    window.removeEventListener("load", config.load.app, false);
  },
  "listener": {
    "select": function (e) {
      if (e.target.value) {
        config.action.clear();
        config.settings.dimension = {
          "width": e.target.value.split(" ✕ ")[0],
          "height": e.target.value.split(" ✕ ")[1]
        };
        /*  */
        config.storage.write("settings", config.settings);
      }
    },
    "button": function (name) {
      config.action.details();
      /*  */
      const target = document.querySelector(name);
      if (target) {
        const summary = target.querySelector("summary");
        if (summary) {
          summary.click();
          summary.scrollIntoView({"behavior": "smooth"});
        }
      }
    },
    "radio": function (e) {
      let targets = [];
      let target = null;
      const content = document.querySelector(".settings").querySelector(".content");
      /*  */
      targets = [...content.querySelectorAll("input[type='radio']")];
      targets.map(function (target) {target.closest("td").removeAttribute("selected")});
      if (e.target.checked) e.target.closest("td").setAttribute("selected", '');
      /*  */
      targets = [...document.querySelectorAll("select")];
      targets.map(function (target) {target.disabled = true});
      /*  */
      targets = [...document.querySelectorAll("input[type='number']")];
      targets.map(function (target) {target.disabled = true});
      /*  */
      targets = [...document.querySelectorAll("input[name='" + e.target.id + "']")];
      targets.map(function (target) {target.disabled = !e.target.checked});
      /*  */
      target = document.querySelector("select[name='" + e.target.id + "']");
      if (target) target.disabled = !e.target.checked;
    },
    "number": function (e) {
      const value = e.target.value;
      const name = e.target.getAttribute("name");
      const context = e.target.getAttribute("for");
      /*  */
      if (name === "bitrate") {
        config.action.clear();
        config.settings[name] = {
          "audio": document.querySelector("input[name='" + name + "'][for='audio']").value,
          "video": document.querySelector("input[name='" + name + "'][for='video']").value
        };
      }        
      /*  */
      if (name === "percent") {
        let tmp = {};
        config.action.clear();
        tmp[context] = value;
        config.settings[name] = tmp;
        if (context === "width") document.querySelector("input[name='" + name + "'][for='height']").value = '';
        if (context === "height") document.querySelector("input[name='" + name + "'][for='width']").value = '';
      }        
      /*  */
      if (name === "pixel") {
        let tmp = {};
        config.action.clear();
        tmp[context] = value;
        config.settings[name] = tmp;
        if (context === "width") document.querySelector("input[name='" + name + "'][for='height']").value = '';
        if (context === "height") document.querySelector("input[name='" + name + "'][for='width']").value = '';
      }
      /*  */
      if (name === "forced") {
        const width = document.querySelector("input[name='" + name + "'][for='width']").value;
        const height = document.querySelector("input[name='" + name + "'][for='height']").value;
        if (width && height) {
          config.action.clear();
          config.settings[name] = {"width": width, "height": height};
        }
      }
      /*  */
      config.storage.write("settings", config.settings);
    }
  },
  "action": {
    "details": function () {
      const targets = [...document.querySelectorAll("details")];
      targets.map(e => e.removeAttribute("open"));
    },
    "clear": function () {
      config.settings.pixel = {};
      config.settings.forced = {};
      config.settings.bitrate = {};
      config.settings.percent = {};
      config.settings.dimension = {};
    },
    "loading": function () {
      let pre = null;
      const logo = document.querySelector(".logo");
      const button = document.querySelector("#resize");
      const content = document.querySelector(".console").querySelector(".content");
      /*  */
      content.textContent = '';
      button.textContent = "loading...";
      button.setAttribute("loading", '');
      logo.setAttribute("progress", '');
      /*  */
      pre = document.createElement("pre");
      pre.textContent = ">> Loading the app, please wait...";
      pre.setAttribute("normal", '');
      content.appendChild(pre);
    },
    "start": function () {
      let pre = null;
      const logo = document.querySelector(".logo");
      const file = document.querySelector(".file");
      const progress = file.querySelector("#progress");
      const button = document.querySelector("#resize");
      const content = document.querySelector(".console").querySelector(".content");
      /*  */
      content.textContent = '';
      config.ffmpeg.error = false;
      button.textContent = "resize";
      config.ffmpeg.video.ratio = 0;
      config.ffmpeg.video.duration = 0;
      logo.removeAttribute("progress");
      progress.removeAttribute("state");
      button.removeAttribute("loading");
      if (config.ffmpeg.result.a) config.ffmpeg.result.a.remove();
      if (config.ffmpeg.result.object.url.input) URL.revokeObjectURL(config.ffmpeg.result.object.url.input);
      if (config.ffmpeg.result.object.url.output) URL.revokeObjectURL(config.ffmpeg.result.object.url.output);
      /*  */
      pre = document.createElement("pre");
      pre.textContent = ">> The video resizer app is ready.";
      pre.setAttribute("normal", '');
      content.appendChild(pre);
      /*  */
      pre = document.createElement("pre");
      pre.textContent = ">> Please load a video file, adjust your settings, and then press the RESIZE button.";
      pre.setAttribute("normal", '');
      content.appendChild(pre);
      /*  */
      pre = document.createElement("pre");
      pre.textContent = ">> Once the operation completes, the resized video will be downloaded to your machine.";
      pre.setAttribute("normal", '');
      content.appendChild(pre);      
      /*  */
      pre = document.createElement("pre");
      pre.textContent = "--------------------------------------------------------------------------------------";
      pre.setAttribute("normal", '');
      content.appendChild(pre);
    },
    "render": async function () {
      config.settings = config.storage.read("settings") !== undefined ? config.storage.read("settings") : config.ffmpeg.video.default;
      /*  */
      await config.ffmpeg.load();
      /*  */
      for (let name in config.settings) {
        const current = config.settings[name];
        if (current) {
          const length = Object.keys(current).length;
          if (length) {
            const target = document.getElementById(name);
            if (target) {
              target.click();
              /*  */
              if (name === "bitrate") {
                if (current.audio) document.querySelector("input[name='" + name + "'][for='audio']").value = current.audio;
                if (current.video) document.querySelector("input[name='" + name + "'][for='video']").value = current.video;
              }   
              /*  */
              if (name === "percent") {
                if (current.width) document.querySelector("input[name='" + name + "'][for='width']").value = current.width;
                if (current.height) document.querySelector("input[name='" + name + "'][for='height']").value = current.height;
              }        
              /*  */
              if (name === "pixel") {
                if (current.width) document.querySelector("input[name='" + name + "'][for='width']").value = current.width;
                if (current.height) document.querySelector("input[name='" + name + "'][for='height']").value = current.height;
              }
              /*  */
              if (name === "forced") {
                if (current.width) document.querySelector("input[name='" + name + "'][for='width']").value = current.width;
                if (current.height) document.querySelector("input[name='" + name + "'][for='height']").value = current.height;
              }          
              /*  */
              if (name === "dimension") {
                if (current.width && current.height) {
                  document.querySelector("select[name='" + name + "']").value = current.width + " ✕ " + current.height;
                }
              }
            }
          }
        }
      }
    }
  },
  "ffmpeg": {
    "error": false,
    "fs": undefined,
    "run": undefined,
    "core": undefined,
    "buffer": undefined,
    "URL": {
      "core": chrome.runtime.getURL("/data/interface/vendor/ffmpeg-core.js"),
      "wasm": chrome.runtime.getURL("/data/interface/vendor/ffmpeg-core.wasm")
      //"worker": chrome.runtime.getURL("/data/interface/vendor/ffmpeg-core.worker.js")
    },
    "video": {
      "ratio": 0,
      "duration": 0,
      "default": {
        "dimension": {
          "width": "640", 
          "height": "360"
        }
      },
      "ts2sec": function (ts) {
        const [h, m, s] = ts.split(':');
        return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
      }
    },
    "parse": function (e, args) {
      const argspointer = e._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
      /*  */
      args.forEach(function (string, index) {
        const buffer = e._malloc(string.length + 1);
        /*  */
        e.writeAsciiToMemory(string, buffer);
        e.setValue(argspointer + (Uint32Array.BYTES_PER_ELEMENT * index), buffer, "i32");
      });
      /*  */
      return [args.length, argspointer];
    },
    "input": function (e) {
      if (e) {
        if (e.target) {
          if (e.target.files) {
            if (e.target.files.length) {
              config.ffmpeg.file = e.target.files[0];
              /*  */
              const details = document.querySelector(".settings").querySelector("details");
              details.scrollIntoView({"behavior": "smooth"});
              details.setAttribute("open", '');
            }
          }
        }
      }
    },
    "reader": async function (file) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        /*  */
        reader.readAsArrayBuffer(file);
        reader.onload = function (e) {
          if (e) {
            if (e.target) {
              if (e.target.result) {
                resolve(e.target.result);
              }
            }
          }
        };
      });
    },
    "result": {
      'a': null,
      "blob": undefined,
      "object": {
        "url": {
          "input": null,
          "output": null
        }
      },
      "download": function (flag) {
        const button = document.querySelector("#resize");
        /*  */
        button.textContent = "resize";
        if (config.ffmpeg.file) {
          if (config.ffmpeg.result.blob) {
            if (config.ffmpeg.error === false) {
              config.action.details();
              /*  */
              const download = document.querySelector("#download");
              const result = document.querySelector(".result").querySelector("summary");
              const content = document.querySelector(".result").querySelector(".content");
              /*  */
              result.click();
              content.scrollIntoView({"behavior": "smooth"});
              /*  */
              if (flag) {
                config.ffmpeg.result.a = document.createElement('a');
                config.ffmpeg.result.object.url.input = URL.createObjectURL(config.ffmpeg.file);
                config.ffmpeg.result.object.url.output = URL.createObjectURL(config.ffmpeg.result.blob);
                document.querySelector(".input-video").querySelector("video").src = config.ffmpeg.result.object.url.input;
                document.querySelector(".output-video").querySelector("video").src = config.ffmpeg.result.object.url.output;
                /*  */
                config.ffmpeg.result.a.setAttribute("download", "[resized] " + config.ffmpeg.file.name);
                config.ffmpeg.result.a.setAttribute("href", config.ffmpeg.result.object.url.output);
                download.appendChild(config.ffmpeg.result.a);
              }
              /*  */
              config.ffmpeg.result.a.click();
            }
          }
        }
      }
    },
    "load": async function () {
      const file = document.querySelector(".file");
      const logo = document.querySelector(".logo");
      const content = document.querySelector(".console").querySelector(".content");
      /*  */
      config.action.loading();
      /*  */
      try {
        config.ffmpeg.core = new FFmpegWASM.FFmpeg();
        /*  */
        await config.ffmpeg.core.load({
          "coreURL": config.ffmpeg.URL.core,
          "wasmURL": config.ffmpeg.URL.wasm,
          //"workerURL": config.ffmpeg.URL.worker
        });
        /*  */
        config.ffmpeg.core.on("log", async function (e) {
          if (e) {
            const pre = document.createElement("pre");
            const message = e.message && e.type === "stderr" ? e.message : '';
            /*  */
            const cond_0 = message.toLowerCase() === '';
            const cond_1 = message.toLowerCase().indexOf("error") !== -1;
            const cond_2 = message.toLowerCase().indexOf("failed") !== -1;
            if (cond_0 || cond_1 || cond_2) config.ffmpeg.error = true;
            /*  */
            content.appendChild(pre);
            pre.textContent = "> " + message;
            logo.setAttribute("progress", '');
            content.scrollIntoView({"behavior": "smooth"});
            pre.setAttribute(config.ffmpeg.error ? "error" : "normal", '');
            /*  */
            if (content.scrollHeight - content.scrollTop < 350) {
              content.scrollTop = content.scrollHeight;
            }
          }
        });
        /*  */
        config.ffmpeg.core.on("progress", async function (e) {
          if (e) {
            const ratio = e.progress;
            const pre = document.createElement("pre");
            const progress = file.querySelector("#progress");
            /*  */
            config.ffmpeg.video.ratio = ratio;
            progress.setAttribute("state", "loading");
            progress.textContent = Math.round(config.ffmpeg.video.ratio * 100) + "%";
            /*  */
            if (config.ffmpeg.video.ratio === 1) {
              pre.setAttribute("success", '');
              progress.setAttribute("state", "complete");
              pre.textContent = ">> Resizing the video is completed!";
              /*  */
              const type = config.ffmpeg.file.type;
              const output = "[resized] " + config.ffmpeg.file.name;
              const cache = await config.ffmpeg.core.readFile(output);
              /*  */
              logo.removeAttribute("progress");
              config.ffmpeg.result.blob = new Blob([cache], {"type": type});
              /*  */
              window.setTimeout(function () {
                config.ffmpeg.result.download(true);
              }, 300);
            }
          }
        });
        /*  */
        config.action.start();
      } catch (e) {
        console.error(e);
        window.alert("An unexpected error happened! Please reload the app and try again.");
      }
    },
    "resize": function () {
      const button = document.querySelector("#resize");
      if (button.textContent === "cancel") {
        document.location.reload();
      } else if (button.textContent === "resize") {
        if (config.ffmpeg.core) {
          if (config.ffmpeg.file) {
            config.action.start();
            config.action.details();
            /*  */
            let args = [];
            const input = config.ffmpeg.file.name;
            const output = "[resized] " + config.ffmpeg.file.name;
            const logarea = document.querySelector(".console").querySelector("summary");
            const content = document.querySelector(".console").querySelector(".content");
            /*  */
            for (let name in config.settings) {
              const current = config.settings[name];
              if (current) {
                const length = Object.keys(current).length;
                if (length) {
                  args = ["-nostdin", "-y", "-i", input];
                  /*  */
                  if (name === "bitrate") {
                    if (current.video) {
                      args.push("-b:v");
                      args.push(current.video + 'k');
                    }
                    /*  */
                    if (current.audio) {
                      args.push("-b:a");
                      args.push(current.audio + 'k');
                    }
                  }   
                  /*  */
                  if (name === "percent") {
                    args.push("-vf");
                    if (current.width) args.push("scale=iw*" + (current.width / 100) + ":-2");
                    if (current.height) args.push("scale=iw*" + (current.height / 100) + ":-2");
                  }        
                  /*  */
                  if (name === "pixel") {
                    args.push("-vf");
                    if (current.width) args.push("scale=" + current.width + ":-2");
                    if (current.height) args.push("scale=" + current.height + ":-2");
                  }
                  /*  */
                  if (name === "forced") {
                    if (current.width && current.height) {
                      args.push("-vf");
                      args.push("scale=" + current.width + ":" + current.height + ":force_original_aspect_ratio=decrease,pad=" + current.width + ":" + current.height + ":(ow-iw)/2:(oh-ih)/2");
                    }
                  }          
                  /*  */
                  if (name === "dimension") {
                    if (current.width && current.height) {
                      args.push("-vf");
                      args.push("scale=" + current.width + ":" + current.height + ":force_original_aspect_ratio=decrease,pad=" + current.width + ":" + current.height + ":(ow-iw)/2:(oh-ih)/2");
                    }
                  }
                  /*  */
                  args.push(output);
                }
              }
            }
            /*  */
            if (args) {
              if (args.length) {
                if (args.length > 6) {
                  logarea.click();
                  button.textContent = "cancel";
                  content.scrollIntoView({"behavior": "smooth"});
                  /*  */
                  window.setTimeout(async function () {
                    try {
                      const buffer = await config.ffmpeg.reader(config.ffmpeg.file);
                      await config.ffmpeg.core.writeFile(input, new Uint8Array(buffer));
                      await config.ffmpeg.core.exec(args);
                    } catch (e) {
                      console.error(e);
                      window.alert("An unexpected error happened! Please reload the app and try again.");
                    }
                  }, 300);
                }
              }
            }
          } else {
            window.alert("Input video file is not chosen! Please load a video file and try again.");
          }
        } else {
          window.alert("FFmpeg core is not loaded! Please reload the app and try again.");
        }
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
