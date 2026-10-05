sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.View4", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this._onRouteMatched, this);
			
			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			this.getView().setModel(this.oModelAppData, "appData");
			
			this.sUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			
			var oModelDestinatario = {
				nombre1:"",
				nombre2:"",
				nombreCorto:"",
				paisKey:"",
				paisDesc:"",
				regionKey:"",
				regionDesc:"",
				poblacion:"",
				direccion:"",
				codPostal:"",
				telefono: "",
				vkorg:"",
				werks:"",
				crear: false,
				asignar: false
			}
			
			this.oModelAppData.setProperty("/destinatario", oModelDestinatario)
			
			this.oAppData = this.oModelAppData.getData();
		},
		
		onBeforeRendering: function(){
				
		},
		
		_onRouteMatched: function (oEvent) {
			if( oEvent.getParameter("view").getViewName() === this.getView().getViewName() ){
				this._setInputObjects();
				// Si venimos del listado de materiales/pantalla de selección limpiar campos
				this._cleanScreen();
				this.oModelAppData.setProperty("/viewFrom", this.getView().getViewName())
			}
		},
		
		goBack: function () {
			window.history.back()
		},
		
		_setInputObjects: function(){
			
			this.formulario = this.getView().byId("formDest");
			
			this.nombre1 = this.getView().byId("IDNombre1");
			this.nombre2 = this.getView().byId("IDNombre2");
			this.nombreCorto = this.getView().byId("IDNombreCorto");
			this.pais = this.getView().byId("IDKeyPais");
			this.valorPais = this.getView().byId("IDValorPais");
			this.region = this.getView().byId("IDKeyRegion");
			this.valorRegion = this.getView().byId("IDValorRegion");
			this.poblacion = this.getView().byId("IDPoblacion");
			this.direccion = this.getView().byId("IDDireccion");
			this.codPostal = this.getView().byId("IDCodPostal");
			this.telefono = this.getView().byId("IDCodTlf");
			this.nuevoDest = this.getView().byId("NuevoDestino");
			
			this.btnCrearDir = this.getView().byId("BtnCrearDireccion");
			this.btnAsignDir = this.getView().byId("BtnAsignarDireccion");
			
			this.orgVentas = this.oAppData.vkorg;
			this.centro = this.oAppData.werks;
			this.codCliente = this.oAppData.codCliente;
		},
		
		onValidarCampo: function(oEvn){
			var oInput = oEvn.getSource();
			
			if ( oInput.getRequired() && !oInput.getValue() ){
				oInput.setValueState("Error");
				oInput.setValueStateText("Campo Obligatorio");
				oInput.setShowValueStateMessage(true)
				return false;
			}else{
				oInput.setValueState("None");
				oInput.setValueStateText("");
				oInput.setShowValueStateMessage(false);
				return true;
			}
		},
		
		onValidarRequeridos: function(oEvn){
			var aFieldGrp = oEvn.getParameters().fieldGroupIds;
			var that = this;
			var bFlag = true;
			
			this.formulario.getAggregation("form").getVisibleFormContainers().forEach(
				(oFormContainer)=>{
					// Array de los objetos del formulario
					oFormContainer.getFormElements().forEach((oFormObj)=>{
						// Array de campos input del formulario
						oFormObj.getFields().forEach((oInput)=>{
							//hay que evitar VBox...
							if (oInput instanceof sap.m.InputBase)
								if ( oInput.getRequired() && !oInput.getValue() ){
									oInput.setValueState("Error");
									oInput.setValueStateText("Campo Obligatorio");
									oInput.setShowValueStateMessage(true)
									bFlag = false;
								}else{
									oInput.setValueState("None");
									oInput.setValueStateText("");
									oInput.setShowValueStateMessage(false);
									bFlag = true;
								}
						})
					})
				})
				
			this.oModelAppData.setProperty("/destinatario/crear", bFlag)
		},
		
		// Revisar funciones de destinatario.
		onPressCrearDestinatario: function(oEvn){
			var that = this;
			
			//this.onValidarRequeridos(oEvn)
			var busyDial = (this.getView().byId("IdloadDestinatario")) ? this.getView().byId("IdloadDestinatario") : new sap.m.BusyDialog(
			"IdloadDestinatario", {
				title: "Creando destinatario"
			});
			
			busyDial.open();

			setTimeout(function() {
				
				var cliente = that.codCliente;
				var nombre1 = that.nombre1.getValue();
				var nombre2 = that.nombre2.getValue();
				var nombreCorto = that.nombreCorto.getValue();
				var tlf = that.telefono.getValue();
				// var iva = sap.ui.getCore().byId("IDKeyIva").getValue();
				// var recargo = sap.ui.getCore().byId("IDKeyRecargo").getValue();
				var pais = that.pais.getValue();
				var region = that.region.getValue();
				var poblacion = that.poblacion.getValue();
				var direccion = that.direccion.getValue();
				var codPostal = that.codPostal.getValue();
				var orgVentas = that.orgVentas;
				var canal = "10";
				var sector = "10";
				var centro = that.centro;
				var grupoCtasDeudor = "CDME";
	
				var msgError = "";
				var correcto = false;
	
				if (!nombre1 || nombre1 === "") {
					msgError = "Nombre 1 obligatorio.";
				} else if (!nombreCorto || nombreCorto === "") {
					msgError = "Nombre corto obligatorio.";
				} else if (!pais || pais === "") {
					msgError = "País obligatorio.";
				} else if (!region || region === "") {
					msgError = "Región obligatoria.";
				} else if (!poblacion || poblacion === "") {
					msgError = "Población obligatoria.";
				} else if (!direccion || direccion === "") {
					msgError = "Dirección obligatoria.";
				} else if (!codPostal || codPostal === "") {
					msgError = "Código postal obligatorio.";
				}
	
				if (!msgError) {
					var entity = {};
	
					entity.Nombre1 = nombre1;
					entity.Nombre2 = nombre2;
					entity.Nombrecorto = nombreCorto;
					// entity.Tlf = tlf;
					// entity.Iva = iva;
					// entity.Recargo = recargo;
					entity.Pais = pais;
					entity.Region = region;
					entity.Poblacion = poblacion;
					entity.Direccion = direccion;
					entity.Codpostal = codPostal;
					entity.Orgventas = orgVentas;
					entity.Canal = canal;
					entity.Sector = sector;
					entity.Grupoctasdeudor = grupoCtasDeudor;
					entity.Centro = centro;
					entity.Kunnr = "";
					//entity.Cliente = sap.ui.getCore().byId("Idvalorcliente").getValue();
					entity.Cliente = cliente
					entity.Telf1 = tlf;
	
					var mParameters = {
						async: false,
						success: function(oData, oResponse) {
							msgError = "";
							correcto = true;
							that.nuevoDest.setValue(oData.Kunnr);
						},
						error: function(oError) {
							correcto = false;
							try {
								var xml = jQuery.parseXML(oError.response.body);
								msgError = xml.getElementsByTagName("message")[0].textContent;
							} catch (ex) {
								msgError = "Error al crear destinatario.";
							}
							that.nuevoDest.setValue("");
						}
					};
	
					var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
					var urlCrearDestino = oUrl + "/sap/opu/odata/sap/ZCREAR_DESTINATARIO_SRV/";
					try{
						// Llamada a la función para crear el destinatario
						var oModel = new sap.ui.model.odata.ODataModel(urlCrearDestino, false);
						oModel.create("/NuevoDestinoSet", entity, mParameters);
					}catch(err){
						sap.m.MessageToast.show(err);
					}
					if (correcto) {
						that.btnCrearDir.setIcon("sap-icon://message-success");
						that.btnCrearDir.setEnabled(false);
						var nuevoDest = that.nuevoDest.getValue();
						var msgExito = "Destinatario número '" + nuevoDest + "' creado con éxito";
						that.btnCrearDir.setTooltip(msgExito);
						sap.m.MessageToast.show(msgExito);
						that.btnAsignDir.setEnabled(true);
						
						that.nombre1.setEditable(false);
						that.nombre2.setEditable(false);
						that.nombreCorto.setEditable(false);
						// sap.ui.getCore().byId("IDTelefono").setEditable(false);
						// sap.ui.getCore().byId("IDValorIva").setEditable(false);
						// sap.ui.getCore().byId("IDKeyIva").setEditable(false);
						// sap.ui.getCore().byId("IDValorRecargo").setEditable(false);
						// sap.ui.getCore().byId("IDKeyRecargo").setEditable(false);
						that.valorPais.setEditable(false);
						that.pais.setEditable(false);
						that.valorRegion.setEditable(false);
						that.region.setEditable(false);
						that.poblacion.setEditable(false);
						that.direccion.setEditable(false);
						that.codPostal.setEditable(false);
						that.nuevoDest.setEditable(false);
						that.telefono.setEditable(false);
					} else {
						that.btnCrearDir.setIcon("sap-icon://error");
						that.btnCrearDir.setTooltip(msgError);
						sap.m.MessageToast.show(msgError);
					}
				} else {
					sap.m.MessageToast.show(msgError);
				}
	
				busyDial.close();
				busyDial.destroy();
			}, 0);
				
		},
		
		onPressAsignarDestinatario: function(){
			var entity = {};
			entity.Kunnr = this.codCliente;
			entity.Kunn2 = this.nuevoDest.getValue();
			entity.Vkorg = this.orgVentas;
			entity.Canal = "10";
			entity.Sector = "10";
			entity.Funcioninterl = "WE";
			var msgError = "";
			var that = this;
	
			if (!entity.Kunnr || entity.Kunnr === "") {
				msgError = "No se ha seleccionado un cliente previamente.";
			} else if (!entity.Kunn2 || entity.Kunn2 === "") {
				msgError = "No se ha creado ningún destinatario.";
			}
	
			if (!msgError || msgError === "") {
				var busyDial = (this.getView().byId("IdAssingDestinatario")) ? this.getView().byId("IdAssingDestinatario") : new sap.m.BusyDialog(
					"IdAssingDestinatario", {
						title: "Asignando destinatario al cliente"
					});
	
				busyDial.open();
	
				setTimeout(function() {
					var mParameters = {
						async: false,
						success: function(oData, oResponse) {
							var msgExito = "Destinatario " + oData.Kunn2 + "-" + that.nombreCorto.getValue() + " asignado a cliente " + oData.Kunnr + " con éxito.";
							sap.m.MessageToast.show(msgExito);
							that._cleanScreen();
						},
						error: function(oError) {
							try {
								var xml = jQuery.parseXML(oError.response.body);
								msgError = xml.getElementsByTagName("message")[0].textContent;
							} catch (ex) {
								msgError = "Error al asignar destinatario.";
							}
							that.btnAsignDir.setIcon("sap-icon://error");
							that.btnAsignDir.setTooltip(msgError);
							sap.m.MessageToast.show(msgError + ". Se ha enviado un correo avisando del error.");
						}
					};
					var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
					var urlCrearDestino = oUrl + "/sap/opu/odata/sap/ZCREAR_DESTINATARIO_SRV/";
	
					// Llamada a la función para crear el destinatario
					var oModel = new sap.ui.model.odata.ODataModel(urlCrearDestino, false);
					oModel.create("/InterlocutorSet", entity, mParameters);
					busyDial.close();
					busyDial.destroy();
				}, 0);
			} else {
				sap.m.MessageToast.show(msgError);
			}
		},
		
		// a revisar ayudas de búsqueda.
		onF4Pais: function(){
			var that = this;
			var HelpTablePais = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: true,
				width: "300pt"
			});
			
			var ValueHelpPais = new sap.m.Popover({
				modal: true,
				title: "Pais",
				afterClose: function () {
					that._closeF4Pais(HelpTablePais);
				}
			});
			
			var OkButtonPais = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpPais.close();
				}
			});

			HelpTablePais.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Código"
					}),
					width: '20%',
					template: new sap.ui.commons.TextView().bindProperty("text", "Land1"),
					sortProperty: "Land1",
					filterProperty: "Land1"
				})
			);
	
			HelpTablePais.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción"
					}),
					width: '70%',
					template: new sap.ui.commons.TextView().bindProperty("text", "Landx"),
					sortProperty: "Landx",
					filterProperty: "Landx"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelPais = new sap.ui.model.json.JSONModel();
	
			//var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var HelpURLPais = this.sUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV/PaisSet";
	
			HelpModelPais.loadData(HelpURLPais, false);
			HelpTablePais.setModel(HelpModelPais);
			HelpTablePais.bindAggregation("rows", "/d/results");
			
			ValueHelpPais.addContent(HelpTablePais);
			ValueHelpPais.setEndButton(OkButtonPais);
			ValueHelpPais.openBy(this.valorPais);          
				
		},
		
		_closeF4Pais: function(oTablePais){
		////////////////////////////////////////////////////////////////////////////////////////
			// Obtención del Nombre del Pais
			// var oCore = sap.ui.getCore();
			var Contextpais = oTablePais.getContextByIndex(oTablePais.getSelectedIndex());
			var Selpais = Contextpais.getModel().getProperty(Contextpais.getPath());
			this.pais.setValue(Selpais.Land1);
			this.oModelAppData.setProperty("/destinatario/paisKey", Selpais.Land1);
			////////////////////////////////////////////////////////////////////////////////////////
			// Obtención del Código del Pais
			this.valorPais.setValue(Selpais.Landx);
			this.oModelAppData.setProperty("/destinatario/paisDesc", Selpais.Landx);

		},
		
		onLiveChangePais: function(oEvn){
			var str = oEvn.getParameter("value");
			
			this.pais.setValue(str.toUpperCase());
			
			if(!str || str === ""){
				this.pais.setValue("");
				this.region.setValue("");
				this.valorRegion.setValue("");
			}
		},
		
		onSelectedItemPais: function(oEvn){
			var idPais = oEvn.getParameter("selectedItem").getKey();
			this.pais.setValue(idPais);
		},
		
		onF4Region: function(){
			var that = this;
			
			var paisSeleccionado = this.pais.getValue();
			if (paisSeleccionado) {
				var HelpTableRegion = new sap.ui.table.Table({
					selectionMode: sap.ui.table.SelectionMode.Single,
					selectionBehavior: "Row",
					visibleRowCount: 7,
					enableColumnFreeze: true,
					width: "300pt"
				});
	
				// Parámetros del PopUP de la ayuda de busqueda
				var ValueHelpRegion = new sap.m.Popover({
					modal: true,
					title: "Pais",
					afterClose: function () {
						that._closeF4Region(HelpTableRegion);
					}
				});
	
				// Botón de la Ayuda de busqueda
				var OkButtonRegion = new sap.m .Button({
					text: "OK",
					press: function(oEvent) {
						ValueHelpRegion.close();
					}
				});
	
				HelpTableRegion.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Código"
						}),
						width: '20%',
						template: new sap.ui.commons.TextView().bindProperty("text", "Bland"),
						sortProperty: "Bland",
						filterProperty: "Bland"
					})
				);
	
				HelpTableRegion.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Descripción"
						}),
						width: '70%',
						template: new sap.ui.commons.TextView().bindProperty("text", "Bezei"),
						sortProperty: "Bezei",
						filterProperty: "Bezei"
					})
				);
	
				// Obtención de los valores de la ayuda de busqueda empleada
				var HelpModelRegion = new sap.ui.model.json.JSONModel();
	
				// var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
	
				var HelpURLRegion = this.sUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV/RegionSet?$filter=(Land1 eq '" + paisSeleccionado + "')";
	
				HelpModelRegion.loadData(HelpURLRegion, false);
				HelpTableRegion.setModel(HelpModelRegion);
				HelpTableRegion.bindAggregation("rows", "/d/results");
				
				ValueHelpRegion.addContent(HelpTableRegion);
				ValueHelpRegion.setEndButton(OkButtonRegion);
				ValueHelpRegion.openBy(this.valorRegion);
			} else {
				sap.m.MessageToast.show("Seleccione un país.");
			}
			
		},
		
		_closeF4Region: function(oTableRegion){
			////////////////////////////////////////////////////////////////////////////////////////
			// Obtención del Nombre de la region
			// var oCore = sap.ui.getCore();
			// var regionInput = oCore.byId("IDKeyRegion");
			var Contextregion = oTableRegion.getContextByIndex(oTableRegion.getSelectedIndex());
			var Selregion = Contextregion.getModel().getProperty(Contextregion.getPath());
			this.region.setValue(Selregion.Bland)
			// regionInput.setValue(Selregion.Bland);
			////////////////////////////////////////////////////////////////////////////////////////
			// Obtención del Código de la region
			// var regionInputval = oCore.byId("IDValorRegion");
			var Contextregionval = oTableRegion.getContextByIndex(oTableRegion.getSelectedIndex());
			var Selpaisval = Contextregionval.getModel().getProperty(Contextregionval.getPath());
			this.valorRegion.setValue(Selpaisval.Bezei);
			// regionInputval.setValue(Selpaisval.Bezei);
		},
		
		onLiveChangeRegion: function(oEvn){
			var str = oEvn.getParameter("value");
			
			this.region.setValue(str.toUpperCase());
			this.valorRegion.setValue(str.toUpperCase());
			
			if(!str || str === ""){
				this.region.setValue("");
				this.valorRegion.setValue("");
			}
		},
		
		onSelectedItemRegion: function(oEvn){
			var idRegion = oEvn.getParameter("selectedItem").getKey();
			this.valorRegion.setValue(idRegion);
		},
		
		_cleanScreen: function(oEvn){
			this.nombre1.setValue("");
				this.nombre1.setEditable(true);
			this.nombre2.setValue("");
				this.nombre2.setEditable(true);
			this.nombreCorto.setValue("");
				this.nombreCorto.setEditable(true);
			this.pais.setValue("");
				this.pais.setEditable(true);
			this.valorPais.setValue("");
				this.valorPais.setEditable(true);
			this.region.setValue("");
				this.region.setEditable(true);
			this.valorRegion.setValue("");
				this.valorRegion.setEditable(true);
			this.poblacion.setValue("");
				this.poblacion.setEditable(true);
			this.direccion.setValue("");
				this.direccion.setEditable(true);
			this.codPostal.setValue("");
				this.codPostal.setEditable(true);
			this.telefono.setValue("");
				this.telefono.setEditable(true);
			
			this.btnCrearDir.setIcon("");
			this.btnCrearDir.setEnabled(true);
			this.btnCrearDir.setTooltip("");
			
			this.btnAsignDir.setIcon("");
			this.btnAsignDir.setEnabled(false);
			this.btnAsignDir.setTooltip("");
		}
		
	})
});