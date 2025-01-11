"use strict";

var ss;
var l;

var algxApp = angular.module("algxApp", ["algxControllers", "debounce", "ngWheel"]);

algxApp.config(["$locationProvider", function($locationProvider) {
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false,
	});
}]);

algxApp.filter("title", function() {
	return function(input, title) {
		return [title, input].filter(v => v.trim()).join(" | ");
	};
});

algxApp.filter("ceil", () => (input => Math.ceil(input)));

var algxControllers = angular.module("algxControllers", ["monospaced.elastic"]);

algxControllers.controller("algxController", ["$scope", "$sce", "$location", "debounce", function($scope, $sce, $location, debounce) {

	var search = $location.search();

	function indexBy(list, key) {
		var obj = {};
		for (var i in list) {
			obj[list[i][key]] = list[i];
		}
		return obj;
	}

	var param_defaults = [];

	$scope.clear = function() {
		$scope.alg = "";
		$scope.setup = "";
		$scope.current_move = 0;
		$scope.title = "";
	};

	$scope.reset = function() {
		for (var param in param_defaults) {
			$scope[param] = param_defaults[param];
		}
		$scope.speed = $scope.speed_default;
		$scope.hint_stickers = $scope.hint_stickers_default;
		$scope.hint_stickers_distance = $scope.hint_stickers_distance_default;
		$scope.hollow = $scope.hollow_default;
		$scope.picture = $scope.picture_default;
		$scope.clear();
	};

	function initParameter(param, fallback, list) {
		var obj = indexBy(list, "id");
		$scope[param] = obj[search[param]] || obj[fallback];
		$scope[param + "_map"] = obj;
		$scope[param + "_list"] = list;
		$scope[param + "_default"] = fallback;
		param_defaults[param] = obj[fallback];
	}

	initParameter("puzzle", "3x3x3", [
		{ id: "1x1x1", name: "1x1x1", group: "Cube", dimension: 1 },
		{ id: "2x2x2", name: "2x2x2", group: "Cube", dimension: 2 },
		{ id: "3x3x3", name: "3x3x3", group: "Cube", dimension: 3 },
		{ id: "4x4x4", name: "4x4x4", group: "Cube", dimension: 4 },
		{ id: "5x5x5", name: "5x5x5", group: "Cube", dimension: 5 },
		{ id: "6x6x6", name: "6x6x6", group: "Cube", dimension: 6 },
		{ id: "7x7x7", name: "7x7x7", group: "Cube", dimension: 7 },
		{ id: "8x8x8", name: "8x8x8", group: "Cube", dimension: 8 },
		{ id: "9x9x9", name: "9x9x9", group: "Cube", dimension: 9 },
		{ id: "10x10x10", name: "10x10x10", group: "Cube", dimension: 10 },
		{ id: "11x11x11", name: "11x11x11", group: "Cube", dimension: 11 },
		{ id: "12x12x12", name: "12x12x12", group: "Cube", dimension: 12 },
		{ id: "13x13x13", name: "13x13x13", group: "Cube", dimension: 13 },
		{ id: "14x14x14", name: "14x14x14", group: "Cube", dimension: 14 },
		{ id: "15x15x15", name: "15x15x15", group: "Cube", dimension: 15 },
		{ id: "16x16x16", name: "16x16x16", group: "Cube", dimension: 16 },
		{ id: "17x17x17", name: "17x17x17", group: "Cube", dimension: 17 }, // Over the top!
	]);

	initParameter("stage", "full", [
		{ id: "full", name: "Full", group: "Stage" },
		{ id: "cross", name: "Cross", group: "CFOP" },
		{ id: "F2L", name: "F2L", group: "CFOP" },
		{ id: "OLL", name: "OLL", group: "CFOP" },
		{ id: "PLL", name: "PLL", group: "CFOP" },
		{ id: "CLS", name: "CLS", group: "MGLS" },
		{ id: "ELS", name: "ELS", group: "MGLS" },
		{ id: "L6E", name: "L6E", group: "Roux" },
		{ id: "CMLL", name: "CMLL", group: "Roux" },
		{ id: "WV", name: "WV", group: "Variation" },
		{ id: "ZBLL", name: "ZBLL", group: "Variation" },
		{ id: "void", name: "Void Cube", group: "Puzzle" },
		{ id: "custom", name: "Custom", group: "Stage", disabled: true },
	]);

	initParameter("type", "moves", [
		{
			id: "moves",
			name: "Moves",
			setup: "Setup",
			alg: "Moves",
			type: "generator",
			setup_moves: "setup moves",
			alg_moves: "moves",
			inverse: "alg",
		},
		{
			id: "alg",
			name: "Algorithm",
			setup: "Setup",
			alg: "Algorithm",
			type: "solve",
			setup_moves: "setup moves for end position",
			alg_moves: "algorithm moves",
			inverse: "moves",
		},
	]);

	initParameter("anchor", "start", [
		{ id: "start", name: "anchored at start" },
		{ id: "end", name: "anchored at end" },
	]);

	// TODO: BOY/Japanese translations.
	initParameter("scheme", "boy", [
		{
			id: "boy",
			name: "BOY",
			type: "Color Scheme",
			scheme: "grobyw",
			display: "BOY",
			custom: false,
		},
		{
			id: "japanese",
			name: "Japanese",
			type: "Color Scheme",
			scheme: "groybw",
			display: "Japanese",
			custom: false,
		},
		{
			id: "white-face-down",
			name: "White Face Down",
			type: "Color Scheme",
			scheme: "brogwy",
			display: "White Face Down",
			custom: false,
		},
		{
			id: "custom",
			name: "Custom:",
			type: "Color Scheme",
			scheme: "grobyw",
			display: "",
			custom: true,
		},
	]);
	$scope.custom_scheme_default = "";
	$scope.custom_scheme = $scope.custom_scheme_default;
	if ("custom_scheme" in search) {
		$scope.custom_scheme = search["custom_scheme"].slice(0, 6);
	}

	$scope.current_move = "0";

	$scope.setupStatus = "valid";
	$scope.algStatus = "valid";

	initParameter("view", "editor", [
		{
			id: "editor",
			next: "fullscreen",
			fullscreen: false,
			infoPane: true,
			embed: false,
		},
		{
			id: "fullscreen",
			next: "editor",
			fullscreen: true,
			infoPane: false,
			embed: false,
		},
		{
			id: "embed",
			next: "editor",
			fullscreen: true,
			infoPane: false,
			embed: true,
		},
	]);

	$scope.title_default = "";
	$scope.title = $scope.title_default;
	if ("title" in search) {
		$scope.title = search["title"];
	}

	$scope.speed_default = 1;
	$scope.speed = $scope.speed_default;
	if ("speed" in search) {
		$scope.speed = search["speed"] * 1 || $scope.speed_default;
	}

	$scope.hint_stickers_default = true;
	$scope.hint_stickers = $scope.hint_stickers_default;
	if ("hint_stickers" in search) {
		$scope.hint_stickers = toBoolean(search["hint_stickers"]);
	}

	$scope.hint_stickers_distance_default = 1;
	$scope.hint_stickers_distance = $scope.hint_stickers_distance_default;
	if ("hint_stickers_distance" in search) {
		$scope.hint_stickers_distance = search["hint_stickers_distance"] * 1 || $scope.hint_stickers_distance_default;
	}

	$scope.hollow_default = false;
	$scope.hollow = $scope.hollow_default;
	if ("hollow" in search) {
		$scope.hollow = toBoolean(search["hollow"]);
	}

	$scope.picture_default = false;
	$scope.picture = $scope.picture_default;
	if ("picture" in search) {
		$scope.picture = toBoolean(search["picture"]);
	}

	function toBoolean(value) {
		if (typeof value === "boolean") {
			return value;
		}
		switch (String(value).toLowerCase()) {
			case "1":
			case "on":
			case "true":
				return true;
			case "0":
			case "off":
			case "false":
				return false;
			default:
				return false;
		}
	}

	$scope.toggleFullScreen = function() {
		$scope.view = $scope.view_map[$scope.view.next];
		if ($scope.view.fullscreen) {
			document.getElementById("display-wrapper").requestFullscreen();
		} else if (document.fullscreenElement) {
			document.exitFullscreen();
		}
		updateLocation();
	};

	$scope.onwheel = function(e) {
		e.preventDefault();
		var { min, max } = e.target;
		var model = e.target.dataset.ngModel;
		var value = $scope[model] - e.target.step * Math.sign(e.originalEvent.deltaY);
		$scope[model] = Math.min(Math.max(min, value), max);
	};
	$scope.changeSpeed = e => {
		e.preventDefault();
		var slider = document.querySelector("#speed input");
		var { min, max } = slider;
		var value = $scope.speed - slider.step * Math.sign(e.originalEvent.deltaY);
		$scope.speed = Math.min(Math.max(min, value), max);
		$("#speed input").show();
	};
	$scope.toggleSpeedSlider = e => {
		if (!e.target.matches("input")) {
			$("#speed input").toggle();
		}
	};
	$scope.initSpeedSlider = e => {
		$scope.speed = $scope.speed_default;
		$("#speed input").hide();
	};
	$(document).on("mousedown touchstart", e => {
		if (!e.target.closest("#speed")) {
			$("#speed input").hide();
		}
	});

	$scope.expand = function() {
		$scope.alg = alg.cube.expand($scope.alg);
	};

	$scope.simplify = function() {
		$scope.alg = alg.cube.simplify($scope.alg);
		$scope.addHistoryCheckpoint = true;
	};

	$scope.invert = function() {
		// The setup stays the same. It's like magic!
		$scope.alg = alg.cube.invert($scope.alg);
		var currentPosition = twistyScene.getPosition();
		var maxPosition = twistyScene.getMaxPosition();
		$scope.current_move = maxPosition - currentPosition;
		$scope.type = $scope.type_map[$scope.type.inverse];
		$scope.addHistoryCheckpoint = true;
	};

	$scope.mirror = function(axis) {
		$scope.setup = alg.cube.mirror($scope.setup, axis);
		$scope.alg = alg.cube.mirror($scope.alg, axis);
		$scope.addHistoryCheckpoint = true;
	};

	$scope.rotate = function(axis) {
		if ($scope.alg.trim()) {
			$scope.alg = alg.cube.rotate($scope.alg, axis);
			var matcher = new RegExp(`^\\s*${axis}(\\d*)('?)\\s*`, "g");
			if (matcher.test($scope.alg)) {
				$scope.alg = $scope.alg.replace(matcher, function(match, p1, p2) {
					var amount = ((((p1 || 1) * (p2 ? -1 : 1) + 1) % 4) + 4) % 4;
					switch (amount) {
						case 0:
							return "";
						case 1:
							return axis + " ";
						case 2:
							return axis + "2 ";
						case 3:
							return axis + "' ";
						default:
							return "";
					}
				});
			} else {
				$scope.alg = axis + " " + $scope.alg;
			}
			$scope.addHistoryCheckpoint = true;
		}
	};

	$scope.removeComments = function() {
		$scope.setup = alg.cube.removeComments($scope.setup);
		$scope.alg = alg.cube.removeComments($scope.alg);
		$scope.addHistoryCheckpoint = true;
	};

	$scope.image = function() {
		var canvas = document.getElementsByTagName("canvas")[0];
		var img = canvas.toDataURL("image/png");
		$("#canvasPNG").fadeTo(0, 0);
		$("#canvasPNG").html('<a href="' + img + '" target="blank"><img src="' + img + '"/></a>');
		$("#canvasPNG").fadeTo("slow", 1);
	};

	function escape_alg(alg) {
		if (!alg) {
			return alg;
		}
		var escaped = alg;
		escaped = escaped.replace(/_/g, "&#95;").replace(/ /g, "_");
		escaped = escaped.replace(/-/g, "&#45;").replace(/'/g, "-");
		return escaped;
	}

	function unescape_alg(alg) {
		if (!alg) {
			return alg;
		}
		var unescaped = alg;
		unescaped = unescaped.replace(/-(?!\d)/g, "'").replace(/&#45;/g, "-");
		unescaped = unescaped.replace(/_/g, " ").replace(/&#95;/g, "_");
		return unescaped;
	}

	$scope.alg_default = "";
	$scope.alg = unescape_alg(search["alg"]) || $scope.alg_default;
	$scope.setup_default = "";
	$scope.setup = unescape_alg(search["setup"]) || $scope.setup_default;

	function setWithDefault(name, value) {
		var _default = $scope[name + "_default"];
		$location.search(name, value == _default ? null : value);
	}

	function updateLocation() {
		$location.replace();
		setWithDefault("title", $scope.title);
		setWithDefault("setup", escape_alg($scope.setup));
		setWithDefault("alg", escape_alg($scope.alg));
		setWithDefault("puzzle", $scope.puzzle.id);
		setWithDefault("stage", $scope.stage.id);
		setWithDefault("type", $scope.type.id);
		setWithDefault("anchor", $scope.anchor.id);
		setWithDefault("scheme", $scope.scheme.id);
		setWithDefault("custom_scheme", $scope.custom_scheme);
		setWithDefault("speed", $scope.speed);
		setWithDefault("hint_stickers", $scope.hint_stickers);
		setWithDefault("hint_stickers_distance", $scope.hint_stickers_distance);
		setWithDefault("hollow", $scope.hollow);
		setWithDefault("picture", $scope.picture);
		setWithDefault("view", $scope.view.id);
		setWithDefault("fbclid", null); // Remove Facebook tracking ID
		// Update sharing links
		$scope.share_url = $location.absUrl();
		var url = new URL($scope.share_url);
		url.searchParams.delete("view");
		$scope.editor_url = url.href;
		var tweetUrl = new URL("https://twitter.com/intent/tweet");
		tweetUrl.searchParams.set("text", document.title);
		tweetUrl.searchParams.set("url", $scope.share_url);
		$scope.share_twitter_url = tweetUrl.href;
		url.searchParams.set("view", "embed");
		url.search = url.search.replace(/=(?=&|$)/g, "");
		$scope.embed_url = url.href;
		$scope.embed_text = `<iframe src="${$scope.embed_url}" frameborder="0"></iframe>`;
		showEmbedDebounce();
	}

	$scope.toggleEmbed = function() {
		$("#embed").toggleClass("hidden");
		$scope.showEmbed();
	};
	$scope.showEmbed = function() {
		if (!$("#embed").is(".hidden")) {
			$scope.embed_html = $sce.trustAsHtml($scope.embed_text);
		}
	};
	var showEmbedDebounce = debounce($scope.showEmbed, 1000);
	$("#copyEmbed").on("click", function() {
		copyToClipboard($scope.embed_text);
	});
	function copyToClipboard(text) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => {
				displayToast("Link copied to clipboard.");
			}, () => {
				displayToast("ERROR: Failed to copy link.", true);
			});
		} else {
			displayToast("ERROR: Failed to copy link.", true);
		}
	}

	var colorMap = {
		y: 0xffff00,
		w: 0xffffff,
		b: 0x0000ff,
		g: 0x00ff00,
		o: 0xff8800,
		r: 0xff0000,
		x: 0x222222,
	};

	var lightColorMap = {
		y: 0x444400,
		w: 0x444444,
		b: 0x000044,
		g: 0x004400,
		o: 0x442200,
		r: 0x440000,
		x: 0x111111,
	};

	function colorList(str) {
		var out = [];
		var outLight = [];
		var str2 = ("x" + str + "xxxxxx").slice(0, 7).split("");
		var reorder = [0, 6, 3, 1, 2, 4, 5];
		for (var i in str2) {
			out.push(colorMap[str2[reorder[i]]]);
			outLight.push(lightColorMap[str2[reorder[i]]]);
		}
		return out.concat(outLight);
	}

	function locationToIndex(text, line, column) {
		var lines = text.split("\n");
		var index = 0;
		for (var i = 0; i < line - 1; i++) {
			index += lines[i].length + 1;
		}
		return index + column;
	}

	// We set this variable outside so that it will be overwritten.
	// This currently helps with performance, presumably due to garbage collection.
	var twistyScene;

	var webgl = (function() {
		try {
			var canvas = document.createElement("canvas");
			return !!window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
		} catch (e) {
			return false;
		}
	})();
	var Renderer = webgl ? THREE.WebGLRenderer : THREE.CanvasRenderer;

	function initTwisty() {

		if ($scope.animating) {
			twistyScene.player.pause();
		}

		try {
			twistyScene = new twisty.scene({
				allowDragging: true,
				renderer: Renderer,
				cachedRenderer: true,
			});
		} catch (e) {
			($scope.play = () => {
				displayToast("If nothing is displayed on the canvas, try restarting your browser.", true);
			})();
			return;
		}

		$("#viewer").empty().append(twistyScene.getDomElement());

		twistyScene.initializePuzzle({
			type: "cube",
			dimension: $scope.puzzle.dimension,
			stage: $scope.stage.id,
			stageMap: $scope.stageMap,
			hintStickers: $scope.hint_stickers,
			hintStickersDistance: $scope.hint_stickers_distance,
			cubies: !$scope.hollow,
			picture: $scope.picture,
			stickerBorder: false,
			doubleSided: !$scope.hint_stickers,
			colors: colorList($scope.scheme.custom ? $scope.custom_scheme : $scope.scheme.scheme),
		});

		var init;

		try {
			$scope.setupStatus = "valid";
			$scope.setup = $scope.setup.replaceAll("’", "'");
			init = alg.cube.fromString($scope.setup);
			var setupCanonical = alg.cube.toString(init);
			if (setupCanonical !== $scope.setup) {
				$scope.setupStatus = "uncanonical";
			}
			init = alg.cube.toMoves(init);
		} catch (e) {
			console.error(e);
			$scope.setupStatus = "invalid";
		}

		try {
			$scope.algStatus = "valid";
			$scope.alg = $scope.alg.replaceAll("’", "'");
			var algoFull = alg.cube.fromString($scope.alg);
			var algoCanonical = alg.cube.toString(algoFull);
			if (algoCanonical !== $scope.alg.replace(/(?<!^)\s*\/\//g, " //")) {
				$scope.algStatus = "uncanonical";
			}
			$scope.algo = alg.cube.toMoves(algoFull);
		} catch (e) {
			console.error(e);
			$scope.algStatus = "invalid";
		}

		if ($scope.setupStatus === "invalid" || $scope.algStatus === "invalid") {
			return;
		}

		var type = $scope.type.type;

		twistyScene.setupAnimation($scope.algo, {
			init: init,
			type: type,
		});

		twistyScene.addListener("animating", function(animating) {
			$scope.$evalAsync(() => {
				$scope.animating = animating;
			});
		});

		twistyScene.addListener("position", getCurrentMove);

		if ($scope.anchor.id === "end") {
			$scope.current_move = $scope.algo.length;
			twistyScene.setPosition($scope.algo.length);
		} else {
			$scope.current_move = 0;
			twistyScene.setPosition(0);
		}
		highlightCurrentMove(true);

		new ResizeObserver(resizeFunction).observe(twistyScene.getDomElement());

		$("#currentMove").attr("max", $scope.algo.length);

		var play = gettingCurrentMove(twistyScene.player.play);
		$scope.init = gettingCurrentMove(twistyScene.player.init);
		$scope.play = () => {
			if ($scope.animating) {
				twistyScene.player.pause();
			} else {
				var algEnded = parseFloat($scope.current_move) === $scope.algo.length;
				if (algEnded) {
					$("#viewer canvas").fadeOut(100, $scope.init).fadeIn(400, play);
				} else {
					play();
				}
			}
		};
		$scope.prev = gettingCurrentMove(twistyScene.player.prev);
		$scope.next = gettingCurrentMove(twistyScene.player.next);
		$scope.skip = gettingCurrentMove(twistyScene.player.skip);

		$("#viewer canvas").off("dblclick").dblclick(() => {
			initCameraPosition();
			twistyScene.redraw();
		});

		initCameraPosition();

		updateLocation();
	}

	function updateTwisty() {
		twistyScene.setOption("stage", $scope.stage.id);
		twistyScene.setOption("colors", colorList($scope.scheme.custom ? $scope.custom_scheme : $scope.scheme.scheme));
		twistyScene.setOption("hintStickers", $scope.hint_stickers);
		twistyScene.setOption("hintStickersDistance", $scope.hint_stickers_distance);
		twistyScene.setOption("cubies", !$scope.hollow);
		twistyScene.setOption("picture", $scope.picture);
		twistyScene.setPosition(twistyScene.getPosition(), true);
		updateLocation();
	}

	var prevStart = 0;
	var prevEnd = 0;
	function highlightCurrentMove(force) {
		// TODO: Make a whole lot more efficient.
		if ($scope.algo.length < Math.floor(parseFloat($scope.current_move))) {
			return;
		}
		var idx = Math.ceil(parseFloat($scope.current_move)) - 1;
		if (idx === -1) {
			idx = 0;
		}
		var current_move = $scope.algo[idx];
		if (!current_move) {
			$("#algorithm_shadow #middle").hide();
			return;
		}
		$("#algorithm_shadow #middle").show();
		var newStart = locationToIndex($scope.alg, current_move.location.first_line, current_move.location.first_column);
		var newEnd = locationToIndex($scope.alg, current_move.location.last_line, current_move.location.last_column);
		if (!force && newStart === prevStart && newEnd === prevEnd) {
			return;
		}
		$("#algorithm_shadow #start").text($scope.alg.slice(0, newStart));
		$("#algorithm_shadow #middle").text($scope.alg.slice(newStart, newEnd));
		$("#algorithm_shadow #end").text($scope.alg.slice(newEnd));
		prevStart = newStart;
		prevEnd = newEnd;
	}

	function getCurrentMove() {
		var idx = twistyScene.getPosition();
		var val = parseFloat($scope.current_move);
		if (idx !== val) {
			$scope.$evalAsync(() => {
				$scope.current_move = idx;
			});
			highlightCurrentMove();
		}
	}

	function gettingCurrentMove(f) {
		return function() {
			f();
			getCurrentMove();
		};
	}

	function initCameraPosition() {
		twistyScene.setCameraPosition(0.65, 3);
	}

	function resizeFunction() {
		$("#algorithm_shadow").width($("#algorithm").width());
		twistyScene.resize();
		// Force redraw. iOS Safari until iOS 7 has a bug where vh units are not recalculated.
		// Hiding and then showing immediately was the first thing I tried that forces a recalculation.
		$("#controls").find("button").hide().show();
		// Also fixes an iOS Safari reorientation bug.
		window.scrollTo(0, 0);
	}

	["setup", "alg", "puzzle", "type"].map(function(prop) {
		$scope.$watch(prop, initTwisty);
	});

	["stage", "scheme", "custom_scheme", "hint_stickers", "hint_stickers_distance", "hollow", "picture"].map(function(prop) {
		$scope.$watch(prop, updateTwisty);
	});

	["title", "anchor"].map(function(prop) {
		$scope.$watch(prop, updateLocation);
	});

	$scope.$watch("speed", function() {
		twistyScene.setSpeed($scope.speed);
		updateLocation();
	});

	$scope.$watch("current_move", function() {
		var percentage = $scope.current_move / $("#currentMove").attr("max") * 100;
		$("#currentMove").css("background", `linear-gradient(to right, #cc181e 0%, #cc181e ${percentage}%, #000 ${percentage}%, #000 100%)`);
		var val = parseFloat($scope.current_move);
		// We need to parse the string.
		// See https://github.com/angular/angular.js/issues/1189 and linked issue/discussion.
		twistyScene.setPosition(val);
		highlightCurrentMove();
	});

	$scope.$watch("alg", () => {
		var algo = alg.cube.fromString($scope.alg);
		var metrics = ["obtm", "btm", "obqtm", "etm"];
		for (var metric of metrics) {
			$scope[metric] = alg.cube.countMoves(algo, {
				metric: metric,
				dimension: $scope.puzzle.dimension,
			});
		}
	});

	$("#info-wrapper").on("scroll", function(e) {
		if ($("#info h1").outerHeight() < $(e.target).scrollTop()) {
			$("#display-wrapper h2").fadeIn();
		} else {
			$("#display-wrapper h2").fadeOut();
		}
	});

	$("#algorithm").on("input", () => {
		$("#algorithm_shadow .highlight").hide();
	}).on("scroll", e => {
		var scrollTop = $(e.target).scrollTop();
		$("#algorithm_shadow").css("margin-top", -scrollTop);
	});

	function displayToast(message, isError = false) {
		$("#toast").html(message).finish().toggleClass("error", isError).fadeIn(100).delay(3000).fadeOut(1000);
	}

	$scope.examples = [
		{
			name: "F2L",
			puzzle: $scope.puzzle_map["3x3x3"],
			stage: $scope.stage_map["F2L"],
			type: $scope.type_map["alg"],
			scheme: $scope.scheme_map["white-face-down"],
			picture: false,
			anchor: $scope.anchor_map["start"],
			imageBaseUrl: "https://cube.rider.biz/visualcube.php?fmt=png&size=64&stage=f2l&bg=t",
			list: [
				{
					name: "3x3x3",
					list: [
						{
							name: "25",
							title: "F2L-25",
							setup: "",
							alg: "U' [R', F] R U R'",
						},
						{
							name: "26",
							title: "F2L-26",
							setup: "",
							alg: "y [Rw, U] [Rw', F] y'",
						},
						{
							name: "31",
							title: "F2L-31",
							setup: "",
							alg: "U' [R', F] R U' R'",
						},
						{
							name: "32",
							title: "F2L-32",
							setup: "",
							alg: "[U, R]3",
						},
						{
							name: "33",
							title: "F2L-33",
							setup: "",
							alg: "U' R U' R' U2 R U' R'",
						},
						{
							name: "34",
							title: "F2L-34",
							setup: "",
							alg: "U' R U2 R' U R U R'",
						},
						{
							name: "37",
							title: "F2L-37",
							setup: "",
							alg: "[R', F] (R U' R' U) (R U' R' U2) (R U' R')",
						},
						{
							name: "38",
							title: "F2L-38",
							setup: "",
							alg: "R U' R' U' R U R' U2 R U' R'",
						},
						{
							name: "39",
							title: "F2L-39",
							setup: "",
							alg: "R U' R' U R U2 R' [U, R]",
						},
						{
							name: "Swap 2 Edges",
							title: "Swap 2 Edges",
							setup: "",
							alg: "R2 U2' R2' U2' R2",
						},
						{
							name: "Flip 2 Edges",
							title: "Flip 2 Edges",
							setup: "",
							alg: "F [Rw, U]3 F'",
						},
					],
				}
			],
		},
		{
			name: "OLL",
			puzzle: $scope.puzzle_map["3x3x3"],
			stage: $scope.stage_map["OLL"],
			type: $scope.type_map["alg"],
			scheme: $scope.scheme_map["white-face-down"],
			picture: false,
			anchor: $scope.anchor_map["start"],
			imageBaseUrl: "https://cube.rider.biz/visualcube.php?fmt=png&size=64&view=plan&stage=oll&bg=t",
			list: [
				{
					name: "3x3x3",
					list: [
						{
							name: "6",
							title: "OLL-6 (Fat Anti Sune)",
							setup: "",
							alg: "Rw U2 R' U' R U' Rw'",
						},
						{
							name: "7",
							title: "OLL-7 (Fat Sune)",
							setup: "",
							alg: "Rw U R' U R U2 Rw'",
						},
						{
							name: "21",
							title: "OLL-21 (Double Anti Sune)",
							setup: "",
							alg: "R U2 R' U' [R, U] R U' R'",
						},
						{
							name: "21'",
							title: "OLL-21 (Double Sune)",
							setup: "",
							alg: "R U R' [U, R] U R U2 R'",
						},
						{
							name: "22",
							title: "OLL-22",
							setup: "",
							alg: "R U2' R2' U' R2 U' R2' U2' R",
						},
						{
							name: "22'",
							title: "OLL-22 (Easy)",
							setup: "",
							alg: "Fw [R, U] Fw' F [R, U] F'",
						},
						{
							name: "23",
							title: "OLL-23",
							setup: "",
							alg: "R2 D R' U2 R D' R' U2 R'",
						},
						{
							name: "24",
							title: "OLL-24",
							setup: "",
							alg: "Rw U R' U' Rw' F R F'",
						},
						{
							name: "25",
							title: "OLL-25",
							setup: "",
							alg: "F' Rw U R' U' Rw' F R",
						},
						{
							name: "26",
							title: "OLL-26 (Anti Sune)",
							setup: "",
							alg: "R U2' R' U' R U' R'",
						},
						{
							name: "27",
							title: "OLL-27 (Sune)",
							setup: "",
							alg: "R U R' U R U2' R'",
						},
					],
				}
			],
		},
		{
			name: "PLL",
			puzzle: $scope.puzzle_map["3x3x3"],
			stage: $scope.stage_map["PLL"],
			type: $scope.type_map["alg"],
			scheme: $scope.scheme_map["white-face-down"],
			picture: false,
			anchor: $scope.anchor_map["start"],
			imageBaseUrl: "https://cube.rider.biz/visualcube.php?fmt=png&size=64&view=plan&stage=pll&bg=t&ac=black",
			list: [
				{
					name: "3x3x3",
					list: [
						{
							name: "Aa",
							title: "Aa-Perm",
							setup: "",
							alg: "R' D' R U2 R' D R U' R' D' R U' R' D R",
							arw: "U2U8-s8,U8U0-s8,U0U2-s8",
						},
						{
							name: "Ab",
							title: "Ab-Perm",
							setup: "",
							alg: "R' D' R U R' D R U R' D' R U2 R' D R",
							arw: "U8U2-s8,U0U8-s8,U2U0-s8",
						},
						{
							name: "E",
							title: "E-Perm",
							setup: "",
							alg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
							arw: "U0U6,U6U0,U2U8,U8U2",
						},
						{
							name: "F",
							title: "F-Perm",
							setup: "",
							alg: "R' U' F' [R, U] R' F R2 U' R' U' R U R' U R",
							arw: "U1U7,U7U1,U2U8,U8U2",
						},
						{
							name: "Ga",
							title: "Ga-Perm",
							setup: "",
							alg: "R2 U R' U R' U' R U' R2 U'+D R' U R D'",
							arw: "U0U2-s8,U2U6-s8,U6U0-s8,U3U5-s8,U5U1-s6,U1U3-s6",
						},
						{
							name: "Gb",
							title: "Gb-Perm",
							setup: "",
							alg: "R' U' R U+D' R2 U R' U R U' R U' R2' D",
							arw: "U0U6-s8,U6U8-s8,U8U0-s8,U1U7-s8,U7U3-s6,U3U1-s6",
						},
						{
							name: "Gc",
							title: "Gc-Perm",
							setup: "",
							alg: "R2' U' R U' R U R' U R2 U+D' R U' R' D",
							arw: "U0U6-s8,U6U8-s8,U8U0-s8,U3U5-s8,U5U7-s6,U7U3-s6",
						},
						{
							name: "Gd",
							title: "Gd-Perm",
							setup: "",
							alg: "R U R' U'+D R2 U' R U' R' U R' U R2 D'",
							arw: "U6U0-s8,U0U2-s8,U2U6-s8,U7U1-s8,U1U3-s6,U3U7-s6",
						},
						{
							name: "H",
							title: "H-Perm",
							setup: "",
							alg: "M2' U M2' U2 M2' U M2'",
							arw: "U1U7,U7U1,U3U5,U5U3",
						},
						{
							name: "Ja",
							title: "Ja-Perm",
							setup: "",
							alg: "L U' R' U L' U2 R U' R' U2 R",
							arw: "U2U8-s8,U8U2-s8,U1U5-s6,U5U1-s6",
						},
						{
							name: "Jb",
							title: "Jb-Perm",
							setup: "",
							alg: "R U R' F' [R, U] R' F R2 U' R'",
							arw: "U2U8-s8,U8U2-s8,U5U7-s6,U7U5-s6",
						},
						{
							name: "Na",
							title: "Na-Perm",
							setup: "",
							alg: "(Rw' D Rw U2)5",
							arw: "U2U6,U6U2,U3U5,U5U3",
						},
						{
							name: "Nb",
							title: "Nb-Perm",
							setup: "",
							alg: "(Rw D Rw' U2)5",
							arw: "U0U8,U8U0,U3U5,U5U3",
						},
						{
							name: "Ra",
							title: "Ra-Perm",
							setup: "",
							alg: "R U R' F' R U2 R' U2 R' F R U R U2 R' U'",
							arw: "U1U3,U3U1,U2U8,U8U2",
						},
						{
							name: "Rb",
							title: "Rb-Perm",
							setup: "",
							alg: "R2' F R [U, R] F' R U2' R' U2 R U",
							arw: "U2U8,U8U2,U3U7,U7U3",
						},
						{
							name: "T",
							title: "T-Perm",
							setup: "",
							alg: "[R, U] R' F R2 U' R' U' R U R' F'",
							arw: "U2U8-s8,U8U2-s8,U3U5-s8,U5U3-s8",
						},
						{
							name: "Ua",
							title: "Ua-Perm",
							setup: "",
							alg: "R2 U' S' U2' S U' R2",
							arw: "U1U7-s7,U7U5-s7,U5U1-s7",
						},
						{
							name: "Ub",
							title: "Ub-Perm",
							setup: "",
							alg: "R2 U' S R2' S' R2 U R2'",
							arw: "U7U1-s7,U5U7-s7,U1U5-s7",
						},
						{
							name: "V",
							title: "V-Perm",
							setup: "",
							alg: "R' [U, R] Fw' U' R U2 R' U' R U' R' Fw R",
							arw: "U0U8,U8U0,U1U5,U5U1",
						},
						{
							name: "Y",
							title: "Y-Perm",
							setup: "",
							alg: "F R U' R' U' R U R' F' [R, U] [R', F]",
							arw: "U0U8,U8U0,U1U3,U3U1",
						},
						{
							name: "Z",
							title: "Z-Perm",
							setup: "",
							alg: "M2' U M2' U M' U2 M2' U2 M' U2",
							arw: "U1U3,U3U1,U5U7,U7U5",
						},
					],
				}
			],
		},
		{
			name: "Pattern",
			stage: $scope.stage_map["full"],
			type: $scope.type_map["moves"],
			scheme: $scope.scheme_map["boy"],
			picture: false,
			anchor: $scope.anchor_map["end"],
			imageBaseUrl: "https://cube.rider.biz/visualcube.php?fmt=png&size=64&bg=t&sch=wrgyob",
			list: [
				{
					name: "2x2x2",
					puzzle: $scope.puzzle_map["2x2x2"],
					list: [
						{
							name: "Checkerboard",
							title: "Checkerboard",
							setup: "",
							alg: "R2 F2 R2 U2",
						},
						{
							name: "Cube in a Cube",
							title: "Cube in a Cube",
							setup: "",
							alg: "R F U' R2 U F' R U F2 R2",
						},
					]
				},
				{
					name: "3x3x3",
					puzzle: $scope.puzzle_map["3x3x3"],
					list: [
						{
							name: "Checkerboard",
							title: "Checkerboard",
							setup: "",
							alg: "M2 E2 S2",
						},
						{
							name: "Advanced Checkerboard",
							title: "Advanced Checkerboard",
							setup: "",
							alg: "F B2 R' D2 B R U D' R L' D' F' R2 D F2 B'",
						},
						{
							name: "Dot",
							title: "Dot",
							setup: "",
							alg: "[E, S]",
						},
						{
							name: "T Point Logo",
							title: "T Point Logo",
							setup: "",
							alg: "x2 Dw L Dw' L' Dw' R' Dw R x'",
						},
						{
							name: "T Point Logo (4 T)",
							title: "T Point Logo (4 T)",
							setup: "",
							alg: "x2 y M2' U2 F U2 x2 U2 F' U2 F R2 L' D F' R F B' D' F L' U' x'",
						},
						{
							name: "6 T",
							title: "6 T",
							setup: "",
							alg: "F2 R2 U2 F' B D2 L2 F B",
						},
						{
							name: "6 H",
							title: "6 H",
							setup: "",
							alg: "M2 U2 M2 y M2 U2 M2 x' M2 U2 M2 U2",
						},
						{
							name: "6 U",
							title: "6 U",
							setup: "",
							alg: "U' B2 U L2 D L2 R2 D' B' R D' L R' B2 U2 F' L' U'",
						},
						{
							name: "12 L",
							title: "12 L",
							setup: "",
							alg: "[Rw R, Bw B]",
						},
						{
							name: "I love U",
							title: "I love U",
							setup: "",
							alg: "x2 y U' B R' B2 R D' B U' R2 B2 R U2 R D2 L2 F2 L2 D' x y'",
						},
						{
							name: "Plus Minus",
							title: "Plus Minus",
							setup: "",
							alg: "U2 M2 D2 M2",
						},
						{
							name: "Cross",
							title: "Cross",
							setup: "",
							alg: "R2 L' D F2 R' D' R' L U' D R D B2 R' U D2",
						},
						{
							name: "Cube in a Cube",
							title: "Cube in a Cube",
							setup: "",
							alg: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
						},
						{
							name: "Cube in a Cube in a Cube",
							title: "Cube in a Cube in a Cube",
							setup: "",
							alg: "U' L' U' F' R2 B' R F U B2 U B' L U' F U R F'",
						},
						{
							name: "Small Cube in a Cube",
							title: "Small Cube in a Cube",
							setup: "",
							alg: "B2 R U2 R' U' R U' R' L' U2 L U L' U L B2",
						},
						{
							name: "Twisted Peaks",
							title: "Twisted Peaks",
							setup: "",
							alg: "F B' U F U F U L B L2 B' U F' L U L' B",
						},
						{
							name: "Exchanged Peaks",
							title: "Exchanged Peaks",
							setup: "",
							alg: "F U2 L F L' B L U B' R' L' U R' D' F' B R2",
						},
						{
							name: "Spiral",
							title: "Spiral",
							setup: "",
							alg: "L' B' D U R U' R' D2 R2 D L D' L' R' F U",
						},
						{
							name: "Slash",
							title: "Slash",
							setup: "",
							alg: "(R L F B)3",
						},
						{
							name: "Wire",
							title: "Wire",
							setup: "",
							alg: "(R L F B)3 (R2 B2 L2)2",
						},
						{
							name: "Python",
							title: "Python",
							setup: "",
							alg: "F2 R' B' U R' L F' L F' B D' R B L2",
						},
						{
							name: "Anaconda",
							title: "Anaconda",
							setup: "",
							alg: "L U B' U' R L' B R' F B' D R D' F'",
						},
						{
							name: "Vertical Stripe",
							title: "Vertical Stripe",
							setup: "",
							alg: "F U F R L2 B D' R D2 L D' B R2 L F U F",
						},
						{
							name: "Cage",
							title: "Cage",
							setup: "",
							alg: "L U F2 R L' U2 B' U D B2 L F B' R' L F' R",
						},
						{
							name: "Gift Box",
							title: "Gift Box",
							setup: "",
							alg: "U B2 R2 B2 L2 F2 R2 D' F2 L2 B F' L F2 D U' R2 F' L' R'",
						},
						{
							name: "Fake Cube",
							title: "Fake Cube",
							setup: "",
							alg: "U' D L2 U B2 D2 B2 D2 L F' U D' R U' F2 L F' B'",
						},
						{
							name: "Fake Cube 2",
							title: "Fake Cube 2",
							setup: "",
							alg: "R L F U2 D2 F' U' x' U' R L' U L D2 U2 R2 L F' U R' y'",
						},
						{
							name: "Superflip",
							title: "Superflip",
							setup: "",
							alg: "((M' U)4 y x')3 y",
						},
						{
							name: "Half Superflip",
							title: "Half Superflip",
							setup: "",
							alg: "((M' U)4 y x)3 y",
						},
						{
							name: "Perfect Scramble",
							title: "Perfect Scramble",
							setup: "",
							alg: "D2 F2 R2 D2 L2 U F2 U' F' U F2 U' R2 B' F R' D2 F' D' L",
						},
					]
				},
				{
					name: "4x4x4",
					puzzle: $scope.puzzle_map["4x4x4"],
					list: [
						{
							name: "Checkerboard",
							title: "Checkerboard",
							setup: "",
							alg: "R2 3R2 F2 3F2 R2 3R2 U2 3U2",
						},
						{
							name: "Line",
							title: "Line",
							setup: "",
							alg: "(R2 Rw2 3Rw2 x y)4",
						},
						{
							name: "Stripe",
							title: "Stripe",
							setup: "",
							alg: "F R2 2-3Uw R2 B 2-3Dw R D2 B 2-3Rw 2-3Uw F' R2 U' B2 Uw2 Rw2 U2 R2 Fw2 Rw2 2U2",
						},
						{
							name: "Triangle",
							title: "Triangle",
							setup: "// Exchanged Peaks\nF U2 L F L' B L U B' R' L' U R' D' F' B R2",
							alg: "Rw Fw Uw' Rw2 Uw Fw' Rw Uw Fw2 Rw2",
						},
					]
				},
				{
					name: "5x5x5",
					puzzle: $scope.puzzle_map["5x5x5"],
					list: [
						{
							name: "Checkerboard",
							title: "Checkerboard",
							setup: "",
							alg: "(M2 E2 S2) (M2 E2 S2)w",
						},
						{
							name: "Dot in a Dot",
							title: "Dot in a Dot",
							setup: "",
							alg: "[E, S] [E, S]w",
						},
						{
							name: "6 X",
							title: "6 X",
							setup: "",
							alg: "(((M2' 2U2)2 z)2 x y)3 Mw2 Sw2 Ew2",
						},
						{
							name: "Smiley Face",
							title: "Smiley Face",
							setup: "",
							alg: "2L 4L 2U 4R 2R 4D 2-4Lw 4U 2-4Rw 2D",
						},
						{
							name: "I love U",
							title: "I love U",
							setup: "z",
							alg: "2-4Bw 2-4Rw2 2F2 2-4Rw2 2-4Dw2 2-3Fw2 2-4Dw S2 2-4Dw 2-3Fw L 4F 2R2 2B L' 4F Rw2 S' 2L2 S R2 S' 2L2 S",
						},
						{
							name: "Spiral",
							title: "Spiral",
							setup: "",
							alg: "U R2 F R2 B' D' R D2 B D F2 R' D2 R2 D' F 2-3Lw E' M' 2U 2L' 2-3Uw' B F U2 L2",
						},
						{
							name: "Exchanged Rings",
							title: "Exchanged Rings",
							setup: "",
							alg: "(B' U' B' L' D B U D2 B U L D' L' U' L2 D)\n(B' U' B' L' D B U D2 B U L D' L' U' L2 D)w",
						},
						{
							name: "Superflip",
							title: "Superflip",
							setup: "",
							alg: "((m' U)4 y x')3 ((M' Uw)4 y x')3 y",
						},
						{
							name: "Half Superflip",
							title: "Half Superflip",
							setup: "",
							alg: "((m' U)4 y x)3 ((M' Uw)4 y x)3 y",
						},
					]
				},
			]
		},
		{
			name: "Other",
			puzzle: $scope.puzzle_map["3x3x3"],
			stage: $scope.stage_map["full"],
			type: $scope.type_map["moves"],
			picture: false,
			anchor: $scope.anchor_map["start"],
			list: [
				{
					name: "",
					list: [
						{
							name: "Sexy Move",
							title: "Sexy Move",
							setup: "",
							alg: "[R, U]",
						},
						{
							name: "Anti Sexy Move",
							title: "Anti Sexy Move",
							setup: "",
							alg: "[U, R]",
						},
						{
							name: "Sledgehammer",
							title: "Sledgehammer",
							setup: "",
							alg: "[R', F]",
						},
						{
							name: "Hedgeslammer",
							title: "Hedgeslammer",
							setup: "",
							alg: "[F, R']",
						},
						{
							name: "Sune",
							title: "Sune",
							setup: "",
							alg: "R U R' U R U2' R'",
						},
						{
							name: "Anti Sune",
							title: "Anti Sune",
							setup: "",
							alg: "R U2' R' U' R U' R'",
						},
						{
							name: "Maneuver",
							title: "Maneuver",
							setup: "",
							alg: "(M' U)3 M' U2 (M' U)3 M'",
							type: $scope.type_map["alg"],
						},
						{
							name: "Rotate 1 Center 180°",
							title: "Rotate 1 Center 180°",
							setup: "",
							alg: "(R U R' U)5",
							stage: $scope.stage_map["custom"],
							stageMap: [
								[8, 8, 8, 8, 1, 8, 8, 8, 8],
								[9, 9, 9, 9, 9, 9, 9, 9, 9],
								[10, 10, 10, 10, 10, 10, 10, 10, 10],
								[11, 11, 11, 11, 11, 11, 11, 11, 11],
								[12, 12, 12, 12, 12, 12, 12, 12, 12],
								[13, 13, 13, 13, 13, 13, 13, 13, 13],
							],
							type: $scope.type_map["alg"],
							picture: true,
						},
						{
							name: "Rotate 2 Centers 90°",
							title: "Rotate 2 Centers 90°",
							setup: "",
							alg: "(M' U' M U)5",
							stage: $scope.stage_map["custom"],
							stageMap: [
								[8, 8, 8, 8, 1, 8, 8, 8, 8],
								[9, 9, 9, 9, 9, 9, 9, 9, 9],
								[10, 10, 10, 10, 3, 10, 10, 10, 10],
								[11, 11, 11, 11, 11, 11, 11, 11, 11],
								[12, 12, 12, 12, 12, 12, 12, 12, 12],
								[13, 13, 13, 13, 13, 13, 13, 13, 13],
							],
							type: $scope.type_map["alg"],
							picture: true,
						},
						{
							name: "Solve in 126 Moves",
							title: "Solve in 126 Moves",
							setup: "",
							alg: "(R U')63",
							type: $scope.type_map["alg"],
						},
						{
							name: "Notation",
							title: "Notation Demo",
							setup: "",
							alg: "R L U D F B\t\t\t\t// Single turns, Variable spacing\nB' F' D' U' L' R'\t\t\t// Inverses\nR L2 R3 L6\t\t\t\t// Move amount\nRw r' Uw u' Fw f'\t\t// Wide turns\nM4 E4 S4 m4 e4 s4\t\t// Slice turns\n4Rw 4Rw'\t\t\t\t// Very wide turns\n2-3Lw 3-4r\t\t\t\t// Wide block turns\nx y z z' y' x'\t\t\t\t// Rotations\nU . U ... U2\t\t\t\t// Pauses\n[[R: U], D2]\t\t\t\t// Commutator/Conjugate/Nesting\n([R: U'] D2)2' [R: U2]\t\t// Grouping and Repetition",
							puzzle: $scope.puzzle_map["5x5x5"],
						},
					]
				}
			]
		},
	];
	$scope.createExampleImage = function(group, puzzle, example) {
		if (!group.imageBaseUrl) {
			return "";
		}
		var url = new URL(group.imageBaseUrl);
		if (puzzle) {
			url.searchParams.set("pzl", puzzle.name.split("x")[0]);
			if (!example) {
				url.searchParams.set("view", "plan");
				url.searchParams.set("sch", "nttttt");
				url.searchParams.set("cc", "w");
			}
		}
		if (example) {
			if (group.type.id === "moves") {
				url.searchParams.set("alg", alg.cube.toVisualCubeAlg(`${example.setup} ${example.alg}`));
			} else if (group.type.id === "alg") {
				url.searchParams.set("case", alg.cube.toVisualCubeAlg(`${example.alg} ${alg.cube.invert(example.setup)}`));
			}
			if (example.arw) {
				url.searchParams.set("arw", example.arw);
			}
		}
		return url.href;
	};
	$scope.showExamples = function(group, puzzle, example) {
		if (!puzzle && !example) {
			$scope.selected_example_group = $scope.selected_example_group === group.name ? "" : group.name;
			$scope.selected_example_puzzle = "";
		}
		if (group.list.length === 1) {
			$scope.selected_example_puzzle = group.list[0].name;
		} else if (puzzle) {
			$scope.selected_example_puzzle = $scope.selected_example_puzzle === puzzle.name && !example ? "" : puzzle.name;
		}
		if (example) {
			var keys = ["title", "setup", "alg", "puzzle", "stage", "stageMap", "type", "anchor", "scheme", "picture"];
			for (var key of keys) {
				$scope[key] = key in example ? example[key] : key in puzzle ? puzzle[key] : key in group ? group[key] : $scope[key];
			}
		}
	};

	// For debugging.
	ss = $scope;
	l = $location;
}]);
