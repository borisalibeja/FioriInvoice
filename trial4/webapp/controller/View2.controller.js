 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
    
],
function (Controller, JSONModel, MessageBox, Filter, FilterOperator) {
    "use strict";
 
    return Controller.extend("trial4.controller.View2", {

        onInit: function () {
            // Attach route pattern matched to update the i18n model dynamically
            this.getOwnerComponent().getRouter()
                .getRoute("RouteView2") // Replace with the correct route name for this view
                .attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {
            // Refresh the i18n model when this route is matched
            let oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }
        },
        
        onPress: function()  {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },
    });
});
 
 
 
 
 