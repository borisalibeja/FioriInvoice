sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "trial4/utils/DataManager",
    "trial4/model/formatter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (Controller, DataManager, formatter, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("trial4.controller.AddRecord", {
      formatter: formatter,
      /**
       * Initializes the controller by attaching route pattern matching,
       * dynamically updating the i18n model, and setting up the currency model.
       */
      onInit: function () {
        // Attach route pattern matched to update the i18n model dynamically
        this.getOwnerComponent()
          .getRouter()
          .getRoute("RouteAddRecord")
          .attachPatternMatched(this._onRouteMatched, this);

        // Load currency data from JSON file
        const oCurrencyModel = new sap.ui.model.json.JSONModel();
        oCurrencyModel.loadData("model/currency.json");
        this.getView().setModel(oCurrencyModel, "currencyModel");

        const oDatePicker = this.byId("_IDGenDatePicker");
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize time to midnight
        oDatePicker.setMinDate(today); // Programmatically set the minDate
      },
      /**
       * Handles route matching to refresh the i18n model when the route is matched.
       */
      _onRouteMatched: function () {
        // Refresh the i18n model when this route is matched
        let oResourceModel = sap.ui.getCore().getModel("i18n");
        if (oResourceModel) {
          this.getView().setModel(oResourceModel, "i18n");
        }
      },
      /**
       * Saves a new record by validating required fields and sending a POST request.
       * Updates the view and navigates to another route upon success.
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
            sap.ui
              .getCore()
              .getEventBus()
              .publish("dataChannel", "dataUpdated");
            this.getOwnerComponent().getRouter().navTo("RouteView1");
          },
          error: (err) => {
            MessageBox.error("Failed to add record: " + err.statusText);
          },
        });
      },

      _getRequiredFields: function () {
        const oView = this.getView();
        return [
          oView.byId("_IDGenDatePicker"), // Date
          oView.byId("_IDGenInput2"), // Customer Name
          oView.byId("_IDGenInput3"), // 1st Product
          oView.byId("_IDGenInput8"), // Net Value
          oView.byId("_IDGenInput9"), // Vat value
          oView.byId("_IDGenInput11"), // Currency
        ];
      },

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
       * Function for fetching the input data
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
          Curr: oView.byId("_IDGenInput11").getSelectedKey(),
        };
      },
      /**
       * Function to clear all the inputs after on save or on cancel action
       */

      _clearInputs: function () {
        const aInputIds = [
          "_IDGenDatePicker",
          "_IDGenInput1",
          "_IDGenInput2",
          "_IDGenInput3",
          "_IDGenInput4",
          "_IDGenInput5",
          "_IDGenInput6",
          "_IDGenInput7",
          "_IDGenInput8",
          "_IDGenInput9",
          "_IDGenInput10",
          "_IDGenInput11",
        ];
        aInputIds.forEach((sId) => this.byId(sId).setValue(""));
      },
      /**
       * Dynamically recalculates and updates the gross value based on net and VAT values.
       */
      onValueChange: function () {
        const oView = this.getView();
        const net = parseFloat(oView.byId("_IDGenInput8").getValue()) || 0; // Net Value
        const vat = parseFloat(oView.byId("_IDGenInput9").getValue()) || 0; // VAT Value
        const gross = net + vat; // Calculate Gross Value

        // Update Gross field
        oView.byId("_IDGenInput10").setValue(gross.toFixed(2));
      },
      /**
       * Handles cancel action by navigating back to the main view.
       */
      onCancel: function () {
        this.getOwnerComponent().getRouter().navTo("RouteView1");
      },
    });
  }
);
