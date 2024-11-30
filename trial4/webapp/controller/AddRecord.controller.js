/**
 * @namespace trial4.controller
 * @class
 * Controller for adding a new record.
 * Handles form validation, record submission via OData, and navigation.
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "trial4/utils/CSRFTokenManager",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, CSRFTokenManager, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("trial4.controller.AddRecord", {

        /**
         * Handles the save operation for adding a new record.
         * Validates input fields, retrieves the CSRF token, and sends a POST request.
         * On success, clears the inputs, navigates back, and publishes an event.
         * @public
         */
        onSave: function () {
            const csrfToken = CSRFTokenManager.getToken();

            if (!csrfToken) {
                MessageBox.error("CSRF token is not available. Please fetch it first.");
                return;
            }

            const oView = this.getView();
            const aRequiredFields = this._getRequiredFields();

            // Validate required fields
            if (!this._validateFields(aRequiredFields)) {
                MessageBox.error("Please fill all required fields.");
                return;
            }

            const oNewRecordData = this._getRecordData();
            const appModulePath = this._getAppModulePath();

            // Send POST request to add the new record
            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet`,
                type: "POST",
                contentType: "application/json",
                headers: { "X-CSRF-Token": csrfToken },
                data: JSON.stringify(oNewRecordData),
                success: () => {
                    MessageToast.show("Record added successfully!");
                    this._clearInputs();
                    sap.ui.getCore().getEventBus().publish("dataChannel", "dataUpdated");
                    this.getOwnerComponent().getRouter().navTo("RouteView1");
                },
                error: (err) => {
                    MessageBox.error("Failed to add record: " + err.statusText);
                }
            });
        },

        /**
         * Retrieves an array of required input fields.
         * @private
         * @returns {sap.ui.core.Control[]} List of required input fields.
         */
        _getRequiredFields: function () {
            const oView = this.getView();
            return [
                oView.byId("_IDGenInput"),  // Date 
                oView.byId("_IDGenInput2"), // Customer Name
                oView.byId("_IDGenInput3"), // 1st Product
                oView.byId("_IDGenInput8"), // Net Value
                oView.byId("_IDGenInput9"), // Vat value
                oView.byId("_IDGenInput11")  // Currency
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
        },

        /**
         * Retrieves the form data for the new record.
         * @private
         * @returns {Object} Data object for the new record.
         */
        _getRecordData: function () {
            const oView = this.getView();
            return {
                Invdate: oView.byId("_IDGenInput").getValue(),
                Invdes: oView.byId("_IDGenInput1").getValue(),
                Csname: oView.byId("_IDGenInput2").getValue(),
                Prod1: oView.byId("_IDGenInput3").getValue(),
                Prod2: oView.byId("_IDGenInput4").getValue(),
                Prod3: oView.byId("_IDGenInput5").getValue(),
                Prod4: oView.byId("_IDGenInput6").getValue(),
                Prod5: oView.byId("_IDGenInput7").getValue(),
                Net: oView.byId("_IDGenInput8").getValue(),
                Vat: oView.byId("_IDGenInput9").getValue(),
                Gross: oView.byId("_IDGenInput10").getValue(),
                Curr: oView.byId("_IDGenInput11").getValue()
            };
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
         * Clears all input fields in the view.
         * @private
         */
        _clearInputs: function () {
            const aInputIds = [
                "_IDGenInput", "_IDGenInput1", "_IDGenInput2", "_IDGenInput3",
                "_IDGenInput4", "_IDGenInput5", "_IDGenInput6", "_IDGenInput7", "_IDGenInput8",
                "_IDGenInput9", "_IDGenInput10", "_IDGenInput11"
            ];
            aInputIds.forEach((sId) => this.byId(sId).setValue(""));
        },

        /**
         * Navigates back to the main view without saving.
         * @public
         */
        onCancel: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        }
    });
});
