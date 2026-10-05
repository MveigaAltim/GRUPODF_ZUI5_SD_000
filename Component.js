sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sd_dfgrupo/sd_dfgrupo/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("sd_dfgrupo.sd_dfgrupo.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// Librería http://192.168.6.186:8030/sap/bc/ui5_ui5/sap/z17158/resources/sap-ui-core.js
			// sap.ui.loader.config({
			// 	baseU
			// })
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			// sap.ui.loader.config({
			// 	baseUrl: {
			//         "local.sap.ui": "http://192.168.6.186:8030/sap/bc/ui5_ui5/sap/z17158/resources/sap-ui-core.js"
			//     }
			// })
		}
	});
});