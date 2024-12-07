sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
       formatSize:function(int){
           switch(int){
               case 1:
                   return "Large"
                   break;
               case 2:
                   return "Medium"
                   break;
               case 3:
                   return "Small"
                   break;
               default: 
                   return int
           }
       },

    };

});