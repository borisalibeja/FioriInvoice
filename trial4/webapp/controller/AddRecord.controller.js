/**
 * @namespace trial4.controller
 * @class
 * Controller for adding a new record.
 * Handles form validation, record submission via OData, and navigation.
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "trial4/utils/DataManager",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "trial4/model/formatter"
], function (Controller, DataManager, MessageBox, MessageToast, formatter) {
    "use strict";

    return Controller.extend("trial4.controller.AddRecord", {
        formatter: formatter,
        
        onInit: function () {
            // Attach route pattern matched to update the i18n model dynamically
            this.getOwnerComponent().getRouter()
                .getRoute("RouteAddRecord") // Replace with the correct route name for this view
                .attachPatternMatched(this._onRouteMatched, this);

            // Load currency data from JSON file
            const oCurrencyModel = new sap.ui.model.json.JSONModel();
            oCurrencyModel.loadData("model/currency.json");
            this.getView().setModel(oCurrencyModel, "currencyModel");
        },
        _onRouteMatched: function () {
            // Refresh the i18n model when this route is matched
            let oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }
        },

        /**
         * Handles the save operation for adding a new record.
         * Validates input fields, retrieves the CSRF token, and sends a POST request.
         * On success, clears the inputs, navigates back, and publishes an event.
         * @public
         */
        onSave: function () {
            const url = DataManager.getOdataUrl(this.getOwnerComponent());
            const csrfToken = DataManager.getToken();
            const aRequiredFields = this._getRequiredFields();
            const oNewRecordData = this._getRecordData();

            // Validate required fields
            if (!this._validateFields(aRequiredFields)) {
                MessageBox.error("Please fill all required fields.");
                return;
            }

            // Send POST request to add the new record
            $.ajax({
                url: url,
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
                oView.byId("_IDGenDatePicker"),  // Date 
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
            const net = parseFloat(oView.byId("_IDGenInput8").getValue()) || 0; // Net Value
            const vat = parseFloat(oView.byId("_IDGenInput9").getValue()) || 0; // VAT Value
            const gross = net + vat; // Calculate Gross Value
        
            // Set the calculated gross value in the Gross field
            oView.byId("_IDGenInput10").setValue(gross);
            return {
                Invdate: oView.byId("_IDGenDatePicker").getValue(),
                Invdes: oView.byId("_IDGenInput1").getValue(),
                Csname: oView.byId("_IDGenInput2").getValue(),
                Prod1: oView.byId("_IDGenInput3").getValue(),
                Prod2: oView.byId("_IDGenInput4").getValue(),
                Prod3: oView.byId("_IDGenInput5").getValue(),
                Prod4: oView.byId("_IDGenInput6").getValue(),
                Prod5: oView.byId("_IDGenInput7").getValue(),
                Net: net.toFixed(2),
                Vat: vat.toFixed(2),
                Gross: gross.toFixed(2),
                Curr: oView.byId("_IDGenInput11").getSelectedKey()
            };
        },

        /**
         * Clears all input fields in the view.
         * @private
         */
        _clearInputs: function () {
            const aInputIds = [
                "_IDGenDatePicker", "_IDGenInput1", "_IDGenInput2", "_IDGenInput3",
                "_IDGenInput4", "_IDGenInput5", "_IDGenInput6", "_IDGenInput7", "_IDGenInput8",
                "_IDGenInput9", "_IDGenInput10", "_IDGenInput11"
            ];
            aInputIds.forEach((sId) => this.byId(sId).setValue(""));
        },
        onValueChange: function () {
            const oView = this.getView();
            const net = parseFloat(oView.byId("_IDGenInput8").getValue()) || 0; // Net Value
            const vat = parseFloat(oView.byId("_IDGenInput9").getValue()) || 0; // VAT Value
            const gross = net + vat; // Calculate Gross Value
        
            // Update Gross field
            oView.byId("_IDGenInput10").setValue(gross.toFixed(2));
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
