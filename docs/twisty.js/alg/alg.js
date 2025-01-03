// Compatibility shim to work both in browers and node.js
// Based on on https://gist.github.com/rpflorence/1198466
(function (name, definition) {
	if (typeof module !== "undefined" && module.exports) {
		// Node.js
		module.exports = definition(require("./alg_jison"));
	} else {
		// Browser
		window[name] = definition(alg_jison);
	}
})("alg", function (alg_jison) {

	var debug = false;
	var patterns = {
		single: /^[UFRBLD]$/,
		wide: /^([ufrbld]|[UFRBLD]w)$/,
		singleSlice: /^[MES]$/,
		wideSlice: /^([mes]|[MES]w)$/,
		rotation: /^[xyz]$/,
		pause: /^\.$/,
	};

	// function moveKind(moveString) {
	// 	for (s in patterns) {
	// 		if (patterns[s].test(moveString)) {
	// 			return s;
	// 		}
	// 	}
	// 	return "UNKNOWN";
	// }

	function moveKind(move) {
		for (i in patterns) {
			if (patterns[i].test(move.base)) {
				return i;
			}
		}
	}

	var directionMap = {
		"U": "U", "Uw": "U", "u": "U",
		"F": "F", "Fw": "F", "f": "F",
		"R": "R", "Rw": "R", "r": "R",
		"B": "B", "Bw": "B", "b": "B",
		"L": "L", "Lw": "L", "l": "L",
		"D": "D", "Dw": "D", "d": "D",
		"M": "L", "Mw": "L", "m": "L",
		"E": "D", "Ew": "D", "e": "D",
		"S": "F", "Sw": "F", "s": "F",
		"x": "R", "y": "U", "z": "F",
		".": ".",
	};

	var combinationMap = {
		"U": "D",
		"F": "B",
		"R": "L",
		"B": "F",
		"L": "R",
		"D": "U",
	};

	function canonicalizeMove(orig, dimension) {
		var move = {};
		move.amount = orig.amount;
		move.base = directionMap[orig.base];
		var mKind = moveKind(orig);
		if (mKind == "single") {
			move.startLayer = orig.layer || 1;
			move.endLayer = move.startLayer;
		} else if (mKind == "wide") {
			move.startLayer = orig.startLayer || 1;
			move.endLayer = orig.endLayer || 2;
		} else if (mKind == "wideSlice") {
			move.startLayer = 2;
			move.endLayer = dimension - 1;
		} else if (mKind == "singleSlice") {
			if (dimension % 2 == 1) {
				move.startLayer = (dimension + 1) / 2;
				move.endLayer = (dimension + 1) / 2;
			} else {
				// Hack: Make the end layer larger than the start layer, so nothing moves.
				move.startLayer = dimension / 2 + 1;
				move.endLayer = dimension / 2;
			}
		} else if (mKind == "rotation") {
			move.startLayer = 1;
			move.endLayer = dimension;
		}
		return move;
	}

	var cube = (function () {
		var types = {
			sequence: { repeatable: false },
			move: { repeatable: true },
			commutator: { repeatable: true },
			conjugate: { repeatable: true },
			group: { repeatable: true },
			pause: { repeatable: false },
			newline: { repeatable: false },
			comment_short: { repeatable: false },
			comment_long: { repeatable: false },
			timestamp: { repeatable: false },
			combination: { repeatable: false },
		};

		/************************************************************************************************/

		function fromString(algString) {
			return alg_jison.parse(algString);
		}

		// TODO: Document that it is not safe to mutate algs, because they may share moves.
		function cloneMove(move) {
			var newMove = {};
			for (i in move) {
				newMove[i] = move[i];
			}
			return newMove;
		}

		/************************************************************************************************/

		function suffix(repeated) {
			if (typeof repeated.amount === "undefined") {
				throw ("Amount not defined for repeatable: ", repeated);
			}
			var amount = Math.abs(repeated.amount);
			var amountDir = repeated.amount > 0 ? 1 : -1; // Mutable
			var suffix = "";
			// Suffix Logic
			if (repeated.wide) {
				suffix += "w";
			}
			if (amount > 1) {
				suffix += "" + amount;
			}
			if (amountDir === -1) {
				suffix += "'";
			}
			return suffix;
		}

		/****************************************************************/

		function toString(alg, dimension) {
			var moveStrings = [];
			for (var i = 0; i < alg.length; i++) {
				var type = alg[i].type;
				var moveString = toString[type](alg[i]);
				if (types[type].repeatable) {
					moveString += suffix(alg[i]);
				}
				moveStrings.push(moveString);
				var lastMove = i == alg.length - 1;
				var afterNewline = alg[i].type === "newline";
				var beforeNewline = i + 1 in alg && alg[i + 1].type === "newline";
				var betweenPauses = i + 1 in alg && alg[i].type === "pause" && alg[i + 1].type === "pause";
				var beforeCombination = type === "move" && alg[i+1] && alg[i+1].type === "combination";
				var afterCombination = type === "combination" && alg[i+1] && alg[i+1].type === "move";
				if (!lastMove && !afterNewline && !beforeNewline && !betweenPauses && !afterCombination && !beforeCombination) {
					moveStrings.push(" ");
				}
			}
			return moveStrings.join("");
		}

		toString.move = function (move) {
			var tL = move.layer;
			var sL = move.startLayer;
			var oL = move.endLayer;
			var prefix = "";
			// Prefix logic
			if (patterns.single.test(move.base)) {
				if (move.layer) {
					prefix = move.layer.toString();
				}
			} else if (patterns.wide.test(move.base)) {
				if (move.endLayer) {
					prefix = move.endLayer.toString();
					if (move.startLayer) {
						prefix = move.startLayer.toString() + "-" + prefix;
					}
				}
			}
			return prefix + move.base;
		};

		toString.commutator = function (commutator) {
			return "[" + toString(commutator.A) + ", " + toString(commutator.B) + "]";
		};

		toString.conjugate = function (conjugate) {
			return "[" + toString(conjugate.A) + ": " + toString(conjugate.B) + "]";
		};

		toString.group = function (group) {
			return "(" + toString(group.A) + ")";
		};

		toString.timestamp = function (timestamp) {
			return "@" + timestamp.time + "s";
		};

		toString.comment_short = function (comment_short) {
			return comment_short.comment;
		};

		toString.comment_long = function (comment_long) {
			return comment_long.comment;
		};

		toString.pause = function (pause) {
			return ".";
		};

		toString.newline = function (newline) {
			return "\n";
		};

		toString.combination = function (combination) {
			return "+";
		};

		/************************************************************************************************/

		// From twisty.js.
		function getOptions(input, defaults) {
			var output = {};
			for (var key in defaults) {
				output[key] = key in input ? input[key] : defaults[key];
			}
			return output;
		}

		/****************************************************************/

		// Dispatch mechanism constructor.
		function makeAlgTraversal(options) {
			options = getOptions(options || {}, {
				outputIsAlg: true,
				inputValidator: function () {
					return true;
				},
			});
			var fn = function (alg, data) {
				var stringInput = typeof alg === "string";
				if (stringInput) {
					alg = fromString(alg);
				}
				if (!options.inputValidator(alg, data)) {
					throw "Validation failed.";
				}
				var output = fn.sequence(alg, data);
				if (stringInput && options.outputIsAlg) {
					output = toString(output);
				}
				return output;
			};
			fn.sequence = function (algIn, data) {
				var moves = [];
				for (var i = 0; i < algIn.length; i++) {
					moves = moves.concat(fn[algIn[i].type](algIn[i], data));
				}
				return moves;
			};
			fn.move = function (move, data) {
				return move;
			};
			fn.commutator = function (commutator, data) {
				return {
					type: "commutator",
					A: fn(commutator.A, data),
					B: fn(commutator.B, data),
					amount: commutator.amount,
					wide: commutator.wide,
				};
			};
			fn.conjugate = function (conjugate, data) {
				return {
					type: "conjugate",
					A: fn(conjugate.A, data),
					B: fn(conjugate.B, data),
					amount: conjugate.amount,
					wide: conjugate.wide,
				};
			};
			fn.group = function (group, data) {
				return {
					type: "group",
					A: fn(group.A, data),
					amount: group.amount,
					wide: group.wide,
				};
			};
			var id = function (x) {
				return x;
			};
			fn.pause = id;
			fn.newline = id;
			fn.comment_short = id;
			fn.comment_long = id;
			fn.timestamp = id;
			fn.combination = id;
			// Make the defaults available to overrides.
			// TODO: Use prototypes?
			for (i in fn) {
				fn["_" + i] = fn[i];
			}
			return fn;
		}

		/************************************************************************************************/

		function round(x) {
			// We want to round:
			//    2.6 to  3
			//    2.5 to  2
			//   -2.5 to -2
			var antiSignish = x < 0 ? 1 : -1; // When can we haz ES6?
			return Math.round(-Math.abs(x)) * antiSignish;
		}

		function propertySameOrBothMissing(x, y, prop) {
			if (prop in x && prop in y) {
				return x[prop] == y[prop];
			} else {
				return !(prop in x) && !(prop in y);
			}
		}

		function sameBlock(moveA, moveB) {
			if (moveA.type !== "move" || moveB.type !== "move") {
				throw new Error("Something other than a move was passed into sameBlock().");
			}
			// TODO: semantic comparison.
			// e.g. only compare "startLayer" if the base is BASE_WIDE.
			return propertySameOrBothMissing(moveA, moveB, "base") && propertySameOrBothMissing(moveA, moveB, "layer") && propertySameOrBothMissing(moveA, moveB, "startLayer") && propertySameOrBothMissing(moveA, moveB, "endLayer");
		}

		/****************************************************************/

		var simplify = makeAlgTraversal();

		simplify.sequence = function (sequence) {
			var algOut = [];
			for (var i = 0; i < sequence.length; i++) {
				var move = cloneMove(sequence[i]);
				if (move.type !== "move") {
					algOut.push(simplify[move.type](move));
					continue;
				}
				if (algOut.length > 0 && algOut[algOut.length - 1].type == "move" && sameBlock(algOut[algOut.length - 1], move)) {
					move.amount += algOut[algOut.length - 1].amount;
					algOut.pop();
				}
				// Mod to [-1, 0, 1, 2]
				// x | 0 truncates x towards 0.
				move.amount = move.amount % 4 + 4;
				move.amount = move.amount - 4 * round(move.amount / 4);
				if (move.amount !== 0) {
					algOut.push(move);
				}
			}
			return algOut;
		};

		/************************************************************************************************/

		function repeatMoves(movesIn, accordingTo) {
			var movesOnce = movesIn;
			var movesOut = [];
			if (accordingTo.wide) {
				for (var move of movesOnce) {
					if (patterns.single.test(move.base) || patterns.singleSlice.test(move.base)) {
						move.base += "w";;
					}
					movesOut.push(move);
				}
				return movesOut;
			}
			var amount = Math.abs(accordingTo.amount);
			var amountDir = accordingTo.amount > 0 ? 1 : -1; // Mutable
			if (amountDir == -1) {
				movesOnce = invert(movesOnce);
			}
			for (var i = 0; i < amount; i++) {
				movesOut = movesOut.concat(movesOnce);
			}
			return movesOut;
		}

		/****************************************************************/

		var expand = makeAlgTraversal();

		expand.commutator = function (commutator) {
			var once = [].concat(expand(commutator.A), expand(commutator.B), invert(expand(commutator.A)), invert(expand(commutator.B)));
			return repeatMoves(once, commutator);
		};

		expand.conjugate = function (conjugate) {
			var once = [].concat(expand(conjugate.A), expand(conjugate.B), invert(expand(conjugate.A)));
			return repeatMoves(once, conjugate);
		};

		expand.group = function (group) {
			var once = toMoves(group.A);
			return repeatMoves(once, group);
		};

		/****************************************************************/

		var toMoves = makeAlgTraversal();
		toMoves.sequence = function (algIn, data) {
			var moves = [];
			for (var i = 0; i < algIn.length; i++) {
				if (algIn[i].type === "combination") {
					var moveA = algIn[i-1];
					var moveB = algIn[i+1];
					if (isValidCombination(moveA, moveB)) {
						var combination = this[moveB.type](moveB, data);
						moves[moves.length-1].combination = combination;
						moves[moves.length-1].location.last_line = combination.location.last_line;
						moves[moves.length-1].location.last_column = combination.location.last_column;
						combination.combination = moves[moves.length-1];
						i++;
					} else {
						throw new Error("Impossible Move Combination");
					}
				} else {
					moves = moves.concat(this[algIn[i].type](algIn[i], data));
				}
			}
			return moves;
		};
		toMoves.commutator = expand.commutator;
		toMoves.conjugate = expand.conjugate;
		toMoves.group = expand.group;
		// TODO: Allow handling semantic data in addition to pure moves during animation.
		toMoves.pause = function (pause) {
			return {
				type: "move",
				base: ".",
				amount: 1,
				location: pause.location,
			};
		};
		var emptySequence = function (timestamp) {
			return [];
		};
		toMoves.newline = emptySequence;
		toMoves.comment_short = emptySequence;
		toMoves.comment_long = emptySequence;
		toMoves.timestamp = emptySequence;

		/************************************************************************************************/

		function isValidCombination(moveA, moveB) {
			return moveA && moveB && moveA.type === "move" && moveB.type === "move" && !moveA.combination && !moveB.combination && moveA.base === combinationMap[moveB.base];
		}

		/************************************************************************************************/

		var invert = makeAlgTraversal();

		invert.sequence = function (sequence) {
			var currentLine;
			var lines = [(currentLine = [])];
			for (var i = 0; i < sequence.length; i++) {
				if (sequence[i].type == "newline") {
					lines.push((currentLine = []));
				} else {
					currentLine.push(invert[sequence[i].type](sequence[i]));
				}
			}
			var out = [];
			for (var i = lines.length - 1; i >= 0; i--) {
				lines[i].reverse();
				if (lines[i].length > 0 && lines[i][0].type == "comment_short") {
					var comment = lines[i].splice(0, 1)[0];
					lines[i].push(comment);
				}
				if (i > 0) {
					lines[i].push({ type: "newline" });
				}
				out = out.concat(lines[i]);
			}
			return out;
		};

		invert.move = function (move) {
			var invertedMove = cloneMove(move);
			if (move.base !== ".") {
				invertedMove.amount = -invertedMove.amount;
				if (invertedMove.combination) {
					invertedMove.combination = cloneMove(invertedMove.combination);
					invertedMove.combination.amount = -invertedMove.combination.amount;
				}
			}
			return invertedMove;
		};

		invert.commutator = function (commutator) {
			return {
				type: "commutator",
				A: commutator.B,
				B: commutator.A,
				amount: commutator.amount,
				wide: commutator.wide,
			};
		};

		invert.conjugate = function (conjugate) {
			return {
				type: "conjugate",
				A: conjugate.A,
				B: invert(conjugate.B),
				amount: conjugate.amount,
				wide: conjugate.wide,
			};
		};

		invert.group = function (group) {
			return {
				type: "group",
				A: invert(group.A),
				amount: group.amount,
				wide: group.wide,
			};
		};

		// TODO: Reversing timestamps properly takes more work.
		toMoves.timestamp = function (timestamp) {
			return [];
		};

		/************************************************************************************************/

		var removeComments = makeAlgTraversal();

		removeComments.comment_short = function () {
			return [];
		};

		removeComments.comment_long = function () {
			return [];
		};

		/************************************************************************************************/

		var mirrorMap = {
			M: {
				fixed: ["x", "M", "Mw", "m"],
				map: {
					U: "U", Uw: "Uw", u: "u",
					F: "F", Fw: "Fw", f: "f",
					R: "L", Rw: "Lw", r: "l",
					B: "B", Bw: "Bw", b: "b",
					L: "R", Lw: "Rw", l: "r",
					D: "D", Dw: "Dw", d: "d",
					E: "E", Ew: "Ew", e: "e",
					S: "S", Sw: "Sw", s: "s",
					y: "y", z: "z",
				}
			},
			E: {
				fixed: ["y", "E", "Ew", "e"],
				map: {
					U: "D", Uw: "Dw", u: "d",
					F: "F", Fw: "Fw", f: "f",
					R: "R", Rw: "Rw", r: "r",
					B: "B", Bw: "Bw", b: "b",
					L: "L", Lw: "Lw", l: "l",
					D: "U", Dw: "Uw", d: "u",
					M: "M", Mw: "Mw", m: "m",
					S: "S", Sw: "Sw", s: "s",
					x: "x", z: "z",
				}
			},
			S: {
				fixed: ["z", "S", "Sw", "s"],
				map: {
					U: "U", Uw: "Uw", u: "u",
					F: "B", Fw: "Bw", f: "b",
					R: "R", Rw: "Rw", r: "r",
					B: "F", Bw: "Fw", b: "f",
					L: "L", Lw: "Lw", l: "l",
					D: "D", Dw: "Dw", d: "d",
					M: "M", Mw: "Mw", m: "m",
					E: "E", Ew: "Ew", e: "e",
					x: "x", y: "y",
				}
			},
		};

		var rotateMap = {
			x: {
				U: "B", Uw: "Bw", u: "b",
				F: "U", Fw: "Uw", f: "u",
				R: "R", Rw: "Rw", r: "r",
				B: "D", Bw: "Dw", b: "d",
				L: "L", Lw: "Lw", l: "l",
				D: "F", Dw: "Fw", d: "f",
				M: "M", Mw: "Mw", m: "m",
				E: "S", Ew: "Sw", e: "s",
				S: "E'", Sw: "Ew'", s: "e'",
				x: "x", y: "z'", z: "y",
			},
			y: {
				U: "U", Uw: "Uw", u: "u",
				F: "L", Fw: "Lw", f: "l",
				R: "F", Rw: "Fw", r: "f",
				B: "R", Bw: "Rw", b: "r",
				L: "B", Lw: "Bw", l: "b",
				D: "D", Dw: "Dw", d: "d",
				M: "S'", Mw: "Sw'", m: "s'",
				E: "E", Ew: "Ew", e: "e",
				S: "M", Sw: "Mw", s: "m",
				x: "z", y: "y", z: "x'",
			},
			z: {
				U: "R", Uw: "Rw", u: "r",
				F: "F", Fw: "Fw", f: "f",
				R: "D", Rw: "Dw", r: "d",
				B: "B", Bw: "Bw", b: "b",
				L: "U", Lw: "Uw", l: "u",
				D: "L", Dw: "Lw", d: "l",
				M: "E'", Mw: "Ew'", m: "e'",
				E: "M", Ew: "Mw", e: "m",
				S: "S'", Sw: "Sw'", s: "s",
				x: "y'", y: "x", z: "z",
			},
		};

		/****************************************************************/

		var mirror = makeAlgTraversal();
		mirror.move = function(move, axis) {
			var mirroredMove = cloneMove(move);
			if (!mirrorMap[axis].fixed.includes(mirroredMove.base)) {
				mirroredMove.base = mirrorMap[axis].map[mirroredMove.base];
				mirroredMove.amount = -mirroredMove.amount;
			}
			return mirroredMove;
		};

		var rotate = makeAlgTraversal();
		rotate.move = function(move, axis) {
			var rotatedMove = cloneMove(move);
			rotatedMove.base = rotateMap[axis][rotatedMove.base];
			if (rotatedMove.base.includes("'")) {
				rotatedMove.base = rotatedMove.base.replace("'", "");
				rotatedMove.amount = -rotatedMove.amount;
			}
			return rotatedMove;
		};

		/************************************************************************************************/

		// Metrics

		/*
			[a, b] means:
			If the cost is constant based on doing the move at all, count it as `a` moves.
			If the cost depends on abs(amount), use `b` as a multiplier.

			Note: An amount of 0 will always have a cost of 0.
		*/
		var moveCountScalars = {
			obtm:  { rotation: [0, 0], outer: [1, 0], inner: [2, 0] },
			btm:   { rotation: [0, 0], outer: [1, 0], inner: [1, 0] },
			obqtm: { rotation: [0, 0], outer: [0, 1], inner: [0, 2] },
			bqtm:  { rotation: [0, 0], outer: [0, 1], inner: [0, 1] },
			etm:   { rotation: [1, 0], outer: [1, 0], inner: [1, 0] },
		};

		function moveScale(amount, scalars) {
			if (amount == 0) {
				return 0; //TODO: ETM?
			}
			return scalars[0] + Math.abs(amount) * scalars[1];
		}

		var add = function (a, b) {
			return a + b;
		};

		var arraySum = function (arr) {
			return arr.reduce(add, 0);
		};

		function countMovesValidator(alg, data) {
			if (!data.metric) {
				console.error("No metric given. Valid options: " + Object.keys(moveCountScalars).join(", "));
				return false;
			}
			if (!(data.metric in moveCountScalars)) {
				console.error("Invalid metric. Valid options: " + Object.keys(moveCountScalars).join(", "));
				return false;
			}
			return true;
		}

		/****************************************************************/

		// Example: alg.cube.countMoves("R", {metric: "obtm"})
		// TODO: Default to obtm and 3x3x3.
		// TODO: Dimension independence?

		var countMoves = makeAlgTraversal({
			outputIsAlg: false,
			inputValidator: countMovesValidator,
		});

		countMoves.sequence = function (move, data) {
			var counts = countMoves._sequence(move, data);
			return arraySum(counts);
		};

		countMoves.move = function (move, data) {
			// TODO: Get layer info without dummy number.
			var can = canonicalizeMove(move, 10000);
			var scalarKind;
			var mKind = moveKind(move);
			if (mKind == "rotation") {
				scalarKind = "rotation";
			} else if (can.startLayer === 1) {
				scalarKind = "outer";
			} else if (can.startLayer > 1) {
				scalarKind = "inner";
			}
			var scalars = moveCountScalars[data.metric][scalarKind];
			return moveScale(can.amount, scalars);
		};

		countMoves.commutator = function (commutator, data) {
			// TODO: map/reduce framework for structural recursion?
			var counts = countMoves._commutator(commutator, data);
			return (counts.A * 2 + counts.B * 2) * Math.abs(counts.amount);
		};

		countMoves.conjugate = function (conjugate, data) {
			var counts = countMoves._conjugate(conjugate, data);
			return (counts.A * 2 + counts.B * 1) * Math.abs(counts.amount);
		};

		countMoves.group = function (group, data) {
			var counts = countMoves._group(group, data);
			return counts.A * Math.abs(counts.amount);
		};

		var zero = function (group, data) {
			return 0;
		};

		countMoves.pause = zero;
		countMoves.newline = zero;
		countMoves.comment_short = zero;
		countMoves.comment_long = zero;
		countMoves.timestamp = zero;
		countMoves.combination = zero;

		let toCubingJSAlg = makeAlgTraversal();
		toCubingJSAlg.sequence = function (algIn, data) {
			// console.log("sequence", algIn)
			const algBuilder = new data.alg.AlgBuilder();
			for (const unit of algIn) {
				// console.log(unit, toCubingJSAlg[unit.type])
				algBuilder.push(toCubingJSAlg[unit.type](unit, data));
			}
			return algBuilder.toAlg();
		};
		toCubingJSAlg.move = function (move, data) {
			let quantumMove;
			if (move.layer) {
				quantumMove = new data.alg.QuantumMove(move.base, move.layer);
			} else if (move.endLayer && move.endLayer === move.startLayer) {
				quantumMove = new data.alg.QuantumMove(move.base.replace("w", "").toUpperCase(), move.endLayer);
			} else {
				quantumMove = new data.alg.QuantumMove(move.base, move.endLayer, move.startLayer);
			}
			return new data.alg.Move(quantumMove, move.amount); // TODO: pass in parts?
		};

		// function ensureSequence(unitOrSequence) {
		// 	if (unitOrSequence.type === "sequence") {
		// 		return unitOrSequence;
		// 	} else {
		// 		return [unitOrSequence]
		// 	}
		// }
		toCubingJSAlg.commutator = function (commutator, data) {
			let newCommutator = new data.alg.Commutator(toCubingJSAlg.sequence(commutator.A, data), toCubingJSAlg.sequence(commutator.B, data));
			if (commutator.amount === 1) {
				return newCommutator;
			} else {
				return new data.alg.Grouping(new data.alg.Alg([newCommutator]), commutator.amount);
			}
		};
		toCubingJSAlg.conjugate = function (conjugate, data) {
			let newConjugate = new data.alg.Conjugate(toCubingJSAlg.sequence(conjugate.A, data), toCubingJSAlg.sequence(conjugate.B, data));
			if (conjugate.amount === 1) {
				return newConjugate;
			} else {
				return new data.alg.Grouping(new data.alg.Alg([newConjugate]), conjugate.amount);
			}
		};
		toCubingJSAlg.group = function (group, data) {
			return new data.alg.Grouping(toCubingJSAlg.sequence(group.A, data), group.amount);
		};
		toCubingJSAlg.pause = function (pause, data) {
			return new data.alg.Pause();
		};
		toCubingJSAlg.newline = function (newline, data) {
			return new data.alg.Newline();
		};
		toCubingJSAlg.comment_short = function (comment_short, data) {
			return new data.alg.LineComment(comment_short.comment.slice(2));
		};
		toCubingJSAlg.comment_long = function (comment_long, data) {
			const text = comment_long.comment.slice(2, -2).replaceAll("\n", " //");
			console.log("text", text, new data.alg.LineComment(text));
			return new data.alg.LineComment(text); // TODO
		};
		toCubingJSAlg.timestamp = function (timestamp, data) {
			return new data.alg.Pause(); // TODO
		};

		/************************************************************************************************/

		// Exports

		return {
			toString,
			simplify,
			fromString,
			cloneMove,
			makeAlgTraversal,
			invert,
			mirror,
			rotate,
			canonicalizeMove,
			removeComments,
			toMoves,
			expand,
			countMoves,
			toCubingJSAlg,
		};
	})();

	return {
		cube: cube,
	};
});

// var c = alg.cube;
