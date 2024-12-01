/**
 * @namespace trial4.controller
 * @class
 * Controller for editing an existing record.
 * Handles fetching record data, validating form inputs, and updating the record via an OData service.
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "trial4/utils/CSRFTokenManager",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "trial4/model/formatter"
], function (Controller, CSRFTokenManager, JSONModel, MessageBox, MessageToast, formatter) {
    "use strict";

    return Controller.extend("trial4.controller.EditRecord", {

        formatter: formatter,
        /**
         * Initializes the controller and attaches the route pattern matched event.
         * @public
         */
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("RouteEditRecord")
                .attachPatternMatched(this._onObjectMatched, this);
            

        },

        /**
         * Handles the route pattern-matched event when navigating to the edit record view.
         * Fetches record data for the specified `Invno`.
         * @private
         * @param {sap.ui.base.Event} oEvent - Event triggered when the route pattern matches.
         */
        _onObjectMatched: function (oEvent) {
            this.sInvno = oEvent.getParameter("arguments").Invno;

            // Refresh the i18n model for this view
            const oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }

            this._fetchRecordData(this.sInvno);

        },

        /**
         * Fetches record data for a specific `Invno` and sets it to the view's model.
         * @private
         * @param {string} sInvno - Customer ID for the record to fetch.
         */
        _fetchRecordData: function (sInvno) {
            const appModulePath = this._getAppModulePath();

            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet(Invno='${sInvno}')`,
                type: "GET",
                dataType: "json",
                success: (data) => {
                    if (data && data.d) {
                        const oModel = new JSONModel(data.d);
                        this.getView().setModel(oModel, "recordModel");
                    } else {
                        MessageBox.error("No data found for the specified Invno.");
                    }
                },
                error: (err) => {
                    MessageBox.error("Error fetching data: " + err.statusText);
                }
            });
        },

        /**
         * Saves changes to the record by sending a PUT request to the OData service.
         * Validates required fields before submitting.
         * @public
         */
        onSaveChanges: function () {
            const csrfToken = CSRFTokenManager.getToken();

            if (!csrfToken) {
                MessageBox.error("CSRF token is not available. Please fetch it first.");
                return;
            }

            const aRequiredFields = this._getRequiredFields();
            if (!this._validateFields(aRequiredFields)) {
                MessageBox.error("Please fill all required fields.");
                return;
            }

            const oUpdatedData = this.getView().getModel("recordModel").getData();
            const appModulePath = this._getAppModulePath();

            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet(Invno='${this.sInvno}')`,
                type: "PUT",
                contentType: "application/json",
                headers: { "X-CSRF-Token": csrfToken },
                data: JSON.stringify(oUpdatedData),
                success: () => {
                    MessageToast.show("Record updated successfully!");
                    sap.ui.getCore().getEventBus().publish("dataChannel", "dataUpdated");
                    this.getOwnerComponent().getRouter().navTo("RouteView1");
                },
                error: (err) => {
                    MessageBox.error("Failed to update record: " + err.statusText);
                }
            });
        },

        /**
         * Navigates back to the main view without saving.
         * @public
         */
        onCancel: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        /**
         * Retrieves the application module path from the manifest.
         * @private
         * @returns {string} Application module path.
         */
        _getAppModulePath: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            return jQuery.sap.getModulePath(appPath);
        },

        /**
         * Retrieves an array of required input fields.
         * @private
         * @returns {sap.ui.core.Control[]} List of required input fields.
         */
        _getRequiredFields: function () {
            const oView = this.getView();
            return [
                oView.byId("_IDGenDatePicker1"),  // Date 
                oView.byId("_IDGenInput26"), // Customer Name
                oView.byId("_IDGenInput12"), // 1st Product
                oView.byId("_IDGenInput17"), // Net Value
                oView.byId("_IDGenInput18"), // Vat value
                oView.byId("_IDGenInput20")  // Currency
            ];
        },

        /**
         * Validates an array of input fields to ensure all are filled.
         * Highlights invalid fields in red.
         * @private
         * @param {sap.ui.core.Control[]} aFields - List of input fields to validate.
         * @returns {boolean} True if all fields are valid; false otherwise.
         */
        _validateFields: function (aFields) {
            let bValid = true;
            aFields.forEach((oField) => {
                const sValue = oField.getValue();
                oField.setValueState(sValue ? "None" : "Error");
                if (!sValue) bValid = false;
            });
            return bValid;
        }
    });
});
