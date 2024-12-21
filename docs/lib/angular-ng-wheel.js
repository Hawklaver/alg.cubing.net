/**
 * AngularJS ng-wheel directive
 * Adds support for ng-wheel event attribute to bind on mouse wheel events.
 * @example <ANY ng-wheel="onWheel($event)"></ANY>
 * @author Valerian Saliou <valerian@valeriansaliou.name>
 */
(function() {
	angular.module("ngWheel", []).directive("ngWheel", ["$parse", function($parse) {
		return function(scope, element, attr) {
			var fn = $parse(attr.ngWheel);
			element.bind("wheel", function(event) {
				scope.$apply(function() {
					fn(scope, {
						$event: event
					});
				});
			});
		};
	}]);
}.call(this));
