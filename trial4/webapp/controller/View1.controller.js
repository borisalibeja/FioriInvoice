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
                "Invno", "Csname", "Prod1", "Prod2", "Prod3",
                "Prod4", "Prod5"
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
        },
        openDateFilterDialog: function () {
            const oView = this.getView();
            if (!this.dateFilterDialog) {
                this.dateFilterDialog = oView.byId("dateFilterDialog");
            }
            this.dateFilterDialog.open();
        },
        onFilterDate: function () {
            const oView = this.getView();
            const oTable = oView.byId("_IDGenTable1");
            const startDate = oView.byId("startDateFilter").getDateValue();
            const endDate = oView.byId("endDateFilter").getDateValue();
        
            if (!startDate || !endDate) {
                sap.m.MessageToast.show("Please select both start and end dates.");
                return;
            }
        
            // Convert dates to the same format used in your data
            const formattedStartDate = startDate.toISOString().split("T")[0];
            const formattedEndDate = endDate.toISOString().split("T")[0];
        
            // Access the model data
            const oModel = this.getView().getModel("listModel");
            const oData = oModel.getProperty("/results");
        
            // Filter the data based on the date range
            const filteredData = oData.filter(item => {
                const invDate = new Date(item.Invdate).toISOString().split("T")[0];
                return invDate >= formattedStartDate && invDate <= formattedEndDate;
            });
        
            if (filteredData.length === 0) {
                sap.m.MessageToast.show("No data found for the selected date range.");
                return;
            }
        
            // Update the model with filtered data
            const filteredModel = new JSONModel({ results: filteredData });
            oTable.setModel(filteredModel, "listModel");

        
            // Close the dialog
            this.dateFilterDialog.close();
        },
        closeDateFilterDialog: function () {
            const oView = this.getView();

            // Clear the date filters
            oView.byId("startDateFilter").setValue(null);
            oView.byId("endDateFilter").setValue(null);
        
            // Reset the table model to the original model
            const oTable = oView.byId("_IDGenTable1");
            const originalModel = this.getView().getModel("listModel"); // Fetch the original model
            oTable.setModel(originalModel, "listModel");
        
            // Clear any filters applied to the table's binding
            const oBinding = oTable.getBinding("rows");
            oBinding.filter([]); // Clear all filters
        
            // Re-fetch data and refresh the model
            this._callToDB();
        
            // Close the dialog
            this.dateFilterDialog.close();
        },

        openCurrencyDropdown: function (oEvent) {
            const oButton = oEvent.getSource();
            const oModel = this.getView().getModel("listModel");
            const oData = oModel.getProperty("/results");
        
            if (!this._oCurrencyPopover) {
                // Create the Popover dynamically
                this._oCurrencyPopover = new sap.m.Popover({
                    title: "Select Currency",
                    contentWidth: "200px",
                    content: [
                        new sap.m.List({
                            items: {
                                path: "/uniqueCurrencies",
                                template: new sap.m.StandardListItem({
                                    title: "{key}",
                                    type: "Active",
                                    press: this.onCurrencySelected.bind(this) // Handle filter selection
                                })
                            }
                        }),
                        new sap.m.Button({
                            text: "Clear",
                            type: "Transparent",
                            press: this.onClearCurrencyFilter.bind(this) // Add clear functionality
                        })
                    ]
                });
                this.getView().addDependent(this._oCurrencyPopover);
            }
        
            // Update the Popover with unique currencies
            const uniqueCurrencies = [...new Set(oData.map(item => item.Curr))].map(currency => ({ key: currency }));
            const popoverModel = new JSONModel({ uniqueCurrencies });
            this._oCurrencyPopover.setModel(popoverModel);
        
            // Open Popover
            this._oCurrencyPopover.openBy(oButton);
        },
        onCurrencySelected: function (oEvent) {
            const selectedCurrency = oEvent.getSource().getTitle(); // Get selected currency
            const oTable = this.getView().byId("_IDGenTable1");
            const oBinding = oTable.getBinding("rows");
        
            if (selectedCurrency) {
                const oFilter = new sap.ui.model.Filter("Curr", sap.ui.model.FilterOperator.EQ, selectedCurrency);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]); // Clear filter if no selection
            }
        
            // Close Popover
            if (this._oCurrencyPopover) {
                this._oCurrencyPopover.close();
            }
        },
        onClearCurrencyFilter: function () {
            const oTable = this.getView().byId("_IDGenTable1");
            const oBinding = oTable.getBinding("rows");
        
            // Clear any applied filters
            oBinding.filter([]);
        
            // Close the Popover
            if (this._oCurrencyPopover) {
                this._oCurrencyPopover.close();
            }
        }
               

    });
});
