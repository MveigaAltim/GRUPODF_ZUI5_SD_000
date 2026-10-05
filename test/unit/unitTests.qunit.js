/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"sd_dfgrupo/sd_dfgrupo/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});