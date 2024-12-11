
sap.ui.define([], function () {
    let csrfToken = null; // Variable to store the CSRF token
    let url = null; // Variable to store the OData URL

    return {
        // Generate and return the OData service URL based on the application component
        getOdataUrl: function (component) {
            const appId = component.getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModulePath = jQuery.sap.getModulePath(appPath);
            url = `${appModulePath}/odata/zfiori_invoice_typeSet`;
            console.log("URL generated and saved");
            return url;

        },
        // Set the CSRF token if the provided token is valid
        setToken: function (token) {
            if (token && typeof token === "string" && token.trim() !== "") {
                csrfToken = token;
                console.log("CSRF Token set successfully.");
            } else {
                console.warn("Invalid CSRF token. Token not set.");
            }
        },
        // Retrieve the current CSRF token, if available
        getToken: function () {
            if (!csrfToken) {
                console.warn("CSRF Token is not available. Please fetch it first.");
            }
            return csrfToken;
        },
        // Check if the CSRF token is available and valid
        hasToken: function () {
            return csrfToken !== null && csrfToken.trim() !== "";
        },
        // Clear the stored CSRF token
        clearToken: function () {
            csrfToken = null;
            console.log("CSRF Token cleared.");
        }
    };
});
