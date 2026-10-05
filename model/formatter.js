sap.ui.define([], function () {
	"use strict";
	return {
		
		/**
		 * Formatter para los valores que no se recogen de SAP.
		 * Se muestran dos decimales separados por una coma.
		 */
		PriceFormat: function (value) {
			if (value) {
				var output = parseFloat(value);
				if (!isNaN(value) && isFinite(value)) {
					jQuery.sap.require("sap.ui.core.format.NumberFormat");
					var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
						maxFractionDigits: 2,
						minFractionDigits: 2,
						groupingEnabled: true,
						groupingSeparator: ".",
						decimalSeparator: ","
					});
					return oNumberFormat.format(output);
				}
			}
			return value;
		},

		/**
		 * Formatter para los valores que no se recogen de SAP.
		 * Se muestran dos decimales separados por una coma.
		 */
		QuantityFormat: function (value) {
			if (value) {
				var output = parseFloat(value);
				if (!isNaN(value) && isFinite(value)) {
					jQuery.sap.require("sap.ui.core.format.NumberFormat");
					var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
						maxFractionDigits: 3,
						minFractionDigits: 3,
						groupingEnabled: true,
						groupingSeparator: ".",
						decimalSeparator: ","
					});
					return oNumberFormat.format(output);
				}
			}
			return value;
		}
	};
});