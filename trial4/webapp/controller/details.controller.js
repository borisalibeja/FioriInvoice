/**
 * @namespace trial4.controller
 * @class
 * Controller for the details view.
 * Handles navigation to details, data fetching for a specific customer, and model binding.
 */
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
       * Initializes the controller.
       * Attaches a pattern-matched event to handle route navigation to the details view.
       * @public
       */
      onInit: function () {
        this.getOwnerComponent()
          .getRouter()
          .getRoute("RouteDetails")
          .attachPatternMatched(this._onObjectMatched, this);
      },

      /**
       * Navigates back to the main view (RouteView1).
       * @public
       */
      onPress: function () {
        this.getOwnerComponent().getRouter().navTo("RouteView1");
      },

      /**
       * Handles the route pattern-matched event when navigating to the details view.
       * Fetches customer data for the specified `Invno` and binds it to the view.
       * @private
       * @param {sap.ui.base.Event} oEvent - Event triggered when the route pattern matches.
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
       * Fetches customer data for a specific `Invno` via an AJAX request.
       * @private
       * @param {string} sInvno - Customer ID for the record to fetch.
       * @returns {Promise<Object>} Resolves with customer data or rejects with an error message.
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
