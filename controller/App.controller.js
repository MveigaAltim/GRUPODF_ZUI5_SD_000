sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.App", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			
			//sap.ui.loader.load("local.sap.ui")
			
			//sap.ui.loader.load("local.sap.ui", "http://192.168.6.186:8030/sap/bc/ui5_ui5/sap/z17158/resources/sap-ui-core.js");
		}
	});
});