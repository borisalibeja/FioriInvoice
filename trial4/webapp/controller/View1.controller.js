/**
 * @namespace trial4.controller
 * @class
 * Main controller for the Trial 4 application.
 * Handles data fetching, CRUD operations, navigation, and event subscriptions.
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "trial4/utils/CSRFTokenManager",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, CSRFTokenManager, JSONModel, MessageBox, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("trial4.controller.View1", {

        /**
         * Initializes the controller.
         * Loads initial data and subscribes to event updates.
         * @public
         */
        onInit: function () {
            this._callToDB(); // Load initial data
            sap.ui.getCore().getEventBus().subscribe("dataChannel", "dataUpdated", this._onDataUpdated, this);

        },

        /**
         * Event handler for the "dataUpdated" event.
         * Reloads data from the database.
         * @private
         */
        _onDataUpdated: function () {
            this._callToDB();
        },

        /**
         * Navigates to the chart view.
         * @public
         */
        onPress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteChart");
        },

        /**
         * Deletes selected records from the table after confirmation.
         * @public
         */
        onDeleteRecord: function () {
            const oTable = this.byId("_IDGenTable1");
            const aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageBox.warning("Please select at least one record to delete.");
                return;
            }

            const aSelectedRows = aSelectedIndices.map((iIndex) => {
                const oContext = oTable.getContextByIndex(iIndex);
                return {
                    Invno: oContext.getProperty("Invno"),
                    CustomerName: oContext.getProperty("Csname")
                };
            });

            const oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                const oResourceBundle = oResourceModel.getResourceBundle();
                const sDeleteMessage = oResourceBundle.getText("DeleteAskingMessage");
                const sMessage = `${sDeleteMessage}\n\n` +
                    aSelectedRows.map(record => `- ${record.CustomerName} (${oResourceBundle.getText("Invno")}: ${record.Invno})`).join("\n");
            
                MessageBox.confirm(sMessage, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.YES) {
                            const aInvnoValues = aSelectedRows.map(row => row.Invno);
                            this._deleteRecords(aInvnoValues, () => {
                                sap.ui.getCore().getEventBus().publish("dataChannel", "dataUpdated");
                            });
                        }
                    }
                });
            }
        },

        /**
         * Deletes multiple records by sending DELETE requests to the OData service.
         * @private
         * @param {Array} aInvnoValues - List of customer numbers to delete.
         * @param {Function} callBack - Callback function to execute after deletion.
         */
        _deleteRecords: function (aInvnoValues, callBack) {
            const csrfToken = CSRFTokenManager.getToken();

            if (!csrfToken) {
                MessageBox.error("CSRF token is not available. Please fetch it first.");
                return;
            }

            const appModulePath = this._getAppModulePath();
            const oResourceModel = sap.ui.getCore().getModel("i18n");
            const oResourceBundle = oResourceModel.getResourceBundle();
            const aPromises = aInvnoValues.map((sInvno) =>
                new Promise((resolve, reject) => {
                    $.ajax({
                        url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet(Invno='${sInvno}')`,
                        type: "DELETE",
                        headers: { "X-CSRF-Token": csrfToken },
                        success: () => {
                            MessageToast.show(oResourceBundle.getText("DeleteSuccessMessage", [sInvno]));
                            resolve();
                        },
                        error: (err) => {
                            MessageBox.error(oResourceBundle.getText("DeleteErrorMessage", [sInvno]));
                            reject(err);
                        }
                    });
                })
            );

            Promise.all(aPromises)
                .then(() => callBack && callBack())
                .catch((err) => console.error("Error in deletion:", err));
        },

        /**
         * Fetches data from the database and sets it in the model.
         * @private
         */
        _callToDB: function () {
            const appModulePath = this._getAppModulePath();
            const oModel = new JSONModel();

            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet`,
                type: "GET",
                dataType: "json",
                headers: { "X-CSRF-Token": "Fetch" },
                success: (data, textStatus, jqXHR) => {
                    const token = jqXHR.getResponseHeader("X-CSRF-Token");
                    CSRFTokenManager.setToken(token);
                    oModel.setData(data.d);
                    this.getView().setModel(oModel, "listModel");
                },
                error: (err) => {
                    MessageBox.error("Error loading data: " + err.statusText);
                }
            });
        },

        /**
         * Filters the table based on the search query.
         * @public
         * @param {sap.ui.base.Event} oEvent - Event containing the search query.
         */
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue");
            const oBinding = this.byId("_IDGenTable1").getBinding("rows");

            const aFilters = sQuery ? [
                "Invno", "Csname", "Name2", "Stcd1", "Stcd2",
                "Smtp_addr", "Street", "City1", "Tel_number", "Stkzn"
            ].map(field => new Filter(field, FilterOperator.Contains, sQuery)) : [];

            oBinding.filter(aFilters.length ? new Filter(aFilters, false) : []);
        },

        /**
         * Changes the application language.
         * @public
         * @param {sap.ui.base.Event} oEvent - Event containing the selected language.
         */
        onLanguageSelect: function (oEvent) {
            // Get the selected language code from the button's custom data
            let sLanguageCode = oEvent.getSource().getCustomData()[0].getValue();

            // Create a new i18n ResourceModel with the selected language
            let oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleName: "trial4.i18n.i18n",
                bundleLocale: sLanguageCode
            });

            // Set the i18n model globally for all views
            sap.ui.getCore().setModel(oResourceModel, "i18n");

            // Optional: Save the selected language to localStorage for persistence
            localStorage.setItem("selectedLanguage", sLanguageCode);

            // Update the language for the current view (binding updates automatically)
            this.getView().setModel(oResourceModel, "i18n");


        },

        /**
         * Navigates to the details page for the selected customer.
         * @public
         * @param {sap.ui.base.Event} oEvent - Event containing the selected context.
         */
        handleDetailsPress: function (oEvent) {
            const InvnoSelected = oEvent.getSource().getBindingContext("listModel").getProperty("Invno");
            this.getOwnerComponent().getRouter().navTo("RouteDetails", { Invno: InvnoSelected });
        },

        /**
         * Navigates to the "Add Record" page.
         * @public
         */
        onAddRecord: function () {
            this.getOwnerComponent().getRouter().navTo("RouteAddRecord");
            sap.ui.getCore().getEventBus().publish("dataChannel", "dataUpdated");
        },

        /**
         * Navigates to the "Edit Record" page for the selected record.
         * @public
         */
        onEditRecord: function () {
            const oTable = this.byId("_IDGenTable1");
            const aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageBox.warning("Please select a record to edit.");
                return;
            }

            if (aSelectedIndices.length > 1) {
                MessageBox.warning("Please select only one record to edit.");
                return;
            }

            const sInvno = oTable.getContextByIndex(aSelectedIndices[0]).getProperty("Invno");

            if (!sInvno) {
                MessageBox.error("Failed to retrieve Invno from the selected row.");
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteEditRecord", { Invno: sInvno });
            sap.ui.getCore().getEventBus().publish("dataChannel", "dataUpdated");
        },

        /**
         * Retrieves the application module path from the manifest.
         * @private
         * @returns {string} Application module path.
         */
        _getAppModulePath: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            return jQuery.sap.getModulePath(appId.replaceAll(".", "/"));
        }
    });
});
