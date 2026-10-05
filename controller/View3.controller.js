sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sd_dfgrupo/sd_dfgrupo/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, formater, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("sd_dfgrupo.sd_dfgrupo.controller.View3", {
		formater: formater,
		onInit: function () {
			this.sUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var sObtencionOdata = this.sUrl + "/sap/opu/odata/SAP/ZOBTENCIONODATA_SRV"


			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModelAppData = this.getOwnerComponent().getModel("appData");
			this.oAppData = this.oModelAppData.getData();
			this.oAppData.bMaterialesCargados = false;
			this.oAppData.sMaterialesCargados = "Modelo de materiales no cargado asíncronamente aún, espere un poco y vuelva a intentarlo";

			this.oBusyDial = new sap.m.BusyDialog('IdSaveD', {
				title: 'Guardando pedido'
			});

			this.oModelMateriales = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: sObtencionOdata
			});
			this.oModelMateriales.setUseBatch(false);

			// Corrección aquí: Proporcionar el modelo y el nombre del alias
			this.getView().setModel(this.oModelAppData, "appData");
			this.getView().setModel(new sap.ui.model.json.JSONModel(this.oAppData.tableFields), "TableFields");
			this.getView().setModel(new sap.ui.model.json.JSONModel({}), "ErrorsModel");

			this.addButton = false;

			this.toVKM1 = "/sap/bc/gui/sap/its/webgui?~transaction=VKM1";
			this.toZSD010 = "/sap/bc/gui/sap/its/webgui?~transaction=*ZSD010";

			this.oRouter.attachRouteMatched(this._onRouteMatched, this);

		},

		onBeforeRendering: function () {
			this.initializeErrorModel();

			//Filtrado de materiales para las posiciones:

		},
		//Se llama al acabar de cargar todo el contenido
		_setFechaPedidoEditable: function () {

			var that = this;
			var orgVentas = this.oModelAppData.getProperty("/vkorg");
			var editable = true;

			var mParameters = {
				async: false,
				success: function (oData, oResponse) {
					if (oData.FechaPedido && oData.FechaPedido === "X") {
						editable = true;
					} else {
						editable = false;
					}

					that.dateFechaPedido.setEditable(editable);
				},
				error: function () {
					editable = true;
				}
			};
			var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var url = oUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV/MantDirEntSet(Vkorg='" + orgVentas + "')";
			var model = new sap.ui.model.odata.ODataModel(url, false);
			model.read("/", mParameters);

			// //SI FECHA_PEDIDO === '' => NO EDITABLE y se pone la fecha del dia
			// if (!editable) {
			// //	var vistaAnterior = sap.ui.getCore().getModel("session").getProperty("/VistaAnterior");
			// 	var oModelfecha = this.getView().getModel("ModelFecha");
			// 	if(!oModelfecha.getData()){

			// 		//Setear la fecha actual
			// 		oModelfecha = new sap.ui.model.json.JSONModel();
			// 		oModelfecha.setData({
			// 			dateValue1: new Date(), // Fecha Actual
			// 			dateValue2: undefined, // Campo vacio para que el usuario lo rellene (Fecha condición de cobro)
			// 			dateValue3: undefined // Campo vacio para que el usuario lo rellene (Almacen Pagado hasta)
			// 		});

			// 		sap.ui.getCore().setModel(oModelfecha);
			// 		//sap.ui.getCore().byId("Idfechaactual").setEditable(false);

			// 	}
			// 		this.dateFechaPedido.setEditable(editable); 

			// }

			// // Gpuado: Actualiza el input del cliente
			// var InputCliente = sap.ui.getCore().byId("IdclienteF4");
			// // Actualiza el modelo de acuerdo a los nuevos parámetros de filtrado
			// InputCliente.setModel(this.getClienteFiltrado()).bindAggregation("suggestionItems", "/d/results", new sap.ui.core.Item({
			// 	text: "{Mcod1}",
			// 	key: "{Kunnr}"
			// }), null);
		},

		_getClientes: function () {

			// Obtención de los valores de la ayuda de busqueda empleada
			this.kunnrModel = new sap.ui.model.json.JSONModel();

			//MODIFICACIÓN AARANDA 07/06/2018: FILTRAR CLIENTES POR ORGANIZACION DE VENTAS CUANDO SAP NOS LO DIGA
			var orgVentas = this.oAppData.vkorg;
			var filtrar = true;
			var mOrgVtas = new Map();
			mOrgVtas.set('Vkorg', this.oAppData.vkorg)

			var mParameters = {
				async: false,
				urlParameters: mOrgVtas,
				success: function (oData, oResponse) {
					if (oData.Direntrega && oData.Direntrega === "X") {
						filtrar = true;
					} else {
						filtrar = true;
					}
				},
				error: function () {
					filtrar = true;
				}
			};

			var HelpURLkunnr = "";

			if (filtrar) {
				HelpURLkunnr = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/DebiaSet?$filter=(Parvw eq 'AG' and Vkorg eq '" + orgVentas + "')";
			} else {
				HelpURLkunnr = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/DebiaSet?$filter=(Parvw eq 'AG')";
			}

			this.kunnrModel.setSizeLimit(9999);
			this.kunnrModel.loadData(HelpURLkunnr, false);
			this.getView().setModel(this.kunnrModel, "clientes");

		},

		_onRouteMatched: function (oEvent) {
			this.addButton = false;
			if (oEvent.getParameter("view").getViewName() === this.getView().getViewName()) {
				if (this.oModelAppData.getProperty("/viewFrom")) {
					// si accedemos de la primera o segunda pantalla limpiamos campos.
					this.addButton = this.oModelAppData.getProperty("/viewFrom").match("View2") ? false : true;

					this._setInputObjects();
					this.onSetInitialData();
				} else {
					this.goToView1();
				}
				this.oModelAppData.setProperty("/viewFrom", this.getView().getViewName());
			}
		},

		_setInputObjects: function () {
			/* Tratamiento de los campos como objetos js */
			this.buttonBack = this.getView().byId("idButton3");
			this.buttonAddRow = this.getView().byId("idButtonAdd");
			// Si venimos del listado de materiales no se muestra el boton de añadir registro.
			this.buttonAddRow.setVisible(this.addButton);
			this.inputCliente = this.getView().byId("IdclienteF4");
			this.inputCliente.addStyleClass("inputCustom");
			this.inputNumCliente = this.getView().byId("Idvalorcliente");
			this.inputNumCliente.addStyleClass("inputCustom");
			this.dateFechaPedido = this.getView().byId("Idfechaactual");
			this.dateFechaPedido.addStyleClass("inputCustom");
			this.inputCondCobro = this.getView().byId("IdcondicobroF4");
			this.inputCondCobro.addStyleClass("inputCustom");
			this.inputCondCobroDesc = this.getView().byId("Idvalcondicobro");
			this.inputCondCobroDesc.addStyleClass("inputCustom");
			this.dateFechaVencim = this.getView().byId("Idfechacondi");
			this.dateFechaVencim.addStyleClass("inputCustom");
			this.inputNumPedido = this.getView().byId("Idnumpedval");
			this.inputNumPedido.addStyleClass("inputCustom");
			this.inputDestinaMerca = this.getView().byId("IddestinaF4");
			this.inputDestinaMerca.addStyleClass("inputCustom");
			this.inputDestinaMercaDesc = this.getView().byId("Idvalordestina");
			this.inputDestinaMercaDesc.addStyleClass("inputCustom");
			this.inputClaseDoc = this.getView().byId("IdclasedocF4");
			this.inputClaseDoc.addStyleClass("inputCustom");
			this.inputClaseDocDesc = this.getView().byId("IdvalclasedocF4");
			this.inputClaseDocDesc.addStyleClass("inputCustom");
			this.inputViaPago = this.getView().byId("IdviapagoF4");
			this.inputViaPago.addStyleClass("inputCustom");
			this.inputMoneda = this.getView().byId("IdmonedaF4");
			this.inputMoneda.addStyleClass("inputCustom");
			this.inputComercial = this.getView().byId("Idcomercial");
			this.inputComercial.addStyleClass("inputCustom");
			this.inputPrecioAlm = this.getView().byId("Idprecioalmacenaje");
			this.inputPrecioAlm.addStyleClass("inputCustom");
			this.datePagadoHasta = this.getView().byId("Idalmacenpaga");
			this.datePagadoHasta.addStyleClass("inputCustom");
			this.inputRiesgoMax = this.getView().byId("Idriesgomax");
			this.inputRiesgoMax.addStyleClass("inputCustom");
			this.inputRiesgoDispues = this.getView().byId("Idriesgodispu");
			this.inputRiesgoDispues.addStyleClass("inputCustom");
			this.inputRiesgoDispon = this.getView().byId("Idriesgodispo");
			this.inputRiesgoDispon.addStyleClass("inputCustom");

			this.tablePedido = this.getView().byId("tableView3");
			this.tablePedido.addStyleClass("table2");

			this.textObservRiesgo = this.getView().byId("IdObservaValor");
			this.textObservPedido = this.getView().byId("IdObservapediValor");
			this.textObservGarant = this.getView().byId("IdObservagaranValor");
		},

		_cleanScreen: function () {
			this.inputCliente.setValue("");
			this.inputNumCliente.setValue("");
			this.dateFechaPedido.setValue("");
			this.inputCondCobro.setValue("");
			this.inputCondCobroDesc.setValue("");
			this.dateFechaVencim.setValue("");
			this.inputNumPedido.setValue("");
			this.inputDestinaMerca.setValue("");
			this.inputDestinaMercaDesc.setValue("");
			this.inputClaseDoc.setValue("");
			this.inputClaseDocDesc.setValue("");
			this.inputViaPago.setValue("");
			this.inputMoneda.setValue("");
			this.inputComercial.setValue("");
			this.inputPrecioAlm.setValue("");
			this.datePagadoHasta.setValue("");
			this.inputRiesgoMax.setValue("");
			this.inputRiesgoDispues.setValue("");
			this.inputRiesgoDispon.setValue("");
			this.textObservRiesgo.setValue("");
			this.textObservPedido.setValue("");
			this.textObservGarant.setValue("");

			if (this.getView().getModel("Materiales")) {
				this.getView().getModel("Materiales").destroy();
				this.oAppData.bMaterialesCargados = false;
			}
		},

		goBack: function () {
			window.history.back()
		},

		// volver a la pantalla de selección
		goToView1: function () {
			if (this.oModelAppData.getProperty("/viewFrom")) {
				this._cleanScreen();
			}
			this.oRouter.navTo("View1");
		},

		// volver al listado de materiales
		goToView2: function () {
			this._cleanScreen();
			this.oRouter.navTo("View2");
		},

		// Formulario de creación de Destinatario
		goToView6: function () {
			this.oRouter.navTo("View6");
		},

		onSetInitialData: function () {

			this.oAppData.bMaterialesCargados = false;
			this.oAppData.sMaterialesCargados = "Modelo de materiales no cargado asíncronamente aún, espere un poco y vuelva a intentarlo";

			var that = this,
				aTableRowData = [];
			var pTable = this.tablePedido; // Tabla creada en la vista. Faltan los items.
			this.getDocumentClass(); // Obtención de la clase de documento por defecto

			// Obtención de la moneda por defecto
			this.inputMoneda.setValue('EUR');

			// Obtención del modelo creado en los controladores 1 y/o 2 para las posiciones de la tabla.
			var oObj = this.oAppData.tableFields;

			for (var i = 0; i < oObj.length; i++) {
				var newRowData = this.createNewRowObject(oObj[i].Lgobe, oObj[i].Lgort, oObj[i].Name1, oObj[i].Vkorg, oObj[i].VkorgDesc, oObj[i].Werks,
					oObj[i].Zinco2);

				aTableRowData.push(newRowData);
			}

			var oModelNewRow = new sap.ui.model.json.JSONModel({}); //NewRowcon el {} dentro ? 
			oModelNewRow.setData({
				modelData: aTableRowData
			});
			this.getView().setModel(oModelNewRow, "NewRow");

			//Crear el modelo de la tabla
			var oModel2 = new sap.ui.model.json.JSONModel({}); //TableCreateModel con el {} dentro ? 
			var initial_array = [];

			if (oObj[0].Matnr !== "") {
				initial_array = oObj;
			} else {
				initial_array = aTableRowData; //[newRowData, newRowData2, newRowData3];
			}

			oModel2.setData({
				//modelData: oObj.slice(0, 3)
				modelData: initial_array
			});

			//Set the data on the table
			this.getView().setModel(oModel2, "TableCreateModel");
			// Crea los items del listado
			pTable.setModel(oModel2); // Cambio de aTable a pTable
			pTable.bindItems("/modelData", this.createTableTemplate(pTable)); // Cambio de aTable a pTable

			// Obtención de la fecha actual y definición de dos variables
			// para la fechas
			var oModelfecha = new sap.ui.model.json.JSONModel();
			oModelfecha.setData({
				dateValue1: new Date(), // Fecha Actual
				dateValue2: undefined, // Campo vacio para que el usuario lo rellene (Fecha condición de cobro)
				dateValue3: undefined // Campo vacio para que el usuario lo rellene (Almacen Pagado hasta)
			});

			this.getView().setModel(oModelfecha, "ModelFecha");

			// var button = this.byId("idButton3");
			// Modificación del texto y destino del botón.
			if (oObj[0].Zflag === "Y") {
				// Se cambia el comportatimento del botón sin es pedido sin Stock
				this.buttonBack.setText("Volver a la pantalla de selección");
				this.buttonBack.attachPress(function () {
					//Limpiamos el modelo local de materiales
					that.getView().setModel(new sap.ui.model.json.JSONModel([]), "Materiales");
					// Se añade los elementos de la Vista1 de nuevo
					that.goToView1();
				});
			} else {
				this.buttonBack.setText("Volver al listado materiales");
				this.buttonBack.attachPress(function () {
					that.byId("idTable");
					//pTable.clearSelection(); // Borrado de las líneas seleccionadas en el listado anteriormente
					that.goToView2();
				});
			}

			this._initMateriales();
			this._setFechaPedidoEditable();
			this._getClientes();
		},

		/**
		 * Gets the document model depending
		 * on the sales organitation.
		 */
		getDocumentClass: function () {
			var model = this.oModelAppData.getProperty("/PermissionsModel");
			var docId = model.getProperty("/documentTypeId");
			var docDesc = model.getProperty("/documentTypeDesc");

			if (docId === "") {
				// Obtención de la clase de documento por defecto
				this.inputClaseDoc.setValue('ZFIR');
				// Obtención de la descripción de la clase de documento por defecto
				this.inputClaseDocDesc.setValue('PEDIDO FIRME');
			} else {
				// Obtención de la clase de documento desde ABAP
				this.inputClaseDoc.setValue(docId);
				// Obtención de la descripción de la clase de documento desde ABAP
				this.inputClaseDocDesc.setValue(docDesc);
			}

		},

		onAddRow: function () {
			// Obtener el modelo de datos de la tabla
			var oModel = this.getView().getModel("TableCreateModel");

			// Obtener los datos actuales de la tabla
			var aData = oModel.getProperty("/modelData");

			// Obtener el primer elemento de los datos actuales (se usará para crear la nueva fila)
			var oAuxObj = aData[0];

			// Crear una nueva fila utilizando la función "createNewRowObject"
			var newRowData = this.createNewRowObject(oAuxObj.Lgobe, oAuxObj.Lgort, oAuxObj.Name1, oAuxObj.Vkorg, oAuxObj.VkorgDesc, oAuxObj.Werks,
				oAuxObj.Zinco2);

			// Agregar la nueva fila al final del arreglo de datos
			aData.push(newRowData);

			// Actualizar el modelo de datos de la tabla con los nuevos datos
			oModel.setProperty("/modelData", aData);
			this.createTableTemplate(this.tablePedido);
		},

		createNewRowObject: function (lgobe, lgort, name1, vkorg, vkorgdesc, werks, zinco2) {
			var newRow = {
				Charg: "",
				Ebeln: "",
				Ebelp: "",
				Lgobe: lgobe,
				Lgort: lgort,
				Maktx: "Seleccione Material",
				Matnr: "",
				Mtart: "",
				Name1: name1,
				Vkorg: vkorg,
				VkorgDesc: vkorgdesc,
				Werks: werks,
				Zcanti: 0,
				Zfechaentrega: new Date(), //FIX MA 26/01/2021 
				Zcompra: 0.0,
				Zcondclieditable: false,
				Zcondpago: 0.0,
				Zcoste: 0.0,
				Zdes1: 0.0,
				Zdes2: 0.0,
				Zdisponible: 0.0,
				Zfabricacion: 0.0,
				Zflag: "Y",
				Zinco2: zinco2,
				Zincocif: 0.0,
				Zincofas: 0.0,
				Zlote: "",
				Zlugar: "",
				Zfechad: new Date(),
				Zfechah: new Date(),
				Zmargen1: 0.0,
				Zmargen2: 0.0,
				Zobserva: "",
				Zporte: 0.0,
				Zprecio1: 0.0,
				Zprecio2: 0.0,
				Zprecioeditable: false,
				Zpretirar: 0.0,
				Zpventa: 0.0,
				Zretirado: 0.0,
				Zstock: 0.0,
				Ztraspaso: 0.0,
				Zventa: 0.0,
				Zznombarco: ""
			};
			return newRow;
		},

		createTableTemplate: function (oTable) {

			var that = this;

			// Definición de un tipo para los campos con dos decimales y el separador de miles con "."
			var oExoticDecimalTypeForUS2 = new sap.ui.model.type.Float({
				maxFractionDigits: 2,
				minFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ".",
				decimalSeparator: ","
			});

			//Material
			var oMaktx = new sap.m.Input({
				value: "{Maktx}",
				textAlign: sap.ui.core.TextAlign.Center,
				valueHelpRequest: function (evt) {
					that.onF4Matnr(evt);
				},
				showValueHelp: that.addButton,
				showSuggestion: true,
				liveChange: function (evt) {
					var str = evt.getParameter("newValue");
					this.setValue(str.toUpperCase());
				},
				suggestionItemSelected: function (evt) {
					var sourceId = evt.getSource().sId;
					console.log("este codigo se ejecuta");
					var indice = sourceId.substr(-1);
					var Selmatnr = evt.getParameters();
					// Datos para completar la línea de cada material
					//	var LgortInput = sap.ui.getCore().byId(sourceId.replace('field0-col0', 'view26-col15'));
					//	var Zinco2Input = sap.ui.getCore().byId(sourceId.replace('field0-col0', 'field2-col2'));

					var oModel = that.getView().getModel("TableCreateModel");
					var aItem = oModel.getProperty("/modelData/")[indice];

					//	var LgortInput = sap.ui.getCore().byId(sourceId.replace('field0-col0', 'view26-col15'));
					//	var Zinco2Input = sap.ui.getCore().byId(sourceId.replace('field0-col0', 'field2-col2'));

					var LgortInput = aItem.Lgort;
					var Zinco2Input = aItem.Lgobe;

					that.onF4MatnrSelected(Selmatnr, LgortInput, Zinco2Input, indice);
				}

			}); //.addStyleClass("sapUiTinyMargins");

			//Posición 2
			var oZinco1 = new sap.m.Input({
				value: "{Zinco1}",
				showValueHelp: true,
				textAlign: sap.ui.core.TextAlign.Center,
				valueHelpRequest: function (evt) {
					that.onF4Incoterm(evt);
				},
				liveChange: function (evt) {
					var str = evt.getParameter("liveValue");
					this.setValue(str.toUpperCase());
				}
			});

			//Lugar 3
			var oZinco2 = new sap.m.Input({
				editable: true,
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Zinco2}"
			});
			// Fecha Desde
			var oFechaDesde = new sap.m.DatePicker({
				editable: "{appData>/visibleColumsView3/Zfechaentdesdeeditable}",
				value: {
					path: "Zfechad",
					type: "sap.ui.model.type.Date"
				},
				width: "100%"
			});

			// Fecha Hasta
			var oFechaHasta = new sap.m.DatePicker({
				editable: "{appData>/visibleColumsView3/Zfechaenthastaeditable}",
				value: {
					path: "Zfechah",
					type: "sap.ui.model.type.Date"
				},
				width: "100%"
			});
			//Cantidad 4
			var oZcanti = new sap.m.Input({
				editable: true,
				type: sap.m.InputType.Text,
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Zcanti}"
				//value: "{path: 'Zcanti', formater: 'QuantityFormat'}"
			});

			//PRECIO VENTA 5
			var oZprecionet = new sap.m.Input({
				editable: false, //cambiar a false
				type: sap.m.InputType.Text,
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Zprecionet}"
				//value: "{path: 'Zprecionet', formater: 'PriceFormat'}"
			});

			//Precio Tarifa 6 
			var oZprecioTarifa = new sap.m.Input({
				editable: false,
				type: sap.m.InputType.Text,
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{ZprecioTarifa}"
				//value: "{path: 'ZprecioTarifa', formater: 'PriceFormat'}"
			});

			//Precio Base 7
			var oZprecio1 = new sap.m.Input({
				//MODIFICACIÓN AARANDA 06/06/2018: El precio base debe ser editable dependiendo de lo que devuelva SAP en el campo ZPRECIOEDITABLE
				//editable: "{Zprecioeditable}",
				editable: "{appData>/visibleColumsView3/Zprecio1Editable}", //FIX 07.03.2019 ma
				//FIN MODIFICACIÓN AARANDA 06/06/2018 PARA PRECIO EDITABLE
				change: that.calcularPrecios.bind(this),
				type: sap.m.InputType.Text,
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Zprecio1}"
				//value: "{path: 'Zprecio1', formater: 'PriceFormat'}"
			});

			//Envasado 8
			var oZprecio2 = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/Zprecio2Editable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zprecio2}"
				//value: "{path: 'Zprecio2', formater: 'PriceFormat' }"
			});

			//Margen 9
			var oZmargen = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/Zmargen1Editable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zmargen1}"
				//value: "{path: 'Zmargen1', formater: 'PriceFormat'}"
			});

			//Margen 10
			var oZmargen2 = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/Zmargen2Editable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zmargen2}"
				//value: "{path: 'Zmargen2', formater: 'PriceFormat'}"
			});

			//Arancel 11
			var oZdes2 = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/Zdes2Editable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zdes2}"
				//value: "{path: 'Zdes2', formater: 'PriceFormat'}"
			});

			//De CIF a FAS 12
			var oZincocif = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/ZincocifEditable}",
				textAlign: sap.ui.core.TextAlign.Center,
				change: that.calcularPrecios.bind(this),
				type: sap.m.InputType.Text,
				value: "{Zincocif}"
				//value: "{path: 'Zincocif', formater: 'PriceFormat'}"

			});

			//De FAS a FDA 13
			var oZincofas = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/ZincofasEditable}",
				textAlign: sap.ui.core.TextAlign.Center,
				change: that.calcularPrecios.bind(this),
				type: sap.m.InputType.Text,
				value: "{Zincofas}"
				//value: "{path: 'Zincofas', formater: 'PriceFormat'}"

			});

			//Porte 14
			var oZporte = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/ZporteEditable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zporte}"
				//value: "{path: 'Zporte', formater: 'PriceFormat'}"
			});

			//Condicion de pago 15
			var oZcondpago = new sap.m.Input({
				editable: "{appData>/visibleColumsView3/ZcondpagoEditable}",
				change: that.calcularPrecios.bind(this),
				textAlign: sap.ui.core.TextAlign.Center,
				type: sap.m.InputType.Text,
				value: "{Zcondpago}"
				//value: "{path: 'Zcondpago', formater: 'PriceFormat'}"
			});

			//Lote  16
			var oCharg = new sap.m.Input({
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Charg}",
				type: sap.m.InputType.Text,
				maxLength: 10,
				editable: false
			});

			//Almacén 17
			var oLgort = new sap.m.Input({
				textAlign: sap.ui.core.TextAlign.Center,
				value: "{Lgort}",
				type: sap.m.InputType.Text,
				maxLength: 5,
				editable: false
			});

			//Codigo material 18
			var oMatnr = new sap.m.Input({
				textAlign: sap.ui.core.TextAlign.Center,
				editable: false,
				type: sap.m.InputType.Text,
				value: "{Matnr}"
			});

			////Prueba 19
			var oDeleteButton = new sap.m.Button({
				icon: "sap-icon://sys-cancel",
				press: this.onDeleteRow.bind(this)
			});

			// var oModel2 = new sap.ui.model.json.JSONModel();
			// oModel2.setData({
			// 	modelData: []
			// });

			//Fila
			var oRow = new sap.m.ColumnListItem().addStyleClass("sapUiTinyMargins");
			// A cada fila, añadir las columnas necesarias
			oRow.addCell(oMaktx)
				.addCell(oZinco1)
				.addCell(oZinco2)
				.addCell(oFechaDesde)
				.addCell(oFechaHasta)
				.addCell(oZcanti)
				.addCell(oZprecionet)
				.addCell(oZprecioTarifa)
				.addCell(oZprecio1)
				.addCell(oZprecio2)
				.addCell(oZmargen)
				.addCell(oZmargen2)
				.addCell(oZdes2)
				.addCell(oZincocif)
				.addCell(oZincofas)
				.addCell(oZporte)
				.addCell(oZcondpago)
				.addCell(oCharg)
				.addCell(oLgort)
				.addCell(oMatnr)
				.addCell(oDeleteButton);

			// Agregamos la fila a la tabla.
			oTable.addAggregation(oRow)
			return oRow;

		},
		onDeleteRow: function (oEvent) {
			var oTable = this.tablePedido; //this.getView().byId("tableView3");
			var oRow = oEvent.getSource().getParent();
			var oModel = this.getView().getModel("TableCreateModel");
			var aData = oModel.getProperty("/modelData");

			var index = oTable.indexOfItem(oRow);

			if (oTable.getItems().length - 1) {
				var rowData = oModel.getProperty(oRow.getBindingContextPath());
				//oTable.removeItem(oTable.indexOfItem(oRow)) // eliminamos de la tabla.

				console.log("Datos de la fila a eliminar:", rowData);
				aData.splice(index, 1);
				oModel.setProperty("/modelData", aData); // se elimina del modelo y se actualiza
			}

		},

		calcularPrecios: function (evt) {
			var that = this;
			var sItemSelected = evt ? evt.getSource().getParent().getBindingContextPath() : undefined;
			const FIRST_ITEM = "/modelData/0/";
			///////////////////////////////////////////////////////////////////////////////
			// Actualización Precio Neto
			// Inicio
			///////////////////////////////////////////////////////////////////////////////
			// Definición Array
			var obj = [];
			var oTablaView3 = this.tablePedido;
			// Obtención del modelo de la tabla
			var oTablaModel = this.getView().getModel("TableCreateModel"); //oTablaView3.getModel();
			// Obtención de los datos de la tabla
			var oSeleccData = sItemSelected ? oTablaModel.getProperty(sItemSelected) : oTablaModel.getProperty(FIRST_ITEM);
			//////////////////////////////////////////////////////////////////////////////
			// Llamada al servicio Odata para la Bapi "SD_SALESDOCUMENT_CREATE"
			// para obtener el precio neto de la posición con los margenes,descuentos etc
			// Inicio
			/////////////////////////////////////////////////////////////////////////////
			var paramprecionet = this._initParametrosBapi();

			var that = this;
			// Definición Array
			var obj = [];
			// Definición Modelo
			var oModelview3 = new sap.ui.model.json.JSONModel();
			// Obtención del ID de la tabla
			var gv_tablaview3 = this.tablePedido; //this.getView().byId("tableView3");
			// Obtención del modelo de la tabla
			var gv_modeltablaview3 = this.getView().getModel("TableCreateModel"); //gv_tablaview3.getModel();
			// Obtención de los datos de la tabla
			var gv_tabledataview3 = gv_modeltablaview3.getData();

			// Para todos los registros de la tabla

			// // Modificación para el registro en curso
			// if(oSeleccData){
			// 	var gvindex = oSeleccData;//gv_tabledataview3.modelData[i]; // Valor de cada fila con los valores seleccionados
			// 	if (gvindex.Matnr !== "") {

			// 		// Material
			// 		paramprecionet.Zmatnr.push(gvindex.Matnr);
			// 		// Lote
			// 		paramprecionet.Zlote.push(gvindex.Charg);
			// 		// Cantidad
			// 		paramprecionet.Zcanti.push(gvindex.Zcanti);
			// 		// Almacén
			// 		paramprecionet.Zlgort.push(gvindex.Lgort);
			// 		//Centro
			// 		paramprecionet.Zwerks.push(gvindex.Werks);
			// 		//Org. Vtas seleccionada en la primera pantalla
			// 		paramprecionet.Zvkorg.push(that.oAppData.vkorg);
			// 		// INCO1
			// 		paramprecionet.Zinco1.push(gvindex.Zinco1);
			// 		// INCO2
			// 		paramprecionet.Zinco2.push(gvindex.Zinco2);
			// 		// Precio Tarifa no se envia como parámetro
			// 		gvindex.ZprecioTarifa = (gvindex.ZprecioTarifa) ? that.checkPointNumber(gvindex.ZprecioTarifa) : 0.0;
			// 		// Cantidad  no se envia como parámetro
			// 		gvindex.Zcanti = (gvindex.Zcanti) ? that.checkPointNumber(gvindex.Zcanti) : 0.0;
			// 		paramprecionet.Zprecio1.push((gvindex.Zprecio1) ? that.checkPointNumber(gvindex.Zprecio1) : 0.0);
			// 		// Precio neto
			// 		paramprecionet.Zprecionet.push((gvindex.Zprecionet) ? that.checkPointNumber(gvindex.Zprecionet) : 0.0);
			// 		// Envasado
			// 		paramprecionet.Zprecio2.push((gvindex.Zprecio2) ? that.checkPointNumber(gvindex.Zprecio2) : 0.0);
			// 		// Margen 1
			// 		paramprecionet.Zmargen1.push((gvindex.Zmargen1) ? that.checkPointNumber(gvindex.Zmargen1) : 0.0);
			// 		// Margen 2
			// 		paramprecionet.Zmargen2.push((gvindex.Zmargen2) ? that.checkPointNumber(gvindex.Zmargen2) : 0.0);
			// 		// Descuento 1 (No se utiliza)
			// 		paramprecionet.Zdes1.push((gvindex.Zdes1) ? that.checkPointNumber(gvindex.Zdes1) : 0.0);
			// 		// Descuento 2 (Arancel)
			// 		paramprecionet.Zdes2.push((gvindex.Zdes2) ? that.checkPointNumber(gvindex.Zdes2) : 0.0);
			// 		// Incoterm FAS
			// 		paramprecionet.Zincofas.push((gvindex.Zincofas) ? that.checkPointNumber(gvindex.Zincofas) : 0.0);
			// 		// Incoterm CIF
			// 		paramprecionet.Zincocif.push((gvindex.Zincocif) ? that.checkPointNumber(gvindex.Zincocif) : 0.0);
			// 		// Porte
			// 		paramprecionet.Zporte.push((gvindex.Zporte) ? that.checkPointNumber(gvindex.Zporte) : 0.0);
			// 		// Condición Cliente
			// 		paramprecionet.Zcondipago.push((gvindex.Zcondpago) ? that.checkPointNumber(gvindex.Zcondpago) : 0.0);
			// 		// Fecha entrega
			// 		paramprecionet.Zfechaentrega.push(that.parseDate(new Date()));
			// 	}
			// }

			for (var i = 0; i < gv_tabledataview3.modelData.length; i++) {

				var gvindex = gv_tabledataview3.modelData[i]; // Valor de cada fila con los valores seleccionados
				if (gvindex.Matnr !== "") {

					// if (gvindex.ZprecioTarifa){
					// gvindex.ZprecioTarifa = sap.ui.controller("view.View3").checkPointNumber(gvindex.ZprecioTarifa);
					gvindex.ZprecioTarifa = (gvindex.ZprecioTarifa) ? this.checkPointNumber(gvindex.ZprecioTarifa) : "";
					// }
					if (gvindex.Zcanti) {
						// gvindex.Zcanti = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zcanti);
						gvindex.Zcanti = this.checkPointNumber(gvindex.Zcanti);
					}
					if (gvindex.Zprecio1) {
						// gvindex.Zprecio1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecio1);
						gvindex.Zprecio1 = this.checkPointNumber(gvindex.Zprecio1);
					}
					if (gvindex.Zprecionet) {
						// gvindex.Zprecionet = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecionet);
						gvindex.Zprecionet = this.checkPointNumber(gvindex.Zprecionet);
					}
					if (gvindex.Zprecio2) {
						// gvindex.Zprecio2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecio2);
						gvindex.Zprecio2 = this.checkPointNumber(gvindex.Zprecio2);
					}
					if (gvindex.Zmargen1) {
						// gvindex.Zmargen1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zmargen1);
						gvindex.Zmargen1 = this.checkPointNumber(gvindex.Zmargen1);
					}
					if (gvindex.Zmargen2) {
						// gvindex.Zmargen2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zmargen2);
						gvindex.Zmargen2 = this.checkPointNumber(gvindex.Zmargen2);
					}
					if (gvindex.Zdes1) {
						// gvindex.Zdes1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zdes1);
						gvindex.Zdes1 = this.checkPointNumber(gvindex.Zdes1);
					}
					if (gvindex.Zdes2) {
						// gvindex.Zdes2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zdes2);
						gvindex.Zdes2 = this.checkPointNumber(gvindex.Zdes2);
					}
					if (gvindex.Zincofas) {
						//gvindex.Zincofas = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zincofas);
						gvindex.Zincofas = this.checkPointNumber(gvindex.Zincofas);
					}
					if (gvindex.Zincocif) {
						// gvindex.Zincocif = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zincocif);
						gvindex.Zincocif = this.checkPointNumber(gvindex.Zincocif);
					}
					if (gvindex.Zporte) {
						// gvindex.Zporte = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zporte);
						gvindex.Zporte = this.checkPointNumber(gvindex.Zporte);
					}
					if (gvindex.Zcondpago) {
						// gvindex.Zcondpago = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zcondpago);
						gvindex.Zcondpago = this.checkPointNumber(gvindex.Zcondpago);
					}

					// Material
					paramprecionet.Zmatnr.push(gvindex.Matnr);
					// Lote
					paramprecionet.Zlote.push(gvindex.Charg);
					// Cantidad
					paramprecionet.Zcanti.push(gvindex.Zcanti);
					//Fecha desde y fecha hasta
					paramprecionet.Zfechad.push(this.parseDate(gvindex.Zfechad));
					paramprecionet.Zfechah.push(this.parseDate(gvindex.Zfechah));
					// Almacén
					paramprecionet.Zlgort.push(gvindex.Lgort);
					//Modificación DGA 11/05/2018 - El campo  precio base debe ser modificable
					paramprecionet.Zprecio1.push(gvindex.Zprecio1);
					//Fin DGA 11/05/2018 - El campo  precio base debe ser modificable
					paramprecionet.Zprecionet.push(gvindex.Zprecionet); // Precio vta
					// Envasado
					paramprecionet.Zprecio2.push(gvindex.Zprecio2);
					// Margen 1
					paramprecionet.Zmargen1.push(gvindex.Zmargen1);
					// Margen 2
					paramprecionet.Zmargen2.push(gvindex.Zmargen2);
					// Descuento 1 (No se utiliza)
					paramprecionet.Zdes1.push(gvindex.Zdes1);
					// Descuento 2 (Arancel)
					paramprecionet.Zdes2.push(gvindex.Zdes2);
					// Incoterm FAS
					paramprecionet.Zincofas.push(gvindex.Zincofas);
					// Incoterm CIF
					paramprecionet.Zincocif.push(gvindex.Zincocif);
					// Porte
					paramprecionet.Zporte.push(gvindex.Zporte);
					// Condición Cliente
					paramprecionet.Zcondipago.push(gvindex.Zcondpago);
					//Centro
					paramprecionet.Zwerks.push(gvindex.Werks);
					//Org. Vtas seleccionada en la primera pantalla
					paramprecionet.Zvkorg.push(this.oAppData.vkorg);
					//paramprecionet.Zprecionet = 0; //Precio Neto
					// INCO1
					paramprecionet.Zinco1.push(gvindex.Zinco1);
					// INCO2
					paramprecionet.Zinco2.push(gvindex.Zinco2);
					paramprecionet.Zfechaentrega.push(this.parseDate(new Date()));
				}
			}

			paramprecionet.Zcliente = this.inputNumCliente.getValue(); // Cliente 
			paramprecionet.Zfechaped = this.parseDate(this.dateFechaPedido.getDateValue()); // Fecha Pedido
			paramprecionet.Zcondicobro = this.inputCondCobro.getValue(); // Condición Cobro
			paramprecionet.Znumpedi = this.inputNumPedido.getValue(); // Nº Pedido
			paramprecionet.Zclasedoc = this.inputClaseDoc.getValue(); // Clase de Documento
			paramprecionet.Zdestimerca = this.inputDestinaMerca.getValue(); // Destinatario de Mercancías
			paramprecionet.Zviapago = this.inputViaPago.getValue(); // Vía de pago
			paramprecionet.Zcomercial = this.inputComercial.getValue(); // Comercial
			paramprecionet.Zmoneda = this.inputMoneda.getValue(); // Moneda
			paramprecionet.Zalmacenpaga = this.parseDate(this.datePagadoHasta.getDateValue()); // Fecha Almacen Pagado a
			paramprecionet.Zfechacondi = this.parseDate(this.dateFechaVencim.getDateValue()); // Fecha Condición Cobro
			if (!paramprecionet.Zvkorg || paramprecionet.Zvkorg === "" || paramprecionet.Zvkorg.length === 0) {
				paramprecionet.Zvkorg = that.oAppData.vkorg; //Org. Vtas seleccionada en la primera pantalla
			}

			var urlprecionet = that.sUrl + "/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";

			// OPERACION GET, LLAMADA AL ODATA
			var oModelprecionet = new sap.ui.model.odata.ODataModel(urlprecionet, false);
			oModelprecionet.callFunction("zzfuncion",
				"GET",
				paramprecionet,
				null,
				function (oDatabapi, responsebapi) {

					// Obtención de las filas del listado
					//var gv_tablaview33 = that.tablePedido; //that.getView().byId("tableView3");
					var oModelTabla = that.getView().getModel("TableCreateModel"); //that.tablePedido.getModel();
					//var gv_modeltablaview33 = that.getView().getModel("TableCreateModel"); //gv_tablaview33.getModel();
					var oDataTabla = oModelTabla.getData();
					//var gv_tabledataview33 = gv_modeltablaview33.getData();
					//	console.log(gv_modeltablaview33);
					//	console.log("GV_FILA");
					console.log(gv_fila);

					for (var cont = 0; cont < oDataTabla.modelData.length; cont++) {
						if (oDataTabla.modelData[cont].Matnr !== "") {

							// Obtención de todos los datos de la línea
							var gv_fila = oDataTabla.modelData[cont];
							console.log("responsebapi calcularPreciosAndSave", responsebapi);
							console.log("responsebapi.data", responsebapi.data);

							// Recuperación del Precio Neto de la función import
							var gv_precioventa = responsebapi.data.ZprecioVenta;
							// Recuperación del Precio 1 Granel de la función import
							var gv_precio1 = responsebapi.data.Zprecio1;
							// Recuperación del Precio Envasado de la función import
							var gv_preciozenv = responsebapi.data.Zpreciozenv;
							//		console.log("Response bapi : " + gv_preciozenv);
							// Recuperación del Precio Incoterm FAS de la función import
							var gv_preciozfas = responsebapi.data.Zpreciozfas;
							// Recuperación del Precio Incoterm CIF de la función import
							var gv_preciozcif = responsebapi.data.Zpreciozcif;
							// Recuperación del Precio de la Condición de Cliente Import
							var gv_preciocondi = responsebapi.data.Zpreciocondi;
							// Recuperación del Precio Portes
							var gv_precioporte = responsebapi.data.Zprecioporte;
							// Recuperación del Precio Descuento 1 de la función import
							var gv_preciodes = responsebapi.data.Zpreciodes;

							// Obtención del Array de los precios netos
							var gv_valorprecioventa = gv_precioventa.split("/");
							// Obtención del Array de los precios 1 
							var gv_valorprecio1 = gv_precio1.split("/");
							// Obtención del Array de los precios envasados
							var gv_valorpreciozenv = gv_preciozenv.split("/");
							// Obtención del Array de los precios Incoterm FAS
							var gv_valorpreciozfas = gv_preciozfas.split("/");
							// Obtención del Array de los precios Incoterm CIF
							var gv_valorpreciozcif = gv_preciozcif.split("/");
							// Obtención del Array del Precio de la Condición
							var gv_valorpreciocondi = gv_preciocondi.split("/");
							// Obtención del Array del Precio Porte
							var gv_valorprecioporte = gv_precioporte.split("/");
							// Obtención del Array de los precios Arancel
							//	var gv_valorpreciozara = gv_preciozara.split("/");
							// Obtención del Array de los precios Descuento1
							var gv_valorpreciodes = gv_preciodes.split("/");
							//Precio tarifa
							// var gv_preciotarifa = parseFloat(gv_valorprecio1[cont].trim()) + parseFloat(gv_valorpreciozenv[cont].trim()) + parseFloat(
							// 	gv_valorprecioporte[cont].trim()) + parseFloat(gv_valorpreciozcif[cont].trim());
							//Fix 03.05.2019 ma
							// var gv_preciotarifa = parseFloat(gv_valorprecio1 + gv_valorpreciozenv + 
							// 	gv_valorprecioporte + gv_valorpreciozcif);
							// Precio Neto
							gv_fila.Zprecionet = gv_valorprecioventa[cont].trim();
							//	console.log("gv_fila.Zprecionet: " +  gv_valorprecioventa[cont]);
							//	console.log("gv_fila.Zprecionet: PARSE" +  gv_valorprecioventa[cont].trim());

							// Precio 1 Granel
							gv_fila.Zprecio1 = gv_valorprecio1[cont].trim(); //.replace(/[,]/gi, '.');
							// Precio Envasado
							gv_fila.Zprecio2 = gv_valorpreciozenv[cont].trim(); //.replace(/[.]/gi, ',');
							// Precio Incoterm FAS
							gv_fila.Zincofas = gv_valorpreciozfas[cont].trim();
							// Precio Incoterm CIF
							gv_fila.Zincocif = gv_valorpreciozcif[cont].trim();
							// Condición Cliente
							gv_fila.Zcondpago = gv_valorpreciocondi[cont].trim(); //.replace(/[.]/gi, ',');
							// Porte
							gv_fila.Zporte = gv_valorprecioporte[cont].trim(); //.replace(/[.]/gi, ',');
							// Precio Tarifa
							gv_fila.ZprecioTarifa = (parseFloat(gv_fila.Zprecio1) + parseFloat(gv_fila.Zprecio2) + parseFloat(gv_fila.Zporte) + parseFloat(gv_fila.Zincocif)).toString()
							//gv_preciotarifa;
							// Precio Descuento 1 (No se utiliza)
							gv_fila.Zdes1 = gv_valorpreciodes[cont];

							//ENDFIX
							// Precio Neto
							gv_fila.Zprecionet = gv_valorprecioventa[cont] || 0.0; // a ver qué pasa
							//	console.log("gv_fila.Zprecionet: " +  gv_valorprecioventa[cont]);
							//	console.log("gv_fila.Zprecionet: PARSE" +  gv_valorprecioventa[cont].trim());

							// // Precio 1 Granel
							// gv_fila.Zprecio1 = gv_valorprecio1[cont] || 0.0; //.replace(/[,]/gi, '.');
							// // Precio Envasado
							// gv_fila.Zprecio2 = gv_valorpreciozenv[cont] || 0.0; //.replace(/[.]/gi, ',');
							// // Precio Incoterm FAS
							// gv_fila.Zincofas = gv_valorpreciozfas[cont] || 0.0;
							// // Precio Incoterm CIF
							// gv_fila.Zincocif = gv_valorpreciozcif[cont] || 0.0;
							// // Condición Cliente
							// gv_fila.Zcondpago = gv_valorpreciocond[cont] || 0.0; //.replace(/[.]/gi, ',');
							// // Porte
							// gv_fila.Zporte = gv_valorprecioporte[cont] || 0.0; //.replace(/[.]/gi, ',');
							// // Precio Tarifa
							// gv_fila.ZprecioTarifa = gv_preciotarifa[cont] || 0.0;
							// // Precio Descuento 1 (No se utiliza)
							// gv_fila.Zdes1 = gv_valorpreciodes[cont] || 0.0;

							//Conversiones de negativos
							// for (var n in gv_fila) {
							// 	if (parseFloat(gv_fila[n]) && parseFloat(gv_fila[n]) < 0){
							// 		gv_fila[n] = parseFloat(gv_fila[n]) * -1;
							// 	}
							// }
							//Conversiones de negativos - Código de la app antigua, tal y como nos solicitan 21/11/2023
							for (var n in gv_fila) {
								if (gv_fila[n]) {
									var number = gv_fila[n].toString();
									if (number && number.indexOf("-") != -1 && number.indexOf("-") != 0) {
										number.replace("-", "");
										if (parseFloat(number))
											gv_fila[n] = parseFloat(number) * -1;
									}
								}
							}

							//Conversiones a decimal con coma
							if (gv_fila.ZprecioTarifa) gv_fila.ZprecioTarifa = formater.PriceFormat(gv_fila.ZprecioTarifa);
							if (gv_fila.Zmargen1) gv_fila.Zmargen1 = formater.PriceFormat(gv_fila.Zmargen1);
							if (gv_fila.Zmargen2) gv_fila.Zmargen2 = formater.PriceFormat(gv_fila.Zmargen2);
							//if (gv_fila.Zcanti) gv_fila.Zcanti = parseFloat(sap.ui.controller("view.View3").PriceFormat(gv_fila.Zcanti).trim());
							if (gv_fila.Zcanti) gv_fila.Zcanti = formater.QuantityFormat(gv_fila.Zcanti);
							//	if(gv_fila.ZprecioTarifa)		//gv_fila.Zdes1 = sap.ui.controller("zui5_sd_000.utils.conversions").PriceFormat(gv_fila.Zdes1);
							if (gv_fila.Zdes2) gv_fila.Zdes2 = formater.PriceFormat(gv_fila.Zdes2);
							//Datos traidos de sap
							if (gv_fila.Zprecionet) gv_fila.Zprecionet = formater.PriceFormat(gv_fila.Zprecionet);

							console.log("gv_fila.Zprecionet: " + gv_valorprecioventa);
							console.log("gv_fila.Zprecionet: PARSE" + formater.PriceFormat(gv_fila.Zprecionet));

							if (gv_fila.Zprecio1) gv_fila.Zprecio1 = formater.PriceFormat(gv_fila.Zprecio1);
							if (gv_fila.Zprecio2) gv_fila.Zprecio2 = formater.PriceFormat(gv_fila.Zprecio2);
							if (gv_fila.Zincofas) gv_fila.Zincofas = formater.PriceFormat(gv_fila.Zincofas);
							if (gv_fila.Zincocif) gv_fila.Zincocif = formater.PriceFormat(gv_fila.Zincocif);
							if (gv_fila.Zcondpago) gv_fila.Zcondpago = formater.PriceFormat(gv_fila.Zcondpago);
							if (gv_fila.Zporte) gv_fila.Zporte = formater.PriceFormat(gv_fila.Zporte);
							if (gv_fila.Zincocif) gv_fila.Zincocif = formater.PriceFormat(gv_fila.Zincocif);

							console.log("responsebapi: ");
							console.log(responsebapi.data);
							console.log("gv_fila: ");
							console.log(gv_fila);

							//	gv_fila.Maktx = gv_tabledataview33[cont].Maktx;
							// Se añade la fila con el valor del precio neto en el objeto
							obj.push(gv_fila);
							//	console.log(gv_fila);

							//Change the item
							var oModel = that.getView().getModel("TableCreateModel");
							oModel.setProperty("/modelData/" + cont, gv_fila);
							oModel.refresh();
						}
					}
					that.getView().setModel(oModelTabla, "TableCreateModel");
					sap.m.MessageToast.show(responsebapi.data.Zreturn);
					//sap.m.MessageToast.show(responsebapi.data.Zreturn);
				},
				function () {
					// Mensaje de error cuando se produce un error al calcular el precio neto de la posición
					sap.m.MessageToast.show("Error al calcular el precio neto");
				});

			// } else {
			// 	sap.m.MessageToast.show("Corrija los errores para poder calcular los precios.");
			// }
		},

		onSelectCondCobro: function (zterm) {
			var that = this;
			//Cogemos la fecha y la pasamos al formato date de javascript
			// var arrFecha = this.parseDate(this.dateFechaPedido.getValue()).split("/");
			var fecha = this.dateFechaPedido.getDateValue() // new Date(arrFecha[2], arrFecha[1] - 1, arrFecha[0], 1);

			if (!zterm) {
				zterm = this.inputCondCobro.getValue();
			}

			//Cogemos el Zterm del input de la condición de cobro y de la fecha
			var parameters = {
				Zfecha: fecha,
				Zterm: zterm
			};

			//Cogemos la url del servicio
			var url = that.sUrl + "/sap/opu/odata/SAP/ZFECHACONDI_SRV/";

			//Creamos el modelo oData				
			var oModel = new sap.ui.model.odata.ODataModel(url, false);
			oModel.callFunction("ZMF_SD_04",
				"GET",
				parameters,
				null,

				//Función respuesta correcta
				function (oData, response) {
					if (response.data.ZfechaCondi) {

						//Tenemos que separar la fecha, que llega en formato YYYYMMDD
						var dia = response.data.ZfechaCondi.substr(6, 2);
						var mes = response.data.ZfechaCondi.substr(4, 2);
						var anyo = response.data.ZfechaCondi.substr(0, 4);

						//var fechaSalida = dia + "/" + mes + "/" + anyo;
						var fechaSalida = new Date(anyo, mes - 1, dia);
						that.dateFechaVencim.setDateValue(fechaSalida);

					} else {
						var fechaSalida = "";
						that.dateFechaVencim.setDateValue(fechaSalida);
					}
				},
				//Funcion respusta errónea
				function () { }
			);

		},

		/* Ayudas de búsqueda */

		//DANI
		onF4Cliente: function (oEvn) {
			var that = this;

			// Tabla con los valores de la ayuda de busqueda
			var HelpTablekunnr = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes a true
				width: "700px"
			});

			// Parámetros del PopUP de la ayuda de busqueda

			var ValueHelpkunnr = new sap.m.Popover({
				modal: true,
				title: "Cliente",
				afterClose: function () {
					// Obtención del Nombre y Código del Cliente
					var oContextkunnr = HelpTablekunnr.getContextByIndex(HelpTablekunnr.getSelectedIndex());
					var oSelKunnr = oContextkunnr.getModel().getProperty(oContextkunnr.getPath());
					that.inputNumCliente.setValue(oSelKunnr.Kunnr);
					that.oModelAppData.setProperty("/codCliente", oSelKunnr.Kunnr); // antes Idvalorcliente
					that.inputCliente.setValue(oSelKunnr.Mcod1);

					that._closeF4Kunnr(oSelKunnr.Kunnr);
				}
			});
			// Botón de la Ayuda de busqueda
			var OkButtonkunnr = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpkunnr.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda
			// Columna Código Cliente
			HelpTablekunnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Cliente"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Kunnr"),
					width: '70px',
					sortProperty: "Kunnr",
					filterProperty: "Kunnr"
				})
			);
			// Columna Nombre Cliente
			HelpTablekunnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Nombre"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Mcod1"),
					width: '200px',
					sortProperty: "Mcod1",
					filterProperty: "Mcod1"
				})
			);
			// Columna Nombre Corto Cliente
			HelpTablekunnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Nombre Corto"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Sortl"),
					sortProperty: "Sortl",
					filterProperty: "Sortl"
				})
			);
			// Columna Cod Postal Cliente
			HelpTablekunnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Cod. Postal"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Pstlz"),
					width: '70px',
					sortProperty: "Pstlz",
					filterProperty: "Pstlz"
				})
			);
			// Columna Municipio Cliente
			HelpTablekunnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Municipio"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Mcod3"),
					sortProperty: "Mcod3",
					filterProperty: "Mcod3"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelkunnr = new sap.ui.model.json.JSONModel();

			//MODIFICACIÓN AARANDA 07/06/2018: FILTRAR CLIENTES POR ORGANIZACION DE VENTAS CUANDO SAP NOS LO DIGA
			var orgVentas = this.oAppData.vkorg;
			var filtrar = true;
			var mOrgVtas = new Map();
			mOrgVtas.set('Vkorg', this.oAppData.vkorg)

			var mParameters = {
				async: false,
				urlParameters: mOrgVtas,
				success: function (oData, oResponse) {
					if (oData.Direntrega && oData.Direntrega === "X") {
						filtrar = true;
					} else {
						filtrar = true;
					}
				},
				error: function () {
					filtrar = true;
				}
			};

			// var url = this.sUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV/MantDirEntSet(Vkorg='" + orgVentas + "')";
			// var sPath = this.sUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV";
			// var oModel = new sap.ui.model.odata.v2.ODataModel({serviceUrl: sPath}, false);

			// oModel.read("/MantDirEnt", mParameters);

			var HelpURLkunnr = "";

			if (filtrar) {
				HelpURLkunnr = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/DebiaSet?$filter=(Parvw eq 'AG' and Vkorg eq '" + orgVentas + "')";
			} else {
				HelpURLkunnr = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/DebiaSet?$filter=(Parvw eq 'AG')";
			}
			//FIN MODIFICACIÓN AARANDA 07/06/2018: FILTRAR CLIENTES POR ORG DE VENTAS CUANDO SAP NOS DIGA

			HelpModelkunnr.loadData(HelpURLkunnr, false);
			HelpTablekunnr.setModel(HelpModelkunnr);
			HelpTablekunnr.bindAggregation("rows", "/d/results");

			ValueHelpkunnr.addContent(HelpTablekunnr);
			ValueHelpkunnr.setEndButton(OkButtonkunnr);
			ValueHelpkunnr.openBy(this.inputCliente);
		},

		_closeF4Kunnr: function (sKunnr) {
			var that = this;
			////////////////////////////////////////////////////////////////////////////////////////
			// Obtención del Nombre y Código del Cliente
			// var oContextkunnr = HelpTablekunnr.getContextByIndex(HelpTablekunnr.getSelectedIndex());
			// var oSelKunnr = oContextkunnr.getModel().getProperty(oContextkunnr.getPath());
			// this.inputNumCliente.setValue(oSelKunnr.Kunnr);
			// this.oModelAppData.setProperty("/codCliente", oSelKunnr.Kunnr); // antes Idvalorcliente
			// this.inputCliente.setValue(oSelKunnr.Mcod1);

			var url = this.sUrl + "/sap/opu/odata/sap/ZCALCULOPRECIOS_SRV/";

			var gv_moneda = this.inputMoneda.getValue();

			var oParams = {
				Kunnr: sKunnr,
				Werks: this.oAppData.werks,
				Vkorg: this.oAppData.vkorg
			}

			var oModel = new sap.ui.model.odata.ODataModel(url, false);
			oModel.callFunction("zzfuncion",
				"GET",
				oParams,
				null,
				function (oData, response) {

					// Conversión númro por miles y comas
					var gv_riesgomax = that.addCommas(response.data.Zriesgomax);

					that.inputRiesgoMax.setValue(gv_riesgomax + " " + gv_moneda);
					var gv_riesgodispu = that.addCommas(response.data.Zriesgodispues);

					that.inputRiesgoDispues.setValue(gv_riesgodispu + " " + gv_moneda);
					var gv_riesgodispo = that.addCommas(response.data.Zriesgodisponi);

					that.inputRiesgoDispon.setValue(gv_riesgodispo + " " + gv_moneda);

					var comercial = response.data.Zcomercial;
					if (comercial === "Sincomercial") {
						comercial = "COMERCIAL NO ASIGNADO";
					}
					that.inputComercial.setValue(comercial);

					that.inputViaPago.setValue(response.data.Zwels);

					that.calcularPrecios();
				},
				function () {

				});

			var oParams2 = {
				Zflag: "X",
				Kunnr: sKunnr,
				Vkorg: this.oAppData.vkorg
			}

			var url2 = this.sUrl + "/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";
			var oModel2 = new sap.ui.model.odata.ODataModel(url2, false);
			oModel2.callFunction("zzfuncion2",
				"GET",
				oParams2,
				null,
				function (oData2, response2) {
					that.setCondicionCobro(response2.data);
				},
				function () {
					sap.m.MessageToast.show("Error cargando los CONDICION COBRO. Más info en transacción '/IWFND/ERROR_LOG'");
				});

		},

		onF4CondCobro: function (oEvn) {
			var that = this;
			// Tabla con los valores de la ayuda de busqueda
			var HelpTablezterm = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes true
				width: "300pt"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpzterm = new sap.m.Popover({
				modal: true,
				title: "Condición de Cobro",
				afterClose: function () {
					////////////////////////////////////////////////////////////////////////////////////////
					// Obtención del Código de la condición de cobro
					var Contextzterm = HelpTablezterm.getContextByIndex(HelpTablezterm.getSelectedIndex());
					var Selzterm = Contextzterm.getModel().getProperty(Contextzterm.getPath());
					that.inputCondCobro.setValue(Selzterm.Zterm);
					////////////////////////////////////////////////////////////////////////////////////////
					// Obtención del texto de la condición de cobro
					var Contextztermval = HelpTablezterm.getContextByIndex(HelpTablezterm.getSelectedIndex());
					var Selztermval = Contextztermval.getModel().getProperty(Contextztermval.getPath());
					that.inputCondCobroDesc.setValue(Selztermval.Text1);

					//Llama al metodo para rellenar la fecha de condición de cobro
					that.onSelectCondCobro();
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonzterm = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpzterm.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Condición de Cobro
			HelpTablezterm.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Condición Cobro"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Zterm"),
					sortProperty: "Zterm",
					filterProperty: "Zterm"
				})
			);

			// Columna Texto Condición de Cobro
			HelpTablezterm.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Texto"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Text1"),
					sortProperty: "Text1",
					filterProperty: "Text1"
				})
			);

			// Obtención de los valores de la ayuda de busqueda emplead

			var HelpModelzterm = new sap.ui.model.json.JSONModel();

			var HelpURLzterm = this.sUrl + "/sap/opu/odata/SAP/ZAYUDAZTERM_SRV/ZmcLo00Set";
			HelpModelzterm.loadData(HelpURLzterm, false);
			HelpTablezterm.setModel(HelpModelzterm);
			HelpTablezterm.bindAggregation("rows", "/d/results");

			ValueHelpzterm.addContent(HelpTablezterm);
			ValueHelpzterm.setEndButton(OkButtonzterm);
			ValueHelpzterm.openBy(this.inputCondCobro);

		},

		onF4DestMerc: function (oEvn) {
			var that = this;
			//MODIFICACIÓN AARANDA 05/06/2018: Las direcciones de entrega solo podrán visualizarse si seleccionan cliente previamente
			var client = this.inputNumCliente.getValue();
			var orgVentas = this.oAppData.vkorg;
			if (client) {
				//FIN MODIFICACIÓN AARANDA 05/06/2018: Las direcciones de entrega solo podrán visualizarse si seleccionan cliente previamente

				// Tabla con los valores de la ayuda de busqueda
				var HelpTabledestina = new sap.ui.table.Table({
					selectionMode: sap.ui.table.SelectionMode.Single,
					selectionBehavior: "Row",
					visibleRowCount: 7,
					enableColumnFreeze: false, //antes true
					width: "600pt"
				});

				// Parámetros del PopUP de la ayuda de busqueda
				var ValueHelpdestina = new sap.m.Popover({
					modal: true,
					title: "Destinatario de Mercancías",
					afterClose: function (oEvn) {
						////////////////////////////////////////////////////////////////////////////////////////
						// Obtención del Código del Cliente
						var Contextdestina = HelpTabledestina.getContextByIndex(HelpTabledestina.getSelectedIndex());
						var Seldestina = Contextdestina.getModel().getProperty(Contextdestina.getPath());
						that.inputDestinaMerca.setValue(Seldestina.Kunn2);
						////////////////////////////////////////////////////////////////////////////////////////
						// Obtención del Nombre del Cliente
						var Contextdestinaval = HelpTabledestina.getContextByIndex(HelpTabledestina.getSelectedIndex());
						var Seldestinaval = Contextdestinaval.getModel().getProperty(Contextdestinaval.getPath());
						that.inputDestinaMercaDesc.setValue(Seldestinaval.Mcod1);
					}
				});

				// Botón de la Ayuda de busqueda
				var OkButtondestina = new sap.m.Button({
					text: "OK",
					press: function (oEvent) {
						ValueHelpdestina.close();
					}
				});

				// Diferentes Columnas de la Ayuda de busqueda

				// Columna Cliente
				HelpTabledestina.addColumn(
					new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "Cliente"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Kunn2"),
						sortProperty: "Kunn2",
						filterProperty: "Kunn2"
					})
				);

				// Columna Nombre1
				HelpTabledestina.addColumn(
					new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "Nombre1"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Mcod1"),
						sortProperty: "Mcod1",
						filterProperty: "Mcod1"
					})
				);

				// Columna Población
				HelpTabledestina.addColumn(
					new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "Población"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Mcod3"),
						sortProperty: "Mcod3",
						filterProperty: "Mcod3"
					})
				);

				// Columna Concepto Busqueda
				HelpTabledestina.addColumn(
					new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "C.P."
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Pstlz"),
						sortProperty: "Pstlz",
						filterProperty: "Pstlz"
					})
				);

				// Columna Pais
				HelpTabledestina.addColumn(
					new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "País"
						}),
						template: new sap.ui.commons.TextView().bindProperty("text", "Land1"),
						sortProperty: "Land1",
						filterProperty: "Land1"
					})
				);
				// Obtención de los valores de la ayuda de busqueda empleada
				var HelpModeldestina = new sap.ui.model.json.JSONModel();

				//MODIFICACIÓN AARANDA 05/06/2018: FILTRAR DIRECCIONES POR CLIENTE SELECCIONADO, ORGANIZACIÓN DE VENTAS y función de interlocutor "ZC"
				var filtrar = false;

				var mParameters = {
					async: false,
					success: function (oData, oResponse) {
						if (oData.Direntrega && oData.Direntrega === "X") {
							filtrar = true;
						} else {
							filtrar = false;
						}
					},
					error: function () {
						filtrar = false;
					}
				};

				var url = this.sUrl + "/sap/opu/odata/SAP/ZOTRAS_AYUDAS_SRV/MantDirEntSet(Vkorg='" + orgVentas + "')";

				var model = new sap.ui.model.odata.ODataModel(url, false);

				model.read("/", mParameters);

				var HelpURLdestina = "";
				if (filtrar) {
					HelpURLdestina = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/Debia2Set?$filter=( Kunnr eq '" + client + "' and Vkorg eq '" +
						orgVentas + "' and Parvw eq 'WE')";
				} else {
					HelpURLdestina = this.sUrl + "/sap/opu/odata/SAP/ZAYUDADEBIA_SRV/Debia2Set?$filter=( Parvw eq 'WE')";
				}

				HelpModeldestina.loadData(HelpURLdestina, false);
				HelpTabledestina.setModel(HelpModeldestina);
				HelpTabledestina.bindAggregation("rows", "/d/results");

				ValueHelpdestina.addContent(HelpTabledestina);
				ValueHelpdestina.setEndButton(OkButtondestina);
				ValueHelpdestina.openBy(this.inputDestinaMerca);

			} else { //MODIFICACION AARANDA 05/06/2018: Si no hay cliente debe dar error
				sap.m.MessageToast.show("Seleccione un cliente previamente.");
			}
		},

		onF4ClaseDoc: function (oEvn) {
			var that = this;

			// Tabla con los valores de la ayuda de busqueda
			var HelpTableclasedoc = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes true
				width: "300pt"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpclasedoc = new sap.m.Popover({
				modal: true,
				title: "Clase de Documento",
				afterClose: function () {

					var Contextclasedoc = HelpTableclasedoc.getContextByIndex(HelpTableclasedoc.getSelectedIndex());
					var Selclasedoc = Contextclasedoc.getModel().getProperty(Contextclasedoc.getPath());
					that.inputClaseDoc.setValue(Selclasedoc.Auart);

					var Contextclasedoc2 = HelpTableclasedoc.getContextByIndex(HelpTableclasedoc.getSelectedIndex());
					var Selclasedoc2 = Contextclasedoc2.getModel().getProperty(Contextclasedoc2.getPath());
					that.inputClaseDocDesc.setValue(Selclasedoc2.Bezei);

				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonclasedoc = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpclasedoc.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Clase de Documento
			HelpTableclasedoc.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Clase de Documento"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Auart"),
					sortProperty: "Auart",
					filterProperty: "Auart"

				})
			);

			// Columna Descripción Clase de Documento
			HelpTableclasedoc.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Bezei"),
					sortProperty: "Bezei",
					filterProperty: "Bezei"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelclasedoc = new sap.ui.model.json.JSONModel();

			var HelpURLclasedoc = this.sUrl + "/sap/opu/odata/SAP/ZAYUDACLASEDOC_SRV/HTvakSet";

			if (this.inputClaseDoc.getValue() === "ZFI2" || this.inputClaseDoc.getValue() === "ZAB2") {
				// Se cambia el comportatimento del botón sin es pedido sin Stock
				var data = {
					results: [{
						Auart: "ZFI2",
						Bezei: "PEDIDO FIRME S/DISPO",
						__metadata: {
							id: "http://195.76.192.97:8030/sap/opu/odata/SAP/ZAYUDACLASEDOC_SRV/HTvakSet('ZFI2')",
							type: "ZAYUDACLASEDOC_SRV.HTvak",
							uri: "http://195.76.192.97:8030/sap/opu/odata/SAP/ZAYUDACLASEDOC_SRV/HTvakSet('ZFI2')"
						}
					}, {
						Auart: "ZAB2",
						Bezei: "PED.ABIERTO S/DISPO",
						__metadata: {
							id: "http://195.76.192.97:8030/sap/opu/odata/SAP/ZAYUDACLASEDOC_SRV/HTvakSet('ZAB2')",
							type: "ZAYUDACLASEDOC_SRV.HTvak",
							uri: "http://195.76.192.97:8030/sap/opu/odata/SAP/ZAYUDACLASEDOC_SRV/HTvakSet('ZAB2')"
						}
					}]
				};
				HelpModelclasedoc.setData({
					d: data
				});

			} else {
				HelpModelclasedoc.loadData(HelpURLclasedoc, false);
			}

			HelpTableclasedoc.setModel(HelpModelclasedoc);
			HelpTableclasedoc.bindAggregation("rows", "/d/results");

			ValueHelpclasedoc.addContent(HelpTableclasedoc);
			ValueHelpclasedoc.setEndButton(OkButtonclasedoc);
			ValueHelpclasedoc.openBy(this.inputClaseDoc);
		},

		onF4ViaPago: function (oEvn) {
			var that = this;
			// Tabla con los valores de la ayuda de busqueda
			var HelpTableviapago = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes true
				width: "300pt"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpviapago = new sap.m.Popover({
				modal: true,
				title: "Vía de Pago",
				afterClose: function () {

					var Contextviapago = HelpTableviapago.getContextByIndex(HelpTableviapago.getSelectedIndex());
					var Selviapago = Contextviapago.getModel().getProperty(Contextviapago.getPath());
					that.inputViaPago.setValue(Selviapago.Zlsch);
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonviapago = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpviapago.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Vía de Pago
			HelpTableviapago.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Vía de Pago"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Zlsch"),
					sortProperty: "Zlsch",
					filterProperty: "Zlsch"

				})
			);

			// Columna Descripción Vía de Pago
			HelpTableviapago.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Text2"),
					sortProperty: "Text2",
					filterProperty: "Text2"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelviapago = new sap.ui.model.json.JSONModel();

			var HelpURLviapago = this.sUrl + "/sap/opu/odata/SAP/ZAYUDAVIAPAGO_SRV/HT042zSet";

			HelpModelviapago.loadData(HelpURLviapago, false);
			HelpTableviapago.setModel(HelpModelviapago);
			HelpTableviapago.bindAggregation("rows", "/d/results");

			ValueHelpviapago.addContent(HelpTableviapago);
			ValueHelpviapago.setEndButton(OkButtonviapago);
			ValueHelpviapago.openBy(this.inputViaPago);

		},

		onF4Moneda: function (oEvn) {
			var that = this;

			// Tabla con los valores de la ayuda de busqueda
			var HelpTablemoneda = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes true
				width: "300pt"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpmoneda = new sap.m.Popover({
				modal: true,
				title: "Moneda",
				afterClose: function () {

					var Contextmoneda = HelpTablemoneda.getContextByIndex(HelpTablemoneda.getSelectedIndex());
					var Selmoneda = Contextmoneda.getModel().getProperty(Contextmoneda.getPath());
					that.inputMoneda.setValue(Selmoneda.Waers);
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonmoneda = new sap.ui.commons.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpmoneda.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Moneda
			HelpTablemoneda.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Moneda"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Waers"),
					sortProperty: "Waers",
					filterProperty: "Waers"

				})
			);

			// Columna Descripción
			HelpTablemoneda.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Ktext"),
					sortProperty: "Ktext",
					filterProperty: "Ktext"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelmoneda = new sap.ui.model.json.JSONModel();

			var HelpURLmoneda = this.sUrl + "/sap/opu/odata/SAP/ZAYUDAWAERS_SRV/ZmcLo01Set";

			HelpModelmoneda.loadData(HelpURLmoneda, false);
			HelpTablemoneda.setModel(HelpModelmoneda);
			HelpTablemoneda.bindAggregation("rows", "/d/results");

			ValueHelpmoneda.addContent(HelpTablemoneda);
			ValueHelpmoneda.setEndButton(OkButtonmoneda);
			ValueHelpmoneda.openBy(this.inputMoneda);

		},

		/* Eventos */
		onLiveChangeUppercase: function (oEvn) {
			var str = oEvn.getParameter("value");
			oEvn.getSource().setValue(str.toUpperCase());
		},

		onChangeKunnr: function (oEvn) {
			var sKunnr = oEvn.getSource().getSelectedKey();
			this.oModelAppData.setProperty("/codCliente", sKunnr);
			this._closeF4Kunnr(sKunnr);
			this.inputNumCliente.setValue(sKunnr);
		},

		onLiveCangeCondicCobro: function (oEvn) {
			//Cogemos el valor
			var zTerm = oEvn.getSource().getValue();
			zTerm = zTerm.toUpperCase();
			oEvn.getSource().setValue(zTerm);

			//Si es de tamaño cero borramos la fecha y la descripción
			if (zTerm.length === 0) {
				this.dateFechaVencim.setDateValue(null);
				this.inputCondCobroDesc.setValue("");

				//Si el tamaño es de cuatro buscamos la descripcion. Si existe calcula la fecha
			} else if (zTerm.length === 4) {
				//Cogemos la url del servicio
				var url = this.sUrl + "/sap/opu/odata/sap/ZAYUDAZTERM_SRV/ZmcLo00Set('" + zTerm + "')";
				var model = new sap.ui.model.json.JSONModel(url);

				model.attachRequestCompleted(function () {
					var desc = this.getProperty("/d/Text1");
					this.inputCondCobroDesc.setValue(desc);

					if (desc) {
						this.getView().onSelectCondCobro(zTerm);
					}
				});

			}

		},

		//DANI he añadido el onF4Matnr , onF4MatnrSelected, 	onF4Incoterm (este ultimo funciona bien )
		onF4Matnr: function (oEvn) {
			// Obtención de la fila seleccionada
			var that = this;
			var oSource = oEvn.getSource();

			// Tabla con los valores de la ayuda de búsqueda
			var HelpTableMatnr = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false,
				width: "40em"
			});

			// Parámetros del PopUP de la ayuda de búsqueda
			var ValueHelpMatnr = new sap.m.Popover({
				modal: true,
				title: "Material",
				afterClose: function () {
					that._closeF4Matnr(HelpTableMatnr, oSource)
				}
			});

			// Botón de la ayuda de búsqueda
			var OkButtonMatnr = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpMatnr.close();
				}
			});

			HelpTableMatnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Descripción Material"
					}),
					template: new sap.m.Text().bindProperty("text", "Maktx"),
					sortProperty: "Maktx",
					filterProperty: "Maktx"
				})
			);

			HelpTableMatnr.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Mat."
					}),
					template: new sap.m.Text().bindProperty("text", "Matnr"),
					width: "5em",
					sortProperty: "Matnr",
					filterProperty: "Matnr"
				})
			);

			var HelpModelMatnr = new sap.ui.model.json.JSONModel();
			// URL del servicio
			var HelpURLMatnr = this.sUrl + "/sap/opu/odata/SAP/ZAYUDAMATNR_SRV/Mat0mSet";

			if (this.oAppData.bMaterialesCargados) {
				//HelpModelMatnr.loadData(HelpURLMatnr, {}, false);
				//HelpTableMatnr.setModel(HelpModelMatnr);
				HelpTableMatnr.setModel(this.getView().getModel("Materiales"));
				HelpTableMatnr.bindRows("/");

				ValueHelpMatnr.addContent(HelpTableMatnr);
				ValueHelpMatnr.setEndButton(OkButtonMatnr);
				ValueHelpMatnr.openBy(oEvn.getSource());
			} else {
				sap.m.MessageToast.show(this.oAppData.sMaterialesCargados);
			}
		},

		_closeF4Matnr: function (oHelpTableMatnr, oSource) {

			//var MatnrInput = oSource;
			var selectedIndex = oHelpTableMatnr.getSelectedIndex();

			if (selectedIndex !== -1) {
				// Hay una fila seleccionada en la tabla
				var ContextMatnr = oHelpTableMatnr.getContextByIndex(selectedIndex);
				var Selmatnr = ContextMatnr.getProperty(ContextMatnr.getPath());
				oSource.setValue(Selmatnr.Maktg); // realmente se quiere la definicion es decir el Maktg no el Matnr

				// Para aplicar el valor a la tabla
				var sPath = oSource.getBindingContext().getPath();
				var oLine = oSource.getParent().getModel().getProperty(sPath);
				//MatnrInput.setValue(Selmatnr.Matnr);
				this.onF4MatnrSelected(Selmatnr,
					oLine.Lgort,
					oLine.Lgobe,
					oLine.Matnr,
					sPath)
			}
		},

		onF4MatnrSelected: function (Selmatnr, LgortInput, Zinco2Input, InputMatnr, sPath) {
			var Zinco2InputValue = Zinco2Input;
			var LgortInputValue = LgortInput;

			var HelpURLmatnr = this.sUrl + "/sap/opu/odata/SAP/ZOBTENCIONODATA_SRV/ZST_LO_09Set";
			//var gv_werks = sap.ui.getCore().byId("IDWerksLabelF4").getValue(); // Centro
			var sWerks = this.oAppData.werks; // Centro
			var sVkorg = this.oAppData.vkorg; // Org.Vtas.

			var querywerks = " and substringof('" + sWerks + "',Werks)";
			var queryvkorg = " and substringof('" + sVkorg + "',Vkorg)";
			var querymatnr = "$filter=substringof('" + encodeURIComponent(Selmatnr.Maktx) + "',Matnr)";
			var querycheckbox = " and substringof('Y',Zflag)";
			//var querylgort = " and substringof('" + Zinco2InputValue + "',Lgort)";
			var querylgort = " and substringof('" + LgortInputValue + "',Lgort)";
			var qjson = "&format=json";
			//var querydef = querymatnr + querywerks + querycheckbox + qjson;
			var querydef = querymatnr + querywerks + queryvkorg + querylgort + querycheckbox + qjson;

			var HelpModelmatnrI = new sap.ui.model.json.JSONModel();
			HelpModelmatnrI.loadData(HelpURLmatnr, querydef, false);

			var SelmatnrI = HelpModelmatnrI.getProperty("/d/results/0");

			if (SelmatnrI) {

				var aTable = this.tablePedido; //sap.ui.getCore().byId("tableView3");
				//	var aTableContext = aTable.getContextByIndex(indice);

				var LgortInputValue2 = (SelmatnrI.Lgort === "") ? LgortInputValue : SelmatnrI.Lgort;
				var Zinco2InputValue2 = (SelmatnrI.Lgobe === "") ? Zinco2InputValue : SelmatnrI.Lgobe;

				if (SelmatnrI.Zprecioeditable === "") {
					SelmatnrI.Zprecioeditable = false;
				} else {
					SelmatnrI.Zprecioeditable = true;
				}
				if (SelmatnrI.Zcondclieditable === "") {
					SelmatnrI.Zcondclieditable = false;
				} else {
					SelmatnrI.Zcondclieditable = true;
				}

				SelmatnrI.Zinco2 = Zinco2InputValue2;
				SelmatnrI.Lgort = LgortInputValue2;

				//FIX MA 20210211
				SelmatnrI.Zfechaentrega = new Date();

				//Change the item
				var oModel = this.getView().getModel("TableCreateModel");
				oModel.setProperty(sPath, SelmatnrI);

			} else {
				sap.m.MessageToast.show(
					"Error al consultar los datos del material. Si el problema persiste compruebe que el material existe para los parámetros solicitados."
				);
			}
		},

		onF4Incoterm: function (evt) {

			// Obtención de la fila seleccionada
			var sourceId = evt.getSource().sId;
			//var sourceId = evt.getSource()._sId;

			// Tabla con los valores de la ayuda de busqueda
			var HelpTableIncoterm = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				selectionBehavior: "Row",
				visibleRowCount: 7,
				enableColumnFreeze: false, //antes true
				width: "300pt"
			});

			// Parámetros del PopUP de la ayuda de busqueda
			var ValueHelpIncoterm = new sap.m.Popover({
				modal: true,
				title: "Incoterm",
				afterClose: function () {

					// Obtención del Código del Incoterm
					var oCoreIncoterm = sap.ui.getCore();
					var IncotermInput = oCoreIncoterm.byId(sourceId);
					var ContextIncoterm = HelpTableIncoterm.getContextByIndex(HelpTableIncoterm.getSelectedIndex());
					var SelIncoterm = ContextIncoterm.getModel().getProperty(ContextIncoterm.getPath());
					IncotermInput.setValue(SelIncoterm.Inco1);
				}
			});

			// Botón de la Ayuda de busqueda
			var OkButtonIncoterm = new sap.m.Button({
				text: "OK",
				press: function (oEvent) {
					ValueHelpIncoterm.close();
				}
			});

			// Diferentes Columnas de la Ayuda de busqueda

			// Columna Moneda
			HelpTableIncoterm.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Inco1"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Inco1"),
					sortProperty: "Inco1",
					filterProperty: "Inco1"

				})
			);

			// Columna Descripción
			HelpTableIncoterm.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Descripción"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Bezei"),
					sortProperty: "Bezei",
					filterProperty: "Bezei"
				})
			);

			// Obtención de los valores de la ayuda de busqueda empleada
			var HelpModelIncoterm = new sap.ui.model.json.JSONModel();

			var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
			var HelpURLIncoterm = oUrl + "/sap/opu/odata/SAP/ZAYUDAINCO1_SRV/HTincSet";
			HelpModelIncoterm.loadData(HelpURLIncoterm, false);
			HelpTableIncoterm.setModel(HelpModelIncoterm);
			HelpTableIncoterm.bindAggregation("rows", "/d/results");
			ValueHelpIncoterm.addContent(HelpTableIncoterm);
			ValueHelpIncoterm.setEndButton(OkButtonIncoterm);
			ValueHelpIncoterm.openBy(evt.getSource());
		},

		parseDate: function (value) {

			/*			if(value){
							function fill(s) { return (s < 10) ? '0' + s : s; }
							var d = new Date(value);
			
							return (d.valueOf()) ? [fill(d.getDate()), fill(d.getMonth()+1), d.getFullYear()].join('/') : value;
						}else{
							return "00/00/0000";
						}*/
			if (value) {
				function fill(s) { return (s < 10) ? '0' + s : s; }
				var d = new Date(value);
				// Raro será que lleguemos al año 2099 y siga esta línea aqui...
				return (d.valueOf()) ? [fill(d.getDate()), fill(d.getMonth() + 1), d.getFullYear()].join('/') : fill(value.split("/")[0]) + "/" + fill(value.split("/")[1]) + "/20" + fill(value.split("/")[2]);
			} else {
				return "";
			}
		},

		/**
		 * This function validates live change 
		 * in numeric inputs. Deletes the non-valid characters.
		 */
		isNumber: function (evt) {
			var that = this;
			if (evt) {
				var fieldId = evt.getParameter("id");
				var source = evt.getSource();
				if (source) {
					var value = source.getValue();
					if (value) {
						var regex = /^[-+]?(\d+)((\d+)|((,\d+)?))+(\.\d+)?$/;
						//Find duplicated commas or points
						var points = value.split('.');
						var commas = value.split(',');
						var percentage = value.indexOf("%");

						if ((!regex.test(value) || points.length > 2 || commas.length > 2) && percentage == -1) {
							source.setValueState(sap.ui.core.ValueState.Error);
							that.setErrorModel(true, fieldId);
						} else {
							var auxValue = value.replace(/[.]/gi, '');
							var stringValue = auxValue.replace(/[,]/gi, '.');
							source.setValue(stringValue);
							that.setErrorModel(false, fieldId);
							source.setValueState(sap.ui.core.ValueState.None);
						}
					}
				}
			}
		},

		checkPointNumber: function (number) {
			var points = number.split('.');
			var commas = number.split(',');

			if (points.length > 1 && commas.length > 1) {
				number = number.replace(/[.]/gi, '');
				number = number.replace(/[,]/gi, '.');
			} else if (points.length > 1 && commas.length <= 1) {
				//Solo points
			} else {
				number = number.replace(/[.]/gi, '');
				number = number.replace(/[,]/gi, '.');
				//Solo comas
			}
			return number;

		},
		/**
		 *  Función para convertir un número con separadores de miles y los decimales con coma
		 */
		addCommas: function (nStr) {
			nStr += '';
			var x = nStr.split('.');
			var x1 = x[0];
			var x2 = x.length > 1 ? ',' + x[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + '.' + '$2');
			}
			return x1 + x2;
		},

		/**
		 * Función para convertir un número con separadores de miles y los decimales con coma
		 */
		addCommas2: function (nStr) {
			if (nStr) {
				var outString = nStr.replace(/[.]/gi, '');
				var outString2 = outString.replace(/[,]/gi, '.');
				return outString2;
			}
			return '';
		},

		setCondicionCobro: function (response) {
			// this.oModelAppData.
			var permissionsModel = this.oModelAppData.getProperty("/PermissionsModel");
			permissionsModel.setProperty("/condicionCobroId", response.Condicioncobroid);
			permissionsModel.setProperty("/condicionCobroDesc", response.Condicioncobrodesc);

			this.inputCondCobro.setValue(response.Condicioncobroid);
			this.inputCondCobroDesc.setValue(response.Condicioncobrodesc);
			this.onSelectCondCobro(response.Condicioncobroid);
		},
		//DANI

		saveDateAlamacenPagado: function (oEvn) {
			if (oEvn) {
				//var fieldId = oEvn.getParameter("id");
				var source = oEvn.getSource();
				if (source) {
					var value = source.getValue();

					var oModelfecha = this.getView().getModel("ModelFecha");
					oModelfecha.dateValue2 = value;

					this.getView().setModel(oModelfecha, "ModelFecha");

				}
			}
		},

		onPartidasRiesgoCli: function (oEvn) {
			var gv_cliente = this.inputNumCliente.getValue(); // Cliente

			if (gv_cliente) {
				var gv_campo = ' KNKLI-LOW=' + gv_cliente;
				var newURL = this.sUrl + this.toVKM1 + gv_campo;
				window.open(newURL);
			} else {
				sap.m.MessageToast.show("Por favor, Introduzca el campo de cliente");
			}
		},

		onPartidasAbiertas: function (oEvn) {
			var gv_cliente = this.inputNumCliente.getValue(); // Cliente para la transacción S_ALR_87012218

			if (gv_cliente) {
				var gv_campo = ' P_KUNNR=' + gv_cliente; // Cliente
				var gv_campo2 = ';P_KKBER=' + this.oAppData.werks; // Centro
				var newURL2 = this.sUrl + this.toZSD010 + gv_campo + gv_campo2;
				window.open(newURL2);
			} else {
				sap.m.MessageToast.show("Por favor, Introduzca el campo de cliente");
			}
		},

		// Navega a vista6
		onCrearDestinatario: function (oEvn) {
			var gv_cliente = this.inputNumCliente.getValue(); // Cliente para la transacción S_ALR_87012218

			if (gv_cliente) {
				this.goToView6();
			} else {
				sap.m.MessageToast.show("Por favor, Introduzca el campo de cliente");
			}
		},

		calcularPreciosAndSave: function () {
			var that = this;
			/*Revisar este infierno...*/

			//Comprobar el input
			//sap.ui.controller("view.View3").isNumber(evt);
			//Si no hay errores, calcular los precios.
			var errorModel = this.getView().getModel("ErrorsModel");
			var safeToSave = errorModel.getProperty("/safeToSave");
			if (safeToSave) {
				///////////////////////////////////////////////////////////////////////////////
				// Actualización Precio Neto
				// Inicio
				///////////////////////////////////////////////////////////////////////////////
				var that = this;
				// Definición Array
				var obj = [];
				// Definición Modelo
				var oModelview3 = new sap.ui.model.json.JSONModel();
				// Obtención del ID de la tabla
				var gv_tablaview3 = this.tablePedido; //this.getView().byId("tableView3");
				// Obtención del modelo de la tabla
				var gv_modeltablaview3 = this.getView().getModel("TableCreateModel"); //gv_tablaview3.getModel();
				// Obtención de los datos de la tabla
				var gv_tabledataview3 = gv_modeltablaview3.getData();

				//////////////////////////////////////////////////////////////////////////////
				// Llamada al servicio Odata para la Bapi "SD_SALESDOCUMENT_CREATE"
				// para obtener el precio neto de la posición con los margenes,descuentos etc
				// Inicio
				/////////////////////////////////////////////////////////////////////////////
				var paramprecionet = this._initParametrosBapi();

				for (var i = 0; i < gv_tabledataview3.modelData.length; i++) {

					var gvindex = gv_tabledataview3.modelData[i]; // Valor de cada fila con los valores seleccionados
					if (gvindex.Matnr !== "") {

						// if (gvindex.ZprecioTarifa){
						// gvindex.ZprecioTarifa = sap.ui.controller("view.View3").checkPointNumber(gvindex.ZprecioTarifa);
						gvindex.ZprecioTarifa = (gvindex.ZprecioTarifa) ? this.checkPointNumber(gvindex.ZprecioTarifa) : "";
						// }
						if (gvindex.Zcanti) {
							// gvindex.Zcanti = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zcanti);
							gvindex.Zcanti = this.checkPointNumber(gvindex.Zcanti);
						}
						if (gvindex.Zprecio1) {
							// gvindex.Zprecio1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecio1);
							gvindex.Zprecio1 = this.checkPointNumber(gvindex.Zprecio1);
						}
						if (gvindex.Zprecionet) {
							// gvindex.Zprecionet = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecionet);
							gvindex.Zprecionet = this.checkPointNumber(gvindex.Zprecionet);
						}
						if (gvindex.Zprecio2) {
							// gvindex.Zprecio2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zprecio2);
							gvindex.Zprecio2 = this.checkPointNumber(gvindex.Zprecio2);
						}
						if (gvindex.Zmargen1) {
							// gvindex.Zmargen1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zmargen1);
							gvindex.Zmargen1 = this.checkPointNumber(gvindex.Zmargen1);
						}
						if (gvindex.Zmargen2) {
							// gvindex.Zmargen2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zmargen2);
							gvindex.Zmargen2 = this.checkPointNumber(gvindex.Zmargen2);
						}
						if (gvindex.Zdes1) {
							// gvindex.Zdes1 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zdes1);
							gvindex.Zdes1 = this.checkPointNumber(gvindex.Zdes1);
						}
						if (gvindex.Zdes2) {
							// gvindex.Zdes2 = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zdes2);
							gvindex.Zdes2 = this.checkPointNumber(gvindex.Zdes2);
						}
						if (gvindex.Zincofas) {
							//gvindex.Zincofas = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zincofas);
							gvindex.Zincofas = this.checkPointNumber(gvindex.Zincofas);
						}
						if (gvindex.Zincocif) {
							// gvindex.Zincocif = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zincocif);
							gvindex.Zincocif = this.checkPointNumber(gvindex.Zincocif);
						}
						if (gvindex.Zporte) {
							// gvindex.Zporte = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zporte);
							gvindex.Zporte = this.checkPointNumber(gvindex.Zporte);
						}
						if (gvindex.Zcondpago) {
							// gvindex.Zcondpago = sap.ui.controller("view.View3").checkPointNumber(gvindex.Zcondpago);
							gvindex.Zcondpago = this.checkPointNumber(gvindex.Zcondpago);
						}

						// Material
						paramprecionet.Zmatnr.push(gvindex.Matnr);
						// Lote
						paramprecionet.Zlote.push(gvindex.Charg);
						// Cantidad
						paramprecionet.Zcanti.push(gvindex.Zcanti);
						// Almacén
						paramprecionet.Zlgort.push(gvindex.Lgort);
						//Modificación DGA 11/05/2018 - El campo  precio base debe ser modificable
						paramprecionet.Zprecio1.push(gvindex.Zprecio1);
						//Fin DGA 11/05/2018 - El campo  precio base debe ser modificable
						paramprecionet.Zprecionet.push(gvindex.Zprecionet); // Precio vta
						// Envasado
						paramprecionet.Zprecio2.push(gvindex.Zprecio2);
						//Fecha desde y fecha hasta
						paramprecionet.Zfechad.push(this.parseDate(gvindex.Zfechad));
						paramprecionet.Zfechah.push(this.parseDate(gvindex.Zfechah));
						// Margen 1
						paramprecionet.Zmargen1.push(gvindex.Zmargen1);
						// Margen 2
						paramprecionet.Zmargen2.push(gvindex.Zmargen2);
						// Descuento 1 (No se utiliza)
						paramprecionet.Zdes1.push(gvindex.Zdes1);
						// Descuento 2 (Arancel)
						paramprecionet.Zdes2.push(gvindex.Zdes2);
						// Incoterm FAS
						paramprecionet.Zincofas.push(gvindex.Zincofas);
						// Incoterm CIF
						paramprecionet.Zincocif.push(gvindex.Zincocif);
						// Porte
						paramprecionet.Zporte.push(gvindex.Zporte);
						// Condición Cliente
						paramprecionet.Zcondipago.push(gvindex.Zcondpago);
						//Centro
						paramprecionet.Zwerks.push(gvindex.Werks);
						//Org. Vtas seleccionada en la primera pantalla
						paramprecionet.Zvkorg.push(this.oAppData.vkorg);
						//paramprecionet.Zprecionet = 0; //Precio Neto
						// INCO1
						paramprecionet.Zinco1.push(gvindex.Zinco1);
						// INCO2
						paramprecionet.Zinco2.push(gvindex.Zinco2);
						paramprecionet.Zfechaentrega.push(this.parseDate(new Date()));
					}
				}

				paramprecionet.Zcliente = this.inputNumCliente.getValue(); // Cliente 
				paramprecionet.Zfechaped = this.parseDate(this.dateFechaPedido.getDateValue()); // Fecha Pedido
				paramprecionet.Zcondicobro = this.inputCondCobro.getValue(); // Condición Cobro
				paramprecionet.Znumpedi = this.inputNumPedido.getValue(); // Nº Pedido
				paramprecionet.Zclasedoc = this.inputClaseDoc.getValue(); // Clase de Documento
				paramprecionet.Zdestimerca = this.inputDestinaMerca.getValue(); // Destinatario de Mercancías
				paramprecionet.Zviapago = this.inputViaPago.getValue(); // Vía de pago
				paramprecionet.Zcomercial = this.inputComercial.getValue(); // Comercial
				paramprecionet.Zmoneda = this.inputMoneda.getValue(); // Moneda
				paramprecionet.Zalmacenpaga = this.parseDate(this.datePagadoHasta.getDateValue()); // Fecha Almacen Pagado a
				if (!paramprecionet.Zvkorg || paramprecionet.Zvkorg === "" || paramprecionet.Zvkorg.length === 0) {
					paramprecionet.Zvkorg = this.oAppData.vkorg; //Org. Vtas seleccionada en la primera pantalla
				}

				var urlprecionet = this.sUrl + "/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";

				// OPERACION GET, LLAMADA AL ODATA
				var oModelprecionet = new sap.ui.model.odata.ODataModel(urlprecionet, false);
				oModelprecionet.callFunction("zzfuncion",
					"GET",
					paramprecionet,
					null,
					function (oDatabapi, responsebapi) {

						// Obtención de las filas del listado
						var gv_tablaview33 = that.tablePedido; //that.getView().byId("tableView3");
						var gv_modeltablaview33 = gv_tablaview33.getModel();
						var gv_tabledataview33 = gv_modeltablaview33.getData();
						//	console.log(gv_modeltablaview33);

						for (var cont = 0; cont < gv_tabledataview33.modelData.length; cont++) {
							if (gv_tabledataview33.modelData[cont].Matnr !== "") {
								// Obtención de todos los datos de la línea
								var gv_fila = gv_tabledataview3.modelData[cont];
								//	console.log("GV_FILA");
								//	console.log(gv_fila);
								console.log("responsebapi calcularPreciosAndSave", responsebapi);
								console.log("responsebapi.data", responsebapi.data);

								// Recuperación del Precio Neto de la función import
								var gv_precioventa = responsebapi.data.ZprecioVenta;
								// Recuperación del Precio 1 Granel de la función import
								var gv_precio1 = responsebapi.data.Zprecio1;
								// Recuperación del Precio Envasado de la función import
								var gv_preciozenv = responsebapi.data.Zpreciozenv;
								//		console.log("Response bapi : " + gv_preciozenv);
								// Recuperación del Precio Incoterm FAS de la función import
								var gv_preciozfas = responsebapi.data.Zpreciozfas;
								// Recuperación del Precio Incoterm CIF de la función import
								var gv_preciozcif = responsebapi.data.Zpreciozcif;
								// Recuperación del Precio de la Condición de Cliente Import
								var gv_preciocondi = responsebapi.data.Zpreciocondi;
								// Recuperación del Precio Portes
								var gv_precioporte = responsebapi.data.Zprecioporte;
								// Recuperación del Precio Descuento 1 de la función import
								var gv_preciodes = responsebapi.data.Zpreciodes;

								// Obtención del Array de los precios netos
								var gv_valorprecioventa = gv_precioventa.split("/");
								// Obtención del Array de los precios 1 
								var gv_valorprecio1 = gv_precio1.split("/");
								// Obtención del Array de los precios envasados
								var gv_valorpreciozenv = gv_preciozenv.split("/");
								// Obtención del Array de los precios Incoterm FAS
								var gv_valorpreciozfas = gv_preciozfas.split("/");
								// Obtención del Array de los precios Incoterm CIF
								var gv_valorpreciozcif = gv_preciozcif.split("/");
								// Obtención del Array del Precio de la Condición
								var gv_valorpreciocondi = gv_preciocondi.split("/");
								// Obtención del Array del Precio Porte
								var gv_valorprecioporte = gv_precioporte.split("/");
								// Obtención del Array de los precios Arancel
								//	var gv_valorpreciozara = gv_preciozara.split("/");
								// Obtención del Array de los precios Descuento1
								var gv_valorpreciodes = gv_preciodes.split("/");
								//Precio tarifa
								//	var gv_valorprecioTarifa =  gv_preciotarifa.split("/");
								//FIX 05.03.2019 ma   
								//	var gv_preciotarifa = parseFloat(gv_valorprecio1[cont].trim()) + parseFloat(gv_valorpreciozenv[cont].trim()) + parseFloat(
								//			gv_valorprecioporte[cont].trim());
								//Fix 03.05.2019 ma
								var gv_preciotarifa = parseFloat(gv_valorprecio1[cont].trim()) + parseFloat(gv_valorpreciozenv[cont].trim()) + parseFloat(
									gv_valorprecioporte[cont].trim()) + parseFloat(gv_valorpreciozcif[cont].trim());

								/*
								console.log("gv_preciotarifa : " +  gv_preciotarifa);
								console.log("gv_valorprecio : " +  gv_valorprecio1[cont]);
								console.log("gv_valorprecio, PARSE: " + parseFloat(gv_valorprecio1[cont].trim()));
								console.log("gv_valorpreciozenv : " +  gv_valorpreciozenv[cont]);
								console.log("gv_valorpreciozenv PARSE : " +  parseFloat(gv_valorpreciozenv[cont].trim()));
								console.log("gv_valorprecioporte : " + gv_valorprecioporte[cont]);
								console.log("gv_valorprecioporte PARSE: " +  parseFloat(gv_valorprecioporte[cont].trim()));
								console.log("gv_valorpreciozcif: " +  gv_valorpreciozcif[cont]);
								console.log("gv_valorpreciozcif: PARSE" +  parseFloat(gv_valorpreciozcif[cont].trim()));
								*/
								//ENDFIX
								// Precio Neto
								gv_fila.Zprecionet = gv_valorprecioventa[cont].trim();
								//	console.log("gv_fila.Zprecionet: " +  gv_valorprecioventa[cont]);
								//	console.log("gv_fila.Zprecionet: PARSE" +  gv_valorprecioventa[cont].trim());

								// Precio 1 Granel
								gv_fila.Zprecio1 = gv_valorprecio1[cont].trim(); //.replace(/[,]/gi, '.');
								// Precio Envasado
								gv_fila.Zprecio2 = gv_valorpreciozenv[cont].trim(); //.replace(/[.]/gi, ',');
								// Precio Incoterm FAS
								gv_fila.Zincofas = gv_valorpreciozfas[cont].trim();
								// Precio Incoterm CIF
								gv_fila.Zincocif = gv_valorpreciozcif[cont].trim();
								// Condición Cliente
								gv_fila.Zcondpago = gv_valorpreciocondi[cont].trim(); //.replace(/[.]/gi, ',');
								// Porte
								gv_fila.Zporte = gv_valorprecioporte[cont].trim(); //.replace(/[.]/gi, ',');
								// Precio Tarifa
								gv_fila.ZprecioTarifa = gv_preciotarifa;
								// Precio Descuento 1 (No se utiliza)
								gv_fila.Zdes1 = gv_valorpreciodes[cont];

								//Conversiones de negativos
								for (var n in gv_fila) {
									if (gv_fila[n]) {
										var number = gv_fila[n].toString();
										if (number && number.indexOf("-") != -1 && number.indexOf("-") != 0) {
											number.replace("-", "");
											if (parseFloat(number))
												gv_fila[n] = parseFloat(number) * -1;
										}
									}
								}

								//Conversiones a decimal con coma
								if (gv_fila.ZprecioTarifa) gv_fila.ZprecioTarifa = formater.PriceFormat(gv_fila.ZprecioTarifa).trim();
								if (gv_fila.Zmargen1) gv_fila.Zmargen1 = formater.PriceFormat(gv_fila.Zmargen1).trim();
								if (gv_fila.Zmargen2) gv_fila.Zmargen2 = formater.PriceFormat(gv_fila.Zmargen2).trim();
								//if (gv_fila.Zcanti) gv_fila.Zcanti = parseFloat(sap.ui.controller("view.View3").PriceFormat(gv_fila.Zcanti).trim());
								if (gv_fila.Zcanti) gv_fila.Zcanti = formater.QuantityFormat(gv_fila.Zcanti).trim();
								//	if(gv_fila.ZprecioTarifa)		//gv_fila.Zdes1 = sap.ui.controller("zui5_sd_test.utils.conversions").PriceFormat(gv_fila.Zdes1);
								if (gv_fila.Zdes2) gv_fila.Zdes2 = formater.PriceFormat(gv_fila.Zdes2).trim();
								//Datos traidos de sap
								if (gv_fila.Zprecionet) gv_fila.Zprecionet = formater.PriceFormat(gv_fila.Zprecionet).trim();

								console.log("gv_fila.Zprecionet: " + gv_valorprecioventa[cont]);
								console.log("gv_fila.Zprecionet: PARSE" + formater.PriceFormat(gv_fila.Zprecionet).trim());

								if (gv_fila.Zprecio1) gv_fila.Zprecio1 = formater.PriceFormat(gv_fila.Zprecio1).trim();
								if (gv_fila.Zprecio2) gv_fila.Zprecio2 = formater.PriceFormat(gv_fila.Zprecio2).trim();
								if (gv_fila.Zincofas) gv_fila.Zincofas = formater.PriceFormat(gv_fila.Zincofas).trim();
								if (gv_fila.Zincocif) gv_fila.Zincocif = formater.PriceFormat(gv_fila.Zincocif).trim();
								if (gv_fila.Zcondpago) gv_fila.Zcondpago = formater.PriceFormat(gv_fila.Zcondpago).trim();
								if (gv_fila.Zporte) gv_fila.Zporte = formater.PriceFormat(gv_fila.Zporte).trim();
								if (gv_fila.Zincocif) gv_fila.Zincocif = formater.PriceFormat(gv_fila.Zincocif).trim();

								console.log("responsebapi: ");
								console.log(responsebapi.data);
								console.log("gv_fila: ");
								console.log(gv_fila);

								//	gv_fila.Maktx = gv_tabledataview33[cont].Maktx;
								// Se añade la fila con el valor del precio neto en el objeto
								obj.push(gv_fila);
								//	console.log(gv_fila);

								//Change the item
								var oModel = that.getView().getModel("TableCreateModel");
								oModel.setProperty("/modelData/" + cont, gv_fila);
								oModel.refresh();
								gv_tablaview3.setModel(oModel);

							}
						}
						sap.m.MessageToast.show(responsebapi.data.Zreturn);
						console.log("ANTES DE ONSAVE verificando si entra o llama al guardar");
						that.onsave();

					},
					function () {
						// Mensaje de error cuando se produce un error al calcular el precio neto de la posición
						sap.m.MessageToast.show("Error al calcular el precio neto");
					});

			} else {
				sap.m.MessageToast.show("Corrija los errores para poder calcular los precios.");
			}
		},


		onsave: function () {
			console.log("estoy en el guardar verificando si entra o llama al guardar");
			var errorModel = this.getView().getModel("ErrorsModel");
			var that = this;
			//	var safeToSave = errorModel.getProperty("safeToSave");
			if (errorModel.getProperty("/invalidFields").length === 0) {
				///////////////////////////////////////////////////////////////////////////////////////////////////
				// LLAMADA BAPI R3-SAPUI5 INICIO
				///////////////////////////////////////////////////////////////////////////////////////////////////
				this.oBusiDial = (this.oBusyDial) ? this.oBusyDial : new sap.m.BusyDialog('IdSaveD', {
					title: 'Guardando pedido'
				});
				var parametersbapi2 = {
					Zalmacenpaga: [], // Precio almacenaje "CAMPO VALOR UNICO"
					Zcanti: [], // Cantidad "ARRAY VALORES
					Zclasedoc: [], // Clase de documento "CAMPO VALOR UNICO"
					Zcliente: [], // Cliente "CAMPO VALOR UNICO"
					Zcomercial: [], // Comercial "CAMPO VALOR UNICO"
					Zcondicobro: [], // Condición Cobro "CAMPO VALOR UNICO"
					Zcondipago: [], // Condición Pago "ARRAY VALORES"
					Zdes1: [], // Descuento 1 "ARRAY VALORES"
					Zdes2: [], // Descuento 2  "ARRAY VALORES" "No utilizado"
					Zfechaped: [], // Fecha Pedido "CAMPO VALOR UNICO"
					Zflag: [], // Indicador para indicar que se está calculando el Precio Neto "CAMPO VALOR UNICO"
					Zincocif: [], // Incoterm CIF "ARRAY VALORES"
					Zincofas: [], // Incoterm FAS "ARRAY VALORES"
					Zlgort: [], // Almacen "ARRAY VALORES"
					Zlote: [], // Lote "ARRAY VALORES"
					Zlugar: [], // Lugar "CAMPO VALOR UNICO"
					Zfechad: [], // Fecha Desde "ARRAY VALORES"
					Zfechah: [], // Fecha Hasta "ARRAY VALORES"
					Zmargen1: [], // Margen 1 "ARRAY VALORES"
					Zmargen2: [], // Margen 2 "ARRAY VALORES"
					Zmatnr: [], // Material "ARRAY VALORES"
					Znumpedi: [], // Numero de pedido "CAMPO VALOR UNICO"
					Zobserva: [], // Observaciones "CAMPO VALOR UNICO"
					Zobservagaran: [], // Observaciones Garantía "CAMPO VALOR UNICO"
					Zobservapedi: [], // Observaciones Pedido "CAMPO VALOR UNICO"
					Zporte: [], // Porte "ARRAY VALORES"
					Zprecio1: [], // Precio Granel "ARRAY VALORES"
					Zprecio2: [], // Precio Embasado "ARRAY VALORES"
					Zprecioalmace: [], // Precio Almacenaje "CAMPO VALOR UNICO"
					Zriesgodispo: [], // Riesgo Disponible "CAMPO VALOR UNICO"
					Zriesgodispu: [], // Riesgo Dispuesto "CAMPO VALOR UNICO"
					Zriesgomax: [], // Riesgo Máximo "CAMPO VALOR UNICO"
					Zviapago: [], // Vía de pago "CAMPO VALOR UNICO"
					Zwerks: [], // Centro "ARRAY VALORES"
					Zvkorg: [], // Org.Vtas. "ARRAY VALORES"
					Zprecionet: [], // Precio Neto "ARRAY VALORES"
					Zdestimerca: [], // Destinatario de mercancias "CAMPO VALOR UNICO"
					Zmoneda: [], // Moneda "CAMPO VALOR UNICO"
					Zinco1: [], // Inco1 "ARRAY VALORES"
					Zinco2: [], // Inco2 "ARRAY VALORES"
					Zlgobe: [], // Lgobe "ARRAY VALORES"
					Zfechacondi: [], // Fecha de condición de cobro,
					Zfechaentrega: [] //FIX MA 20210204
				};

				var chLote = this.oModelAppData.getProperty("/rBarcos")

				// var gv_tablaview3 = sap.ui.getCore().byId("idTable2");

				var gv_modeltablaview3 = this.tablePedido.getModel();
				var gv_tabledataview3 = this.getView().getModel("TableCreateModel").getData(); //gv_modeltablaview3.getData();
				var itemsSeleccionados = false;
				var precioVentaValido = false;
				for (var i = 0; i < gv_tabledataview3.modelData.length; i++) {
					if (gv_tabledataview3.modelData[i].Matnr !== "") {
						itemsSeleccionados = true;
						if (chLote) {
							parametersbapi2.Zflag.push("LT"); //Indicacion sin lote que se ha marcado en la pantalla inicial
						}

						var gvindex = gv_tabledataview3.modelData[i]; // Valor de cada fila con los valores seleccionados

						parametersbapi2.Zmatnr.push(gvindex.Matnr); // Material
						parametersbapi2.Zlote.push(gvindex.Charg); // Lote

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable
						// Cantidad
						// Inicio
						////////////////////////////////////////////////////////////////
						if (gvindex.Zcanti !== "" && gvindex.Zcanti !== undefined) {
							var gv_Zcanti = gvindex.Zcanti.toString().replace(/[.]/gi, '');
							gv_Zcanti = gv_Zcanti.replace(/[,]/gi, '.');
							parametersbapi2.Zcanti.push(gv_Zcanti);
						} else {
							parametersbapi2.Zcanti.push(gvindex.Zcanti);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable
						// Cantidad
						// Fin
						////////////////////////////////////////////////////////////////

						parametersbapi2.Zlgort.push(gvindex.Lgort); // Almacén (Nombre del Álmacén)

						//Modificación DGA 11/05/2018 - El campo  precio base debe ser modificable
						//parametersbapi2.Zprecio1.push(gvindex.Zprecio1); // Precio 1
						if (gvindex.Zprecio1 !== "" && gvindex.Zprecio1 !== undefined) {
							var gv_Zprecio1 = gvindex.Zprecio1.toString().replace(/[.]/gi, '');
							gv_Zprecio1 = gv_Zprecio1.replace(/[,]/gi, '.');
							parametersbapi2.Zprecio1.push(gv_Zprecio1);
						} else {
							parametersbapi2.Zprecio1.push(gvindex.Zprecio1);
						}
						//Fin DGA 11/05/2018 - El campo  precio base debe ser modificable

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo no editable y calculado
						// Precio Envasado
						// Inicio
						////////////////////////////////////////////////////////////////
						if (gvindex.Zprecio2 !== "" && gvindex.Zprecio2 !== undefined) {
							var gv_Zprecio2 = gvindex.Zprecio2.toString().replace(/[.]/gi, '');
							gv_Zprecio2 = gv_Zprecio2.replace(/[,]/gi, '.');
							parametersbapi2.Zprecio2.push(gv_Zprecio2);
						} else {
							parametersbapi2.Zprecio2.push(gvindex.Zprecio2);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo no editable y calculado
						// Precio Envasado
						// Fin
						////////////////////////////////////////////////////////////////

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Margén 1
						// Inicio
						///////////////////////////////////////////////////////////////
						if (gvindex.Zmargen1 !== "" && gvindex.Zmargen1 !== undefined) {
							var gv_Zmargen1 = gvindex.Zmargen1.toString().replace(/[.]/gi, '');
							gv_Zmargen1 = gv_Zmargen1.replace(/[,]/gi, '.');
							parametersbapi2.Zmargen1.push(gv_Zmargen1);
						} else {
							parametersbapi2.Zmargen1.push(gvindex.Zmargen1);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Margén 1
						// Fin
						///////////////////////////////////////////////////////////////

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Margén 2
						// Inicio
						///////////////////////////////////////////////////////////////
						if (gvindex.Zmargen2 !== "" && gvindex.Zmargen2 !== undefined) {
							var gv_Zmargen2 = gvindex.Zmargen2.toString().replace(/[.]/gi, '');
							gv_Zmargen2 = gv_Zmargen2.replace(/[,]/gi, '.');
							parametersbapi2.Zmargen2.push(gv_Zmargen2);
						} else {
							parametersbapi2.Zmargen2.push(gvindex.Zmargen2);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Margén 2
						// Fin
						///////////////////////////////////////////////////////////////

						if (gvindex.Zdes1 !== "" && gvindex.Zdes1 !== undefined) {
							var gv_Zdes1 = gvindex.Zdes1.toString().replace(/[.]/gi, '');
							gv_Zdes1 = gv_Zdes1.replace(/[,]/gi, '.');
							parametersbapi2.Zdes1.push(gv_Zdes1); // Descuento 1 (No se utiliza)
						} else {
							parametersbapi2.Zdes1.push(gvindex.Zdes1); // Descuento 1 (No se utiliza)
						}

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Descuento 2 (Arancel)
						// Inicio
						///////////////////////////////////////////////////////////////
						if (gvindex.Zdes2 !== "" && gvindex.Zdes2 !== undefined) {
							var gv_Zdes2 = gvindex.Zdes2.toString().replace(/[.]/gi, '');
							gv_Zdes2 = gv_Zdes2.replace(/[,]/gi, '.');
							parametersbapi2.Zdes2.push(gv_Zdes2);
						} else {
							parametersbapi2.Zdes2.push(gvindex.Zdes2);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Descuento 2 (Arancel)
						// Fin
						///////////////////////////////////////////////////////////////

						if (gvindex.Zincofas !== "" && gvindex.Zincofas !== undefined) {
							var gv_Zincofas = gvindex.Zincofas.replace(/[.]/gi, '');
							gv_Zincofas = gv_Zincofas.replace(/[,]/gi, '.');

							parametersbapi2.Zincofas.push(gv_Zincofas); // Incoterm FAS
						} else {
							parametersbapi2.Zincofas.push(gvindex.Zincofas); // Incoterm FAS
						}

						if (gvindex.Zincocif !== "" && gvindex.Zincocif !== undefined) {
							var gv_Zincocif = gvindex.Zincocif.replace(/[.]/gi, '');
							gv_Zincocif = gv_Zincocif.replace(/[,]/gi, '.');
							parametersbapi2.Zincocif.push(gv_Zincocif); // Incoterm CIF
						} else {
							parametersbapi2.Zincocif.push(gvindex.Zincocif); // Incoterm CIF
						}

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Porte
						// Inicio
						///////////////////////////////////////////////////////////////
						if (gvindex.Zporte !== "" && gvindex.Zporte !== undefined) {
							var gv_Zporte = gvindex.Zporte.toString().replace(/[.]/gi, '');
							gv_Zporte = gv_Zporte.replace(/[,]/gi, '.');
							parametersbapi2.Zporte.push(gv_Zporte);
						} else {
							parametersbapi2.Zporte.push(gvindex.Zporte);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable sin calcular
						// Porte
						// Fin
						///////////////////////////////////////////////////////////////

						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable calculado
						// Condición Cliente
						// Inicio
						///////////////////////////////////////////////////////////////
						if (gvindex.Zcondpago !== "" && gvindex.Zcondpago !== undefined) {
							var gv_Zcondpago = gvindex.Zcondpago.replace(/[.]/gi, '');
							gv_Zcondpago = gv_Zcondpago.replace(/[,]/gi, '.');
							parametersbapi2.Zcondipago.push(gv_Zcondpago);
						} else {
							parametersbapi2.Zcondipago.push(gvindex.Zcondpago);
						}
						////////////////////////////////////////////////////////////////
						// Conversión de campo "." / "," campo editable calculado
						// Condición Cliente
						// Fin
						///////////////////////////////////////////////////////////////

						parametersbapi2.Zwerks.push(gvindex.Werks); //Centro
						parametersbapi2.Zvkorg.push(that.oModelAppData.getProperty("/vkorg")); //Org. Vtas seleccionada en la primera pantalla
						var auxPrecio;
						if (gvindex.Zprecionet != "" && gvindex.Zprecionet !== undefined) {
							auxPrecio = gvindex.Zprecionet.toString().replace(/[.]/gi, '');
							auxPrecio = auxPrecio.replace(/[,]/gi, '.');
						} else {
							auxPrecio = 0;

						}
						parametersbapi2.Zprecionet.push(auxPrecio); //Precio Neto

						if (parseFloat(auxPrecio) > 0) {
							precioVentaValido = true;
						}

						if (gvindex.Zinco1 !== "" && gvindex.Zinco1 !== undefined) {
							var gv_Zinco1 = gvindex.Zinco1.replace(/[.]/gi, '');
							gv_Zinco1 = gv_Zinco1.replace(/[,]/gi, '.');
							parametersbapi2.Zinco1.push(gv_Zinco1); //Zinco1
						} else {
							parametersbapi2.Zinco1.push(gvindex.Zinco);
						}

						if (gvindex.Zinco2 !== "" && gvindex.Zinco2 !== undefined) {
							var gv_Zinco2 = gvindex.Zinco2.replace(/[.]/gi, '');
							gv_Zinco2 = gv_Zinco2.replace(/[,]/gi, '.');
							parametersbapi2.Zinco2.push(gv_Zinco2); //Zinco2

						} else {
							parametersbapi2.Zinco2.push(gvindex.Zinco2);
						}
						parametersbapi2.Zfechad.push(that.parseDate(gvindex.Zfechad));
						parametersbapi2.Zfechah.push(that.parseDate(gvindex.Zfechah));

						//FIX MA 20210203
						// Fecha Entrega
						//SEND INFO TO BAPI

						parametersbapi2.Zfechaentrega.push(that.parseDate(new Date()));

						//ENDFIX MA 20210203

					}
				}
				if (!itemsSeleccionados) {
					sap.m.MessageToast.show("No hay materiales seleccionados");
					return; //FIX MA 20201118
				} else if (!precioVentaValido) {
					sap.m.MessageToast.show("Debe haber al menos 1 material seleccionado con precio de venta mayor que '0.00'");
					return; //FIX MA 20201118
				} else { //Todo correcto
					that.oBusyDial.open();

					if (!parametersbapi2.Zvkorg || parametersbapi2.Zvkorg === "" || parametersbapi2.Zvkorg.length === 0) {
						parametersbapi2.Zvkorg = that.oModelAppData.getProperty("/vkorg").getValue(); //Org. Vtas seleccionada en la primera pantalla
					}
					parametersbapi2.Zcliente = this.inputNumCliente.getValue(); // Cliente 
					parametersbapi2.Zfechaped = this.parseDate(this.dateFechaPedido.getDateValue()); // Fecha Pedido
					parametersbapi2.Zcondicobro = this.inputCondCobro.getValue(); // Condición Cobro
					parametersbapi2.Zfechacondi = this.parseDate(this.dateFechaVencim.getDateValue()); // Fecha Condición Cobro
					parametersbapi2.Znumpedi = this.inputNumPedido.getValue(); // Nº Pedido
					parametersbapi2.Zclasedoc = this.inputClaseDoc.getValue(); // Clase de Documento
					parametersbapi2.Zdestimerca = this.inputDestinaMerca.getValue(); // Destinatario de Mercancías
					parametersbapi2.Zviapago = this.inputViaPago.getValue(); // Vía de pago
					parametersbapi2.Zcomercial = this.inputComercial.getValue(); // Comercial
					parametersbapi2.Zmoneda = this.inputMoneda.getValue(); // Moneda
					parametersbapi2.Zprecioalmace = this.inputPrecioAlm.getValue(); // Precio de Almacenaje
					parametersbapi2.Zalmacenpaga = this.parseDate(this.datePagadoHasta.getDateValue()); // Fecha Almacen Pagado a

					var gv_riesgomax = this.inputRiesgoMax.getValue().split(" ")[0]; // Riesgo Máximo 
					var gv_riesgomax_val = that.addCommas2(gv_riesgomax);
					parametersbapi2.Zriesgomax = gv_riesgomax_val;

					var gv_riesgodispu = this.inputRiesgoDispues.getValue().split(" ")[0]; // Riesgo Dispuesto
					var gv_riesgodispu_val = that.addCommas2(gv_riesgodispu);
					parametersbapi2.Zriesgodispu = gv_riesgodispu_val;

					var gv_riesgodispo = this.inputRiesgoDispon.getValue().split(" ")[0]; // Riesgo Disponibble
					var gv_riesgodispo_val = that.addCommas2(gv_riesgodispo);
					parametersbapi2.Zriesgodispo = gv_riesgodispo_val;

					parametersbapi2.Zobserva = this.textObservRiesgo.getValue(); // Observaciones
					parametersbapi2.Zobservapedi = this.textObservPedido.getValue(); // Observaciones Pedido
					parametersbapi2.Zobservagaran = this.textObservGarant.getValue(); // Observaciones Garantía

					// var urlbapi = "http://srvsapdesapp.fertinor.es:8030/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";
					// var urlbapi = "http://195.76.192.97:8030/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";
					// var urlbapi = "https://SRVSAPDESAPP.FERTINOR.ES:8031/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";

					var oUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
					var urlbapi = oUrl + "/sap/opu/odata/sap/ZOBTENDATOSBAPI_SRV/";


					console.log("ZFLAG SAVE");
					console.log(parametersbapi2.Zflag);

					console.log("PARAMETROS SAVE");
					console.log(parametersbapi2);

					// Llamada a la BAPI
					var oModelbapi = new sap.ui.model.odata.ODataModel(urlbapi, false);
					oModelbapi.callFunction("zzfuncion",
						"GET",
						parametersbapi2,
						null,
						function (oDatabapi, responsebapi) {

							that.oBusyDial.close();
							var typeMsg = (responsebapi.data.Zpedido) ? "Success" : "Error";
							var resDialog = new sap.m.Dialog({
								title: "Creación de pedido de ventas",
								type: "Message",
								state: typeMsg,
								content: new sap.m.Text({
									text: responsebapi.data.Zreturn
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function () {
										if (responsebapi.data.Zpedido) {
											that.goToView1();
										}
										resDialog.close();
									}
								}),
								endButton: new sap.m.Button({
									text: "Volver al pedido",
									press: function () {
										resDialog.close();
									}
								})
							});

							resDialog.open();

						},
						function () {
							that.oBusyDial.close()
							sap.m.MessageToast.show("Error al crear el Pedido");
						});

					///////////////////////////////////////////////////////////////////////////////////////////////////
					// LLAMADA BAPI R3-SAPUI5 FIN
					///////////////////////////////////////////////////////////////////////////////////////////////////
				}
			} else {
				sap.m.MessageToast.show("Corrija los errores en la tabla. Quedan " + errorModel.getProperty("/invalidFields").length + " errores.");
			}
		},

		/**
		 * Sets the number of incorrect input fields.
		 * If parameters invalidFields length
		 * is greater than 0
		 * we don't let the user save.
		 * 
		 */
		setErrorModel: function (isError, fieldId) {
			var errorsModel = sap.ui.getCore().getModel("ErrorsModel");
			var invalidFields = [];
			var safeToSave = false;

			if (errorsModel) {
				//get data from the model
				invalidFields = errorsModel.getProperty("/invalidFields");

				if (invalidFields.includes(fieldId)) {
					if (!isError) {
						//Get the index of the item
						var index = invalidFields.indexOf(fieldId);
						//Delete the item
						invalidFields.splice(index, 1);
					}
				} else {
					if (isError) invalidFields.push(fieldId);
				}
			} else {
				//No model is set yet
				errorsModel = new sap.ui.model.json.JSONModel("ErrorsModel");
				if (isError) {
					invalidFields.push(fieldId);
				}
			}
			//Check if there are invalid fields
			if (invalidFields.length === 0) safeToSave = true;
			//Set data into the model
			errorsModel.setProperty("/invalidFields/", invalidFields);
			errorsModel.setProperty("/safeToSave", safeToSave);
			//Set the model
			this.getView().setModel(errorsModel, "ErrorsModel");
		},

		/**
		 * Initialize the create errors model.
		 * This model handles the correcteness of
		 * the inputs of the table
		 */
		initializeErrorModel: function () {
			var errorsModel = new sap.ui.model.json.JSONModel("ErrorsModel");
			errorsModel.setProperty("/invalidFields/", []);
			errorsModel.setProperty("/safeToSave", true);
			this.getView().setModel(errorsModel, "ErrorsModel");
		},

		_initParametrosBapi: function () {
			var oParametrosBapi = {
				Zalmacenpaga: [], // Precio almacenaje "CAMPO VALOR UNICO"
				Zcanti: [], // Cantidad "ARRAY VALORES"
				Zclasedoc: [], // Clase de documento "CAMPO VALOR UNICO"
				Zcliente: [], // Cliente "CAMPO VALOR UNICO"
				Zcomercial: [], // Comercial "CAMPO VALOR UNICO"
				Zcondicobro: [], // Condición Cobro "CAMPO VALOR UNICO"
				Zcondipago: [], // Condición Pago "ARRAY VALORES"
				Zdes1: [], // Descuento 1 "ARRAY VALORES"
				Zdes2: [], // Descuento 2  "ARRAY VALORES" "No utilizado"
				Zfechaped: [], // Fecha Pedido "CAMPO VALOR UNICO"
				Zflag: 'CP', // Indicador para indicar que se está calculando el Precio Neto "CAMPO VALOR UNICO"
				Zincocif: [], // Incoterm CIF "ARRAY VALORES"
				Zincofas: [], // Incoterm FAS "ARRAY VALORES"
				Zlgort: [], // Almacen "ARRAY VALORES"
				Zlote: [], // Lote "ARRAY VALORES"
				Zlugar: [], // Lugar "CAMPO VALOR UNICO"
				Zmargen1: [], // Margen 1 "ARRAY VALORES"
				Zmargen2: [], // Margen 2 "ARRAY VALORES"
				Zmatnr: [], // Material "ARRAY VALORES"
				Znumpedi: [], // Numero de pedido "CAMPO VALOR UNICO"
				Zobserva: [], // Observaciones "CAMPO VALOR UNICO"
				Zobservagaran: [], // Observaciones Garantía "CAMPO VALOR UNICO"
				Zobservapedi: [], // Observaciones Pedido "CAMPO VALOR UNICO"
				Zporte: [], // Porte "ARRAY VALORES"
				Zprecio1: [], // Precio Granel "ARRAY VALORES"
				Zprecio2: [], // Precio Embasado "ARRAY VALORES"
				Zprecioalmace: [], // Precio Almacenaje "CAMPO VALOR UNICO"
				Zriesgodispo: [], // Riesgo Disponible "CAMPO VALOR UNICO"
				Zriesgodispu: [], // Riesgo Dispuesto "CAMPO VALOR UNICO"
				Zriesgomax: [], // Riesgo Máximo "CAMPO VALOR UNICO"
				Zviapago: [], // Vía de pago "CAMPO VALOR UNICO"
				Zwerks: [], // Centro "CAMPO VALOR UNICO"
				Zvkorg: [], //Org. Vtas. "CAMPO VALOR UNICO"
				Zdestimerca: [], // Destinatario de mercancias "CAMPO VALOR UNICO"
				Zmoneda: [], // Moneda "CAMPO VALOR UNICO"
				Zinco1: [], // Inco1 "ARRAY VALORES"
				Zinco2: [], // Inco2 "ARRAY VALORES"
				Zlgobe: [], // Lgobe "ARRAY VALORES"
				Zfechad: [],//Fecha Desde "ARRAY VALORES"
				Zfechah: [],//Fecha Hasta "ARRAY VALORES"
				Zfechacondi: [], // Fecha de condición de cobro
				Zprecionet: [], // Precio vta
				Zfechaentrega: [] //FIX MA 20210204
			};
			return oParametrosBapi;
		},

		_initMateriales: function () {
			var HelpURLmatnr = this.sUrl + "/sap/opu/odata/SAP/ZOBTENCIONODATA_SRV/ZST_LO_09Set";
			var oOdata = new sap.ui.model.odata.ODataModel(HelpURLmatnr);
			var that = this;

			var sLgort = this.oModelAppData.getProperty("/lgort") || "",
				sWerks = this.oModelAppData.getProperty("/werks") || this.oModelAppData.getProperty("/vkorg"),
				sVkorg = this.oModelAppData.getProperty("/vkorg") || "";

			var fMatnr = new Filter({
				path: 'Matnr',
				operator: FilterOperator.EQ,
				value1: ""
			});
			var fLgort = new Filter({
				path: 'Lgort',
				operator: FilterOperator.EQ,
				value1: sLgort
			});
			var fWerks = new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: sWerks
			});
			var fVkorg = new Filter({
				path: 'Vkorg',
				operator: FilterOperator.EQ,
				value1: sVkorg
			});
			var fFlag = new Filter({
				path: 'Zflag',
				operator: FilterOperator.EQ,
				value1: "S"
			});

			var aFilter = [fMatnr, fWerks, fVkorg, fLgort, fFlag];


			this.oModelMateriales.read("/ZST_LO_09Set", {
				filters: aFilter,
				success: function (oResponse) {
					that.getView().setModel(new sap.ui.model.json.JSONModel(oResponse.results), "Materiales");
					that.oAppData.bMaterialesCargados = true;
				},
				error: function (oError) {
					that.oError = oError;
					that.oAppData.bMaterialesCargados = false;
					that.oAppData.sMaterialesCargados = "No se han podido cargar materiales";
				}
			});


		}

	});
});