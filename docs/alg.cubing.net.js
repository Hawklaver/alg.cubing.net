"use strict";

var ss;
var l;

var algxApp = angular.module("algxApp", ["algxControllers", "debounce"]);

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
		y: 0x888800,
		w: 0x888888,
		b: 0x000088,
		g: 0x008800,
		o: 0x884400,
		r: 0x880000,
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
			hintStickers: $scope.hint_stickers,
			hintStickersDistance: $scope.hint_stickers_distance,
			cubies: !$scope.hollow,
			stickerBorder: false,
			doubleSided: !$scope.hint_stickers,
			colors: colorList($scope.scheme.custom ? $scope.custom_scheme : $scope.scheme.scheme),
		});

		try {
			var algoFull = alg.cube.fromString($scope.alg);
			$scope.algStatus = "valid";
			var algoCanonical = alg.cube.toString(algoFull);
			if (algoCanonical !== $scope.alg) {
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
		$(window).resize(resizeFunction);
		// viewの値が変更されてから描画が完了する前に実行されるので、view変更前のサイズがcanvasへ反映されてしまう
		// $scope.$watch("view", resizeFunction);
		new ResizeObserver(resizeFunction).observe(twistyScene.debug.view.container);

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

		$("#viewer canvas").dblclick($scope.twisty_init);

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

	// TODO: Use IFs for puzzle/type
	var demos = {
		"yusheng-3.47": {
			puzzle: $scope.puzzle_map["3x3x3"],
			type: $scope.type_map["reconstruction"],
			title: "Yusheng Du, 3.47 WR",
			setup: "F U2 L2 B2 F' U L2 U R2 D2 L' B L2 B' R2 U2",
			alg: "y x' // inspection\nU R2 U' F' L F' U' L' // XX-Cross + EO\nU' R U R' // 3rd slot\nR' U R U2' R' U R // 4th slot\nU R' U' R U' R' U2 R // OLL / ZBLL\nU // AUF\n\n// from http://cubesolv.es/solve/5757",
		},
		"feliks-4.22": {
			puzzle: $scope.puzzle_map["3x3x3"],
			type: $scope.type_map["reconstruction"],
			title: "Feliks Zemdegs, 4.22 WR",
			setup: "R2 L' F2 D2 F' D L2 B' D L U B2 U B2 D2 L2 D' F2 D",
			alg: "F' R' D' R // pseudo cross \ny R U' R' u' // Xcross \nU' R U R' // 2nd pair \ny' L' U2 L U' L' U L // 3rd pair \nd (U R' U' R)2 // 4th pair \nU' R U2' R' R' F R F' R U2' R' // OLL(CP) ",
		},
		"mats-4.74": {
			puzzle: $scope.puzzle_map["3x3x3"],
			type: $scope.type_map["reconstruction"],
			title: "Mats Valk, 4.74 WR",
			setup: "B2 F2 D F2 L2 U R2 B2 F2 U2 L2 B' L2 R2 D' U2 L2 U' R' F R",
			alg: "x' y' // Inspection\nL' D R2 // Cross\nR U' R' U' L' U' L // 1st Pair\nU2 R U R' U' d' R U R' // 2nd Pair\ny U2 R U' R' L U' L' // 3rd Pair\ny' U2 R' U2 R U2 // 4th Pair\nR' U R' F R F' U R // VLS\nU // AUF",
		},
		"seungbeom-4.59": {
			puzzle: $scope.puzzle_map["3x3x3"],
			type: $scope.type_map["reconstruction"],
			title: "SeungBeom Cho, 4.59 WR",
			setup: "U2 L' D2 L D2 R F2 D2 R' D2 U2 B U L U L' R D L2 F2 U2 R'",
			alg: "x2 // inspection\nD' R' L2' U' F U' F' (D' U') U' R' // xxcross\ny' R' U' R // 3rd pair\ny' R U' R' U' R U R' // 4th pair\nU' R' U' F' U F R // OLL(CP)\nU' // AUF\n\n// Video: youtu.be/5x8jgGX3iNM",
		},
		"T-Perm": {
			type: $scope.type_map["alg"],
			title: "T-Perm",
			setup: "",
			alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
		},
		Sune: {
			type: $scope.type_map["alg"],
			title: "Sune",
			setup: "",
			alg: "[R U R2', R U R']",
		},
		notation: {
			puzzle: $scope.puzzle_map["5x5x5"],
			type: $scope.type_map["moves"],
			title: "Notation Demo",
			setup: "M2 U M2 U2 M2 U M2",
			alg: "R L U D B F // Single moves, variable spacing.\nB' F' D' U' L' R' // Inverses.\nR L2 R3 L2' R5 L8' R7 // Move amount\nU . U . U ... U // Pauses.\nM' E2 S2 M S2 E2 m2 e2 s2 m2 e2 s2 // Slice turns.\nM2' U' M2' U2' M2' U' M2' // H'perm.\nx y z // Rotations.\nR2 L2 R2' L2' // Half turns.\nRw r' Lw l' Uw u' Dw d' Bw b' Fw f' // Wide turns.\n4Rw x L' // Very wide turns\n2-3Lw 3-4r // Wide block turns\n[[R: U], D2] // commutator/conjugate/nesting\n([R: U'] D2)2' [R: U2] // Grouping and repetition",
		},
	};

	$scope.demo = function(name) {
		var demo = demos[name];
		for (i in demo) {
			$scope[i] = demo[i];
		}
	};

	// For debugging.
	ss = $scope;
	l = $location;
}]);
