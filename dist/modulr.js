(function (exports, $) {
	JS_REG = /\.js$/;
	CSS_REG = /\.css$/;
	HTML_REG = /\.html$/;

	Modulr = {
		modules: {},
		cache: {},
		listeners: [],

		register: function(name, files, opts) {
			opts = opts || {};
			opts.files = files;
			Modulr.modules[name] = opts;
		},

		load: function(opts) {
			var files = [];
			var done = false;

			// find all files
			opts.modules.forEach(function(name) {
				var module = Modulr.modules[name];
				module.files.forEach(function(file) {
					var furl = file;
					if (typeof(module.timestamp) != 'undefined') {
						furl = furl + "?t=" + module.timestamp;
					}
					files.push(furl);
				});
			});
			console.log(opts.modules.join(","));
			console.log(files.join(","));

			var checkReady = function() {
				if (done) return;
				done = files.every(function(url) {
					var fs = Modulr.cache[url];
					return (fs && fs.is_waiting == false);
				});
				if (done) {
					// all files loaded
					var has_error = checkError();
					opts.callback(!has_error);
				}
			};
			var checkError = function() {
				return files.some(function(url) {
					var fs = Modulr.cache[url];
					return (fs.error != null);
				});
			};

			// load files
			files.forEach(function(url) {
				Modulr.loadURL(url, function(success, data) {
					checkReady();
				});
			});

		},

		loadURL: function(url, callback) {
			var fn = null;
			var tu = url.split("?")[0];
			if (tu.match(JS_REG)) {
				fn = Modulr.loadScript;
			} else if (tu.match(CSS_REG)) {
				fn = Modulr.loadStyleSheet;
			} else {
				fn = Modulr.loadTemplateFile;
			}

			var fs = Modulr.cache[url];

			if (!fs || fs.error) {
				fs = Modulr.cache[url] = {
					url: url,
					loaded: false,
					is_waiting: true,
					error: null,
					callbacks: [callback],
				};
				fn(url, function(success, data) {
					fs.is_waiting = false;
					fs.loaded = success;
					fs.error = data.error;
					//Modulr.trigger('file.ready', url);
					fs.callbacks.forEach(function(cb) {
						cb(success, data);
					});
				});
			} else if (fs.loaded) {
				//Modulr.trigger('file.ready', url);
				callback(true, {url: url, cached: true});
			} else if (fs.is_waiting) {
				fs.callbacks.push(callback);
			}
		},

		loadScript: function(url, callback) {
			var tag = document.createElement('script');
			tag.type = "text\/javascript";
			tag.src = url;
			tag.onerror = function(error) {
				callback(false, {url: url, error: error});
			};
			tag.onload = function() {
				callback(true, {url: url});
			};
			Modulr.utils.appendToHead(tag);
		},

		loadStyleSheet: function(url, callback) {
			var tag = document.createElement('link');
			tag.rel = "stylesheet";
			tag.type = "text\/css";
			tag.href = url;
			if ('onload' in tag) {
				tag.onerror = function(error) {
					callback(false, {url: url, error: error});
				};
				tag.onload = function() {
					callback(true, {url: url});
				};
			} else {
				setTimeout(function() {
					callback(true, {url: url});
				}, 100);
			}
			$('head').append(tag);
		},

		loadTemplateFile: function(url, callback) {
			$.ajax({
				url: url,
				success: function(data) {
					$('html').append(data);
					callback(true, {url: url});
				},
				error: function(error) {
					callback(false, {url: url, error: error});
				},
			});
		},

		isLoaded: function(url) {
			return Modulr.cache[url] == true;
		},

		utils: {
			getHeadTag: function() {
				return document.getElementsByTagName("head")[0];
			},
			appendToHead: function(tag) {
				var head = Modulr.utils.getHeadTag();
				head.appendChild(tag);
			},
		},
	};

	exports.Modulr = Modulr;

}(window, jQuery));





