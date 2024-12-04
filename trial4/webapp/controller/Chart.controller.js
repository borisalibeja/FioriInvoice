 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
    
],
function (Controller, JSONModel, MessageBox, Filter, FilterOperator) {
    "use strict";
 
    return Controller.extend("trial4.controller.Chart", {

        onInit: function () {
            // Attach route pattern matched to update the i18n model dynamically
            this.getOwnerComponent().getRouter()
                .getRoute("RouteChart")
                .attachPatternMatched(this._onRouteMatched, this);
            this._callToDB();
        },

        _onRouteMatched: function () {
            // Refresh the i18n model when this route is matched
            let oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }
        },

        onPress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onShowChart: function () {
            const fromDate = this.getView().byId("fromDate").getDateValue();
            const toDate = this.getView().byId("toDate").getDateValue();
            const timeDivision = this.getView().byId("timeDivisionDropdown").getSelectedKey();
            const oModel = this.getView().getModel("invoiceModel");

            if (!oModel) {
                MessageBox.error("Invoice model is not available. Please ensure data is loaded correctly.");
                return;
            }

            const oData = oModel.getData();
            if (!fromDate || !toDate || !timeDivision) {
                MessageBox.error("Please set all filters before submitting.");
                return;
            }

            // Filter data by date range
            const filteredData = oData.filter(item => {
                const invDate = new Date(item.Invdate);
                return invDate >= fromDate && invDate <= toDate;
            });

            if (filteredData.length === 0) {
                MessageBox.warning("No data available for the selected time frame.");
                return;
            }

            // Process data for the chart
            const chartData = this._generateChartData(filteredData, timeDivision);

            const salesChart = this.getView().byId("salesChart");
            if (!salesChart) {
                MessageBox.error("Sales Chart is not available. Please check the view definition.");
                return;
            }
            salesChart.removeAllColumns();

            chartData.forEach(segment => {
                salesChart.addColumn(new sap.suite.ui.microchart.ColumnMicroChartData({
                    label: segment.label,
                    value: segment.value,
                    color: segment.color
                }));
            });
        },

        _getAppModulePath: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            return jQuery.sap.getModulePath(appId.replaceAll(".", "/"));
        },

        _callToDB: function () {
            const appModulePath = this._getAppModulePath();
            const oModel = new JSONModel();

            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet`,
                type: "GET",
                dataType: "json",
                headers: { "X-CSRF-Token": "Fetch" },
                success: (data, textStatus, jqXHR) => {
                    const token = jqXHR.getResponseHeader("X-CSRF-Token");
                    CSRFTokenManager.setToken(token);
                    oModel.setData(data.d.results); // Store fetched data
                    this.getView().setModel(oModel, "invoiceModel");
                },
                error: (err) => {
                    MessageBox.error("Error loading data: " + err.statusText);
                }
            });
        },

        _generateChartData: function (data, division) {
            const chartSegments = 4;
            const segmentData = [];

            // Split data into 4 equal segments and calculate sales per segment
            const segmentDuration = Math.ceil(data.length / chartSegments);

            for (let i = 0; i < chartSegments; i++) {
                const segment = data.slice(i * segmentDuration, (i + 1) * segmentDuration);

                let label = `Segment ${i + 1}`;
                switch (division) {
                    case "day":
                        label = `Day ${i + 1}`;
                        break;
                    case "week":
                        label = `Week ${i + 1}`;
                        break;
                    case "month":
                        label = `Month ${i + 1}`;
                        break;
                    case "year":
                        label = `Year ${i + 1}`;
                        break;
                }

                segmentData.push({
                    label,
                    value: segment.length, // Total sales count in the segment
                    color: i % 2 === 0 ? "Good" : "Neutral" // Alternate colors
                });
            }

            return segmentData;
        }
    });
});
 
 
 
 
 