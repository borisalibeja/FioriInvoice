sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/Device", "trial4/model/models"],
  function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("trial4.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // Retrieve stored language or default to English
        let sLanguageCode = localStorage.getItem("selectedLanguage") || "en";

        // Set the i18n model globally
        let oResourceModel = new sap.ui.model.resource.ResourceModel({
          bundleName: "trial4.i18n.i18n",
          bundleLocale: sLanguageCode,
        });
        sap.ui.getCore().setModel(oResourceModel, "i18n");
        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(models.createDeviceModel(), "device");
      },
    });
  }
);
