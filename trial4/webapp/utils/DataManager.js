/**
 * @namespace trial4.utils
 * @module DataManager
 * A utility module for managing the CSRF token used in OData requests.
 */
sap.ui.define([], function () {
    let csrfToken = null;
    let url = null;

    return {
        /**
         * Generates the base invoice URL dynamically based on the application's module path and saves it.
         * @param {sap.ui.core.Component} component - The SAPUI5 component instance to access the manifest.
         * @returns {string} - The dynamically constructed base invoice URL.
         * @public
         */
        getOdataUrl: function (component) {
            const appId = component.getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModulePath = jQuery.sap.getModulePath(appPath);
            url = `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet`;
            console.log("URL generated and saved:", url);
            return url;

        },
        /**
         * Sets the CSRF token.
         * Validates the provided token before setting it.
         * @param {string} token - The CSRF token to set.
         * @public
         */
        setToken: function (token) {
            if (token && typeof token === "string" && token.trim() !== "") {
                csrfToken = token;
                console.log("CSRF Token set successfully.");
            } else {
                console.warn("Invalid CSRF token. Token not set.");
            }
        },

        /**
         * Retrieves the current CSRF token.
         * Logs a warning if the token is not available.
         * @returns {string|null} The current CSRF token or null if not set.
         * @public
         */
        getToken: function () {
            if (!csrfToken) {
                console.warn("CSRF Token is not available. Please fetch it first.");
            }
            return csrfToken;
        },

        /**
         * Checks if a valid CSRF token is available.
         * @returns {boolean} True if a valid token exists; false otherwise.
         * @public
         */
        hasToken: function () {
            return csrfToken !== null && csrfToken.trim() !== "";
        },

        /**
         * Clears the current CSRF token.
         * Resets the token to null.
         * @public
         */
        clearToken: function () {
            csrfToken = null;
            console.log("CSRF Token cleared.");
        }
    };
});
