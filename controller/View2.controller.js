sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/BusyDialog"
], function (Controller, Filter, FilterOperator, BusyDialog) {
	"use strict";
	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.View2", {
		onInit: function () {
			this.sUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var sObtencionOdata = this.sUrl + "/sap/opu/odata/SAP/ZOBTENCIONODATA_SRV";

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this._onRouteMatched, this);

			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			this.getView().setModel(this.oModelAppData, "appData");
			
			this.oModelOdata = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: sObtencionOdata
			});
			this.oModelOdata.setUseBatch(false);
		},

		// Dentro del método _onRouteMatched
		_onRouteMatched: function (oEvent) {
			
			if (oEvent.getParameter("view").getViewName() === this.getView().getViewName()) {
				
				if ( this.oModelAppData.getProperty("/viewFrom").match("View1") ){
					
				this._setInputObjects();
				
				var busyDialog = new BusyDialog({
					title: "Cargando",
					text: "Espere por favor...",
					showCancelButton: false
				});
				
					busyDialog.open();
					this.getData()
						.then(function () {
							busyDialog.close();
						})
						.catch(function (error) {
							busyDialog.close();
							console.error(error);
					});
				}
				this.oModelAppData.setProperty("/viewFrom", this.getView().getViewName());
			}else{
				// Si navegamos de la View3 a la View1, durante la ejecución de 
				// este evento que reconozca el flujo y limpie esta vista.
				if (oEvent.getParameter("view").getViewName().match("View1")){
					this.getView().getModel("zst09data").destroy();
					this.oTable.getBinding().refresh();
				}
			}
		},

		// Metodo para agilizar acceso de componentes desde el controlador
		_setInputObjects: function(){
			this.oTable = this.getView().byId("idTable");
		},
		
		// Botonera superior
		// volver a la pantalla de selección limpiando la búsqueda.
		goToView1: function () {
			this.getView().getModel("zst09data").destroy();
			this.oTable.getBinding().refresh();
			this.oRouter.navTo("View1");
		},

		// Metodo para enviar a la ZSD005
		goToView4: function () {
			this.oRouter.navTo("View4");
		},

		// navegar a creación de pedidos
		goToView3: function () {
			this.oRouter.navTo("View3");
		},

		//	Submit a la transacción VA05 
		onGoToPedidosCreados: function () {
			var sURL3 = this.sUrl + "/sap/bc/gui/sap/its/webgui?~transaction=ZSD016_V1";
			window.open(sURL3);
		},

		/*	Creación del boton para ir a la Vista3 para la creación del pedido de ventas con
			con las posiciones seleccionadas en el listado */
		onCreaPedidoVentas: function (oEvn) {
			//this.oRouter.navTo("View3");
			this.creacionPedidoVentas(oEvn)
		},

		/*	onSubmit de antiguo controlador */
		getData: function () {

			var sMatnr, sWerks, sVkorg, sLgort, sCheck, sLote,
				that = this;
			// Valores de la Pantalla de Selección

			sMatnr = this.oModelAppData.getProperty("/maktg") || "";
			sWerks = this.oModelAppData.getProperty("/werks") || this.oModelAppData.getProperty("/vkorg");
			sVkorg = this.oModelAppData.getProperty("/vkorg") || "";
			// if (!gv_werks || gv_werks === "") {
			// 	gv_werks = gv_vkorg;
			// }
			sLgort = this.oModelAppData.getProperty("/lgort") || "";
			sCheck = this.oModelAppData.getProperty("/bCheckBox") ? "X" : "";
			sLote = this.oModelAppData.getProperty("/rBarcos") ? "X" : "";

			var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var URL = this.sUrl + "/sap/opu/odata/SAP/ZOBTENCIONODATA_SRV/ZST_LO_09Set";

			// Se define el modelo
			var oMainModel = new sap.ui.model.json.JSONModel();
			var fMatnr = new Filter({
				path: 'Matnr',
				operator: FilterOperator.Contains,
				value1: sMatnr
			});
			var fWerks = new Filter({
				path: 'Werks',
				operator: FilterOperator.Contains,
				value1: sWerks
			});
			var fVkorg = new Filter({
				path: 'Vkorg',
				operator: FilterOperator.Contains,
				value1: sVkorg
			});
			var fLgort = new Filter({
				path: 'Lgort',
				operator: FilterOperator.Contains,
				value1: sLgort
			});
			var fCheck = new Filter({
				path: 'Zflag',
				operator: FilterOperator.Contains,
				value1: sCheck
			});
			var fLote = new Filter({
				path: 'Zlote',
				operator: FilterOperator.Contains,
				value1: sLote
			});
			var aFilters = [fMatnr, fWerks, fVkorg, fLgort, fCheck, fLote];
			var qjson = "&format=json";

			return new Promise(function (resolve, reject) {
				this.oModelOdata.read("/ZST_LO_09Set", {
					filters: aFilters,
					success: function (oResponse) {
						that.getView().setModel(new sap.ui.model.json.JSONModel(oResponse.results), "zst09data");
						resolve();
					},
					error: function (oError) {
						that.oError = oError;
						reject(oError);
					}
				});
			}.bind(this));
		},

		creacionPedidoVentas: function (oEvn) {
			var aSelected = [];
			// this.oModelAppData.setProperty("/oSelected");
			// Obtención del ID los datos de listado
			// var gv_tbl = this.getView().byId("idTable")

			// Obtención del indice de lineas seleccionadas del listado
			var aIdxSeleccion = this.oTable.getSelectedIndices(),
				aSeleccion = [],
				sWerks,
				bWerksOk = true;
			
			if(!aIdxSeleccion.length){
				sap.m.MessageToast.show("Debe seleccionar al menos una línea del listado");
			}else{
				
				for (let item of aIdxSeleccion) {
					
					let sPath = this.oTable.getContextByIndex(item).getPath();
					let oItem = this.oTable.getBinding().getModel().getProperty(sPath)
				   
					if( !sWerks ) sWerks = oItem.Werks;
					if(sWerks !== oItem.Werks){
						sap.m.MessageToast.show("No se puede crear un pedido con centros diferentes");
						bWerksOk = false;
					}else{
						
						oItem.Zcanti = 0; // Cantidad
						oItem.Zprecionet = oItem.Zprecio1;
						oItem.Zprecio2 = 0.0; // Envasado
						oItem.Zmargen1 = 0.0; // Cambiado
						oItem.Zmargen2 = 0.0; // Cambiado
						oItem.Zdes1 = 0.0; // Sin utilizar
						oItem.Zdes2 = 0.0; // Arancel
						oItem.Zincofas = 0.0; // Incoterm FAS
						oItem.Zincocif = 0.0; // Incoterm CIF
						oItem.Zporte = 0.0; // Porte
						oItem.Zcondpago = 0.0; // Condición de Cliente
						oItem.Zinco1 = ''; // Incoterm 1
						oItem.Zinco2 = oItem.Lgobe; // Incoterm 2
						
						aSeleccion.push(oItem);
					}
				}
				
				if(bWerksOk){
					this.oModelAppData.setProperty("/tableFields", aSeleccion);
					this.goToView3();
				}else{
					sap.m.MessageToast.show("No se puede crear un pedido con centros diferentes");
				}
			}
		}

	});
});