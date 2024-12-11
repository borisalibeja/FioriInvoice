sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "trial4/utils/DataManager",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
  ],
  function (Controller, DataManager, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("trial4.controller.details", {
      /**
       * Initializes the controller by setting up route matching to handle dynamic data loading.
       */
      onInit: function () {
        this.getOwnerComponent()
          .getRouter()
          .getRoute("RouteDetails")
          .attachPatternMatched(this._onObjectMatched, this);
      },
      /**
       * Navigates back to the main view when the user presses the back button.
       */
      onPress: function () {
        this.getOwnerComponent().getRouter().navTo("RouteView1");
      },
      /**
       * Handles route matching to fetch and bind customer details for the specified invoice number.
       */
      _onObjectMatched: function (oEvent) {
        const sInvno = oEvent.getParameter("arguments").Invno;

        // Refresh the i18n model for this view
        const oResourceModel = sap.ui.getCore().getModel("i18n");
        if (oResourceModel) {
          this.getView().setModel(oResourceModel, "i18n");
        }

        // Fetch and bind data for the specified customer
        this._fetchCustomerData(sInvno)
          .then((data) => {
            const oModel = new JSONModel(data);
            this.getView().setModel(oModel, "detailsModel");
          })
          .catch((err) => {
            MessageBox.error(err.message);
          });
      },

      /**
       * Fetches customer data for the specified invoice number from the OData service.
       */
      _fetchCustomerData: function (sInvno) {
        const url = DataManager.getOdataUrl(this.getOwnerComponent());

        return new Promise((resolve, reject) => {
          $.ajax({
            url: `${url}(Invno='${sInvno}')`,
            type: "GET",
            dataType: "json",
            success: (data) => {
              if (data && data.d) {
                resolve(data.d);
              } else {
                reject(new Error("No data found for the specified Invno"));
              }
            },
            error: (err) => {
              reject(new Error("Error fetching data: " + err.statusText));
            },
          });
        });
      },
    });
  }
);
