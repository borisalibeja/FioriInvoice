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
        /**
         * Returns today's date to set as the minimum date for DatePicker
         */
        todayDate: function () {
            const today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }
    };

});