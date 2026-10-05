sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.View1", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			this.getView().setModel(this.oModelAppData, "appData");

			this.sURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');

			// instanciacion de los elementos de pantalla para facilitar acceso
			this.labelWerks = this.getView().byId("IDWerksLabelF4");
			this.inputWerks = this.getView().byId("IDWerksNumberF4");
			this.inputMatnr = this.getView().byId("IDMatnrLabelF4");
			this.inputVkorg = this.getView().byId("IDOrgVtasLabelF4");
			this.inputLgort = this.getView().byId("IDLgortLabelF4");

			this._setMatchCodes();

			// Comprobar si hay rol seteado
			this.createRolesModel();
			this.oRouter.attachRouteMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			if (oEvent.getParameter("view").getViewName() === this.getView().getViewName()) {
				this._cleanScreen();
				this.oModelAppData.setProperty("/viewFrom", this.getView().getViewName());
			}
		},

		goToView2: function () {
			//this.getOwnerComponent().getRouter().navTo("View2");
			this.oRouter.navTo("View2");
		},

		goToView3: function () {
			this.oRouter.navTo("View3");
		},

		////////////////////////////////////////////////////////////////////////////
		// AYUDAS DE BUSQUEDA CAMPO DE SELECCIÓN
		// INICIO
		////////////////////////////////////////////////////////////////////////////
		_setMatchCodes: function () {

			// Obtención de los datos de la ayuda de busqueda del material para el texto predictivo
			var HelpURLmatnr = this.sURL + "/sap/opu/odata/SAP/ZAYUDAMATNR_SRV/Mat0mSet";
			this.matnrModel = new sap.ui.model.json.JSONModel();
			this.matnrModel.setSizeLimit(9999);
			this.matnrModel.loadData(HelpURLmatnr, null, false);
			this.getView().setModel(this.matnrModel, "materiales");

			var HelpURLvkorg = this.sURL + "/sap/opu/odata/SAP/ZAYUDAWERKS_SRV/ZmcSd07Set";
			this.vkorgModel = new sap.ui.model.json.JSONModel();
			this.vkorgModel.setSizeLimit(9999);
			this.vkorgModel.loadData(HelpURLvkorg, null, false);
			this.getView().setModel(this.vkorgModel, "vkorg");

			var HelpURLlgort = this.sURL + "/sap/opu/odata/SAP/ZAYUDALGORT_SRV/ZmcSd06Set";
			this.lgortModel = new sap.ui.model.json.JSONModel();
			this.lgortModel.setSizeLimit(9999);
			this.lgortModel.loadData(HelpURLlgort, null, false);
			this.getView().setModel(this.lgortModel, "almacen");

		},

		onLiveSearch: function (oEvent) {

		},

		/** Ayuda de Busqueda Número de Material	 */
		onF4Matnr: function () {
			var that = this;

			// Tabla con los valores de la ayuda de busqueda
			var HelpTableMatnr = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes a true
				width: "40em"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			//var ValueHelpMatnr = new sap.ui.ux3.ToolPopup({
			var ValueHelpMatnr = new sap.m.Popover({
				modal: true,
				title: "Material",
				afterClose: function () {
					console.log(that._valueHelpDialog);
					var Contextmatnr = HelpTableMatnr.getContextByIndex(HelpTableMatnr.getSelectedIndex());
					if (Contextmatnr && Contextmatnr.getModel()) {
						var Selmatnr = Contextmatnr.getModel().getProperty(Contextmatnr.getPath());
						that.inputMatnr.setSelectedKey(Selmatnr.Matnr);
						that.oModelAppData.setProperty("/matnr", Selmatnr.Matnr);
						that.inputMatnr.setValue(Selmatnr.Maktg);
						that.oModelAppData.setProperty("/maktg", Selmatnr.Maktg);
					}
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonmatnr = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpMatnr.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda
			// Columna Descripción Material
			HelpTableMatnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción Material"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Maktg"),
					//width: "2.5em",
					sortProperty: "Maktg",
					filterProperty: "Maktg",
					columnMenuOpen: that._columnMenuOpen
				})
			);

			// Columna Idioma
			HelpTableMatnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Idioma"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Spras"),
					width: "5em",
					sortProperty: "Spras",
					filterProperty: "Spras",
					columnMenuOpen: that._columnMenuOpen
				})
			);

			// Código Material
			HelpTableMatnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Mat."
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Matnr"),
					sortProperty: "Matnr",
					filterProperty: "Matnr",
					columnMenuOpen: that._columnMenuOpen
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelmatnr = new sap.ui.model.json.JSONModel();
			var HelpURLmatnr = this.sURL + "/sap/opu/odata/SAP/ZAYUDAMATNR_SRV/Mat0mSet";

			HelpTableMatnr.setModel(this.matnrModel);
			//this.getView().setModel(HelpModelmatnr, "materiales");
			// HelpTableMatnr.bindAggregation("rows", "/d/results");
			HelpTableMatnr.bindRows("/d/results");

			ValueHelpMatnr.addContent(HelpTableMatnr);
			ValueHelpMatnr.setEndButton(OkButtonmatnr);
			ValueHelpMatnr.openBy(this.inputMatnr);
		},

		/**  Ayuda de Busqueda Centro	 */
		onF4Vkorg: function () {
			var that = this;
			// Tabla con los valores de la ayuda de busqueda
			var HelpTablevkorg = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //Antes a true
				width: "30em"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpvkorg = new sap.m.Popover({
				modal: true,
				title: "Org. Vtas.",
				afterClose: function (oEvnt) {

					var Contextvkorg = HelpTablevkorg.getContextByIndex(HelpTablevkorg.getSelectedIndex());
					if (Contextvkorg && Contextvkorg.getModel()) {
						var Selvkorg = Contextvkorg.getModel().getProperty(Contextvkorg.getPath());
						that.inputVkorg.setSelectedKey(Selvkorg.Vkorg);
						that.oModelAppData.setProperty("/vkorg", Selvkorg.Vkorg);
						that.inputVkorg.setValue(Selvkorg.VkorgDesc);
						that.oModelAppData.setProperty("/vkorgDesc", Selvkorg.VkorgDesc);
						that.getRoleModelFromSAP(Selvkorg.Vkorg);
					}
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonvkorg = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpvkorg.close();
					//oEvent.getSource().getParent().close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Org Vtas
			HelpTablevkorg.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Org. Vtas."
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Vkorg"),
					sortProperty: "Vkorg",
					width: "6em",
					filterProperty: "Vkorg",
					columnMenuOpen: that._columnMenuOpen
				})
			);

			// Columna Denominación Org Vtas
			HelpTablevkorg.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Denominación Org. Vtas."
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "VkorgDesc"),
					sortProperty: "VkorgDesc",
					//width: "3.4em",
					filterProperty: "VkorgDesc",
					columnMenuOpen: that._columnMenuOpen
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelvkorg = new sap.ui.model.json.JSONModel();
			// var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			// var HelpURLvkorg = oUrl + "/sap/opu/odata/SAP/ZAYUDAWERKS_SRV/ZmcSd07Set";
			var HelpURLvkorg = this.sURL + "/sap/opu/odata/SAP/ZAYUDAWERKS_SRV/ZmcSd07Set";

			HelpModelvkorg.loadData(HelpURLvkorg, false);
			HelpTablevkorg.setModel(HelpModelvkorg);
			HelpTablevkorg.bindAggregation("rows", "/d/results");

			ValueHelpvkorg.addContent(HelpTablevkorg);
			ValueHelpvkorg.setEndButton(OkButtonvkorg);
			ValueHelpvkorg.openBy(this.inputVkorg);

		},

		/** Ayuda de Busqueda Almacén	 */
		onF4Lgort: function () {
			var that = this;
			var gv_vkorg = this.inputVkorg.getSelectedKey(); // Org.Vtas.

			if (!gv_vkorg || gv_vkorg === "") {
				sap.m.MessageToast.show("La organización de ventas es obligatoria");
			} else {
				// Tabla con los valores de la ayuda de busqueda
				var HelpTablelgort = new sap.ui.table.Table({
					selectionMode: sap.ui.table.SelectionMode.Single,
					selectionBehavior: "Row",
					visibleRowCount: 7,
					enableColumnFreeze: false, //antes a true
					width: "45em"
				});
				// Parámetros del PopUP de la ayuda de busqueda
				var ValueHelplgort = new sap.m.Popover({
					modal: true,
					title: "Almacén",
					afterClose: function () {

						var Contextlgort = HelpTablelgort.getContextByIndex(HelpTablelgort.getSelectedIndex());
						if (Contextlgort && Contextlgort.getModel()) {
							var Sellgort = Contextlgort.getModel().getProperty(Contextlgort.getPath());
							that.labelWerks.setValue(Sellgort.Name1);
							that.oModelAppData.setProperty("/werksDesc", Sellgort.Name1);
							that.inputWerks.setValue(Sellgort.Werks);
							that.oModelAppData.setProperty("/werks", Sellgort.Werks);
							that.inputLgort.setSelectedKey(Sellgort.Lgort);
							that.oModelAppData.setProperty("/lgort", Sellgort.Lgort);
							that.inputLgort.setValue(Sellgort.Lgobe);
							that.oModelAppData.setProperty("/lgobe", Sellgort.Lgobe);
						}
					}
				});

				// Botón de la Ayuda de busqueda
				var OkButtonlgort = new sap.m.Button({
					text: "OK",
					press: function (oEvent) {
						//oEvent.getSource().getParent().close();
						ValueHelplgort.close();
					}
				});

				// Diferentes Columnas de la Ayuda de busqueda

				// Columna Centro
				HelpTablelgort.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Centro"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Werks"),
						width: "6em",
						sortProperty: "Werks",
						filterProperty: "Werks",
						columnMenuOpen: that._columnMenuOpen
					})
				);

				// Columna Denominación Centro
				HelpTablelgort.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Denominación Centro"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Name1"),
						sortProperty: "Name1",
						width: "16.5em",
						filterProperty: "Name1",
						columnMenuOpen: that._columnMenuOpen
					})
				);

				// Columna Almacén
				HelpTablelgort.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Almacén"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Lgort"),
						width: "6em",
						sortProperty: "Lgort",
						filterProperty: "Lgort",
						columnMenuOpen: that._columnMenuOpen
					})
				);

				// Columna Descripción Almacén
				HelpTablelgort.addColumn(
					new sap.ui.table.Column({
						label: new sap.ui.commons.Label({
							text: "Descripción Almacén"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Lgobe"),
						sortProperty: "Lgobe",
						width: "16.5em",
						filterProperty: "Lgobe",
						columnMenuOpen: that._columnMenuOpen
					})
				);

				// Obtención de los valores de la ayuda de busqueda empleada
				var HelpModellgort = new sap.ui.model.json.JSONModel();
				//var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
				//var HelpURLlgort = oUrl + "/sap/opu/odata/SAP/ZAYUDALGORT_SRV/ZmcSd06Set";
				var HelpURLlgort = this.sURL + "/sap/opu/odata/SAP/ZAYUDALGORT_SRV/ZmcSd06Set";

				var querywerks = "$filter=Werks eq '" + gv_vkorg + "'";
				var qjson = "&format=json";

				var querydef = querywerks + qjson;

				HelpModellgort.loadData(HelpURLlgort, querydef, true, "GET", false, true);
				HelpTablelgort.setModel(HelpModellgort);
				HelpTablelgort.bindAggregation("rows", "/d/results");

				ValueHelplgort.addContent(HelpTablelgort);
				ValueHelplgort.setEndButton(OkButtonlgort);
				ValueHelplgort.openBy(this.inputLgort);
			}
		},

		////////////////////////////////////////////////////////////////////////////
		// AYUDAS DE BUSQUEDA CAMPO DE SELECCIÓN
		// FIN
		////////////////////////////////////////////////////////////////////////////

		/**  Creates the default role model
		 * to handle the visibility of the buttons */
		createRolesModel: function () {

			var rolesModel = new sap.ui.model.json.JSONModel({
				rdCheckBox: true, // Resgistros sin cantidad disponible
				rdBarcos: true, // Barcos/Aduanas
				rdCrear: true, // Crear Pedido
				rdBuscar: true, // Buscar
				rdAlmacenes: true, // Almacenes
				rdMaterial: true
			});

			this.oModelAppData.setProperty("/rolesModel", rolesModel)
		},

		/**  Esta funcion recibe la organizacion de ventas y llama
		 * al oData ZROLES para coger los roles. (ZST_LO_15) */
		getRoleModelFromSAP: function (vkorg) {
			var that = this;
			this.setPermissionsModel(vkorg);

			// var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			// var rolesURL = oUrl + "/sap/opu/odata/SAP/ZROLES_SRV/";
			var rolesURL = this.sURL + "/sap/opu/odata/SAP/ZROLES_SRV/";

			//sap.ui.controller("view.View1").createDefaultTableFieldsModel();
			this.createDefaultTableFieldsModel();
			var parametersbapi2 = {};

			//	parametersbapi2.Zflag = 'X'; // Observaciones
			parametersbapi2.Zflag = 1; // Zflag
			parametersbapi2.Vkorg = vkorg; // Organizacion de ventas
			var oModelbapi = new sap.ui.model.odata.ODataModel(rolesURL, false);
			oModelbapi.callFunction("zzroles",
				"GET",
				parametersbapi2,
				null,
				function (oDatabapi, responsebapi) {

					var role = responsebapi.data;
					console.log("ROLE");
					console.log(responsebapi);
					console.log(role);

					that.setRoleModel(role);

					parametersbapi2.Zflag = 2; //
					oModelbapi.callFunction("zzcampostabla",
						"GET",
						parametersbapi2,
						null,
						function (oDatabapi2, responsebapi2) {

							var role2 = responsebapi2.data;
							console.log("VISIBLE");
							console.log(responsebapi2);

							//sap.ui.controller("view.View1").setTableFieldsModel(role2);
							that.setTableFieldsModel(role2);

						},
						function () {
							//	sap.ui.controller("view.View1").setDefaultTableFieldsModel(undefined);
							sap.m.MessageToast.show("Error cargando los roles. Más info en transacción '/IWFND/ERROR_LOG'");
						});

				},
				function () {
					//sap.ui.controller("view.View1").setRoleModel(undefined);
					that.setRoleModel(undefined);
					sap.m.MessageToast.show("Error cargando los roles. Más info en transacción '/IWFND/ERROR_LOG'");
				});

		},

		/**
		 * Sets a set of buttons to visible 
		 * depending on a role based on the user
		 * and the work center
		 */
		setRoleModel: function (role) {
			var roles = {};
			var permissionModel = new sap.ui.model.json.JSONModel("PermissionsModel");

			if (role === undefined || role === null) {
				roles = {
					rdCheckBox: true, // Resgistros sin cantidad disponible
					rdMaterial: true, // Material
					rdBarcos: true, // Barcos/Aduanas
					rdCrear: true, // Crear Pedido
					rdBuscar: true, // Buscar
					rdAlmacenes: true // Almacenes
				};

				permissionModel.setData({
					documentTypeId: "ZFIR", // Document type
					documentTypeDesc: "PEDIDO FIRME",
					condicionCobroId: "", // Concicion cobro
					condicionCobroDesc: ""
				});

			} else {

				//Set the data coming from oData	
				roles = {
					rdCheckBox: role.Rdcheckbox == "X" ? true : false, // Resgistros sin cantidad disponible
					rdMaterial: role.Rdmaterial == "X" ? true : false, // Material
					rdBarcos: role.Rdbarcos == "X" ? true : false, // Barcos/Aduanas
					rdCrear: role.Rdcrear == "X" ? true : false, // Crear Pedido
					rdBuscar: role.Rdbuscar == "X" ? true : false, // Buscar
					rdAlmacenes: role.Rdalmacenes == "X" ? true : false // Almacenes
				};

				permissionModel.setData({
					documentTypeId: role.documentTypeId, // Document type
					documentTypeDesc: role.documentTypeDesc,
					condicionCobroId: "", // Concicion cobro
					condicionCobroDesc: ""
				});
			}

			/*			roles = {
							rdCheckBox: true, // Resgistros sin cantidad disponible
							rdMaterial: true, // Material
							rdBarcos: true, // Barcos/Aduanas
							rdCrear: true, // Crear Pedido
							rdBuscar: true, // Buscar
							rdAlmacenes: true // Almacenes
						};*/

			//Save the roles model
			//Save the permissions Model
			this.getView().setModel(permissionModel, "PermissionsModel");
			this.oModelAppData.setProperty("/PermissionsModel", permissionModel);
			this.getView().setModel(new sap.ui.model.json.JSONModel(roles), "ShowButtonsByRole");
			this.oModelAppData.setProperty("/ShowButtonsByRole", new sap.ui.model.json.JSONModel(roles));
		},

		/**
		 * Sets a default value on documentType
		 * and paymentCondition fields
		 * depending on a role based on the user
		 * and the work center
		 */
		setPermissionsModel: function (role) {

			console.log(role);
			var permissionModel = new sap.ui.model.json.JSONModel("ShowButtonsByRole");

			if (role === undefined || role === null) {
				permissionModel.setData({
					documentTypeId: "ZFIR", // Document type
					documentTypeDesc: "PEDIDO FIRME",
					condicionCobroId: "", // Concicion cobro
					condicionCobroDesc: ""
				});

			} else {
				//Set the data coming from oData	
				permissionModel.setData({
					documentTypeId: role.documentTypeId, // Document type
					documentTypeDesc: role.documentTypeDesc,
					condicionCobroId: "", // Concicion cobro
					condicionCobroDesc: ""
				});

				console.log("permissionModel");
				console.log(permissionModel);
			}
			//Save the permissions Model
			this.oModelAppData.setProperty("/PermissionsModel", permissionModel);

		},

		/**
		 * Creates de default values for the custom fields
		 * in the create delivery table
		 */
		createDefaultTableFieldsModel: function () {
			var tableFieldsModel = {
				Zprecio1Visible: true, //precio base
				Zprecio1Editable: false,
				Zprecio1Title: "Precio Base",
				ZprecioTarifaVisible: true, // precio tarifa
				//ZprecioTarifaEditable: false,
				ZprecioTarifaTitle: "Precio Tarifa",
				Zprecio2Visible: true, // envasado
				Zprecio2Editable: true,
				Zprecio2Title: "Envasado",
				Zmargen1Visible: true, // margen1
				Zmargen1Editable: true,
				Zmargen1Title: "Margen Positivo",
				Zmargen2Visible: true, // margen2
				Zmargen2Editable: true,
				Zmargen2Title: "Margen Negativo",
				Zdes2Visible: true, // Arancel
				Zdes2Editable: true,
				Zdes2Title: "+ Arancel",
				ZincocifVisible: true, // CIF a FAS
				ZincocifEditable: false,
				ZincocifTitle: "+ de CIF a FAS",
				ZincofasVisible: true, // FAS a FCA
				ZincofasEditable: false,
				ZincofasTitle: "+ de FAS a FCA",
				ZporteVisible: true, // Porte de Vta
				ZporteEditable: true,
				ZporteTitle: "+ Porte vta",
				ZcondpagoVisible: true, // Condicion cliente
				ZcondpagoEditable: false,
				ZcondpagoTitle: "Cond. cliente",
				Zfechaentdesdevisible: true,//fecha desde
				Zfechaentdesdeeditable: true,
				Zfechaentdesdetitle: "Fecha Desde",
				Zfechaenthastavisible: true,//fecha hasta
				Zfechaenthastaeditable: true,
				Zfechaenthastatitle: "Fecha Hasta"

			};

			this.oModelAppData.setProperty("/visibleColumsView3", tableFieldsModel);
		},

		/**
		 * Sets custom values into the custom fields of the 
		 * create delivery table
		 */
		setTableFieldsModel: function (role) {

			var tableFieldsModel = {
				Zprecio1Visible: (role.Zprecio1visible == "X") ? true : false, //precio base
				Zprecio1Editable: (role.Zprecio1editable == "X") ? true : false,
				Zprecio1Title: (role.Zprecio1title) ? role.Zprecio1title : "Precio Base",
				ZprecioTarifaVisible: (role.Zpreciotarifavisible == "X") ? true : false, // precio tarifa
				//	ZprecioTarifaEditable: (role.Zpreciotarifaeditable == "X") ? true : false,
				ZprecioTarifaTitle: (role.Zpreciotarifatitle) ? role.Zpreciotarifatitle : "Precio Tarifa",
				Zprecio2Visible: (role.Zprecio2visible == "X") ? true : false, // envasado
				Zprecio2Editable: (role.Zprecio2editable == "X") ? true : false,
				Zprecio2Title: (role.Zprecio2title) ? role.Zprecio2title : "+ Envasado",
				Zmargen1Visible: (role.Zmargen1visible == "X") ? true : false, // margen1
				Zmargen1Editable: (role.Zmargen1editable == "X") ? true : false,
				Zmargen1Title: (role.Zmargen1title) ? role.Zmargen1title : "± Margen 1",
				Zmargen2Visible: (role.Zmargen2visible == "X") ? true : false, // margen2
				Zmargen2Editable: (role.Zmargen2editable == "X") ? true : false,
				Zmargen2Title: (role.Zmargen2title) ? role.Zmargen2title : "± Margen 2",
				Zdes2Visible: (role.Zdes2visible == "X") ? true : false, // Arancel
				Zdes2Editable: (role.Zdes2editable == "X") ? true : false,
				Zdes2Title: (role.Zdes2title) ? role.Zdes2title : "+ Arancel",
				ZincocifVisible: (role.Zincocifvisible == "X") ? true : false, // CIF a FAS
				ZincocifEditable: (role.Zincocifeditable == "X") ? true : false,
				ZincocifTitle: (role.Zincociftitle) ? role.Zincociftitle : "+ de CIF a FAS",
				ZincofasVisible: (role.Zincofasvisible == "X") ? true : false, // FAS a FCA
				ZincofasEditable: (role.Zincofaseditable == "X") ? true : false,
				ZincofasTitle: (role.Zincofastitle) ? role.Zincofastitle : "+ de FAS a FCA",
				ZporteVisible: (role.Zportevisible == "X") ? true : false, // Porte de Vta
				ZporteEditable: (role.Zporteeditable == "X") ? true : false,
				ZporteTitle: (role.Zportetitle) ? role.Zportetitle : "+ Porte vta",
				ZcondpagoVisible: (role.Zcondpagovisible == "X") ? true : false, // Condicion de pago
				ZcondpagoEditable: (role.Zcondpagoeditable == "X") ? true : false,
				ZcondpagoTitle: (role.Zcondpagotitle) ? role.Zcondpagotitle : "± Cond. cliente",
				Zfechaentdesdevisible: (role.Zfechaentdesdevisible == "X") ? true : false, // fecha desde
				Zfechaentdesdeeditable: (role.Zfechaentdesdeeditable == "X") ? true : false,
				Zfechaentdesdetitle: (role.Zfechaentdesdetitle) ? role.Zfechaentdesdetitle : "Fecha Desde",
				Zfechaenthastavisible: (role.Zfechaenthastavisible == "X") ? true : false, // fecha hasta
				Zfechaenthastaeditable: (role.Zfechaenthastaeditable == "X") ? true : false,
				Zfechaenthastatitle: (role.Zfechaenthastatitle) ? role.Zfechaenthastatitle : "Fecha Hasta"
			};

			this.oModelAppData.setProperty("/visibleColumsView3", tableFieldsModel);
		},

		/** BLOQUE DE CÓDIGO TRASPASADO DE LA VISTA */
		onSearch: function () {
			var that = this;
			var oView = this.getView();
			var sVkorgCode = that.oModelAppData.getProperty("/vkorg");
			var sWerksCode = that.oModelAppData.getProperty("/werks"); // Centro

			if (!sWerksCode || sWerksCode === "") {
				sWerksCode = sVkorgCode;
				that.oModelAppData.setProperty("/werks", sWerksCode)
			}

			that.oModelAppData.setProperty("/maktg", that.oModelAppData.getProperty("/matnrDesc"));
			that.oModelAppData.setProperty("/lgobe", that.oModelAppData.getProperty("/lgortDesc"));



			if (!sVkorgCode || sVkorgCode === "") {
				sap.m.MessageToast.show("La organización de ventas es obligatoria");
			} else {
				// Comprobación del Rol del Usuario del sistema
				var parameters = {
					Zflag: 'R', // Flag marcado con una R para realizar que el usuario tiene el rol de SAPUI5
					Werks: sWerksCode,
					Vkorg: sVkorgCode
				};

				// oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
				// var urlbapi = oUrl + "/sap/opu/odata/sap/ZROLES_SRV/";
				var urlbapi = that.sURL + "/sap/opu/odata/sap/ZROLES_SRV/";

				// Llamada a la función para comprobar en R3 el rol del usuario
				var oModelbapi = new sap.ui.model.odata.ODataModel(urlbapi, false);
				oModelbapi.callFunction("zzrol",
					"GET",
					parameters,
					null,
					function (oDatabapi, responsebapi) {
						if (responsebapi.data.Zrol === "X") {
							if (responsebapi.data.Message !== "") {
								sap.m.MessageToast.show(responsebapi.data.Message);
							} else {

								var chState = oView.byId("Idcheckbox").getSelected();
								that.oModelAppData.setProperty("/bCheckBox", chState);

								var chLote = oView.byId("rdBarcos").getSelected();
								that.oModelAppData.setProperty("/rBarcos", chLote);

								// Llamada al método onSubmit para obtener los datos del listado
								that.onCheckRol(responsebapi.data.Zvalorrol, responsebapi.data.Zparva);
								//Guardamos el centro del empleado
								//document.cookie = "centroEmpleado=" + responsebapi.data.Zparva;
								that.oModelAppData.setProperty("/centroEmpleado", responsebapi.data.Zparva);
								that.oModelAppData.setProperty("/nombreEmpleado", responsebapi.data.Zuname);
								that.goToView2();
							}
						} else {
							// Mensaje al usuario que no tiene en su perfil el usuario de SAPUI5
							var gvmensaje = 'El usuario ' + responsebapi.data.Zuname + ' no tiene permisos para entrar a la aplicación';
							sap.m.MessageToast.show(gvmensaje);
						}
					},
					function () {
						// Mensaje cuando se produce un error al comprobar el Rol en R3
						sap.m.MessageToast.show("Error al comprobar el Rol");
					});
			}
		},

		onCheckRol: function (userId, userPlant) {

			this.centroEmpleado = userPlant;

			// Comprobación si el usuario tiene el rol de gerente o de comercial y se crea un boolean
			var gerentView = (userId === "ZGERENTE");

			// Modelo de campos a visualizar en función del usuario
			var visibleColumns = {
				codMaterial: gerentView,
				codAlmacen: gerentView,
				ctdUnitCompra: gerentView,
				ctdUnitTraspaso: gerentView,
				ctdUnitVenta: gerentView,
				ctdUnitRetirado: gerentView,
				ctdUnitPteRetira: gerentView,
				ctdUnitStock: gerentView,
				costeAdquisic: gerentView
			}

			this.oModelAppData.setProperty("/visibleColumns", visibleColumns)
		},

		onCreateOrder: function () {
			var that = this;
			var oAppData = this.oModelAppData.getData();
			var sVkorgCode = oAppData.vkorg;
			var sWerksCode = oAppData.werks; // Centro

			if (!sWerksCode || sWerksCode === "") {
				sWerksCode = sVkorgCode;
				that.oModelAppData.setProperty("/werks", sWerksCode)
			}

			if (!sVkorgCode || sVkorgCode === "") {
				sap.m.MessageToast.show("La organización de ventas es obligatoria");
			} else {
				//sVkorgCode = sap.ui.getCore().byId("inpVkorgCode").getValue();
				var parameters = {
					Zflag: 'S', // Flag marcado con una S para realizar que el usuario tiene el rol de Realizar Pedidos sin Disponibilidad
					Werks: sWerksCode,
					Vkorg: sVkorgCode
				};

				// oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
				// var urlbapi = oUrl + "/sap/opu/odata/sap/ZROLES_SRV/";
				var urlbapi = this.sURL + "/sap/opu/odata/sap/ZROLES_SRV/";

				// Llamada a la función para comprobar en R3 el rol del usuario
				var oModelbapi = new sap.ui.model.odata.ODataModel(urlbapi, false);
				oModelbapi.callFunction("zzrol",
					"GET",
					parameters,
					null,
					function (oDatabapi, responsebapi) {

						if (responsebapi.data.Zrol === "X") {

							if (responsebapi.data.Message !== "") {
								sap.m.MessageToast.show(responsebapi.data.Message);

							} else {

								// var gv_werks = that.getView().byId("IDWerksLabelF4").getValue(); // Centro
								// var gv_werks = oAppData.werksDesc; // Centro
								// var gv_vkorgCode = that.getView().byId("IDOrgVtasLabelF4").getValue(); // Org.Vtas.
								// var gv_vkorgCode = oAppData.vkorg; // Org. Vtas.
								// var gv_vkorgDesc = that.getView().byId("IDOrgVtasLabelF4").getValue(); // DescOrg.Vtas.
								// var gv_vkorgDesc = oAppData.vkorgDesc; // DescOrg. Vtas.
								// var gv_werksN = that.getView().byId("IDWerksNumberF4").getValue(); // Centro
								// var gv_werksN = oAppData.werks; // Código de Centro
								// var gv_lgobe = that.getView().byId("IDLgortLabelF4").getValue(); // Almacén
								// var gv_lgobe = oAppData.lgobe; // Almacén
								// var gv_lgort = that.getView().byId("IDLgortNumberF4").getValue(); // Almacén
								var gv_lgort = oAppData.lgort;

								if (oAppData.werks && oAppData.lgort) {
									var data = [];
									for (var i = 0; i < 3; i++) {
										data[i] = {
											Charg: "",
											Ebeln: "",
											Ebelp: "",
											Zinco2: oAppData.lgobe,
											Lgobe: oAppData.lgobe,
											Lgort: oAppData.lgort,
											Maktx: "Seleccione Material",
											Matnr: "",
											Mtart: "",
											Name1: oAppData.werksDesc,
											Werks: oAppData.werks,
											Vkorg: oAppData.vkorg,
											VkorgDesc: oAppData.vkorgDesc,
											Zcanti: "0.000",
											Zcompra: "0.00",
											Zcondpago: "0.00",
											Zcoste: "0.00",
											Zdes1: "0.00",
											Zdes2: "0.00",
											Zdisponible: "0.00",
											Zfabricacion: "0.00",
											Zflag: "Y",
											Zincocif: "0.00",
											Zincofas: "0.00",
											Zlote: "",
											Zlugar: "",
											Zmargen1: "0.00",
											Zmargen2: "0.00",
											Zobserva: "",
											Zporte: "0.00",
											Zprecio1: "0.00",
											Zprecio2: "0.00",
											Zpretirar: "0.00",
											Zpventa: "0.00",
											Zretirado: "0.00",
											Zstock: "0.00",
											Ztraspaso: "0.00",
											Zventa: "0.00",
											Zznombarco: "",
											Zcondclieditable: "",
											Zprecioeditable: ""

										};
									}
									// sap.ui.getCore().byId("idContainer").$().fadeOut("50");
									// setTimeout(function () {
									// 	sap.ui.controller("view.View3").onSubmit(data);
									// 	// Borrado de todos los elementos de la Vista1
									// 	sap.ui.getCore().byId("idContainer").removeAllContent();
									// 	// Se añade los elementos de la 
									// 	sap.ui.getCore().byId("idContainer").addContent(sap.ui.getCore().byId("idView3"));
									// }, 380);
									that.oModelAppData.setProperty("/tableFields", data);
									that.goToView3();

								} else {
									sap.m.MessageToast.show("Debe seleccionar el centro y el almacén");
								}
							}

						} else {
							// Mensaje al usuario que no tiene en su perfil el usuario de SAPUI5
							var gvmensaje = 'El usuario ' + responsebapi.data.Zuname + ' no tiene permisos para realizar esta acción';
							sap.m.MessageToast.show(gvmensaje);
						}

					},
					function () {
						// Mensaje cuando se produce un error al comprobar el Rol en R3
						sap.m.MessageToast.show("Error al comprobar el Rol");
					});
			}
		},

		onZSD016: function () {
			var sURL = this.sURL + "/sap/bc/gui/sap/its/webgui?~transaction=ZSD016_V1";
			window.open(sURL);
		},

		onZSD014: function () {
			var sURL = this.sURL + "/sap/bc/gui/sap/its/webgui?~transaction=ZSD014";
			window.open(sURL);
		},

		onZSD007: function () {
			var sURL = this.sURL + "/sap/bc/gui/sap/its/webgui?~transaction=ZSD007";
			window.open(sURL);
		},

		onChangeInput: function (oEvn) {
			var oSource = oEvn.getSource();

			this.oModelAppData.setProperty(`/${oSource.getName()}`, oEvn.getSource().getSelectedKey());
			this.oModelAppData.setProperty(`/${oSource.getName()}Desc`, oEvn.getSource().getValue());
		},

		onLiveChangeMatnr: function (oEvt) {
			var str = oEvt.getParameter("value");
			this.inputMatnr.setValue(str.toUpperCase());
		},

		onLiveChangeVkorg: function (oEvn) {
			var str = oEvn.getParameter("value");
			this.inputVkorg.setValue(str.toUpperCase());
			if (!str || str === "") {
				//sap.ui.getCore().byId("IDOrgVtasLabelF4").setValue("");
				this.inputVkorg.setValue("");
			}
		},

		onChangeVkorg: function (oEvn) {
			this.onChangeInput(oEvn);
			var str = oEvn.getSource().getSelectedKey();
			this.getRoleModelFromSAP(str);
		},

		onLiveChangeLgort: function (oEvn) {
			var str = oEvn.getParameter("value");
			this.inputLgort.setValue(str.toUpperCase());
		},
		/** BLOQUE DE CÓDIGO TRASPASADO DE LA VISTA */

		_cleanScreen: function () {
			this.oModelAppData.setProperty("/lgobe", null);
			this.oModelAppData.setProperty("/lgort", null);
			this.oModelAppData.setProperty("/lgortDesc", null);
			this.oModelAppData.setProperty("/maktg", null);
			this.oModelAppData.setProperty("/matnr", null);
			this.oModelAppData.setProperty("/matnrDesc", null);
			this.oModelAppData.setProperty("/werks", null);
			this.oModelAppData.setProperty("/werksDesc", null);

			this.inputLgort.setValue(null);
			this.inputMatnr.setValue(null);
			this.inputWerks.setValue(null);
		},

		onSelectLogistic: function (oEvn) {
			var oSource = oEvn.getSource();
			this.oModelAppData.setProperty("")
		},

		onVersion: function (oEvent) {
			localStorage.clear();
			console.log("version cargada");
			document.location.reload();
		},

		_columnMenuOpen: function (oEvt) {
			try {
				//Delegamos el evento onAfterRendering del Menú de la columna	
				this._onARDelegate = {
					"onAfterRendering": function () {
						//Buscamos los elementos del menú que sean filtros. 
						this.getMenu().getItems().forEach(function (oMenuItem) {
							const oMenuItemId = oMenuItem.getId();
							//Si contiene el id *filter* se trata de un filtro
							if (oMenuItemId.includes('filter')) {
								//Según está diseñado el control sap.ui.unified.MenuTextFieldItem, el elemento input asociado siempre tendrá el prefijo '-rt'
								//por lo que podremos buscar el elemento por su id excato
								for (let iFilterInput of $('#' + oMenuItemId + '-tf')) {
									iFilterInput.setAttribute('enterkeyhint', 'done')
								}
							}
						});
					}
				};
				oEvt.getParameter('menu').addEventDelegate(this._onARDelegate, this);
			} catch (exjs) {
				console.log("error")
			}
		}

	});
});