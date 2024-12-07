/**
 * @namespace trial4.controller
 * @class
 * Main application controller.
 * Handles global application-level initialization and setup logic.
 */
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (BaseController) {
  "use strict";

  return BaseController.extend("trial4.controller.App", {
      /**
       * Called when the application controller is initialized.
       * This method can be used for global setup tasks.
       * @public
       */
      onInit: function () {
        
          // Application-level initialization logic can be added here if needed.
      }
  });
});
