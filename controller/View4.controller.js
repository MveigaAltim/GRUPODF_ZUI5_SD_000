sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.View4", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this._onRouteMatched, this);
			
			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			this.oAppData = this.oModelAppData.getData();
			
			this.sUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			
			// alert("loadTable en View4");
		},
		
		_onRouteMatched: function (oEvent) {
			if( oEvent.getParameter("view").getViewName() === this.getView().getViewName() ) {
				this.oModelAppData.setProperty("/viewFrom", this.getView().getViewName());         
				this.loadTable(this.oAppData.werks);
			}
		},
		
		goToView2: function() {
			this.oRouter.navTo("View2");
		},
		
		loadTable : function(werks){
			var controller = this;
			var oTable = this.getView().byId("idTableDiario");
			
			var URL = this.sUrl + "/sap/opu/odata/SAP/ZDIARIOVENTAS_SRV_03/ReadEntriesSet";
			
			// Se define el modelo
		    var oMainModel = new sap.ui.model.json.JSONModel();
		    // Composición de la query con los parámetros de pantalla
		    var querywerks = "$filter=substringof('" + werks + "',Zwerks)";
		 	var qjson = "&format=json";
		 	
		 	var querydef = querywerks + qjson;
		 	var busyDial = (sap.ui.getCore().byId("Idloadd")) ? sap.ui.getCore().byId("Idloadd") : new sap.m.BusyDialog('Idloadd', {
				title: 'Cargando Datos'
			});
			
			// Carga de los datos del listado
			oMainModel.loadData(URL, querydef, true);
			// Se añade los datos cargados anteriormente
			oTable.setModel(oMainModel);
			oTable.bindAggregation("rows", "/d/results");
			//oTable.filter(oTable.getColumns()[2],"02");
			//oTable.filter(oTable.getColumns().find(x => x.sId === 'Grupo'),"02");
		}
		
	});
});