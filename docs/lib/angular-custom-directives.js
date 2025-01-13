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
	angular.module("ngScroll", []).directive("ngScroll", ["$parse", function($parse) {
		return function(scope, element, attr) {
			var fn = $parse(attr.ngScroll);
			element.bind("scroll", function(event) {
				scope.$apply(function() {
					fn(scope, {
						$event: event
					});
				});
			});
		};
	}]);
}.call(this));
