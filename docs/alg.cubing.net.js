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

var algxControllers = angular.module("algxControllers", ["monospaced.elastic"]);

algxControllers.controller("algxController", ["$scope", "$location", "debounce", function($scope, $location, debounce) {

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
			group: "Start from Setup",
			setup: "Setup",
			alg: "Moves",
			type: "generator",
			setup_moves: "setup moves",
			alg_moves: "moves",
			reconstruction: false,
		},
		{
			id: "reconstruction",
			name: "Reconstruction",
			group: "Start from Setup",
			setup: "Scramble",
			alg: "Solve",
			type: "generator",
			setup_moves: "scramble moves",
			alg_moves: "reconstruction moves",
			reconstruction: true,
		},
		{
			id: "alg",
			name: "Algorithm",
			group: "End Solved / End with Setup",
			setup: "Setup",
			alg: "Algorithm",
			type: "solve",
			setup_moves: "setup moves for end position",
			alg_moves: "algorithm moves",
			reconstruction: false,
		},
		{
			id: "reconstruction-end-with-setup",
			name: "Reconstruction (no scramble)",
			group: "End Solved / End with Setup",
			setup: "Setup",
			alg: "Solve",
			type: "solve",
			setup_moves: "setup moves for end position",
			alg_moves: "reconstruction moves",
			reconstruction: true,
		},
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

	$scope.speed = 1;
	$scope.current_move = "0";

	$scope.setupStatus = "valid";
	$scope.algStatus = "valid";
	$scope.hint_stickers = true;
	$scope.hint_stickers_distance = 1;

	initParameter("view", "editor", [
		{
			id: "editor",
			next: "playback",
			fullscreen: false,
			infoPane: true,
			extraControls: true,
			highlightMoveFields: true,
		},
		{
			id: "playback",
			next: "fullscreen",
			fullscreen: false,
			infoPane: true,
			extraControls: false,
			highlightMoveFields: false,
		},
		{
			id: "fullscreen",
			next: "editor",
			fullscreen: true,
			infoPane: false,
			extraControls: false,
			highlightMoveFields: false,
		},
		{
			id: "embed",
			next: "editor",
			fullscreen: true,
			infoPane: false,
			extraControls: false,
			highlightMoveFields: false,
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

	initParameter("anchor", "start", [
		{ id: "start", name: "anchored at start" },
		{ id: "end", name: "anchored at end" },
	]);

	$scope.nextView = function() {
		$scope.view = $scope.view_map[$scope.view.next];
		$scope.updateLocation();
	};

	$scope.onwheel = function(e) {
		e.preventDefault();
		var { min, max } = e.target;
		var model = e.target.dataset.ngModel;
		var value = $scope[model] - e.target.step * Math.sign(e.originalEvent.deltaY);
		$scope[model] = Math.min(Math.max(min, value), max);
	};

	$scope.expand = function() {
		$scope.alg = alg.cube.expand($scope.alg);
	};

	$scope.simplify = function() {
		$scope.alg = alg.cube.simplify($scope.alg);
		$scope.addHistoryCheckpoint = true;
	};

	var inverseTypeMap = {
		moves: "alg",
		reconstruction: "reconstruction-end-with-setup",
		alg: "moves",
		"reconstruction-end-with-setup": "reconstruction",
	};
	$scope.invert = function() {
		// The setup stays the same. It's like magic!
		$scope.alg = alg.cube.invert($scope.alg);
		var currentPosition = twistyScene.getPosition();
		var maxPosition = twistyScene.getMaxPosition();
		$scope.current_move = maxPosition - currentPosition;
		$scope.type = $scope.type_map[inverseTypeMap[$scope.type.id]];
		$scope.addHistoryCheckpoint = true;
	};

	$scope.mirrorAcrossM = function() {
		$scope.setup = alg.cube.mirrorAcrossM($scope.setup);
		$scope.alg = alg.cube.mirrorAcrossM($scope.alg);
		$scope.addHistoryCheckpoint = true;
	};

	$scope.removeComments = function() {
		$scope.setup = alg.cube.removeComments($scope.setup);
		$scope.alg = alg.cube.removeComments($scope.alg);
		$scope.addHistoryCheckpoint = true;
	};

	$scope.mirrorAcrossS = function() {
		$scope.setup = alg.cube.mirrorAcrossS($scope.setup);
		$scope.alg = alg.cube.mirrorAcrossS($scope.alg);
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
		escaped = escaped.replace(/\+/g, "&#2b;");
		escaped = escaped.replace(/-/g, "&#45;").replace(/'/g, "-");
		return escaped;
	}

	function unescape_alg(alg) {
		if (!alg) {
			return alg;
		}
		var unescaped = alg;
		unescaped = unescaped.replace(/-/g, "'").replace(/&#45;/g, "-");
		unescaped = unescaped.replace(/\+/g, " ").replace(/&#2b;/g, "+"); // Recognize + as space. Many URL encodings will do this.
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

	function forumLinkText(url) {
		var algWithCommentsGreyed = ($scope.alg + "\n").replace(/(\/\/.*)[\n\r]/g, '[COLOR="gray"]$1[/COLOR]\n').replace(/(\/\*[^(\*\/)]*\*\/)/g, '[COLOR="gray"]$1[/COLOR]');
		var text = algWithCommentsGreyed + '\n[COLOR="gray"]// View at [URL="' + url + '"]alg.cubing.net[/URL][/COLOR]';
		if ($scope.setup !== "") {
			text = '[COLOR="gray"]/* Scramble */[/COLOR]\n' + $scope.setup + '\n\n [COLOR="gray"]/* Solve */[/COLOR]\n' + text;
		}
		return text.trim(); // The trim is redundant for angular.js, but let's keep it just in case.
	}

	$scope.updateLocation = function() {
		$location.replace();
		setWithDefault("title", $scope.title);
		setWithDefault("setup", escape_alg($scope.setup));
		setWithDefault("alg", escape_alg($scope.alg));
		setWithDefault("puzzle", $scope.puzzle.id);
		setWithDefault("stage", $scope.stage.id);
		setWithDefault("type", $scope.type.id);
		setWithDefault("scheme", $scope.scheme.id);
		setWithDefault("custom_scheme", $scope.custom_scheme);
		setWithDefault("speed", $scope.speed);
		setWithDefault("anchor", $scope.anchor.id);
		setWithDefault("view", $scope.view.id);
		setWithDefault("fbclid", null); // Remove Facebook tracking ID
		// Update sharing links
		var url = new URL(location.origin + $location.url());
		$scope.share_url = url.href;
		url.searchParams.delete("view");
		$scope.editor_url = url.href;
		url.searchParams.set("view", "embed");
		$scope.embed_url = url.href;
		$scope.embed_text = `<iframe src="${$scope.embed_url}" frameborder="0"></iframe>`;
		$scope.share_forum_short = '[URL="' + $scope.share_url + '"]' + $scope.alg + "[/URL]";
		$scope.share_forum_long = forumLinkText($scope.share_url);
	};

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
		var lines = $scope.alg.split("\n");
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

	$scope.twisty_init = function() {
		$("#viewer").empty();

		twistyScene = new twisty.scene({
			allowDragging: true,
			renderer: Renderer,
			cachedRenderer: true,
		});
		$("#viewer").append($(twistyScene.getDomElement()));

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

		try {
			var algoFull = alg.cube.fromString($scope.alg);
			$scope.algStatus = "valid";
			var algoCanonical = alg.cube.toString(algoFull);
			if (algoCanonical !== $scope.alg.replace(/(?<!^)\s*\/\//g, " //")) {
				$scope.algStatus = "uncanonical";
			}
		} catch (e) {
			$scope.algStatus = "invalid";
		}

		try {
			var init = alg.cube.fromString($scope.setup);
			$scope.setupStatus = "valid";
			var setupCanonical = alg.cube.toString(init);
			if (setupCanonical !== $scope.setup) {
				$scope.setupStatus = "uncanonical";
			}
		} catch (e) {
			$scope.setupStatus = "invalid";
		}

		var type = $scope.type.type;

		init = alg.cube.toMoves(init);
		var algo = alg.cube.toMoves(algoFull);

		twistyScene.setupAnimation(algo, {
			init: init,
			type: type,
		});

		var previousStart = 0;
		var previousEnd = 0;
		function highlightCurrentMove(force) {
			// TODO: Make a whole lot more efficient.
			if (Math.floor(parseFloat($scope.current_move)) > algo.length) {
				return;
			}
			var idx = Math.ceil(parseFloat($scope.current_move)) - 1;
			if (idx == -1) {
				idx = 0;
			}
			var current_move = algo[idx];
			if (typeof current_move === "undefined") {
				$("#algorithm_shadow").find("#middle").hide();
				return;
			}
			$("#algorithm_shadow").find("#middle").show();

			var newStart = locationToIndex($scope.alg, current_move.location.first_line, current_move.location.first_column);
			var newEnd = locationToIndex($scope.alg, current_move.location.last_line, current_move.location.last_column);

			if (newStart == previousStart && newEnd == previousEnd) {
				return;
			}

			$("#algorithm_shadow").find("#start").text($scope.alg.slice(0, newStart));
			$("#algorithm_shadow").find("#middle").text($scope.alg.slice(newStart, newEnd));

			previousStart = newStart;
			previousEnd = newEnd;
		}

		twistyScene.setCameraPosition(0.5, 3);

		var resizeFunction = function() {
			$("#algorithm_shadow").width($("#algorithm").width());
			twistyScene.resize();
			// Force redraw. iOS Safari until iOS 7 has a bug where vh units are not recalculated.
			// Hiding and then showing immediately was the first thing I tried that forces a recalculation.
			$("#controls").find("button").hide().show();
			// Also fixes an iOS Safari reorientation bug.
			window.scrollTo(0, 0);
		};
		new ResizeObserver(resizeFunction).observe(twistyScene.debug.view.container);
		// ↓ResizeObserverで検知できるので要らない
		// $(window).resize(resizeFunction);
		// ↓viewの値が変更されてから描画が完了する前に実行されるので、view変更前のサイズがcanvasへ反映されてしまう
		// $scope.$watch("view", resizeFunction);

		$("#moveIndex").val(0); //TODO: Move into twisty.js

		function getCurrentMove() {
			var idx = twistyScene.getPosition();
			var val = parseFloat($scope.current_move);
			if (idx != val) {
				$scope.$apply("current_move = " + idx);
				// TODO: Move listener to detect index change.
				highlightCurrentMove();
			}
		}

		function gettingCurrentMove(f) {
			return function() {
				f();
				getCurrentMove();
			};
		}

		// TODO: With a single twistyScene this own't be necessary
		$("#reset").unbind("click");
		$("#back").unbind("click");
		$("#play").unbind("click");
		$("#pause").unbind("click");
		$("#forward").unbind("click");
		$("#skip").unbind("click");
		$("#viewer canvas").unbind("dblclick");
		$(document).unbind("selectionchange");

		var start = gettingCurrentMove(twistyScene.play.start);
		var reset = gettingCurrentMove(twistyScene.play.reset);

		$("#reset").click(reset);
		$("#back").click(gettingCurrentMove(twistyScene.play.back));
		$("#play").click(function() {
			if ($scope.animating) {
				twistyScene.play.pause();
			} else {
				var algEnded = parseFloat($scope.current_move) === algo.length;
				if (algEnded) {
					$(document.getElementById("viewer").children[0].children[0]).fadeOut(100, reset).fadeIn(400, start);
				} else {
					start();
				}
			}
		});
		$("#forward").click(gettingCurrentMove(twistyScene.play.forward));
		$("#skip").click(gettingCurrentMove(twistyScene.play.skip));

		$("#viewer canvas").dblclick(() => {
			twistyScene.setCameraPosition(0.5, 3);
			twistyScene.redraw();
		});

		$("#currentMove").attr("max", algo.length);

		if ($scope.anchor.id === "end") {
			$scope.current_move = algo.length;
			twistyScene.setPosition(algo.length);
		} else {
			$scope.current_move = 0;
			twistyScene.setPosition(0);
		}

		twistyScene.addListener("animating", function(animating) {
			$scope.$apply("animating = " + animating);
		});
		twistyScene.addListener("position", getCurrentMove);
		$scope.$watch("current_move", function() {
			$("#currentMove").css({
				background:
					"linear-gradient(to right, #cc181e 0%, #cc181e " +
					($scope.current_move / $("#currentMove").attr("max")) * 100 +
					"%, #000 " +
					($scope.current_move / $("#currentMove").attr("max")) * 100 +
					"%, #000 100%)",
			});
			var idx = twistyScene.getPosition();
			var val = parseFloat($scope.current_move);
			// We need to parse the string.
			// See https://github.com/angular/angular.js/issues/1189 and linked issue/discussion.
			twistyScene.setPosition(val);
			highlightCurrentMove();
		});
		$scope.$watch("speed", function() {
			twistyScene.setSpeed($scope.speed);
			$scope.updateLocation();
		}); // initialize the watch

		$scope.updateLocation();
	};

	[
		"title",
		"setup",
		"alg",
		"puzzle",
		"stage",
		"type",
		"scheme",
		"custom_scheme",
		"hint_stickers",
		"hint_stickers_distance",
		"hollow",
		"picture",
		"anchor"
	].map(function(prop) {
		$scope.$watch(prop, $scope.twisty_init);
	});

	var metrics = ["obtm", "btm", "obqtm", "etm"];

	function updateMetrics() {
		var algo = alg.cube.fromString($scope.alg);
		for (var i in metrics) {
			var metric = metrics[i];
			$scope[metric] = alg.cube.countMoves(algo, {
				metric: metric,
				dimension: $scope.puzzle.dimension,
			});
		}
	}
	$scope.$watch("alg", updateMetrics);

	$scope.setupDelayed = false;
	$scope.setupDebounce = function(event) {
		$scope.setupDelayed = event == "delayed";
	};

	$scope.algDelayed = false;
	$scope.algDebounce = function(event) {
		$scope.algDelayed = event == "delayed";
	};

	$("#algorithm").on("input", function() {
		$("#algorithm_shadow .highlight").hide();
	});

	$("#copyEmbed").on("click", function() {
		copyToClipboard($scope.embed_text);
	});
	$("#copyShort").on("click", function() {
		copyToClipboard($scope.share_forum_short);
	});
	$("#copyLong").on("click", function() {
		copyToClipboard($scope.share_forum_long);
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
							title: "OLL-7 (Fat Anti Sune)",
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
							alg: "R2 U R' U R' U' R U' R2 U' D R' U R D'",
							arw: "U0U2-s8,U2U6-s8,U6U0-s8,U3U5-s8,U5U1-s6,U1U3-s6",
						},
						{
							name: "Gb",
							title: "Gb-Perm",
							setup: "",
							alg: "R' U' R U D' R2 U R' U R U' R U' R2' D",
							arw: "U0U6-s8,U6U8-s8,U8U0-s8,U1U7-s8,U7U3-s6,U3U1-s6",
						},
						{
							name: "Gc",
							title: "Gc-Perm",
							setup: "",
							alg: "R2' U' R U' R U R' U R2 U D' R U' R' D",
							arw: "U0U6-s8,U6U8-s8,U8U0-s8,U3U5-s8,U5U7-s6,U7U3-s6",
						},
						{
							name: "Gd",
							title: "Gd-Perm",
							setup: "",
							alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
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
							alg: "((M' U)4 y x')3",
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
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Line",
							title: "Line",
							setup: "",
							alg: "(R2 Rw2 3Rw2 x y)4",
							imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAEtJJREFUeF7tm3mczuX6x9/2LCUhWzh0bJUsM22EI1mSLSOSJTN1iJBlZJ3BzMigoSHzU0PFOT9jRnYayZItZDDmp2JUUoaypONEtuH3fL739zHf55lnZuz+OOd6veZVz/N87/t7X5/7Wj7Xdd9y8R8uuf7D9ee/APzXAu4sAk/br990p5ZxJ1ygKNCLcrxJAGUtxRdwmDTeBT4A/nU7wbidAPwVGIQ/QbxIAdp6qbkEmM85kogFooHvbgcQtwOAZ4EB1KYlweTCPwe1koB3uEwyK8CyijW3EohbCUAQlBwC3apDDyANmAmNF8DLLrUaeKm1EZgLFMT8XsqyCLnHt5zgHeDDWwHEzQagNNAH/PpCt2JG8dxe694LsvLasUZRiRR/yFZcjuKUS67fEoCF/EYK74H1d+xmgXGzAKgJBONPZ5I657MwoFY2azxnQGAK5LsAg383YOTPZsg3wGzLkC6QZEEWBfzfjQJxIwBobFsKM4j2NKAjUAVYC8wBtgYYY+AxxxoPGzfgc+AllzZ/t3+LhSKx0OWHDPN3j0q25/sN6A48A+y/YhUbOG0BsQy4fD1gXA8ARYBXqcZgXqC8pXghH69WZteObWwN9LYdeo+ttJT3JfOMZXTaDq3s8TKWVwA3Y3AOO2MDsZif2GvFiY9clvjHtQBxLQBUBN6EJr14bE0hXgX+lsOrvrT9Wwv9UslAFqH/ZiergRggHZ5dZyyiXg5DvgBmAQU4zSZm2Nnj0NUAcTUAKF4PgMB28EpuqOvSXG+MhqfXyBbgKa9XKYHJS8sBnYE6wHbblD9vaAPR0mvQp7bi4kkCqj7wlbEIv3gDxPNeQ7bYiutr9zoUFeZziQQW2kBszg6IrACQmU+Gyi2ga3kTzUv4mGelAaLJZrMABSpF7CftiP4XH0N226b9qR6SohLtuNDyjhnu8eJEsVBpJnS5YDKGdvyUrbgvS1TM0FoW8SMH0ULlh5kkKwB2QXBteAu4KwdL+tWO6LOg0Qno68rdygk5yWKXlYcAFxT6p9mmktOgHa71RAJJ0PuEsYqSOYxRDPkfYAbr7BDqMcAnAOWL8+/na1Fkxtr7MSD09PGWb23FN9iBTRFddh8NbfbBa66PVX0ME7lRlhBIiuoSfV5Yw7YARTxv+dpmx7tMGLI0VxqNhc6p5qMykLf8r1G+70uwaBH/SkvjXu9HfAKQLy8p52dRM+kARCyFJTsftYFo4wpiCu96+S+24h18vFmpLho6HjSuofApbKToE7biD3oN+97+PV4/yBUE6A+2G2vzpLhQ9ZZPzHqe22KAUNZdZRQPeAhGjoTatSFPHpIuX/bIydZEWbnArKPvEVTybvOyZckwbgls+0G5SCBqIUrIOcl01wNjoNw5aGyns/I5jPnZjhH/rOByW7nXGBfxeyOnF9kEZCY8tpx6+WDUKGjRwgz75RcoW9YiIG7icWW+rAAIS4kgpKbXYksHQu5LcMQK7XIN7210z6u8p8Cmvxdd1lDMWETgaWMRvuKphh63g5vogDBWYTxHD8si9OeLcGigzGciFSrEcfEiHPJKgMnJULcu4UDoVbmAIF81hPeaPuL5eIV+kHRKxZr5u8xAYIjrk5KG5HdbaYHdxV50Gfu3kwaEvNHwWrpR0D1M1EVDRGMUAgSSsqFERiDXmVMULiiQCwi3K2vgJPLlm2KZuna9cmX48UfPda9cCS1bWgMVDj0kKwsImNOTT7opFTvkoeHw+WGzD7JUcdA5FLdBUH0i6hdoL1Lf+5IjBogiMUZRiVKamLM+K+76EuGn6ecUhDPSReF/Eq+/fsJSvlw5OHUKnn4aUlI8J/j4YwgKst4gbnBVANSf0IlNb3lxlQbjICYVHnBMofJ9ksXutaDxLjIgbpyTqMRTz2O0eXCwbfJXQ8vE+iOhTX0ICQE/v4x3HThgKco6xUyHREbCiBEWnxR1uioAHqxUku/C20MXBw1tFw0Dd4JyglPkCM17w4QVsPsnEUfFh0ZZoCArlPIKqIrskmgolWAswJ0avUdvNQbsdxH694etW2G6YqxzM5JAyn6ixGDL7NkQGgo//0xll4MduFoA8nWtx/m0k1AoP4QFQN2K8OosaLUhcwkgPlOzB/RqDNM+N6nz6CkFP8WH6vY75eBq8IgASHFnlahHxJWjocJSA0Qne5hI4Awou9P4+OuvQ0wM/PSTUdYpn30GCxfC++/D9u1G8UuXmlKiRAni4uLEuC5cLQA0r8nplcEUiv0CQhZCdzseVP8UXvCaZaKLyxV/CYKfMz+cOQ8RS2D8cn0SNVRXSyllQBZlnXNC8Yx3ocoqqxzINdsoLj/Pb/cLpHh6uvnOKXPnwp49cPYszJ9fjrCwMIKCgmjatOnp1atXu0Oux5gsva5ORX7cGWZRGP44a0CYuR5Gn82IXe6ZlOzOt4OxXsh8fxRaT4FvDys+KJcP8t6ALD5PdgW56dSseYylS6GitYoMkeKlS0O/fp7fT5sGw4ZBnz6DCQ8Pp2BB9degVq1aP6SkpPjM2VkCULooW45MtcqaK/LxRoiZadp2I4DH7V+UpQ42h8nuFpdjTJ0QCPvJZIz1lhvKLZQifYm46ySaN//B2vWBA+ErFYReohhQty70UI3momQbNhhzT0+vT69evejWrZvHiPvvv3/TsWPHvLuQ1jPZxd15Z2fRqUDejLmW7oJVsk473osYCwg1gbY0gtigzIt9MgxGfm9C3gI7de616mcFyib2ALnIRGrV2mKZdYcOsHo1jB0LG9Us9ZLAQGjVCho2NIqvWPGAZe4pKSkyd1q2zEhff/75J4UKFYqzC4hMc2UHwLs/TubNio50vnk/TI+QccJpVwvvbSDeBuGrJyDeXd06XtPobei/z5M4y2VkESdpZz1ZqtRiS/G+Che2rFgBU6YYILxFADVqZJTv2XOIpfxdd91l7Xzfvn154gkVHEYOHDhA5cqVp2Tlf9kBMDQ5nMhaouS27D0CA4aB4HTLThuI0w/CuA7QRLW6Q5pNgsA9YNPyK7/829UBn+AC4u6hRhHbXa/8rmg+a5Z213M+sTq5R5kyz1uK15Uv2KKdj46OpkqVjNJwx44d+Pv7y+9EXjNJdgB0f7Q8swP8IdRsFMf+Da36YnUXnKLCePTD8HUatKwF4g9lbLaqIBiQrO5pZlH6LDIUxos/eUlcnCK5SWsSpT0BtW5deUvB6dOnU726O8WaZ7TziYmJ3Hfffdbn0NBQli0LJzkZBYV/XisALWKDSNSur/sGIjuZ3a3WwzSqnKLao0dF2DASQhfCjHUGhEEtoMN70Gy7KYm8JTsARF+V1wXExIlG+QED3rJ2XYquWLGCcuK/DqlatSqpqakWCMOGDaNFixQqVYLevWnqyr8+nCn7IFgrrD3JIW1h4z4YmgB+f4HEL2G7ij2HqARqXgpSRQhEaQ5A6AI4/gdULQ1PboGu1wiAyMyWLbB7N5Qv38pSvE4dNRdV8FQmOTmZe+65x2NWWUaTJk34+uv3LZJUr54JpGPHWuxLLelMkp0LlOrThF+mO6ipqO6wBFPkOhvb6cAjReGXqZ7zz95kLOLxEyZbeLcIs7KAffvMjiclVbLyeZcunmmzZMmSHDvmeTj04Ycf0rPnq5big1Vb2NK7t8UMVVOfuFYAcrX3J31BP89U+bcIKLBfHWhTyiizS6rmh2NqFHlJv3/A5dUGNIHgWJvVEvSOAWPGQFgYvPXWW5w/f54pSgVe4gRg7969DB06FFjKyZOwfr3nw+3bk754MY5k7vl7tvVXo2oc/2KEVe9ekbbRMHonqBMYYbN6ZS+Fo7SPIK/XUWDwPCiaaJrcinWKFwJC5x5OABISzK5XrdrK2vXPPvuMkydPEulF+M+dO2e5QFpaGhMmTCAqapi16/Xrw/DhsEBkwyENG/Lrpk3ozNKnZAtA9TLs+TaSh50jg9SZ3mhOB2SEY+0SS32LpBgoVtjzPSM/gdzLMkiwmj3iD6piVVbLAvbuFYd/0PLzl182dFL/n56ezlg5sUOOHz9OgwYNKFasGA8/vMXKIMWLm3jx0Ufwga5YOKR6dXanplL7ugBwsd1POz7Oc6K45dTVEpGdB48nep7vKFVrNwNaQGRHyJsn43Vhi+GPRTDcsQKVZAJBRbFk5MiR1q7nypWxH/qucOHCjBghezFy9uxZy9xXrpzKO+8YNuiW5cth8+aMlKq0qViwYAFLrTPMLCSnFsSshDcIGuNSQpVeYAOIXA7F5mdue4gq+LcA0eXIFyHArnYVOI8kXGl9eCwjTBYwapSlvLcEBwdTpkwZBtsRLT4+3lK+U6eD7NplUqRTVPcrLgYHw8yZ8O67FQkPn0xAQIBsotf1AjBu3wRGlCoKg+aaMveZGnDio8wzKs2NHWOeUab4ayljDQnbIHUujPOxguwA6NevH9WqVaNNmzZWTv/55zjL13Pnxtp9Z9NDUytW3nsvJCZCsWJ/Z/LkyRw6dIgaNWrIh9Ra9ik5WUC/9SOY2rCaGRu/zTQ7njvkadL6Te3KnkPhGZsKa+ffXmZASJrtm4dmB0DPnj2pWbMmI0cOIzT0zJXUtmqVIUfyd6eIHi9fXoGQkCg6qFjQCeYXX9C4cWMtTQem1wVAQPwbfNLRXffqWCQVxo4zDV3tqrvnK7Ld+k1om0HNEYuUNfy+07iAdyTKCoBt27ZZ5l68+HoryDmovRXlVf5G2wFEvj5okOJDS0aNGsVTT2Wc1M6bN4/OnTvL/xUHrguA+tFd2NS/WcbYbw9D6HAsbqliRv1A0RTZmX8v6Op1lC2rWRIDiXbfMyOkgS8AFPRmzhxPs2bQrh0EqJfrEFHk776DiAjj65MmlSUsLIrFixdbmUN02C3iEIMGDVJp6KOrYJ7KyQWKD2vF8fEOIn/0FHTuB+o7ilqpK3XRvuJTpjv0cZf49ioW74B/TDUcQCDpcFjWoFsCTgCWLVtm+Xq9et9Yvq7eX/funpFeU6rrc+YM7NgBhQu/Yvm6ih/1AbTjxZUTbZEVTZw4UV/orPi6LECDXnvjWWKndQVlqfRL4B9omiBu0Sm00uDgjjDU6ww/MQVioszZhkS3ABSR3IdsygJHjhxh69ZZlrm7U1vbtqY/0FSm5pBx49QNLk1UVNQVzqCf/fz8UOkruXjxIgqiM2bM0CHFx1kpfzUW4B5b47FKLJn0ElUaVYdHe8N6r4JIIKyoAwXzmdaYmzesVSU5wTRO3KLLPLIGd+kgBifFnKJzPVEAdX0kOu1RRrx0qS0dO3b0UF6/q1DatWsXa9asYciQIam7du1SZlalnq3k5ALOwfnEX8a2J3jhJlh31HNe7eyO5qDzxLGLTA8hqCFsToWR43RPIbNI5yKjYbR9PuJ8onFj0/ZWcyc2VgCVIDw8iqSkJMvcW7fW3aMMEQBt2rS5HBYWpsaHPDNTC9wXEtcCgHu89mTuZiinE323qHW3tBHMDAKdJ4g3yGUGPwf9xxjT95bsAFApq/6/LKNAgZctXy9VqhSBgYH06NGDRuqJ2bJ7925q166tm5ji0SpTrlquBwBNfk8e+DgSXnAf7+nqwvuPQ7zjJHvWBghfAsWP++5GZAeAjrxOnLiPsLDJvPJKxqWJgIAAizq7W2HTpk2jf//+6hvJ33Vp5prkegFwv6RrB/jgbSiopkjoo5DorHd1cH0Uqg0x1Z+qR2cPxxcAOt+Try9ZkstqaFb0OhRo1qwZMTExVp0wcODAM/Hx8e6rKdekuPvhGwVA85QrD4vDwT+2Cmwa5bmOQ79B04HmZoJ4g352d4e8AVAlN3r03URETLai/Lp16yitExCHiOgMGDBANcL2tLQ0HcXI9K9bbgYAerm6AENrlSdsRxh58zh6AmqkPtnXutbEQRsARVMpr9vPCoI64NCu58oVYPl6hQoVrJpfaU1lr1vUIPHz87uwZ88eZV0dSuuY+YbkZgHgXkSdOhVZFNWZio3tCHnqT3jodc9LvVJc7UO1agXAjBlFLDYn/u8WNTz379+vQw3rq9WrV2vXD6akpCj83/Ad4ZvpAt47oHt1UWNeoM/odnDuAjzwGqR6PaVLHMpVBdu3t3bd29d1ovvrr7+SJ08eQkJCiIiI0C1xlRxnb2jLvQbfbAtwTt+iWU3ipnTm3qdGgNetFes5xYTCrs6PFPQWmf769esV6E6uXbtWZPyW/MOJWwmAdCqRPy8f5rpIa12M8ZbsAMifPz8XLlzQdUrdJvLZ0b0ZlnCrAXCvsecLMHU8FHBeAfIFwOHDhxXlz86fP1+9Vt0euqVyuwCQEpXLwoIIqG2ftGVygbi4OAW6HUeOHNFFI92SvOVyOwFwKxP+GozS7isTKAYMHz7cXb2pUPRsA99iCO4EAFLpsUdg7fNQRAAkJCSc2rNnj1oEuih0W+VOASAlFQ506U0ZUn27a/qXHjcLpTsJwM3S4Ybm+X9Hf9iMNatqAQAAAABJRU5ErkJggg==",
						},
						{
							name: "Stripe",
							title: "Stripe",
							setup: "",
							alg: "F R2 2-3Uw R2 B 2-3Dw R D2 B 2-3Rw 2-3Uw F' R2 U' B2 Uw2 Rw2 U2 R2 Fw2 Rw2 2U2",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Triangle",
							title: "Triangle",
							setup: "// Exchanged Peaks\nF U2 L F L' B L U B' R' L' U R' D' F' B R2",
							alg: "Rw Fw Uw' Rw2 Uw Fw' Rw Uw Fw2 Rw2",
							imageUrl: "data:image/png;base64,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",
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
		//					alg: "2L2 2R2 2U2 2D2 2F2 2B2",
							alg: "m2 M2 e2 E2 s2 S2",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Dot in a Dot",
							title: "Dot in a Dot",
							setup: "",
							alg: "[E, S] [e, s]",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "6 X",
							title: "6 X",
							setup: "",
							alg: "(((M2' 2U2)2 z)2 x y)3 m2 s2 e2",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Smiley Face",
							title: "Smiley Face",
							setup: "",
							alg: "2L 4L 2U 4R 2R 4D 2-4Lw 4U 2-4Rw 2D",
							imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAE7tJREFUeF7tm3d4VlW2xn9wZaReLihFmgJSpSgKjBRRigQwomBFSOgIhCgl5A5Dk56glCSAEEqACHJpYgjlismEIhf0ioAgEsB5QlGUgetQAozo/d69zwknXxIM/Y+Z9Tw8D5xvn3P2eld719qHPPyTS55/cv35FwD/8oC7i0AT5/Vb79Y27kYIFAX6NGjQYFDXrl1LSfG4uLiTO3fufA+YA/x8J8G4kwA8DAzq0KFDj549e/6hTZs2mfRcv349c+fOvbxq1SqBMB04dCeAuBMAtCxUqNCgHj16BJQpUybP3r176dixIy+++GIm/VavXs3KlSupXbs2J06c+G3evHkbzp8/L6/49HYCcTsB6F63bt0/BQUFPdy7d28KFy6coceCBQv49NNPeeqpp8y1zZs306JFC7p165ax5ty5c8yZM4dFixal7t69exIw/3YAcasBKA30a9u2bWjBggWLVq9enQEDBlCyZMlMe//pp5+YNWsWB2JizPXqISH07duXEiVKZFr3448/Eh0dzYEDB0hPT/+/xMTEKEA3/XSrwLhVANQGhvTp06dTz54973niiSfM/rZv305MTIwBQECkp6cbxc/MnEm3337jcUeL/wUW5MlDsX79DBAFChQwiguAkJAQnnzySbPyiy++UJ74Zfbs2R8ACo+9NwvEzQCge9tXqVIlPDAw8I+DBg2ibNmy2e5H7j5y5EiKf/YZQ4FaOez6ayASON2oEWPGjDFhkZ0cP36cKVOmkJCQsD01NVXhkQD8diNg3AgACuYeLVu2HBoUFFSmS5cuJoa1ocqVK+MFYunSpSi5ySNk2R9++MFY9lh0NL2Bhs6Odzj1r9yAAcZTSpcubTxFFleyfP31181KV/HDhw+b9yiHLF68WHni+KZNmyLkSD5PPHc9QFwPAA8CbwUHB7/Zo0ePAk2bNs3yni1bthggKlasyNGjR2nbtm2mxObe8P333xsgvp01y1yq1revUfyBBx7I8kwlzHXr1lG+fHm+++47o3hO754/f/6FuLg4PXQacCw3QOQGgKYVKlQI79KlS5tixYrlXbt2Lb169aJTp06Zni+FZbX9UVG8dv48i4Cqb71lNlyhQoVMa1esWCGrUb9+fXP9888/JygoiJdeeinTurS0NAPowenTCfIlyw8LFaJmaKjxJgHilSVLlhAbG8tzzz3HmTNnfl28eHFiWlqavGLbtYDICQC5+ZRGjRq1Cw4OLqMy5srFixeJjIwkJSWF0NBQypUrZxS/MG8e3X3B6CY2rf8MmAk8HBpqgEhOTja1vnnz5sbi99xzj3nsL7/8YjwiKSnJcIRnnnnGKH4oKop+QCOPBkqYqocFe/QwQBw7doyoqCiaNWvG0KFDyZ8/f8Zqp4we3bZtWyLQNzsgcgJgV1RU1KPaZE4iTxAQp7ZsYRzwTA4LlZlE7RYCLfr3N0BUqlQp29VHjhwxiguoLvv3mzyR0waTfcAN99XE+5s2NYrL8jmJwA0NDdUtzf3XZP/8WpyjBYXqbKvDiPARmVxz/vz5rFmzhiZNmhgLqKZHRESQNns2bwENnDecB2YD/wO87PyRL8ojKvkB4SquMBo4cCBPP/008fHxxEdHU3/nTvoAhZzn7nR4coU+fQgPDzfcQR64detW2rdvT/fu8kMrCrXJY8bw7N69rIW/fwXqQzJJ9gCUYT9J1DB0YxYEnA4wLqa63qFDB4KDg7OALYorj7gYH48iXiVNcds2G7O4QFTsJwfHuLE8Q+/wl48++ojY6GiqJyWRBuTv3NlYXJTZXxYuXMiqVasMb1CIlt+wgcE+0EXDasPu4/Bo7gDIyzz2m5C2sh+YCEE1ghg+fDhVqlTJ8vKDBw+aWDx58iSXLl2iaEKC8YjK2QBwGJjhawm/d357qE8fA0DVqlWzrE5NTTUeJlJ07733UqpUKZN7clo7btw4jixaxHirtJFfFSow11dJe+UOABjDVkboLiNnfD442ZdPW1mPCG8TboAQv9+1a5dRXCxPOaNx48bmlo0bNxqPqJKUZIAQR3YV/0F8GfAOAxQaD3qAOHHihLlfniWLt27d2jx327ZtJmGKLQqIxx57DPUNUjwpIsJY/CNggq8W/oezfb2vJoz1YTEytwD0ZzUx1PAs1461S8l/QfFlxWlRswVFihQxG6lbt242tsa45LuRkVTbsQN/xf1v0FTEBUKKDx482IRcdrJ7924D/NmzZzm4aRPdz5yhi7NQBXqJ56bdNklLA0s8PJJTku3INFYQ4FmplKx07ooCchbU+LYGw/88PAsv0LL9+/czdepUwwBV3qIjIgg4cMB4RD6/jfzDSW4b1ECFh5tyKUaopFizZs0sGKjuTxw7llq+Rilc3uNZ8Yq1UYasFnWFjsCq3ALQmNfZapKgKmE1J3piPbcrLMYAYRaI5n9rbsJCNVyKq5wpHyi2dc0VNUfzIiN5+ejRjMIssywvX54eQ4ea5scVlUM9R3Gv5wgIXZO7V0hKYggwzKF9rrvrXhcAdUoTAVGmWEsntucWgMoM5pBhNdG+3T0CpDp1zX3CFQ22sKlFIj97Hzo90Mm4pSznVdz/xUpsC995x1wOHjXKlLScRErLkxRuZ5YsMXFez1msAFnhs0Vez82viYX6Su8+4D8BhdZYEPn4LrcA5COIywZeyUoHiP5OQXefojonzusVBWA6DAwYaDyiePHiWfRSjZ88eTLt2rUzvyUmJhIWFkbnzp2zrD19+rRNcFOnUsDHM9b5rXjeB8bHnmvqhtQISHHbQtm/z4E/AIq0TJJzLxDIBSabd1oZDWHlw5icMtmGhWh8dgCI9SwHPoAi8UUY0XeEUU6imi7LN2jQwGR2t31Wl6eMv3PnTuMJL7zwglkvkGLHjqXP2bOmJqs59p+PBTq98BYfR1BfvL0X9Ii1RcuVnnBh1VUulUsAmnCUuZTLWD0d9oXs4/Lly4waNYqPC3xsHcrfA15V1+Jw2Es2P1RLrmaaFzVFUjC7Gq73iEsYVpmWxrGjRwn89lsT50qYijj5ywY/CwoA+fbilr5BQqj9Mex5+JNnXUdIS86cJzN+zdkDavA5q7GjHckiSGmdkjHHW7ZsGSNGjCD1hVSTYjOkq1PLCnqubQJx0SbnmpiwcGu6ny6GO8jdS27dalK2d278d0CP9qZxufqYisDbPtNbmgA7YFIwpo9wpSns2Ad/9H+f/p0zAPlYRj1eMYlO+TMBVlZamakuBwYGsvYhn2ZSUOir1VDPpe7oPs/rUpymQD48C14u87IBok6dOmbRnj17jOJnli83FheR0VLvPEgcQr/FWyyNu7dXltci0UpXNkDs27bmJTn5YDt8eOVqSsiEw7XmAdPYxltMcXywJcy+Mhtva6xpUHy/eJB5VC3EOZWOB/qqw9XgsX2xdqP2TbLeAhEaYH02OSrKKCd3lihj6O92ZmzliKP0ZZ/S92JdXE5WXelCaLjyoc9LRsMaZzsjbEWYqjOJ6/MACGcTk4wisuA8GN9+PMOGuaUBQ31jAmOuRtdfAM1tNSySbv/mvPJzpXrf30f7bSEOJk6y1dQr8milEjsKBSmter7ZUVzhLlFlbij692fP3bOgyXT7eq37qy2ZwvTd6wUgiKUs5DHnNnUuC6D1ydZMmDCBevXqmRwwru64q12Hlk6EyEciGTV7FOm90kEW2uUUa3UoXskBAFVbnRAoAWn8O6EAfB8K/SMsoXdFw5FWIrjSVqxnKvT+DMM03eGa5o1tMCxZ0ZNFrhUCAUSz3jRAEmX0UWDq0RQY1mgYxYoVI+y+sMwjm2mQ/GqyyfSqFnO/mWs3KE008s0FAGrZejqenSJap/sPQVjXzNldUfWSivzfICDWdjpKjHJCFX2JxsXBto1TprouAOoykq/wjv60ET1dsgoqranEkU5HrmZgXZ8Na1uszSA5YnECYkuRLaCALObZQzYeIPat0fkaTVZcvqFbkmFUX2tdV5Qsh5WFkcdB7E+iSYWmT66IqA61PqoRxXUBUIpgfuCik5U0JZRvejPuJ87I8ayTYnQssAiW1V3GK6/IdFZU36sNqgZ7HPLktm1+AKgTVLshBr7qv33DP+8sNREiBtuGXnGtNkSF5mmHH7jvEpeUr+uIWQ6rSdIsMw6Qn1wfAHl4lSu0JY8SoKk54qFeADTvOuAQb1WBZ32ppjAsKLeArl1Vta1onF2pZyXQjFYepL5B1j1sk6BKuRK5kp6yu5TcKP8u49nwCogeDqedfKq8p8doxOPOFbRaAGirIqNKpsvhykKw09frBAACOM00x2l1IieLa9Cn6YZE3YY26s5OZb7tENMphv795S5WRHXLvV7OmlciTxAQJeDV1VYpKe7Oq1TDk8VtvUeFi6HZeDt8dQifGXpoFGrZBBx1+L8AsOTbhMSphMxPygTDtc8FGnCARaYZNlJ4dGHqna7H5kabbdBpJiB/u1oZQaVwOfSr1s9Ui6JFi5rBacn2Je25jVcWQeQEm/C8ogZnq7xLPa58eSo896FN5W5O1nr1jyoCmgXISYc3gI5fQYzqpiOBsH+b7WezlWsDUJlkEk2YWYmAE+NPmOOo8PXhNlvJqirSrqjufGHj9/7F9xP5dqQ53irWqljWQpQDAKLAO1Tj1sGD78KIn+GgQy/swM2KSKfcfGQe+EQmbwchzWx+cKUBfHLIBucNAJCP+UyhWwbsc2BP1z1mIrtv3z7T0a27tC5zXpB7K4GJ2ql0ToF2p9qReCwRlvntIQcAxG53NYUQp3CoGVKJ0ycVLi3Rk1SgNigmpLw6ogMw6oWrlUJtcneY82tWrpWxkd87GhtPCMNM/lSQroGkxkmZBh06kEj6OYn00HQbjKJnS/3Gj7LmG47JvHUsGwBEdMRbNzodt7tT4ankqHgUsRxRAHaqVConubIdorrZPkBJUmRoImjq4s9Bcw3AANYSZbh+HPA8LCuRucRpqDFjxgzT868otcKaSZXCGxZ6nUY3Cm4Vb029xFM9AIiwqIeXVdVNK5V4RbEuG6j7fk8xIqtLLe+cch0sGWQHosrLRWwfp0h5/8ZCQGDGsSKjkZwKIflCzHjKPdcTAJroSOLi4gibF8apwqcsJfOKAFAve8IxsZqmR2wS1GmP/imeJCqhpOMPgAjOofvgGylu5yXWsV0P+MWCPviDq62BWpgXbVX0Do0ybev3QqAxk9ma0aZpALIBKh6oyMy3ZxIQEIBa4oQE2c+KMr4OP7+u97VNkm4FdgFwF6qkToFq31nFvSdIOh/S5iVKI4r/WJ3FLPYM+70AbIZa70Dgcev+7smjJsNv2s8QhHG28nsA3Ec4p0xnIlFJknur7E2CQcUHoY8VNOrySqtWrcwReti0MNLeSLPu7g+AbvgA3h1r2wuvuADIbH8uC8cFpOLCv4yKapSHkDib+dUWKEzcA0BRl5GWMIpq3BAAuqknIcSauJVoM25TsxnyRuRl4/sbadnSbVIxHqCj7vPnz5tKMfPHmZY0aUDvlWsAIPK+RLROLq8BgD/J3wrVesH4364e+b7pCXaloMm2qVT2ylF+zwPcG2vQjLUMoZI5W9GQxBW1uFcgvHw4kybZyYTG4WqCXNEXHr0H9OZ4r+M2SbqSDQBqGgeVgX/IpF6O6x3ARkKv+XbcIDboigiVph6j4cgmSxK/uZby+i23AGhtPu5hIk8xiJme+0RpFcB/hVoJtZgxbIbp/rwA6OaqT1QltW4qHHe8SNnOA4AaHMW64nfuw3BBcy+vCID+8NAYGH8YHnIym/c04Q34dSO896vNg1lG4NmBcT0AuPc/RXtWM5TiJrrkYDoWFEO5YDNx7QO1zZzPK7Xq12Jf/D4ztDQfwtojAZMDlMCVRTQx0/ixdA247B8ugdA1FXPqq1m9mLLmLKpxJy14p5db/9LgKNdyIwDo4f9OOZYyhLboSwg1Ld4BXnd4tOCjxIyOyTgtfrzh43y56MurG1OG2gstU+wRg9u8aMH9teFXtXOSL6D0WJ1B2vMZV0Q2TzlgvAOJaZZCiLFcl9woAO5LOhNELHXJ71rU/CDKpkTpy0Sj6402IdGoUSO2L/A7mlsKU96x425XNP8voXMvsZkoeG2mtbpKvvfAU/h8CemzbS/lPQy+owDoZWWpw1oG82jGh3+qGPqOU9n7I2iY1JD8l/KTEpOS+Vg4GwA0fynTEO47D+O/tged6baeZ0x65OOj4auvbKJTVrlhuVkPcF8sIhdOKOPoR17jz0pD7pHtj06B1pTT+61WNgDIccT1RTfcL4zViig/qABFwJUI+3QxZw3ib0puFQDuJh6jGQmUoqxR1Pvdo0yogxMFr2qVjvw9ACih6TxFLFfHXyqHrmjsoLyZBsc+tTXnpr8Rdp99qwHQc/Wh3nuMpF+mgaq6E/VlTqUwVaOQzQH61EAAKNZ1sxzIy140cgi3X4nrJ0XJLZPbAYC7uQCe50PCKWrKpayuom3+k4xj4s3QKsUOlV06rIBWkyelFTnD4ecVluLflv84cTsBkJr3U554htDazA41zPN+UL4Mpo+yoy5XRIjc77FGwfqj9udsJ7q3wg1uNwDuHnvTiukMJr+hcK5kA4DmKePgYoKdGmjUd1vlTgEgJSpRhzUMoVbG56R+AGgQPBr27LKMTueht13uJACuMmMZwHBzyOIBQG2UrwQq/O2HQ3dI7gYAUq0+jfkLz1JQOWAVnE2xnwOIAtxRuVsASEnxHI2SNPEWa7iu/+lxq1C6mwDcKh1u6jn/D2vSdJtUYurTAAAAAElFTkSuQmCC",
						},
						{
							name: "I love U",
							title: "I love U",
							setup: "z",
							alg: "2-4Bw 2-4Rw2 2F2 2-4Rw2 2-4Dw2 2-3Fw2 2-4Dw S2 2-4Dw 2-3Fw L 4F 2R2 2B L' 4F Rw2 S' 2L2 S R2 S' 2L2 S",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Spiral",
							title: "Spiral",
							setup: "",
							alg: "U R2 F R2 B' D' R D2 B D F2 R' D2 R2 D' F 2-3Lw E' M' 2U 2L' 2-3Uw' B F U2 L2",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Exchanged Rings",
							title: "Exchanged Rings",
							setup: "",
							alg: "B' U' B' L' D B U D2 B U L D' L' U' L2 D\nb' u' b' l' d b u d2 b u l d' l' u' l2 d",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Superflip",
							title: "Superflip",
							setup: "",
							alg: "((m' U)4 x y')3 ((M' Uw)4 x y')3",
							imageUrl: "data:image/png;base64,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",
						},
						{
							name: "Half Superflip",
							title: "Half Superflip",
							setup: "",
							alg: "((m' U)4 y x)3 ((M' Uw)4 y x)3 y",
							imageUrl: "data:image/png;base64,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",
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
	$scope.examples_keys = ["title", "setup", "alg", "puzzle", "stage", "stageMap", "type", "scheme", "picture", "anchor"];
	$scope.examples_map = indexBy($scope.examples, "name");
	for (var grName in $scope.examples_map) {
		$scope.examples_map[grName].map = indexBy($scope.examples_map[grName].list, "name");
	}
	$scope.createExampleImage = function(group, puzzle, example) {
		if (!group.imageBaseUrl) {
			return "";
		}
		var url = new URL(group.imageBaseUrl);
		if (puzzle) {
			url.searchParams.set("pzl", puzzle.name.split("x")[0]);
			if (!example) {
				url.searchParams.set("sch", "ndlndl");
				url.searchParams.set("cc", "w");
			}
		}
		if (example) {
			if (example.imageUrl) {
				return example.imageUrl;
			}
			if (group.type.id === "moves") {
				url.searchParams.set("alg", alg.cube.expand(example.alg));
			} else if (group.type.id === "alg") {
				url.searchParams.set("case", alg.cube.expand(example.alg));
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
			for (var key of $scope.examples_keys) {
				$scope[key] = key in example ? example[key] : key in puzzle ? puzzle[key] : key in group ? group[key] : $scope[key];
			}
		}
	};

	// For debugging.
	ss = $scope;
	l = $location;
}]);
